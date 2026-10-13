"use client";

import React from "react";
import { DepartmentWhatsAppPageClient } from "@/features/marketing/whatsapp";

export default function AdminWhatsAppPage() {
  return (
    <DepartmentWhatsAppPageClient
      title="System Administrator WhatsApp Hub"
      subtitle="Complete system-wide visibility of all active WhatsApp conversations, agent routing, and messaging threads."
      department="ADMIN"
      scope="all"
      showManagerFilter={true}
    />
  );
}
