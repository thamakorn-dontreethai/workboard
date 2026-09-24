"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Settings, LogOut, ShieldCheck } from "lucide-react";
import { useWorkBoard } from "@/lib/context/WorkBoardContext";

export function UserMenu() {
  const router = useRouter();
  const { currentUser, workspace, openInviteMemberModal, logout } =
    useWorkBoard();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const handleSignOut = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsOpen(false);
    logout();
    router.replace("/login");
  };

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
        <div className="relative">
          {currentUser.avatarUrl ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={currentUser.avatarUrl}
              alt={currentUser.name}
              className="h-7 w-7 rounded-full object-cover shadow-xs"
            />
          ) : (
            <div
              className={`flex h-7 w-7 items-center justify-center rounded-full text-white font-bold text-xs shadow-xs ${
                currentUser.avatarColor || "bg-primary"
              }`}
            >
              <span>{currentUser.avatarInitials}</span>
            </div>
          )}
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
              {currentUser.avatarUrl ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={currentUser.avatarUrl}
                  alt={currentUser.name}
                  className="h-8 w-8 rounded-full object-cover shrink-0"
                />
              ) : (
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-full text-white font-bold text-xs shrink-0 ${
                    currentUser.avatarColor || "bg-primary"
                  }`}
                >
                  {currentUser.avatarInitials}
                </div>
              )}
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
          </div>

          {/* Navigation & Auth Links */}
          <div className="py-1 space-y-0.5">
            <Link
              href="/settings"
              onClick={() => setIsOpen(false)}
              role="menuitem"
              className="w-full flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs text-foreground hover:bg-muted/60 transition-colors"
            >
              <Settings className="h-3.5 w-3.5 text-primary" />
              <span>Account Settings</span>
            </Link>

            <button
              type="button"
              onClick={handleSignOut}
              role="menuitem"
              className="w-full flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs text-rose-400 hover:bg-rose-500/10 transition-colors font-medium text-left cursor-pointer"
            >
              <LogOut className="h-3.5 w-3.5 text-rose-400" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
