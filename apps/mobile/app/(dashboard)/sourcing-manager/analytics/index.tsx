import { View, Text, ActivityIndicator, ScrollView, TouchableOpacity } from 'react-native';
import { Feather, FontAwesome5 } from '@expo/vector-icons';
import { useEffect, useState, useCallback } from 'react';
import { authClient } from '../../../../lib/auth-client';
import { exportAnalyticsHtmlMobile } from '../../../../lib/export-utils';

export default function SourcingAnalyticsScreen() {
  const [timeRange, setTimeRange] = useState("all-time");
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [data, setData] = useState<any>(null);
  const [errorMsg, setErrorMsg] = useState("");

  const fetchAnalytics = useCallback(async () => {
      setStatus("loading");
      try {
        const baseURL = process.env.EXPO_PUBLIC_API_URL as string;
        const res = await authClient.$fetch(`/api/dashboard/sourcing-manager/analytics?range=${timeRange}`, { baseURL });
        if (res.error) throw new Error(res.error.message || "Failed to load analytics");
        setData(res.data);
        setStatus("success");
      } catch (err: any) {
        console.error(err);
        setErrorMsg(err.message || "Connection Error");
        setStatus("error");
      }
    }, [timeRange]);

  useEffect(() => {
    // Debounce to prevent concurrent SecureStore access on rapid taps (avoids navigation context errors)
    const timer = setTimeout(() => { fetchAnalytics(); }, 300);
    return () => clearTimeout(timer);
  }, [fetchAnalytics]);

  const ranges = ['weekly', 'monthly', 'yearly', 'all-time'];
  const colors = ['#4f46e5', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4'];

  const renderHorizontalBarList = (items: any[], valueKey: string, nameKey: string, valueFormatter?: (v: any) => string) => {
    if (!items || items.length === 0) {
      return <Text className="text-sm text-slate-400 text-center py-8">No data available</Text>;
    }
    const maxVal = Math.max(...items.map(i => i[valueKey] || 0), 1);
    
    return (
      <View className="flex-col gap-3 mt-4">
        {items.map((item, idx) => {
          const widthPct = Math.max((item[valueKey] / maxVal) * 100, 2);
          const color = colors[idx % colors.length];
          const displayVal = valueFormatter ? valueFormatter(item[valueKey]) : item[valueKey];
          return (
            <View key={idx} className="flex-row items-center justify-between">
              <Text className="w-24 text-xs font-semibold text-slate-700" numberOfLines={1}>{item[nameKey]}</Text>
              <View className="flex-1 flex-row items-center ml-2 mr-2">
                <View className="h-2 rounded-full" style={{ width: `${widthPct}%`, backgroundColor: color }} />
              </View>
              <Text className="text-xs font-bold text-slate-900 min-w-[50px] text-right">{displayVal}</Text>
            </View>
          );
        })}
      </View>
    );
  };

  const handleExportReport = () => {
    if (!data) return;
    const payload = {
      departmentName: 'Sourcing Manager CP Analytics & Network Yield',
      departmentCode: 'SOURCING_MANAGER',
      timeRange,
      generatedAt: new Date().toLocaleString(),
      summaryCards: [
        { label: 'Active Brokers', value: data.topWidgets?.totalBrokers ?? 0, subtitle: 'Registered CP Network' },
        { label: 'Partner Meetings', value: data.topWidgets?.totalMeetings ?? 0, subtitle: 'CP Connects' },
        { label: 'Follow-ups Done', value: data.topWidgets?.totalFollowUps ?? 0, subtitle: 'Relationship touches' },
        { label: 'Deals Sourced', value: data.topWidgets?.totalBookingsGenerated ?? 0, subtitle: 'Bookings generated' },
        { label: 'Total Booking Revenue', value: `₹${(data.topWidgets?.totalBookingRevenue || 0).toLocaleString()}`, subtitle: 'Gross token value' },
        { label: 'Commission Disbursed', value: `₹${(data.topWidgets?.totalBrokerCommissionPaid || 0).toLocaleString()}`, subtitle: 'Broker settlements' },
      ],
      funnelStages: [
        { name: 'Active Brokers', count: data.topWidgets?.totalBrokers ?? 0, color: '#6366f1' },
        { name: 'Partner Meetings', count: data.topWidgets?.totalMeetings ?? 0, color: '#a855f7' },
        { name: 'Follow-ups Done', count: data.topWidgets?.totalFollowUps ?? 0, color: '#f59e0b' },
        { name: 'Deals Sourced', count: data.topWidgets?.totalBookingsGenerated ?? 0, color: '#10b981' },
      ],
      financialMetrics: [
        { label: 'Gross CP Booking Revenue', value: `₹${(data.topWidgets?.totalBookingRevenue || 0).toLocaleString()}` },
        { label: 'Disbursed Broker Commission', value: `₹${(data.topWidgets?.totalBrokerCommissionPaid || 0).toLocaleString()}` },
        { label: 'Handover Realized Revenue', value: `₹${(data.topWidgets?.totalRevenueHandoverDone || 0).toLocaleString()}` },
      ],
      activityMetrics: [
        { label: 'Registered CP Brokers', value: data.topWidgets?.totalBrokers ?? 0 },
        { label: 'Sourcing Meetings Conducted', value: data.topWidgets?.totalMeetings ?? 0 },
        { label: 'Broker Follow-ups', value: data.topWidgets?.totalFollowUps ?? 0 },
        { label: 'Converted CP Bookings', value: data.topWidgets?.totalBookingsGenerated ?? 0 },
      ],
    };
    exportAnalyticsHtmlMobile(payload, 'sourcing_manager_analytics');
  };

  return (
    <ScrollView className="flex-1 bg-[#f8fafc]" contentContainerStyle={{ padding: 20, paddingBottom: 100 }}>
      {/* Header and Toggle */}
      <View className="mb-6">
        <Text className="text-3xl font-extrabold text-slate-900 tracking-tight">Analytics</Text>
        <Text className="text-slate-500 text-sm font-medium mt-1">Deep dive into performance & conversions.</Text>
      </View>

      {/* Time Range Segmented Control & Export */}
      <View className="flex-row items-center justify-between flex-wrap gap-2 mb-6">
        <View className="flex-row bg-slate-200 border-0 p-1.5 rounded-full self-start">
          {ranges.map(range => (
            <TouchableOpacity
              key={range}
              onPress={() => setTimeRange(range)}
            >
              <View 
                key={timeRange === range ? 'active' : 'inactive'}
                className={`px-4 py-1.5 rounded-full ${timeRange === range ? 'bg-white shadow-sm' : ''}`}
              >
                <Text className={`text-sm font-bold ${timeRange === range ? 'text-slate-900' : 'text-slate-500'}`}>
                  {range.charAt(0).toUpperCase() + range.slice(1).replace('-', ' ')}
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

      {status === "loading" && (
        <View className="py-20 items-center justify-center">
          <ActivityIndicator size="large" color="#4f46e5" />
        </View>
      )}

      {status === "error" && (
        <View className="bg-red-50 p-6 rounded-2xl border border-red-200 items-center my-10">
          <Feather name="alert-circle" size={32} color="#dc2626" />
          <Text className="text-red-600 font-bold text-lg mt-2">Failed to load Analytics</Text>
          <Text className="text-red-500 text-center mt-1 text-sm">{errorMsg}</Text>
        </View>
      )}

      {status === "success" && data && (
        <View className="space-y-6 flex-col gap-6">
          {/* Top Row Widgets */}
          <View className="flex-row flex-wrap justify-between gap-y-4">
            <View className="w-[48%] bg-white rounded-2xl p-4 border border-slate-200 shadow-sm">
              <View className="flex-row items-center gap-2 mb-2">
                <View className="p-1.5 bg-indigo-100 rounded-lg"><Feather name="users" size={16} color="#4f46e5" /></View>
                <Text className="text-xs font-bold text-slate-500">Brokers</Text>
              </View>
              <Text className="text-2xl font-black text-slate-900">{data.topWidgets.totalBrokers}</Text>
            </View>
            
            <View className="w-[48%] bg-white rounded-2xl p-4 border border-slate-200 shadow-sm">
              <View className="flex-row items-center gap-2 mb-2">
                <View className="p-1.5 bg-purple-100 rounded-lg"><Feather name="calendar" size={16} color="#9333ea" /></View>
                <Text className="text-xs font-bold text-slate-500">Meetings</Text>
              </View>
              <Text className="text-2xl font-black text-slate-900">{data.topWidgets.totalMeetings}</Text>
            </View>

            <View className="w-[48%] bg-white rounded-2xl p-4 border border-slate-200 shadow-sm">
              <View className="flex-row items-center gap-2 mb-2">
                <View className="p-1.5 bg-orange-100 rounded-lg"><Feather name="clock" size={16} color="#ea580c" /></View>
                <Text className="text-xs font-bold text-slate-500">Follow-ups</Text>
              </View>
              <Text className="text-2xl font-black text-slate-900">{data.topWidgets.totalFollowUps}</Text>
            </View>

            <View className="w-[48%] bg-white rounded-2xl p-4 border border-slate-200 shadow-sm">
              <View className="flex-row items-center gap-2 mb-2">
                <View className="p-1.5 bg-emerald-100 rounded-lg"><Feather name="check-circle" size={16} color="#10b981" /></View>
                <Text className="text-xs font-bold text-slate-500">Bookings</Text>
              </View>
              <Text className="text-2xl font-black text-slate-900">{data.topWidgets.totalBookingsGenerated}</Text>
            </View>
          </View>

          {/* Revenue Highlight Row */}
          <View className="bg-slate-900 rounded-3xl p-6 shadow-xl relative overflow-hidden">
             <View className="absolute -right-6 -bottom-6 w-24 h-24 bg-emerald-500/20 rounded-full" />
             <View className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center mb-3">
               <FontAwesome5 name="rupee-sign" size={16} color="#34d399" />
             </View>
             <Text className="text-xs text-slate-400 font-medium">Total Booking Revenue (Tokens)</Text>
             <Text className="text-3xl font-black text-white mt-1">₹{(data.topWidgets.totalBookingRevenue || 0).toLocaleString('en-IN')}</Text>
          </View>

          <View className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm">
             <View className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center mb-3">
               <FontAwesome5 name="building" size={16} color="#3b82f6" />
             </View>
             <Text className="text-xs text-slate-500 font-bold">Commission Paid</Text>
             <Text className="text-3xl font-black text-slate-900 mt-1">₹{(data.topWidgets.totalBrokerCommissionPaid || 0).toLocaleString('en-IN')}</Text>
          </View>

          <View className="bg-indigo-50 border border-indigo-100 rounded-3xl p-6 shadow-sm">
             <View className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center mb-3">
               <Feather name="trending-up" size={16} color="#ffffff" />
             </View>
             <Text className="text-xs text-indigo-900/60 font-bold">Revenue (Handover Done)</Text>
             <Text className="text-3xl font-black text-indigo-950 mt-1">₹{(data.topWidgets.totalRevenueHandoverDone || 0).toLocaleString('en-IN')}</Text>
          </View>

          {/* Chart Replacements */}
          <View className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm">
            <Text className="font-bold text-slate-900 mb-1">Broker-wise Revenue</Text>
            {renderHorizontalBarList(data.charts?.brokerWiseRevenue, 'revenue', 'name', (v) => `₹${Number(v).toLocaleString('en-IN')}`)}
          </View>

          <View className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm">
            <Text className="font-bold text-slate-900 mb-1">Project-wise Revenue</Text>
            {renderHorizontalBarList(data.charts?.projectWiseRevenue, 'revenue', 'name', (v) => `₹${Number(v).toLocaleString('en-IN')}`)}
          </View>

          <View className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm">
            <Text className="font-bold text-slate-900 mb-1">Project-wise Bookings</Text>
            {renderHorizontalBarList(data.charts?.projectWiseBookings, 'units', 'name', (v) => `${v} units`)}
          </View>

          {/* Conversion Funnel */}
          <View className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm mt-2">
            <Text className="font-bold text-slate-900 mb-4">Conversion Funnel</Text>
            <View className="flex-col gap-2">
              <View className="flex-row items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                <Text className="font-semibold text-slate-700 text-sm">Leads Generated</Text>
                <Text className="text-lg font-black text-slate-900">{data.conversionRates?.leads || 0}</Text>
              </View>
              <View className="items-center -my-1 z-10"><Feather name="arrow-down" size={16} color="#94a3b8" /></View>
              <View className="flex-row items-center justify-between p-3 bg-indigo-50 rounded-xl border border-indigo-100">
                <Text className="font-semibold text-indigo-700 text-sm">Site Visits Completed</Text>
                <Text className="text-lg font-black text-indigo-900">{data.conversionRates?.siteVisits || 0}</Text>
              </View>
              <View className="items-center -my-1 z-10"><Feather name="arrow-down" size={16} color="#818cf8" /></View>
              <View className="flex-row items-center justify-between p-3 bg-emerald-50 rounded-xl border border-emerald-100">
                <Text className="font-semibold text-emerald-700 text-sm">Final Bookings</Text>
                <Text className="text-lg font-black text-emerald-900">{data.conversionRates?.bookings || 0}</Text>
              </View>
            </View>
          </View>

          {/* Highlights */}
          <View className="bg-orange-50 border border-amber-200 rounded-3xl p-5 shadow-sm mt-2">
            <View className="flex-row items-center gap-2 mb-3">
              <View className="p-1.5 bg-amber-100 rounded-lg"><Feather name="star" size={16} color="#d97706" /></View>
              <Text className="font-bold text-amber-900">Most Selling Project</Text>
            </View>
            {data.mostSellingProject ? (
              <View>
                <Text className="text-xl font-black text-amber-950">{data.mostSellingProject.name}</Text>
                <Text className="text-xs font-semibold text-amber-800/70">{data.mostSellingProject.unitsSold} units sold</Text>
                <Text className="text-lg font-bold text-amber-900 mt-2">₹{data.mostSellingProject.revenue.toLocaleString('en-IN')}</Text>
              </View>
            ) : <Text className="text-sm text-amber-800">No project data</Text>}
          </View>

          {/* Activation Rate */}
          <View className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm mt-2 items-center">
            <Text className="text-sm font-bold text-slate-500 mb-2">Broker Activation Rate</Text>
            <View className="items-center justify-center h-24 w-full">
               <View className="w-full bg-slate-100 h-4 rounded-full overflow-hidden">
                 <View className="h-full bg-indigo-600 rounded-full" style={{ width: `${data.brokerActivationRate || 0}%` }} />
               </View>
               <Text className="text-3xl font-black text-slate-900 mt-4">{data.brokerActivationRate || 0}%</Text>
            </View>
          </View>

          {/* Top 5 Brokers Leaderboard */}
          <View className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm mt-2">
            <View className="flex-row items-center gap-2 mb-4">
              <Feather name="award" size={18} color="#eab308" />
              <Text className="font-bold text-slate-900">Top 5 Brokers</Text>
            </View>
            <View className="flex-col gap-3">
              {data.top5Brokers?.map((broker: any) => (
                <View key={broker.rank} className="flex-row items-center justify-between p-2 bg-slate-50 rounded-xl">
                  <View className="flex-row items-center gap-3">
                    <View className={`w-8 h-8 rounded-full items-center justify-center ${
                      broker.rank === 1 ? 'bg-yellow-100' :
                      broker.rank === 2 ? 'bg-slate-200' :
                      broker.rank === 3 ? 'bg-orange-100' : 'bg-slate-100'
                    }`}>
                      <Text className={`font-bold text-xs ${
                        broker.rank === 1 ? 'text-yellow-700' :
                        broker.rank === 2 ? 'text-slate-700' :
                        broker.rank === 3 ? 'text-orange-700' : 'text-slate-500'
                      }`}>#{broker.rank}</Text>
                    </View>
                    <View>
                      <Text className="font-bold text-slate-900 text-sm">{broker.name}</Text>
                      <Text className="text-xs text-slate-500">{broker.unitsSold} units</Text>
                    </View>
                  </View>
                </View>
              ))}
              {(!data.top5Brokers || data.top5Brokers.length === 0) && (
                <Text className="text-sm text-slate-400 text-center py-4">No active brokers</Text>
              )}
            </View>
          </View>

        </View>
      )}
    </ScrollView>
  );
}
