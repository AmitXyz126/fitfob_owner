import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { MemberFilterType } from '@/store/useMemberStore';

interface MemberFilterTabsProps {
  activeFilter: MemberFilterType;
  onSelectFilter: (filter: MemberFilterType) => void;
  allCount: number;
  activeCount: number;
  inactiveCount: number;
}

export const MemberFilterTabs: React.FC<MemberFilterTabsProps> = ({
  activeFilter,
  onSelectFilter,
  allCount,
  activeCount,
  inactiveCount,
}) => {
  const tabs: { key: MemberFilterType; label: string; count: number }[] = [
    { key: 'all', label: 'All', count: allCount },
    { key: 'active', label: 'Active', count: activeCount },
    { key: 'inactive', label: 'Inactive', count: inactiveCount },
  ];

  return (
    <View style={styles.container}>
      {tabs.map((tab) => {
        const isSelected = activeFilter === tab.key;
        return (
          <TouchableOpacity
            key={tab.key}
            activeOpacity={0.7}
            onPress={() => onSelectFilter(tab.key)}
            style={[
              styles.tabButton,
              isSelected ? styles.activeTabButton : styles.inactiveTabButton,
            ]}>
            <Text
              style={[
                styles.tabText,
                isSelected ? styles.activeTabText : styles.inactiveTabText,
              ]}>
              {`${tab.label} (${tab.count})`}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: 8,
    marginVertical: 12,
  },
  tabButton: {
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeTabButton: {
    backgroundColor: '#E23744',
    shadowColor: '#E23744',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  inactiveTabButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
    fontFamily: 'PlusJakartaSans-SemiBold',
  },
  activeTabText: {
    color: '#FFFFFF',
  },
  inactiveTabText: {
    color: '#475569',
  },
});
