import React, { useState } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { TrialGuestItem } from '@/api/trialApi';

interface TrialGuestItemRowProps {
  item: TrialGuestItem;
  tabMode?: 'all' | 'today' | 'tomorrow' | 'by-date';
  onScan?: (item: TrialGuestItem) => void;
  onCall?: (phone: string) => void;
  isLast?: boolean;
}

export const TrialGuestItemRow: React.FC<TrialGuestItemRowProps> = ({
  item,
  tabMode = 'all',
  onScan,
  onCall,
  isLast = false,
}) => {
  const [imageError, setImageError] = useState(false);

  const status = item.trialStatus;
  const isCheckedIn = status === 'completed' || status === 'checked-in';
  const isNoShow = status === 'no-show' || status === 'missed' || status === 'expired';
  const isCancelled = status === 'cancelled';
  const isRescheduled = status === 'rescheduled';

  // Initials generator
  const initials = item.clientName
    ? item.clientName
      .split(' ')
      .map((w) => w[0])
      .filter(Boolean)
      .slice(0, 2)
      .join('')
      .toUpperCase()
    : 'TG';

  // Deterministic avatar color palette
  const getAvatarColors = () => {
    if (isCheckedIn) return { bg: '#DCFCE7', text: '#16A34A' };
    if (isRescheduled) return { bg: '#F3E8FF', text: '#7C3AED' };
    if (isNoShow) return { bg: '#FFEDD5', text: '#EA580C' };
    if (isCancelled) return { bg: '#F1F5F9', text: '#64748B' };
    // Booked palette based on name hash
    const colors = [
      { bg: '#FEE2E2', text: '#E23744' }, // Red/Coral
      { bg: '#E0F2FE', text: '#0284C7' }, // Sky
      { bg: '#FEF3C7', text: '#D97706' }, // Amber
      { bg: '#F5F3FF', text: '#8B5CF6' }, // Violet
    ];
    let hash = 0;
    for (let i = 0; i < (item.clientName || '').length; i++) {
      hash = item.clientName.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  };

  const avatarColors = getAvatarColors();

  // Helper to extract clean time (e.g. "12:31 PM") from ISO timestamps in info strings
  const formatInfoWithTime = (info?: string, fallback: string = ''): string => {
    if (!info || !info.trim()) return fallback;

    if (info.includes('·')) {
      const parts = info.split('·');
      const prefix = parts.slice(0, -1).join('·').trim();
      const timeCandidate = parts[parts.length - 1].trim();

      // If already formatted like "11:20 AM"
      if (/^\d{1,2}:\d{2}\s*(?:AM|PM)$/i.test(timeCandidate)) {
        return `${prefix} · ${timeCandidate}`;
      }

      // Check if it's an ISO timestamp or valid date string
      const d = new Date(timeCandidate);
      if (!isNaN(d.getTime())) {
        const timeStr = d.toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
          hour12: true,
        });
        return `${prefix} · ${timeStr}`;
      }
    } else {
      // If the entire info is an ISO date string
      if (info.includes('T')) {
        const d = new Date(info.trim());
        if (!isNaN(d.getTime())) {
          return d.toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true,
          });
        }
      }
    }

    return info;
  };

  // Format Subtitle
  const getFormattedSubtitle = () => {
    if (isCheckedIn) {
      return formatInfoWithTime(item.info, 'Checked in');
    }

    if (isRescheduled) {
      return formatInfoWithTime(item.info, 'Moved from previous date');
    }

    if (isNoShow) {
      return formatInfoWithTime(item.info, 'Not visited by closing time');
    }

    if (isCancelled) {
      return formatInfoWithTime(item.info, 'Cancelled by guest');
    }

    // Booked / default
    if (item.bookedAtText) {
      const parts = item.bookedAtText.split(' ');
      if (parts.length > 1) {
        const dateCandidate = parts.slice(1).join(' ').trim();
        const d = new Date(dateCandidate);
        if (!isNaN(d.getTime())) {
          const timeStr = d.toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true,
          });
          return `Booked ${timeStr} · Valid today`;
        }
      }
      return formatInfoWithTime(item.bookedAtText, 'Booked · Valid today');
    }

    if (item.clientPhone) {
      return `Booked · ${item.clientPhone}`;
    }

    return 'Booked · Valid today';
  };

  const subtitle = getFormattedSubtitle();

  const handlePhoneCall = () => {
    if (onCall && item.clientPhone) {
      onCall(item.clientPhone);
      return;
    }
    if (item.clientPhone) {
      Linking.openURL(`tel:${item.clientPhone}`).catch(() => { });
    }
  };

  return (
    <View style={[styles.container, isLast && styles.noBorder]}>
      {/* Avatar */}
      <View style={styles.avatarWrapper}>
        {item.clientProfile && !imageError ? (
          <Image
            source={{ uri: item.clientProfile }}
            style={styles.avatarImage}
            onError={() => setImageError(true)}
            resizeMode="cover"
          />
        ) : (
          <View style={[styles.avatarFallback, { backgroundColor: avatarColors.bg }]}>
            <Text style={[styles.initialsText, { color: avatarColors.text }]}>
              {initials}
            </Text>
          </View>
        )}
      </View>

      {/* Info */}
      <View style={styles.infoWrapper}>
        <Text style={styles.nameText} numberOfLines={1}>
          {item.clientName || 'Trial Guest'}
        </Text>
        <Text
          style={[
            styles.subtitleText,
            isCheckedIn && styles.checkedInSubtitle,
            isRescheduled && styles.rescheduledSubtitle,
            isNoShow && styles.noShowSubtitle,
          ]}
          numberOfLines={1}>
          {subtitle}
        </Text>
      </View>

      {/* Right Actions / Badges */}
      {tabMode === 'today' ? (
        <View style={styles.todayActionsRow}>
          {isCheckedIn ? (
            <View style={styles.checkedInBox}>
              <Ionicons name="checkmark" size={18} color="#16A34A" />
            </View>
          ) : isCancelled ? (
            <View style={[styles.pillBadge, styles.badgeCancelled]}>
              <Text style={[styles.pillBadgeText, styles.badgeTextCancelled]}>Cancelled</Text>
            </View>
          ) : (
            // To Arrive: Call + Scan Pass
            <View style={styles.actionButtonGroup}>
              {item.clientPhone ? (
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={handlePhoneCall}
                  style={styles.callButton}>
                  <Ionicons name="call-outline" size={17} color="#334155" />
                </TouchableOpacity>
              ) : null}
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => onScan?.(item)}
                style={styles.scanButton}>
                <Ionicons name="scan-outline" size={18} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          )}
        </View>
      ) : tabMode === 'tomorrow' ? (
        <View style={styles.tomorrowActionsRow}>
          {isCancelled ? (
            <View style={[styles.pillBadge, styles.badgeCancelled]}>
              <Text style={[styles.pillBadgeText, styles.badgeTextCancelled]}>Cancelled</Text>
            </View>
          ) :
            isRescheduled ? (
              <View style={[styles.pillBadge, styles.badgeRescheduled]}>
                <Text style={[styles.pillBadgeText, styles.badgeTextRescheduled]}>Rescheduled</Text>
              </View>
            ) : (
              <View style={[styles.pillBadge, styles.badgeBooked]}>
                <Text style={[styles.pillBadgeText, styles.badgeTextBooked]}>Booked</Text>
              </View>
            )}
          {!isCancelled && item.clientPhone ? (
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={handlePhoneCall}
              style={styles.callButton}>
              <Ionicons name="call-outline" size={17} color="#334155" />
            </TouchableOpacity>
          ) : null}
        </View>
      ) : (
        // Mode 'all' or 'by-date': Show Status Badges
        <View style={styles.allBadgeContainer}>
          {isCheckedIn ? (
            <View style={[styles.pillBadge, styles.badgeCheckedIn]}>
              <Text style={[styles.pillBadgeText, styles.badgeTextCheckedIn]}>Checked in</Text>
            </View>
          ) : isRescheduled ? (
            <View style={[styles.pillBadge, styles.badgeRescheduled]}>
              <Text style={[styles.pillBadgeText, styles.badgeTextRescheduled]}>Rescheduled</Text>
            </View>
          ) : isNoShow ? (
            <View style={[styles.pillBadge, styles.badgeExpired]}>
              <Text style={[styles.pillBadgeText, styles.badgeTextExpired]}>Expired</Text>
            </View>
          ) : isCancelled ? (
            <View style={[styles.pillBadge, styles.badgeCancelled]}>
              <Text style={[styles.pillBadgeText, styles.badgeTextCancelled]}>Cancelled</Text>
            </View>
          ) : (
            <View style={[styles.pillBadge, styles.badgeBooked]}>
              <Text style={[styles.pillBadgeText, styles.badgeTextBooked]}>Booked</Text>
            </View>
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  noBorder: {
    borderBottomWidth: 0,
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
  initialsText: {
    fontSize: 14,
    fontWeight: '800',
    fontFamily: 'PlusJakartaSans-Bold',
  },
  infoWrapper: {
    flex: 1,
    justifyContent: 'center',
    marginRight: 8,
  },
  nameText: {
    fontSize: 14.5,
    fontWeight: '700',
    fontFamily: 'PlusJakartaSans-Bold',
    color: '#0F172A',
    marginBottom: 2,
    textTransform: 'capitalize',
  },
  subtitleText: {
    fontSize: 12,
    fontWeight: '500',
    fontFamily: 'PlusJakartaSans-Medium',
    color: '#64748B',
  },
  checkedInSubtitle: {
    color: '#16A34A',
    fontWeight: '600',
  },
  rescheduledSubtitle: {
    color: '#7C3AED',
    fontWeight: '500',
  },
  noShowSubtitle: {
    color: '#94A3B8',
  },
  allBadgeContainer: {
    alignItems: 'flex-end',
  },
  pillBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4.5,
    borderRadius: 12,
  },
  pillBadgeText: {
    fontSize: 11.5,
    fontWeight: '700',
    fontFamily: 'PlusJakartaSans-Bold',
  },
  badgeCheckedIn: {
    backgroundColor: '#DCFCE7',
  },
  badgeTextCheckedIn: {
    color: '#16A34A',
  },
  badgeBooked: {
    backgroundColor: '#DBEAFE',
  },
  badgeTextBooked: {
    color: '#2563EB',
  },
  badgeRescheduled: {
    backgroundColor: '#F3E8FF',
  },
  badgeTextRescheduled: {
    color: '#7C3AED',
  },
  badgeExpired: {
    backgroundColor: '#FFEDD5',
  },
  badgeTextExpired: {
    color: '#EA580C',
  },
  badgeCancelled: {
    backgroundColor: '#F1F5F9',
  },
  badgeTextCancelled: {
    color: '#64748B',
  },
  todayActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tomorrowActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionButtonGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  callButton: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  scanButton: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#E23744',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkedInBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
