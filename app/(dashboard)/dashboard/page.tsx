/**
 * app/(dashboard)/dashboard/page.tsx
 * Dashboard home — Real-time metrics and charts.
 */

import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import DashboardMetrics from "@/components/dashboard/DashboardMetrics";

export const metadata = {
  title: "Dashboard — TransitOps",
};

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

      <DashboardMetrics />
    </div>
  );
}
