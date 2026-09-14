import React from "react";
import { CheckCircle2, Clock, TrendingUp, AlertTriangle } from "lucide-react";

interface StatCardProps {
  label: string;
  value: number;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
  description?: string;
}

function StatCard({ label, value, icon, color, bgColor, description }: StatCardProps) {
  return (
    <div className="flex flex-col justify-between rounded-xl border border-border bg-card p-4 gap-3">
      <div className="flex items-start justify-between">
        <p className="text-xs font-medium text-muted-foreground">{label}</p>
        <div className={`flex h-7 w-7 items-center justify-center rounded-lg ${bgColor}`}>
          <span className={color}>{icon}</span>
        </div>
      </div>
      <div>
        <p className="text-2xl font-bold text-foreground tabular-nums tracking-tight">{value}</p>
        {description && (
          <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
        )}
      </div>
    </div>
  );
}

interface TaskStatsProps {
  totalAssigned: number;
  inProgress: number;
  completed: number;
  overdue: number;
}

export function TaskStats({ totalAssigned, inProgress, completed, overdue }: TaskStatsProps) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      <StatCard
        label="Assigned to me"
        value={totalAssigned}
        icon={<TrendingUp className="h-3.5 w-3.5" />}
        color="text-blue-600 dark:text-blue-400"
        bgColor="bg-blue-50 dark:bg-blue-900/20"
        description="across all boards"
      />
      <StatCard
        label="In Progress"
        value={inProgress}
        icon={<Clock className="h-3.5 w-3.5" />}
        color="text-amber-600 dark:text-amber-400"
        bgColor="bg-amber-50 dark:bg-amber-900/20"
        description="actively working"
      />
      <StatCard
        label="Completed"
        value={completed}
        icon={<CheckCircle2 className="h-3.5 w-3.5" />}
        color="text-emerald-600 dark:text-emerald-400"
        bgColor="bg-emerald-50 dark:bg-emerald-900/20"
        description="tasks done"
      />
      <StatCard
        label="Overdue"
        value={overdue}
        icon={<AlertTriangle className="h-3.5 w-3.5" />}
        color={overdue > 0 ? "text-red-600 dark:text-red-400" : "text-zinc-500"}
        bgColor={overdue > 0 ? "bg-red-50 dark:bg-red-900/20" : "bg-muted"}
        description={overdue > 0 ? "need attention" : "all on track"}
      />
    </div>
  );
}
