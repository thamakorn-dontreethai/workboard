"use client";

import React, { useState, useRef, useEffect } from "react";
import { useWorkBoard } from "@/lib/context/WorkBoardContext";
import { Check, UserX, Search, ChevronDown, User as UserIcon, UserPlus } from "lucide-react";

interface AssigneeSelectProps {
  currentAssigneeId: string | null;
  onAssign: (userId: string | null) => void;
  boardId?: string;
  size?: "sm" | "md" | "lg";
  align?: "left" | "right";
  showLabel?: boolean;
  disabled?: boolean;
}

export function AssigneeSelect({
  currentAssigneeId,
  onAssign,
  boardId,
  size = "md",
  align = "left",
  showLabel = true,
  disabled = false,
}: AssigneeSelectProps) {
  const { users, boards, openInviteBoardModal } = useWorkBoard();
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);

  const currentAssignee = currentAssigneeId
    ? users.find((u) => u.id === currentAssigneeId)
    : null;

  // Filter members strictly to this specific board's team if boardId is provided
  const board = boardId ? boards.find((b) => b.id === boardId) : null;
  const allowedMemberIds =
    board?.memberIds && board.memberIds.length > 0
      ? board.memberIds
      : board
      ? [board.ownerId]
      : null;

  const eligibleUsers = allowedMemberIds
    ? users.filter((u) => allowedMemberIds.includes(u.id))
    : users;

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
        setSearch("");
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const filteredUsers = eligibleUsers.filter((u) => {
    const q = search.toLowerCase();
    return (
      u.name.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      u.role.toLowerCase().includes(q)
    );
  });

  const handleSelect = (userId: string | null) => {
    onAssign(userId);
    setIsOpen(false);
    setSearch("");
  };

  const sizeClasses = {
    sm: "text-xs py-1 px-2 gap-1.5",
    md: "text-xs py-1.5 px-2.5 gap-2",
    lg: "text-sm py-2 px-3 gap-2.5",
  };

  const avatarSizes = {
    sm: "h-5 w-5 text-[10px]",
    md: "h-6 w-6 text-xs",
    lg: "h-7 w-7 text-xs",
  };

  return (
    <div className="relative inline-block" ref={dropdownRef}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        className={`group flex items-center rounded-lg border border-border/80 bg-background/80 hover:bg-accent/60 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
          sizeClasses[size]
        } ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
      >
        {currentAssignee ? (
          <>
            <div
              className={`flex shrink-0 items-center justify-center rounded-full font-semibold text-white ${
                currentAssignee.avatarColor || "bg-primary"
              } ${avatarSizes[size]}`}
            >
              {currentAssignee.avatarInitials}
            </div>
            {showLabel && (
              <span className="font-medium text-foreground truncate max-w-[130px]">
                {currentAssignee.name}
              </span>
            )}
          </>
        ) : (
          <>
            <div
              className={`flex shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground border border-dashed border-border ${avatarSizes[size]}`}
            >
              <UserIcon className="h-3 w-3" />
            </div>
            {showLabel && (
              <span className="text-muted-foreground font-normal">
                Assign member
              </span>
            )}
          </>
        )}
        <ChevronDown className="h-3 w-3 text-muted-foreground group-hover:text-foreground transition-colors shrink-0 ml-0.5" />
      </button>

      {isOpen && (
        <div
          className={`absolute ${
            align === "right" ? "right-0" : "left-0"
          } top-full z-50 mt-1.5 w-64 rounded-xl border border-border bg-popover p-1 text-popover-foreground shadow-xl animate-in fade-in-50 zoom-in-95`}
        >
          {/* Search box */}
          <div className="relative px-2 py-1.5 border-b border-border/60">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Filter project team..."
              autoFocus
              className="w-full rounded-md bg-muted/60 pl-7 pr-2 py-1 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>

          <div className="max-h-60 overflow-y-auto p-1 space-y-0.5">
            {/* Unassign option */}
            <button
              type="button"
              onClick={() => handleSelect(null)}
              className={`w-full flex items-center justify-between rounded-lg px-2 py-1.5 text-xs text-muted-foreground hover:bg-accent hover:text-foreground transition-colors ${
                !currentAssigneeId ? "bg-accent/60 font-medium" : ""
              }`}
            >
              <div className="flex items-center gap-2">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-muted text-muted-foreground">
                  <UserX className="h-3.5 w-3.5" />
                </div>
                <span>Unassigned</span>
              </div>
              {!currentAssigneeId && <Check className="h-3.5 w-3.5 text-primary" />}
            </button>

            <div className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
              <span>Project Team</span>
              <span className="text-[9px] text-zinc-500 font-normal">
                {filteredUsers.length} member{filteredUsers.length !== 1 ? "s" : ""}
              </span>
            </div>

            {filteredUsers.length === 0 ? (
              <div className="px-3 py-3 text-center text-xs text-muted-foreground">
                No team members in this project yet
              </div>
            ) : (
              filteredUsers.map((user) => {
                const isSelected = user.id === currentAssigneeId;
                return (
                  <button
                    key={user.id}
                    type="button"
                    onClick={() => handleSelect(user.id)}
                    className={`w-full flex items-center justify-between rounded-lg px-2 py-1.5 text-xs transition-colors ${
                      isSelected
                        ? "bg-primary/10 text-primary font-medium"
                        : "text-foreground hover:bg-accent hover:text-accent-foreground"
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <div
                        className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full font-semibold text-white ${
                          user.avatarColor || "bg-primary"
                        } text-[11px]`}
                      >
                        {user.avatarInitials}
                      </div>
                      <div className="text-left min-w-0">
                        <div className="truncate text-xs font-medium text-foreground">
                          {user.name}
                        </div>
                        <div className="truncate text-[10px] text-muted-foreground">
                          {user.role}
                        </div>
                      </div>
                    </div>
                    {isSelected && (
                      <Check className="h-3.5 w-3.5 text-primary shrink-0 ml-2" />
                    )}
                  </button>
                );
              })
            )}

            {/* Invite button */}
            {boardId && (
              <div className="pt-1 mt-1 border-t border-border/60">
                <button
                  type="button"
                  onClick={() => {
                    setIsOpen(false);
                    openInviteBoardModal(boardId);
                  }}
                  className="w-full flex items-center gap-2 rounded-lg px-2 py-1.5 text-xs text-primary hover:bg-primary/10 transition-colors font-medium"
                >
                  <UserPlus className="h-3.5 w-3.5" />
                  <span>+ Invite member to this project</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
