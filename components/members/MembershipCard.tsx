import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MemberMembership } from '@/api/memberApi';
import {
  formatPlanName,
  formatDurationMonths,
  formatMemberDate,
} from '@/hooks/useMembers';

interface MembershipCardProps {
  membership: MemberMembership;
}

export const MembershipCard: React.FC<MembershipCardProps> = ({ membership }) => {
  const isActive =
    membership.membershipStatus?.toLowerCase() === 'active';
  const planDisplay = formatPlanName(membership.plan);
  const durationDisplay = formatDurationMonths(membership.duration);
  const startDateDisplay = formatMemberDate(membership.startDate);
  const endDateDisplay = formatMemberDate(membership.endDate);

  return (
    <View
      style={[
        styles.card,
        isActive ? styles.activeCardBorder : styles.inactiveCardBorder,
      ]}>
      {/* Top Header */}
      <View style={styles.headerRow}>
        <View style={styles.titleWrapper}>
          <Text style={styles.planTitle}>{planDisplay}</Text>
          <Text style={styles.membershipIdText}>{membership.membershipId}</Text>
        </View>

        <View
          style={[
            styles.statusBadge,
            isActive ? styles.activeStatusBadge : styles.expiredStatusBadge,
          ]}>
          <Text
            style={[
              styles.statusBadgeText,
              isActive ? styles.activeStatusText : styles.expiredStatusText,
            ]}>
            {isActive ? 'Active' : 'Expired'}
          </Text>
        </View>
      </View>

      {/* Divider */}
      <View style={styles.divider} />

      {/* 3 Column Grid: Start Date, End Date, Duration */}
      <View style={styles.gridRow}>
        <View style={styles.gridColumn}>
          <Text style={styles.gridLabel}>Start Date</Text>
          <Text style={styles.gridValue}>{startDateDisplay}</Text>
        </View>

        <View style={styles.gridColumn}>
          <Text style={styles.gridLabel}>End Date</Text>
          <Text style={styles.gridValue}>{endDateDisplay}</Text>
        </View>

        <View style={styles.gridColumn}>
          <Text style={styles.gridLabel}>Duration</Text>
          <Text style={styles.gridValue}>{durationDisplay}</Text>
        </View>
      </View>

      {/* Footer: Commission */}
      <View style={styles.footerRow}>
        <Text style={styles.footerLabel}>Commission</Text>
        <Text
          style={[
            styles.footerValue,
            membership.commissionCharged
              ? styles.commissionCharged
              : styles.commissionFree,
          ]}>
          {membership.commissionCharged ? '✓ Charged' : 'Free / Not Charged'}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1.5,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  activeCardBorder: {
    borderColor: '#F87171', // Subtle red outline matching image
  },
  inactiveCardBorder: {
    borderColor: '#E2E8F0',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  titleWrapper: {
    flex: 1,
    marginRight: 8,
  },
  planTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
    fontFamily: 'PlusJakartaSans-Bold',
    marginBottom: 3,
  },
  membershipIdText: {
    fontSize: 12,
    color: '#94A3B8',
    fontFamily: 'PlusJakartaSans-Regular',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 16,
  },
  activeStatusBadge: {
    backgroundColor: '#DCFCE7',
  },
  expiredStatusBadge: {
    backgroundColor: '#FEE2E2',
  },
  statusBadgeText: {
    fontSize: 11.5,
    fontWeight: '600',
    fontFamily: 'PlusJakartaSans-SemiBold',
  },
  activeStatusText: {
    color: '#16A34A',
  },
  expiredStatusText: {
    color: '#EF4444',
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 14,
  },
  gridRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  gridColumn: {
    flex: 1,
  },
  gridLabel: {
    fontSize: 12,
    color: '#64748B',
    fontFamily: 'PlusJakartaSans-Regular',
    marginBottom: 4,
  },
  gridValue: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#0F172A',
    fontFamily: 'PlusJakartaSans-Bold',
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F8FAFC',
  },
  footerLabel: {
    fontSize: 12.5,
    color: '#64748B',
    fontFamily: 'PlusJakartaSans-Regular',
  },
  footerValue: {
    fontSize: 13,
    fontWeight: '600',
    fontFamily: 'PlusJakartaSans-SemiBold',
  },
  commissionCharged: {
    color: '#16A34A',
  },
  commissionFree: {
    color: '#64748B',
  },
});
