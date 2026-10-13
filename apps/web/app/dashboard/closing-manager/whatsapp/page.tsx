"use client";

import React from "react";
import { DepartmentWhatsAppPageClient } from "@/features/marketing/whatsapp";

export default function ClosingManagerWhatsAppPage() {
  return (
    <DepartmentWhatsAppPageClient
      title="Closing Manager WhatsApp Inbox"
      subtitle="Direct messaging with walk-in visitors, on-site negotiation prospects, and active booking clients."
      department="CLOSING_MANAGER"
      scope="my"
    />
  );
}
