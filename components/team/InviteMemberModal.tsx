"use client";

import React, { useState } from "react";
import { useWorkBoard } from "@/lib/context/WorkBoardContext";
import {
  X,
  UserPlus,
  Shield,
  ShieldCheck,
  UserCheck,
  Eye,
  Copy,
  Check,
  CheckCircle2,
  Share2,
} from "lucide-react";

export function InviteMemberModal() {
  const { isInviteMemberOpen, closeInviteMemberModal, inviteMember } =
    useWorkBoard();

  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"owner" | "admin" | "member" | "viewer">(
    "member"
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState(false);
  const [generatedInviteLink, setGeneratedInviteLink] = useState("");
  const [copied, setCopied] = useState(false);

  if (!isInviteMemberOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      // No name is collected up front — derive a placeholder from the
      // email's local part, same fallback used when a board-invite
      // recipient signs up without ever having a name on file.
      const namePart = email.trim().split("@")[0];
      const placeholderName =
        namePart.charAt(0).toUpperCase() + namePart.slice(1);

      const res = await inviteMember({
        name: placeholderName,
        email: email.trim(),
        role,
      });

      if (res?.inviteLink) {
        setGeneratedInviteLink(res.inviteLink);
      } else {
        const origin = typeof window !== "undefined" ? window.location.origin : "";
        setGeneratedInviteLink(`${origin}/register?email=${encodeURIComponent(email)}&role=${role}`);
      }

      setSuccessMsg(true);
    } catch (err) {
      console.error("Failed to invite member:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopyLink = () => {
    if (!generatedInviteLink) return;
    navigator.clipboard.writeText(generatedInviteLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleReset = () => {
    setSuccessMsg(false);
    setEmail("");
    setRole("member");
    setGeneratedInviteLink("");
    setCopied(false);
  };

  const handleClose = () => {
    handleReset();
    closeInviteMemberModal();
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
      desc: "Can collaborate on boards, create tasks, and participate in discussions.",
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
        onClick={handleClose}
        aria-hidden="true"
      />

      <div className="relative w-full max-w-lg rounded-2xl border border-zinc-800 bg-[#191b26] text-white shadow-2xl overflow-hidden z-10 animate-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 bg-[#161722]">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-400">
              <UserPlus className="h-4 w-4" />
            </div>
            <h3 className="text-base font-semibold text-white">
              Invite Team Member
            </h3>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-400 hover:bg-zinc-800 hover:text-white transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {successMsg ? (
          <div className="p-6 space-y-4">
            <div className="flex items-center gap-3 p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <CheckCircle2 className="h-5 w-5 shrink-0" />
              <div className="text-xs">
                <p className="font-semibold text-white">Invitation Created Successfully!</p>
                <p className="text-zinc-300 mt-0.5">
                  An invite has been generated for <strong>{email}</strong> as <strong>{role}</strong>.
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
                <Share2 className="h-3.5 w-3.5 text-indigo-400" />
                <span>Shareable Invitation Link (Direct Join)</span>
              </label>
              <div className="flex items-center gap-2 p-1.5 rounded-xl border border-zinc-700/80 bg-zinc-900">
                <input
                  type="text"
                  readOnly
                  value={generatedInviteLink}
                  className="w-full bg-transparent px-2.5 py-1 text-xs text-zinc-200 font-mono focus:outline-none truncate"
                />
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shrink-0 transition-colors shadow-xs"
                >
                  {copied ? (
                    <>
                      <Check className="h-3.5 w-3.5" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5" />
                      <span>Copy Link</span>
                    </>
                  )}
                </button>
              </div>
              <p className="text-[11px] text-zinc-400 leading-relaxed">
                💡 <strong>Tip:</strong> Copy and send this link directly to your colleague or test it in an Incognito window. When they open the link, they will immediately join your team with their assigned role!
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-800">
              <button
                type="button"
                onClick={handleReset}
                className="px-4 py-2 rounded-xl border border-zinc-700 hover:bg-zinc-800 text-xs font-semibold text-zinc-300 transition-colors"
              >
                + Invite Another
              </button>
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-300">
                Email Address <span className="text-red-400">*</span>
              </label>
              <input
                type="email"
                required
                autoFocus
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="colleague@company.com"
                className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-3.5 py-2 text-sm text-white placeholder:text-zinc-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            <div className="space-y-2 pt-1">
              <label className="text-xs font-semibold text-zinc-300">
                Workspace Role & Permissions
              </label>
              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {ROLES_INFO.map((r) => {
                  const Icon = r.icon;
                  const isSelected = role === r.id;
                  return (
                    <label
                      key={r.id}
                      className={`flex items-start gap-3 rounded-xl border p-3 cursor-pointer transition-all ${
                        isSelected
                          ? "border-indigo-500 bg-indigo-500/10 ring-1 ring-indigo-500"
                          : "border-zinc-800 bg-zinc-900/40 hover:bg-zinc-800/60"
                      }`}
                    >
                      <input
                        type="radio"
                        name="member_role"
                        value={r.id}
                        checked={isSelected}
                        onChange={() => setRole(r.id)}
                        className="mt-0.5 accent-indigo-500"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <Icon className={`h-3.5 w-3.5 ${r.color}`} />
                          <span className="text-xs font-semibold text-white">
                            {r.label}
                          </span>
                        </div>
                        <p className="text-[11px] text-zinc-400 mt-0.5 leading-relaxed">
                          {r.desc}
                        </p>
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-zinc-800">
              <button
                type="button"
                onClick={handleClose}
                className="rounded-xl border border-zinc-700 px-4 py-2 text-xs font-medium text-zinc-300 hover:bg-zinc-800 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!email.trim() || isSubmitting}
                className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-500 transition-colors disabled:opacity-50"
              >
                <UserPlus className="h-3.5 w-3.5" />
                <span>{isSubmitting ? "Generating Invite..." : "Send Invitation"}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
