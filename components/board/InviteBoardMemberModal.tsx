"use client";

import React, { useState } from "react";
import { useWorkBoard } from "@/lib/context/WorkBoardContext";
import {
  X,
  Mail,
  UserPlus,
  Copy,
  Check,
  ExternalLink,
  ShieldCheck,
  Send,
  AlertCircle,
  Inbox,
} from "lucide-react";

export function InviteBoardMemberModal() {
  const {
    isInviteBoardModalOpen,
    inviteBoardId,
    closeInviteBoardModal,
    inviteToBoard,
    boards,
    currentUser,
  } = useWorkBoard();

  const [email, setEmail] = useState("");
  const [role, setRole] = useState("Member");
  const [isLoading, setIsLoading] = useState(false);
  const [inviteResult, setInviteResult] = useState<{
    token: string;
    inviteLink: string;
    emailDelivery?: {
      mode: "smtp" | "ethereal" | "failed";
      previewUrl?: string | false;
      messageId?: string;
      error?: string;
    };
  } | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isInviteBoardModalOpen || !inviteBoardId) return null;

  const currentBoard = boards.find((b) => b.id === inviteBoardId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setError("Please enter an email address");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const res = await inviteToBoard(inviteBoardId, email.trim(), role);
      if (res.success && res.inviteLink && res.token) {
        setInviteResult({
          token: res.token,
          inviteLink: res.inviteLink,
          emailDelivery: res.emailDelivery,
        });
      } else {
        setError("Failed to generate invitation");
      }
    } catch (err: any) {
      setError(err.message || "Failed to invite member");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = () => {
    if (inviteResult?.inviteLink) {
      navigator.clipboard.writeText(inviteResult.inviteLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleReset = () => {
    setEmail("");
    setInviteResult(null);
    setError(null);
    closeInviteBoardModal();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in select-none">
      <div className="relative w-full max-w-md rounded-2xl border border-zinc-700/60 bg-[#181b34] p-6 text-zinc-100 shadow-2xl animate-in zoom-in-95">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600/20 text-blue-400 flex items-center justify-center border border-blue-500/30">
              <UserPlus className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">
                เชิญสมาชิกเข้าร่วม {currentBoard?.name || "Project"}
              </h3>
              <p className="text-[11px] text-zinc-400">
                เฉพาะสมาชิกที่ได้รับคำเชิญและกดยืนยันเท่านั้นที่จะได้รับมอบหมายงานในบอร์ดนี้ได้
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleReset}
            className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        {inviteResult ? (
          <div className="py-5 space-y-4 animate-in fade-in">
            {/* Email Dispatch Result Badge */}
            {inviteResult.emailDelivery?.mode === "smtp" ? (
              <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-start gap-3 text-emerald-400 text-xs">
                <Check className="w-5 h-5 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold block text-sm text-emerald-300">
                    ส่งอีเมลคำเชิญเข้า Inbox จริงสำเร็จ!
                  </span>
                  ส่งตรงไปยังกล่องจดหมายของ <strong>{email}</strong> ผ่าน SMTP Server เรียบร้อยแล้ว
                </div>
              </div>
            ) : inviteResult.emailDelivery?.mode === "ethereal" ? (
              <div className="p-3.5 rounded-xl bg-blue-500/10 border border-blue-500/30 text-blue-300 text-xs space-y-2">
                <div className="flex items-start gap-2.5">
                  <Send className="w-4 h-4 shrink-0 text-blue-400 mt-0.5" />
                  <div>
                    <span className="font-semibold block text-sm text-white">
                      ส่งอีเมลคำเชิญออกผ่าน Mail Server แล้ว
                    </span>
                    ส่งไปยัง <strong>{email}</strong> (โหมดเซิร์ฟเวอร์เมลจำลอง Ethereal)
                  </div>
                </div>
                {inviteResult.emailDelivery?.previewUrl && (
                  <a
                    href={inviteResult.emailDelivery.previewUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600/30 hover:bg-blue-600/50 text-blue-200 border border-blue-500/40 text-[11px] font-medium transition-all"
                  >
                    <Mail className="w-3.5 h-3.5" />
                    <span>คลิกดูหน้าตาอีเมลที่ส่งออกบน Mail Server</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
                <div className="text-[10px] text-zinc-400 pt-1 border-t border-blue-500/20">
                  💡 หากต้องการให้ส่งตรงเข้า Gmail / Outlook จริง ให้ใส่ค่า SMTP ในไฟล์ <code className="text-zinc-300">.env</code>
                </div>
              </div>
            ) : (
              <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center gap-3 text-emerald-400 text-xs">
                <Check className="w-5 h-5 shrink-0" />
                <div>
                  <span className="font-semibold block text-sm">สร้างลิงก์คำเชิญเรียบร้อย!</span>
                  ส่งลิงก์นี้ให้ <strong>{email}</strong> เพื่อกดตอบรับเข้าทีม
                </div>
              </div>
            )}

            {/* Direct Link Section */}
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                ลิงก์สำหรับกดยืนยันเข้าร่วมทีม (Confirmation Link):
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={inviteResult.inviteLink}
                  className="w-full bg-[#111322] border border-zinc-700/80 rounded-xl px-3 py-2 text-xs text-zinc-300 font-mono focus:outline-none"
                />
                <button
                  type="button"
                  onClick={handleCopy}
                  className="px-3 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-xs font-semibold text-white flex items-center gap-1.5 shrink-0 transition-all"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy Link</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Open Acceptance Page Button */}
            <div className="p-3 rounded-xl bg-[#111322] border border-zinc-700/60 space-y-2">
              <div className="text-[11px] text-zinc-300 flex items-center gap-1.5">
                <Inbox className="w-3.5 h-3.5 text-blue-400" />
                <span>สำหรับผู้รับคำเชิญเปิดเพื่อกดยืนยัน:</span>
              </div>
              <a
                href={inviteResult.inviteLink}
                target="_blank"
                rel="noreferrer"
                className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg bg-zinc-800 hover:bg-zinc-750 text-xs font-semibold text-white transition-all border border-zinc-700"
              >
                <span>เปิดหน้าต่างยืนยันการตอบรับคำเชิญ</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={handleReset}
                className="w-full py-2 px-4 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs font-semibold text-white transition-colors"
              >
                เสร็จสิ้น / ปิดหน้าต่าง
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="py-5 space-y-4">
            {error && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-300 mb-1.5">
                อีเมลของผู้ร่วมงานที่ต้องการเชิญ (Work Email)
              </label>
              <div className="relative rounded-xl">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-500">
                  <Mail className="h-4 w-4" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  autoFocus
                  className="block w-full pl-9 pr-3 py-2 bg-[#111322] border border-zinc-700/80 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-300 mb-1.5">
                บทบาทในโปรเจค (Project Role)
              </label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="block w-full px-3 py-2 bg-[#111322] border border-zinc-700/80 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="Member">Member (ร่วมจัดการงานและรับมอบหมายงาน)</option>
                <option value="Project Lead">Project Lead (หัวหน้าโครงการ)</option>
                <option value="Contributor">Contributor (ผู้มีส่วนร่วม)</option>
                <option value="Viewer">Viewer (ดูได้อย่างเดียว)</option>
              </select>
            </div>

            <div className="pt-3">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 shadow-lg shadow-blue-600/30 transition-all disabled:opacity-50 cursor-pointer"
              >
                {isLoading ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>ส่งคำเชิญเข้าร่วมทีมทันที</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
