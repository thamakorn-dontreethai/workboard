"use client";

import React, { useRef, useState } from "react";
import { TaskStatus, TASK_STATUS_CONFIG } from "@/types";
import { Check, ChevronDown } from "lucide-react";
import { FloatingPanel } from "@/components/board/FloatingPanel";

interface StatusDropdownProps {
  currentStatus: TaskStatus;
  onStatusChange: (status: TaskStatus) => void;
  // Read-only: shows the status but can't be opened (no permission to change it).
  disabled?: boolean;
}

const statusList: TaskStatus[] = ["in_progress", "blocked", "done", "todo"];

export function StatusDropdown({
  currentStatus,
  onStatusChange,
  disabled = false,
}: StatusDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const currentConfig = TASK_STATUS_CONFIG[currentStatus] || {
    label: currentStatus,
    bgColor: "bg-[#575a6b]",
    color: "text-zinc-200",
  };

  // "todo" is the blank/default status — monday.com shows it as an empty
  // colored block with no label rather than literally printing "To Do".
  const isBlankStatus = currentStatus === "todo";

  return (
    <div className="w-full">
      <button
        ref={buttonRef}
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen((v) => !v)}
        className={`w-full py-1.5 px-2 rounded font-medium text-xs transition-all shadow-xs text-center flex items-center justify-center gap-1 ${currentConfig.bgColor} ${currentConfig.color} ${disabled ? "cursor-default" : ""}`}
      >
        {!isBlankStatus && (
          <>
            {currentConfig.label || "—"}
            <ChevronDown className="h-3 w-3" />
          </>
        )}
      </button>

      <FloatingPanel
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        anchorRef={buttonRef}
        align="left"
        className="w-56 rounded-xl border border-zinc-700 bg-[#1c1e28] p-2 shadow-2xl"
      >
        {statusList.map((st) => {
          const cfg = TASK_STATUS_CONFIG[st];
          const isSelected = st === currentStatus;
          const isBlank = st === "todo";
          return (
            <button
              key={st}
              type="button"
              onClick={() => {
                onStatusChange(st);
                setIsOpen(false);
              }}
              className={`w-full py-2 px-3 rounded-lg text-xs font-semibold mb-1 text-center transition-all flex items-center justify-between ${
                isSelected ? "ring-2 ring-white" : ""
              } ${cfg.bgColor} ${cfg.color}`}
            >
              <span>{isBlank ? "" : cfg.label}</span>
              {isSelected && <Check className="h-3.5 w-3.5" />}
            </button>
          );
        })}
        <div className="mt-2 pt-2 border-t border-zinc-700/50">
          <button
            type="button"
            disabled
            className="w-full py-1.5 px-3 text-xs text-zinc-400 hover:text-zinc-300 transition-colors text-left flex items-center gap-2"
          >
            ✏️ Edit Labels
          </button>
        </div>
      </FloatingPanel>
    </div>
  );
}
