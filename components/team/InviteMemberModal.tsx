"use client";

import React, { useState } from "react";
import { useWorkBoard } from "@/lib/context/WorkBoardContext";
import { X, UserPlus, Shield, ShieldCheck, UserCheck, Eye } from "lucide-react";

export function InviteMemberModal() {
  const { isInviteMemberOpen, closeInviteMemberModal, inviteMember } =
    useWorkBoard();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"owner" | "admin" | "member" | "viewer">(
    "member"
  );
  const [successMsg, setSuccessMsg] = useState(false);

  if (!isInviteMemberOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) return;

    await inviteMember({
      name: name.trim(),
      email: email.trim(),
      role,
    });

    setSuccessMsg(true);
    setTimeout(() => {
      setSuccessMsg(false);
      setName("");
      setEmail("");
      setRole("member");
      closeInviteMemberModal();
    }, 1200);
  };

  const ROLES_INFO = [
    {
      id: "owner" as const,
      label: "Workspace Owner",
      desc: "Full access to workspace settings, billing, team roles, and all boards.",
      icon: ShieldCheck,
      color: "text-amber-500",
    },
    {
      id: "admin" as const,
      label: "Team Admin",
      desc: "Can invite members, manage boards, and assign work across the workspace.",
      icon: Shield,
      color: "text-indigo-500",
    },
    {
      id: "member" as const,
      label: "Team Member",
      desc: "Can collaborate on boards, update assigned tasks, and participate in discussions.",
      icon: UserCheck,
      color: "text-blue-500",
    },
    {
      id: "viewer" as const,
      label: "Viewer",
      desc: "Read-only access to boards and tasks without editing permissions.",
      icon: Eye,
      color: "text-zinc-500",
    },
  ];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Invite Team Member"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150"
    >
      <div
        className="fixed inset-0"
        onClick={closeInviteMemberModal}
        aria-hidden="true"
      />

      <div className="relative w-full max-w-lg rounded-2xl border border-border bg-card shadow-2xl overflow-hidden z-10 animate-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-card">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <UserPlus className="h-4 w-4" />
            </div>
            <h3 className="text-base font-semibold text-foreground">
              Invite Team Member
            </h3>
          </div>
          <button
            type="button"
            onClick={closeInviteMemberModal}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {successMsg ? (
          <div className="p-8 text-center space-y-2">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-500">
              <UserPlus className="h-6 w-6" />
            </div>
            <h4 className="text-sm font-semibold text-foreground">
              Invitation Sent!
            </h4>
            <p className="text-xs text-muted-foreground">
              {name} ({email}) has been added to the workspace.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">
                Full Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                autoFocus
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Jordan Hayes"
                className="w-full rounded-xl border border-border bg-background px-3.5 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">
                Email Address <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="jordan.hayes@workboard.io"
                className="w-full rounded-xl border border-border bg-background px-3.5 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            <div className="space-y-2 pt-1">
              <label className="text-xs font-semibold text-foreground">
                Workspace Role & Permissions
              </label>
              <div className="space-y-2">
                {ROLES_INFO.map((r) => {
                  const Icon = r.icon;
                  const isSelected = role === r.id;
                  return (
                    <label
                      key={r.id}
                      className={`flex items-start gap-3 rounded-xl border p-3 cursor-pointer transition-all ${
                        isSelected
                          ? "border-primary bg-primary/5 ring-1 ring-primary"
                          : "border-border hover:bg-muted/40"
                      }`}
                    >
                      <input
                        type="radio"
                        name="member_role"
                        value={r.id}
                        checked={isSelected}
                        onChange={() => setRole(r.id)}
                        className="mt-0.5"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <Icon className={`h-3.5 w-3.5 ${r.color}`} />
                          <span className="text-xs font-semibold text-foreground">
                            {r.label}
                          </span>
                        </div>
                        <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">
                          {r.desc}
                        </p>
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-border">
              <button
                type="button"
                onClick={closeInviteMemberModal}
                className="rounded-xl border border-border px-4 py-2 text-xs font-medium text-foreground hover:bg-accent transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!name.trim() || !email.trim()}
                className="flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-xs font-medium text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                <UserPlus className="h-3.5 w-3.5" />
                <span>Send Invitation</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
