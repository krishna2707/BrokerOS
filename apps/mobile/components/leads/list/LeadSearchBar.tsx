import React from 'react';
import { View, Text, TextInput, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Lead } from '../types';
import { DialerLead } from '@/hooks/useAutoDialer';

interface LeadSearchBarProps {
  search: string;
  setSearch: (text: string) => void;
  selectionMode: boolean;
  selectedLeads: string[];
  leads: Lead[];
  startDialer: (leads: DialerLead[]) => void;
  onExport?: () => void;
  exportCount?: number;
}

export default function LeadSearchBar({
  search,
  setSearch,
  selectionMode,
  selectedLeads,
  leads,
  startDialer,
  onExport,
  exportCount,
}: LeadSearchBarProps) {
  return (
    <View className="p-4">
      <View className="flex-row items-center gap-2 mb-2">
        <View className="flex-1 flex-row items-center bg-white border border-gray-200 rounded-xl px-3 py-2 shadow-sm">
          <Feather name="search" size={18} color="#94a3b8" />
          <TextInput
            placeholder="Search leads..."
            value={search}
            onChangeText={setSearch}
            className="flex-1 ml-2 text-base text-gray-900 h-8"
          />
        </View>
        {onExport && (
          <TouchableOpacity
            onPress={onExport}
            className="bg-emerald-50 border border-emerald-300 px-3 py-2.5 rounded-xl flex-row items-center gap-1.5 shadow-sm active:bg-emerald-100"
          >
            <Feather name="download" size={14} color="#059669" />
            <Text className="text-emerald-700 font-bold text-xs">
              CSV {exportCount !== undefined ? `(${exportCount})` : ""}
            </Text>
          </TouchableOpacity>
        )}
      </View>
      {selectionMode && (
        <View className="flex-row items-center justify-between bg-blue-100 px-4 py-2 rounded-lg mb-2">
          <Text className="text-blue-800 font-medium">{selectedLeads.length}/10 Selected</Text>
          <TouchableOpacity
            disabled={selectedLeads.length === 0}
            onPress={() => {
              const leadsToDial: DialerLead[] = leads
                .filter(l => selectedLeads.includes(l.id))
                .map(l => ({ id: l.id, name: `${l.firstName} ${l.lastName}`, phone: l.phone }));
              startDialer(leadsToDial);
            }}
            className={`px-3 py-1 rounded-md ${selectedLeads.length > 0 ? 'bg-blue-600' : 'bg-gray-400'}`}
          >
            <Text className="text-white font-medium text-sm">Send to Dialer</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}
