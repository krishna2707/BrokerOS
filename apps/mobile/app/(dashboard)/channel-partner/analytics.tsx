import React, { useEffect, useState, useCallback } from "react";
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from "react-native";
import { authClient } from "@/lib/auth-client";
import { AlertCircle } from "lucide-react-native";
import { Feather } from "@expo/vector-icons";
import { exportAnalyticsHtmlMobile } from "@/lib/export-utils";
import { Overview } from "@/components/dashboards/channel-partner/analytics/Overview";
import { BookingFunnel } from "@/components/dashboards/channel-partner/analytics/BookingFunnel";
import { RevenueCharts } from "@/components/dashboards/channel-partner/analytics/RevenueCharts";
import { InventoryAnalytics } from "@/components/dashboards/channel-partner/analytics/InventoryAnalytics";
import { BrokerPerformance } from "@/components/dashboards/channel-partner/analytics/BrokerPerformance";
import { SMLeaderboard } from "@/components/dashboards/channel-partner/analytics/SMLeaderboard";
import { CMLeaderboard } from "@/components/dashboards/channel-partner/analytics/CMLeaderboard";
import { ConversionAnalytics } from "@/components/dashboards/channel-partner/analytics/ConversionAnalytics";
import { BrokerageSettlement } from "@/components/dashboards/channel-partner/analytics/BrokerageSettlement";
import { SiteVisitAnalytics } from "@/components/dashboards/channel-partner/analytics/SiteVisitAnalytics";

export default function CPAnalyticsMobile() {
  const [range, setRange] = useState("all-time");
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [data, setData] = useState<any>(null);

  const ranges = ["weekly", "monthly", "yearly", "all-time"];

  const load = useCallback(async () => {
      setStatus("loading");
      try {
        const baseURL = process.env.EXPO_PUBLIC_API_URL as string;
        const res = await authClient.$fetch(`/api/dashboard/channel-partner/analytics?range=${range}`, { baseURL });
        setData((res as any)?.data || res);
        setStatus("success");
      } catch (err: any) {
        console.log("Analytics Error", err);
        setStatus("error");
      }
    }, [range]);

  useEffect(() => {
    // Debounce to prevent concurrent SecureStore access on rapid taps (avoids navigation context errors)
    const timer = setTimeout(() => { load(); }, 300);
    return () => clearTimeout(timer);
  }, [load]);

  const handleExportReport = () => {
    if (!data) return;
    const payload = {
      departmentName: 'Channel Partner Ecosystem & Network Yield Analytics',
      departmentCode: 'CHANNEL_PARTNER',
      timeRange: range,
      generatedAt: new Date().toLocaleString(),
      summaryCards: [
        { label: 'Total Revenue', value: `₹${(data.topWidgets?.totalRevenue || 0).toLocaleString()}`, subtitle: 'Cumulative realization' },
        { label: 'Total Bookings', value: data.topWidgets?.totalBookings ?? 0, subtitle: 'Confirmed deals' },
        { label: 'Units Sold', value: data.topWidgets?.totalUnitsSold ?? 0, subtitle: 'Handover complete' },
        { label: 'Units Reserved', value: data.topWidgets?.totalUnitsReserved ?? 0, subtitle: 'Under processing' },
        { label: 'Booking Revenue', value: `₹${(data.topWidgets?.totalBookingRevenue || 0).toLocaleString()}`, subtitle: 'Gross token value' },
        { label: 'Settlement Paid', value: `₹${(data.brokerageSettlement?.totalPaid || 0).toLocaleString()}`, subtitle: 'CP Brokerage Disbursed' },
      ],
      funnelStages: [
        { name: 'Confirmed Bookings', count: data.bookingFunnel?.confirmed ?? 0, color: '#64748b' },
        { name: 'Documentation', count: data.bookingFunnel?.documentation ?? 0, color: '#3b82f6' },
        { name: 'Loan & Agreement', count: data.bookingFunnel?.loanAgreement ?? 0, color: '#6366f1' },
        { name: 'Possession Stage', count: data.bookingFunnel?.possession ?? 0, color: '#f59e0b' },
        { name: 'Handover Done', count: data.bookingFunnel?.handover ?? 0, color: '#10b981' },
      ],
      financialMetrics: [
        { label: 'Cumulative Revenue Realized', value: `₹${(data.topWidgets?.totalRevenue || 0).toLocaleString()}` },
        { label: 'Gross Booking Revenue', value: `₹${(data.topWidgets?.totalBookingRevenue || 0).toLocaleString()}` },
        { label: 'Total Brokerage Settled', value: `₹${(data.brokerageSettlement?.totalPaid || 0).toLocaleString()}` },
        { label: 'Pending Settlement', value: `₹${(data.brokerageSettlement?.totalPending || 0).toLocaleString()}` },
      ],
      activityMetrics: [
        { label: 'Units Sold (Closed)', value: data.topWidgets?.totalUnitsSold ?? 0 },
        { label: 'Units Reserved', value: data.topWidgets?.totalUnitsReserved ?? 0 },
        { label: 'Active CP Network Count', value: data.brokerPerformance?.length || 0 },
        { label: 'Lead to Booking Conversion Rate', value: `${data.conversionRates?.overall || 0}%` },
      ],
    };
    exportAnalyticsHtmlMobile(payload, 'channel_partner_analytics');
  };

  return (
    <ScrollView className="flex-1 bg-slate-50" contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
      {/* Header & Filter */}
      <View className="mb-6">
        <Text className="text-3xl font-extrabold text-slate-900 tracking-tight">CP Analytics</Text>
        <Text className="text-slate-500 text-sm font-medium mt-1">Deep dive into your channel partner business performance.</Text>

        {/* Time Range Segmented Control & Export */}
        <View className="flex-row items-center justify-between flex-wrap gap-2 mt-4">
          <View className="flex-row bg-slate-200 border-0 p-1.5 rounded-full self-start">
            {ranges.map(r => (
              <TouchableOpacity
                key={r}
                onPress={() => setRange(r)}
              >
                <View 
                  key={range === r ? 'active' : 'inactive'}
                  className={`px-4 py-1.5 rounded-full ${range === r ? 'bg-white shadow-sm' : ''}`}
                >
                  <Text className={`text-sm font-bold ${range === r ? 'text-slate-900' : 'text-slate-500'}`}>
                    {r.charAt(0).toUpperCase() + r.slice(1).replace("-", " ")}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity
            onPress={handleExportReport}
            className="bg-indigo-50 border border-indigo-200 px-3.5 py-2 rounded-full flex-row items-center gap-1.5 active:bg-indigo-100"
          >
            <Feather name="file-text" size={14} color="#4f46e5" />
            <Text className="text-indigo-700 font-bold text-xs">Export Report</Text>
          </TouchableOpacity>
        </View>
      </View>

      {status === "loading" && (
        <View className="flex-1 items-center justify-center py-20">
          <ActivityIndicator size="large" color="#4f46e5" />
        </View>
      )}

      {status === "error" && (
        <View className="flex-1 items-center justify-center py-20 bg-red-50 rounded-3xl border border-red-100 p-6">
          <AlertCircle size={40} color="#ef4444" className="mb-3" />
          <Text className="text-xl font-bold text-red-600 mb-1">Failed to Load</Text>
          <Text className="text-red-500 text-sm text-center">Check your connection or backend status.</Text>
        </View>
      )}

      {status === "success" && data && (
        <View>
          <Overview topWidgets={data.topWidgets} />
          <BookingFunnel bookingFunnel={data.bookingFunnel} />
          <RevenueCharts revenueCharts={data.revenueCharts} />
          <InventoryAnalytics inventoryAnalytics={data.inventoryAnalytics} />
          <BrokerPerformance brokerPerformance={data.brokerPerformance} />
          <SMLeaderboard smLeaderboard={data.smLeaderboard} />
          <CMLeaderboard cmLeaderboard={data.cmLeaderboard} />
          <ConversionAnalytics conversionRates={data.conversionRates} />
          <BrokerageSettlement brokerageSettlement={data.brokerageSettlement} />
          <SiteVisitAnalytics siteVisitAnalytics={data.siteVisitAnalytics} />
        </View>
      )}
    </ScrollView>
  );
}
