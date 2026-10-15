"use client";

import React from "react";
import { PhoneCall, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import type { ProviderMeta } from "./constants";

export interface ConnectTelephonyModalProps {
  selectedProvider: ProviderMeta | null;
  onClose: () => void;
  formData: Record<string, string>;
  setFormData: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  errorMsg: string | null;
  onSubmit: (e: React.FormEvent) => Promise<void>;
  saving: boolean;
}

export function ConnectTelephonyModal({
  selectedProvider,
  onClose,
  formData,
  setFormData,
  errorMsg,
  onSubmit,
  saving,
}: ConnectTelephonyModalProps) {
  if (!selectedProvider) return null;

  return (
    <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full p-6 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-purple-50 text-[var(--brand-600)] flex items-center justify-center font-bold">
              <PhoneCall className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Connect {selectedProvider.title}
              </h3>
              <p className="text-xs text-slate-500">
                This will become the single active calling carrier for all departments.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 text-lg font-bold"
          >
            ✕
          </button>
        </div>

        {errorMsg && (
          <div className="mt-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={onSubmit} className="mt-4 space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">
              Connection Name
            </label>
            <input
              type="text"
              required
              value={formData.name || ""}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder={`Primary ${selectedProvider.title} Trunk`}
              className="w-full h-9 px-3 rounded-xl border border-slate-300 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          {selectedProvider.fields.map((field) => (
            <div key={field.key}>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                {field.label}
              </label>
              <input
                type={field.secret ? "password" : "text"}
                required={!["applicationSid", "apiKey", "apiToken"].includes(field.key)}
                value={formData[field.key] || ""}
                onChange={(e) => setFormData({ ...formData, [field.key]: e.target.value })}
                placeholder={field.placeholder}
                className="w-full h-9 px-3 rounded-xl border border-slate-300 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500 font-mono"
              />
            </div>
          ))}

          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2.5">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={saving}
              className="bg-[var(--brand-600)] hover:bg-[var(--brand-700)] text-white"
            >
              {saving ? "Validating & Connecting..." : "Save and Activate Carrier"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
