import React, { useState } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { TrialItem } from '@/api/trialApi';

interface TrialGuestCardProps {
  item: TrialItem;
  isToday?: boolean;
  onScan?: (item: TrialItem) => void;
}

export const TrialGuestCard: React.FC<TrialGuestCardProps> = ({
  item,
  isToday = true,
  onScan,
}) => {
  const [imageError, setImageError] = useState(false);

  const rawStatus = (item.trialstatus || item.trialStatus || 'booked').toLowerCase();
  const isCompleted = rawStatus === 'completed' || rawStatus === 'checked-in';

  // Get initials
  const initials = item.client?.name
    ? item.client.name
        .split(' ')
        .map((w) => w[0])
        .filter(Boolean)
        .slice(0, 2)
        .join('')
        .toUpperCase()
    : 'TG';

  // Format subtitle
  let subtitle = 'Booked · valid today only';
  if (isCompleted) {
    const timeStr = item.checkinTime ? ` - ${item.checkinTime}` : '';
    subtitle = `Checked In${timeStr}`;
  } else if (!isToday && item.trialDate) {
    try {
      const d = new Date(item.trialDate);
      if (!isNaN(d.getTime())) {
        const weekday = d.toLocaleString('en-US', { weekday: 'short' });
        const day = d.getDate();
        const month = d.toLocaleString('en-US', { month: 'short' });
        subtitle = `Booked for ${weekday}, ${day} ${month}`;
      }
    } catch {}
  }

  return (
    <View style={styles.cardContainer}>
      {/* Avatar */}
      <View style={styles.avatarWrapper}>
        {item.client?.selfieUrl && !imageError ? (
          <Image
            source={{ uri: item.client.selfieUrl }}
            style={styles.avatarImage}
            onError={() => setImageError(true)}
            resizeMode="cover"
          />
        ) : (
          <View
            style={[
              styles.avatarFallback,
              isCompleted
                ? styles.completedFallback
                : isToday
                ? styles.todayFallback
                : styles.futureFallback,
            ]}>
            <Text
              style={[
                styles.initialsText,
                isCompleted
                  ? styles.completedInitialsText
                  : isToday
                  ? styles.todayInitialsText
                  : styles.futureInitialsText,
              ]}>
              {initials}
            </Text>
          </View>
        )}
      </View>

      {/* Info */}
      <View style={styles.infoWrapper}>
        <Text style={styles.nameText} numberOfLines={1}>
          {item.client?.name || 'Trial Guest'}
        </Text>
        <Text
          style={[
            styles.subtitleText,
            isCompleted && styles.completedSubtitleText,
          ]}
          numberOfLines={1}>
          {subtitle}
        </Text>
      </View>

      {/* Right Action */}
      {isCompleted ? (
        <View style={styles.completedBadge}>
          <Ionicons name="checkmark" size={20} color="#16A34A" />
        </View>
      ) : (
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => onScan?.(item)}
          style={styles.scanButton}>
          <Ionicons name="scan-outline" size={20} color="#FFFFFF" />
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F8FAFC',
  },
  avatarWrapper: {
    width: 44,
    height: 44,
    borderRadius: 22,
    overflow: 'hidden',
    backgroundColor: '#F1F5F9',
    marginRight: 12,
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarFallback: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  todayFallback: {
    backgroundColor: '#FEE2E2',
  },
  completedFallback: {
    backgroundColor: '#DCFCE7',
  },
  futureFallback: {
    backgroundColor: '#F1F5F9',
  },
  initialsText: {
    fontSize: 14,
    fontWeight: '700',
    fontFamily: 'PlusJakartaSans-Bold',
  },
  todayInitialsText: {
    color: '#E23744',
  },
  completedInitialsText: {
    color: '#16A34A',
  },
  futureInitialsText: {
    color: '#64748B',
  },
  infoWrapper: {
    flex: 1,
    justifyContent: 'center',
    marginRight: 12,
  },
  nameText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
    fontFamily: 'PlusJakartaSans-Bold',
    marginBottom: 3,
  },
  subtitleText: {
    fontSize: 12.5,
    color: '#64748B',
    fontFamily: 'PlusJakartaSans-Regular',
  },
  completedSubtitleText: {
    color: '#16A34A',
    fontWeight: '600',
    fontFamily: 'PlusJakartaSans-SemiBold',
  },
  scanButton: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: '#E23744',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#E23744',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  completedBadge: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
