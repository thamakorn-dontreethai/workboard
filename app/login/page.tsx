"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useWorkBoard } from "@/lib/context/WorkBoardContext";
import {
  Lock,
  Mail,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  Eye,
  EyeOff,
  Layers,
} from "lucide-react";

interface RememberedUser {
  id?: string;
  name: string;
  email: string;
  avatarInitials?: string;
  avatarColor?: string;
  avatarUrl?: string | null;
  role?: string;
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") || "/";
  const initialEmail = searchParams.get("email") || "";

  const { login, isAuthenticated, isHydrated } = useWorkBoard();

  const [email, setEmail] = useState(initialEmail);
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [rememberedUser, setRememberedUser] = useState<RememberedUser | null>(null);
  const [useDifferentAccount, setUseDifferentAccount] = useState(false);

  // Restore remembered user & email on mount
  useEffect(() => {
    try {
      const savedUserStr = localStorage.getItem("workboard_remembered_user");
      const savedEmail = localStorage.getItem("workboard_remembered_email");
      const savedRemember = localStorage.getItem("workboard_remember_me");

      if (savedUserStr) {
        const u = JSON.parse(savedUserStr);
        if (u && u.email) {
          setRememberedUser(u);
          if (!initialEmail) {
            setEmail(u.email);
          }
        }
      } else if (savedEmail && !initialEmail) {
        setEmail(savedEmail);
      }

      if (savedRemember !== null) {
        setRememberMe(savedRemember !== "false");
      }
    } catch {
      // ignore
    }
  }, [initialEmail]);

  // If already authenticated, redirect immediately
  useEffect(() => {
    if (isHydrated && isAuthenticated) {
      router.replace(redirect);
    }
  }, [isHydrated, isAuthenticated, redirect, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const targetEmail = (rememberedUser && !useDifferentAccount) ? rememberedUser.email : email;
    if (!targetEmail.trim() || !password.trim()) {
      setError("Please enter your password");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const cleanEmail = targetEmail.trim();
      const success = await login(cleanEmail, password, rememberMe);
      if (success) {
        router.push(redirect);
      } else {
        setError("Invalid email or password. Please try again.");
      }
    } catch (err: any) {
      setError(err.message || "Failed to log in. Please check your credentials.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgetAccount = () => {
    try {
      localStorage.removeItem("workboard_remembered_user");
      localStorage.removeItem("workboard_remembered_email");
    } catch {}
    setRememberedUser(null);
    setUseDifferentAccount(false);
    setEmail("");
    setPassword("");
  };

  const registerHref = `/register${redirect !== "/"
      ? `?redirect=${encodeURIComponent(redirect)}${email ? `&email=${encodeURIComponent(email)}` : ""}`
      : email
        ? `?email=${encodeURIComponent(email)}`
        : ""
    }`;

  if (isHydrated && isAuthenticated) {
    return (
      <div className="bg-[#181b34]/90 backdrop-blur-xl py-10 px-6 sm:px-10 shadow-2xl rounded-2xl border border-zinc-700/50 text-center animate-in fade-in">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-sm text-zinc-300 font-medium">เข้าสู่ระบบแล้ว กำลังพาไปยังหน้าหลัก...</p>
        <p className="text-xs text-zinc-500 mt-1">Already signed in, redirecting...</p>
      </div>
    );
  }

  const isQuickSignIn = Boolean(rememberedUser && !useDifferentAccount);

  return (
    <div className="bg-[#181b34]/90 backdrop-blur-xl py-8 px-6 sm:px-10 shadow-2xl rounded-2xl border border-zinc-700/50">
      {error && (
        <div className="mb-6 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-start gap-3 text-rose-400 text-sm animate-in fade-in">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-rose-400" />
          <span>{error}</span>
        </div>
      )}

      <form className="space-y-5" onSubmit={handleSubmit} autoComplete="on">
        {/* Remembered User Card or Email Field */}
        {isQuickSignIn && rememberedUser ? (
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-semibold uppercase tracking-wider text-zinc-300">
                ผู้ใช้ที่จดจำไว้ (Remembered User)
              </span>
              <button
                type="button"
                onClick={() => {
                  setUseDifferentAccount(true);
                  setEmail("");
                  setPassword("");
                }}
                className="text-xs text-blue-400 hover:text-blue-300 font-medium hover:underline"
              >
                เข้าสู่ระบบด้วยบัญชีอื่น
              </button>
            </div>
            <div className="p-3.5 rounded-xl bg-[#111322] border border-blue-500/40 shadow-inner flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                {rememberedUser.avatarUrl ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={rememberedUser.avatarUrl}
                    alt={rememberedUser.name}
                    className="w-10 h-10 rounded-full object-cover ring-2 ring-blue-500/60 shrink-0"
                  />
                ) : (
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm text-white shadow-md shrink-0 ${
                      rememberedUser.avatarColor || "bg-blue-600"
                    } ring-2 ring-blue-500/60`}
                  >
                    {rememberedUser.avatarInitials || rememberedUser.name.slice(0, 2).toUpperCase()}
                  </div>
                )}
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-white truncate">
                      {rememberedUser.name}
                    </span>
                    <span className="text-[9px] uppercase tracking-wider font-bold px-1.5 py-0.2 rounded-md bg-blue-500/20 text-blue-300 border border-blue-500/30">
                      SAVED
                    </span>
                  </div>
                  <p className="text-xs text-zinc-400 truncate mt-0.5">{rememberedUser.email}</p>
                </div>
              </div>
            </div>
            {/* Hidden email input for browser password managers */}
            <input
              type="hidden"
              name="email"
              autoComplete="username email"
              value={rememberedUser.email}
            />
          </div>
        ) : (
          <div>
            {rememberedUser && (
              <div className="flex items-center justify-between mb-1.5">
                <label
                  htmlFor="email"
                  className="block text-xs font-semibold uppercase tracking-wider text-zinc-300"
                >
                  Work Email
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setUseDifferentAccount(false);
                    setEmail(rememberedUser.email);
                  }}
                  className="text-xs text-blue-400 hover:text-blue-300 font-medium hover:underline"
                >
                  กลับไปที่ {rememberedUser.name}
                </button>
              </div>
            )}
            {!rememberedUser && (
              <label
                htmlFor="email"
                className="block text-xs font-semibold uppercase tracking-wider text-zinc-300 mb-1.5"
              >
                Work Email
              </label>
            )}
            <div className="relative rounded-xl shadow-xs">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-500">
                <Mail className="h-4 w-4" />
              </div>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="username email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@company.com"
                className="block w-full pl-10 pr-3.5 py-2.5 bg-[#111322] border border-zinc-700/80 rounded-xl text-sm text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
            </div>
          </div>
        )}

        <div>
          <label
            htmlFor="password"
            className="block text-xs font-semibold uppercase tracking-wider text-zinc-300 mb-1.5"
          >
            Password
          </label>
          <div className="relative rounded-xl shadow-xs">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-500">
              <Lock className="h-4 w-4" />
            </div>
            <input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              required
              autoFocus={isQuickSignIn}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={isQuickSignIn ? `Enter password for ${rememberedUser?.name}` : "••••••••"}
              className="block w-full pl-10 pr-10 py-2.5 bg-[#111322] border border-zinc-700/80 rounded-xl text-sm text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? "Hide password" : "Show password"}
              className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-zinc-400 hover:text-white transition-colors"
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>

        {/* Remember User Checkbox */}
        <div className="flex items-center justify-between text-xs">
          <label className="flex items-center gap-2 cursor-pointer select-none text-zinc-300 hover:text-white transition-colors">
            <input
              type="checkbox"
              id="remember"
              name="remember"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="w-4 h-4 rounded border-zinc-700 bg-[#111322] text-blue-600 focus:ring-blue-500 focus:ring-offset-0 focus:ring-offset-transparent cursor-pointer accent-blue-600"
            />
            <span>จดจำผู้ใช้งานนี้ (Remember user)</span>
          </label>
          {isQuickSignIn && (
            <button
              type="button"
              onClick={handleForgetAccount}
              className="text-[11px] text-zinc-500 hover:text-rose-400 transition-colors"
            >
              ลืมบัญชีนี้
            </button>
          )}
        </div>

        <div className="pt-2">
          <button
            type="submit"
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 border border-transparent rounded-xl shadow-lg shadow-blue-600/30 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#181b34] focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-[0.98]"
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <span>
                  {isQuickSignIn
                    ? `Sign in as ${rememberedUser?.name}`
                    : "Sign in to WorkBoard"}
                </span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </form>

      <div className="mt-6 text-center">
        <p className="text-xs text-zinc-400">
          Don&apos;t have an account?{" "}
          <Link
            href={registerHref}
            className="font-semibold text-blue-400 hover:text-blue-300 hover:underline transition-colors"
          >
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-viewport bg-[#111322] flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden font-sans text-zinc-100 selection:bg-blue-600 selection:text-white">
      {/* Background ambient lighting */}
      <div className="absolute top-[-15%] left-[-10%] w-[500px] h-[500px] rounded-full bg-blue-600/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-15%] right-[-10%] w-[500px] h-[500px] rounded-full bg-indigo-600/10 blur-[120px] pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        {/* Brand Logo */}
        <div className="flex items-center justify-center gap-3 mb-6">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-blue-500/25 ring-1 ring-white/20">
            <Layers className="w-6 h-6 text-white" />
          </div>
          <div className="flex flex-col">
            <span className="text-2xl font-bold tracking-tight bg-gradient-to-r from-white via-zinc-100 to-zinc-400 bg-clip-text text-transparent">
              WorkBoard
            </span>
            <span className="text-[10px] uppercase font-semibold tracking-wider text-blue-400 -mt-1">
              Enterprise Cloud
            </span>
          </div>
        </div>


        <p className="mt-1.5 text-center text-sm text-zinc-400">
          Sign in to manage projects, teams, and deliverables
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10 px-4 sm:px-0">
        <Suspense fallback={<div className="text-center text-sm text-zinc-400 py-8">Loading...</div>}>
          <LoginForm />
        </Suspense>

        {/* Security badge */}
        <div className="mt-6 flex items-center justify-center gap-2 text-xs text-zinc-500">
          <ShieldCheck className="w-4 h-4 text-emerald-500" />
          <span>Secured with Supabase PostgreSQL & Prisma Cloud</span>
        </div>
      </div>
    </div>
  );
}
