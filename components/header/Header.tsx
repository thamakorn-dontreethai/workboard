"use client";

import React from "react";
import { Menu } from "lucide-react";
import { Breadcrumbs } from "./Breadcrumbs";
import { NotificationsMenu } from "./NotificationsMenu";
import { UserMenu } from "./UserMenu";
import { ThemeToggle } from "../layout/ThemeToggle";

interface HeaderProps {
  onOpenMobileSidebar: () => void;
}

export function Header({ onOpenMobileSidebar }: HeaderProps) {
  return (
    <header
      role="banner"
      className="sticky top-0 z-30 flex h-14 w-full items-center justify-between border-b border-border bg-background/95 px-3 sm:px-4 backdrop-blur-xs select-none"
    >
      {/* Left side: Mobile menu toggle + Breadcrumbs */}
      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
        <button
          type="button"
          onClick={onOpenMobileSidebar}
          aria-label="Open navigation sidebar"
          className="flex md:hidden h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <Menu className="h-5 w-5" />
        </button>

        <Breadcrumbs />
      </div>

      {/* Right side: Notifications, Theme toggle, User Menu */}
      <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
        <NotificationsMenu />

        <ThemeToggle />

        <div className="h-4 w-px bg-border mx-0.5 sm:mx-1" />

        <UserMenu />
      </div>
    </header>
  );
}
