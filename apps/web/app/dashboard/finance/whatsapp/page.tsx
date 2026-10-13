"use client";

import React from "react";
import { DepartmentWhatsAppPageClient } from "@/features/marketing/whatsapp";

export default function FinanceWhatsAppPage() {
  return (
    <DepartmentWhatsAppPageClient
      title="Finance & Accounts WhatsApp Inbox"
      subtitle="Direct communications with customers for payment milestones, demand notices, receipts, and CP broker commission settlements."
      department="FINANCE"
      scope="all"
    />
  );
}
