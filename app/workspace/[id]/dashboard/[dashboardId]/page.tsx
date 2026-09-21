"use client";

import React, { useMemo } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useWorkBoard } from "@/lib/context/WorkBoardContext";
import { TASK_STATUS_CONFIG, TASK_PRIORITY_CONFIG, TaskStatus, TaskPriority } from "@/types";
import { isOverdue } from "@/lib/utils/date";
import {
  ArrowLeft,
  Trash2,
  LayoutDashboard,
  ListChecks,
  CheckCircle2,
  Loader2,
  AlertTriangle,
  Users,
} from "lucide-react";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  AreaChart,
  Area,
  Legend,
} from "recharts";

const PRIORITY_HEX: Record<TaskPriority, string> = {
  urgent: "#dc2626",
  high: "#ea580c",
  medium: "#2563eb",
  low: "#059669",
  none: "#52525b",
};

const TOOLTIP_STYLE = {
  background: "#1c1e28",
  border: "1px solid #3f3f46",
  borderRadius: 10,
  fontSize: 12,
  color: "#f4f4f5",
};

function toDateKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

// Bar/Pie slices below color themselves per-entry via <Cell>, which recharts'
// default Tooltip doesn't pick up — it falls back to a generic "value" label
// and an unrelated swatch color. This reads the color and name straight off
// each entry's own data instead, so the tooltip always matches what's on screen.
function ColoredEntryTooltip({ active, payload, label, unit = "tasks" }: any) {
  if (!active || !payload || payload.length === 0) return null;
  const entry = payload[0];
  const color = entry.payload?.color || entry.color || entry.fill;
  const name = entry.payload?.name ?? entry.name ?? label;
  return (
    <div
      style={TOOLTIP_STYLE}
      className="px-3 py-2 flex items-center gap-2"
    >
      <span
        className="h-2.5 w-2.5 rounded-full shrink-0"
        style={{ backgroundColor: color }}
      />
      <span className="font-semibold text-white">{name}</span>
      <span className="text-zinc-400">
        {entry.value} {unit}
      </span>
    </div>
  );
}

export default function DashboardPage() {
  const params = useParams();
  const router = useRouter();
  const rawWsId = params?.id;
  const rawDashId = params?.dashboardId;
  const workspaceId = Array.isArray(rawWsId) ? rawWsId[0] : (rawWsId as string);
  const dashboardId = Array.isArray(rawDashId) ? rawDashId[0] : (rawDashId as string);

  const { workspaces, workspace, boards, tasks, users, dashboards, deleteDashboard } =
    useWorkBoard();

  const currentWs = workspaces.find((w) => w.id === workspaceId) || workspace;
  const dashboard = dashboards.find((d) => d.id === dashboardId);

  const workspaceBoards = useMemo(
    () => boards.filter((b) => b.workspaceId === workspaceId),
    [boards, workspaceId]
  );
  const workspaceBoardIds = useMemo(
    () => new Set(workspaceBoards.map((b) => b.id)),
    [workspaceBoards]
  );
  const workspaceTasks = useMemo(
    () => tasks.filter((t) => workspaceBoardIds.has(t.boardId) && !t.isArchived),
    [tasks, workspaceBoardIds]
  );

  const kpis = useMemo(() => {
    const total = workspaceTasks.length;
    const completed = workspaceTasks.filter(
      (t) => t.status === "done" || t.status === "approved"
    ).length;
    const inProgress = workspaceTasks.filter(
      (t) => t.status === "in_progress" || t.status === "in_review"
    ).length;
    const overdue = workspaceTasks.filter((t) => isOverdue(t.dueDate, t.status)).length;
    const members = currentWs.members?.length || 0;
    return { total, completed, inProgress, overdue, members };
  }, [workspaceTasks, currentWs.members]);

  const statusDistribution = useMemo(() => {
    const counts = new Map<TaskStatus, number>();
    workspaceTasks.forEach((t) => counts.set(t.status, (counts.get(t.status) || 0) + 1));
    return Array.from(counts.entries())
      .map(([status, count]) => ({
        name: TASK_STATUS_CONFIG[status]?.label || status,
        value: count,
        color: TASK_STATUS_CONFIG[status]?.barColor || "#52525b",
      }))
      .sort((a, b) => b.value - a.value);
  }, [workspaceTasks]);

  const priorityBreakdown = useMemo(() => {
    const counts = new Map<TaskPriority, number>();
    workspaceTasks.forEach((t) => counts.set(t.priority, (counts.get(t.priority) || 0) + 1));
    const order: TaskPriority[] = ["urgent", "high", "medium", "low", "none"];
    return order
      .filter((p) => counts.has(p))
      .map((p) => ({
        name: TASK_PRIORITY_CONFIG[p].label,
        value: counts.get(p) || 0,
        color: PRIORITY_HEX[p],
      }));
  }, [workspaceTasks]);

  const workload = useMemo(() => {
    const rows = (currentWs.members || []).map((m) => {
      const user = users.find((u) => u.id === m.userId);
      const assigned = workspaceTasks.filter((t) => t.assigneeIds.includes(m.userId));
      const completed = assigned.filter((t) => t.status === "done" || t.status === "approved");
      const overdue = assigned.filter((t) => isOverdue(t.dueDate, t.status));
      return {
        userId: m.userId,
        name: user?.name || "Unknown",
        avatarInitials: user?.avatarInitials || "?",
        avatarColor: user?.avatarColor || "bg-zinc-600",
        assigned: assigned.length,
        completed: completed.length,
        overdue: overdue.length,
      };
    });
    return rows.sort((a, b) => b.assigned - a.assigned);
  }, [currentWs.members, users, workspaceTasks]);

  const trend = useMemo(() => {
    const days: { key: string; label: string; created: number; completed: number }[] = [];
    for (let i = 13; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      days.push({
        key: toDateKey(d),
        label: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        created: 0,
        completed: 0,
      });
    }
    const byKey = new Map(days.map((d) => [d.key, d]));
    workspaceTasks.forEach((t) => {
      const createdEntry = byKey.get(toDateKey(new Date(t.createdAt)));
      if (createdEntry) createdEntry.created += 1;
      if (t.status === "done" || t.status === "approved") {
        const completedEntry = byKey.get(toDateKey(new Date(t.updatedAt)));
        if (completedEntry) completedEntry.completed += 1;
      }
    });
    return days;
  }, [workspaceTasks]);

  const handleDelete = () => {
    if (!dashboard) return;
    if (!confirm(`Delete dashboard "${dashboard.name}"? This can't be undone.`)) return;
    deleteDashboard(dashboard.id);
    router.push(`/workspace/${workspaceId}?tab=posts`);
  };

  if (!dashboard) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-24 text-center gap-3">
        <LayoutDashboard className="h-10 w-10 text-zinc-600" />
        <p className="text-sm font-semibold text-zinc-300">Dashboard not found</p>
        <p className="text-xs text-zinc-500">It may have been deleted.</p>
        <Link
          href={`/workspace/${workspaceId}`}
          className="mt-2 inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#0073ea] hover:bg-[#0060c0] text-white text-xs font-semibold transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Back to {currentWs.name}</span>
        </Link>
      </div>
    );
  }

  const showWidget = (id: string) => dashboard.widgets.includes(id as any);

  return (
    <div className="px-6 sm:px-10 lg:px-16 py-6 max-w-[1400px] mx-auto w-full space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-zinc-800">
        <div className="flex items-start gap-3 min-w-0">
          <Link
            href={`/workspace/${workspaceId}`}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-zinc-700 text-zinc-400 hover:bg-zinc-800 hover:text-white transition-colors mt-0.5"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-purple-500/15 text-purple-400">
                <LayoutDashboard className="h-3.5 w-3.5" />
              </div>
              <h1 className="text-lg font-bold text-white truncate">{dashboard.name}</h1>
            </div>
            <p className="text-xs text-zinc-500 mt-0.5">
              {dashboard.description || `Live analytics for ${currentWs.name}`}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={handleDelete}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-zinc-700 text-zinc-400 hover:text-rose-400 hover:border-rose-500/40 hover:bg-rose-500/10 text-xs font-medium transition-colors self-start sm:self-center shrink-0"
        >
          <Trash2 className="h-3.5 w-3.5" />
          <span>Delete Dashboard</span>
        </button>
      </div>

      {workspaceTasks.length === 0 ? (
        <div className="py-20 text-center rounded-2xl border border-dashed border-zinc-800 space-y-2">
          <LayoutDashboard className="h-8 w-8 text-zinc-600 mx-auto" />
          <p className="text-sm font-semibold text-zinc-300">No data yet</p>
          <p className="text-xs text-zinc-500">
            Once {currentWs.name} has boards with tasks, this report fills in automatically.
          </p>
        </div>
      ) : (
        <>
          {/* KPI Cards */}
          {showWidget("kpis") && (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              {[
                {
                  label: "Total Tasks",
                  value: kpis.total,
                  icon: ListChecks,
                  color: "text-blue-400 bg-blue-500/10",
                },
                {
                  label: "Completed",
                  value: kpis.completed,
                  icon: CheckCircle2,
                  color: "text-emerald-400 bg-emerald-500/10",
                },
                {
                  label: "In Progress",
                  value: kpis.inProgress,
                  icon: Loader2,
                  color: "text-amber-400 bg-amber-500/10",
                },
                {
                  label: "Overdue",
                  value: kpis.overdue,
                  icon: AlertTriangle,
                  color: "text-rose-400 bg-rose-500/10",
                },
                {
                  label: "Members",
                  value: kpis.members,
                  icon: Users,
                  color: "text-indigo-400 bg-indigo-500/10",
                },
              ].map((kpi) => (
                <div
                  key={kpi.label}
                  className="rounded-2xl border border-zinc-800 bg-[#1a1b1e] p-4 space-y-2"
                >
                  <div
                    className={`flex h-8 w-8 items-center justify-center rounded-lg ${kpi.color}`}
                  >
                    <kpi.icon className="h-4 w-4" />
                  </div>
                  <p className="text-2xl font-bold text-white tabular-nums">{kpi.value}</p>
                  <p className="text-[11px] text-zinc-500 font-medium">{kpi.label}</p>
                </div>
              ))}
            </div>
          )}

          {/* Distribution: Status donut + Priority bar */}
          {showWidget("distribution") && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="rounded-2xl border border-zinc-800 bg-[#1a1b1e] p-5">
                <h3 className="text-xs font-bold text-zinc-300 uppercase tracking-wider mb-4">
                  Status Breakdown
                </h3>
                <div className="flex items-center gap-4">
                  <div className="h-52 w-1/2 min-w-0">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={statusDistribution}
                          dataKey="value"
                          nameKey="name"
                          innerRadius="55%"
                          outerRadius="85%"
                          paddingAngle={2}
                        >
                          {statusDistribution.map((entry, i) => (
                            <Cell key={i} fill={entry.color} stroke="none" />
                          ))}
                        </Pie>
                        <Tooltip content={<ColoredEntryTooltip unit="tasks" />} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex-1 space-y-1.5 min-w-0">
                    {statusDistribution.map((s) => (
                      <div key={s.name} className="flex items-center justify-between gap-2 text-xs">
                        <span className="flex items-center gap-1.5 min-w-0 text-zinc-300">
                          <span
                            className="h-2 w-2 rounded-full shrink-0"
                            style={{ backgroundColor: s.color }}
                          />
                          <span className="truncate">{s.name}</span>
                        </span>
                        <span className="text-zinc-500 font-semibold shrink-0">{s.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-zinc-800 bg-[#1a1b1e] p-5">
                <h3 className="text-xs font-bold text-zinc-300 uppercase tracking-wider mb-4">
                  Priority Breakdown
                </h3>
                <div className="h-52">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={priorityBreakdown} layout="vertical" margin={{ left: 8 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#27272a" horizontal={false} />
                      <XAxis type="number" tick={{ fill: "#71717a", fontSize: 11 }} allowDecimals={false} />
                      <YAxis
                        type="category"
                        dataKey="name"
                        width={70}
                        tick={{ fill: "#a1a1aa", fontSize: 11 }}
                      />
                      <Tooltip content={<ColoredEntryTooltip unit="tasks" />} cursor={{ fill: "#27272a" }} />
                      <Bar dataKey="value" name="Tasks" radius={[0, 6, 6, 0]}>
                        {priorityBreakdown.map((entry, i) => (
                          <Cell key={i} fill={entry.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}

          {/* Workload */}
          {showWidget("workload") && (
            <div className="rounded-2xl border border-zinc-800 bg-[#1a1b1e] p-5">
              <h3 className="text-xs font-bold text-zinc-300 uppercase tracking-wider mb-4">
                Team Workload
              </h3>
              {workload.length === 0 ? (
                <p className="text-xs text-zinc-500 py-6 text-center">No members in this workspace yet.</p>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={workload} layout="vertical" margin={{ left: 8 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#27272a" horizontal={false} />
                        <XAxis type="number" tick={{ fill: "#71717a", fontSize: 11 }} allowDecimals={false} />
                        <YAxis
                          type="category"
                          dataKey="name"
                          width={90}
                          tick={{ fill: "#a1a1aa", fontSize: 11 }}
                        />
                        <Tooltip contentStyle={TOOLTIP_STYLE} cursor={{ fill: "#27272a" }} />
                        <Bar dataKey="assigned" name="Assigned" fill="#0073ea" radius={[0, 6, 6, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="text-left text-zinc-500 border-b border-zinc-800">
                          <th className="font-medium pb-2">Member</th>
                          <th className="font-medium pb-2 text-right">Assigned</th>
                          <th className="font-medium pb-2 text-right">Done</th>
                          <th className="font-medium pb-2 text-right">Overdue</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-800/60">
                        {workload.map((row) => (
                          <tr key={row.userId}>
                            <td className="py-2">
                              <div className="flex items-center gap-2">
                                <span
                                  className={`flex h-5 w-5 items-center justify-center rounded-full text-[9px] font-bold text-white ${row.avatarColor}`}
                                >
                                  {row.avatarInitials}
                                </span>
                                <span className="text-zinc-200 truncate">{row.name}</span>
                              </div>
                            </td>
                            <td className="py-2 text-right text-zinc-300 tabular-nums">{row.assigned}</td>
                            <td className="py-2 text-right text-emerald-400 tabular-nums">{row.completed}</td>
                            <td className="py-2 text-right tabular-nums">
                              <span className={row.overdue > 0 ? "text-rose-400 font-semibold" : "text-zinc-500"}>
                                {row.overdue}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Trend */}
          {showWidget("trend") && (
            <div className="rounded-2xl border border-zinc-800 bg-[#1a1b1e] p-5">
              <h3 className="text-xs font-bold text-zinc-300 uppercase tracking-wider mb-1">
                Completion Trend (Last 14 Days)
              </h3>
              <p className="text-[10px] text-zinc-500 mb-4">
                "Completed" reflects each task's last-updated date, not a separate completion timestamp.
              </p>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={trend} margin={{ left: -20 }}>
                    <defs>
                      <linearGradient id="createdGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#0073ea" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#0073ea" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="completedGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#00c875" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#00c875" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                    <XAxis dataKey="label" tick={{ fill: "#71717a", fontSize: 10 }} interval={1} />
                    <YAxis tick={{ fill: "#71717a", fontSize: 11 }} allowDecimals={false} />
                    <Tooltip contentStyle={TOOLTIP_STYLE} />
                    <Legend wrapperStyle={{ fontSize: 11, color: "#a1a1aa" }} />
                    <Area
                      type="monotone"
                      dataKey="created"
                      name="Created"
                      stroke="#0073ea"
                      fill="url(#createdGradient)"
                      strokeWidth={2}
                    />
                    <Area
                      type="monotone"
                      dataKey="completed"
                      name="Completed"
                      stroke="#00c875"
                      fill="url(#completedGradient)"
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
