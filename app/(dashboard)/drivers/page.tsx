"use client";

import { useEffect, useState, useMemo } from "react";
import {
  Users,
  Plus,
  ShieldCheck,
  ShieldAlert,
  CheckCircle2,
  Shield,
  MoreHorizontal,
  ArrowUpDown,
  Pen,
  Eye,
} from "lucide-react";
import AddDriverModal from "@/components/drivers/AddDriverModal";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/ui/data-table";
import { ColumnDef } from "@tanstack/react-table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

type Driver = {
  id: number;
  name: string;
  contact: string;
  license_id: string;
  license_verified: boolean;
  license_expiry: string | null;
  category: string;
  status: "available" | "on_trip" | "off_duty" | "suspended";
  trip_count: number;
  safety: "available" | "on_trip" | "off_duty" | "suspended";
};

type Trip = {
  id: number;
  driver_id: number;
  status: string;
  origin: string;
  destination: string;
  scheduled_at: string;
};

type UserContext = {
  id: number;
  name: string;
  email: string;
  role: string;
};

const TripProgressCell = ({
  driver,
  trips,
}: {
  driver: Driver;
  trips: Trip[];
}) => {
  const [progress, setProgress] = useState<number | null>(null);

  useEffect(() => {
    if (driver.status !== "on_trip") return;
    const activeTrip = trips.find(
      (t) => t.driver_id === driver.id && t.status === "on_trip",
    );
    if (!activeTrip) return;

    // Generate a consistent random number based on driver id so it doesn't jump around on re-renders
    const randomPct = Math.floor(Math.abs(Math.sin(driver.id * 123.45)) * 100);
    setProgress(randomPct);
  }, [driver, trips]);

  if (driver.status !== "on_trip")
    return <span className="text-muted-foreground">-</span>;
  if (progress === null)
    return <span className="text-muted-foreground text-xs">Calc...</span>;

  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden w-24">
        <div
          className="h-full bg-blue-500 rounded-full transition-all"
          style={{ width: `${progress}%` }}
        />
      </div>
      <span className="text-xs">{progress.toFixed(0)}%</span>
    </div>
  );
};

const statusColors = {
  available: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  on_trip: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  off_duty: "bg-slate-500/10 text-slate-400 border-slate-500/20",
  suspended: "bg-red-500/10 text-red-400 border-red-500/20",
};

const LicensePopover = ({ driver }: { driver: Driver }) => {
  const [loading, setLoading] = useState(false);
  const [fileUrl, setFileUrl] = useState<string | null>(null);

  const fetchLicense = async () => {
    if (fileUrl || loading) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/drivers/${driver.id}/license`);
      const data = await res.json();
      if (res.ok && data.url) {
        setFileUrl(data.url);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          onClick={fetchLicense}
          className="flex flex-col items-start hover:bg-slate-800/50 p-1.5 -ml-1.5 rounded-md transition-colors text-left focus:outline-none"
        >
          <div className="flex items-center gap-2">
            <span className="font-mono text-sm uppercase text-slate-200">
              {driver.license_id}
            </span>
            <span title="Verified by DigiLocker">
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
            </span>
          </div>
          {driver.license_expiry && (
            <div className="text-xs text-muted-foreground mt-0.5">
              Exp: {new Date(driver.license_expiry).toLocaleDateString()}
            </div>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent
        className="w-80 p-0 border-slate-700 bg-slate-900 overflow-hidden shadow-xl"
        align="start"
      >
        <div className="p-3 border-b border-slate-800 flex items-center justify-between bg-slate-900/80">
          <span className="font-medium text-sm text-white">
            Verified License
          </span>
          <Badge
            variant="outline"
            className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-[10px] h-5"
          >
            Verified
          </Badge>
        </div>
        <div className="p-3 bg-slate-950 flex flex-col gap-2">
          {loading ? (
            <div className="flex items-center justify-center py-6 text-muted-foreground text-xs gap-2">
              <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />{" "}
              Loading document...
            </div>
          ) : fileUrl ? (
            <div className="relative aspect-[3/2] w-full bg-slate-900 rounded-md overflow-hidden border border-slate-800 flex items-center justify-center">
              {fileUrl.includes(".pdf") ? (
                <iframe src={fileUrl} className="w-full h-full border-0" />
              ) : (
                <img
                  src={fileUrl}
                  alt="License"
                  className="object-contain w-full h-full"
                />
              )}
              <div className="absolute bottom-2 right-2 flex gap-1">
                <Button
                  size="icon"
                  variant="secondary"
                  className="h-7 w-7 bg-black/50 hover:bg-black/80 text-white backdrop-blur-sm"
                  onClick={() => {
                    window.open(fileUrl, "_blank");
                  }}
                  title="Expand in new tab"
                >
                  <Eye className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          ) : (
            <div className="text-center py-4 text-xs text-muted-foreground">
              Document not available
            </div>
          )}
          {driver.license_expiry && (
            <div className="flex justify-between items-center mt-2 px-1">
              <span className="text-xs text-slate-400">Valid Until</span>
              <span className="text-xs font-medium text-slate-200">
                {new Date(driver.license_expiry).toLocaleDateString()}
              </span>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default function DriversPage() {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [user, setUser] = useState<UserContext | null>(null);

  // Status/Safety Modal State
  const [statusModalDriver, setStatusModalDriver] = useState<Driver | null>(
    null,
  );
  const [newStatus, setNewStatus] = useState<string>("");
  const [newSafety, setNewSafety] = useState<string>("");
  const [statusLoading, setStatusLoading] = useState(false);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => setUser(data.user))
      .catch(console.error);

    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [dRes, tRes] = await Promise.all([
        fetch("/api/drivers"),
        fetch("/api/trips").catch(() => null), // Ignore trip error if roles restrict it
      ]);

      const dData = await dRes.json();
      if (!dRes.ok) throw new Error(dData.error);
      setDrivers(dData.drivers);

      if (tRes && tRes.ok) {
        const tData = await tRes.json();
        setTrips(tData.trips);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const columns = useMemo<ColumnDef<Driver>[]>(
    () => [
      {
        accessorKey: "name",
        header: ({ column }) => (
          <Button
            variant="ghost"
            className="p-0 hover:bg-transparent"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Driver Name <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        ),
        cell: ({ row }) => (
          <div>
            <div className="font-medium">{row.original.name}</div>
            <div className="text-xs text-muted-foreground">
              {row.original.category}
            </div>
          </div>
        ),
      },
      {
        accessorKey: "contact",
        header: "Contact",
        cell: ({ row }) => (
          <span className="font-mono text-sm">{row.original.contact}</span>
        ),
      },
      {
        accessorKey: "license_id",
        header: "License (DigiLocker)",
        cell: ({ row }) => {
          const d = row.original;
          return (
            <div>
              {d.license_verified ? (
                <LicensePopover driver={d} />
              ) : (
                <div className="flex flex-col p-1.5 -ml-1.5">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm uppercase">
                      {d.license_id}
                    </span>
                    <span title="Unverified">
                      <ShieldAlert className="w-4 h-4 text-amber-500" />
                    </span>
                  </div>
                  {d.license_expiry && (
                    <div className="text-xs text-muted-foreground mt-0.5">
                      Exp: {new Date(d.license_expiry).toLocaleDateString()}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        },
      },
      {
        accessorKey: "safety",
        header: "Safety",
        cell: ({ row }) => {
          const safety = row.original.safety;
          return (
            <Badge
              variant="outline"
              className={`${statusColors[safety] || "bg-slate-500/10 text-slate-400"}`}
            >
              {safety.replace("_", " ").toUpperCase()}
            </Badge>
          );
        },
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => (
          <Badge
            variant="outline"
            className={`${statusColors[row.original.status]}`}
          >
            {row.original.status.replace("_", " ").toUpperCase()}
          </Badge>
        ),
      },
      {
        id: "trip_progress",
        header: "Trip Completed %",
        cell: ({ row }) => (
          <TripProgressCell driver={row.original} trips={trips} />
        ),
      },
      {
        id: "actions",
        header: "Actions",
        cell: ({ row }) => {
          const d = row.original;
          // Only fleet manager or safety officer can update status
          const canEdit =
            user?.role === "safety_officer" || user?.role === "fleet_manager";

          if (!canEdit) {
            return null;
          }

          return (
            <DropdownMenu>
              <DropdownMenuTrigger className="inline-flex items-center justify-center rounded-md h-8 w-8 text-muted-foreground hover:bg-slate-800 transition-colors focus:outline-none">
                <MoreHorizontal className="w-4 h-4" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onClick={() => {
                    setStatusModalDriver(d);
                    setNewStatus(d.status);
                    setNewSafety(d.safety || "available");
                  }}
                >
                  Change Status & Safety
                </DropdownMenuItem>
                {d.status === "pending_approval" && (
                  <DropdownMenuItem
                    onClick={async () => {
                      try {
                        const res = await fetch(
                          "/api/drivers/verify-license/init",
                          {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ driverId: d.id }),
                          },
                        );
                        const data = await res.json();
                        if (!res.ok) throw new Error(data.error);

                        localStorage.setItem("setu_request_id", data.id);
                        localStorage.setItem("setu_driver_id", d.id.toString());

                        window.location.href = data.url;
                      } catch (err: any) {
                        alert(err.message);
                      }
                    }}
                    className="text-emerald-400"
                  >
                    Verify DigiLocker & Approve
                  </DropdownMenuItem>
                )}
                {d.license_verified && (
                  <DropdownMenuItem
                    onClick={async () => {
                      try {
                        const res = await fetch(`/api/drivers/${d.id}/license`);
                        const data = await res.json();
                        if (!res.ok) throw new Error(data.error);

                        if (data.fileBase64) {
                          const pdfWindow = window.open("");
                          if (pdfWindow) {
                            if (data.fileBase64.includes("application/pdf")) {
                              pdfWindow.document.write(
                                `<iframe width='100%' height='100%' src='${data.fileBase64}'></iframe>`,
                              );
                            } else {
                              pdfWindow.document.write(
                                `<img style='max-width:100%;' src='${data.fileBase64}' />`,
                              );
                            }
                            pdfWindow.document.body.style.margin = "0";
                          }
                        } else {
                          alert("No document found");
                        }
                      } catch (err: any) {
                        alert("Error viewing document: " + err.message);
                      }
                    }}
                  >
                    View License Document
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          );
        },
      },
    ],
    [trips, user],
  );

  useEffect(() => {
    // Check if coming back from Setu DigiLocker
    const requestId = localStorage.getItem("setu_request_id");
    const driverId = localStorage.getItem("setu_driver_id");
    const newDriverDataStr = localStorage.getItem("setu_new_driver_data");

    if (requestId && (driverId || newDriverDataStr)) {
      setLoading(true);

      const payload: any = { requestId };
      if (driverId) payload.driverId = Number(driverId);
      if (newDriverDataStr)
        payload.newDriverData = JSON.parse(newDriverDataStr);

      fetch("/api/drivers/verify-license/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
        .then((res) => res.json())
        .then((data) => {
          if (!data.success) throw new Error(data.error);
          alert("DigiLocker Verification Successful! Driver Approved.");
          fetchData();
        })
        .catch((err) => {
          alert("Verification failed: " + err.message);
        })
        .finally(() => {
          localStorage.removeItem("setu_request_id");
          localStorage.removeItem("setu_driver_id");
          localStorage.removeItem("setu_new_driver_data");
          setLoading(false);
        });
    }
  }, []);

  return (
    <div className="p-8 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Users className="w-6 h-6 text-primary" />
            Drivers & Compliance
            {user?.role === "safety_officer" ||
            user?.role === "fleet_manager" ? (
              <Badge
                variant="secondary"
                className="ml-2 bg-indigo-500/10 text-indigo-400 gap-1.5"
              >
                <Pen className="w-3.5 h-3.5" /> Editor
              </Badge>
            ) : (
              <Badge
                variant="secondary"
                className="ml-2 bg-slate-800 text-slate-300 gap-1.5"
              >
                <Eye className="w-3.5 h-3.5" /> View Only
              </Badge>
            )}
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Manage driver records, track compliance, and verify licenses.
          </p>
        </div>

        {(user?.role === "safety_officer" ||
          user?.role === "fleet_manager") && (
          <Button onClick={() => setIsAddModalOpen(true)}>
            <Plus className="w-4 h-4 mr-2" /> Register Driver
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Users className="w-4 h-4 text-primary" />
              </div>
              Total Drivers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{drivers.length}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-3">
              <div className="p-2 bg-emerald-500/10 rounded-lg">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              </div>
              Available
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {drivers.filter((d) => d.status === "available").length}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-3">
              <div className="p-2 bg-blue-500/10 rounded-lg">
                <Shield className="w-4 h-4 text-blue-500" />
              </div>
              On Trip
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {drivers.filter((d) => d.status === "on_trip").length}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-3">
              <div className="p-2 bg-red-500/10 rounded-lg">
                <ShieldAlert className="w-4 h-4 text-red-500" />
              </div>
              Suspended
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {drivers.filter((d) => d.status === "suspended").length}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card className="overflow-hidden">
        <CardContent className="p-0">
          {loading ? (
            <div className="h-48 flex items-center justify-center text-muted-foreground">
              <div className="flex flex-col items-center gap-3">
                <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                Loading drivers...
              </div>
            </div>
          ) : error ? (
            <div className="h-24 flex items-center justify-center text-destructive bg-destructive/10">
              {error}
            </div>
          ) : (
            <DataTable
              columns={columns}
              data={drivers}
              searchKey="name"
              searchPlaceholder="Search driver by name..."
            />
          )}
        </CardContent>
      </Card>

      {/* Add Driver Modal */}
      <AddDriverModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={fetchData}
      />

      {/* Change Status Modal */}
      <Dialog
        open={!!statusModalDriver}
        onOpenChange={(open) => {
          if (!open) setStatusModalDriver(null);
        }}
      >
        <DialogContent className="sm:max-w-md bg-slate-900 border-slate-800 text-white">
          <DialogHeader>
            <DialogTitle>Update Driver</DialogTitle>
            <DialogDescription className="text-slate-400">
              Update status and safety for {statusModalDriver?.name}.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">
                Status
              </label>
              <select
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-indigo-500 transition-all appearance-none"
              >
                <option value="available">Available</option>
                <option value="on_trip">On Trip</option>
                <option value="off_duty">Off Duty</option>
                <option value="suspended">Suspended</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">
                Safety
              </label>
              <select
                value={newSafety}
                onChange={(e) => setNewSafety(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-indigo-500 transition-all appearance-none"
              >
                <option value="available">Available</option>
                <option value="on_trip">On Trip</option>
                <option value="off_duty">Off Duty</option>
                <option value="suspended">Suspended</option>
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setStatusModalDriver(null)}
              className="border-slate-700 bg-transparent text-slate-300 hover:bg-slate-800"
            >
              Cancel
            </Button>
            <Button
              onClick={async () => {
                if (!statusModalDriver || !newStatus) return;
                setStatusLoading(true);
                try {
                  const res = await fetch(
                    `/api/drivers/${statusModalDriver.id}/status`,
                    {
                      method: "PATCH",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        status: newStatus,
                        safety: newSafety,
                      }),
                    },
                  );
                  if (!res.ok) {
                    const data = await res.json();
                    throw new Error(data.error);
                  }
                  setStatusModalDriver(null);
                  fetchData();
                } catch (err: any) {
                  alert(err.message);
                } finally {
                  setStatusLoading(false);
                }
              }}
              disabled={statusLoading || !newStatus}
              className="bg-indigo-600 hover:bg-indigo-700 text-white"
            >
              {statusLoading ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
