import React, { useState } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { MemberListItem } from '@/api/memberApi';
import { formatPlanName } from '@/hooks/useMembers';

interface MemberCardProps {
  member: MemberListItem;
  onPress: () => void;
}

export const MemberCard: React.FC<MemberCardProps> = ({ member, onPress }) => {
  const [imageError, setImageError] = useState(false);
  const isActive = member.status?.toLowerCase() === 'active';
  const planDisplay = formatPlanName(member.plan);

  // Generate initials for avatar fallback
  const initials = member.name
    ? member.name
        .split(' ')
        .map((n) => n[0])
        .filter(Boolean)
        .slice(0, 2)
        .join('')
        .toUpperCase()
    : 'M';

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={onPress}
      style={styles.cardContainer}>
      {/* Avatar Container */}
      <View style={styles.avatarWrapper}>
        {member.selfieUrl && !imageError ? (
          <Image
            source={{ uri: member.selfieUrl }}
            style={styles.avatarImage}
            onError={() => setImageError(true)}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.avatarFallback}>
            <Text style={styles.initialsText}>{initials}</Text>
          </View>
        )}
      </View>

      {/* Member Info: Name and Plan only (No green verify tick, No last visit) */}
      <View style={styles.infoWrapper}>
        <Text style={[styles.nameText, { textTransform: 'capitalize' }]} numberOfLines={1}>
          {member.name || 'Unnamed Member'}
        </Text>
        <Text style={styles.planText} numberOfLines={1}>
          {planDisplay}
        </Text>
      </View>

      {/* Status Badge */}
      <View
        style={[
          styles.statusBadge,
          isActive ? styles.activeBadge : styles.inactiveBadge,
        ]}>
        <Text
          style={[
            styles.statusText,
            isActive ? styles.activeStatusText : styles.inactiveStatusText,
          ]}>
          {isActive ? 'Active' : 'Inactive'}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 1.5,
  },
  avatarWrapper: {
    width: 48,
    height: 48,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#F8FAFC',
    marginRight: 12,
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarFallback: {
    width: '100%',
    height: '100%',
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  initialsText: {
    color: '#E23744',
    fontSize: 16,
    fontWeight: '700',
    fontFamily: 'PlusJakartaSans-Bold',
  },
  infoWrapper: {
    flex: 1,
    justifyContent: 'center',
    marginRight: 8,
  },
  nameText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
    fontFamily: 'PlusJakartaSans-Bold',
    marginBottom: 3,
  },
  planText: {
    fontSize: 12.5,
    color: '#64748B',
    fontFamily: 'PlusJakartaSans-Regular',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeBadge: {
    backgroundColor: '#DCFCE7',
  },
  inactiveBadge: {
    backgroundColor: '#F1F5F9',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    fontFamily: 'PlusJakartaSans-SemiBold',
  },
  activeStatusText: {
    color: '#16A34A',
  },
  inactiveStatusText: {
    color: '#64748B',
  },
});
