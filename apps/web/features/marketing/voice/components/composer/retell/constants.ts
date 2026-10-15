// ============================================================================
// Retell Studio Constants
// ============================================================================

export const DEFAULT_RETELL_VOICES = [
  {
    id: "11labs-rachel",
    name: "Rachel (ElevenLabs)",
    gender: "Female",
    accent: "American Professional",
    provider: "ElevenLabs",
    previewText: "Hello! I am Rachel calling with an update on your luxury property inquiry.",
    description: "Warm, authentic narrative voice ideal for sales consultations.",
  },
  {
    id: "11labs-adam",
    name: "Adam (ElevenLabs)",
    gender: "Male",
    accent: "American Deep",
    provider: "ElevenLabs",
    previewText: "Good day. Presenting the exclusive penthouse collection at Signature Towers.",
    description: "Authoritative, confident tone for luxury real estate.",
  },
  {
    id: "11labs-viraj",
    name: "Viraj (ElevenLabs Indic)",
    gender: "Male",
    accent: "Indian English / Hindi",
    provider: "ElevenLabs",
    previewText: "Namaste! Main Skyline Realty team se call kar raha hoon.",
    description: "Warm Indic conversational tone with bilingual fluency.",
  },
  {
    id: "deepgram-asteria",
    name: "Asteria (Deepgram Aura)",
    gender: "Female",
    accent: "American Clear",
    provider: "Deepgram",
    previewText: "Hello, this is Asteria following up on your luxury real estate inquiry.",
    description: "Ultra fast sub-120ms telephony response speed.",
  },
  {
    id: "deepgram-orion",
    name: "Orion (Deepgram Aura)",
    gender: "Male",
    accent: "American Deep",
    provider: "Deepgram",
    previewText: "Good day! Let me guide you through the latest payment plans and inventory.",
    description: "Confident corporate tone for outbound qualification.",
  },
  {
    id: "retell-Cimo",
    name: "Cimo (Retell Native)",
    gender: "Female",
    accent: "American Casual",
    provider: "Retell",
    previewText: "Hi there! I have all the details on your selected unit.",
    description: "Friendly and modern real estate assistant.",
  },
];

export const RETELL_LLM_MODELS: { id: string; label: string; provider: string; badge: string; group: string }[] = [
  // GPT-4.1
  { id: "gpt-4.1", label: "GPT-4.1", provider: "openai", badge: "Stable", group: "GPT-4.1" },
  { id: "gpt-4.1-mini", label: "GPT-4.1 Mini", provider: "openai", badge: "Fast", group: "GPT-4.1" },
  { id: "gpt-4.1-nano", label: "GPT-4.1 Nano", provider: "openai", badge: "Cheapest", group: "GPT-4.1" },
  // GPT-5
  { id: "gpt-5", label: "GPT-5", provider: "openai", badge: "Most Capable", group: "GPT-5" },
  { id: "gpt-5-mini", label: "GPT-5 Mini", provider: "openai", badge: "Balanced", group: "GPT-5" },
  { id: "gpt-5-nano", label: "GPT-5 Nano", provider: "openai", badge: "Ultra Fast", group: "GPT-5" },
  { id: "gpt-5.1", label: "GPT-5.1", provider: "openai", badge: "Updated", group: "GPT-5" },
  { id: "gpt-5.2", label: "GPT-5.2", provider: "openai", badge: "Updated", group: "GPT-5" },
  { id: "gpt-5.4", label: "GPT-5.4", provider: "openai", badge: "Advanced", group: "GPT-5" },
  { id: "gpt-5.4-mini", label: "GPT-5.4 Mini", provider: "openai", badge: "Fast", group: "GPT-5" },
  { id: "gpt-5.4-nano", label: "GPT-5.4 Nano", provider: "openai", badge: "Lightest", group: "GPT-5" },
  { id: "gpt-5.5", label: "GPT-5.5", provider: "openai", badge: "Latest Stable", group: "GPT-5" },
  { id: "gpt-5.6-terra", label: "GPT-5.6 Terra", provider: "openai", badge: "Retell Default ★", group: "GPT-5" },
  { id: "gpt-5.6-luna", label: "GPT-5.6 Luna", provider: "openai", badge: "Latest", group: "GPT-5" },
  // Claude
  { id: "claude-4.5-sonnet", label: "Claude 4.5 Sonnet", provider: "anthropic", badge: "Empathetic", group: "Claude" },
  { id: "claude-4.6-sonnet", label: "Claude 4.6 Sonnet", provider: "anthropic", badge: "Updated", group: "Claude" },
  { id: "claude-5-sonnet", label: "Claude 5 Sonnet", provider: "anthropic", badge: "Most Capable", group: "Claude" },
  { id: "claude-4.5-haiku", label: "Claude 4.5 Haiku", provider: "anthropic", badge: "Ultra Fast", group: "Claude" },
  // Gemini
  { id: "gemini-3.0-flash", label: "Gemini 3.0 Flash", provider: "google", badge: "Flash", group: "Gemini" },
  { id: "gemini-3.1-flash-lite", label: "Gemini 3.1 Flash Lite", provider: "google", badge: "Lightest", group: "Gemini" },
  { id: "gemini-3.5-flash", label: "Gemini 3.5 Flash", provider: "google", badge: "Multimodal", group: "Gemini" },
  { id: "gemini-3.5-flash-lite", label: "Gemini 3.5 Flash Lite", provider: "google", badge: "Lite", group: "Gemini" },
  { id: "gemini-3.6-flash", label: "Gemini 3.6 Flash", provider: "google", badge: "Updated", group: "Gemini" },
  { id: "gemini-3.7-flash", label: "Gemini 3.7 Flash", provider: "google", badge: "Latest", group: "Gemini" },
  { id: "gemini-3.8-flash", label: "Gemini 3.8 Flash", provider: "google", badge: "Newest", group: "Gemini" },
];

export const RETELL_S2S_MODELS = [
  { id: "gpt-realtime-2.1", label: "GPT Realtime 2.1", badge: "Latest · Recommended" },
  { id: "gpt-realtime-2.1-mini", label: "GPT Realtime 2.1 Mini", badge: "Fast Realtime" },
  { id: "gpt-realtime-2", label: "GPT Realtime 2", badge: "Stable" },
  { id: "gpt-realtime-1.5", label: "GPT Realtime 1.5", badge: "Previous Gen" },
];

export const RETELL_EMOTIONS = [
  { id: "calm", label: "Calm & Composed" },
  { id: "sympathetic", label: "Sympathetic & Empathetic" },
  { id: "happy", label: "Happy & Upbeat" },
  { id: "sad", label: "Sad" },
  { id: "angry", label: "Firm & Assertive" },
  { id: "fearful", label: "Cautious" },
  { id: "surprised", label: "Surprised & Engaged" },
];

export const RETELL_AMBIENT = [
  { id: "call-center", label: "Call Center" },
  { id: "coffee-shop", label: "Coffee Shop" },
  { id: "convention-hall", label: "Convention Hall" },
  { id: "summer-outdoor", label: "Summer Outdoor" },
  { id: "mountain-outdoor", label: "Mountain Outdoor" },
  { id: "static-noise", label: "Static Noise" },
];

export const RETELL_LANGUAGES = [
  { id: "hi-IN", label: "Hindi — hi-IN (India)" },
  { id: "en-IN", label: "English — en-IN (India Accent)" },
  { id: "en-US", label: "English — en-US (Global)" },
  { id: "en-GB", label: "English — en-GB (British)" },
  { id: "mr-IN", label: "Marathi — mr-IN" },
  { id: "ta-IN", label: "Tamil — ta-IN" },
  { id: "kn-IN", label: "Kannada — kn-IN" },
  { id: "es-ES", label: "Spanish — es-ES" },
  { id: "de-DE", label: "German — de-DE" },
  { id: "fr-FR", label: "French — fr-FR" },
  { id: "pt-BR", label: "Portuguese — pt-BR" },
  { id: "zh-CN", label: "Chinese — zh-CN" },
  { id: "ja-JP", label: "Japanese — ja-JP" },
];

export const STT_MODES = [
  { id: "fast", label: "Fast (Recommended)", desc: "Optimised for low-latency real-time conversations" },
  { id: "accurate", label: "Accurate", desc: "Better for accents and technical vocabulary" },
  { id: "custom", label: "Custom Provider", desc: "Azure / Deepgram / AssemblyAI with custom endpointing" },
];

export const CRM_TAGS = [
  { tag: "lead.firstName", label: "First Name" },
  { tag: "lead.fullName", label: "Full Name" },
  { tag: "project.name", label: "Project" },
  { tag: "project.city", label: "City" },
  { tag: "lead.budget", label: "Budget" },
];
