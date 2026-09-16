"use client";

import React, { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { X } from "lucide-react";
import { Sidebar } from "../sidebar/Sidebar";
import { Header } from "../header/Header";
import { WorkBoardProvider, useWorkBoard } from "@/lib/context/WorkBoardContext";
import { MondaySlideOver } from "@/components/tasks/MondaySlideOver";
import { CreateTaskModal } from "@/components/tasks/CreateTaskModal";
import { InviteMemberModal } from "@/components/team/InviteMemberModal";
import { InviteBoardMemberModal } from "@/components/board/InviteBoardMemberModal";
import { CreateBoardModal } from "@/components/board/CreateBoardModal";
import { CreateFolderModal } from "@/components/sidebar/CreateFolderModal";
import { CreateDashboardModal } from "@/components/dashboard/CreateDashboardModal";
import { CreateWorkspaceModal } from "@/components/workspace/CreateWorkspaceModal";
import { BrowseWorkspacesModal } from "@/components/workspace/BrowseWorkspacesModal";

interface AppShellProps {
  children: React.ReactNode;
}

function AppShellInner({ children }: AppShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { isAuthenticated, isHydrated } = useWorkBoard();

  const isAuthPage =
    pathname === "/login" ||
    pathname === "/register" ||
    pathname === "/reset" ||
    (pathname?.startsWith("/invite") ?? false);

  // Redirect to login if not authenticated. Wait for isHydrated first —
  // isAuthenticated starts false on every mount/refresh until the session
  // is restored from localStorage, so redirecting before that finishes
  // would bounce an already-logged-in user straight back to /login.
  useEffect(() => {
    if (isHydrated && !isAuthenticated && !isAuthPage) {
      router.replace("/login");
    }
  }, [isHydrated, isAuthenticated, isAuthPage, router]);

  // Dragging a file (e.g. an image) onto the page anywhere outside an
  // actual drop zone is the browser's cue to navigate the whole tab to
  // that file, replacing the app — it looks exactly like the page
  // "freezing". Our own drop targets (folder rows, photo attach fields)
  // already call preventDefault() themselves; this is just the safety net
  // for everywhere else, so a stray drop never blows away the app.
  useEffect(() => {
    const blockDefaultFileDrop = (e: DragEvent) => {
      e.preventDefault();
    };
    window.addEventListener("dragover", blockDefaultFileDrop);
    window.addEventListener("drop", blockDefaultFileDrop);
    return () => {
      window.removeEventListener("dragover", blockDefaultFileDrop);
      window.removeEventListener("drop", blockDefaultFileDrop);
    };
  }, []);

  // Desktop sidebar collapsed state
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  // Mobile drawer open state
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  // Close mobile drawer on Escape key
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && mobileDrawerOpen) {
        setMobileDrawerOpen(false);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [mobileDrawerOpen]);

  // Lock body scroll when mobile drawer is open
  useEffect(() => {
    if (mobileDrawerOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileDrawerOpen]);

  const toggleSidebarCollapse = () => {
    setSidebarCollapsed((prev) => !prev);
  };

  const closeMobileDrawer = () => {
    setMobileDrawerOpen(false);
  };

  const openMobileDrawer = () => {
    setMobileDrawerOpen(true);
  };

  // If on Login or Register page, show clean standalone full-screen page
  if (isAuthPage) {
    return (
      <div className="h-screen w-screen overflow-y-auto bg-[#111322] text-foreground">
        {children}
      </div>
    );
  }

  // Show nothing while redirecting to login
  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-background text-foreground">
      {/* 1. Desktop & Tablet Sidebar (Persistent) */}
      <div className="hidden md:flex h-full shrink-0">
        <Sidebar
          collapsed={sidebarCollapsed}
          onToggleCollapse={toggleSidebarCollapse}
        />
      </div>

      {/* 2. Mobile Navigation Drawer (Slide-in) */}
      {mobileDrawerOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Mobile Navigation"
          className="fixed inset-0 z-50 flex md:hidden"
        >
          {/* Backdrop with fade-in */}
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in"
            onClick={closeMobileDrawer}
            aria-hidden="true"
          />

          {/* Drawer content sliding from left */}
          <div className="relative flex w-72 max-w-[85vw] flex-col bg-sidebar shadow-2xl z-10 animate-in slide-in-from-left duration-200">
            {/* Close button inside drawer */}
            <button
              type="button"
              onClick={closeMobileDrawer}
              aria-label="Close navigation drawer"
              className="absolute top-3 right-3 flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring z-20"
            >
              <X className="h-4 w-4" />
            </button>

            {/* Sidebar content in mobile drawer */}
            <Sidebar
              collapsed={false}
              onToggleCollapse={closeMobileDrawer}
              onItemClick={closeMobileDrawer}
              className="border-r-0 w-full"
            />
          </div>
        </div>
      )}

      {/* 3. Main Column: Header + Scrollable Content */}
      <div className="flex flex-1 flex-col min-w-0 h-full overflow-hidden">
        <Header onOpenMobileSidebar={openMobileDrawer} />

        <main
          role="main"
          className="flex-1 overflow-y-auto overflow-x-hidden bg-background"
        >
          {children}
        </main>
      </div>

      {/* Global Modals & Slide-Over Drawer */}
      <MondaySlideOver />
      <CreateTaskModal />
      <InviteMemberModal />
      <InviteBoardMemberModal />
      <CreateBoardModal />
      <CreateFolderModal />
      <CreateDashboardModal />
      <CreateWorkspaceModal />
      <BrowseWorkspacesModal />
    </div>
  );
}

export function AppShell({ children }: AppShellProps) {
  return (
    <WorkBoardProvider>
      <AppShellInner>{children}</AppShellInner>
    </WorkBoardProvider>
  );
}
