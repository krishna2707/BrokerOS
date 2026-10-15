"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  X,
  Download,
  Loader2,
  Check,
  Building2,
  CheckSquare,
  Square,
  AlertCircle,
} from "lucide-react";
import { formatInventoryToCsv } from "@brokeros/constants";

interface UnitData {
  id?: string;
  unitNumber?: string;
  type?: string;
  status?: string;
  carpetArea?: number | string | null;
  builtUpArea?: number | string | null;
  superBuiltUpArea?: number | string | null;
  facing?: string | null;
  balconies?: number | null;
  parkingIncluded?: boolean;
  basePrice?: number | string | null;
  pricePerSqFt?: number | string | null;
  totalPrice?: number | string | null;
  constructionStatus?: string | null;
  remarks?: string | null;
  [key: string]: unknown;
}

interface FloorData {
  id?: string;
  floorNumber?: number;
  name?: string | null;
  units?: UnitData[];
}

interface TowerMetrics {
  totalUnits: number;
  availableUnits: number;
  soldUnits: number;
  reservedUnits: number;
  blockedUnits: number;
}

interface TowerData {
  id: string;
  name: string;
  totalFloors?: number | null;
  totalUnits?: number | null;
  constructionStatus?: string | null;
  floors?: FloorData[];
  units?: UnitData[];
  metrics?: TowerMetrics;
  [key: string]: unknown;
}

interface ExportInventoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  projectName: string;
}

export function ExportInventoryModal({
  isOpen,
  onClose,
  projectId,
  projectName,
}: ExportInventoryModalProps) {
  const [towers, setTowers] = useState<TowerData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedTowerIds, setSelectedTowerIds] = useState<string[]>([]);
  const [isExporting, setIsExporting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // Load towers when modal opens
  useEffect(() => {
    if (!isOpen || !projectId) return;

    const fetchTowers = async () => {
      try {
        setLoading(true);
        setError(null);
        setIsSuccess(false);

        const baseUrl = process.env.NEXT_PUBLIC_API_URL || "/api/proxy";
        const res = await fetch(`${baseUrl}/api/inventory/projects/${projectId}/towers`);
        if (!res.ok) {
          throw new Error("Failed to load towers for this project");
        }
        const data = await res.json();
        const towersList: TowerData[] = Array.isArray(data) ? data : [];
        setTowers(towersList);
        // By default, select all towers
        setSelectedTowerIds(towersList.map((t) => t.id));
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Failed to load project inventory data";
        setError(message);
      } finally {
        setLoading(false);
      }
    };

    fetchTowers();
  }, [isOpen, projectId]);

  // Compute unit metrics for each tower
  const towerStats = useMemo(() => {
    return towers.map((tower) => {
      let totalUnits = 0;
      let availableUnits = 0;
      let soldUnits = 0;
      let reservedUnits = 0;
      let blockedUnits = 0;

      if (Array.isArray(tower.floors)) {
        tower.floors.forEach((floor: FloorData) => {
          if (Array.isArray(floor.units)) {
            floor.units.forEach((unit: UnitData) => {
              totalUnits++;
              const status = unit.status || "AVAILABLE";
              if (status === "AVAILABLE") availableUnits++;
              else if (status === "SOLD") soldUnits++;
              else if (status === "RESERVED") reservedUnits++;
              else if (status === "BLOCKED") blockedUnits++;
            });
          }
        });
      } else if (Array.isArray(tower.units)) {
        totalUnits = tower.units.length;
        tower.units.forEach((unit: UnitData) => {
          const status = unit.status || "AVAILABLE";
          if (status === "AVAILABLE") availableUnits++;
          else if (status === "SOLD") soldUnits++;
          else if (status === "RESERVED") reservedUnits++;
          else if (status === "BLOCKED") blockedUnits++;
        });
      }

      const metrics: TowerMetrics = {
        totalUnits,
        availableUnits,
        soldUnits,
        reservedUnits,
        blockedUnits,
      };

      return {
        ...tower,
        metrics,
      };
    });
  }, [towers]);

  // Selected totals
  const selectedTowers = useMemo(() => {
    return towerStats.filter((t) => selectedTowerIds.includes(t.id));
  }, [towerStats, selectedTowerIds]);

  const totalSelectedUnits = useMemo(() => {
    return selectedTowers.reduce((acc, t) => acc + (t.metrics?.totalUnits || 0), 0);
  }, [selectedTowers]);

  const allSelected = towers.length > 0 && selectedTowerIds.length === towers.length;

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedTowerIds([]);
    } else {
      setSelectedTowerIds(towers.map((t) => t.id));
    }
  };

  const toggleTower = (towerId: string) => {
    if (selectedTowerIds.includes(towerId)) {
      setSelectedTowerIds(selectedTowerIds.filter((id) => id !== towerId));
    } else {
      setSelectedTowerIds([...selectedTowerIds, towerId]);
    }
  };

  const sanitizeName = (name: string) => {
    return (name || "Project")
      .trim()
      .replace(/[^a-zA-Z0-9_-]/g, "_")
      .replace(/_+/g, "_");
  };

  const handleExport = () => {
    if (selectedTowers.length === 0 || isExporting) return;

    try {
      setIsExporting(true);

      const csvData = formatInventoryToCsv(selectedTowers, projectName);
      const blob = new Blob([csvData], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);

      const dateStr = new Date().toISOString().split("T")[0];
      const safeProject = sanitizeName(projectName);

      let towerTag = "All_Towers";
      if (selectedTowers.length === 1) {
        towerTag = sanitizeName(selectedTowers[0].name || "Tower");
      } else if (selectedTowers.length < towers.length) {
        towerTag = `${selectedTowers.length}_Towers`;
      }

      const filename = `${safeProject}_${towerTag}_Inventory_${dateStr}.csv`;

      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", filename);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setIsSuccess(true);
      setTimeout(() => {
        setIsSuccess(false);
        onClose();
      }, 1500);
    } catch (err: unknown) {
      console.error("Failed to generate inventory CSV:", err);
      setError("An error occurred while compiling the CSV export.");
    } finally {
      setIsExporting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-enter">
      <div className="bg-white rounded-3xl p-6 sm:p-7 w-full max-w-lg shadow-2xl border border-slate-200/80 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-purple-50 text-[var(--brand-700)] flex items-center justify-center border border-purple-200/60 shadow-xs">
              <Download size={18} />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-[var(--text-primary)] m-0">
                Export Inventory
              </h2>
              <p className="text-xs text-[var(--text-muted)] font-medium mt-0.5 m-0">
                {projectName} • Select towers to export as CSV
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {/* Body Content */}
        <div className="py-4 overflow-y-auto space-y-4 flex-1 pr-1">
          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center gap-2">
              <div className="w-7 h-7 rounded-full border-2 border-purple-200 border-t-[var(--brand-600)] animate-spin" />
              <span className="text-xs font-semibold text-slate-500">
                Loading towers & units…
              </span>
            </div>
          ) : error ? (
            <div className="p-3.5 bg-rose-50 text-rose-700 border border-rose-200 rounded-2xl text-xs flex items-center gap-2">
              <AlertCircle size={15} className="shrink-0 text-rose-500" />
              <span>{error}</span>
            </div>
          ) : towers.length === 0 ? (
            <div className="text-center py-10 space-y-2">
              <Building2 className="w-10 h-10 text-slate-300 mx-auto" />
              <p className="text-xs font-bold text-slate-700">No towers configured</p>
              <p className="text-[11px] text-slate-400">
                This project does not have any towers or units to export yet.
              </p>
            </div>
          ) : (
            <>
              {/* Select All Toggle Bar */}
              <div className="flex items-center justify-between px-3.5 py-2.5 bg-slate-50 border border-slate-200/70 rounded-2xl">
                <button
                  type="button"
                  onClick={toggleSelectAll}
                  className="flex items-center gap-2 text-xs font-bold text-slate-700 hover:text-slate-900 transition-colors cursor-pointer"
                >
                  {allSelected ? (
                    <CheckSquare size={16} className="text-[var(--brand-600)]" />
                  ) : (
                    <Square size={16} className="text-slate-400" />
                  )}
                  <span>Select All Towers ({towers.length})</span>
                </button>
                <span className="text-[11px] font-extrabold text-[var(--brand-700)] bg-purple-50 px-2 py-0.5 rounded-full border border-purple-200">
                  {selectedTowerIds.length} of {towers.length} selected
                </span>
              </div>

              {/* Tower Checkbox Cards */}
              <div className="space-y-2.5">
                {towerStats.map((tower) => {
                  const isChecked = selectedTowerIds.includes(tower.id);
                  const m = tower.metrics;

                  return (
                    <div
                      key={tower.id}
                      onClick={() => toggleTower(tower.id)}
                      className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                        isChecked
                          ? "bg-purple-50/40 border-[var(--brand-300)] shadow-2xs"
                          : "bg-white border-slate-200/80 hover:border-slate-300"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="text-[var(--brand-600)] shrink-0">
                          {isChecked ? (
                            <CheckSquare size={17} />
                          ) : (
                            <Square size={17} className="text-slate-300" />
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-extrabold text-[var(--text-primary)]">
                              {tower.name}
                            </span>
                            {tower.totalFloors && (
                              <span className="text-[10px] text-slate-400 font-semibold">
                                ({tower.totalFloors} floors)
                              </span>
                            )}
                          </div>
                          {m && (
                            <div className="flex items-center gap-2 mt-1 text-[11px]">
                              <span className="font-bold text-slate-600">
                                {m.totalUnits} Units
                              </span>
                              <span className="text-slate-300">•</span>
                              <span className="text-emerald-700 font-semibold">
                                {m.availableUnits} Avail
                              </span>
                              <span className="text-slate-300">•</span>
                              <span className="text-purple-700 font-semibold">
                                {m.soldUnits} Sold
                              </span>
                              {m.reservedUnits > 0 && (
                                <>
                                  <span className="text-slate-300">•</span>
                                  <span className="text-amber-700 font-semibold">
                                    {m.reservedUnits} Rsrv
                                  </span>
                                </>
                              )}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="shrink-0">
                        <span className="text-[10px] uppercase tracking-wider font-extrabold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                          {tower.constructionStatus || "Active"}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-3">
          <div className="text-xs font-semibold text-slate-500">
            {towers.length > 0 && !loading && (
              <span>
                Exporting{" "}
                <strong className="text-slate-800 font-extrabold">
                  {totalSelectedUnits}
                </strong>{" "}
                units across{" "}
                <strong className="text-slate-800 font-extrabold">
                  {selectedTowers.length}
                </strong>{" "}
                towers
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isExporting}
              className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-bold transition-all cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleExport}
              disabled={
                selectedTowerIds.length === 0 || isExporting || loading || towers.length === 0
              }
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all active:scale-[0.96] press-effect cursor-pointer ${
                isSuccess
                  ? "bg-emerald-600 text-white"
                  : selectedTowerIds.length === 0 || towers.length === 0
                  ? "bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200"
                  : "bg-[var(--brand-600)] hover:bg-[var(--brand-700)] text-white shadow-xs"
              }`}
            >
              {isExporting ? (
                <>
                  <Loader2 size={13} className="animate-spin" />
                  <span>Preparing CSV…</span>
                </>
              ) : isSuccess ? (
                <>
                  <Check size={13} className="stroke-[2.5]" />
                  <span>Downloaded!</span>
                </>
              ) : (
                <>
                  <Download size={13} />
                  <span>Export CSV</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
