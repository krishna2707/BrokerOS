'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, History, Play, Save, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Switch } from '@/components/ui/Switch';

export interface EmailFlowHeaderBarProps {
  id: string;
  name: string;
  setName: (name: string) => void;
  nodeCount: number;
  status: 'draft' | 'active';
  setStatus: (status: 'draft' | 'active') => void;
  onOpenTestModal: () => void;
  onSave: () => Promise<void>;
  saving: boolean;
}

export function EmailFlowHeaderBar({
  id,
  name,
  setName,
  nodeCount,
  status,
  setStatus,
  onOpenTestModal,
  onSave,
  saving,
}: EmailFlowHeaderBarProps) {
  const router = useRouter();

  return (
    <header className="sticky top-0 z-20 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border border-border-default bg-bg-surface px-5 py-3.5 rounded-2xl shadow-xs">
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <button
          type="button"
          onClick={() => router.push('/dashboard/marketing/email/flows')}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-border-default bg-bg-surface text-text-muted hover:bg-bg-subtle hover:text-text-primary transition-colors shrink-0"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div className="flex-1 min-w-0">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Flow bot name..."
            className="text-base font-bold text-text-primary bg-transparent focus:bg-bg-subtle rounded px-1.5 py-0.5 focus:outline-none w-full max-w-md"
          />
          <p className="text-[11px] text-text-tertiary px-1.5">
            {nodeCount} automation step{nodeCount !== 1 ? 's' : ''} in sequence
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2.5 shrink-0">
        {/* Run History Button */}
        <button
          type="button"
          onClick={() => router.push(`/dashboard/marketing/email/flows/${id}/runs`)}
          className="flex items-center gap-1.5 text-xs font-semibold text-text-muted hover:text-brand-600 transition-colors px-2.5 py-1.5 rounded-lg border border-border-default bg-bg-surface"
        >
          <History className="h-3.5 w-3.5" />
          <span>Run History</span>
        </button>

        {/* Active / Draft Switch */}
        <div className="flex items-center gap-2 rounded-lg border border-border-default bg-bg-subtle px-3 py-1 text-xs font-semibold">
          <span>{status === 'active' ? 'Active' : 'Draft'}</span>
          <Switch
            checked={status === 'active'}
            onCheckedChange={(v) => setStatus(v ? 'active' : 'draft')}
          />
        </div>

        {/* Test Flow Button */}
        <Button
          onClick={onOpenTestModal}
          variant="outline"
          size="sm"
          className="gap-1.5 text-xs font-semibold h-8"
        >
          <Play className="w-3.5 h-3.5 text-emerald-500" />
          <span>Test Flow</span>
        </Button>

        {/* Save Button */}
        <Button
          onClick={onSave}
          disabled={saving}
          size="sm"
          className="bg-brand-600 text-white hover:bg-brand-700 text-xs h-8 font-semibold px-4"
        >
          {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" /> : <Save className="h-3.5 w-3.5 mr-1.5" />}
          <span>Save Flow</span>
        </Button>
      </div>
    </header>
  );
}
