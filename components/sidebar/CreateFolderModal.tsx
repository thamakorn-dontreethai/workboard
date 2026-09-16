"use client";

import React, { useState } from "react";
import { useWorkBoard } from "@/lib/context/WorkBoardContext";
import { X, FolderPlus, Folder, Check, Plus } from "lucide-react";

export function CreateFolderModal() {
  const { isCreateFolderOpen, closeCreateFolderModal, createFolder } =
    useWorkBoard();

  const [folderName, setFolderName] = useState("");
  const [selectedColor, setSelectedColor] = useState("text-amber-400");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isCreateFolderOpen) return null;

  const FOLDER_COLORS = [
    { name: "Amber", class: "text-amber-400", bg: "bg-amber-400/15" },
    { name: "Blue", class: "text-blue-400", bg: "bg-blue-400/15" },
    { name: "Emerald", class: "text-emerald-400", bg: "bg-emerald-400/15" },
    { name: "Purple", class: "text-purple-400", bg: "bg-purple-400/15" },
    { name: "Rose", class: "text-rose-400", bg: "bg-rose-400/15" },
    { name: "Indigo", class: "text-indigo-400", bg: "bg-indigo-400/15" },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!folderName.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await createFolder(folderName.trim(), selectedColor);
      setFolderName("");
      closeCreateFolderModal();
    } catch (err) {
      console.error("Failed to create folder:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Create New Folder"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/70 backdrop-blur-xs animate-in fade-in duration-150"
    >
      <div
        className="fixed inset-0"
        onClick={closeCreateFolderModal}
        aria-hidden="true"
      />

      <div className="relative w-full max-w-md rounded-2xl border border-zinc-700/80 bg-[#1c1e28] text-zinc-100 shadow-2xl overflow-hidden z-10 animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 bg-[#161720]">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-500/15 text-amber-400 border border-amber-500/30">
              <FolderPlus className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-tight">
                Create New Folder
              </h3>
              <p className="text-[11px] text-zinc-400">
                Organize projects and boards into team folders
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={closeCreateFolderModal}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-400 hover:bg-zinc-800 hover:text-white transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-zinc-300">
              Folder Name <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              autoFocus
              required
              value={folderName}
              onChange={(e) => setFolderName(e.target.value)}
              placeholder="e.g. Marketing Ops, Client Projects, Engineering"
              className="w-full rounded-xl border border-zinc-700 bg-zinc-900/90 px-3.5 py-2.5 text-xs text-white placeholder:text-zinc-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/50"
            />
          </div>

          {/* Folder Color */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-zinc-300">
              Folder Color
            </label>
            <div className="flex items-center gap-2">
              {FOLDER_COLORS.map((c) => (
                <button
                  key={c.name}
                  type="button"
                  onClick={() => setSelectedColor(c.class)}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs transition-all ${
                    selectedColor === c.class
                      ? "border-amber-500 bg-amber-500/20 text-white font-medium"
                      : "border-zinc-700/80 bg-zinc-900/50 text-zinc-400 hover:bg-zinc-800"
                  }`}
                >
                  <Folder className={`h-3.5 w-3.5 ${c.class}`} />
                  <span className="text-[11px]">{c.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-3 flex items-center justify-end gap-2 border-t border-zinc-800">
            <button
              type="button"
              onClick={closeCreateFolderModal}
              className="px-4 py-2 rounded-xl text-xs font-medium text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!folderName.trim() || isSubmitting}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-amber-600 hover:bg-amber-500 text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>{isSubmitting ? "Creating..." : "Create Folder"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
