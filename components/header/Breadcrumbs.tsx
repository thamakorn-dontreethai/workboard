"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight, Home } from "lucide-react";

export function Breadcrumbs() {
  const pathname = usePathname();

  // Generate readable crumbs from pathname
  const segments = pathname.split("/").filter(Boolean);

  const getLabel = (seg: string) => {
    switch (seg) {
      case "my-work":
        return "My Work";
      case "inbox":
        return "Inbox";
      case "favorites":
        return "Favorites";
      case "projects":
      case "boards":
        return "Projects";
      case "settings":
        return "Settings";
      case "board":
        return "Board";
      case "sprint-24":
        return "Sprint 24 - Core Platform";
      case "q3-roadmap":
        return "Q3 Product Roadmap";
      case "mobile-redesign":
        return "Mobile App Redesign";
      default:
        return seg.charAt(0).toUpperCase() + seg.slice(1).replace(/-/g, " ");
    }
  };

  return (
    <nav aria-label="Breadcrumbs" className="flex items-center space-x-1.5 text-xs text-muted-foreground">
      <Link
        href="/"
        className="flex items-center gap-1 hover:text-foreground transition-colors font-medium"
      >
        <Home className="h-3.5 w-3.5" />
        <span className="hidden sm:inline">Acme Engineering</span>
      </Link>

      {segments.length === 0 ? (
        <>
          <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/50 shrink-0" aria-hidden="true" />
          <span className="font-semibold text-foreground">Overview</span>
        </>
      ) : (
        segments.map((seg, idx) => {
          const isLast = idx === segments.length - 1;
          const href = "/" + segments.slice(0, idx + 1).join("/");

          return (
            <React.Fragment key={seg}>
              <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/50 shrink-0" aria-hidden="true" />
              {isLast ? (
                <span className="font-semibold text-foreground truncate max-w-[180px] sm:max-w-[260px]">
                  {getLabel(seg)}
                </span>
              ) : (
                <Link href={href} className="hover:text-foreground transition-colors truncate max-w-[120px]">
                  {getLabel(seg)}
                </Link>
              )}
            </React.Fragment>
          );
        })
      )}
    </nav>
  );
}
