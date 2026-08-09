"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Cpu, ShieldCheck, Mail, Lock, User as UserIcon, ArrowRight, AlertCircle, Loader2 } from "lucide-react";

export default function LoginPage() {
  const { user, loading, loginWithGoogle, loginWithEmail, signUpWithEmail } = useAuth();
  const router = useRouter();

  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleSubmitting, setIsGoogleSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && user) {
      router.push("/dashboard");
    }
  }, [user, loading, router]);

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!email || !password) {
      setError("Please fill in all required fields.");
      return;
    }

    setIsSubmitting(true);
    try {
      if (mode === "signin") {
        await loginWithEmail(email, password);
      } else {
        if (!name.trim()) {
          setError("Please provide your full name.");
          setIsSubmitting(false);
          return;
        }
        await signUpWithEmail(email, password, name);
      }
      router.push("/dashboard");
    } catch (err: any) {
      console.error("Auth error:", err);
      let msg = "Failed to authenticate. Please check your credentials.";
      if (err.code === "auth/user-not-found" || err.code === "auth/invalid-credential") {
        msg = "Invalid email or password.";
      } else if (err.code === "auth/email-already-in-use") {
        msg = "An account with this email already exists.";
      } else if (err.code === "auth/weak-password") {
        msg = "Password should be at least 6 characters long.";
      } else if (err.message) {
        msg = err.message;
      }
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError(null);
    setIsGoogleSubmitting(true);
    try {
      await loginWithGoogle();
      router.push("/dashboard");
    } catch (err: any) {
      console.error("Google Auth error:", err);
      if (err.code !== "auth/popup-closed-by-user") {
        setError(err.message || "Failed to sign in with Google.");
      }
    } finally {
      setIsGoogleSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0b0f19] flex items-center justify-center text-emerald-400">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0b0f19] text-gray-100 flex flex-col justify-center items-center px-4 py-12 relative overflow-hidden selection:bg-emerald-500 selection:text-black">
      {/* Dynamic Background Effects */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-indigo-500/10 rounded-full blur-[100px] pointer-events-none" />

      {/* Main Container */}
      <div className="w-full max-w-md bg-gray-950/80 border border-gray-800/80 backdrop-blur-xl rounded-3xl p-8 shadow-2xl shadow-emerald-950/20 relative z-10 space-y-6">
        {/* Header Branding */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-500 to-indigo-600 shadow-lg shadow-emerald-500/25 mb-2">
            <Cpu className="w-8 h-8 text-gray-950" />
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-gray-100 to-gray-300">
            Dynamic Pricing Engine
          </h1>
          <p className="text-xs text-gray-400 flex items-center justify-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            Competitive Intelligence & Autonomous Dashboard Access
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex bg-gray-900/80 p-1 rounded-xl border border-gray-800">
          <button
            onClick={() => { setMode("signin"); setError(null); }}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
              mode === "signin"
                ? "bg-emerald-500 text-gray-950 shadow-md shadow-emerald-500/20"
                : "text-gray-400 hover:text-gray-200"
            }`}
          >
            Sign In
          </button>
          <button
            onClick={() => { setMode("signup"); setError(null); }}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
              mode === "signup"
                ? "bg-emerald-500 text-gray-950 shadow-md shadow-emerald-500/20"
                : "text-gray-400 hover:text-gray-200"
            }`}
          >
            Create Account
          </button>
        </div>

        {/* Error Notification */}
        {error && (
          <div className="bg-rose-500/10 border border-rose-500/40 text-rose-400 px-4 py-3 rounded-xl text-xs flex items-center gap-2.5 animate-shake">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Option 1: Google OAuth Sign-In */}
        <div>
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={isGoogleSubmitting || isSubmitting}
            className="w-full bg-gray-900 hover:bg-gray-800 border border-gray-700 text-gray-200 font-semibold py-3 px-4 rounded-xl flex items-center justify-center gap-3 transition-all hover:border-gray-600 shadow-md disabled:opacity-50"
          >
            {isGoogleSubmitting ? (
              <Loader2 className="w-4 h-4 animate-spin text-emerald-400" />
            ) : (
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
            )}
            <span className="text-sm">
              {mode === "signin" ? "Sign in with Google" : "Sign up with Google"}
            </span>
          </button>
        </div>

        {/* Divider */}
        <div className="flex items-center gap-3">
          <div className="flex-1 h-px bg-gray-800" />
          <span className="text-xs text-gray-500 font-medium uppercase">Or email</span>
          <div className="flex-1 h-px bg-gray-800" />
        </div>

        {/* Option 2: Email & Password Form */}
        <form onSubmit={handleEmailSubmit} className="space-y-4">
          {mode === "signup" && (
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-300 flex items-center gap-1.5">
                <UserIcon className="w-3.5 h-3.5 text-emerald-400" />
                Full Name
              </label>
              <input
                type="text"
                required
                placeholder="John Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-gray-900 border border-gray-800 rounded-xl px-4 py-2.5 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-emerald-500 transition-all"
              />
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-300 flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-emerald-400" />
              Email Address
            </label>
            <input
              type="email"
              required
              placeholder="user@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-gray-900 border border-gray-800 rounded-xl px-4 py-2.5 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-emerald-500 transition-all"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-300 flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-emerald-400" />
              Password
            </label>
            <input
              type="password"
              required
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-gray-900 border border-gray-800 rounded-xl px-4 py-2.5 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-emerald-500 transition-all"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting || isGoogleSubmitting}
            className="w-full bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-gray-950 font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-950/50 disabled:opacity-50 mt-2"
          >
            {isSubmitting ? (
              <Loader2 className="w-4 h-4 animate-spin text-gray-950" />
            ) : (
              <>
                <span>{mode === "signin" ? "Sign In to Dashboard" : "Create Account"}</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Footer info */}
        <p className="text-center text-[11px] text-gray-500">
          Protected by Dynamic Pricing Security & Access Control Guardrails.
        </p>
      </div>
    </div>
  );
}
