import React from 'react';
import { View, Text } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { UNIT_STATUS_CONFIG } from '@brokeros/constants';
import type { UnitStatus } from '@brokeros/types';

interface UnitStatusBadgeProps {
  status: UnitStatus | string;
}

export function UnitStatusBadge({ status }: UnitStatusBadgeProps) {
  const upperStatus = status?.toUpperCase() as keyof typeof UNIT_STATUS_CONFIG;
  const config = UNIT_STATUS_CONFIG[upperStatus];

  let bgColor = 'bg-gray-100';
  let textColor = 'text-gray-700';
  let borderColor = 'border-gray-200';
  let iconName: keyof typeof Feather.glyphMap = 'help-circle';

  if (upperStatus === 'AVAILABLE') {
    bgColor = 'bg-emerald-100';
    textColor = 'text-emerald-700';
    borderColor = 'border-emerald-200';
    iconName = 'check-circle';
  } else if (upperStatus === 'RESERVED') {
    bgColor = 'bg-amber-100';
    textColor = 'text-amber-700';
    borderColor = 'border-amber-200';
    iconName = 'clock';
  } else if (upperStatus === 'SOLD') {
    bgColor = 'bg-rose-100';
    textColor = 'text-rose-700';
    borderColor = 'border-rose-200';
    iconName = 'lock';
  } else if (upperStatus === 'BLOCKED') {
    bgColor = 'bg-slate-200';
    textColor = 'text-slate-700';
    borderColor = 'border-slate-300';
    iconName = 'slash';
  }

  const label = config?.label || status;

  return (
    <View className={`flex-row items-center gap-1.5 px-3 py-1 rounded-full border ${bgColor} ${borderColor}`}>
      <Feather name={iconName} size={14} className={textColor} />
      <Text className={`text-xs font-bold ${textColor}`}>
        {label}
      </Text>
    </View>
  );
}
