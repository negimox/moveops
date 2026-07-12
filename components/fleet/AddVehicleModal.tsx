"use client";

import { useState } from "react";
import { X, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type AddVehicleModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
};

export default function AddVehicleModal({
  isOpen,
  onClose,
  onSuccess,
}: AddVehicleModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);

    // Validations
    const yearStr = formData.get("year") as string;
    const year = yearStr ? parseInt(yearStr, 10) : undefined;
    const currentYear = new Date().getFullYear();

    if (year && year > currentYear) {
      setError(`Year cannot be newer than the current year (${currentYear})`);
      setLoading(false);
      return;
    }

    const registrationNo = formData.get("registration_no") as string;
    if (registrationNo) {
      const regRegex =
        /^[A-Z]{2}[ -]?[0-9]{1,2}(?:[ -]?[A-Z])?(?:[ -]?[A-Z]*)?[ -]?[0-9]{4}$/;
      if (!regRegex.test(registrationNo)) {
        setError(
          "Invalid registration number format. Example: MH 12 AB 1234, DL03CW3121",
        );
        setLoading(false);
        return;
      }
    }

    const data = {
      vehicle_id: formData.get("vehicle_id"),
      type: formData.get("type"),
      region: formData.get("region"),
      make_model: formData.get("make_model"),
      year,
      registration_no: registrationNo,
      capacity_kg: parseInt(formData.get("capacity_kg") as string, 10),
      avg_cost_per_km: parseFloat(formData.get("avg_cost_per_km") as string),
    };

    try {
      const res = await fetch("/api/vehicles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const result = await res.json();

      if (!res.ok) throw new Error(result.error || "Failed to add vehicle");

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-card border border-border rounded-xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Truck className="w-5 h-5 text-primary" />
            </div>
            <h2 className="text-lg font-semibold text-foreground">
              Add New Vehicle
            </h2>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        <div className="p-6 overflow-y-auto">
          {error && (
            <div className="mb-6 p-4 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive text-sm font-medium">
              {error}
            </div>
          )}

          <form
            id="add-vehicle-form"
            onSubmit={handleSubmit}
            className="space-y-5"
          >
            <div className="grid grid-cols-2 gap-5">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Vehicle ID *
                </label>
                <Input required name="vehicle_id" placeholder="e.g. TRUCK-45" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Type *
                </label>
                <select
                  required
                  name="type"
                  className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="Truck">Truck</option>
                  <option value="Van">Van</option>
                  <option value="Bus">Bus</option>
                  <option value="Car">Car</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-5">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Registration Number
                </label>
                <Input
                  name="registration_no"
                  placeholder="e.g. MH 12 AB 1234"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Region *
                </label>
                <select
                  required
                  name="region"
                  className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="" disabled>
                    Select a region
                  </option>
                  <option value="North">North</option>
                  <option value="South">South</option>
                  <option value="East">East</option>
                  <option value="West">West</option>
                  <option value="Central">Central</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-5">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Make & Model
                </label>
                <Input name="make_model" placeholder="e.g. Tata Prima" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Year
                </label>
                <Input
                  type="number"
                  name="year"
                  placeholder="2023"
                  min="1990"
                  max={new Date().getFullYear()}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-5">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Capacity (kg) *
                </label>
                <Input
                  required
                  type="number"
                  name="capacity_kg"
                  placeholder="5000"
                  min="0"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Avg Cost/km (₹) *
                </label>
                <Input
                  required
                  type="number"
                  step="0.1"
                  name="avg_cost_per_km"
                  placeholder="12.5"
                  min="0"
                />
              </div>
            </div>
          </form>
        </div>

        <div className="p-6 border-t border-border bg-muted/20 flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" form="add-vehicle-form" disabled={loading}>
            {loading ? "Adding..." : "Add Vehicle"}
          </Button>
        </div>
      </div>
    </div>
  );
}
