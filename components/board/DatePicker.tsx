"use client";

import React, { useRef, useState } from "react";
import { Calendar, ChevronLeft, ChevronRight } from "lucide-react";
import { formatDate } from "@/lib/utils/date";
import { FloatingPanel } from "@/components/board/FloatingPanel";

interface DatePickerProps {
  currentDate: Date | null;
  onDateChange: (date: Date | null) => void;
  // Read-only: shows the date but can't be opened (no permission to change it).
  disabled?: boolean;
}

export function DatePicker({ currentDate, onDateChange, disabled = false }: DatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [viewDate, setViewDate] = useState(currentDate || new Date());
  const buttonRef = useRef<HTMLButtonElement>(null);

  const year = viewDate.getFullYear();
  const firstDay = new Date(year, viewDate.getMonth(), 1);
  const lastDay = new Date(year, viewDate.getMonth() + 1, 0);
  const daysInMonth = lastDay.getDate();
  const startingDayOfWeek = firstDay.getDay();

  const days: (Date | null)[] = [];
  for (let i = 0; i < startingDayOfWeek; i++) days.push(null);
  for (let i = 1; i <= daysInMonth; i++) days.push(new Date(year, viewDate.getMonth(), i));

  const handlePrevMonth = () => setViewDate(new Date(year, viewDate.getMonth() - 1, 1));
  const handleNextMonth = () => setViewDate(new Date(year, viewDate.getMonth() + 1, 1));

  const handleSelectDate = (date: Date) => {
    onDateChange(date);
    setIsOpen(false);
  };

  const handleToday = () => {
    const today = new Date();
    onDateChange(today);
    setViewDate(today);
    setIsOpen(false);
  };

  const isSameMonth =
    currentDate &&
    currentDate.getMonth() === viewDate.getMonth() &&
    currentDate.getFullYear() === viewDate.getFullYear();

  return (
    <div className="w-full">
      <button
        ref={buttonRef}
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen((v) => !v)}
        className={`w-full flex items-center justify-center gap-2 py-1.5 px-2 rounded-lg border border-zinc-700 bg-zinc-900/50 text-xs text-zinc-300 transition-colors ${
          disabled ? "cursor-default" : "hover:text-white hover:bg-zinc-800"
        }`}
      >
        <Calendar className="h-3.5 w-3.5" />
        <span>{currentDate ? formatDate(currentDate) : "No date"}</span>
      </button>

      <FloatingPanel
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        anchorRef={buttonRef}
        align="right"
        className="w-80 rounded-xl border border-zinc-700 bg-[#1c1e28] p-4 shadow-2xl"
      >
        {/* Today button */}
        <div className="mb-3 pb-3 border-b border-zinc-700">
          <button
            type="button"
            onClick={handleToday}
            className="inline-block px-2 py-1 rounded-md bg-zinc-800 text-xs text-zinc-200 hover:bg-zinc-700 transition-colors font-medium"
          >
            Today
          </button>
        </div>

        {/* Date display */}
        <div className="mb-3">
          <input
            type="text"
            value={currentDate ? formatDate(currentDate) : ""}
            readOnly
            className="w-full px-3 py-2 rounded-lg border border-zinc-700 bg-zinc-900/50 text-sm text-white text-center font-medium"
          />
        </div>

        {/* Calendar */}
        <div className="space-y-3">
          {/* Month/Year selector */}
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={handlePrevMonth}
              className="p-1 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <div className="flex items-center gap-2">
              <select
                value={viewDate.getMonth()}
                onChange={(e) => setViewDate(new Date(year, parseInt(e.target.value), 1))}
                className="px-2 py-1 rounded-lg border border-zinc-700 bg-zinc-900/50 text-xs text-white focus:outline-none focus:border-[#0073ea]"
              >
                {Array.from({ length: 12 }, (_, i) => (
                  <option key={i} value={i}>
                    {new Date(2024, i).toLocaleString("default", { month: "short" })}
                  </option>
                ))}
              </select>
              <select
                value={year}
                onChange={(e) =>
                  setViewDate(new Date(parseInt(e.target.value), viewDate.getMonth(), 1))
                }
                className="px-2 py-1 rounded-lg border border-zinc-700 bg-zinc-900/50 text-xs text-white focus:outline-none focus:border-[#0073ea]"
              >
                {Array.from({ length: 10 }, (_, i) => (
                  <option key={i} value={year - 5 + i}>
                    {year - 5 + i}
                  </option>
                ))}
              </select>
            </div>
            <button
              type="button"
              onClick={handleNextMonth}
              className="p-1 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          {/* Calendar grid */}
          <div className="grid grid-cols-7 gap-1">
            {["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"].map((day) => (
              <div key={day} className="text-center text-xs font-semibold text-zinc-500 py-1">
                {day}
              </div>
            ))}
            {days.map((day, idx) => {
              const isTodayCell = day && day.toDateString() === new Date().toDateString();
              const isSelectedCell = day && day.getDate() === viewDate.getDate() && isSameMonth;
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => day && handleSelectDate(day)}
                  disabled={!day}
                  className={`py-2 rounded-lg text-xs font-medium transition-colors ${
                    !day
                      ? "text-transparent cursor-default"
                      : isSelectedCell
                      ? "bg-[#0073ea] text-white"
                      : isTodayCell
                      ? "bg-orange-500/20 text-orange-400"
                      : "text-zinc-300 hover:bg-zinc-800"
                  }`}
                >
                  {day?.getDate()}
                </button>
              );
            })}
          </div>

          {/* Autofill date (disabled) */}
          <div className="pt-2 border-t border-zinc-700/50">
            <button
              type="button"
              disabled
              className="w-full flex items-center justify-center gap-2 py-1.5 text-xs text-zinc-400 hover:text-zinc-300 transition-colors"
            >
              <span>✨ Autofill date</span>
            </button>
          </div>
        </div>
      </FloatingPanel>
    </div>
  );
}
