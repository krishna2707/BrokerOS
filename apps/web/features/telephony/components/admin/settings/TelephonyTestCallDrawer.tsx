"use client";

import React from "react";
import { CheckCircle2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import type { TelephonyConfig } from "./constants";

export interface TelephonyTestCallDrawerProps {
  activeConfig: TelephonyConfig | null;
  testNumber: string;
  setTestNumber: (num: string) => void;
  onTriggerTestCall: () => Promise<void>;
  testing: boolean;
  testResult: { success: boolean; message: string } | null;
}

export function TelephonyTestCallDrawer({
  activeConfig,
  testNumber,
  setTestNumber,
  onTriggerTestCall,
  testing,
  testResult,
}: TelephonyTestCallDrawerProps) {
  if (!activeConfig) return null;

  return (
    <div className="bg-slate-50 rounded-2xl border border-slate-200 p-5">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            Live Line Test & Verification
          </h4>
          <p className="text-xs text-slate-500 mt-0.5">
            Place a test call to your personal phone to verify that outbound PSTN trunking and audio delivery are active.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="tel"
            placeholder="Enter phone with country code (e.g. +1...)"
            value={testNumber}
            onChange={(e) => setTestNumber(e.target.value)}
            className="h-9 px-3.5 rounded-xl border border-slate-300 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 w-64 bg-white"
          />
          <Button
            size="sm"
            onClick={onTriggerTestCall}
            disabled={testing || !testNumber}
            className="bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            {testing ? "Dialing..." : "Test Call"}
          </Button>
        </div>
      </div>

      {testResult && (
        <div
          className={`mt-3 p-3 rounded-xl text-xs font-medium flex items-center gap-2 ${
            testResult.success
              ? "bg-emerald-100/70 text-emerald-800 border border-emerald-200"
              : "bg-rose-100/70 text-rose-800 border border-rose-200"
          }`}
        >
          {testResult.success ? (
            <CheckCircle2 className="w-4 h-4 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0" />
          )}
          <span>{testResult.message}</span>
        </div>
      )}
    </div>
  );
}
