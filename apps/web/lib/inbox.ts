// ============================================================================
// BrokerOS — Unified Department & Role Inbox Configuration Helper
// ============================================================================

export interface RoleInboxConfig {
  title: string;
  subtitle: string;
  department: string;
  scope: "my" | "team" | "all";
  showManagerFilter: boolean;
}

const CHANNEL_NAMES: Record<"email" | "sms" | "whatsapp", string> = {
  email: "Email",
  sms: "SMS",
  whatsapp: "WhatsApp",
};

export function getInboxConfig(
  role: string = "",
  channel: "email" | "sms" | "whatsapp"
): RoleInboxConfig {
  const normRole = (role || "").toUpperCase();
  const channelName = CHANNEL_NAMES[channel] || "Inbox";

  const isGlobal = normRole === "ADMIN" || normRole === "DIRECTOR";
  const isManager = isGlobal || normRole.includes("MANAGER");

  let department = "SALES";
  if (normRole.startsWith("PRE_SALES")) department = "PRE_SALES";
  else if (normRole.startsWith("POST_SALES")) department = "POST_SALES";
  else if (normRole.startsWith("SOURCING")) department = "SOURCING";
  else if (normRole.startsWith("CLOSING")) department = "CLOSING";
  else if (normRole === "CHANNEL_PARTNER") department = "CHANNEL_PARTNER";
  else if (normRole === "ADMIN") department = "ADMIN";
  else if (normRole === "FINANCE") department = "FINANCE";
  else if (normRole === "BUSINESS_MANAGER") department = "BUSINESS";

  const scope: "my" | "team" | "all" = isGlobal
    ? "all"
    : isManager
    ? "team"
    : "my";
  const showManagerFilter = isManager;

  const roleLabel = normRole
    ? normRole
        .split("_")
        .map((w) => w.charAt(0) + w.slice(1).toLowerCase())
        .join(" ")
    : "Team";

  const scopeLabel =
    scope === "all"
      ? "organization-wide"
      : scope === "team"
      ? "team"
      : "personal";

  return {
    title: `${roleLabel} ${channelName} Inbox`,
    subtitle: `Monitor and manage ${scopeLabel} ${channelName} communications.`,
    department,
    scope,
    showManagerFilter,
  };
}
