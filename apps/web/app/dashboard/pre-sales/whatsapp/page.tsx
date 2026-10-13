"use client";

import React from "react";
import { DepartmentWhatsAppPageClient } from "@/features/marketing/whatsapp";

export default function PreSalesWhatsAppPage() {
  return (
    <DepartmentWhatsAppPageClient
      title="Pre-Sales WhatsApp Inbox"
      subtitle="Direct 1-on-1 WhatsApp messaging with your assigned discovery leads."
      department="PRE_SALES"
      scope="my"
    />
  );
}
