"use client";

import React from "react";
import { UserCog, ShieldCheck, Loader2, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/Button";

export interface BulkPromoteConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetCount: number;
  filterLabel: string;
  campaignTitle?: string;
  onConfirm: () => Promise<void>;
  isBulkAssigning: boolean;
}

export function BulkPromoteConfirmModal({
  isOpen,
  onClose,
  targetCount,
  filterLabel,
  campaignTitle,
  onConfirm,
  isBulkAssigning,
}: BulkPromoteConfirmModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-purple-100 text-brand-600 flex items-center justify-center">
              <UserCog className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-slate-900">Upload Leads to Pre-Sales CRM</h3>
              <p className="text-[11px] text-slate-500">
                Routing to Pre-Sales Manager triage queue
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 text-base font-bold"
          >
            ✕
          </button>
        </div>

        <div className="space-y-3 text-xs text-slate-600">
          <p>
            You are about to push <strong className="text-slate-900 font-extrabold">{targetCount} leads</strong> into the CRM Pre-Sales queue.
          </p>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5 text-[11px]">
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Filter Applied:</span>
              <span className="font-bold text-slate-800">{filterLabel}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Audience Scope:</span>
              <span className="font-bold text-slate-800">{campaignTitle || "Current Campaign"}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Assigned State:</span>
              <span className="font-bold text-emerald-600">Unassigned Manager Triage (HOT)</span>
            </div>
          </div>

          <div className="p-3 bg-purple-50/70 border border-purple-200/80 rounded-xl text-purple-900 text-[11px] space-y-1">
            <p className="font-bold flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-brand-600" />
              <span>Automatic Sales Conversion</span>
            </p>
            <p className="text-purple-800/90">
              Any audience contacts not yet in the CRM will be converted into new Lead records with status set to <code className="font-mono font-bold">INTERESTED</code> and temperature marked <code className="font-mono font-bold">HOT</code>.
            </p>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
          <Button
            variant="outline"
            size="sm"
            onClick={onClose}
            disabled={isBulkAssigning}
            className="text-xs"
          >
            Cancel
          </Button>
          <Button
            variant="default"
            size="sm"
            onClick={onConfirm}
            disabled={isBulkAssigning}
            className="text-xs bg-brand-600 hover:bg-brand-700 text-white font-bold gap-1.5"
          >
            {isBulkAssigning ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <UserPlus className="w-3.5 h-3.5" />
            )}
            <span>Upload {targetCount} Leads Now</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
