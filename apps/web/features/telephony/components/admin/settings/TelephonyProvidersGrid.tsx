"use client";

import React from "react";
import { CheckCircle2, ExternalLink, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import type { TelephonyConfig, ProviderMeta } from "./constants";

export interface TelephonyProvidersGridProps {
  providers: ProviderMeta[];
  activeConfig: TelephonyConfig | null;
  onDisconnect: (id: string) => void;
  onOpenConnect: (provider: ProviderMeta) => void;
}

export function TelephonyProvidersGrid({
  providers,
  activeConfig,
  onDisconnect,
  onOpenConnect,
}: TelephonyProvidersGridProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
      {providers.map((prov) => {
        const isCurrentActive = activeConfig?.provider === prov.key;

        return (
          <div
            key={prov.key}
            className={`rounded-2xl border p-6 bg-white transition-all shadow-xs relative flex flex-col justify-between ${
              isCurrentActive
                ? "border-emerald-500 ring-2 ring-emerald-500/10 shadow-md"
                : "border-slate-200 hover:border-slate-300"
            }`}
          >
            <div>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-bold text-slate-900">{prov.title}</h3>
                    <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${prov.badgeColor}`}>
                      {prov.badge}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">{prov.tagline}</p>
                </div>

                {isCurrentActive && (
                  <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 inline-flex items-center gap-1 shrink-0">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Active Carrier
                  </span>
                )}
              </div>

              {isCurrentActive && activeConfig && (
                <div className="mt-4 p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 text-xs space-y-1.5">
                  <div className="flex justify-between text-slate-600">
                    <span>Caller ID / From:</span>
                    <strong className="text-slate-900 font-mono">
                      {activeConfig.fromNumbers?.[0] || "Default Carrier Trunk"}
                    </strong>
                  </div>
                  {activeConfig.accountSid && (
                    <div className="flex justify-between text-slate-600">
                      <span>Account SID:</span>
                      <span className="text-slate-700 font-mono">{activeConfig.accountSid}</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
              <a
                href={prov.docsUrl}
                target="_blank"
                rel="noreferrer"
                className="text-xs font-medium text-slate-500 hover:text-slate-800 inline-flex items-center gap-1 transition-colors"
              >
                Carrier Docs <ExternalLink className="w-3 h-3" />
              </a>

              {isCurrentActive ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onDisconnect(activeConfig.id)}
                  className="text-rose-600 border-rose-200 hover:bg-rose-50"
                >
                  <Trash2 className="w-3.5 h-3.5 mr-1.5" />
                  Disconnect Line
                </Button>
              ) : (
                <Button
                  size="sm"
                  onClick={() => onOpenConnect(prov)}
                  className="bg-[var(--brand-600)] hover:bg-[var(--brand-700)] text-white"
                >
                  Connect {prov.title}
                </Button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
