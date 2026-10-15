'use client';

import React from 'react';
import { Smartphone, Loader2, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

export interface SmsFlowSimulationModalProps {
  isOpen: boolean;
  onClose: () => void;
  testLeadPhone: string;
  setTestLeadPhone: (phone: string) => void;
  testInput: string;
  setTestInput: (input: string) => void;
  onRunTest: () => Promise<void>;
  testing: boolean;
  testResult: any;
}

export function SmsFlowSimulationModal({
  isOpen,
  onClose,
  testLeadPhone,
  setTestLeadPhone,
  testInput,
  setTestInput,
  onRunTest,
  testing,
  testResult,
}: SmsFlowSimulationModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
      <div className="bg-bg-surface border border-border-default rounded-2xl max-w-lg w-full p-6 shadow-xl space-y-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-border-subtle pb-3">
          <h3 className="text-sm font-bold text-text-primary flex items-center gap-2">
            <Smartphone className="w-4 h-4 text-emerald-500" />
            <span>Simulate Inbound SMS Carrier Reply</span>
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="text-text-tertiary hover:text-text-primary text-base font-bold"
          >
            ×
          </button>
        </div>

        <div className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-text-secondary mb-1">
              Simulated Lead Phone:
            </label>
            <Input
              value={testLeadPhone}
              onChange={(e) => setTestLeadPhone(e.target.value)}
              placeholder="+15552345678"
              className="text-xs font-mono bg-bg-subtle"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-text-secondary mb-1">
              Inbound Reply Message Body:
            </label>
            <textarea
              rows={3}
              value={testInput}
              onChange={(e) => setTestInput(e.target.value)}
              placeholder="e.g. Can you share the cost sheet and schedule a visit?"
              className="w-full px-3 py-2 text-xs bg-bg-subtle border border-border-default rounded-xl text-text-primary focus:outline-none focus:ring-2 focus:ring-brand-500 font-sans"
            />
          </div>

          <Button
            onClick={onRunTest}
            disabled={testing || !testInput.trim()}
            className="w-full gap-2 text-xs font-semibold"
          >
            {testing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
            <span>Execute Simulation Test</span>
          </Button>

          {testResult && (
            <div className="p-3.5 rounded-xl bg-bg-subtle border border-border-default space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-text-primary">Simulation Result:</span>
                <span
                  className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                    testResult.matchedFlowId && testResult.triggerMatched !== false
                      ? 'bg-emerald-500/10 text-emerald-600'
                      : 'bg-amber-500/10 text-amber-600'
                  }`}
                >
                  {testResult.matchedFlowId && testResult.triggerMatched !== false
                    ? 'Flow Matched & Executed'
                    : 'Trigger Not Matched'}
                </span>
              </div>

              {testResult.flowName && (
                <p className="text-[11px] text-text-secondary">
                  <strong>Target Flow:</strong> {testResult.flowName}
                </p>
              )}

              {testResult.triggerReason && (
                <div className="p-2 rounded-lg bg-bg-surface border border-border-subtle text-[11px] text-text-secondary">
                  <strong>Trigger Status:</strong> {testResult.triggerReason}
                </div>
              )}

              {testResult.actionsExecuted && testResult.actionsExecuted.length > 0 && (
                <div>
                  <p className="text-[11px] font-semibold text-text-secondary mb-1">Execution Steps Timeline:</p>
                  <div className="space-y-1">
                    {testResult.actionsExecuted.map((act: string, i: number) => (
                      <div key={i} className="flex items-start gap-1.5 text-[11px] text-text-primary bg-bg-surface p-1.5 rounded-lg border border-border-subtle">
                        <span className="font-bold text-brand-600">✓</span>
                        <span>{act}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {(testResult.outboundReply || testResult.renderedBody) && (
                <div className="mt-2 pt-2 border-t border-border-subtle space-y-1.5">
                  <p className="text-[11px] font-bold text-brand-600">Generated SMS Response Preview:</p>
                  <div className="p-3 rounded-xl bg-bg-surface border border-border-subtle text-xs whitespace-pre-wrap font-sans text-text-primary shadow-2xs">
                    {testResult.outboundReply || testResult.renderedBody}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
