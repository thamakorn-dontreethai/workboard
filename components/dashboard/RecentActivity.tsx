"use client";

import React from "react";
import { type Activity } from "@/types";
import { formatRelativeDate } from "@/lib/utils/date";
import { Activity as ActivityIcon } from "lucide-react";
import { useWorkBoard } from "@/lib/context/WorkBoardContext";

export function RecentActivity() {
  const { activities, users, boards, tasks, openTaskModal } = useWorkBoard();

  const recentList = activities.slice(0, 8);

  return (
    <div className="rounded-xl border border-border bg-card">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-border">
        <ActivityIcon className="h-3.5 w-3.5 text-muted-foreground" />
        <h2 className="text-sm font-semibold text-foreground">Recent Activity</h2>
      </div>

      <div className="p-4">
        {recentList.length === 0 ? (
          <div className="py-6 text-center">
            <p className="text-xs text-muted-foreground">No recent activity.</p>
          </div>
        ) : (
          <div className="space-y-3.5">
            {recentList.map((activity) => {
              const actor = users.find((u) => u.id === activity.actorId);
              const board = boards.find((b) => b.id === activity.boardId);
              const task = tasks.find((t) => t.id === activity.taskId);

              return (
                <div
                  key={activity.id}
                  className="flex items-start gap-2.5 text-xs"
                >
                  <div
                    className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white mt-0.5 ${
                      actor?.avatarColor || "bg-primary"
                    }`}
                    title={actor?.name}
                  >
                    {actor?.avatarInitials || "WB"}
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="text-foreground leading-snug">
                      <span className="font-semibold text-foreground">
                        {actor?.name.split(" ")[0] || "Someone"}
                      </span>{" "}
                      <span className="text-muted-foreground">
                        {activity.description}
                      </span>
                      {task && (
                        <button
                          type="button"
                          onClick={() => openTaskModal(task.id)}
                          className="font-medium text-foreground hover:text-primary hover:underline ml-1 inline text-left cursor-pointer"
                        >
                          {task.title}
                        </button>
                      )}
                    </p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      {board && (
                        <span className="text-[10px] text-muted-foreground">
                          {board.name}
                        </span>
                      )}
                      <span className="text-muted-foreground/50 text-[10px]">
                        ·
                      </span>
                      <span className="text-[10px] text-muted-foreground">
                        {formatRelativeDate(activity.createdAt)}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
