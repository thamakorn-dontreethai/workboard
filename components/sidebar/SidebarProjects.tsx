"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Folder, Plus, ChevronDown, ChevronRight } from "lucide-react";
import { MOCK_BOARDS } from "@/lib/mock/data";

interface SidebarProjectsProps {
  collapsed?: boolean;
  onItemClick?: () => void;
}

export function SidebarProjects({ collapsed = false, onItemClick }: SidebarProjectsProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const pathname = usePathname();
  const boards = MOCK_BOARDS.filter((b) => !b.isArchived);

  if (collapsed) {
    return (
      <div className="px-2 py-1.5 flex flex-col items-center gap-1 border-t border-sidebar-border/60">
        <div title="Boards" className="text-muted-foreground p-1">
          <Folder className="h-3.5 w-3.5" />
        </div>
        {boards.map((board) => (
          <Link
            key={board.id}
            href={`/board/${board.id}`}
            onClick={onItemClick}
            title={board.name}
            className={`flex h-7 w-7 items-center justify-center rounded-md transition-colors ${
              pathname === `/board/${board.id}`
                ? "bg-sidebar-accent text-sidebar-foreground"
                : "text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground"
            }`}
          >
            <span className={`h-2 w-2 rounded-full ${board.color}`} />
          </Link>
        ))}
      </div>
    );
  }

  return (
    <div className="px-2 py-1.5 border-t border-sidebar-border/60">
      <div className="flex items-center justify-between px-2 py-1 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          aria-expanded={isExpanded}
          className="flex items-center gap-1.5 hover:text-sidebar-foreground transition-colors"
        >
          <Folder className="h-3 w-3" />
          <span>Boards</span>
          {isExpanded ? (
            <ChevronDown className="h-3 w-3 text-muted-foreground" />
          ) : (
            <ChevronRight className="h-3 w-3 text-muted-foreground" />
          )}
        </button>

        <button
          type="button"
          title="New Board"
          aria-label="Create new board"
          className="h-4.5 w-4.5 flex items-center justify-center rounded text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground transition-colors"
        >
          <Plus className="h-3 w-3" />
        </button>
      </div>

      {isExpanded && (
        <div className="mt-0.5 space-y-0.5">
          {boards.map((board) => {
            const isActive = pathname === `/board/${board.id}`;
            return (
              <Link
                key={board.id}
                href={`/board/${board.id}`}
                onClick={onItemClick}
                className={`group flex items-center justify-between rounded-md px-2.5 py-1 text-xs transition-colors ${
                  isActive
                    ? "bg-sidebar-accent text-sidebar-foreground font-medium"
                    : "text-sidebar-foreground/80 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground"
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${board.color}`} />
                  <span className="truncate">{board.name}</span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
