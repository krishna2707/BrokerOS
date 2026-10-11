import React from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Feather } from '@expo/vector-icons';

interface NewLeadsHeaderProps {
  uploading: boolean;
  onUpload: () => void;
  onExport?: () => void;
  exportCount?: number;
}

export function NewLeadsHeader({
  uploading,
  onUpload,
  onExport,
  exportCount,
}: NewLeadsHeaderProps) {
  return (
    <View className="bg-white p-4 pt-12 flex-row justify-between items-center shadow-sm z-10">
      <Text className="text-xl font-bold text-gray-900">New Leads Pool</Text>
      <View className="flex-row items-center gap-2">
        {onExport && (
          <TouchableOpacity
            onPress={onExport}
            className="bg-emerald-50 border border-emerald-300 px-2.5 py-2 rounded-lg flex-row items-center active:bg-emerald-100"
          >
            <Feather name="download" size={15} color="#059669" />
            <Text className="text-emerald-700 font-bold ml-1 text-xs">
              CSV ({exportCount ?? 0})
            </Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          onPress={onUpload}
          disabled={uploading}
          className="bg-indigo-600 px-3 py-2 rounded-lg flex-row items-center"
        >
          {uploading ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <>
              <Feather name="upload" size={16} color="white" />
              <Text className="text-white font-medium ml-1 text-sm">Upload (CSV)</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}
