"use client";

import { useEffect, useState } from "react";
import { authClient } from "@/lib/auth-client";
import { TrendingUp, Loader2 } from "lucide-react";
import { ExportAnalyticsReportButton } from "@/components/analytics/ExportAnalyticsReportButton";

import { Overview } from "./_components/Overview";
import { RevenueCharts } from "./_components/RevenueCharts";
import { Insights } from "./_components/Insights";

export default function ClosingAnalyticsPage() {
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
          `/api/dashboard/closing-manager/analytics?range=${timeRange}`,
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
      departmentName: "Closing Manager CP Pipeline & Closure Analytics",
      departmentCode: "CLOSING_MANAGER",
      timeRange,
      generatedAt: new Date().toLocaleString(),
      summaryCards: [
        { label: "Total Booked Revenue", value: `₹${(data.topWidgets?.totalRevenue || 0).toLocaleString()}`, subtitle: "Gross deal volume" },
        { label: "Confirmed Bookings", value: data.topWidgets?.totalBookings ?? 0, subtitle: "Closed bookings" },
        { label: "Token Collected", value: `₹${(data.topWidgets?.totalBookingAmount || 0).toLocaleString()}`, subtitle: "Token advance" },
        { label: "Active Brokers", value: data.topWidgets?.totalBrokers ?? 0, subtitle: "Network brokers" },
        { label: "Units Sold", value: data.topWidgets?.totalUnitsSold ?? 0, subtitle: "Inventory units" },
      ],
      funnelStages: [
        { name: "Active Brokers", count: data.topWidgets?.totalBrokers ?? 0, color: "#6366f1" },
        { name: "Follow-ups Done", count: data.topWidgets?.totalFollowUps ?? 0, color: "#a855f7" },
        { name: "Confirmed Bookings", count: data.topWidgets?.totalBookings ?? 0, color: "#10b981" },
        { name: "Units Sold", count: data.topWidgets?.totalUnitsSold ?? 0, color: "#059669" },
      ],
      financialMetrics: [
        { label: "Total Gross Closed Revenue", value: `₹${(data.topWidgets?.totalRevenue || 0).toLocaleString()}` },
        { label: "Token Advance Collections", value: `₹${(data.topWidgets?.totalBookingAmount || 0).toLocaleString()}` },
      ],
      activityMetrics: [
        { label: "Confirmed CP Bookings", value: data.topWidgets?.totalBookings ?? 0 },
        { label: "Inventory Units Sold", value: data.topWidgets?.totalUnitsSold ?? 0 },
        { label: "Active CP Brokers", value: data.topWidgets?.totalBrokers ?? 0 },
        { label: "Negotiation Follow-ups", value: data.topWidgets?.totalFollowUps ?? 0 },
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
            <span>Closing Manager Pipeline Analytics</span>
          </h1>
          <p className="text-xs text-[var(--text-muted)] font-medium mt-0.5 m-0">
            Monitor deal closures, bank mortgage success rates, possession milestones & overall revenue
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
            filenamePrefix="closing_manager_analytics"
          />
        </div>
      </div>

      {status === "loading" && (
        <div className="min-h-[40vh] flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-[var(--brand-600)]" />
          <p className="text-xs font-semibold text-[var(--text-muted)]">
            Loading closing analytics…
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
