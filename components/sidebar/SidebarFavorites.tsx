"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Star, ChevronDown, ChevronRight, Kanban, Smartphone, Calendar } from "lucide-react";

interface FavoriteItem {
  id: string;
  name: string;
  href: string;
  type: "board" | "sprint" | "roadmap";
  icon: React.ComponentType<{ className?: string }>;
}

const FAVORITES: FavoriteItem[] = [
  { id: "fav-1", name: "Sprint 24 - Core Platform", href: "/board/sprint-24", type: "sprint", icon: Kanban },
  { id: "fav-2", name: "Q3 Product Roadmap", href: "/board/q3-roadmap", type: "roadmap", icon: Calendar },
  { id: "fav-3", name: "Mobile App Redesign", href: "/board/mobile-redesign", type: "board", icon: Smartphone },
];

interface SidebarFavoritesProps {
  collapsed?: boolean;
  onItemClick?: () => void;
}

export function SidebarFavorites({ collapsed = false, onItemClick }: SidebarFavoritesProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  if (collapsed) {
    return (
      <div className="px-2 py-1.5 flex flex-col items-center gap-1 border-t border-sidebar-border/60">
        <div title="Favorites" className="text-muted-foreground p-1">
          <Star className="h-3.5 w-3.5" />
        </div>
        {FAVORITES.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.id}
              href={item.href}
              onClick={onItemClick}
              title={item.name}
              className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground transition-colors"
            >
              <Icon className="h-3.5 w-3.5" />
            </Link>
          );
        })}
      </div>
    );
  }

  return (
    <div className="px-2 py-1.5 border-t border-sidebar-border/60">
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        aria-expanded={isExpanded}
        className="w-full flex items-center justify-between px-2 py-1 text-[11px] font-semibold text-muted-foreground hover:text-sidebar-foreground transition-colors uppercase tracking-wider"
      >
        <div className="flex items-center gap-1.5">
          <Star className="h-3 w-3 text-amber-500/80 fill-amber-500/20" />
          <span>Favorites</span>
        </div>
        {isExpanded ? (
          <ChevronDown className="h-3 w-3 text-muted-foreground" />
        ) : (
          <ChevronRight className="h-3 w-3 text-muted-foreground" />
        )}
      </button>

      {isExpanded && (
        <div className="mt-0.5 space-y-0.5">
          {FAVORITES.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.id}
                href={item.href}
                onClick={onItemClick}
                className="group flex items-center gap-2 rounded-md px-2.5 py-1 text-xs text-sidebar-foreground/80 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground transition-colors"
              >
                <Icon className="h-3.5 w-3.5 shrink-0 text-muted-foreground group-hover:text-sidebar-foreground" />
                <span className="truncate">{item.name}</span>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
