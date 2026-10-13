"use client";

import React from "react";
import { DepartmentWhatsAppPageClient } from "@/features/marketing/whatsapp";

export default function SourcingManagerWhatsAppPage() {
  return (
    <DepartmentWhatsAppPageClient
      title="Sourcing Manager WhatsApp Inbox"
      subtitle="Direct 1-on-1 messaging with your assigned Channel Partner brokers, inventory updates, and payout inquiries."
      department="SOURCING_MANAGER"
      scope="my"
    />
  );
}
