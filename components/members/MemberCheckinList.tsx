import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MemberCheckinItem } from '@/api/memberApi';

interface MemberCheckinListProps {
  checkins: MemberCheckinItem[];
  totalCheckins: number;
}

export const MemberCheckinList: React.FC<MemberCheckinListProps> = ({
  checkins,
  totalCheckins,
}) => {
  // If checkins list is provided or we generate items based on total count
  const renderList = checkins && checkins.length > 0 ? checkins : [];

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
          // Parse date or fallback
          let day = '14';
          let month = 'Nov';
          if (item.date) {
            try {
              const d = new Date(item.date);
              if (!isNaN(d.getTime())) {
                day = d.getDate().toString().padStart(2, '0');
                month = d.toLocaleString('en-US', { month: 'short' });
              }
            } catch {}
          }

          const dayLabel = item.dayLabel || (index === 0 ? 'Today' : index === 1 ? 'Yesterday' : 'Recent');
          const timeLabel = item.time || item.checkinTime || '07:12 AM';

          return (
            <View key={item.id || index} style={styles.checkinCard}>
              {/* Date Box on Left */}
              <View style={styles.dateBox}>
                <Text style={styles.dateDayText}>{day}</Text>
                <Text style={styles.dateMonthText}>{month}</Text>
              </View>

              {/* Check-in Details (No duration or total time) */}
              <View style={styles.detailBox}>
                <Text style={styles.dayLabelText}>{dayLabel}</Text>
                <Text style={styles.timeText}>{timeLabel}</Text>
              </View>
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
