"use client";

import { useEffect, useState } from "react";
import { authClient } from "@/lib/auth-client";
import { TrendingUp, Loader2 } from "lucide-react";
import { ExportAnalyticsReportButton } from "@/components/analytics/ExportAnalyticsReportButton";

import { Overview } from "./_components/Overview";
import { RevenueCharts } from "./_components/RevenueCharts";
import { Insights } from "./_components/Insights";

export default function AnalyticsPage() {
  const [timeRange, setTimeRange] = useState("all-time");
  const [status, setStatus] = useState<"loading" | "success" | "error">(
    "loading"
  );
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    async function fetchAnalytics() {
      setStatus("loading");
      try {
        const baseUrl = process.env.NEXT_PUBLIC_API_URL || "/api/proxy";
        const res = await authClient.$fetch(
          `/api/dashboard/sourcing-manager/analytics?range=${timeRange}`,
          { baseURL: baseUrl }
        );
        if ((res as any).error) {
          throw new Error(
            (res as any).error.message || "Failed to load analytics"
          );
        }
        setData((res as any).data ?? res);
        setStatus("success");
      } catch (err) {
        console.error(err);
        setStatus("error");
      }
    }
    fetchAnalytics();
  }, [timeRange]);

  const reportPayload = data
    ? {
      departmentName: "Sourcing Manager CP Analytics & Network Yield",
      departmentCode: "SOURCING_MANAGER",
      timeRange,
      generatedAt: new Date().toLocaleString(),
      summaryCards: [
        { label: "Active Brokers", value: data.topWidgets?.totalBrokers ?? 0, subtitle: "Registered CP Network" },
        { label: "Partner Meetings", value: data.topWidgets?.totalMeetings ?? 0, subtitle: "CP Connects" },
        { label: "Follow-ups Done", value: data.topWidgets?.totalFollowUps ?? 0, subtitle: "Relationship touches" },
        { label: "Deals Sourced", value: data.topWidgets?.totalBookingsGenerated ?? 0, subtitle: "Bookings generated" },
        { label: "Total Booking Revenue", value: `₹${(data.topWidgets?.totalBookingRevenue || 0).toLocaleString()}`, subtitle: "Gross token value" },
        { label: "Commission Disbursed", value: `₹${(data.topWidgets?.totalBrokerCommissionPaid || 0).toLocaleString()}`, subtitle: "Broker settlements" },
      ],
      funnelStages: [
        { name: "Active Brokers", count: data.topWidgets?.totalBrokers ?? 0, color: "#6366f1" },
        { name: "Partner Meetings", count: data.topWidgets?.totalMeetings ?? 0, color: "#a855f7" },
        { name: "Follow-ups Done", count: data.topWidgets?.totalFollowUps ?? 0, color: "#f59e0b" },
        { name: "Deals Sourced", count: data.topWidgets?.totalBookingsGenerated ?? 0, color: "#10b981" },
      ],
      financialMetrics: [
        { label: "Gross CP Booking Revenue", value: `₹${(data.topWidgets?.totalBookingRevenue || 0).toLocaleString()}` },
        { label: "Disbursed Broker Commission", value: `₹${(data.topWidgets?.totalBrokerCommissionPaid || 0).toLocaleString()}` },
        { label: "Handover Realized Revenue", value: `₹${(data.topWidgets?.totalRevenueHandoverDone || 0).toLocaleString()}` },
      ],
      activityMetrics: [
        { label: "Registered CP Brokers", value: data.topWidgets?.totalBrokers ?? 0 },
        { label: "Sourcing Meetings Conducted", value: data.topWidgets?.totalMeetings ?? 0 },
        { label: "Broker Follow-ups", value: data.topWidgets?.totalFollowUps ?? 0 },
        { label: "Converted CP Bookings", value: data.topWidgets?.totalBookingsGenerated ?? 0 },
      ],
    }
    : null;

  return (
    <div className="p-4 md:p-8 max-w-[1600px] mx-auto space-y-8 animate-enter">
      {/* Header and Toggle */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-[var(--text-primary)] tracking-tight flex items-center gap-2.5 m-0">
            <div className="w-8 h-8 rounded-xl bg-purple-50 flex items-center justify-center text-[var(--brand-700)]">
              <TrendingUp size={18} />
            </div>
            <span>Sourcing Manager Analytics & Network Yield</span>
          </h1>
          <p className="text-xs text-[var(--text-muted)] font-medium mt-0.5 m-0">
            Analyze broker deal conversion funnels, project revenue attribution & partner activation rates
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex bg-slate-100 p-1 rounded-full border border-slate-200/60 w-fit">
            {["weekly", "monthly", "yearly", "all-time"].map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-3.5 py-1 rounded-full text-xs font-bold transition-all cursor-pointer ${
                  timeRange === range
                    ? "bg-white text-[var(--text-primary)] shadow-xs"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                {range.charAt(0).toUpperCase() +
                  range.slice(1).replace("-", " ")}
              </button>
            ))}
          </div>

          <ExportAnalyticsReportButton
            payload={reportPayload}
            filenamePrefix="sourcing_manager_analytics"
          />
        </div>
      </div>

      {status === "loading" && (
        <div className="min-h-[40vh] flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-[var(--brand-600)]" />
          <p className="text-xs font-semibold text-[var(--text-muted)]">
            Loading sourcing analytics…
          </p>
        </div>
      )}

      {status === "error" && (
        <div className="bg-rose-50 text-rose-700 p-6 rounded-3xl border border-rose-200 text-xs font-bold">
          Failed to load analytics data. Please check backend connection.
        </div>
      )}

      {status === "success" && data && (
        <div className="space-y-8">
          <Overview topWidgets={data.topWidgets} />
          <RevenueCharts charts={data.charts} />
          <Insights data={data} />
        </div>
      )}
    </div>
  );
}
