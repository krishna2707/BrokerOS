"use client";

import React from "react";
import Link from "next/link";
import {
  BarChart3,
  Settings,
  Globe,
  Send,
  Phone,
  MessageSquare,
  Mail,
} from "lucide-react";
import { Button } from "@/components/ui/Button";

export function MarketingHubHeaderActions() {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Link href="/dashboard/marketing/analytics">
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5 text-xs font-bold text-purple-700 border-purple-200 hover:bg-purple-50"
        >
          <BarChart3 className="w-3.5 h-3.5 text-purple-600" />
          <span>Analytics Studio</span>
        </Button>
      </Link>
      <Link href="/dashboard/marketing/settings">
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5 text-xs font-bold hover:bg-slate-50"
        >
          <Settings className="w-3.5 h-3.5" />
          <span>Channel Settings</span>
        </Button>
      </Link>
      <Link href="/dashboard/marketing/ads">
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5 text-xs font-bold text-blue-700 border-blue-200 hover:bg-blue-50"
        >
          <Globe className="w-3.5 h-3.5 text-blue-600" />
          <span>Ads Studio</span>
        </Button>
      </Link>
      <Link href="/dashboard/marketing/whatsapp/inbox">
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5 text-xs font-bold text-emerald-700 border-emerald-200 hover:bg-emerald-50"
        >
          <Send className="w-3.5 h-3.5 text-emerald-600" />
          <span>WhatsApp Inbox</span>
        </Button>
      </Link>
      <Link href="/dashboard/marketing/voice/campaigns/new">
        <Button
          size="sm"
          className="gap-1.5 shadow-xs text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white"
        >
          <Phone className="w-3.5 h-3.5" />
          <span>New Voice Call</span>
        </Button>
      </Link>
      <Link href="/dashboard/marketing/sms/campaigns/new">
        <Button
          size="sm"
          className="gap-1.5 shadow-xs text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white"
        >
          <MessageSquare className="w-3.5 h-3.5" />
          <span>New SMS</span>
        </Button>
      </Link>
      <Link href="/dashboard/marketing/email/campaigns/new">
        <Button
          size="sm"
          className="gap-1.5 shadow-xs text-xs font-bold bg-purple-600 hover:bg-purple-700 text-white"
        >
          <Mail className="w-3.5 h-3.5" />
          <span>New Email</span>
        </Button>
      </Link>
    </div>
  );
}
