"use client";

import React from "react";
import Link from "next/link";
import {
  CheckCircle2,
  AlertCircle,
  Loader2,
  Plus,
  RefreshCw,
  Zap,
  DollarSign,
  Save,
  PhoneCall,
} from "lucide-react";
import { Button } from "@/components/ui/Button";

export interface RetellStudioHeaderProps {
  agents: any[];
  selectedAgentId: string;
  isLoadingAgents: boolean;
  isSaving: boolean;
  syncStatus: "synced" | "dirty" | "saving" | "error";
  statusMessage: string | null;
  retellIntegration: any;
  totalCostPerMin: string;
  latencyMs: string;
  onSelectAgent: (agent: any) => void;
  onRefreshAgents: () => void;
  onOpenCreateModal: () => void;
  onOpenTestCallModal: () => void;
  onSaveAndSync: () => void;
}

export function RetellStudioHeader({
  agents,
  selectedAgentId,
  isLoadingAgents,
  isSaving,
  syncStatus,
  statusMessage,
  retellIntegration,
  totalCostPerMin,
  latencyMs,
  onSelectAgent,
  onRefreshAgents,
  onOpenCreateModal,
  onOpenTestCallModal,
  onSaveAndSync,
}: RetellStudioHeaderProps) {
  return (
    <div className="space-y-4">
      {/* ── TOP HUD ── */}
      <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-5">
        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-extrabold uppercase tracking-wider">
              Retell AI Agent
            </span>
            {syncStatus === "synced" && (
              <span className="flex items-center gap-1 text-[11px] text-emerald-600 font-bold">
                <CheckCircle2 className="w-3.5 h-3.5" /> Synced
              </span>
            )}
            {syncStatus === "dirty" && (
              <span className="flex items-center gap-1 text-[11px] text-amber-600 font-bold">
                <AlertCircle className="w-3.5 h-3.5" /> Unsaved Changes
              </span>
            )}
            {syncStatus === "error" && (
              <span className="flex items-center gap-1 text-[11px] text-rose-600 font-bold">
                <AlertCircle className="w-3.5 h-3.5" /> Sync Failed
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <select
              value={selectedAgentId}
              onChange={(e) => {
                const found = agents.find((a) => (a.id || a.agent_id) === e.target.value);
                if (found) onSelectAgent(found);
              }}
              disabled={isLoadingAgents || agents.length === 0}
              className="px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 max-w-sm flex-1 shadow-xs"
            >
              {agents.length === 0 ? (
                <option value="">{isLoadingAgents ? "Loading Retell Agents..." : "No Agents — Create One Below"}</option>
              ) : (
                agents.map((a) => {
                  const id = a.id || a.agent_id;
                  return (
                    <option key={id} value={id}>
                      {a.name || a.agent_name} ({id.slice(0, 10)}…)
                    </option>
                  );
                })
              )}
            </select>
            <Button
              type="button"
              onClick={onRefreshAgents}
              disabled={isLoadingAgents}
              size="sm"
              variant="outline"
              className="h-9 w-9 p-0 rounded-xl border-slate-200 cursor-pointer"
              title="Refresh"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoadingAgents ? "animate-spin" : ""}`} />
            </Button>
            <Button
              type="button"
              onClick={onOpenCreateModal}
              size="sm"
              className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold gap-1.5 h-9 px-3.5 rounded-xl shadow-xs shrink-0 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Agent</span>
            </Button>
          </div>
        </div>

        <div className="flex items-center gap-3 border-t md:border-t-0 md:border-l border-slate-100 pt-4 md:pt-0 md:pl-5">
          <div className="bg-slate-50/80 border border-slate-200/80 p-3 rounded-xl min-w-[120px]">
            <div className="flex items-center gap-1 text-slate-500 text-[10px] font-extrabold uppercase">
              <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
              <span>Est. Cost</span>
            </div>
            <p className="text-base font-black text-slate-900 mt-0.5">
              ${totalCostPerMin}
              <span className="text-[10px] text-slate-400 font-medium">/min</span>
            </p>
            <p className="text-[9px] text-slate-400 font-medium">STT + LLM + TTS + Retell</p>
          </div>
          <div className="bg-slate-50/80 border border-slate-200/80 p-3 rounded-xl min-w-[120px]">
            <div className="flex items-center gap-1 text-slate-500 text-[10px] font-extrabold uppercase">
              <Zap className="w-3.5 h-3.5 text-amber-500" />
              <span>Turn Latency</span>
            </div>
            <p className="text-base font-black text-slate-900 mt-0.5">
              ~{latencyMs}
              <span className="text-[10px] text-slate-400 font-medium">ms</span>
            </p>
            <p className="text-[9px] text-slate-400 font-medium">First-token response</p>
          </div>
          <div className="flex flex-col gap-1.5 shrink-0">
            <Button
              type="button"
              onClick={onSaveAndSync}
              disabled={isSaving || !selectedAgentId}
              size="sm"
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs gap-1.5 rounded-xl h-8.5 shadow-xs cursor-pointer"
            >
              {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
              <span>Save &amp; Sync</span>
            </Button>
            <Button
              type="button"
              onClick={onOpenTestCallModal}
              variant="outline"
              size="sm"
              className="border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs gap-1.5 rounded-xl h-8.5 shadow-xs cursor-pointer"
            >
              <PhoneCall className="w-3.5 h-3.5 text-emerald-600" />
              <span>Live Test Call</span>
            </Button>
          </div>
        </div>
      </div>

      {/* ── No Retell Integration Warning ── */}
      {!retellIntegration && (
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
            <div>
              <p className="text-xs font-bold text-amber-900">No Retell Integration Connected</p>
              <p className="text-[11px] text-amber-700 font-medium">
                Connect your Retell API Key in Voice Settings to load and sync live agents.
              </p>
            </div>
          </div>
          <Link
            href="/dashboard/marketing/voice/settings"
            className="px-3.5 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shrink-0 transition-colors shadow-xs"
          >
            Connect Retell Key
          </Link>
        </div>
      )}

      {/* ── Toast ── */}
      {statusMessage && (
        <div
          className={`p-3 rounded-xl text-xs font-semibold flex items-center gap-2 ${
            syncStatus === "error"
              ? "bg-rose-50 border border-rose-200 text-rose-800"
              : "bg-emerald-50 border border-emerald-200 text-emerald-800"
          }`}
        >
          {syncStatus === "error" ? (
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          ) : (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          )}
          <span>{statusMessage}</span>
        </div>
      )}
    </div>
  );
}
