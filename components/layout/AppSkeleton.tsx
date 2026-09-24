import React from "react";

/**
 * Stand-in shown while the app is still pulling its data down.
 *
 * Without it the shell rendered `null` until everything had arrived, so a
 * slow connection looked like a blank page rather than a loading one. The
 * shapes deliberately echo the real layout — sidebar, header, rows — so the
 * screen settles into place instead of flashing to a different arrangement
 * the moment the data lands.
 *
 * Pure CSS, no JS: the whole point is that this renders before anything else
 * is ready.
 */

function Bar({ className = "" }: { className?: string }) {
  return <div className={`rounded-md bg-muted animate-pulse ${className}`} />;
}

/** Content-only skeleton, for when the shell chrome is already on screen. */
export function ContentSkeleton() {
  return (
    <div className="p-4 sm:p-6 space-y-6" aria-hidden="true">
      <div className="space-y-2">
        <Bar className="h-6 w-48" />
        <Bar className="h-3.5 w-72 max-w-full" />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <Bar key={i} className="h-20" />
        ))}
      </div>

      <div className="rounded-xl border border-border overflow-hidden">
        <div className="border-b border-border px-4 py-3">
          <Bar className="h-4 w-40" />
        </div>
        <div className="divide-y divide-border">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 px-4 py-3">
              <Bar className="h-4 w-4 rounded-full shrink-0" />
              <Bar className="h-3.5 flex-1" />
              <Bar className="h-5 w-16 rounded-full shrink-0 hidden sm:block" />
              <Bar className="h-6 w-6 rounded-full shrink-0" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/** Whole-screen skeleton, including the sidebar and header chrome. */
export function AppSkeleton() {
  return (
    <div
      className="flex h-viewport w-full overflow-hidden bg-background"
      role="status"
      aria-live="polite"
      aria-label="Loading WorkBoard"
    >
      <span className="sr-only">Loading…</span>

      {/* Sidebar — hidden on phones, matching the real layout's breakpoint */}
      <div
        className="hidden md:flex w-60 shrink-0 flex-col gap-1.5 border-r border-border bg-sidebar p-3"
        aria-hidden="true"
      >
        <Bar className="h-8 w-full mb-3" />
        {Array.from({ length: 7 }).map((_, i) => (
          <Bar key={i} className="h-7 w-full" />
        ))}
      </div>

      <div className="flex flex-1 flex-col min-w-0">
        <div
          className="flex h-14 shrink-0 items-center justify-between border-b border-border px-3 sm:px-4"
          aria-hidden="true"
        >
          <div className="flex items-center gap-2">
            <Bar className="h-8 w-8 md:hidden" />
            <Bar className="h-4 w-32" />
          </div>
          <div className="flex items-center gap-2">
            <Bar className="h-7 w-7 rounded-full" />
            <Bar className="h-7 w-7 rounded-full" />
          </div>
        </div>

        <div className="flex-1 overflow-hidden">
          <ContentSkeleton />
        </div>
      </div>
    </div>
  );
}
