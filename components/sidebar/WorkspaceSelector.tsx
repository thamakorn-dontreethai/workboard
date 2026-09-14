"use client";

import React, { useState, useRef, useEffect } from "react";
import { ChevronsUpDown, Check, Plus } from "lucide-react";

interface Workspace {
  id: string;
  name: string;
  plan: string;
  avatarColor: string;
}

const WORKSPACES: Workspace[] = [
  { id: "ws-1", name: "Acme Product Engineering", plan: "Enterprise", avatarColor: "bg-indigo-600 text-white" },
  { id: "ws-2", name: "Acme Marketing & Growth", plan: "Pro", avatarColor: "bg-emerald-600 text-white" },
  { id: "ws-3", name: "Alex's Personal Space", plan: "Free", avatarColor: "bg-zinc-600 text-white" },
];

interface WorkspaceSelectorProps {
  collapsed?: boolean;
}

export function WorkspaceSelector({ collapsed = false }: WorkspaceSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedWorkspace, setSelectedWorkspace] = useState<Workspace>(WORKSPACES[0]);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  return (
    <div className="relative px-2 py-1" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-haspopup="true"
        aria-label={`Current workspace: ${selectedWorkspace.name}. Click to switch.`}
        className={`w-full flex items-center rounded-lg border border-sidebar-border bg-sidebar hover:bg-sidebar-accent/60 transition-colors p-2 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${collapsed ? "justify-center" : "justify-between gap-2"
          }`}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <div
            className={`flex h-6 w-6 shrink-0 items-center justify-center rounded font-semibold text-xs ${selectedWorkspace.avatarColor}`}
            title={selectedWorkspace.name}
          >
            {selectedWorkspace.name.charAt(0)}
          </div>
          {!collapsed && (
            <div className="min-w-0 flex-1 truncate">
              <div className="truncate text-xs font-medium text-sidebar-foreground">
                {selectedWorkspace.name}
              </div>
              <div className="text-[10px] text-muted-foreground">
                {selectedWorkspace.plan} Plan
              </div>
            </div>
          )}
        </div>
        {!collapsed && (
          <ChevronsUpDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground" aria-hidden="true" />
        )}
      </button>

      {isOpen && (
        <div
          role="menu"
          aria-orientation="vertical"
          className="absolute left-2 top-full z-50 mt-1 w-60 rounded-lg border border-border bg-popover p-1 text-popover-foreground shadow-lg animate-in fade-in-50 zoom-in-95"
        >
          <div className="px-2 py-1.5 text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
            Workspaces
          </div>
          <div className="space-y-0.5">
            {WORKSPACES.map((ws) => {
              const isSelected = ws.id === selectedWorkspace.id;
              return (
                <button
                  key={ws.id}
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setSelectedWorkspace(ws);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center justify-between rounded-md px-2 py-1.5 text-xs transition-colors hover:bg-accent hover:text-accent-foreground ${isSelected ? "bg-accent/70 font-medium" : "text-foreground"
                    }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    <div
                      className={`flex h-5 w-5 shrink-0 items-center justify-center rounded text-[10px] font-bold ${ws.avatarColor}`}
                    >
                      {ws.name.charAt(0)}
                    </div>
                    <div className="truncate text-left">
                      <div className="truncate">{ws.name}</div>
                      <div className="text-[10px] text-muted-foreground">{ws.plan}</div>
                    </div>
                  </div>
                  {isSelected && <Check className="h-3.5 w-3.5 shrink-0 text-primary" />}
                </button>
              );
            })}
          </div>

          <div className="my-1 border-t border-border" />

          <button
            type="button"
            role="menuitem"
            onClick={() => setIsOpen(false)}
            className="w-full flex items-center gap-2 rounded-md px-2 py-1.5 text-xs text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
          >
            <Plus className="h-3.5 w-3.5 shrink-0" />
            <span>Create new workspace</span>
          </button>
        </div>
      )}
    </div>
  );
}
