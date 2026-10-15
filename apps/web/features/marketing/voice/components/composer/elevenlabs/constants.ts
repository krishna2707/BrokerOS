import { VolumeX, Radio } from "lucide-react";

export const ELEVENLABS_LLM_MODELS: { id: string; label: string; provider: string; badge: string; group: string }[] = [
  // ── GPT-5 Series ──
  { id: "gpt-5.6-terra", label: "GPT-5.6 Terra", provider: "OpenAI", badge: "Default ★", group: "GPT-5" },
  { id: "gpt-5.6-sol", label: "GPT-5.6 Sol", provider: "OpenAI", badge: "High Reasoning", group: "GPT-5" },
  { id: "gpt-5.6-luna", label: "GPT-5.6 Luna", provider: "OpenAI", badge: "Conversational", group: "GPT-5" },
  { id: "gpt-6-astra", label: "GPT-6 Astra", provider: "OpenAI", badge: "Next-Gen", group: "GPT-5" },
  { id: "gpt-5.5", label: "GPT-5.5", provider: "OpenAI", badge: "Stable Flagship", group: "GPT-5" },
  { id: "gpt-5", label: "GPT-5", provider: "OpenAI", badge: "Flagship", group: "GPT-5" },
  { id: "gpt-5-mini", label: "GPT-5 Mini", provider: "OpenAI", badge: "Fast & Smart", group: "GPT-5" },
  { id: "gpt-5-nano", label: "GPT-5 Nano", provider: "OpenAI", badge: "Ultra Fast", group: "GPT-5" },

  // ── GPT-4.1 Series ──
  { id: "gpt-4.1", label: "GPT-4.1", provider: "OpenAI", badge: "Stable", group: "GPT-4.1" },
  { id: "gpt-4.1-mini", label: "GPT-4.1 Mini", provider: "OpenAI", badge: "Lowest Latency", group: "GPT-4.1" },
  { id: "gpt-4.1-nano", label: "GPT-4.1 Nano", provider: "OpenAI", badge: "Economy", group: "GPT-4.1" },

  // ── Claude Series ──
  { id: "claude-sonnet-5", label: "Claude Sonnet 5", provider: "Anthropic", badge: "Most Capable", group: "Claude" },
  { id: "claude-sonnet-4-6", label: "Claude Sonnet 4.6", provider: "Anthropic", badge: "High EQ", group: "Claude" },
  { id: "claude-opus-4-7", label: "Claude Opus 4.7", provider: "Anthropic", badge: "Advanced Reasoning", group: "Claude" },
  { id: "claude-opus-4-8", label: "Claude Opus 4.8", provider: "Anthropic", badge: "Master Consultant", group: "Claude" },
  { id: "claude-haiku-4-5", label: "Claude Haiku 4.5", provider: "Anthropic", badge: "Ultra Speed", group: "Claude" },

  // ── Gemini Series ──
  { id: "gemini-3.8-flash", label: "Gemini 3.8 Flash", provider: "Google", badge: "Latest Flash", group: "Gemini" },
  { id: "gemini-3.7-flash", label: "Gemini 3.7 Flash", provider: "Google", badge: "Fast & Accurate", group: "Gemini" },
  { id: "gemini-3.5-flash", label: "Gemini 3.5 Flash", provider: "Google", badge: "Multilingual", group: "Gemini" },
  { id: "gemini-3-pro-preview", label: "Gemini 3 Pro Preview", provider: "Google", badge: "Deep Analysis", group: "Gemini" },
  { id: "gemini-3.1-pro-preview", label: "Gemini 3.1 Pro Preview", provider: "Google", badge: "Frontier Pro", group: "Gemini" },
];

export const ELEVENLABS_TTS_MODELS = [
  { id: "eleven_flash_v2_5", label: "Eleven Flash v2.5", badge: "75ms · Recommended ★", desc: "Ultra-low latency streaming model designed specifically for real-time conversational agents." },
  { id: "eleven_turbo_v2_5", label: "Eleven Turbo v2.5", badge: "High Fidelity", desc: "Fast response with nuanced vocal emotion and natural breathing pauses." },
  { id: "eleven_multilingual_v2", label: "Eleven Multilingual v2", badge: "29 Languages", desc: "Cross-lingual mastery for Indian & global multilingual sales campaigns." },
  { id: "eleven_v3_conversational", label: "Eleven v3 Conversational", badge: "Next-Gen v3", desc: "State-of-the-art conversational voice model with expressive controls." },
];

export const ELEVENLABS_LANGUAGES = [
  { id: "en", label: "English (Global / US / UK / India)" },
  { id: "hi", label: "Hindi — हिन्दी (India)" },
  { id: "es", label: "Spanish — Español" },
  { id: "fr", label: "French — Français" },
  { id: "de", label: "German — Deutsch" },
  { id: "pt", label: "Portuguese — Português" },
  { id: "ar", label: "Arabic — العربية" },
  { id: "zh", label: "Chinese — 中文" },
  { id: "ja", label: "Japanese — 日本語" },
  { id: "it", label: "Italian — Italiano" },
  { id: "nl", label: "Dutch — Nederlands" },
  { id: "ru", label: "Russian — Русский" },
];

export const ELEVENLABS_BACKGROUND_SOUNDS = [
  { id: "none", label: "None (Silent Studio)", icon: VolumeX },
  { id: "office2", label: "Active Real Estate Office (Recommended ★)", icon: Radio },
  { id: "office1", label: "Quiet Corporate Office", icon: Radio },
  { id: "restaurant", label: "Executive Cafe / Restaurant", icon: Radio },
  { id: "city", label: "Urban Ambient / Cityscape", icon: Radio },
  { id: "typing", label: "Gentle Keyboard Typing", icon: Radio },
  { id: "elevator1", label: "Elevator Soundscape 1", icon: Radio },
  { id: "elevator2", label: "Elevator Soundscape 2", icon: Radio },
  { id: "elevator3", label: "Elevator Soundscape 3", icon: Radio },
  { id: "elevator4", label: "Elevator Soundscape 4", icon: Radio },
];

export const CRM_TAGS = [
  { tag: "lead.firstName", label: "First Name" },
  { tag: "lead.fullName", label: "Full Name" },
  { tag: "project.name", label: "Project Name" },
  { tag: "project.city", label: "City" },
  { tag: "lead.budget", label: "Budget" },
  { tag: "lead.preferredConfiguration", label: "Config (2BHK/3BHK)" },
];
