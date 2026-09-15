"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useWorkBoard } from "@/lib/context/WorkBoardContext";
import { X } from "lucide-react";
import type { BoardPrivacy } from "@/types";

const DEFAULT_NAME = "New Board";

// What the board manages decides how its starter items are named ("Task 1", "Lead 1", ...)
const MANAGING_OPTIONS = [
  { label: "Items", noun: "Item" },
  { label: "Subitems", noun: "Subitem" },
  { label: "Budgets", noun: "Budget" },
  { label: "Employees", noun: "Employee" },
  { label: "Campaigns", noun: "Campaign" },
  { label: "Leads", noun: "Lead" },
  { label: "Projects", noun: "Project" },
  { label: "Creatives", noun: "Creative" },
  { label: "Tasks", noun: "Task" },
  { label: "Custom", noun: "" },
];

const PRIVACY_OPTIONS: { id: BoardPrivacy; label: string; hint: string }[] = [
  { id: "main", label: "Main", hint: "Visible to everyone in your workspace" },
  { id: "private", label: "Private", hint: "Visible only to members of this board" },
  { id: "shareable", label: "Shareable", hint: "Visible to board members and guests you invite" },
];

export function CreateBoardModal() {
  const router = useRouter();
  const { isCreateBoardOpen, closeCreateBoardModal, createBoard } = useWorkBoard();

  const [name, setName] = useState(DEFAULT_NAME);
  const [managing, setManaging] = useState("Items");
  const [customNoun, setCustomNoun] = useState("");
  const [privacy, setPrivacy] = useState<BoardPrivacy>("main");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isCreateBoardOpen) return null;

  const resetAndClose = () => {
    setName(DEFAULT_NAME);
    setManaging("Items");
    setCustomNoun("");
    setPrivacy("main");
    closeCreateBoardModal();
  };

  const itemLabel =
    managing === "Custom"
      ? customNoun.trim() || "Item"
      : MANAGING_OPTIONS.find((o) => o.label === managing)?.noun || "Item";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const newBoard = await createBoard({ name: name.trim(), privacy, itemLabel });
      resetAndClose();
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
      aria-label="Create board"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 animate-in fade-in duration-150"
    >
      <div className="fixed inset-0" onClick={resetAndClose} aria-hidden="true" />

      <div className="relative z-10 w-full max-w-[580px] rounded-xl border border-zinc-700/70 bg-[#1e1f21] text-zinc-100 shadow-2xl animate-in zoom-in-95 duration-150">
        <button
          type="button"
          onClick={resetAndClose}
          title="Close"
          className="absolute top-5 right-5 p-1 rounded text-zinc-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
        >
          <X className="h-5 w-5" />
        </button>

        <form onSubmit={handleSubmit} className="px-8 pt-7 pb-6">
          <h3 className="text-2xl font-semibold text-white mb-6">Create board</h3>

          {/* Board name */}
          <label className="block text-sm text-zinc-200 mb-1.5" htmlFor="create-board-name">
            Board name
          </label>
          <input
            id="create-board-name"
            type="text"
            autoFocus
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            onFocus={(e) => e.target.select()}
            className="w-full rounded border border-zinc-600 bg-transparent px-3 py-2 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-[#0073ea]"
          />

          {/* What you're managing */}
          <fieldset className="mt-6">
            <legend className="text-sm text-zinc-200 mb-2.5">
              Select what you&apos;re managing in this board
            </legend>
            <div className="flex flex-wrap gap-x-5 gap-y-2.5">
              {MANAGING_OPTIONS.map((o) => (
                <label key={o.label} className="flex items-center gap-2 text-sm text-zinc-200 cursor-pointer">
                  <input
                    type="radio"
                    name="board-managing"
                    checked={managing === o.label}
                    onChange={() => setManaging(o.label)}
                    className="h-4 w-4 accent-[#0073ea] cursor-pointer"
                  />
                  {o.label}
                </label>
              ))}
            </div>
            {managing === "Custom" && (
              <input
                type="text"
                autoFocus
                value={customNoun}
                onChange={(e) => setCustomNoun(e.target.value)}
                placeholder="e.g. Order, Ticket, Candidate"
                className="mt-3 w-64 rounded border border-zinc-600 bg-transparent px-3 py-1.5 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-[#0073ea]"
              />
            )}
          </fieldset>

          {/* Privacy */}
          <fieldset className="mt-6">
            <legend className="text-sm text-zinc-200 mb-2.5">Select privacy type</legend>
            <div className="flex flex-wrap gap-x-5 gap-y-2.5">
              {PRIVACY_OPTIONS.map((p) => (
                <label key={p.id} className="flex items-center gap-2 text-sm text-zinc-200 cursor-pointer">
                  <input
                    type="radio"
                    name="board-privacy"
                    checked={privacy === p.id}
                    onChange={() => setPrivacy(p.id)}
                    className="h-4 w-4 accent-[#0073ea] cursor-pointer"
                  />
                  {p.label}
                </label>
              ))}
            </div>
            <p className="mt-2 text-xs text-zinc-400">
              {PRIVACY_OPTIONS.find((p) => p.id === privacy)?.hint}
            </p>
          </fieldset>

          <div className="mt-6 flex justify-end">
            <button
              type="submit"
              disabled={!name.trim() || isSubmitting}
              className="px-4 h-9 rounded bg-[#0073ea] hover:bg-[#0060c0] text-sm font-medium text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {isSubmitting ? "Creating..." : "Create board"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
