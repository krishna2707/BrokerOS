"use client";

import React, { useState } from "react";
import { useTelephony } from "../context/TelephonyContext";
import {
  Phone,
  PhoneOff,
  Mic,
  MicOff,
  ChevronUp,
  ChevronDown,
  X,
  FileText,
  AlertCircle,
  Radio,
  CheckCircle,
} from "lucide-react";
import { Button } from "@/components/ui/Button";

export function ActiveCallWidget() {
  const {
    callState,
    activeLead,
    durationSeconds,
    isMuted,
    volumeLevel,
    activeProvider,
    bridgeType,
    agentPhone,
    hangUp,
    toggleMute,
    error,
    dismissCall,
  } = useTelephony();

  const [expandedNotes, setExpandedNotes] = useState(false);
  const [callNote, setCallNote] = useState("");
  const [savingNote, setSavingNote] = useState(false);
  const [noteSaved, setNoteSaved] = useState(false);

  if (callState === "IDLE") return null;

  const formatTimer = (totalSec: number) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const handleSaveNote = async () => {
    if (!callNote.trim() || !activeLead?.id) return;
    try {
      setSavingNote(true);
      const res = await fetch(`/api/leads/${activeLead.id}/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: `[Call Note] ${callNote.trim()}` }),
      });
      if (res.ok) {
        setNoteSaved(true);
        setTimeout(() => setNoteSaved(false), 3000);
        setCallNote("");
      }
    } catch (e) {
      console.error("Failed to save call note", e);
    } finally {
      setSavingNote(false);
    }
  };

  return (
    <div
      role="region"
      aria-label="Active Call Softphone"
      className="fixed bottom-6 right-6 z-50 max-w-sm w-full animate-in slide-in-from-bottom-5 fade-in duration-200"
    >
      <div className="bg-slate-900 text-white rounded-2xl border border-slate-800 shadow-2xl overflow-hidden backdrop-blur-xl">
        {/* Top Status Bar with Screen Reader Announcement */}
        <div
          role="status"
          aria-live="polite"
          className="px-4 py-3 bg-slate-950/70 border-b border-slate-800/80 flex items-center justify-between"
        >
          <div className="flex items-center gap-2">
            {callState === "INITIALIZING" && (
              <span className="flex items-center gap-1.5 text-xs font-semibold text-amber-400">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" aria-hidden="true" />
                Connecting Carrier...
              </span>
            )}
            {callState === "RINGING" && (
              <span className="flex items-center gap-1.5 text-xs font-semibold text-sky-400">
                <Radio className="w-3.5 h-3.5 animate-pulse text-sky-400 stroke-[2]" aria-hidden="true" />
                Ringing Customer...
              </span>
            )}
            {callState === "CONNECTED" && (
              <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-400">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" aria-hidden="true" />
                Live Call: <span className="tabular-nums font-mono">{formatTimer(durationSeconds)}</span>
              </span>
            )}
            {callState === "ENDED" && (
              <span className="flex items-center gap-1.5 text-xs font-bold text-slate-400">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-500 stroke-[2]" aria-hidden="true" />
                Call Finished (<span className="tabular-nums font-mono">{formatTimer(durationSeconds)}</span>)
              </span>
            )}
            {callState === "FAILED" && (
              <span className="flex items-center gap-1.5 text-xs font-bold text-rose-400">
                <AlertCircle className="w-3.5 h-3.5 text-rose-400 stroke-[2]" aria-hidden="true" />
                Connection Failed
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {activeProvider && (
              <span className="text-[10px] font-mono font-bold tracking-wider px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700/60">
                {activeProvider}
              </span>
            )}
            {(callState === "ENDED" || callState === "FAILED") && (
              <button
                type="button"
                onClick={dismissCall}
                aria-label="Dismiss call notification"
                className="text-slate-400 hover:text-white p-1.5 rounded-lg min-w-[28px] min-h-[28px] flex items-center justify-center transition-colors duration-150 active:scale-[0.96] transition-transform focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:outline-none"
              >
                <X className="w-4 h-4" aria-hidden="true" />
              </button>
            )}
          </div>
        </div>

        {/* Lead Info & Waveform */}
        <div className="p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h4 className="text-base font-extrabold text-white tracking-tight leading-snug">
                {activeLead?.name || "Customer"}
              </h4>
              <p className="text-xs text-slate-400 font-mono tabular-nums mt-0.5">
                {activeLead?.phone || "Phone"}
              </p>
            </div>

            {/* Audio Waveform Meter */}
            {callState === "CONNECTED" && (
              <div
                aria-hidden="true"
                className="flex items-end gap-1 h-7 px-2 py-1 bg-slate-800/80 rounded-lg"
              >
                {[1, 2, 3, 4].map((bar) => {
                  const barHeight = Math.max(
                    4,
                    Math.round(((volumeLevel * bar) / 4) * 0.25)
                  );
                  return (
                    <div
                      key={bar}
                      style={{ height: `${barHeight}px` }}
                      className={`w-1 rounded-full transition-all duration-75 ${
                        isMuted
                          ? "bg-slate-600"
                          : volumeLevel > 20
                          ? "bg-emerald-400"
                          : "bg-emerald-600"
                      }`}
                    />
                  );
                })}
              </div>
            )}
          </div>

          {bridgeType === "PSTN_BRIDGE" && (callState === "RINGING" || callState === "CONNECTED") && (
            <div className="mt-3 p-2.5 rounded-xl bg-sky-950/50 border border-sky-800/60 text-[11px] text-sky-200 flex items-start gap-2">
              <Phone className="w-3.5 h-3.5 text-sky-400 mt-0.5 shrink-0 animate-pulse stroke-[2]" aria-hidden="true" />
              <span>
                {activeProvider === "EXOTEL"
                  ? `Carrier bridge active: Answer your registered phone (${agentPhone || "agent mobile"}) to connect directly to the customer.`
                  : `Outbound telecom line active via ${activeProvider}. Connecting to customer phone...`}
              </span>
            </div>
          )}

          {error && (
            <p
              role="alert"
              className="mt-3 text-xs text-rose-400 bg-rose-950/40 p-2.5 rounded-xl border border-rose-900/50"
            >
              {error}
            </p>
          )}

          {/* Action Toolbar */}
          {(callState === "RINGING" || callState === "CONNECTED") && (
            <div className="mt-4 flex items-center justify-between gap-2.5 pt-3 border-t border-slate-800/60">
              {/* Mute Button */}
              <button
                type="button"
                onClick={toggleMute}
                aria-label={isMuted ? "Unmute microphone" : "Mute microphone"}
                aria-pressed={isMuted}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-colors duration-150 active:scale-[0.96] transition-transform focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:outline-none ${
                  isMuted
                    ? "bg-rose-500/20 text-rose-400 border border-rose-500/40"
                    : "bg-slate-800 hover:bg-slate-700 text-slate-200"
                }`}
              >
                {isMuted ? (
                  <MicOff className="w-3.5 h-3.5 stroke-[2]" aria-hidden="true" />
                ) : (
                  <Mic className="w-3.5 h-3.5 stroke-[2]" aria-hidden="true" />
                )}
                <span>{isMuted ? "Muted" : "Mute"}</span>
              </button>

              {/* Quick Notes Toggle */}
              <button
                type="button"
                onClick={() => setExpandedNotes(!expandedNotes)}
                aria-label="Toggle quick call notes"
                aria-expanded={expandedNotes}
                aria-controls="call-quick-notes-panel"
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors duration-150 active:scale-[0.96] transition-transform focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:outline-none"
              >
                <FileText className="w-3.5 h-3.5 stroke-[1.75]" aria-hidden="true" />
                <span>Notes</span>
                {expandedNotes ? (
                  <ChevronDown className="w-3.5 h-3.5 stroke-[2]" aria-hidden="true" />
                ) : (
                  <ChevronUp className="w-3.5 h-3.5 stroke-[2]" aria-hidden="true" />
                )}
              </button>

              {/* End Call Button */}
              <button
                type="button"
                onClick={hangUp}
                aria-label="End active call"
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-extrabold bg-rose-600 hover:bg-rose-700 text-white shadow-lg shadow-rose-900/30 transition-colors duration-150 active:scale-[0.96] transition-transform focus-visible:ring-2 focus-visible:ring-rose-400 focus-visible:outline-none"
              >
                <PhoneOff className="w-3.5 h-3.5 stroke-[2]" aria-hidden="true" />
                <span>End Call</span>
              </button>
            </div>
          )}

          {/* Expandable Quick Notes Area */}
          {expandedNotes && (callState === "RINGING" || callState === "CONNECTED") && (
            <div
              id="call-quick-notes-panel"
              className="mt-3 pt-3 border-t border-slate-800 space-y-2 animate-in fade-in slide-in-from-top-1 duration-150"
            >
              <label htmlFor="call-quick-notes-input" className="sr-only">
                Quick call notes
              </label>
              <textarea
                id="call-quick-notes-input"
                rows={2}
                value={callNote}
                onChange={(e) => setCallNote(e.target.value)}
                placeholder="Type quick call notes (e.g. Budget 2 Cr, wants Sunday visit)..."
                className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 resize-none transition-colors duration-150"
              />
              <div className="flex justify-end gap-2 items-center">
                {noteSaved && (
                  <span
                    role="status"
                    className="text-xs text-emerald-400 font-semibold flex items-center gap-1"
                  >
                    <CheckCircle className="w-3 h-3 stroke-[2]" aria-hidden="true" /> Note Saved!
                  </span>
                )}
                <Button
                  size="sm"
                  type="button"
                  onClick={handleSaveNote}
                  disabled={savingNote || !callNote.trim()}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-7 px-3 rounded-lg active:scale-[0.96] transition-transform"
                >
                  {savingNote ? "Saving..." : "Save Note"}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
