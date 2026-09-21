"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useWorkBoard } from "@/lib/context/WorkBoardContext";
import type { DashboardWidgetId } from "@/types";
import {
  X,
  BarChart3,
  PieChart,
  Activity,
  TrendingUp,
  Check,
  Plus,
  LayoutDashboard,
  CheckCircle2,
} from "lucide-react";

export function CreateDashboardModal() {
  const router = useRouter();
  const { isCreateDashboardOpen, closeCreateDashboardModal, workspace, createDashboard } =
    useWorkBoard();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [selectedWidgets, setSelectedWidgets] = useState<DashboardWidgetId[]>([
    "kpis",
    "distribution",
    "workload",
    "trend",
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isCreateDashboardOpen) return null;

  const WIDGET_OPTIONS: { id: DashboardWidgetId; title: string; desc: string; icon: any }[] = [
    {
      id: "kpis",
      title: "KPI Counter Cards",
      desc: "Total Tasks, Completed, In Progress, Overdue metrics",
      icon: Activity,
    },
    {
      id: "distribution",
      title: "Task Status Breakdown",
      desc: "Donut chart of items by workflow stage + priority",
      icon: PieChart,
    },
    {
      id: "workload",
      title: "Team Workload & Capacity",
      desc: "Assigned tasks per member across all boards",
      icon: BarChart3,
    },
    {
      id: "trend",
      title: "Completion Trend",
      desc: "Tasks created vs. completed over the last 14 days",
      icon: TrendingUp,
    },
  ];

  const toggleWidget = (id: DashboardWidgetId) => {
    setSelectedWidgets((prev) =>
      prev.includes(id) ? prev.filter((w) => w !== id) : [...prev, id]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || isSubmitting) return;

    setError(null);
    setIsSubmitting(true);
    try {
      const dashboard = await createDashboard({
        name: name.trim(),
        description: description.trim(),
        widgets: selectedWidgets,
      });
      setShowSuccess(true);
      setTimeout(() => {
        setShowSuccess(false);
        setIsSubmitting(false);
        setName("");
        setDescription("");
        closeCreateDashboardModal();
        router.push(`/workspace/${workspace.id}/dashboard/${dashboard.id}`);
      }, 700);
    } catch (err: any) {
      setError(err.message || "Failed to create dashboard.");
      setIsSubmitting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Create Dashboard View"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/70 backdrop-blur-xs animate-in fade-in duration-150"
    >
      <div
        className="fixed inset-0"
        onClick={closeCreateDashboardModal}
        aria-hidden="true"
      />

      <div className="relative w-full max-w-lg rounded-2xl border border-zinc-700/80 bg-[#1c1e28] text-zinc-100 shadow-2xl overflow-hidden z-10 animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 bg-[#161720]">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-purple-500/15 text-purple-400 border border-purple-500/30">
              <LayoutDashboard className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-tight">
                Create Dashboard View
              </h3>
              <p className="text-[11px] text-zinc-400">
                Custom reporting view with live team analytics
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={closeCreateDashboardModal}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-400 hover:bg-zinc-800 hover:text-white transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {showSuccess ? (
          <div className="p-10 flex flex-col items-center justify-center text-center space-y-3 animate-in zoom-in-95">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <h4 className="text-base font-bold text-white">Dashboard Created!</h4>
            <p className="text-xs text-zinc-400">Redirecting to overview...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-300">
                Dashboard View Title <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                autoFocus
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Executive KPI Summary, Sprint Performance"
                className="w-full rounded-xl border border-zinc-700 bg-zinc-900/90 px-3.5 py-2.5 text-xs text-white placeholder:text-zinc-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500/50"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-300">
                Description <span className="text-zinc-500">(Optional)</span>
              </label>
              <textarea
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Summary or purpose of this reporting view"
                className="w-full rounded-xl border border-zinc-700 bg-zinc-900/90 px-3.5 py-2 text-xs text-white placeholder:text-zinc-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500/50 resize-none"
              />
            </div>

            {/* Widget Selection */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-300">
                Included Analytics Widgets
              </label>
              <div className="space-y-2">
                {WIDGET_OPTIONS.map((widget) => {
                  const isChecked = selectedWidgets.includes(widget.id);
                  const Icon = widget.icon;
                  return (
                    <button
                      key={widget.id}
                      type="button"
                      onClick={() => toggleWidget(widget.id)}
                      className={`w-full flex items-center justify-between p-3 rounded-xl border text-left transition-all ${
                        isChecked
                          ? "border-purple-500/80 bg-purple-500/10 text-white"
                          : "border-zinc-700/80 bg-zinc-900/40 text-zinc-400 hover:bg-zinc-800"
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                            isChecked
                              ? "bg-purple-500/20 text-purple-400"
                              : "bg-zinc-800 text-zinc-500"
                          }`}
                        >
                          <Icon className="h-4 w-4" />
                        </div>
                        <div>
                          <div className="text-xs font-bold text-zinc-200">
                            {widget.title}
                          </div>
                          <div className="text-[10px] text-zinc-400 truncate">
                            {widget.desc}
                          </div>
                        </div>
                      </div>
                      <div
                        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition-colors ${
                          isChecked
                            ? "bg-purple-600 border-purple-500 text-white"
                            : "border-zinc-700 bg-zinc-800"
                        }`}
                      >
                        {isChecked && <Check className="h-3 w-3 stroke-[3]" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {error && <p className="text-xs text-rose-400">{error}</p>}

            {/* Action Buttons */}
            <div className="pt-3 flex items-center justify-end gap-2 border-t border-zinc-800">
              <button
                type="button"
                onClick={closeCreateDashboardModal}
                className="px-4 py-2 rounded-xl text-xs font-medium text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!name.trim() || isSubmitting}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-purple-600 hover:bg-purple-500 text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>{isSubmitting ? "Creating..." : "Create Dashboard"}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
