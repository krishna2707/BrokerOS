'use client';

import React from 'react';
import { Sparkles, Globe, Radio } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { CampaignItem } from '@/features/marketing/types';

export interface EmailFlowTriggerConfigCardProps {
  isGlobal: boolean;
  setIsGlobal: (isGlobal: boolean) => void;
  campaigns: CampaignItem[];
  selectedCampaignIds: string[];
  setSelectedCampaignIds: (ids: string[]) => void;
  triggerType: 'keyword_match' | 'any_reply';
  setTriggerType: (type: 'keyword_match' | 'any_reply') => void;
  keywords: string[];
  newKeyword: string;
  setNewKeyword: (keyword: string) => void;
  onAddKeyword: (e: React.KeyboardEvent | React.MouseEvent) => void;
  onRemoveKeyword: (kw: string) => void;
}

export function EmailFlowTriggerConfigCard({
  isGlobal,
  setIsGlobal,
  campaigns,
  selectedCampaignIds,
  setSelectedCampaignIds,
  triggerType,
  setTriggerType,
  keywords,
  newKeyword,
  setNewKeyword,
  onAddKeyword,
  onRemoveKeyword,
}: EmailFlowTriggerConfigCardProps) {
  return (
    <div className="rounded-2xl border border-brand-500/30 bg-bg-surface p-5 shadow-xs space-y-4">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-500/10 text-brand-600 shrink-0">
          <Sparkles className="h-4 w-4" />
        </div>
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-brand-600">
            Trigger & Scope Settings
          </span>
          <h3 className="text-xs font-bold text-text-primary">
            Inbound Prospect Email Reply Listener
          </h3>
        </div>
      </div>

      {/* Global vs Campaign Scoping */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
        <div
          onClick={() => setIsGlobal(true)}
          className={cn(
            'p-3.5 rounded-xl border cursor-pointer transition-all',
            isGlobal
              ? 'border-brand-600 bg-brand-500/5 ring-1 ring-brand-600/30'
              : 'border-border-default bg-bg-surface hover:border-border-hover',
          )}
        >
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-semibold text-text-primary flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5 text-blue-500" />
              <span>Global Scope (All Broadcasts)</span>
            </span>
            <input type="radio" checked={isGlobal} onChange={() => {}} className="text-brand-600" />
          </div>
          <p className="text-[11px] text-text-secondary">
            Listens for prospect email replies across all present and future campaigns.
          </p>
        </div>

        <div
          onClick={() => setIsGlobal(false)}
          className={cn(
            'p-3.5 rounded-xl border cursor-pointer transition-all',
            !isGlobal
              ? 'border-purple-600 bg-purple-500/5 ring-1 ring-purple-600/30'
              : 'border-border-default bg-bg-surface hover:border-border-hover',
          )}
        >
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-semibold text-text-primary flex items-center gap-1.5">
              <Radio className="w-3.5 h-3.5 text-purple-500" />
              <span>Specific Campaigns Only</span>
            </span>
            <input type="radio" checked={!isGlobal} onChange={() => {}} className="text-purple-600" />
          </div>
          <p className="text-[11px] text-text-secondary">
            Restrict this automation only to designated email marketing broadcasts.
          </p>
        </div>
      </div>

      {/* Campaign Selection Checkboxes (if not global) */}
      {!isGlobal && (
        <div className="p-3.5 rounded-xl bg-bg-subtle border border-border-default space-y-2.5">
          <label className="block text-xs font-semibold text-text-secondary">
            Designated Campaigns ({selectedCampaignIds.length} selected):
          </label>
          {campaigns.length === 0 ? (
            <p className="text-xs text-text-tertiary">No email campaigns found in database.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
              {campaigns.map((c) => {
                const checked = selectedCampaignIds.includes(c.id);
                return (
                  <label
                    key={c.id}
                    className="flex items-center gap-2 p-2 rounded-lg bg-bg-surface border border-border-subtle hover:border-border-default cursor-pointer text-xs"
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedCampaignIds([...selectedCampaignIds, c.id]);
                        } else {
                          setSelectedCampaignIds(selectedCampaignIds.filter((id) => id !== c.id));
                        }
                      }}
                      className="rounded text-brand-600 focus:ring-brand-500"
                    />
                    <span className="font-medium text-text-primary truncate">{c.title}</span>
                  </label>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Trigger Type Selection */}
      <div className="space-y-2.5 pt-1 border-t border-border-subtle">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          <button
            type="button"
            onClick={() => setTriggerType('keyword_match')}
            className={cn(
              'p-2.5 rounded-xl border text-left text-xs transition-all',
              triggerType === 'keyword_match'
                ? 'border-brand-600 bg-brand-500/5 font-semibold text-brand-700 dark:text-brand-400'
                : 'border-border-default text-text-secondary hover:border-border-hover',
            )}
          >
            Keyword Match (Contains specific words)
          </button>
          <button
            type="button"
            onClick={() => setTriggerType('any_reply')}
            className={cn(
              'p-2.5 rounded-xl border text-left text-xs transition-all',
              triggerType === 'any_reply'
                ? 'border-brand-600 bg-brand-500/5 font-semibold text-brand-700 dark:text-brand-400'
                : 'border-border-default text-text-secondary hover:border-border-hover',
            )}
          >
            Any Inbound Reply (Catch-all)
          </button>
        </div>

        {triggerType === 'keyword_match' && (
          <div className="space-y-2 pt-1">
            <label className="block text-xs font-semibold text-text-secondary">
              Trigger Keywords (Type word & press Enter to add)
            </label>
            <div className="flex flex-wrap items-center gap-2 p-2 rounded-xl bg-bg-subtle border border-border-default min-h-[42px]">
              {keywords.map((kw) => (
                <span
                  key={kw}
                  className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-purple-500/10 text-purple-600 text-xs font-mono font-semibold"
                >
                  <span>{kw}</span>
                  <button
                    type="button"
                    onClick={() => onRemoveKeyword(kw)}
                    className="hover:text-purple-800 text-sm leading-none"
                  >
                    ×
                  </button>
                </span>
              ))}
              <input
                value={newKeyword}
                onChange={(e) => setNewKeyword(e.target.value)}
                onKeyDown={onAddKeyword}
                placeholder="e.g. visit, price, brochure, tour..."
                className="bg-transparent border-none outline-none text-xs flex-1 min-w-[130px] text-text-primary px-1"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
