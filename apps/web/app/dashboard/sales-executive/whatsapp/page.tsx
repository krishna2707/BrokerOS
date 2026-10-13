"use client";

import React from "react";
import { DepartmentWhatsAppPageClient } from "@/features/marketing/whatsapp";

export default function SalesExecutiveWhatsAppPage() {
  return (
    <DepartmentWhatsAppPageClient
      title="Sales Executive WhatsApp Inbox"
      subtitle="Direct 1-on-1 messaging with leads scheduled for site visits, negotiations, and unit bookings."
      department="SALES_EXECUTIVE"
      scope="my"
    />
  );
}
