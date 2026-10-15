'use client';

import React from 'react';
import {
  Phone,
  CheckCircle2,
  Trash2,
  Loader2,
  Activity,
  AlertCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import type { VoiceTelephonyIntegrationRecord } from '@/features/marketing/types';

export interface ConnectedCarriersListProps {
  telephonyIntegrations: VoiceTelephonyIntegrationRecord[];
  onDeleteTelephony: (id: string) => Promise<void>;
  onVerifyCarrier: (id: string) => Promise<void>;
  verifyingId: string | null;
  verifyResults: Record<string, { isValid: boolean; latencyMs: number }>;
}

export function ConnectedCarriersList({
  telephonyIntegrations,
  onDeleteTelephony,
  onVerifyCarrier,
  verifyingId,
  verifyResults,
}: ConnectedCarriersListProps) {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-extrabold text-[var(--text-primary)]">
          Connected Telephony Carrier Trunks
        </h3>
        <p className="text-xs font-medium text-[var(--text-tertiary)]">
          Your connected carrier trunks (Twilio, Vobiz AI, Exotel, Telnyx) for outbound PSTN dialing and Caller IDs.
        </p>
      </div>

      {telephonyIntegrations.length === 0 ? (
        <div className="p-8 bg-slate-50/70 rounded-2xl border border-dashed border-slate-200 text-center">
          <Phone className="w-6 h-6 text-slate-400 mx-auto mb-2" />
          <p className="text-xs font-bold text-[var(--text-primary)]">
            No telephony carriers connected yet
          </p>
          <p className="text-[11px] text-[var(--text-muted)] mt-0.5">
            Connect your Twilio, Vobiz AI, Exotel, or Telnyx accounts below to enable live phone dialing.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {telephonyIntegrations.map((item) => (
            <div
              key={item.id}
              className="p-5 bg-white rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-xs font-extrabold text-[var(--text-primary)]">
                        {item.name}
                      </h4>
                      <Badge variant="default" className="text-[10px]">
                        {item.provider}
                      </Badge>
                      {item.isDefault && (
                        <Badge variant="success" className="text-[9px]">
                          Default
                        </Badge>
                      )}
                    </div>
                    <p className="text-[11px] font-medium text-[var(--text-muted)] mt-1 font-mono">
                      Caller IDs:{' '}
                      <span className="text-[var(--text-primary)] font-bold">
                        {item.fromNumbers?.length
                          ? item.fromNumbers.join(', ')
                          : 'None configured'}
                      </span>
                    </p>
                  </div>

                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onDeleteTelephony(item.id)}
                    className="h-8 w-8 text-rose-500 hover:bg-rose-50 rounded-xl"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 mt-4 border-t border-slate-100 text-[11px]">
                <div className="flex items-center gap-2">
                  {verifyResults[item.id] ? (
                    verifyResults[item.id].isValid ? (
                      <span className="text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md font-extrabold text-[10px] flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Verified ({verifyResults[item.id].latencyMs}ms)
                      </span>
                    ) : (
                      <span className="text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-md font-extrabold text-[10px] flex items-center gap-1">
                        <AlertCircle className="w-3 h-3 text-rose-600" /> Auth Error
                      </span>
                    )
                  ) : (
                    <span className="text-emerald-600 font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Ready for dialing
                    </span>
                  )}

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onVerifyCarrier(item.id)}
                    disabled={verifyingId === item.id}
                    className="h-6 px-2 text-[10px] font-bold gap-1 text-slate-700 bg-slate-50 hover:bg-slate-100"
                  >
                    {verifyingId === item.id ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <Activity className="w-3 h-3 text-indigo-600" />
                    )}
                    <span>Ping Check</span>
                  </Button>
                </div>

                <span className="text-[var(--text-muted)]">
                  Connected {new Date(item.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
