export interface TelephonyConfig {
  id: string;
  provider: "TWILIO" | "VOBIZ" | "EXOTEL" | "TELNYX";
  name: string;
  isActive: boolean;
  accountSid?: string | null;
  apiKey?: string | null;
  subdomain?: string | null;
  sipDomain?: string | null;
  fromNumbers?: string[];
  applicationSid?: string | null;
  updatedAt?: string;
}

export interface ProviderMeta {
  key: "TWILIO" | "VOBIZ" | "EXOTEL" | "TELNYX";
  title: string;
  tagline: string;
  badge: string;
  badgeColor: string;
  fields: { key: string; label: string; placeholder: string; secret?: boolean }[];
  docsUrl: string;
}

export const PROVIDERS: ProviderMeta[] = [
  {
    key: "TWILIO",
    title: "Twilio Voice",
    tagline: "Direct in-browser WebRTC VoIP & PSTN calling via Twilio Voice SDK",
    badge: "Recommended for WebRTC",
    badgeColor: "bg-rose-50 text-rose-700 border-rose-200",
    docsUrl: "https://www.twilio.com/docs/voice",
    fields: [
      { key: "accountSid", label: "Account SID (Required)", placeholder: "ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx" },
      { key: "authToken", label: "Auth Token (Required)", placeholder: "your_auth_token", secret: true },
      { key: "fromNumber", label: "Registered Caller ID (From)", placeholder: "+12025550199" },
      { key: "apiKey", label: "API Key SID (Optional - auto-generated if blank)", placeholder: "SKxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx" },
      { key: "apiToken", label: "API Key Secret (Optional - auto-generated if blank)", placeholder: "your_api_secret", secret: true },
      { key: "applicationSid", label: "TwiML Application SID (Optional - auto-generated if blank)", placeholder: "APxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx" },
    ],
  },
  {
    key: "TELNYX",
    title: "Telnyx",
    tagline: "High-capacity telecom carrier with native WebRTC & SIP trunking",
    badge: "Lowest PSTN Rates",
    badgeColor: "bg-emerald-50 text-emerald-700 border-emerald-200",
    docsUrl: "https://developers.telnyx.com/docs/webrtc",
    fields: [
      { key: "apiKey", label: "Telnyx API Key", placeholder: "KEYxxxxxxxxxxxxxxxxxxxxxxxx", secret: true },
      { key: "applicationSid", label: "Call Control Application ID", placeholder: "your_app_id" },
      { key: "fromNumber", label: "Caller ID / Outbound DID", placeholder: "+12025550188" },
    ],
  },
  {
    key: "EXOTEL",
    title: "Exotel Cloud Telephony",
    tagline: "Enterprise Indian telecom carrier with virtual number bridging",
    badge: "India / APAC Specialist",
    badgeColor: "bg-sky-50 text-sky-700 border-sky-200",
    docsUrl: "https://developer.exotel.com",
    fields: [
      { key: "apiKey", label: "API Key", placeholder: "your_exotel_api_key" },
      { key: "apiToken", label: "API Token", placeholder: "your_exotel_token", secret: true },
      { key: "accountSid", label: "Account SID", placeholder: "your_exotel_sid" },
      { key: "subdomain", label: "API Subdomain", placeholder: "api.exotel.com" },
      { key: "fromNumber", label: "ExoPhone Virtual Number", placeholder: "080xxxxxxxx" },
    ],
  },
  {
    key: "VOBIZ",
    title: "Vobiz Telephony",
    tagline: "Low-latency bidirectional media stream voice infrastructure",
    badge: "High Concurrency",
    badgeColor: "bg-purple-50 text-purple-700 border-purple-200",
    docsUrl: "https://vobiz.ai",
    fields: [
      { key: "apiKey", label: "Auth ID (X-Auth-ID)", placeholder: "vobiz_auth_id" },
      { key: "apiToken", label: "Auth Token (X-Auth-Token)", placeholder: "vobiz_token", secret: true },
      { key: "fromNumber", label: "Registered Caller ID", placeholder: "+12025550177" },
    ],
  },
];
