"use client";

import React, { useState, useEffect } from "react";
import { Bot, Brain, Volume2, Mic, Sliders } from "lucide-react";
import { CreateAgentModal } from "./CreateAgentModal";
import {
  ELEVENLABS_LLM_MODELS,
  ELEVENLABS_TTS_MODELS,
  ELEVENLABS_LANGUAGES,
  ELEVENLABS_BACKGROUND_SOUNDS,
  CRM_TAGS,
  ElevenLabsStudioHeader,
  ElevenLabsDialogueTab,
  ElevenLabsEngineTab,
  ElevenLabsVoiceTab,
  ElevenLabsAsrTab,
  ElevenLabsAmbientTab,
} from "./elevenlabs";

// Re-export constants for full backward compatibility
export {
  ELEVENLABS_LLM_MODELS,
  ELEVENLABS_TTS_MODELS,
  ELEVENLABS_LANGUAGES,
  ELEVENLABS_BACKGROUND_SOUNDS,
  CRM_TAGS,
};

export interface ElevenLabsAssistantStudioProps {
  formData: any;
  onChange: (fields: any) => void;
  agentIntegrations?: any[];
  telephonyIntegrations?: any[];
  selectedProject?: any;
  apiBaseUrl?: string;
}

export function ElevenLabsAssistantStudio({
  formData,
  onChange,
  agentIntegrations = [],
  telephonyIntegrations = [],
  selectedProject,
  apiBaseUrl = "",
}: ElevenLabsAssistantStudioProps) {
  const [activeTab, setActiveTab] = useState<"dialogue" | "engine" | "voice" | "asr" | "ambient">("dialogue");

  // Remote agent management
  const [agents, setAgents] = useState<any[]>([]);
  const [selectedAgentId, setSelectedAgentId] = useState<string>(formData.assistantId || "");
  const [isLoadingAgents, setIsLoadingAgents] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [syncStatus, setSyncStatus] = useState<"synced" | "dirty" | "saving" | "error">("synced");
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Test call state
  const [showTestCall, setShowTestCall] = useState(false);
  const [testPhone, setTestPhone] = useState("");
  const [selectedFromNumber, setSelectedFromNumber] = useState("");
  const [isDialing, setIsDialing] = useState(false);
  const [callStatus, setCallStatus] = useState<"idle" | "ringing" | "connected" | "failed">("idle");
  const [callMessage, setCallMessage] = useState<string | null>(null);

  // Voice catalog
  const [voices, setVoices] = useState<any[]>([]);
  const [isLoadingVoices, setIsLoadingVoices] = useState(false);
  const [voiceSearchQuery, setVoiceSearchQuery] = useState("");

  // Keyword tag entry
  const [newKeyword, setNewKeyword] = useState("");

  // ElevenLabs Integration Record
  const elevenLabsIntegration =
    agentIntegrations.find((a) => a.platform === "ELEVENLABS" && a.id === formData.agentPlatformId) ||
    agentIntegrations.find((a) => a.platform === "ELEVENLABS") ||
    null;

  useEffect(() => {
    if (elevenLabsIntegration && formData.agentPlatformId !== elevenLabsIntegration.id) {
      onChange({ agentPlatformId: elevenLabsIntegration.id });
    }
  }, [elevenLabsIntegration?.id]);

  useEffect(() => {
    fetchAgents();
    fetchVoices();
  }, [elevenLabsIntegration?.id]);

  const handleFieldChange = (fields: any) => {
    onChange(fields);
    setSyncStatus("dirty");
  };

  // ── Fetch Agents ──
  const fetchAgents = async () => {
    if (!elevenLabsIntegration?.id) return;
    setIsLoadingAgents(true);
    try {
      const res = await fetch(`${apiBaseUrl}/api/marketing/voice/integrations/agents/${elevenLabsIntegration.id}/assistants`);
      if (res.ok) {
        const list = await res.json();
        if (Array.isArray(list)) {
          setAgents(list);
          if (!selectedAgentId && list.length > 0) {
            applyAgent(list[0]);
          }
        }
      }
    } catch (e) {
      console.error("Failed to load ElevenLabs agents", e);
    } finally {
      setIsLoadingAgents(false);
    }
  };

  // ── Fetch Voices ──
  const fetchVoices = async () => {
    if (!elevenLabsIntegration?.id) return;
    setIsLoadingVoices(true);
    try {
      const res = await fetch(`${apiBaseUrl}/api/marketing/voice/integrations/agents/${elevenLabsIntegration.id}/voices`);
      if (res.ok) {
        const list = await res.json();
        if (Array.isArray(list)) {
          setVoices(list);
        }
      }
    } catch {
      // fallback
    } finally {
      setIsLoadingVoices(false);
    }
  };

  // ── Apply Agent Config ──
  const applyAgent = (agent: any) => {
    if (!agent) return;
    const id = agent.id || agent.agent_id;
    setSelectedAgentId(id);

    const voiceConfig = agent.voice || {};
    const modelConfig = agent.model || {};
    const turnConfig = agent.turn || {};
    const asrConfig = agent.asr || {};
    const convConfig = agent.conversation || {};

    onChange({
      assistantId: id,
      assistantName: agent.name || "ElevenLabs Conversational Agent",
      scriptPrompt: modelConfig.systemPrompt || agent.raw?.conversation_config?.agent?.prompt?.prompt || formData.scriptPrompt,
      firstMessage: agent.firstMessage || agent.raw?.conversation_config?.agent?.first_message || formData.firstMessage,
      llmModel: modelConfig.model || agent.raw?.conversation_config?.agent?.prompt?.llm || formData.llmModel || "gpt-5.6-terra",
      temperature: modelConfig.temperature ?? agent.raw?.conversation_config?.agent?.prompt?.temperature ?? 0.0,
      elevenLanguage: agent.language || agent.raw?.conversation_config?.agent?.language || "en",
      voiceId: voiceConfig.voiceId || agent.raw?.conversation_config?.tts?.voice_id || formData.voiceId || "cjVigY5qzO86Huf0OWal",
      ttsModel: voiceConfig.model || agent.raw?.conversation_config?.tts?.model_id || "eleven_flash_v2_5",
      voiceStability: voiceConfig.stability ?? agent.raw?.conversation_config?.tts?.stability ?? 0.5,
      voiceSimilarityBoost: voiceConfig.similarityBoost ?? agent.raw?.conversation_config?.tts?.similarity_boost ?? 0.8,
      voiceSpeed: voiceConfig.speed ?? agent.raw?.conversation_config?.tts?.speed ?? 1.0,
      turnTimeout: turnConfig.turn_timeout ?? agent.raw?.conversation_config?.turn?.turn_timeout ?? 7,
      turnEagerness: turnConfig.turn_eagerness || agent.raw?.conversation_config?.turn?.turn_eagerness || "normal",
      silenceEndCallTimeout: turnConfig.silence_end_call_timeout ?? agent.raw?.conversation_config?.turn?.silence_end_call_timeout ?? -1,
      speculativeTurn: turnConfig.speculative_turn ?? agent.raw?.conversation_config?.turn?.speculative_turn ?? true,
      asrQuality: asrConfig.quality || agent.raw?.conversation_config?.asr?.quality || "high",
      asrProvider: asrConfig.provider || agent.raw?.conversation_config?.asr?.provider || "elevenlabs",
      asrKeywords: asrConfig.keywords || agent.raw?.conversation_config?.asr?.keywords || [],
      maxDurationSeconds: convConfig.max_duration_seconds ?? agent.raw?.conversation_config?.conversation?.max_duration_seconds ?? 600,
      backgroundSound: convConfig.background_sound?.source_id || agent.raw?.conversation_config?.conversation?.background_sound?.source_id || "none",
      backgroundVolume: convConfig.background_sound?.volume ?? agent.raw?.conversation_config?.conversation?.background_sound?.volume ?? 0.15,
    });
    setSyncStatus("synced");
  };

  // ── Save & Sync to ElevenLabs ──
  const handleSaveAndSync = async () => {
    if (!elevenLabsIntegration?.id || !selectedAgentId) return;
    setIsSaving(true);
    setSyncStatus("saving");
    setStatusMessage("Pushing configuration to ElevenLabs ConvAI...");
    try {
      const res = await fetch(
        `${apiBaseUrl}/api/marketing/voice/integrations/agents/${elevenLabsIntegration.id}/assistants/${selectedAgentId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: formData.assistantName,
            prompt: formData.scriptPrompt,
            firstMessage: formData.firstMessage,
            llmModel: formData.llmModel || "gpt-5.6-terra",
            temperature: formData.temperature ?? 0.0,
            voiceId: formData.voiceId || "cjVigY5qzO86Huf0OWal",
            ttsModel: formData.ttsModel || "eleven_flash_v2_5",
            voiceStability: formData.voiceStability ?? 0.5,
            voiceSimilarityBoost: formData.voiceSimilarityBoost ?? 0.8,
            voiceSpeed: formData.voiceSpeed ?? 1.0,
            language: formData.elevenLanguage || "en",
            turnTimeout: formData.turnTimeout ?? 7,
            turnEagerness: formData.turnEagerness || "normal",
            speculativeTurn: formData.speculativeTurn ?? true,
            asrQuality: formData.asrQuality || "high",
            asrProvider: formData.asrProvider || "elevenlabs",
            asrKeywords: formData.asrKeywords || [],
            maxDurationSeconds: formData.maxDurationSeconds ?? 600,
            backgroundSound: formData.backgroundSound || "none",
            backgroundVolume: formData.backgroundVolume ?? 0.15,
          }),
        }
      );

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.message || "Failed to sync agent with ElevenLabs");
      }

      setSyncStatus("synced");
      setStatusMessage("Agent successfully synchronized with ElevenLabs Cloud.");
      setTimeout(() => setStatusMessage(null), 4000);
      fetchAgents();
    } catch (err: any) {
      setSyncStatus("error");
      setStatusMessage(err?.message || "Error syncing with ElevenLabs");
    } finally {
      setIsSaving(false);
    }
  };

  // ── PSTN Test Call ──
  const handleTestCall = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testPhone.trim()) return;
    setIsDialing(true);
    setCallStatus("ringing");
    setCallMessage("Initiating outbound PSTN bridge via telephony carrier...");

    try {
      const res = await fetch(`${apiBaseUrl}/api/marketing/voice/calls/test`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          agentPlatform: "ELEVENLABS",
          agentPlatformId: elevenLabsIntegration?.id,
          assistantId: selectedAgentId,
          targetPhone: testPhone,
          callerNumber: selectedFromNumber || undefined,
          campaignName: "Studio Dial Test",
          projectId: selectedProject?.id,
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data?.message || "Failed to trigger PSTN call");
      }

      setCallStatus("connected");
      setCallMessage(`Call successfully dispatched to ${testPhone}. Call SID: ${data.callSid || data.id || "Active"}`);
    } catch (err: any) {
      setCallStatus("failed");
      setCallMessage(err?.message || "Error triggering PSTN test call.");
    } finally {
      setIsDialing(false);
    }
  };

  const insertTag = (tag: string, field: "scriptPrompt" | "firstMessage") => {
    const cur = field === "scriptPrompt" ? formData.scriptPrompt || "" : formData.firstMessage || "";
    handleFieldChange({ [field]: `${cur}{{${tag}}}` });
  };

  const addKeyword = () => {
    if (!newKeyword.trim()) return;
    const currentKeywords: string[] = formData.asrKeywords || [];
    if (!currentKeywords.includes(newKeyword.trim())) {
      handleFieldChange({ asrKeywords: [...currentKeywords, newKeyword.trim()] });
    }
    setNewKeyword("");
  };

  const removeKeyword = (kw: string) => {
    const currentKeywords: string[] = formData.asrKeywords || [];
    handleFieldChange({ asrKeywords: currentKeywords.filter((k) => k !== kw) });
  };

  // Form values with fallbacks
  const scriptPrompt = formData.scriptPrompt || "";
  const firstMessage = formData.firstMessage || "";
  const llmModel = formData.llmModel || "gpt-5.6-terra";
  const voiceId = formData.voiceId || "cjVigY5qzO86Huf0OWal";
  const ttsModel = formData.ttsModel || "eleven_flash_v2_5";
  const voiceStability = formData.voiceStability ?? 0.5;
  const voiceSimilarityBoost = formData.voiceSimilarityBoost ?? 0.8;
  const voiceSpeed = formData.voiceSpeed ?? 1.0;
  const elevenLanguage = formData.elevenLanguage || "en";
  const temperature = formData.temperature ?? 0.0;
  const turnTimeout = formData.turnTimeout ?? 7;
  const turnEagerness = formData.turnEagerness || "normal";
  const speculativeTurn = formData.speculativeTurn ?? true;
  const asrKeywords: string[] = formData.asrKeywords || [];
  const maxDurationSeconds = formData.maxDurationSeconds ?? 600;
  const backgroundSound = formData.backgroundSound || "none";
  const backgroundVolume = formData.backgroundVolume ?? 0.15;

  return (
    <div className="space-y-6">
      {/* ── TOP HUD ── */}
      <ElevenLabsStudioHeader
        agents={agents}
        selectedAgentId={selectedAgentId}
        isLoadingAgents={isLoadingAgents}
        isSaving={isSaving}
        syncStatus={syncStatus}
        statusMessage={statusMessage}
        showTestCall={showTestCall}
        testPhone={testPhone}
        selectedFromNumber={selectedFromNumber}
        isDialing={isDialing}
        callStatus={callStatus}
        callMessage={callMessage}
        telephonyIntegrations={telephonyIntegrations}
        onSelectAgent={applyAgent}
        onRefreshAgents={fetchAgents}
        onOpenCreateModal={() => setIsCreateModalOpen(true)}
        onToggleTestCall={() => setShowTestCall(!showTestCall)}
        onCloseTestCall={() => setShowTestCall(false)}
        onTestPhoneChange={setTestPhone}
        onSelectedFromNumberChange={setSelectedFromNumber}
        onSubmitTestCall={handleTestCall}
        onSaveAndSync={handleSaveAndSync}
      />

      {/* ── TAB NAVIGATION ── */}
      <div className="flex border-b border-slate-200 bg-white rounded-t-2xl px-4 pt-2 gap-1 overflow-x-auto shadow-2xs">
        {[
          { id: "dialogue", label: "Dialogue & Script", icon: Bot },
          { id: "engine", label: "LLM Reasoning Engine", icon: Brain },
          { id: "voice", label: "Voice & Neural TTS", icon: Volume2 },
          { id: "asr", label: "Speech (ASR) & Turn", icon: Mic },
          { id: "ambient", label: "Ambient & Duration", icon: Sliders },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-3 text-xs font-extrabold border-b-2 transition-all shrink-0 cursor-pointer ${
                isActive
                  ? "border-emerald-600 text-emerald-700 bg-emerald-50/40"
                  : "border-transparent text-slate-500 hover:text-slate-900 hover:border-slate-300"
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* ── TAB 1: DIALOGUE & PROMPT ── */}
      {activeTab === "dialogue" && (
        <ElevenLabsDialogueTab
          assistantName={formData.assistantName || ""}
          elevenLanguage={elevenLanguage}
          firstMessage={firstMessage}
          scriptPrompt={scriptPrompt}
          onChange={handleFieldChange}
          onInsertTag={insertTag}
        />
      )}

      {/* ── TAB 2: LLM ENGINE ── */}
      {activeTab === "engine" && (
        <ElevenLabsEngineTab
          llmModel={llmModel}
          temperature={temperature}
          onChange={handleFieldChange}
        />
      )}

      {/* ── TAB 3: VOICE & NEURAL TTS ── */}
      {activeTab === "voice" && (
        <ElevenLabsVoiceTab
          ttsModel={ttsModel}
          voiceId={voiceId}
          voiceStability={voiceStability}
          voiceSimilarityBoost={voiceSimilarityBoost}
          voiceSpeed={voiceSpeed}
          voices={voices}
          isLoadingVoices={isLoadingVoices}
          voiceSearchQuery={voiceSearchQuery}
          onVoiceSearchChange={setVoiceSearchQuery}
          onChange={handleFieldChange}
        />
      )}

      {/* ── TAB 4: SPEECH (ASR) & TURN TAKING ── */}
      {activeTab === "asr" && (
        <ElevenLabsAsrTab
          turnEagerness={turnEagerness}
          turnTimeout={turnTimeout}
          speculativeTurn={speculativeTurn}
          newKeyword={newKeyword}
          asrKeywords={asrKeywords}
          onNewKeywordChange={setNewKeyword}
          onAddKeyword={addKeyword}
          onRemoveKeyword={removeKeyword}
          onChange={handleFieldChange}
        />
      )}

      {/* ── TAB 5: AMBIENT & ADVANCED ── */}
      {activeTab === "ambient" && (
        <ElevenLabsAmbientTab
          backgroundSound={backgroundSound}
          backgroundVolume={backgroundVolume}
          maxDurationSeconds={maxDurationSeconds}
          onChange={handleFieldChange}
        />
      )}

      {/* Create Agent Modal */}
      <CreateAgentModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        platform="ELEVENLABS"
        agentPlatformId={elevenLabsIntegration?.id}
        apiBaseUrl={apiBaseUrl}
        onAgentCreated={(newAgent) => {
          fetchAgents();
          applyAgent(newAgent);
        }}
      />
    </div>
  );
}
