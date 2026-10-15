'use client';

import React from 'react';
import { X, ShieldCheck, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import type { VoiceTelephonyType } from '@/features/marketing/types';

export interface ConnectCarrierModalProps {
  selectedTelephonyProvider: VoiceTelephonyType | null;
  onClose: () => void;
  telName: string;
  setTelName: (name: string) => void;
  telAccountSid: string;
  setTelAccountSid: (sid: string) => void;
  telAuthToken: string;
  setAuthToken: (token: string) => void;
  telApiKey: string;
  setTelApiKey: (key: string) => void;
  telApiToken: string;
  setTelApiToken: (token: string) => void;
  telSubdomain: string;
  setTelSubdomain: (subdomain: string) => void;
  telFromNumbers: string;
  setTelFromNumbers: (numbers: string) => void;
  onSubmit: (e: React.FormEvent) => Promise<void>;
  submitting: boolean;
}

export function ConnectCarrierModal({
  selectedTelephonyProvider,
  onClose,
  telName,
  setTelName,
  telAccountSid,
  setTelAccountSid,
  telAuthToken,
  setAuthToken,
  telApiKey,
  setTelApiKey,
  telApiToken,
  setTelApiToken,
  telSubdomain,
  setTelSubdomain,
  telFromNumbers,
  setTelFromNumbers,
  onSubmit,
  submitting,
}: ConnectCarrierModalProps) {
  if (!selectedTelephonyProvider) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl border border-slate-200/90 max-w-md w-full p-6 shadow-xl space-y-4 animate-enter max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-sm font-extrabold text-[var(--text-primary)]">
              Connect {selectedTelephonyProvider} Carrier
            </h3>
            <p className="text-[11px] font-medium text-[var(--text-tertiary)]">
              Configure verified carrier credentials and outbound Caller ID numbers.
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-7 w-7 text-slate-400 hover:text-slate-700"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        <div className="p-3 bg-indigo-50/80 border border-indigo-100/90 rounded-xl text-[11px] text-indigo-900 flex items-start gap-2">
          <ShieldCheck className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
          <p className="leading-snug">
            <strong>Live Credential Validation:</strong> Your SID, API Key, and Token will be authenticated directly with the <strong>{selectedTelephonyProvider}</strong> API server before saving to prevent invalid configurations.
          </p>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-extrabold text-[var(--text-primary)] mb-1.5">
              Connection Nickname
            </label>
            <input
              type="text"
              required
              value={telName}
              onChange={(e) => setTelName(e.target.value)}
              placeholder={`e.g. Production ${selectedTelephonyProvider} Line`}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:bg-white transition-all shadow-xs"
            />
          </div>

          {selectedTelephonyProvider === 'TWILIO' && (
            <>
              <div>
                <label className="block text-xs font-extrabold text-[var(--text-primary)] mb-1.5">
                  Twilio Account SID <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                  value={telAccountSid}
                  onChange={(e) => setTelAccountSid(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:bg-white transition-all shadow-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-extrabold text-[var(--text-primary)] mb-1.5">
                  Twilio Auth Token <span className="text-rose-500">*</span>
                </label>
                <input
                  type="password"
                  required
                  placeholder="••••••••••••••••••••••••••••••••"
                  value={telAuthToken}
                  onChange={(e) => setAuthToken(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:bg-white transition-all shadow-xs"
                />
              </div>
            </>
          )}

          {selectedTelephonyProvider === 'VOBIZ' && (
            <>
              <div>
                <label className="block text-xs font-extrabold text-[var(--text-primary)] mb-1.5">
                  Vobiz Auth ID (X-Auth-ID) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={telApiKey}
                  onChange={(e) => setTelApiKey(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:bg-white transition-all shadow-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-extrabold text-[var(--text-primary)] mb-1.5">
                  Vobiz Auth Token <span className="text-rose-500">*</span>
                </label>
                <input
                  type="password"
                  required
                  value={telApiToken}
                  onChange={(e) => setTelApiToken(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:bg-white transition-all shadow-xs"
                />
              </div>
            </>
          )}

          {selectedTelephonyProvider === 'EXOTEL' && (
            <>
              <div>
                <label className="block text-xs font-extrabold text-[var(--text-primary)] mb-1.5">
                  Exotel Account SID <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={telAccountSid}
                  onChange={(e) => setTelAccountSid(e.target.value)}
                  placeholder="e.g. shiftconsultant1"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:bg-white transition-all shadow-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-extrabold text-[var(--text-primary)] mb-1.5">
                  Exotel Subdomain / Cluster URL
                </label>
                <input
                  type="text"
                  value={telSubdomain}
                  onChange={(e) => setTelSubdomain(e.target.value)}
                  placeholder="api.exotel.com (Singapore) or api.in.exotel.com (India)"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:bg-white transition-all shadow-xs"
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  Defaults to api.exotel.com (Singapore) or api.in.exotel.com (India cluster).
                </p>
              </div>
              <div>
                <label className="block text-xs font-extrabold text-[var(--text-primary)] mb-1.5">
                  Exotel API Key <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={telApiKey}
                  onChange={(e) => setTelApiKey(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:bg-white transition-all shadow-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-extrabold text-[var(--text-primary)] mb-1.5">
                  Exotel API Token <span className="text-rose-500">*</span>
                </label>
                <input
                  type="password"
                  required
                  value={telApiToken}
                  onChange={(e) => setTelApiToken(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:bg-white transition-all shadow-xs"
                />
              </div>
            </>
          )}

          {selectedTelephonyProvider === 'TELNYX' && (
            <>
              <div>
                <label className="block text-xs font-extrabold text-[var(--text-primary)] mb-1.5">
                  Telnyx API Key (v2) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="password"
                  required
                  value={telApiKey}
                  onChange={(e) => setTelApiKey(e.target.value)}
                  placeholder="KEYxxxxxxxxxxxxxxxxxxxx"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:bg-white transition-all shadow-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-extrabold text-[var(--text-primary)] mb-1.5">
                  Call Control App ID / Connection ID (Optional)
                </label>
                <input
                  type="text"
                  value={telSubdomain}
                  onChange={(e) => setTelSubdomain(e.target.value)}
                  placeholder="Auto-detected or enter specific Call Control App ID"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:bg-white transition-all shadow-xs"
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  Leave blank to auto-detect your active Call Control Application from Telnyx.
                </p>
              </div>
            </>
          )}

          <div>
            <label className="block text-xs font-extrabold text-[var(--text-primary)] mb-1.5">
              Outbound Caller IDs (comma-separated)
            </label>
            <input
              type="text"
              value={telFromNumbers}
              onChange={(e) => setTelFromNumbers(e.target.value)}
              placeholder="+919876543210, +14155550199"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:bg-white transition-all shadow-xs"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
            >
              Cancel
            </Button>
            <Button type="submit" size="sm" disabled={submitting}>
              {submitting ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null}
              <span>Save & Verify Gateway</span>
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
