import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MemberCheckinItem } from '@/api/memberApi';

interface MemberCheckinListProps {
  checkins: MemberCheckinItem[];
  totalCheckins: number;
}

interface FormattedCheckinDate {
  day: string;
  month: string;
  time: string;
  dayLabel: string;
}

const formatCheckinDateTime = (
  dateStr?: string,
  fallbackIndex = 0
): FormattedCheckinDate => {
  if (!dateStr) {
    return {
      day: '14',
      month: 'Nov',
      time: '07:12 AM',
      dayLabel: fallbackIndex === 0 ? 'Today' : 'Recent',
    };
  }

  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) {
      return {
        day: '--',
        month: '--',
        time: dateStr,
        dayLabel: 'Recent',
      };
    }

    const day = d.getDate().toString().padStart(2, '0');
    const month = d.toLocaleString('en-US', { month: 'short' });
    const time = d.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const target = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    const diffDays = Math.round(
      (today.getTime() - target.getTime()) / (1000 * 60 * 60 * 24)
    );

    let dayLabel = '';
    if (diffDays === 0) {
      dayLabel = 'Today';
    } else if (diffDays === 1) {
      dayLabel = 'Yesterday';
    } else if (diffDays > 1 && diffDays < 7) {
      dayLabel = d.toLocaleString('en-US', { weekday: 'long' });
    } else {
      dayLabel = d.toLocaleString('en-US', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
      });
    }

    return { day, month, time, dayLabel };
  } catch {
    return {
      day: '--',
      month: '--',
      time: dateStr || '--',
      dayLabel: 'Recent',
    };
  }
};

export const MemberCheckinList: React.FC<MemberCheckinListProps> = ({
  checkins,
  totalCheckins,
}) => {
  const renderList = checkins && checkins.length > 0 ? checkins : [];

  const renderCheckinTypeBadge = (type?: string) => {
    if (!type) return null;

    const normalized = type.toLowerCase().trim();
    const isTrial = normalized === 'trial';
    const isMembership = normalized === 'membership';

    const label = isTrial
      ? 'Trial'
      : isMembership
      ? 'Membership'
      : type.charAt(0).toUpperCase() + type.slice(1);

    return (
      <View
        style={[
          styles.typeBadge,
          isTrial
            ? styles.trialBadge
            : isMembership
            ? styles.membershipBadge
            : styles.defaultTypeBadge,
        ]}>
        <Text
          style={[
            styles.typeBadgeText,
            isTrial
              ? styles.trialBadgeText
              : isMembership
              ? styles.membershipBadgeText
              : styles.defaultTypeBadgeText,
          ]}>
          {label}
        </Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Top Stat Summary Card - ONLY Show Total Checkin/Visits, NO Avg. Duration or Total Time */}
      <View style={styles.statCard}>
        <Text style={styles.statLabel}>Total Check-ins</Text>
        <Text style={styles.statValue}>
          {totalCheckins} {totalCheckins === 1 ? 'Visit' : 'Visits'}
        </Text>
      </View>

      {/* Checkins List Header */}
      <Text style={styles.sectionHeader}>Check-in History</Text>

      {renderList.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>
            No detailed check-in logs recorded yet.
          </Text>
        </View>
      ) : (
        renderList.map((item, index) => {
          const rawDate = item.checkinTime || item.createdAt || item.date;
          const { day, month, time, dayLabel } = formatCheckinDateTime(rawDate, index);
          const finalDayLabel = item.dayLabel || dayLabel;
          const finalTimeLabel = item.time || time;

          return (
            <View key={item.id || index} style={styles.checkinCard}>
              {/* Date Box on Left */}
              <View style={styles.dateBox}>
                <Text style={styles.dateDayText}>{day}</Text>
                <Text style={styles.dateMonthText}>{month}</Text>
              </View>

              {/* Check-in Details: Day label and time (No duration or total time) */}
              <View style={styles.detailBox}>
                <Text style={styles.dayLabelText}>{finalDayLabel}</Text>
                <Text style={styles.timeText}>{finalTimeLabel}</Text>
              </View>

              {/* Checkin Type Badge (Trial / Membership) */}
              {renderCheckinTypeBadge(item.checkinType)}
            </View>
          );
        })
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 24,
  },
  statCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  statLabel: {
    fontSize: 13,
    color: '#64748B',
    fontFamily: 'PlusJakartaSans-Regular',
    marginBottom: 6,
  },
  statValue: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0F172A',
    fontFamily: 'PlusJakartaSans-Bold',
  },
  sectionHeader: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
    fontFamily: 'PlusJakartaSans-Bold',
    marginBottom: 12,
  },
  checkinCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
  },
  dateBox: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#FFF1F2',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  dateDayText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#E23744',
    fontFamily: 'PlusJakartaSans-Bold',
    lineHeight: 18,
  },
  dateMonthText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#E23744',
    fontFamily: 'PlusJakartaSans-SemiBold',
    lineHeight: 13,
  },
  detailBox: {
    flex: 1,
    justifyContent: 'center',
    marginRight: 8,
  },
  dayLabelText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
    fontFamily: 'PlusJakartaSans-Bold',
    marginBottom: 2,
  },
  timeText: {
    fontSize: 12.5,
    color: '#64748B',
    fontFamily: 'PlusJakartaSans-Regular',
  },
  typeBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  typeBadgeText: {
    fontSize: 11.5,
    fontWeight: '700',
    fontFamily: 'PlusJakartaSans-Bold',
  },
  trialBadge: {
    backgroundColor: '#FEF3C7',
    borderColor: '#FDE68A',
  },
  trialBadgeText: {
    color: '#B45309',
    fontSize: 11.5,
    fontWeight: '700',
    fontFamily: 'PlusJakartaSans-Bold',
  },
  membershipBadge: {
    backgroundColor: '#EEF2FF',
    borderColor: '#C7D2FE',
  },
  membershipBadgeText: {
    color: '#4338CA',
    fontSize: 11.5,
    fontWeight: '700',
    fontFamily: 'PlusJakartaSans-Bold',
  },
  defaultTypeBadge: {
    backgroundColor: '#F1F5F9',
    borderColor: '#E2E8F0',
  },
  defaultTypeBadgeText: {
    color: '#475569',
    fontSize: 11.5,
    fontWeight: '600',
    fontFamily: 'PlusJakartaSans-SemiBold',
  },
  emptyContainer: {
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 13,
    color: '#94A3B8',
    fontFamily: 'PlusJakartaSans-Regular',
    textAlign: 'center',
  },
});
