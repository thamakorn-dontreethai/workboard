import React from "react";
import {
  Zap,
  Brain,
  MessageCircle,
  Settings,
  Crown,
  Gem,
  DollarSign,
  Flag,
  Flame,
  Folder,
  Globe,
  Heart,
  Home,
  User,
  Shield,
  Sun,
  Wrench,
  Users,
} from "lucide-react";

// ─── 1. COVER COLORS & GRADIENTS (Exact 33 Options from Monday.com) ─────────

export interface CoverOption {
  id: string;
  name: string;
  style: string;
  hex?: string;
  isDark?: boolean;
}

export const COVER_PALETTE: CoverOption[] = [
  // ── Row 1: Solid Colors (11) ──
  { id: "c-white", name: "Pure White", style: "bg-white", hex: "#ffffff", isDark: false },
  { id: "c-emerald", name: "Bright Emerald", style: "bg-[#00ca72]", hex: "#00ca72", isDark: true },
  { id: "c-amber", name: "Vibrant Yellow", style: "bg-[#ffcb00]", hex: "#ffcb00", isDark: false },
  { id: "c-blue", name: "Monday Blue", style: "bg-[#0073ea]", hex: "#0073ea", isDark: true },
  { id: "c-rose", name: "Coral Red", style: "bg-[#fb275d]", hex: "#fb275d", isDark: true },
  { id: "c-purple", name: "Amethyst Purple", style: "bg-[#a25ddc]", hex: "#a25ddc", isDark: true },
  { id: "c-charcoal", name: "Dark Charcoal", style: "bg-[#292f4c]", hex: "#292f4c", isDark: true },
  { id: "c-orange", name: "Warm Amber", style: "bg-[#fdab3d]", hex: "#fdab3d", isDark: false },
  { id: "c-sky", name: "Sky Blue", style: "bg-[#57b6ff]", hex: "#57b6ff", isDark: false },
  { id: "c-magenta", name: "Hot Magenta", style: "bg-[#ff158a]", hex: "#ff158a", isDark: true },
  { id: "c-lime", name: "Lime Green", style: "bg-[#9cd326]", hex: "#9cd326", isDark: false },

  // ── Row 2: Solid Colors (11) ──
  { id: "c-chalk", name: "Soft Chalk", style: "bg-[#f5f6f8]", hex: "#f5f6f8", isDark: false },
  { id: "c-pastel-blue", name: "Pastel Cyan", style: "bg-[#6ec8ff]", hex: "#6ec8ff", isDark: false },
  { id: "c-indigo", name: "Royal Indigo", style: "bg-[#595ad4]", hex: "#595ad4", isDark: true },
  { id: "c-forest", name: "Deep Forest", style: "bg-[#037f4c]", hex: "#037f4c", isDark: true },
  { id: "c-pink", name: "Bubblegum Pink", style: "bg-[#ff5ac4]", hex: "#ff5ac4", isDark: true },
  { id: "c-slate", name: "Slate Steel", style: "bg-[#78798e]", hex: "#78798e", isDark: true },
  { id: "c-violet", name: "Deep Violet", style: "bg-[#784bd1]", hex: "#784bd1", isDark: true },
  { id: "c-brown", name: "Earthy Brown", style: "bg-[#7f5347]", hex: "#7f5347", isDark: true },
  { id: "c-ocean-cyan", name: "Ocean Cyan", style: "bg-[#008ee6]", hex: "#008ee6", isDark: true },
  { id: "c-golden", name: "Golden Yellow", style: "bg-[#ffcc00]", hex: "#ffcc00", isDark: false },
  { id: "c-flame", name: "Vibrant Orange", style: "bg-[#ff642e]", hex: "#ff642e", isDark: true },

  // ── Row 3: Gradients (11) ──
  {
    id: "g-mint-lemon",
    name: "Mint Lemon",
    style: "bg-gradient-to-r from-[#70e4b8] to-[#e4f68f]",
    isDark: false,
  },
  {
    id: "g-midnight",
    name: "Midnight Slate",
    style: "bg-gradient-to-r from-[#181f38] to-[#808fae]",
    isDark: true,
  },
  {
    id: "g-twilight",
    name: "Twilight Mauve",
    style: "bg-gradient-to-r from-[#2f354f] to-[#b3a8c9]",
    isDark: true,
  },
  {
    id: "g-azure",
    name: "Azure Sky",
    style: "bg-gradient-to-r from-[#0073ea] to-[#6ed6ff]",
    isDark: true,
  },
  {
    id: "g-electric",
    name: "Electric Indigo",
    style: "bg-gradient-to-r from-[#696cfc] to-[#40a9ff]",
    isDark: true,
  },
  {
    id: "g-plum-bronze",
    name: "Plum Bronze",
    style: "bg-gradient-to-r from-[#3e2e4f] to-[#cc8b65]",
    isDark: true,
  },
  {
    id: "g-neon-sunset",
    name: "Neon Sunset",
    style: "bg-gradient-to-r from-[#e42575] to-[#ff4500]",
    isDark: true,
  },
  {
    id: "g-cosmic-lavender",
    name: "Cosmic Lavender",
    style: "bg-gradient-to-r from-[#b37feb] to-[#ff85c0]",
    isDark: true,
  },
  {
    id: "g-golden-ore",
    name: "Golden Ore",
    style: "bg-gradient-to-r from-[#434343] via-[#7d6b53] to-[#d8c593]",
    isDark: true,
  },
  {
    id: "g-deep-ocean",
    name: "Deep Ocean",
    style: "bg-gradient-to-r from-[#001f3f] to-[#0074d9]",
    isDark: true,
  },
  {
    id: "g-peach-blossom",
    name: "Peach Blossom",
    style: "bg-gradient-to-r from-[#ffa07a] to-[#ff69b4]",
    isDark: false,
  },
];

// ─── 2. AVATAR BACKGROUND COLORS (Exact 21 Colors from Monday.com) ──────────

export interface AvatarColor {
  id: string;
  name: string;
  hex: string;
  bgClass: string;
}

export const AVATAR_COLOR_PALETTE: AvatarColor[] = [
  // Row 1 (8)
  { id: "ac-rose", name: "Rose Red", hex: "#e2445c", bgClass: "bg-[#e2445c]" },
  { id: "ac-emerald", name: "Bright Emerald", hex: "#00c875", bgClass: "bg-[#00c875]" },
  { id: "ac-purple", name: "Amethyst Purple", hex: "#a25ddc", bgClass: "bg-[#a25ddc]" },
  { id: "ac-soft-indigo", name: "Soft Indigo", hex: "#579bfc", bgClass: "bg-[#579bfc]" },
  { id: "ac-midnight", name: "Midnight Navy", hex: "#292f4c", bgClass: "bg-[#292f4c]" },
  { id: "ac-sky", name: "Sky Blue", hex: "#57b6ff", bgClass: "bg-[#57b6ff]" },
  { id: "ac-orange", name: "Warm Orange", hex: "#ff9900", bgClass: "bg-[#ff9900]" },
  { id: "ac-yellow", name: "Bright Gold", hex: "#ffcb00", bgClass: "bg-[#ffcb00]" },

  // Row 2 (8)
  { id: "ac-cyan", name: "Cyan Teal", hex: "#00d2d2", bgClass: "bg-[#00d2d2]" },
  { id: "ac-coral", name: "Coral Orange", hex: "#ff642e", bgClass: "bg-[#ff642e]" },
  { id: "ac-magenta", name: "Hot Magenta", hex: "#ff158a", bgClass: "bg-[#ff158a]" },
  { id: "ac-berry", name: "Berry Crimson", hex: "#bb3354", bgClass: "bg-[#bb3354]" },
  { id: "ac-slate", name: "Cool Slate", hex: "#7f8c8d", bgClass: "bg-[#7f8c8d]" },
  { id: "ac-light-blue", name: "Light Blue", hex: "#6ec8ff", bgClass: "bg-[#6ec8ff]" },
  { id: "ac-burgundy", name: "Deep Burgundy", hex: "#800020", bgClass: "bg-[#800020]" },
  { id: "ac-forest", name: "Forest Green", hex: "#037f4c", bgClass: "bg-[#037f4c]" },

  // Row 3 (5)
  { id: "ac-flamingo", name: "Flamingo Pink", hex: "#ff5ac4", bgClass: "bg-[#ff5ac4]" },
  { id: "ac-royal", name: "Electric Blue", hex: "#008ee6", bgClass: "bg-[#008ee6]" },
  { id: "ac-tangerine", name: "Tangerine", hex: "#ff7538", bgClass: "bg-[#ff7538]" },
  { id: "ac-lime", name: "Lime", hex: "#9cd326", bgClass: "bg-[#9cd326]" },
  { id: "ac-navy", name: "Navy Blue", hex: "#1f4f8b", bgClass: "bg-[#1f4f8b]" },
];

// ─── 3. AVATAR ICONS (Exact 20 Icons from Monday.com Grid) ──────────────────

export interface AvatarIconItem {
  id: string;
  name: string;
  type: "initial" | "component" | "origami";
  component?: React.ComponentType<{ className?: string }>;
}

// Origami Bird Custom SVG Icon
export function OrigamiBirdIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M2.5 4.5L12 2l4 7-6.5 1.5L2.5 4.5zm19 5.5l-6-3.5 1.5 8 4.5-4.5zm-9.5-2L19 16l-8 6 1-14zm-4 7.5L3 13.5l5 2 0 4.5z" />
    </svg>
  );
}

export const AVATAR_ICON_LIST: AvatarIconItem[] = [
  // Row 1
  { id: "initial", name: "Workspace Initial", type: "initial" },
  { id: "origami", name: "Origami Bird", type: "origami" },
  { id: "bolt", name: "Lightning Bolt", type: "component", component: Zap },
  { id: "brain", name: "Brain", type: "component", component: Brain },
  { id: "chat", name: "Chat Bubble", type: "component", component: MessageCircle },

  // Row 2
  { id: "settings", name: "Gear / Settings", type: "component", component: Settings },
  { id: "crown", name: "Crown", type: "component", component: Crown },
  { id: "diamond", name: "Diamond", type: "component", component: Gem },
  { id: "dollar", name: "Dollar", type: "component", component: DollarSign },
  { id: "flag", name: "Flag", type: "component", component: Flag },

  // Row 3
  { id: "fire", name: "Flame", type: "component", component: Flame },
  { id: "folder", name: "Folder", type: "component", component: Folder },
  { id: "globe", name: "Globe", type: "component", component: Globe },
  { id: "heart", name: "Heart", type: "component", component: Heart },
  { id: "home", name: "Home", type: "component", component: Home },

  // Row 4
  { id: "user", name: "User", type: "component", component: User },
  { id: "shield", name: "Shield", type: "component", component: Shield },
  { id: "sun", name: "Sun", type: "component", component: Sun },
  { id: "wrench", name: "Tools", type: "component", component: Wrench },
  { id: "users", name: "Team", type: "component", component: Users },
];
