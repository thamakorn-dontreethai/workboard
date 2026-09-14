"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useWorkBoard } from "@/lib/context/WorkBoardContext";
import {
  X,
  Table,
  Kanban,
  Calendar,
  Sparkles,
  Folder,
  Check,
  Plus,
  Compass,
  Megaphone,
  Briefcase,
  Layers,
} from "lucide-react";

export function CreateBoardModal() {
  const router = useRouter();
  const {
    isCreateBoardOpen,
    closeCreateBoardModal,
    createBoard,
    folders,
    currentUser,
  } = useWorkBoard();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [layoutType, setLayoutType] = useState<"table" | "kanban" | "timeline">(
    "table"
  );
  const [selectedColor, setSelectedColor] = useState("bg-blue-500");
  const [selectedFolder, setSelectedFolder] = useState("team-folder");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isCreateBoardOpen) return null;

  const COLOR_OPTIONS = [
    { name: "Blue", class: "bg-blue-500", border: "border-blue-400" },
    { name: "Indigo", class: "bg-indigo-500", border: "border-indigo-400" },
    { name: "Emerald", class: "bg-emerald-500", border: "border-emerald-400" },
    { name: "Purple", class: "bg-purple-500", border: "border-purple-400" },
    { name: "Amber", class: "bg-amber-500", border: "border-amber-400" },
    { name: "Rose", class: "bg-rose-500", border: "border-rose-400" },
    { name: "Cyan", class: "bg-cyan-500", border: "border-cyan-400" },
  ];

  const LAYOUT_OPTIONS = [
    {
      id: "table" as const,
      title: "Table / Spreadsheet",
      desc: "Grid view with custom status, assignees, dates, and progress bars.",
      icon: Table,
    },
    {
      id: "kanban" as const,
      title: "Kanban Board",
      desc: "Card-based visual workflow grouped by stage or task status.",
      icon: Kanban,
    },
    {
      id: "timeline" as const,
      title: "Timeline & Gantt",
      desc: "Plan milestones, deadlines, and project schedules over time.",
      icon: Calendar,
    },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const newBoard = await createBoard({
        name: name.trim(),
        description: description.trim(),
        color: selectedColor,
        folderId: selectedFolder,
      });

      setName("");
      setDescription("");
      closeCreateBoardModal();
      router.push(`/board/${newBoard.id}`);
    } catch (error) {
      console.error("Failed to create board:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Create New Board"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/70 backdrop-blur-xs animate-in fade-in duration-150"
    >
      <div
        className="fixed inset-0"
        onClick={closeCreateBoardModal}
        aria-hidden="true"
      />

      <div className="relative w-full max-w-lg rounded-2xl border border-zinc-700/80 bg-[#1c1e28] text-zinc-100 shadow-2xl overflow-hidden z-10 animate-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 bg-[#161720]">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
              <Table className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-tight">
                Create New Board / Project
              </h3>
              <p className="text-[11px] text-zinc-400">
                Track deliverables, workflows, and tasks with your team
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={closeCreateBoardModal}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-400 hover:bg-zinc-800 hover:text-white transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Board Name */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-zinc-300">
              Board / Project Name <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              autoFocus
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Mobile App Redesign, Marketing Q4 Sprint"
              className="w-full rounded-xl border border-zinc-700 bg-zinc-900/90 px-3.5 py-2.5 text-xs text-white placeholder:text-zinc-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/50"
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
              placeholder="What is this board or project for?"
              className="w-full rounded-xl border border-zinc-700 bg-zinc-900/90 px-3.5 py-2 text-xs text-white placeholder:text-zinc-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/50 resize-none"
            />
          </div>

          {/* Layout Type Selection */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-zinc-300">
              Initial Board View
            </label>
            <div className="grid grid-cols-3 gap-2">
              {LAYOUT_OPTIONS.map((layout) => {
                const isSelected = layoutType === layout.id;
                const Icon = layout.icon;
                return (
                  <button
                    key={layout.id}
                    type="button"
                    onClick={() => setLayoutType(layout.id)}
                    className={`flex flex-col items-center justify-center p-3 rounded-xl border text-center transition-all ${
                      isSelected
                        ? "border-emerald-500 bg-emerald-500/10 text-white font-medium"
                        : "border-zinc-700/80 bg-zinc-900/50 text-zinc-400 hover:bg-zinc-800/80 hover:text-zinc-200"
                    }`}
                  >
                    <Icon
                      className={`h-4 w-4 mb-1.5 ${
                        isSelected ? "text-emerald-400" : "text-zinc-400"
                      }`}
                    />
                    <span className="text-[11px] font-semibold block leading-tight">
                      {layout.title}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Color & Theme Picker */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-zinc-300">
              Theme Color
            </label>
            <div className="flex items-center gap-2">
              {COLOR_OPTIONS.map((c) => (
                <button
                  key={c.class}
                  type="button"
                  onClick={() => setSelectedColor(c.class)}
                  className={`h-6 w-6 rounded-full ${c.class} flex items-center justify-center transition-transform ${
                    selectedColor === c.class
                      ? "ring-2 ring-white scale-110"
                      : "opacity-75 hover:opacity-100"
                  }`}
                >
                  {selectedColor === c.class && (
                    <Check className="h-3 w-3 text-white stroke-[3]" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Location / Folder */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-zinc-300">
              Location / Folder
            </label>
            <div className="flex items-center gap-2">
              <div className="flex-1 flex items-center gap-2 px-3 py-2 rounded-xl border border-zinc-700 bg-zinc-900/90 text-xs text-zinc-200">
                <Folder className="h-3.5 w-3.5 text-amber-400" />
                <span>test team (My Team)</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-3 flex items-center justify-end gap-2 border-t border-zinc-800">
            <button
              type="button"
              onClick={closeCreateBoardModal}
              className="px-4 py-2 rounded-xl text-xs font-medium text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!name.trim() || isSubmitting}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>{isSubmitting ? "Creating..." : "Create Board"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
