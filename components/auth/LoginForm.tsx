"use client";

/**
 * components/auth/LoginForm.tsx
 * Client-side login form with:
 *   - Email + password inputs with real-time validation
 *   - Role display cards (visual preview of 4 roles)
 *   - Calls POST /api/auth/login, redirects to /dashboard on success
 *   - Clear, friendly error messages — no crashes on bad input
 */

import { useState, FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

// ─── Role info for the info panel ──────────────────────────────────────────

const ROLES = [
  { label: "Fleet Manager", color: "#4f46e5", icon: "🚌", desc: "Full access" },
  {
    label: "Dispatcher",
    color: "#06b6d4",
    icon: "📋",
    desc: "Trips + Drivers",
  },
  {
    label: "Safety Officer",
    color: "#f59e0b",
    icon: "🛡️",
    desc: "Safety + Maintenance",
  },
  {
    label: "Financial Analyst",
    color: "#10b981",
    icon: "📊",
    desc: "Reports + Expenses",
  },
];

// ─── Validation helpers ────────────────────────────────────────────────────

function validateEmail(v: string) {
  if (!v.trim()) return "Email is required.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v))
    return "Enter a valid email address.";
  return "";
}

function validatePassword(v: string) {
  if (!v) return "Password is required.";
  if (v.length < 6) return "Password must be at least 6 characters.";
  return "";
}

// ─── Component ─────────────────────────────────────────────────────────────

export default function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("from") ?? "/dashboard";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [emailErr, setEmailErr] = useState("");
  const [passErr, setPassErr] = useState("");
  const [apiError, setApiError] = useState("");
  const [loading, setLoading] = useState(false);

  // Validate on blur so the user isn't nagged while typing
  const handleEmailBlur = () => setEmailErr(validateEmail(email));
  const handlePassBlur = () => setPassErr(validatePassword(password));

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setApiError("");

    // Final validation before submit
    const eErr = validateEmail(email);
    const pErr = validatePassword(password);
    setEmailErr(eErr);
    setPassErr(pErr);
    if (eErr || pErr) return;

    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setApiError(data.error ?? "Login failed. Please try again.");
        return;
      }

      // Success — navigate to the intended page
      router.push(redirectTo);
      router.refresh();
    } catch {
      setApiError("Network error. Please check your connection.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col md:flex-row gap-8 items-start w-full max-w-[900px] p-6 mx-auto">
      {/* ── Left: Login card ────────────────────────────────────────── */}
      <Card className="flex-none w-[380px] p-6 rounded-2xl shadow-xl">
        <CardHeader className="px-0 pt-0 pb-6">
          <div className="mb-6">
            <div className="inline-flex items-center gap-2.5 px-3.5 py-2 rounded-xl bg-primary/10 mb-6">
              <span className="text-xl">🚌</span>
              <span className="font-bold text-base text-primary tracking-tight">
                TransitOps
              </span>
            </div>
            <CardTitle className="text-2xl font-bold mb-1.5">
              Sign in to your account
            </CardTitle>
            <CardDescription className="text-[13px]">
              Enter your credentials to continue
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="px-0 pb-0">
          {/* API Error Banner */}
          {apiError && (
            <div
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: "8px",
                padding: "10px 12px",
                borderRadius: "8px",
                marginBottom: "20px",
                background: "#fef2f2",
                border: "1px solid #fecaca",
              }}
            >
              <span style={{ fontSize: "15px", flexShrink: 0 }}>⚠️</span>
              <p
                style={{ fontSize: "13px", color: "#b91c1c", lineHeight: 1.4 }}
              >
                {apiError}
              </p>
            </div>
          )}

          {/* Form */}
          <form
            onSubmit={handleSubmit}
            noValidate
            style={{ display: "flex", flexDirection: "column", gap: "18px" }}
          >
            {/* Email */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium" htmlFor="login-email">
                Email
              </label>
              <Input
                id="login-email"
                type="email"
                placeholder="you@transitops.in"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (emailErr) setEmailErr("");
                }}
                onBlur={handleEmailBlur}
                autoComplete="email"
                className={emailErr ? "border-destructive" : ""}
              />
              {emailErr && (
                <p className="text-xs text-destructive mt-1">{emailErr}</p>
              )}
            </div>

            {/* Password */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium" htmlFor="login-password">
                Password
              </label>
              <Input
                id="login-password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (passErr) setPassErr("");
                }}
                onBlur={handlePassBlur}
                autoComplete="current-password"
                className={passErr ? "border-destructive" : ""}
              />
              {passErr && (
                <p className="text-xs text-destructive mt-1">{passErr}</p>
              )}
            </div>

            {/* Submit */}
            <Button
              id="login-submit-btn"
              type="submit"
              disabled={loading}
              className="w-full mt-2"
            >
              {loading ? (
                <span className="inline-flex items-center gap-2">
                  <LoadingSpinner />
                  Signing in…
                </span>
              ) : (
                "Sign In"
              )}
            </Button>
          </form>

          {/* Demo credentials hint */}
          <div className="mt-6 p-3 rounded-lg bg-muted border border-border">
            <p className="text-[11px] font-semibold text-muted-foreground mb-1.5 uppercase tracking-wide">
              Demo Credentials
            </p>
            <p className="text-xs leading-relaxed">
              <strong>Fleet:</strong> fleet@transitops.in
              <br />
              <strong>Dispatch:</strong> dispatch@transitops.in
              <br />
              <strong>Safety:</strong> safety@transitops.in
              <br />
              <strong>Finance:</strong> finance@transitops.in
              <br />
              <span className="text-muted-foreground">
                Password for all: <strong>Password@123</strong>
              </span>
            </p>
          </div>
        </CardContent>
      </Card>

      {/* ── Right: Role info panel ──────────────────────────────────── */}
      <div className="flex-1 w-full pt-4 md:pt-0">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-4">
          One login. Four roles.
        </p>
        <div className="flex flex-col gap-2.5">
          {ROLES.map((role) => (
            <div
              key={role.label}
              className="flex items-center gap-3 px-4 py-3 rounded-xl bg-card border border-border transition-colors hover:bg-muted/50"
            >
              <span
                className="w-9 h-9 flex items-center justify-center rounded-lg text-lg"
                style={{ background: `${role.color}22` }}
              >
                {role.icon}
              </span>
              <div>
                <p className="font-semibold text-[13px] text-foreground">
                  {role.label}
                </p>
                <p className="text-muted-foreground text-xs">
                  {role.desc}
                </p>
              </div>
              <div
                className="ml-auto w-2 h-2 rounded-full"
                style={{ background: role.color }}
              />
            </div>
          ))}
        </div>

        <p className="mt-6 text-xs text-muted-foreground/60 leading-relaxed">
          TransitOps • Smart Transport Operations Platform
          <br />
          Odoo Hiring Hackathon 2026
        </p>
      </div>
    </div>
  );
}

// ─── Mini spinner ───────────────────────────────────────────────────────────

function LoadingSpinner() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 14 14"
      fill="none"
      style={{ animation: "spin 0.7s linear infinite" }}
    >
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <circle
        cx="7"
        cy="7"
        r="6"
        stroke="rgba(255,255,255,0.3)"
        strokeWidth="2"
      />
      <path
        d="M7 1a6 6 0 0 1 6 6"
        stroke="white"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}
