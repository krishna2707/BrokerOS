"use client";

import { authClient } from "@/lib/auth-client";
import { useEffect, useState } from "react";
import PremiumBarChart from '@/components/analytics/PremiumBarChart';
import { PostSalesAnalyticsWidgets, PostSalesAnalyticsWidgetsData } from "../components/PostSalesAnalyticsWidgets";
import { VelocityGauge } from "../components/VelocityGauge";
import { StatusPieChart } from "../components/StatusPieChart";
import { InventorySellThroughChart, InventorySellThroughData } from "../components/InventorySellThroughChart";
import { Loader2, Filter } from "lucide-react";
import { ExportAnalyticsReportButton } from "@/components/analytics/ExportAnalyticsReportButton";

interface AnalyticsData {
  widgets: PostSalesAnalyticsWidgetsData;
  funnel: {
    booking: number;
    document: number;
    loan: number;
    agreement: number;
    handover: number;
  };
  velocity: number;
  loanSuccessRate: {
    approved: number;
    rejected: number;
    inProgress: number;
  };
  handoverReadiness: {
    notReady: number;
    scheduled: number;
    handedOver: number;
  };
  internalSalesDistribution: { projectName: string; soldUnits: number }[];
  inventorySellThrough: InventorySellThroughData[];
}

export default function PostSalesAnalytics() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState('monthly');

  useEffect(() => {
    async function load() {
      try {
        setStatus("loading");
        const baseUrl = process.env.NEXT_PUBLIC_API_URL || "/api/proxy";
        const res = await authClient.$fetch<AnalyticsData>(`/api/dashboard/post-sales/analytics?timeRange=${timeRange}`, { baseURL: baseUrl });

        if (res.data) {
          setData(res.data);
          setStatus("success");
        } else if (res.error) {
          throw new Error(res.error.message || "Failed to load analytics");
        } else {
          setData(res as any);
          setStatus("success");
        }
      } catch (e: any) {
        setError(e?.message || "Failed to load analytics");
        setStatus("error");
      }
    }
    load();
  }, [timeRange]);

  const reportPayload = data
    ? {
      departmentName: "Post-Sales Operational Analytics",
      departmentCode: "POST_SALES",
      timeRange,
      generatedAt: new Date().toLocaleString(),
      summaryCards: [
        { label: "Booked Customers", value: data.widgets?.totalBooked ?? 0, subtitle: "Total Booked" },
        { label: "Handover Complete", value: data.widgets?.totalHandoverCompleted ?? 0, subtitle: "Keys Delivered" },
        { label: "Total Revenue", value: `₹${(data.widgets?.totalRevenue || 0).toLocaleString()}`, subtitle: "Collections" },
        { label: "Total Commission", value: `₹${(data.widgets?.totalCommission || 0).toLocaleString()}`, subtitle: "Earned" },
        { label: "Velocity to Handover", value: `${data.velocity ?? 0} days`, subtitle: "Mean duration" },
      ],
      funnelStages: [
        { name: "Booking", count: data.funnel?.booking ?? 0, color: "#ec4899" },
        { name: "Document Verification", count: data.funnel?.document ?? 0, color: "#8b5cf6" },
        { name: "Bank Loan", count: data.funnel?.loan ?? 0, color: "#f59e0b" },
        { name: "Builder Agreement", count: data.funnel?.agreement ?? 0, color: "#3b82f6" },
        { name: "Possession Handover", count: data.funnel?.handover ?? 0, color: "#10b981" },
      ],
      financialMetrics: [
        { label: "Total Revenue Collected", value: `₹${(data.widgets?.totalRevenue || 0).toLocaleString()}` },
        { label: "Inbound Brokerage Commission", value: `₹${(data.widgets?.totalCommission || 0).toLocaleString()}` },
      ],
      activityMetrics: [
        { label: "Loan Success - Approved", value: data.loanSuccessRate?.approved ?? 0 },
        { label: "Loan In Progress", value: data.loanSuccessRate?.inProgress ?? 0 },
        { label: "Loan Rejected", value: data.loanSuccessRate?.rejected ?? 0 },
        { label: "Handover Scheduled", value: data.handoverReadiness?.scheduled ?? 0 },
        { label: "Handed Over", value: data.handoverReadiness?.handedOver ?? 0 },
        { label: "Velocity (Days)", value: `${data.velocity ?? 0} days` },
      ],
    }
    : null;

  return (
    <div className="max-w-7xl mx-auto space-y-10 pb-16 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* ── Header ── */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            Post-Sales Analytics
          </h1>
          <p className="text-slate-500 text-sm font-medium mt-1">
            Monitor your team's post-sales performance, funnels, and revenue.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center gap-2 bg-white p-1 rounded-xl border border-slate-200 shadow-sm">
            <Filter className="w-4 h-4 text-slate-400 ml-2" />
            {[
              { id: 'weekly', label: 'Weekly' },
              { id: 'monthly', label: 'Monthly' },
              { id: 'yearly', label: 'Yearly' },
              { id: 'all-time', label: 'All Time' }
            ].map(r => (
              <button
                key={r.id}
                onClick={() => setTimeRange(r.id)}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${timeRange === r.id
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-600 hover:bg-slate-100'
                  }`}
              >
                {r.label}
              </button>
            ))}
          </div>
          <ExportAnalyticsReportButton
            payload={reportPayload}
            filenamePrefix="postsales_analytics"
          />
        </div>
      </div>

      {status === "loading" && (
        <div className="flex items-center justify-center min-h-[40vh]">
          <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {status === "error" && (
        <div className="flex items-center justify-center min-h-[40vh]">
          <div className="p-8 rounded-3xl bg-red-50 border border-red-100 text-center">
            <h2 className="text-xl font-bold text-red-600 mb-2">Failed to Load Analytics</h2>
            <p className="text-red-500 text-sm">{error || "Please check your connection or backend implementation."}</p>
          </div>
        </div>
      )}

      {status === "success" && data && (
        <div className="space-y-10">
          {/* ── Top Widgets ── */}
          <PostSalesAnalyticsWidgets widgets={data.widgets} />

          {/* ── Post-Sales Funnel ── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start mt-4">
            <div className="lg:col-span-2">
              <PremiumBarChart
                data={[
                  { name: 'Booking', value: data.funnel.booking },
                  { name: 'Document', value: data.funnel.document },
                  { name: 'Loan', value: data.funnel.loan },
                  { name: 'Agreement', value: data.funnel.agreement },
                  { name: 'Handover', value: data.funnel.handover },
                ]}
                title="Post-Sales Funnel Progression"
                description="Conversion journey from initial booking to handover."
                dataKey="value"
                categoryKey="name"
                color="#ec4899"
              />
            </div>
            <div className="lg:col-span-1">
              <VelocityGauge days={data.velocity} />
            </div>
          </div>

          {/* ── Status Pie Charts (Phase 5 & 6) ── */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start mt-4">
            <StatusPieChart
              title="Loan Approval Success Rate"
              description="Breakdown of loan case statuses"
              data={[
                { name: 'Approved', value: data.loanSuccessRate.approved, color: '#10b981' }, // green
                { name: 'In Progress', value: data.loanSuccessRate.inProgress, color: '#f59e0b' }, // amber
                { name: 'Rejected', value: data.loanSuccessRate.rejected, color: '#ef4444' }, // red
              ]}
            />
            <StatusPieChart
              title="Handover Readiness Status"
              description="Status of possession/handover readiness"
              data={[
                { name: 'Not Ready', value: data.handoverReadiness.notReady, color: '#ef4444' },
                { name: 'Scheduled', value: data.handoverReadiness.scheduled, color: '#3b82f6' }, // blue
                { name: 'Handed Over', value: data.handoverReadiness.handedOver, color: '#10b981' },
              ]}
            />
          </div>

          {/* ── Internal Project Analytics ── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start mt-4">
            <StatusPieChart
              title="Internal Sales Distribution"
              description="Percentage share of total sold/reserved units per project"
              data={data.internalSalesDistribution.map((p, index) => {
                const colors = ['#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#f59e0b', '#10b981', '#06b6d4'];
                return { name: p.projectName, value: p.soldUnits, color: colors[index % colors.length] };
              })}
            />
            <InventorySellThroughChart data={data.inventorySellThrough} />
          </div>
        </div>
      )}
    </div>
  );
}
