import React, { useState } from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { MemberClientInfo, MemberMembership } from '@/api/memberApi';
import { MemberGenderIcon } from './MemberGenderIcon';
import { formatPlanName } from '@/hooks/useMembers';

interface MemberProfileHeaderProps {
  client?: MemberClientInfo;
  activeMembership?: MemberMembership;
}

export const MemberProfileHeader: React.FC<MemberProfileHeaderProps> = ({
  client,
  activeMembership,
}) => {
  const [imageError, setImageError] = useState(false);

  const isActive =
    activeMembership?.membershipStatus?.toLowerCase() === 'active';
  const planDisplay = formatPlanName(activeMembership?.plan || 'twelve_months');

  // Fallback initials
  const initials = client?.name
    ? client.name
        .split(' ')
        .map((n) => n[0])
        .filter(Boolean)
        .slice(0, 2)
        .join('')
        .toUpperCase()
    : 'M';

  return (
    <View style={styles.card}>
      <View style={styles.topRow}>
        {/* Avatar */}
        <View style={styles.avatarWrapper}>
          {client?.selfieUrl && !imageError ? (
            <Image
              source={{ uri: client.selfieUrl }}
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

        {/* Info */}
        <View style={styles.infoWrapper}>
          <View style={styles.nameRow}>
            <Text style={styles.nameText} numberOfLines={1}>
              {client?.name || 'Member Details'}
            </Text>
            {/* Gender icon instead of text */}
            {client?.gender && (
              <View style={styles.genderIconContainer}>
                <MemberGenderIcon gender={client.gender} size={13} />
              </View>
            )}
          </View>

          <Text style={styles.subText} numberOfLines={1}>
            {`ID: ${client?.clientId || '--'}`}
            {client?.phoneNumber ? ` · ${client.phoneNumber}` : ''}
          </Text>

          {/* Badges row */}
          <View style={styles.badgesRow}>
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
                {isActive ? 'Active' : 'Expired'}
              </Text>
            </View>

            <View style={styles.planBadge}>
              <Text style={styles.planBadgeText}>{planDisplay}</Text>
            </View>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 12,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarWrapper: {
    width: 64,
    height: 64,
    borderRadius: 32,
    overflow: 'hidden',
    backgroundColor: '#F8FAFC',
    marginRight: 14,
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
    fontSize: 20,
    fontWeight: '700',
    fontFamily: 'PlusJakartaSans-Bold',
  },
  infoWrapper: {
    flex: 1,
    justifyContent: 'center',
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  nameText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
    fontFamily: 'PlusJakartaSans-Bold',
    marginRight: 6,
  },
  genderIconContainer: {
    marginLeft: 2,
  },
  subText: {
    fontSize: 12.5,
    color: '#64748B',
    fontFamily: 'PlusJakartaSans-Medium',
    marginBottom: 8,
  },
  badgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 3.5,
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
    fontSize: 11.5,
    fontWeight: '600',
    fontFamily: 'PlusJakartaSans-SemiBold',
  },
  activeStatusText: {
    color: '#16A34A',
  },
  inactiveStatusText: {
    color: '#64748B',
  },
  planBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 10,
    paddingVertical: 3.5,
    borderRadius: 20,
  },
  planBadgeText: {
    color: '#92400E',
    fontSize: 11.5,
    fontWeight: '600',
    fontFamily: 'PlusJakartaSans-SemiBold',
  },
});
