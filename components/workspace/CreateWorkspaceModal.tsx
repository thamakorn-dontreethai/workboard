"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useWorkBoard } from "@/lib/context/WorkBoardContext";
import { X, Globe, Lock, Check } from "lucide-react";
import {
  AVATAR_COLOR_PALETTE,
  AVATAR_ICON_LIST,
  OrigamiBirdIcon,
} from "./workspace-theme";
import { WorkspaceAvatar } from "./WorkspaceAvatar";

export function CreateWorkspaceModal() {
  const router = useRouter();
  const { isCreateWorkspaceOpen, closeCreateWorkspaceModal, createWorkspace } =
    useWorkBoard();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [privacy, setPrivacy] = useState<"open" | "closed">("open");
  const [avatarColor, setAvatarColor] = useState("bg-[#57b6ff]");
  const [selectedIcon, setSelectedIcon] = useState("initial");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isCreateWorkspaceOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const newWs = await createWorkspace({
        name: name.trim(),
        description: description.trim(),
        privacy,
        avatarColor,
        icon: selectedIcon,
      } as any);

      setName("");
      setDescription("");
      closeCreateWorkspaceModal();
      router.push(`/workspace/${newWs.id}`);
    } catch (err) {
      console.error("Failed to create workspace:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="create-workspace-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in duration-150"
    >
      <div
        className="fixed inset-0"
        onClick={closeCreateWorkspaceModal}
        aria-hidden="true"
      />

      <div className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl border border-zinc-700/80 bg-[#1c1e28] text-zinc-100 shadow-2xl z-10 animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 bg-[#161720] sticky top-0 z-10">
          <h3
            id="create-workspace-title"
            className="text-base font-bold text-white tracking-tight"
          >
            Add new workspace
          </h3>
          <button
            type="button"
            onClick={closeCreateWorkspaceModal}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-400 hover:bg-zinc-800 hover:text-white transition-colors cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Avatar Preview & Customization */}
          <div className="flex flex-col items-center justify-center gap-3 pt-1">
            <WorkspaceAvatar
              name={name || "Workspace"}
              avatarColor={avatarColor}
              icon={selectedIcon}
              size="lg"
            />

            {/* 21 Colors Palette */}
            <div className="w-full space-y-1.5 pt-1">
              <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 block text-center">
                Background Color
              </label>
              <div className="flex flex-wrap items-center justify-center gap-1.5 max-w-sm mx-auto">
                {AVATAR_COLOR_PALETTE.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setAvatarColor(c.bgClass)}
                    title={c.name}
                    className={`h-5 w-5 rounded-full ${c.bgClass} flex items-center justify-center transition-transform cursor-pointer ${
                      avatarColor === c.bgClass
                        ? "ring-2 ring-white ring-offset-2 ring-offset-[#1c1e28] scale-110"
                        : "opacity-80 hover:opacity-100 hover:scale-105"
                    }`}
                  >
                    {avatarColor === c.bgClass && (
                      <Check className="h-2.5 w-2.5 text-white stroke-[3.5]" />
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* 20 Icons Palette */}
            <div className="w-full space-y-1.5 pt-2">
              <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 block text-center">
                Icon
              </label>
              <div className="grid grid-cols-10 gap-1.5 max-w-sm mx-auto">
                {AVATAR_ICON_LIST.map((iconItem) => {
                  const isSelected = selectedIcon === iconItem.id;
                  return (
                    <button
                      key={iconItem.id}
                      type="button"
                      onClick={() => setSelectedIcon(iconItem.id)}
                      title={iconItem.name}
                      className={`h-7 w-7 rounded-lg flex items-center justify-center text-white transition-transform cursor-pointer ${avatarColor} ${
                        isSelected
                          ? "ring-2 ring-white ring-offset-1 ring-offset-[#1c1e28] scale-110 shadow-md"
                          : "opacity-75 hover:opacity-100 hover:scale-105"
                      }`}
                    >
                      {iconItem.type === "initial" && (
                        <span className="font-bold text-xs leading-none">
                          {(name || "W").trim().charAt(0).toUpperCase()}
                        </span>
                      )}
                      {iconItem.type === "origami" && (
                        <OrigamiBirdIcon className="h-3.5 w-3.5" />
                      )}
                      {iconItem.type === "component" && iconItem.component && (
                        <iconItem.component className="h-3.5 w-3.5" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Workspace Name Input */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-zinc-300">
              Workspace name <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              autoFocus
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Product Engineering, Growth & Marketing"
              className="w-full rounded-xl border border-zinc-700 bg-zinc-900/90 px-3.5 py-2.5 text-xs text-white placeholder:text-zinc-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50"
            />
          </div>

          {/* Description (Optional) */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-zinc-300">
              Description <span className="text-zinc-500">(Optional)</span>
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What is this workspace used for?"
              className="w-full rounded-xl border border-zinc-700 bg-zinc-900/90 px-3.5 py-2 text-xs text-white placeholder:text-zinc-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 resize-none"
            />
          </div>

          {/* Privacy Option Selector */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-zinc-300">Privacy</label>
            <div className="space-y-2">
              <label
                className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                  privacy === "open"
                    ? "border-indigo-500/80 bg-indigo-500/10 text-white"
                    : "border-zinc-800 bg-zinc-900/40 text-zinc-400 hover:border-zinc-700"
                }`}
              >
                <input
                  type="radio"
                  name="privacy"
                  value="open"
                  checked={privacy === "open"}
                  onChange={() => setPrivacy("open")}
                  className="mt-0.5 text-indigo-600 focus:ring-0 focus:ring-offset-0"
                />
                <div className="flex-1 text-xs">
                  <div className="flex items-center gap-1.5 font-semibold text-white">
                    <Globe className="h-3.5 w-3.5 text-indigo-400" />
                    <span>Open</span>
                  </div>
                  <p className="text-[11px] text-zinc-400 mt-0.5 leading-relaxed">
                    Every team member in the account can join
                  </p>
                </div>
              </label>

              <label
                className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                  privacy === "closed"
                    ? "border-indigo-500/80 bg-indigo-500/10 text-white"
                    : "border-zinc-800 bg-zinc-900/40 text-zinc-400 hover:border-zinc-700"
                }`}
              >
                <input
                  type="radio"
                  name="privacy"
                  value="closed"
                  checked={privacy === "closed"}
                  onChange={() => setPrivacy("closed")}
                  className="mt-0.5 text-indigo-600 focus:ring-0 focus:ring-offset-0"
                />
                <div className="flex-1 text-xs">
                  <div className="flex items-center gap-1.5 font-semibold text-white">
                    <Lock className="h-3.5 w-3.5 text-amber-400" />
                    <span>Closed</span>
                  </div>
                  <p className="text-[11px] text-zinc-400 mt-0.5 leading-relaxed">
                    Only invited members can access
                  </p>
                </div>
              </label>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex items-center justify-end gap-2 border-t border-zinc-800">
            <button
              type="button"
              onClick={closeCreateWorkspaceModal}
              className="px-4 py-2 rounded-xl text-xs font-medium text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!name.trim() || isSubmitting}
              className="px-5 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
            >
              {isSubmitting ? "Creating..." : "Add workspace"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
