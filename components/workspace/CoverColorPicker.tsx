"use client";

import React, { useRef, useEffect, useState } from "react";
import { COVER_PALETTE } from "./workspace-theme";
import { Upload, Check, X, ImageIcon } from "lucide-react";

interface CoverColorPickerProps {
  currentCover: string;
  onSelectCover: (coverStyle: string) => void;
  onClose: () => void;
}

export function CoverColorPicker({
  currentCover,
  onSelectCover,
  onClose,
}: CoverColorPickerProps) {
  const popoverRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

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

  // Read a File object → base64 data URL, then pass up via custom-image: prefix
  const applyFile = (file: File) => {
    if (!file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      setPreviewUrl(dataUrl);
      // Store as marker so workspace page applies it via inline style (no Tailwind JIT)
      onSelectCover(`custom-image:${dataUrl}`);
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

  const isCustomImage = currentCover.startsWith("custom-image:");

  return (
    <div
      ref={popoverRef}
      className="absolute right-0 top-full mt-2 w-[340px] sm:w-[380px] rounded-2xl border border-zinc-700/90 bg-[#1c1e28] p-4 shadow-2xl text-zinc-100 z-50 animate-in fade-in zoom-in-95 duration-150 select-none"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3 pb-2 border-b border-zinc-800/80">
        <span className="text-xs font-bold text-white tracking-tight">
          Cover
        </span>
        <button
          type="button"
          onClick={onClose}
          className="text-zinc-400 hover:text-white p-1 rounded-md hover:bg-zinc-800 transition-colors"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Section: Colors */}
      <p className="text-[10px] font-semibold text-zinc-500 uppercase tracking-widest mb-2">
        Colors
      </p>
      <div className="grid grid-cols-11 gap-1.5 sm:gap-2">
        {COVER_PALETTE.map((c) => {
          const isSelected = currentCover === c.style;
          const isWhite = c.id === "c-white";

          return (
            <button
              key={c.id}
              type="button"
              onClick={() => {
                onSelectCover(c.style);
                onClose();
              }}
              title={c.name}
              className={`group relative h-6 w-6 sm:h-7 sm:w-7 rounded-lg transition-all hover:scale-110 flex items-center justify-center cursor-pointer shadow-xs ${
                c.style
              } ${
                isWhite
                  ? "border border-zinc-400/80 ring-1 ring-zinc-700/50"
                  : "border border-black/10"
              } ${
                isSelected
                  ? "ring-2 ring-[#0073ea] ring-offset-2 ring-offset-[#1c1e28] scale-105 shadow-md"
                  : ""
              }`}
            >
              {isSelected && (
                <Check
                  className={`h-3 w-3 stroke-[3] ${
                    isWhite || !c.isDark ? "text-zinc-900" : "text-white"
                  }`}
                />
              )}
            </button>
          );
        })}
      </div>

      {/* Section: Photo from PC */}
      <div className="mt-4 pt-3 border-t border-zinc-800/80">
        <div className="flex items-center justify-between mb-2">
          <p className="text-[10px] font-semibold text-zinc-500 uppercase tracking-widest">
            Photo
          </p>
          {isCustomImage && (
            <span className="text-[10px] text-emerald-400 font-medium flex items-center gap-1">
              <Check className="h-3 w-3" /> Custom photo applied
            </span>
          )}
        </div>

        {/* Drop zone / file picker */}
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`relative flex flex-col items-center justify-center gap-2 h-20 rounded-xl border-2 border-dashed cursor-pointer transition-all ${
            isDragging
              ? "border-[#0073ea] bg-[#0073ea]/10"
              : "border-zinc-700 hover:border-zinc-500 hover:bg-zinc-800/50"
          }`}
        >
          <ImageIcon className="h-5 w-5 text-zinc-500" />
          <span className="text-[11px] text-zinc-400">
            <span className="text-[#57b6ff] font-semibold">
              Click to upload
            </span>{" "}
            or drag &amp; drop
          </span>
          <span className="text-[10px] text-zinc-600">
            PNG, JPG, GIF, WEBP
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

        {/* Upload button shortcut */}
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
