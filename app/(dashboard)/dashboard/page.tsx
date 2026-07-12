/**
 * app/(dashboard)/dashboard/page.tsx
 * Dashboard home — KPI skeleton + placeholder for Phase 2 real data.
 *
 * In Phase 4 we'll wire this to GET /api/dashboard for live aggregates.
 * For now it confirms the auth + layout shell works end-to-end.
 */

import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const metadata = {
  title: "Dashboard — TransitOps",
};

// ─── KPI card placeholder ──────────────────────────────────────────────────

function KpiSkeleton({
  label,
  value,
  sub,
  color,
}: {
  label: string;
  value: string | number;
  sub?: string;
  color: string;
}) {
  return (
    <Card>
      <CardContent className="p-5 flex flex-col justify-center h-full">
        <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wide">
          {label}
        </p>
        <p className="text-3xl font-bold leading-none mb-2" style={{ color }}>
          {value}
        </p>
        {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
      </CardContent>
    </Card>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────

export default async function DashboardPage() {
  // Server-side auth check (belt + suspenders after middleware)
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  return (
    <div style={{ padding: "32px" }}>
      {/* ── Page header ─────────────────────────────────────────── */}
      <div style={{ marginBottom: "28px" }}>
        <h1
          style={{
            fontSize: "20px",
            fontWeight: 700,
            color: "var(--text-primary)",
          }}
        >
          Dashboard
        </h1>
        <p
          style={{
            color: "var(--text-muted)",
            fontSize: "13px",
            marginTop: "4px",
          }}
        >
          Welcome back, <strong>{user.name}</strong> ·{" "}
          {user.role.replace("_", " ")}
        </p>
      </div>

      {/* ── KPI Cards ───────────────────────────────────────────── */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          gap: "16px",
          marginBottom: "28px",
        }}
      >
        <KpiSkeleton
          label="Active Vehicles"
          value="—"
          sub="Loading…"
          color="#4f46e5"
        />
        <KpiSkeleton
          label="Drivers On Trip"
          value="—"
          sub="Loading…"
          color="#06b6d4"
        />
        <KpiSkeleton
          label="Trips Today"
          value="—"
          sub="Loading…"
          color="#f59e0b"
        />
        <KpiSkeleton
          label="Pending Maintenance"
          value="—"
          sub="Loading…"
          color="#ef4444"
        />
        <KpiSkeleton
          label="Revenue (Month)"
          value="—"
          sub="Loading…"
          color="#10b981"
        />
        <KpiSkeleton
          label="Fleet Utilisation"
          value="—"
          sub="Loading…"
          color="#8b5cf6"
        />
      </div>
    </div>
  );
}
