"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Search, X, CheckCircle2, Layout, User } from "lucide-react";
import { useWorkBoard } from "@/lib/context/WorkBoardContext";

interface SearchResult {
  id: string;
  title: string;
  category: "Task" | "Board" | "Member";
  meta: string;
  action: () => void;
}

export function HeaderSearch() {
  const router = useRouter();
  const { tasks, boards, users, openTaskModal } = useWorkBoard();
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  // Listen for Ctrl+K or Cmd+K
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
      if (e.key === "Escape" && isOpen) {
        setIsOpen(false);
        setQuery("");
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  const handleClose = () => {
    setIsOpen(false);
    setQuery("");
  };

  // Build dynamic search index from active state
  const searchIndex: SearchResult[] = [
    ...tasks.map((t) => ({
      id: `task-${t.id}`,
      title: t.title,
      category: "Task" as const,
      meta: `${t.status.replace("_", " ")} • ${t.priority} priority`,
      action: () => {
        openTaskModal(t.id);
        handleClose();
      },
    })),
    ...boards.map((b) => ({
      id: `board-${b.id}`,
      title: b.name,
      category: "Board" as const,
      meta: `${b.description || "Project board"}`,
      action: () => {
        router.push(`/board/${b.id}`);
        handleClose();
      },
    })),
    ...users.map((u) => ({
      id: `user-${u.id}`,
      title: u.name,
      category: "Member" as const,
      meta: `${u.email} • ${u.role}`,
      action: () => {
        router.push("/team");
        handleClose();
      },
    })),
  ];

  const filteredResults = query.trim()
    ? searchIndex.filter(
        (r) =>
          r.title.toLowerCase().includes(query.toLowerCase()) ||
          r.meta.toLowerCase().includes(query.toLowerCase()) ||
          r.category.toLowerCase().includes(query.toLowerCase())
      )
    : searchIndex.slice(0, 6);

  return (
    <>
      {/* Header Search Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        aria-label="Search WorkBoard (Ctrl+K)"
        className="flex items-center gap-2 rounded-lg border border-input bg-background/50 hover:bg-muted/60 px-2.5 py-1.5 text-xs text-muted-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring w-36 sm:w-56 md:w-64 justify-between"
      >
        <div className="flex items-center gap-2 truncate">
          <Search className="h-3.5 w-3.5 shrink-0" />
          <span className="truncate">Search tasks, boards...</span>
        </div>
        <kbd className="hidden sm:inline-flex items-center gap-0.5 rounded border border-border bg-muted px-1.5 py-0.5 text-[10px] font-mono font-medium text-muted-foreground">
          <span>⌘</span>K
        </kbd>
      </button>

      {/* Quick Search Palette Modal */}
      {isOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Quick Search"
          className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4 bg-black/40 backdrop-blur-xs animate-in fade-in-50"
        >
          {/* Backdrop overlay */}
          <div className="fixed inset-0" onClick={handleClose} />

          <div className="relative w-full max-w-xl rounded-xl border border-border bg-popover shadow-2xl overflow-hidden z-10">
            {/* Search Input Bar */}
            <div className="flex items-center border-b border-border px-3.5 py-2.5">
              <Search className="h-4 w-4 text-muted-foreground shrink-0 mr-2.5" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Type a task, board, or teammate..."
                className="w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery("")}
                  aria-label="Clear search"
                  className="text-muted-foreground hover:text-foreground p-0.5 rounded"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
              <button
                type="button"
                onClick={handleClose}
                aria-label="Close search"
                className="ml-2 rounded px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground hover:bg-muted border border-border"
              >
                ESC
              </button>
            </div>

            {/* Results List */}
            <div className="max-h-80 overflow-y-auto p-2 divide-y divide-border/40">
              {filteredResults.length === 0 ? (
                <div className="py-8 text-center text-xs text-muted-foreground">
                  No results found for &ldquo;{query}&rdquo;
                </div>
              ) : (
                <div className="space-y-1">
                  <div className="px-2 py-1 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                    {query.trim() ? "Search Results" : "Recent & Suggested"}
                  </div>
                  {filteredResults.map((res) => (
                    <button
                      key={res.id}
                      type="button"
                      onClick={res.action}
                      className="w-full flex items-center justify-between rounded-lg px-2.5 py-2 text-left text-xs transition-colors hover:bg-accent hover:text-accent-foreground group cursor-pointer"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded bg-muted text-muted-foreground group-hover:bg-background">
                          {res.category === "Task" && (
                            <CheckCircle2 className="h-3.5 w-3.5 text-blue-500" />
                          )}
                          {res.category === "Board" && (
                            <Layout className="h-3.5 w-3.5 text-emerald-500" />
                          )}
                          {res.category === "Member" && (
                            <User className="h-3.5 w-3.5 text-purple-500" />
                          )}
                        </div>
                        <div className="min-w-0 truncate">
                          <div className="font-medium text-foreground truncate">
                            {res.title}
                          </div>
                          <div className="text-[11px] text-muted-foreground truncate">
                            {res.meta}
                          </div>
                        </div>
                      </div>
                      <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground shrink-0 uppercase">
                        {res.category}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="border-t border-border bg-muted/40 px-3 py-2 flex items-center justify-between text-[11px] text-muted-foreground">
              <span>Quick Navigation</span>
              <div className="flex items-center gap-2">
                <span>
                  Select: <kbd className="rounded border bg-background px-1 py-0.2">↵</kbd>
                </span>
                <span>
                  Close: <kbd className="rounded border bg-background px-1 py-0.2">Esc</kbd>
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
