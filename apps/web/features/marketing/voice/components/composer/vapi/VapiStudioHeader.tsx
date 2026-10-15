"use client";

import React from "react";
import Link from "next/link";
import {
  CheckCircle2,
  AlertCircle,
  Plus,
  DollarSign,
  Zap,
  Loader2,
  Save,
  PhoneCall,
} from "lucide-react";
import { Button } from "@/components/ui/Button";

export interface VapiStudioHeaderProps {
  assistants: any[];
  selectedAssistantId: string;
  isLoadingAssistants: boolean;
  isSaving: boolean;
  syncStatus: "synced" | "dirty" | "saving" | "error";
  statusMessage: string | null;
  vapiIntegration: any;
  metrics: {
    totalCostPerMin: number;
    estimatedLatencyMs: number;
  };
  onSelectAssistant: (assistant: any) => void;
  onOpenCreateModal: () => void;
  onOpenTestCallModal: () => void;
  onSaveAndSync: () => void;
}

export function VapiStudioHeader({
  assistants,
  selectedAssistantId,
  isLoadingAssistants,
  isSaving,
  syncStatus,
  statusMessage,
  vapiIntegration,
  metrics,
  onSelectAssistant,
  onOpenCreateModal,
  onOpenTestCallModal,
  onSaveAndSync,
}: VapiStudioHeaderProps) {
  return (
    <div className="space-y-4">
      {/* ── TOP HUD: ASSISTANT SELECTOR & LIVE METRICS GAUGES ── */}
      <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-5">
        {/* Left: Assistant Selector */}
        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200 text-[10px] font-extrabold uppercase tracking-wider">
              VAPI Cloud Agent
            </span>
            {syncStatus === "synced" && (
              <span className="flex items-center gap-1 text-[11px] text-emerald-600 font-bold">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Synced with Vapi
              </span>
            )}
            {syncStatus === "dirty" && (
              <span className="flex items-center gap-1 text-[11px] text-amber-600 font-bold">
                <AlertCircle className="w-3.5 h-3.5 text-amber-600" /> Unsaved Changes
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <select
              value={selectedAssistantId}
              onChange={(e) => {
                const found = assistants.find((a) => a.id === e.target.value);
                if (found) onSelectAssistant(found);
              }}
              disabled={isLoadingAssistants || assistants.length === 0}
              className="px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 max-w-sm flex-1 shadow-xs"
            >
              {assistants.length === 0 ? (
                <option value="">{isLoadingAssistants ? "Loading Assistants..." : "No Assistants Found"}</option>
              ) : (
                assistants.map((asst) => (
                  <option key={asst.id} value={asst.id}>
                    {asst.name} ({asst.model?.model || "Vapi"})
                  </option>
                ))
              )}
            </select>

            <Button
              type="button"
              onClick={onOpenCreateModal}
              size="sm"
              className="bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold gap-1.5 h-9 px-3.5 rounded-xl shadow-xs shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Agent</span>
            </Button>
          </div>
        </div>

        {/* Center: Live Cost & Latency Benchmark Gauges */}
        <div className="flex items-center gap-3 border-t md:border-t-0 md:border-l border-slate-100 pt-4 md:pt-0 md:pl-5">
          {/* Cost Gauge */}
          <div className="bg-slate-50/80 border border-slate-200/80 p-3 rounded-xl min-w-[130px]">
            <div className="flex items-center gap-1 text-slate-500 text-[10px] font-extrabold uppercase tracking-wider">
              <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
              <span>Total Cost</span>
            </div>
            <p className="text-base font-black text-slate-900 mt-0.5">
              ${metrics.totalCostPerMin.toFixed(3)}
              <span className="text-[10px] text-slate-400 font-medium">/min</span>
            </p>
            <p className="text-[9px] text-slate-400 font-medium truncate">STT + LLM + TTS + Vapi</p>
          </div>

          {/* Latency Gauge */}
          <div className="bg-slate-50/80 border border-slate-200/80 p-3 rounded-xl min-w-[130px]">
            <div className="flex items-center gap-1 text-slate-500 text-[10px] font-extrabold uppercase tracking-wider">
              <Zap className="w-3.5 h-3.5 text-amber-500" />
              <span>Turn Latency</span>
            </div>
            <p className="text-base font-black text-slate-900 mt-0.5">
              ~{metrics.estimatedLatencyMs}
              <span className="text-[10px] text-slate-400 font-medium">ms</span>
            </p>
            <p className="text-[9px] text-slate-400 font-medium truncate">First-token response</p>
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-1.5 shrink-0">
            <Button
              type="button"
              onClick={onSaveAndSync}
              disabled={isSaving || !selectedAssistantId}
              size="sm"
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs gap-1.5 rounded-xl h-8.5 shadow-xs"
            >
              {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
              <span>Save & Sync to Vapi</span>
            </Button>

            <Button
              type="button"
              onClick={onOpenTestCallModal}
              variant="outline"
              size="sm"
              className="border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs gap-1.5 rounded-xl h-8.5 shadow-xs"
            >
              <PhoneCall className="w-3.5 h-3.5 text-purple-600" />
              <span>Live Test Call</span>
            </Button>
          </div>
        </div>
      </div>

      {/* No VAPI Integration Connected Warning */}
      {!vapiIntegration && (
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
            <div>
              <p className="text-xs font-bold text-amber-900">No VAPI Integration Connected</p>
              <p className="text-[11px] text-amber-700 font-medium">
                Connect your Vapi API Key in Voice Settings to load and synchronize live cloud assistants.
              </p>
            </div>
          </div>
          <Link
            href="/dashboard/marketing/voice/settings"
            className="px-3.5 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shrink-0 transition-colors shadow-xs"
          >
            Connect Vapi Key
          </Link>
        </div>
      )}

      {/* Toast message if present */}
      {statusMessage && (
        <div
          className={`p-3 rounded-xl text-xs font-semibold flex items-center gap-2 animate-in fade-in ${
            syncStatus === "error"
              ? "bg-rose-50 border border-rose-200 text-rose-800"
              : "bg-purple-50 border border-purple-200 text-purple-800"
          }`}
        >
          {syncStatus === "error" ? (
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          ) : (
            <CheckCircle2 className="w-4 h-4 text-purple-600 shrink-0" />
          )}
          <span>{statusMessage}</span>
        </div>
      )}
    </div>
  );
}
