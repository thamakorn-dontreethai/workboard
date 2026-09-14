"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import {
  User as UserIcon,
  Users,
  Settings,
  LogOut,
  ShieldCheck,
} from "lucide-react";
import { useWorkBoard } from "@/lib/context/WorkBoardContext";

export function UserMenu() {
  const { currentUser, workspace, openInviteMemberModal, logout } =
    useWorkBoard();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const currentMember = workspace.members.find(
    (m) => m.userId === currentUser.id
  );
  const isOwner = currentMember?.role === "owner";

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
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
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-haspopup="true"
        aria-label={`User menu: ${currentUser.name} (${currentUser.role})`}
        className="flex items-center gap-2 rounded-full p-0.5 hover:ring-2 hover:ring-primary/40 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <div
          className={`relative flex h-7 w-7 items-center justify-center rounded-full text-white font-bold text-xs shadow-xs ${
            currentUser.avatarColor || "bg-primary"
          }`}
        >
          <span>{currentUser.avatarInitials}</span>
          <span className="absolute bottom-0 right-0 h-2 w-2 rounded-full bg-emerald-500 ring-2 ring-background" />
        </div>
      </button>

      {isOpen && (
        <div
          role="menu"
          aria-orientation="vertical"
          className="absolute right-0 top-full z-50 mt-1.5 w-72 rounded-2xl border border-border bg-popover p-1.5 text-popover-foreground shadow-2xl animate-in fade-in-50 zoom-in-95"
        >
          {/* Active User Header */}
          <div className="px-3 py-2.5 border-b border-border/60 bg-muted/20 rounded-xl mb-1">
            <div className="flex items-center gap-2">
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full text-white font-bold text-xs ${
                  currentUser.avatarColor || "bg-primary"
                }`}
              >
                {currentUser.avatarInitials}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <span className="font-semibold text-xs text-foreground truncate">
                    {currentUser.name}
                  </span>
                  {isOwner && (
                    <span className="inline-flex items-center gap-0.5 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 px-1 py-0.2 text-[9px] font-bold">
                      <ShieldCheck className="h-2.5 w-2.5" /> OWNER
                    </span>
                  )}
                </div>
                <div className="text-[11px] text-muted-foreground truncate">
                  {currentUser.email}
                </div>
              </div>
            </div>
            <div className="mt-2 inline-flex items-center rounded-md bg-muted px-2 py-0.5 text-[10px] font-medium text-foreground">
              {currentUser.role}
            </div>
          </div>

          {/* Navigation & Auth Links */}
          <div className="py-1 space-y-0.5">
            <Link
              href="/team"
              onClick={() => setIsOpen(false)}
              role="menuitem"
              className="w-full flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs text-foreground hover:bg-muted/60 transition-colors"
            >
              <Users className="h-3.5 w-3.5 text-primary" />
              <span>Team & Members Management</span>
            </Link>

            <Link
              href="/register"
              onClick={() => setIsOpen(false)}
              role="menuitem"
              className="w-full flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs text-foreground hover:bg-muted/60 transition-colors"
            >
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
              <span>Register New User</span>
            </Link>

            <Link
              href="/login"
              onClick={() => setIsOpen(false)}
              role="menuitem"
              className="w-full flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs text-rose-400 hover:bg-rose-500/10 transition-colors font-medium"
            >
              <LogOut className="h-3.5 w-3.5 text-rose-400" />
              <span>Sign Out</span>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
