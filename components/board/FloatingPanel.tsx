"use client";

import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

interface FloatingPanelProps {
  isOpen: boolean;
  onClose: () => void;
  anchorRef: React.RefObject<HTMLElement | null>;
  children: React.ReactNode;
  align?: "left" | "right";
  className?: string;
}

const GAP = 6;
const VIEWPORT_MARGIN = 8;

/**
 * Renders its children into document.body (via portal) and positions them
 * as a fixed-position panel anchored to `anchorRef`. This escapes any
 * `overflow: hidden/auto` ancestor (e.g. the board table's horizontal
 * scroll wrapper) that would otherwise clip an absolutely-positioned
 * dropdown. Flips above the anchor and clamps within the viewport when
 * there isn't enough room below / to the side.
 */
export function FloatingPanel({
  isOpen,
  onClose,
  anchorRef,
  children,
  align = "left",
  className = "",
}: FloatingPanelProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);
  const [style, setStyle] = useState<React.CSSProperties>({ visibility: "hidden" });

  useEffect(() => setMounted(true), []);

  useLayoutEffect(() => {
    if (!isOpen) return;

    function reposition() {
      const anchorEl = anchorRef.current;
      const panelEl = panelRef.current;
      if (!anchorEl) return;

      const anchorRect = anchorEl.getBoundingClientRect();
      const panelRect = panelEl?.getBoundingClientRect();
      const panelHeight = panelRect?.height ?? 0;
      const panelWidth = panelRect?.width ?? 0;

      const spaceBelow = window.innerHeight - anchorRect.bottom;
      const openUpward =
        spaceBelow < panelHeight + GAP && anchorRect.top > panelHeight + GAP;

      const top = openUpward
        ? Math.max(VIEWPORT_MARGIN, anchorRect.top - panelHeight - GAP)
        : anchorRect.bottom + GAP;

      let left = align === "right" ? anchorRect.right - panelWidth : anchorRect.left;
      left = Math.max(
        VIEWPORT_MARGIN,
        Math.min(left, window.innerWidth - panelWidth - VIEWPORT_MARGIN)
      );

      setStyle({ position: "fixed", top, left, visibility: "visible" });
    }

    // Measure/position now, then again next frame once the panel has
    // actually rendered at real size (first pass has no panel size yet).
    reposition();
    const raf = requestAnimationFrame(reposition);

    window.addEventListener("scroll", reposition, true);
    window.addEventListener("resize", reposition);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", reposition, true);
      window.removeEventListener("resize", reposition);
    };
  }, [isOpen, anchorRef, align]);

  useEffect(() => {
    if (!isOpen) {
      setStyle({ visibility: "hidden" });
      return;
    }
    function handleClickOutside(e: MouseEvent) {
      const target = e.target as Node;
      if (
        panelRef.current &&
        !panelRef.current.contains(target) &&
        anchorRef.current &&
        !anchorRef.current.contains(target)
      ) {
        onClose();
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen, onClose, anchorRef]);

  if (!mounted || !isOpen) return null;

  return createPortal(
    <div
      ref={panelRef}
      style={style}
      className={`z-[9999] animate-in fade-in zoom-in-95 ${className}`}
    >
      {children}
    </div>,
    document.body
  );
}
