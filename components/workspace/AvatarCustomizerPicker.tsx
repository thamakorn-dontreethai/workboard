"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  AVATAR_COLOR_PALETTE,
  AVATAR_ICON_LIST,
  OrigamiBirdIcon,
} from "./workspace-theme";
import { Check, Upload, X, ImageIcon } from "lucide-react";

interface AvatarCustomizerPickerProps {
  currentColor: string;
  currentIcon?: string;
  workspaceName?: string;
  onSelectColor: (colorClass: string) => void;
  onSelectIcon: (iconId: string) => void;
  onClose: () => void;
}

export function AvatarCustomizerPicker({
  currentColor,
  currentIcon = "initial",
  workspaceName = "Workspace",
  onSelectColor,
  onSelectIcon,
  onClose,
}: AvatarCustomizerPickerProps) {
  const [selectedColor, setSelectedColor] = useState(currentColor || "bg-[#57b6ff]");
  const [selectedIconId, setSelectedIconId] = useState(currentIcon || "initial");
  const [isDragging, setIsDragging] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const initialLetter = (workspaceName || "W").trim().charAt(0).toUpperCase();

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(event.target as Node)
      ) {
        onClose();
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onClose]);

  const handleColorClick = (colorClass: string) => {
    setSelectedColor(colorClass);
    onSelectColor(colorClass);
  };

  const handleIconClick = (iconId: string) => {
    setSelectedIconId(iconId);
    onSelectIcon(iconId);
  };

  // Convert selected file → base64 data URL, store as custom:data:...
  const applyFile = (file: File) => {
    if (!file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      onSelectIcon(`custom:${dataUrl}`);
      setSelectedIconId(`custom:${dataUrl}`);
      onClose();
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) applyFile(file);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) applyFile(file);
  };

  const isCustomLogo = selectedIconId.startsWith("custom:");

  // Divide 21 colors into 3 rows (8, 8, 5)
  const row1 = AVATAR_COLOR_PALETTE.slice(0, 8);
  const row2 = AVATAR_COLOR_PALETTE.slice(8, 16);
  const row3 = AVATAR_COLOR_PALETTE.slice(16, 21);

  const colorRow = (colors: typeof AVATAR_COLOR_PALETTE, justify = "between") => (
    <div className={`flex items-center ${justify === "between" ? "justify-between" : ""} gap-2`}>
      {colors.map((c) => {
        const isSelected = selectedColor === c.bgClass || selectedColor === c.hex;
        return (
          <button
            key={c.id}
            type="button"
            onClick={() => handleColorClick(c.bgClass)}
            title={c.name}
            className={`relative h-7 w-7 rounded-full transition-transform hover:scale-115 flex items-center justify-center cursor-pointer shadow-xs ${
              c.bgClass
            } ${
              isSelected
                ? "ring-2 ring-[#57b6ff] ring-offset-2 ring-offset-[#222430] scale-110 shadow-md"
                : ""
            }`}
          >
            {isSelected && (
              <Check className="h-3 w-3 text-white stroke-[3.5]" />
            )}
          </button>
        );
      })}
    </div>
  );

  return (
    <div
      ref={popoverRef}
      className="absolute left-0 top-full mt-2 w-[320px] rounded-2xl border border-zinc-700/90 bg-[#222430] p-4 shadow-2xl text-zinc-100 z-50 animate-in fade-in zoom-in-95 duration-150 select-none"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3 pb-1 border-b border-zinc-800/80">
        <span className="text-xs font-bold text-zinc-300 tracking-tight">
          Customize icon
        </span>
        <button
          type="button"
          onClick={onClose}
          className="text-zinc-400 hover:text-white p-1 rounded-md hover:bg-zinc-800 transition-colors"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* ─── 1. BACKGROUND COLOR CIRCLES ─────────────────────────────────────── */}
      <p className="text-[10px] font-semibold text-zinc-500 uppercase tracking-widest mb-2">
        Background color
      </p>
      <div className="space-y-2">
        {colorRow(row1, "between")}
        {colorRow(row2, "between")}
        {colorRow(row3, "start")}
      </div>

      {/* ─── 2. ICON GRID ────────────────────────────────────────────────────── */}
      <div className="mt-4 pt-3 border-t border-zinc-800/80">
        <p className="text-[10px] font-semibold text-zinc-500 uppercase tracking-widest mb-2.5">
          Icon
        </p>
        <div className="grid grid-cols-4 gap-2.5">
          {AVATAR_ICON_LIST.map((iconItem) => {
            const isSelected = selectedIconId === iconItem.id;
            return (
              <button
                key={iconItem.id}
                type="button"
                onClick={() => handleIconClick(iconItem.id)}
                title={iconItem.name}
                className={`group relative h-14 w-14 rounded-2xl transition-all hover:scale-110 flex items-center justify-center cursor-pointer shadow-sm text-white ${selectedColor} ${
                  isSelected
                    ? "ring-2 ring-white ring-offset-2 ring-offset-[#222430] scale-105 shadow-lg"
                    : "opacity-90 hover:opacity-100"
                }`}
              >
                {iconItem.type === "initial" && (
                  <span className="font-bold text-base leading-none">
                    {initialLetter}
                  </span>
                )}
                {iconItem.type === "origami" && (
                  <OrigamiBirdIcon className="h-5 w-5" />
                )}
                {iconItem.type === "component" && iconItem.component && (
                  <iconItem.component className="h-5 w-5" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ─── 3. UPLOAD FROM PC ───────────────────────────────────────────────── */}
      <div className="mt-4 pt-3 border-t border-zinc-800/80">
        <div className="flex items-center justify-between mb-2">
          <p className="text-[10px] font-semibold text-zinc-500 uppercase tracking-widest">
            Custom logo
          </p>
          {isCustomLogo && (
            <span className="text-[10px] text-emerald-400 font-medium flex items-center gap-1">
              <Check className="h-3 w-3" /> Applied
            </span>
          )}
        </div>

        {/* Drop zone */}
        <div
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`flex flex-col items-center justify-center gap-1.5 h-16 rounded-xl border-2 border-dashed cursor-pointer transition-all ${
            isDragging
              ? "border-[#57b6ff] bg-[#57b6ff]/10"
              : "border-zinc-700 hover:border-zinc-500 hover:bg-zinc-800/50"
          }`}
        >
          <ImageIcon className="h-4 w-4 text-zinc-500" />
          <span className="text-[11px] text-zinc-400 text-center">
            <span className="text-[#57b6ff] font-semibold">Click</span> or drag &amp; drop
          </span>
        </div>

        {/* Hidden native file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
        />

        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="mt-2 w-full flex items-center justify-center gap-1.5 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs text-zinc-300 hover:text-white font-medium transition-colors cursor-pointer"
        >
          <Upload className="h-3.5 w-3.5" />
          Upload from computer
        </button>
      </div>
    </div>
  );
}
