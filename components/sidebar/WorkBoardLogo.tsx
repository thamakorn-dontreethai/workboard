"use client";

import React from "react";
import Link from "next/link";

interface WorkBoardLogoProps {
  collapsed?: boolean;
}

export function WorkBoardLogo({ collapsed = false }: WorkBoardLogoProps) {
  return (
    <Link
      href="/"
      className="group flex items-center gap-2.5 outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-md py-1"
      aria-label="WorkBoard Home"
    >
      {/* Distinctive WorkBoard Mark: layered precision tiles representing workflows & boards */}
      <div className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-foreground text-background shadow-xs transition-transform duration-150 group-hover:scale-[1.02]">
        <svg
          className="h-4.5 w-4.5"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          {/* Top board card */}
          <rect x="3" y="3" width="7" height="9" rx="1.5" />
          {/* Right board column */}
          <rect x="14" y="3" width="7" height="5" rx="1.5" />
          {/* Bottom active task */}
          <rect x="14" y="12" width="7" height="9" rx="1.5" />
          {/* Bottom left progress card */}
          <rect x="3" y="16" width="7" height="5" rx="1.5" />
        </svg>
      </div>

      {!collapsed && (
        <div className="flex items-center gap-2 overflow-hidden">
          <span className="font-semibold text-base tracking-tight text-foreground select-none">
            WorkBoard
          </span>
          <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium tracking-wide text-muted-foreground uppercase select-none">
            Pro
          </span>
        </div>
      )}
    </Link>
  );
}
