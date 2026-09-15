"use client";

import React from "react";
import { AVATAR_ICON_LIST, OrigamiBirdIcon } from "./workspace-theme";

interface WorkspaceAvatarProps {
  name?: string;
  avatarColor?: string;
  icon?: string;
  className?: string;
  size?: "sm" | "md" | "lg" | "xl" | "2xl";
}

export function WorkspaceAvatar({
  name = "Workspace",
  avatarColor = "bg-[#57b6ff]",
  icon = "initial",
  className = "",
  size = "md",
}: WorkspaceAvatarProps) {
  const initial = (name || "W").trim().charAt(0).toUpperCase();

  const sizeClasses = {
    sm: "h-6 w-6 rounded-lg text-xs",
    md: "h-8 w-8 rounded-xl text-sm",
    lg: "h-14 w-14 rounded-2xl text-2xl",
    xl: "h-20 w-20 rounded-2xl text-3xl",
    "2xl": "h-[100px] w-[100px] rounded-2xl text-5xl font-medium",
  };

  const iconSizeClasses = {
    sm: "h-3.5 w-3.5",
    md: "h-4 w-4",
    lg: "h-7 w-7",
    xl: "h-9 w-9",
    "2xl": "h-12 w-12",
  };

  // Handle custom uploaded image (stored as "custom:<dataUrl>")
  if (icon && icon.startsWith("custom:")) {
    const imgSrc = icon.slice("custom:".length);
    return (
      <div
        className={`flex items-center justify-center overflow-hidden shadow-md select-none shrink-0 ${sizeClasses[size]} ${className}`}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={imgSrc}
          alt={name}
          className="w-full h-full object-cover"
        />
      </div>
    );
  }

  const selectedIcon = AVATAR_ICON_LIST.find((i) => i.id === icon);

  // Normalize avatarColor (hex vs Tailwind class)
  const bgStyle = avatarColor.startsWith("#")
    ? { backgroundColor: avatarColor }
    : undefined;
  const bgClass = avatarColor.startsWith("#") ? "" : avatarColor;

  return (
    <div
      style={bgStyle}
      className={`flex items-center justify-center font-bold text-white shadow-md select-none shrink-0 ${sizeClasses[size]} ${bgClass} ${className}`}
    >
      {(!selectedIcon || selectedIcon.type === "initial") && (
        <span className="leading-none">{initial}</span>
      )}

      {selectedIcon?.type === "origami" && (
        <OrigamiBirdIcon className={iconSizeClasses[size]} />
      )}

      {selectedIcon?.type === "component" && selectedIcon.component && (
        <selectedIcon.component className={iconSizeClasses[size]} />
      )}
    </div>
  );
}
