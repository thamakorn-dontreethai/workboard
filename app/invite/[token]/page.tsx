"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useWorkBoard } from "@/lib/context/WorkBoardContext";
import {
  Layers,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ShieldCheck,
  Users,
  MailCheck,
  LogIn,
  UserPlus,
  LogOut,
  Mail,
} from "lucide-react";

export default function AcceptInvitePage() {
  const params = useParams();
  const token = params?.token as string;
  const router = useRouter();
  const { currentUser, isAuthenticated, logout, acceptBoardInvite } =
    useWorkBoard();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [inviteData, setInviteData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [isAccepted, setIsAccepted] = useState(false);

  useEffect(() => {
    async function fetchInvite() {
      if (!token) return;
      try {
        const res = await fetch(`/api/invitations/${token}`);
        const data = await res.json();
        if (data.success && data.data) {
          setInviteData(data.data);
          if (data.data.invitation?.status === "accepted") {
            setIsAccepted(true);
          }
        } else {
          setError(data.error || "ไม่พบคำเชิญนี้หรือลิงก์หมดอายุแล้ว");
        }
      } catch {
        setError("ไม่สามารถโหลดข้อมูลคำเชิญได้");
      } finally {
        setLoading(false);
      }
    }

    fetchInvite();
  }, [token]);

  const invitedEmail = inviteData?.invitation?.email?.toLowerCase() || "";
  const currentEmail = currentUser?.email?.toLowerCase() || "";

  // Check authentication against the invited email
  const isCurrentInvitedUser =
    isAuthenticated && currentEmail.length > 0 && currentEmail === invitedEmail;
  const isOtherUser =
    isAuthenticated && currentEmail.length > 0 && currentEmail !== invitedEmail;

  // Confirm membership when authenticated as the invited user
  const handleConfirm = async () => {
    setSubmitting(true);
    setError(null);
    try {
      const ok = await acceptBoardInvite(token);
      if (ok) {
        setIsAccepted(true);
        setTimeout(() => {
          router.push(`/board/${inviteData?.board?.id || "board-1"}`);
        }, 1200);
      } else {
        setError("ไม่สามารถตอบรับคำเชิญได้ โปรดลองอีกครั้ง");
      }
    } catch (err: any) {
      setError(err.message || "เกิดข้อผิดพลาดในการเข้าร่วมทีม");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#111322] flex items-center justify-center text-white">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
          <p className="text-sm text-zinc-400">กำลังตรวจสอบคำเชิญเข้าร่วมโครงการ...</p>
        </div>
      </div>
    );
  }

  const inviterInitials =
    inviteData?.inviter?.avatarInitials ||
    inviteData?.inviter?.name
      ?.split(" ")
      .map((p: string) => p[0])
      .join("")
      .toUpperCase()
      .slice(0, 2) ||
    "SC";

  const loginLink = `/login?redirect=${encodeURIComponent(`/invite/${token}`)}&email=${encodeURIComponent(invitedEmail)}`;
  const registerLink = `/register?redirect=${encodeURIComponent(`/invite/${token}`)}&email=${encodeURIComponent(invitedEmail)}`;

  return (
    <div className="min-h-screen bg-[#111322] flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden font-sans text-zinc-100 selection:bg-blue-600 selection:text-white">
      {/* Background ambient lighting */}
      <div className="absolute top-[-15%] left-[-10%] w-[500px] h-[500px] rounded-full bg-blue-600/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-15%] right-[-10%] w-[500px] h-[500px] rounded-full bg-emerald-600/10 blur-[120px] pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        {/* Brand Logo */}
        <div className="flex items-center justify-center gap-3 mb-5">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-blue-500/25 ring-1 ring-white/20">
            <Layers className="w-6 h-6 text-white" />
          </div>
          <div className="flex flex-col">
            <span className="text-2xl font-bold tracking-tight bg-gradient-to-r from-white via-zinc-100 to-zinc-400 bg-clip-text text-transparent">
              WorkBoard
            </span>
            <span className="text-[10px] uppercase font-semibold tracking-wider text-blue-400 -mt-1">
              Project Team Invitation
            </span>
          </div>
        </div>
      </div>

      <div className="mt-2 sm:mx-auto sm:w-full sm:max-w-md relative z-10 px-4 sm:px-0">
        <div className="bg-[#181b34]/95 backdrop-blur-xl py-7 px-6 sm:px-8 shadow-2xl rounded-2xl border border-zinc-700/50">
          {error && (
            <div className="mb-4 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          {/* CASE 1: Invitation Already Accepted */}
          {isAccepted ? (
            <div className="text-center space-y-4 animate-in fade-in zoom-in-95 py-3">
              <div className="w-14 h-14 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mx-auto text-emerald-400 shadow-lg shadow-emerald-500/20">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-white">ยินดีต้อนรับเข้าสู่ทีม!</h3>
              <p className="text-sm text-zinc-300">
                คุณได้เข้าร่วมโครงการ{" "}
                <span className="font-semibold text-blue-400">
                  {inviteData?.board?.name || "Project Board"}
                </span>{" "}
                เรียบร้อยแล้ว
              </p>
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => router.push(`/board/${inviteData?.board?.id || "board-1"}`)}
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-semibold text-white bg-blue-600 hover:bg-blue-500 shadow-lg shadow-blue-600/30 transition-all cursor-pointer"
                >
                  <span>เปิดหน้างวดงานโครงการทันที</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-5">
              {/* Project & Inviter Details */}
              <div className="text-center space-y-1.5 pb-3 border-b border-zinc-800">
                <div className="w-10 h-10 rounded-full bg-blue-500/10 border border-blue-500/30 flex items-center justify-center mx-auto text-blue-400 mb-1">
                  <MailCheck className="w-5 h-5" />
                </div>
                <h2 className="text-lg font-bold text-white">
                  คำเชิญเข้าร่วมทีมโครงการ
                </h2>
                <div className="inline-block px-3 py-1 rounded-lg bg-blue-500/10 border border-blue-500/30 text-blue-400 font-semibold text-xs">
                  {inviteData?.board?.name || "Project Board"}
                </div>
              </div>

              {/* Inviter Info */}
              <div className="p-3 rounded-xl bg-[#111322]/80 border border-zinc-700/60 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center text-xs shrink-0">
                    {inviterInitials}
                  </div>
                  <div>
                    <div className="text-[11px] text-zinc-400">คำเชิญส่งโดย</div>
                    <div className="font-semibold text-white">
                      {inviteData?.inviter?.name || "Somchai (Team Lead)"}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[10px] uppercase font-semibold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-md">
                    {inviteData?.invitation?.role || "Member"}
                  </span>
                </div>
              </div>

              {/* Recipient Email */}
              <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-zinc-800/40 border border-zinc-800 text-xs text-zinc-300">
                <Mail className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                <span>คำเชิญส่งถึง:</span>
                <strong className="text-white truncate">{invitedEmail}</strong>
              </div>

              {/* Notice if logged in as someone else */}
              {isOtherUser && (
                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs space-y-2">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 text-amber-400 mt-0.5" />
                    <div>
                      ขณะนี้คุณล็อกอินอยู่ในชื่อ <strong>{currentUser.name}</strong> ({currentEmail}) ซึ่งไม่ใช่บัญชีของคำเชิญนี้
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => logout()}
                    className="flex items-center gap-1.5 text-[11px] font-semibold text-amber-400 hover:text-amber-300 underline cursor-pointer"
                  >
                    <LogOut className="w-3 h-3" />
                    <span>กดออกจากระบบบัญชีเดิม เพื่อเข้าสู่ระบบด้วย {invitedEmail}</span>
                  </button>
                </div>
              )}

              {/* CASE 2: User is already logged in as the invited email */}
              {isCurrentInvitedUser ? (
                <div className="space-y-4 pt-1">
                  <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                    <div>
                      คุณเข้าสู่ระบบในชื่อ <strong>{currentUser.name}</strong> เรียบร้อยแล้ว
                    </div>
                  </div>

                  <button
                    type="button"
                    disabled={submitting}
                    onClick={handleConfirm}
                    className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl shadow-lg shadow-blue-600/30 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 transition-all active:scale-[0.98] cursor-pointer"
                  >
                    {submitting ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        <span>กดยืนยันเข้าร่วมทีมโครงการทันที</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>
              ) : (
                /* CASE 3: User needs to Login or Register using the existing pages */
                <div className="space-y-3 pt-1">
                  <div className="text-xs text-zinc-400 text-center pb-1">
                    ในการเข้าร่วมทีม กรุณาเข้าสู่ระบบด้วยบัญชีของคุณ หรือสมัครสมาชิกใหม่:
                  </div>

                  <Link
                    href={loginLink}
                    className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl shadow-lg shadow-blue-600/30 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 transition-all cursor-pointer"
                  >
                    <LogIn className="w-4 h-4" />
                    <span>เข้าสู่ระบบเพื่อเข้าร่วมทีม (Login to Join)</span>
                  </Link>

                  <Link
                    href={registerLink}
                    className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border border-zinc-700 bg-zinc-800 hover:bg-zinc-750 text-xs font-semibold text-zinc-200 hover:text-white transition-all cursor-pointer"
                  >
                    <UserPlus className="w-4 h-4 text-emerald-400" />
                    <span>ยังไม่มีบัญชี? สมัครสมาชิกใหม่ (Register to Join)</span>
                  </Link>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Security badge */}
        <div className="mt-5 flex items-center justify-center gap-2 text-xs text-zinc-500">
          <ShieldCheck className="w-4 h-4 text-emerald-500" />
          <span>WorkBoard Secure Workspace Invitation</span>
        </div>
      </div>
    </div>
  );
}
