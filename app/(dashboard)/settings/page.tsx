"use client";

/**
 * app/(dashboard)/settings/page.tsx
 *
 * Settings page — visible to ALL authenticated roles.
 *
 * Layout:
 *   Left  (~40%) — Depot Settings form (Depot Name, Currency, Distance Unit)
 *                   Linked to the `depot_settings` table via /api/settings.
 *                   Only Fleet Manager can save changes.
 *
 *   Right (~60%) — Role-Based Access Table
 *                   Columns: Fleet | Driver | Trips | Fleet Exp | Analytics
 *                   4 rows: Fleet Manager · Dispatcher · Financial Analyst · Safety Officer
 *                   Cell values: ✓ (full access), View (view-only), — (no access)
 */

import { useEffect, useState } from "react";
import {
  Settings,
  Building2,
  Save,
  Loader2,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  Eye,
  Minus,
  Ruler,
  IndianRupee,
} from "lucide-react";

// ─── Types ──────────────────────────────────────────────────────────────────

type DepotSettings = {
  depot_name: string;
  currency: string;
  distance_unit: "Kilometer" | "Meter" | "Inch";
};

type AccessLevel = "full" | "view" | "none";

type RoleRow = {
  role: string;
  displayName: string;
  fleet: AccessLevel;
  driver: AccessLevel;
  trips: AccessLevel;
  fleetExp: AccessLevel;
  analytics: AccessLevel;
};

// ─── RBAC Matrix (static — reflects the DB roles.owns_modules data) ──────────

const RBAC: RoleRow[] = [
  {
    role: "fleet_manager",
    displayName: "Fleet Manager",
    fleet: "full",
    driver: "full",
    trips: "none",
    fleetExp: "none",
    analytics: "full",
  },
  {
    role: "dispatcher",
    displayName: "Dispatcher",
    fleet: "view",
    driver: "none",
    trips: "full",
    fleetExp: "none",
    analytics: "none",
  },
  {
    role: "financial_analyst",
    displayName: "Financial Analyst",
    fleet: "none",
    driver: "full",
    trips: "view",
    fleetExp: "none",
    analytics: "none",
  },
  {
    role: "safety_officer",
    displayName: "Safety Officer",
    fleet: "view",
    driver: "none",
    trips: "none",
    fleetExp: "full",
    analytics: "full",
  },
];

const COLUMNS: {
  key: keyof Omit<RoleRow, "role" | "displayName">;
  label: string;
}[] = [
  { key: "fleet", label: "Fleet" },
  { key: "driver", label: "Driver" },
  { key: "trips", label: "Trips" },
  { key: "fleetExp", label: "Fleet Exp" },
  { key: "analytics", label: "Analytics" },
];

// ─── Role badge colours ──────────────────────────────────────────────────────

const ROLE_COLOURS: Record<string, string> = {
  fleet_manager: "bg-indigo-500/15 text-indigo-300 border border-indigo-500/30",
  dispatcher: "bg-sky-500/15 text-sky-300 border border-sky-500/30",
  financial_analyst:
    "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30",
  safety_officer: "bg-amber-500/15 text-amber-300 border border-amber-500/30",
};

// ─── Access cell renderer ────────────────────────────────────────────────────

function AccessCell({ level }: { level: AccessLevel }) {
  if (level === "full") {
    return (
      <div className="flex items-center justify-center">
        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 text-xs font-semibold text-emerald-400">
          <CheckCircle2 className="w-3 h-3" />
          Full
        </span>
      </div>
    );
  }
  if (level === "view") {
    return (
      <div className="flex items-center justify-center">
        <span className="inline-flex items-center gap-1 rounded-full bg-sky-500/15 border border-sky-500/30 px-2 py-0.5 text-xs font-semibold text-sky-400">
          <Eye className="w-3 h-3" />
          View
        </span>
      </div>
    );
  }
  return (
    <div className="flex items-center justify-center">
      <span className="inline-flex items-center justify-center rounded-full bg-slate-800/60 w-6 h-6">
        <Minus className="w-3 h-3 text-slate-600" />
      </span>
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────

export default function SettingsPage() {
  const [currentUser, setCurrentUser] = useState<{
    role: string;
    name: string;
  } | null>(null);
  const [settings, setSettings] = useState<DepotSettings>({
    depot_name: "",
    currency: "INR",
    distance_unit: "Kilometer",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{
    type: "success" | "error";
    msg: string;
  } | null>(null);

  const isFleetManager = currentUser?.role === "fleet_manager";

  // ── Fetch current user + settings ─────────────────────────────────────────
  useEffect(() => {
    Promise.all([
      fetch("/api/auth/me").then((r) => r.json()),
      fetch("/api/settings").then((r) => r.json()),
    ])
      .then(([authData, settingsData]) => {
        if (authData.user) setCurrentUser(authData.user);
        if (!settingsData.error) {
          setSettings({
            depot_name: settingsData.depot_name ?? "",
            currency: settingsData.currency ?? "INR",
            distance_unit: settingsData.distance_unit ?? "Kilometer",
          });
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  // ── Save handler ───────────────────────────────────────────────────────────
  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!isFleetManager) return;
    setSaving(true);
    setToast(null);
    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Save failed");
      setToast({ type: "success", msg: "Settings saved successfully." });
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Something went wrong.";
      setToast({ type: "error", msg: message });
    } finally {
      setSaving(false);
      setTimeout(() => setToast(null), 4000);
    }
  }

  // ── Loading skeleton ───────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-400" />
      </div>
    );
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="p-6 lg:p-8 space-y-6 min-h-screen">
      {/* ── Page header ───────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2 text-slate-100">
            <Settings className="w-5 h-5 " />
            Settings
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Depot configuration and role-based access overview.
            {!isFleetManager && (
              <span className="ml-1 text-amber-400">
                (Read-only — only Fleet Manager can save changes)
              </span>
            )}
          </p>
        </div>

        {/* Role badge */}
        {currentUser && (
          <span
            className={`text-xs font-medium rounded-full px-3 py-1 ${ROLE_COLOURS[currentUser.role] ?? "bg-slate-800 text-slate-300"}`}
          >
            {currentUser.name}
          </span>
        )}
      </div>

      {/* ── Toast ─────────────────────────────────────────────────────────── */}
      {toast && (
        <div
          className={`flex items-center gap-2 text-sm rounded-lg px-4 py-3 border ${
            toast.type === "success"
              ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
              : "bg-rose-500/10 border-rose-500/30 text-rose-300"
          }`}
        >
          {toast.type === "success" ? (
            <CheckCircle2 className="w-4 h-4 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0" />
          )}
          {toast.msg}
        </div>
      )}

      {/* ── Two-column layout ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 xl:grid-cols-5 gap-6 items-start">
        {/* ── LEFT: Depot Settings (2 / 5 columns) ────────────────────────── */}
        <div className="xl:col-span-2">
          <form
            onSubmit={handleSave}
            className="rounded-xl border border-slate-800 bg-slate-900/60 backdrop-blur-sm overflow-hidden"
          >
            {/* Card header */}
            <div className="px-6 py-4 border-b border-slate-800 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-indigo-400" />
              <span className="font-semibold text-slate-100 text-sm">
                Depot Configuration
              </span>
            </div>

            <div className="px-6 py-5 space-y-5">
              {/* Depot Name */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-400 uppercase tracking-wide">
                  Depot Name
                </label>
                <input
                  type="text"
                  value={settings.depot_name}
                  onChange={(e) =>
                    setSettings((s) => ({ ...s, depot_name: e.target.value }))
                  }
                  disabled={!isFleetManager}
                  placeholder="e.g. Mumbai Central Depot"
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-2.5 text-sm text-slate-100 placeholder-slate-600
                             focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/40
                             disabled:opacity-50 disabled:cursor-not-allowed transition"
                />
              </div>

              {/* Currency */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-400 uppercase tracking-wide flex items-center gap-1">
                  <IndianRupee className="w-3 h-3" />
                  Currency (in INR)
                </label>
                <div className="relative">
                  <select
                    value={settings.currency}
                    onChange={(e) =>
                      setSettings((s) => ({ ...s, currency: e.target.value }))
                    }
                    disabled={!isFleetManager}
                    className="w-full appearance-none rounded-lg border border-slate-700 bg-slate-950 px-4 py-2.5 text-sm text-slate-100
                               focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/40
                               disabled:opacity-50 disabled:cursor-not-allowed transition pr-8"
                  >
                    <option value="INR">INR — Indian Rupee (₹)</option>
                  </select>
                  <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-500">
                    ▾
                  </div>
                </div>
              </div>

              {/* Distance Unit */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-400 uppercase tracking-wide flex items-center gap-1">
                  <Ruler className="w-3 h-3" />
                  Distance Unit
                </label>
                <div className="relative">
                  <select
                    value={settings.distance_unit}
                    onChange={(e) =>
                      setSettings((s) => ({
                        ...s,
                        distance_unit: e.target
                          .value as DepotSettings["distance_unit"],
                      }))
                    }
                    disabled={!isFleetManager}
                    className="w-full appearance-none rounded-lg border border-slate-700 bg-slate-950 px-4 py-2.5 text-sm text-slate-100
                               focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/40
                               disabled:opacity-50 disabled:cursor-not-allowed transition pr-8"
                  >
                    <option value="Kilometer">Kilometer (km)</option>
                    <option value="Meter">Meter (m)</option>
                    <option value="Inch">Inch (in)</option>
                  </select>
                  <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-500">
                    ▾
                  </div>
                </div>
              </div>
            </div>

            {/* Save button — only shown / enabled for fleet_manager */}
            <div className="px-6 py-4 border-t border-slate-800">
              {isFleetManager ? (
                <button
                  type="submit"
                  disabled={saving}
                  className="w-full flex items-center justify-center gap-2 rounded-lg bg-indigo-600 hover:bg-indigo-500
                             px-4 py-2.5 text-sm font-semibold text-white transition
                             disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> Saving…
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" /> Save Settings
                    </>
                  )}
                </button>
              ) : (
                <div className="flex items-center gap-2 rounded-lg bg-slate-800/60 border border-slate-700 px-4 py-2.5 text-xs text-slate-500">
                  <ShieldCheck className="w-4 h-4 text-slate-600 shrink-0" />
                  Only Fleet Manager can modify depot settings.
                </div>
              )}
            </div>
          </form>
        </div>

        {/* ── RIGHT: RBAC Table (3 / 5 columns) ───────────────────────────── */}
        <div className="xl:col-span-3">
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 backdrop-blur-sm overflow-hidden">
            {/* Card header */}
            <div className="px-6 py-4 border-b border-slate-800 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-amber-400" />
              <span className="font-semibold text-slate-100 text-sm">
                Role-Based Access Control
              </span>
              <span className="ml-auto text-xs text-slate-500">
                Read-only overview
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                {/* Table head */}
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-950/40">
                    <th className="px-5 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wide w-40">
                      Role
                    </th>
                    {COLUMNS.map((col) => (
                      <th
                        key={col.key}
                        className="px-3 py-3 text-center text-xs font-semibold text-slate-400 uppercase tracking-wide"
                      >
                        {col.label}
                      </th>
                    ))}
                  </tr>
                </thead>

                {/* Table body */}
                <tbody className="divide-y divide-slate-800/60">
                  {RBAC.map((row, idx) => (
                    <tr
                      key={row.role}
                      className={`transition-colors hover:bg-slate-800/30 ${idx % 2 === 0 ? "" : "bg-slate-900/20"}`}
                    >
                      {/* Role name */}
                      <td className="px-5 py-4">
                        <span
                          className={`inline-block text-xs font-semibold rounded-full px-2.5 py-1 ${ROLE_COLOURS[row.role]}`}
                        >
                          {row.displayName}
                        </span>
                      </td>

                      {/* Permission cells */}
                      {COLUMNS.map((col) => (
                        <td key={col.key} className="px-3 py-4">
                          <AccessCell level={row[col.key] as AccessLevel} />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Legend */}
            <div className="px-6 py-3 border-t border-slate-800 bg-slate-950/30 flex flex-wrap gap-4 text-xs text-slate-500">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                Full access
              </span>
              <span className="flex items-center gap-1.5">
                <Eye className="w-3.5 h-3.5 text-sky-400" />
                View only
              </span>
              <span className="flex items-center gap-1.5">
                <Minus className="w-3.5 h-3.5 text-slate-600" />
                No access
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
