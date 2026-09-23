"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useWorkBoard } from "@/lib/context/WorkBoardContext";
import {
  ArrowLeft,
  Camera,
  Check,
  KeyRound,
  Mail,
  MessageCircle,
  Pencil,
  ShieldCheck,
  Palette,
  Trash2,
  X,
} from "lucide-react";

const MAX_AVATAR_PHOTO_BYTES = 5 * 1024 * 1024; // 5MB

// Same palette used for freshly-registered accounts (see AVATAR_COLORS in
// app/api/auth/register/route.ts) — avatarColor is a Tailwind bg class
// rendered directly, not a hex value, so the picker must offer classes too.
const AVATAR_COLOR_PALETTE = [
  "bg-indigo-600",
  "bg-emerald-600",
  "bg-blue-600",
  "bg-purple-600",
  "bg-amber-600",
  "bg-rose-600",
  "bg-teal-600",
  "bg-cyan-600",
];

export default function SettingsPage() {
  const { currentUser, workspace, updateProfile, changePassword } = useWorkBoard();

  const currentMember = workspace.members.find(
    (m) => m.userId === currentUser.id
  );
  const isOwner = currentMember?.role === "owner";

  // ─── Name (inline edit) ───────────────────────────────────────────────
  const [isEditingName, setIsEditingName] = useState(false);
  const [nameInput, setNameInput] = useState(currentUser.name);
  const [isSavingName, setIsSavingName] = useState(false);
  const [nameError, setNameError] = useState<string | null>(null);

  const startEditingName = () => {
    setNameInput(currentUser.name);
    setNameError(null);
    setIsEditingName(true);
  };

  const saveName = async () => {
    const trimmed = nameInput.trim();
    if (!trimmed || trimmed === currentUser.name) {
      setIsEditingName(false);
      return;
    }
    setIsSavingName(true);
    setNameError(null);
    const result = await updateProfile({ name: trimmed });
    setIsSavingName(false);
    if (result.success) {
      setIsEditingName(false);
    } else {
      setNameError(result.error || "Failed to save name");
    }
  };

  // ─── Change Profile (avatar color) ───────────────────────────────────
  const [isSavingColor, setIsSavingColor] = useState(false);
  const [colorError, setColorError] = useState<string | null>(null);

  const pickAvatarColor = async (color: string) => {
    if (color === currentUser.avatarColor) return;
    setIsSavingColor(true);
    setColorError(null);
    const result = await updateProfile({ avatarColor: color });
    setIsSavingColor(false);
    if (!result.success) setColorError(result.error || "Failed to save color");
  };

  // ─── Profile Photo (upload) ───────────────────────────────────────────
  const photoInputRef = useRef<HTMLInputElement>(null);
  const [isSavingPhoto, setIsSavingPhoto] = useState(false);
  const [photoError, setPhotoError] = useState<string | null>(null);
  // currentUser.avatarUrl points at /api/users/[id]/avatar, so straight after
  // an upload the browser would have to fetch back the very image it just
  // sent. Show the local copy until then.
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const avatarSrc = photoPreview ?? currentUser.avatarUrl;

  const handlePhotoFile = (file: File) => {
    setPhotoError(null);
    if (!file.type.startsWith("image/")) {
      setPhotoError("Please choose an image file");
      return;
    }
    if (file.size > MAX_AVATAR_PHOTO_BYTES) {
      setPhotoError("Image must be smaller than 5MB");
      return;
    }
    const reader = new FileReader();
    reader.onload = async (e) => {
      const dataUrl = e.target?.result as string;
      setIsSavingPhoto(true);
      const result = await updateProfile({ avatarUrl: dataUrl });
      setIsSavingPhoto(false);
      if (result.success) setPhotoPreview(dataUrl);
      else setPhotoError(result.error || "Failed to upload photo");
    };
    reader.onerror = () => setPhotoError("Failed to read the selected file");
    reader.readAsDataURL(file);
  };

  const handlePhotoInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handlePhotoFile(file);
    e.target.value = "";
  };

  const removePhoto = async () => {
    setPhotoError(null);
    setIsSavingPhoto(true);
    const result = await updateProfile({ avatarUrl: null });
    setIsSavingPhoto(false);
    if (result.success) setPhotoPreview(null);
    else setPhotoError(result.error || "Failed to remove photo");
  };

  // ─── Change Password ──────────────────────────────────────────────────
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSavingPassword, setIsSavingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState(false);

  const submitPasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(false);

    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordError("Fill in all fields");
      return;
    }
    if (newPassword.length < 6) {
      setPasswordError("New password must be at least 6 characters");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError("New passwords don't match");
      return;
    }

    setIsSavingPassword(true);
    const result = await changePassword(currentPassword, newPassword);
    setIsSavingPassword(false);

    if (result.success) {
      setPasswordSuccess(true);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setTimeout(() => {
        setIsPasswordModalOpen(false);
        setPasswordSuccess(false);
      }, 1200);
    } else {
      setPasswordError(result.error || "Failed to change password");
    }
  };

  const closePasswordModal = () => {
    setIsPasswordModalOpen(false);
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setPasswordError(null);
    setPasswordSuccess(false);
  };

  // ─── LINE Notifications ────────────────────────────────────────────────
  const [lineConfigured, setLineConfigured] = useState(true);
  const [lineLinked, setLineLinked] = useState(false);
  const [isLoadingLineStatus, setIsLoadingLineStatus] = useState(true);
  const [lineLinkCode, setLineLinkCode] = useState<string | null>(null);
  const [isGeneratingLineCode, setIsGeneratingLineCode] = useState(false);
  const [isUnlinkingLine, setIsUnlinkingLine] = useState(false);
  const [lineError, setLineError] = useState<string | null>(null);
  const lineOaId = process.env.NEXT_PUBLIC_LINE_OA_ID;

  const refreshLineStatus = async () => {
    setIsLoadingLineStatus(true);
    try {
      const res = await fetch("/api/line/status");
      const result = await res.json();
      if (result?.success) {
        setLineConfigured(Boolean(result.data.configured));
        setLineLinked(Boolean(result.data.linked));
      }
    } catch {
      // leave defaults — the section will just show as unavailable
    }
    setIsLoadingLineStatus(false);
  };

  useEffect(() => {
    refreshLineStatus();
  }, []);

  const generateLineCode = async () => {
    setIsGeneratingLineCode(true);
    setLineError(null);
    try {
      const res = await fetch("/api/line/link", { method: "POST" });
      const result = await res.json();
      if (result?.success) {
        setLineLinkCode(result.data.code);
      } else {
        setLineError(result?.error || "Failed to generate a link code");
      }
    } catch (err: any) {
      setLineError(err.message || "Network error");
    }
    setIsGeneratingLineCode(false);
  };

  const disconnectLine = async () => {
    setIsUnlinkingLine(true);
    setLineError(null);
    try {
      const res = await fetch("/api/line/unlink", { method: "POST" });
      const result = await res.json();
      if (result?.success) {
        setLineLinked(false);
        setLineLinkCode(null);
      } else {
        setLineError(result?.error || "Failed to disconnect LINE");
      }
    } catch (err: any) {
      setLineError(err.message || "Network error");
    }
    setIsUnlinkingLine(false);
  };

  const inputClass =
    "mt-1.5 w-full rounded-lg border border-zinc-700 bg-zinc-900/60 px-3 py-2 text-xs text-white placeholder:text-zinc-500 focus:outline-none focus:border-[#0073ea] transition-colors";
  const fieldLabelClass =
    "text-[11px] font-semibold uppercase tracking-wider text-zinc-500";

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6 max-w-[700px] mx-auto w-full animate-in fade-in duration-150">
      <div className="flex items-center gap-3 pb-4 border-b border-zinc-800">
        <Link
          href="/"
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-zinc-800 text-zinc-400 hover:bg-zinc-800 hover:text-white transition-colors shrink-0"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">
            Account Settings
          </h1>
          <p className="text-xs text-zinc-500 mt-0.5">
            Manage your profile and security
          </p>
        </div>
      </div>

      {/* Profile Card */}
      <div className="rounded-2xl border border-zinc-800 bg-[#1c1c1f] p-5 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="relative shrink-0">
            {avatarSrc ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={avatarSrc}
                alt={currentUser.name}
                className="h-14 w-14 rounded-full object-cover ring-2 ring-zinc-800"
              />
            ) : (
              <div
                className={`flex h-14 w-14 items-center justify-center rounded-full text-white font-bold text-lg ring-2 ring-zinc-800 ${currentUser.avatarColor || "bg-[#0073ea]"
                  }`}
              >
                {currentUser.avatarInitials}
              </div>
            )}
            <button
              type="button"
              onClick={() => photoInputRef.current?.click()}
              disabled={isSavingPhoto}
              title="Upload photo"
              className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-[#0073ea] hover:bg-[#0060c0] text-white ring-2 ring-[#1c1c1f] disabled:opacity-50 transition-colors"
            >
              <Camera className="h-3 w-3" />
            </button>
            <input
              ref={photoInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handlePhotoInputChange}
            />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold text-white">{currentUser.name}</p>
            <p className="text-xs text-zinc-400 truncate flex items-center gap-1.5">
              <Mail className="h-3.5 w-3.5 shrink-0" />
              {currentUser.email}
            </p>
            {avatarSrc && (
              <button
                type="button"
                onClick={removePhoto}
                disabled={isSavingPhoto}
                className="mt-1.5 inline-flex items-center gap-1 text-[11px] text-zinc-500 hover:text-rose-400 disabled:opacity-50 transition-colors"
              >
                <Trash2 className="h-3 w-3" />
                Remove photo
              </button>
            )}
          </div>
        </div>
        {photoError && (
          <p className="mt-2 text-[11px] text-rose-400">{photoError}</p>
        )}

        {/* Name (editable) */}
        <div className="mt-5 pt-5 border-t border-zinc-800">
          <label className={fieldLabelClass}>Name</label>
          {isEditingName ? (
            <div className="mt-1.5 flex items-center gap-2">
              <input
                type="text"
                autoFocus
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") saveName();
                  if (e.key === "Escape") setIsEditingName(false);
                }}
                className={`${inputClass} mt-0 flex-1`}
              />
              <button
                type="button"
                onClick={saveName}
                disabled={isSavingName}
                className="rounded-lg bg-[#0073ea] hover:bg-[#0060c0] px-3.5 py-2 text-xs font-semibold text-white disabled:opacity-50 transition-colors shrink-0"
              >
                {isSavingName ? "Saving..." : "Save"}
              </button>
              <button
                type="button"
                onClick={() => setIsEditingName(false)}
                disabled={isSavingName}
                className="rounded-lg border border-zinc-700 px-3.5 py-2 text-xs text-zinc-400 hover:bg-zinc-800 hover:text-white transition-colors shrink-0"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={startEditingName}
              className="group mt-1.5 flex items-center gap-2 text-xs font-medium text-white hover:text-[#57b6ff] transition-colors"
            >
              <span>{currentUser.name}</span>
              <Pencil className="h-3 w-3 text-zinc-500 opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>
          )}
          {nameError && (
            <p className="mt-1.5 text-[11px] text-rose-400">{nameError}</p>
          )}
        </div>
      </div>

      {/* Change Profile (avatar color) */}
      <div className="rounded-2xl border border-zinc-800 bg-[#1c1c1f] p-5 shadow-sm">
        <div className="flex items-center gap-2 mb-1">
          <Palette className="h-4 w-4 text-[#0073ea]" />
          <h2 className="text-sm font-bold text-white">Change Profile</h2>
        </div>
        <p className="text-[11px] text-zinc-500 mb-3.5">
          {avatarSrc
            ? "Used when your photo is removed"
            : "Pick a color for your avatar"}
        </p>
        <div className="flex flex-wrap gap-2.5">
          {AVATAR_COLOR_PALETTE.map((c) => (
            <button
              key={c}
              type="button"
              disabled={isSavingColor}
              onClick={() => pickAvatarColor(c)}
              title={c}
              className={`h-8 w-8 rounded-full flex items-center justify-center ring-1 ring-white/10 hover:scale-110 transition-transform disabled:opacity-50 ${c}`}
            >
              {currentUser.avatarColor === c && (
                <Check className="h-4 w-4 text-white" />
              )}
            </button>
          ))}
        </div>
        {colorError && (
          <p className="mt-2.5 text-[11px] text-rose-400">{colorError}</p>
        )}
      </div>

      {/* Change Password */}
      <div className="rounded-2xl border border-zinc-800 bg-[#1c1c1f] p-5 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <KeyRound className="h-4 w-4 text-[#0073ea]" />
            <div>
              <h2 className="text-sm font-bold text-white">Password</h2>
              <p className="text-[11px] text-zinc-500 mt-0.5">
                Update the password used to sign in
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setIsPasswordModalOpen(true)}
            className="rounded-lg bg-[#0073ea] hover:bg-[#0060c0] px-3.5 py-2 text-xs font-semibold text-white transition-colors shadow-xs shrink-0"
          >
            Change Password
          </button>
        </div>
      </div>

      {/* LINE Notifications */}
      <div className="rounded-2xl border border-zinc-800 bg-[#1c1c1f] p-5 shadow-sm">
        <div className="flex items-center gap-2 mb-1">
          <MessageCircle className="h-4 w-4 text-emerald-500" />
          <h2 className="text-sm font-bold text-white">LINE Notifications</h2>
        </div>
        <p className="text-[11px] text-zinc-500 mb-3.5">
          Get task assignments and due-date reminders sent to LINE
        </p>

        {isLoadingLineStatus ? (
          <p className="text-xs text-zinc-500">Checking status...</p>
        ) : !lineConfigured ? (
          <p className="text-xs text-zinc-500">
            LINE isn't set up on this server yet.
          </p>
        ) : lineLinked ? (
          <div className="flex items-center justify-between gap-3">
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-400">
              <Check className="h-3.5 w-3.5" />
              Connected
            </span>
            <button
              type="button"
              onClick={disconnectLine}
              disabled={isUnlinkingLine}
              className="rounded-lg border border-zinc-700 px-3.5 py-2 text-xs text-zinc-400 hover:bg-zinc-800 hover:text-white disabled:opacity-50 transition-colors shrink-0"
            >
              {isUnlinkingLine ? "Disconnecting..." : "Disconnect"}
            </button>
          </div>
        ) : lineLinkCode ? (
          <div className="rounded-xl border border-zinc-700 bg-zinc-900/60 p-3.5 space-y-2.5">
            <p className="text-[11px] text-zinc-400">
              {lineOaId ? (
                <>
                  1. เพิ่มเพื่อน{" "}
                  <a
                    href={`https://line.me/R/ti/p/@${lineOaId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#0073ea] hover:underline"
                  >
                    LINE Official Account
                  </a>{" "}
                  ของ WorkBoard
                </>
              ) : (
                "1. เพิ่มเพื่อน LINE Official Account ของ WorkBoard"
              )}
              <br />
              2. ส่งรหัสด้านล่างนี้เป็นข้อความคุยกับบอท
            </p>
            <div className="text-center text-2xl font-bold tracking-[0.3em] text-white bg-zinc-900 rounded-lg py-2.5">
              {lineLinkCode}
            </div>
            <p className="text-[10px] text-zinc-500">
              รหัสหมดอายุใน 10 นาที —{" "}
              <button
                type="button"
                onClick={() => refreshLineStatus()}
                className="text-[#0073ea] hover:underline"
              >
                เชื่อมเสร็จแล้วกดรีเฟรชสถานะ
              </button>
            </p>
          </div>
        ) : (
          <button
            type="button"
            onClick={generateLineCode}
            disabled={isGeneratingLineCode}
            className="rounded-lg bg-[#0073ea] hover:bg-[#0060c0] px-3.5 py-2 text-xs font-semibold text-white disabled:opacity-50 transition-colors shadow-xs"
          >
            {isGeneratingLineCode ? "Generating..." : "Connect LINE"}
          </button>
        )}

        {lineError && (
          <p className="mt-2.5 text-[11px] text-rose-400">{lineError}</p>
        )}
      </div>

      {isPasswordModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Change password"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-150"
        >
          <div
            className="fixed inset-0"
            onClick={closePasswordModal}
            aria-hidden="true"
          />
          <div className="relative w-full max-w-sm rounded-2xl border border-zinc-800 bg-[#1c1e28] shadow-2xl z-10 overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800">
              <h3 className="text-sm font-bold text-white">Change Password</h3>
              <button
                type="button"
                onClick={closePasswordModal}
                className="flex h-7 w-7 items-center justify-center rounded-lg text-zinc-400 hover:bg-zinc-800 hover:text-white transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={submitPasswordChange} className="p-5 space-y-3.5">
              <div>
                <label className={fieldLabelClass}>Current Password</label>
                <input
                  type="password"
                  autoFocus
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={fieldLabelClass}>New Password</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={fieldLabelClass}>Confirm New Password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className={inputClass}
                />
              </div>

              {passwordError && (
                <p className="text-[11px] text-rose-400">{passwordError}</p>
              )}
              {passwordSuccess && (
                <p className="text-[11px] text-emerald-400">Password updated successfully</p>
              )}

              <button
                type="submit"
                disabled={isSavingPassword}
                className="w-full rounded-lg bg-[#0073ea] hover:bg-[#0060c0] px-4 py-2 text-xs font-semibold text-white disabled:opacity-50 transition-colors shadow-xs"
              >
                {isSavingPassword ? "Updating..." : "Update Password"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
