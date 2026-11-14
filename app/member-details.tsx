import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useMemberDetails } from '@/hooks/useMembers';
import { MemberProfileHeader } from '@/components/members/MemberProfileHeader';
import { MembershipCard } from '@/components/members/MembershipCard';
import { MemberCheckinList } from '@/components/members/MemberCheckinList';

type DetailsTabType = 'member-details' | 'checkins';

export default function MemberDetailsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { docId } = useLocalSearchParams<{ docId: string }>();

  const {
    details,
    client,
    memberships,
    activeMembership,
    totalCheckinCount,
    hasCheckins,
    checkins,
    isLoading,
    isRefetching,
    refetch,
    error,
  } = useMemberDetails(docId);

  // Active tab state: 'member-details' or 'checkins'
  const [selectedTab, setSelectedTab] = useState<DetailsTabType>('member-details');

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar style="dark" />

      {/* Top Header */}
      <View style={styles.header}>
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => router.back()}
          style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color="#0F172A" />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Member Details</Text>

        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => router.push('/notification')}
          style={styles.notificationButton}>
          <Ionicons name="notifications" size={22} color="#E23744" />
          <View style={styles.notificationDot} />
        </TouchableOpacity>
      </View>

      {isLoading && !isRefetching ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#E23744" />
          <Text style={styles.loadingText}>Loading member details...</Text>
        </View>
      ) : error ? (
        <View style={styles.centerContainer}>
          <Ionicons name="alert-circle-outline" size={48} color="#EF4444" />
          <Text style={styles.errorTitle}>Failed to load member</Text>
          <Text style={styles.errorSubtitle}>
            {error instanceof Error ? error.message : 'Something went wrong.'}
          </Text>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => refetch()}
            style={styles.retryButton}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: insets.bottom + 24 },
          ]}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={() => {
                refetch();
              }}
              colors={['#E23744']}
              tintColor="#E23744"
            />
          }>
          {/* Member Profile Header Card (Shows Gender Icon, Name, ID, Phone, Badges) */}
          <MemberProfileHeader
            client={client}
            activeMembership={activeMembership}
          />

          {/* Tab Switcher - Only shown when Total Checkin Count > 0 */}
          {hasCheckins && (
            <View style={styles.tabSwitcherContainer}>
              {/* Tab 1: "Member Details" (Replaced "User Details" text) */}
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => setSelectedTab('member-details')}
                style={[
                  styles.tabButton,
                  selectedTab === 'member-details' && styles.activeTabButton,
                ]}>
                <Text
                  style={[
                    styles.tabButtonText,
                    selectedTab === 'member-details' && styles.activeTabText,
                  ]}>
                  Member Details
                </Text>
              </TouchableOpacity>

              {/* Tab 2: "Recent Check-ins" (Checkin Tab) */}
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => setSelectedTab('checkins')}
                style={[
                  styles.tabButton,
                  selectedTab === 'checkins' && styles.activeTabButton,
                ]}>
                <Text
                  style={[
                    styles.tabButtonText,
                    selectedTab === 'checkins' && styles.activeTabText,
                  ]}>
                  Recent Check-ins
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {/* TAB 1 CONTENT: MEMBER DETAILS */}
          {(!hasCheckins || selectedTab === 'member-details') && (
            <View style={styles.contentSection}>
              {/* Show Total Checkin count highlight when greater than 0 */}
              {totalCheckinCount > 0 && (
                <View style={styles.totalCheckinCard}>
                  <View style={styles.totalCheckinLeft}>
                    <View style={styles.checkinIconCircle}>
                      <Ionicons name="footsteps-sharp" size={18} color="#E23744" />
                    </View>
                    <View>
                      <Text style={styles.totalCheckinLabel}>Total Check-ins</Text>
                      <Text style={styles.totalCheckinSub}>Total verified visits to gym</Text>
                    </View>
                  </View>
                  <Text style={styles.totalCheckinValue}>{totalCheckinCount}</Text>
                </View>
              )}

              {/* Note: Personal Info section is omitted per user instruction */}

              {/* Memberships Section */}
              <View style={styles.membershipsSection}>
                <Text style={styles.sectionHeaderTitle}>
                  Memberships ({memberships.length})
                </Text>

                {memberships.length === 0 ? (
                  <View style={styles.emptyMembershipsCard}>
                    <Text style={styles.emptyMembershipsText}>
                      No membership records found for this member.
                    </Text>
                  </View>
                ) : (
                  memberships.map((membership, idx) => (
                    <MembershipCard
                      key={membership.membershipId || `membership-${idx}`}
                      membership={membership}
                    />
                  ))
                )}
              </View>
            </View>
          )}

          {/* TAB 2 CONTENT: RECENT CHECK-INS */}
          {hasCheckins && selectedTab === 'checkins' && (
            <MemberCheckinList
              checkins={checkins}
              totalCheckins={totalCheckinCount}
            />
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
    fontFamily: 'PlusJakartaSans-Bold',
  },
  notificationButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  notificationDot: {
    position: 'absolute',
    top: 9,
    right: 9,
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#E23744',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 24,
  },
  tabSwitcherContainer: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: 30,
    padding: 4,
    marginHorizontal: 16,
    marginBottom: 16,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 26,
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
  tabButtonText: {
    fontSize: 13.5,
    fontWeight: '600',
    color: '#64748B',
    fontFamily: 'PlusJakartaSans-SemiBold',
  },
  activeTabText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontFamily: 'PlusJakartaSans-Bold',
  },
  contentSection: {
    paddingHorizontal: 16,
  },
  totalCheckinCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  totalCheckinLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  checkinIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFF1F2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  totalCheckinLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
    fontFamily: 'PlusJakartaSans-Bold',
  },
  totalCheckinSub: {
    fontSize: 12,
    color: '#64748B',
    fontFamily: 'PlusJakartaSans-Regular',
  },
  totalCheckinValue: {
    fontSize: 22,
    fontWeight: '800',
    color: '#E23744',
    fontFamily: 'PlusJakartaSans-Bold',
  },
  membershipsSection: {
    marginTop: 4,
  },
  sectionHeaderTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0F172A',
    fontFamily: 'PlusJakartaSans-Bold',
    marginBottom: 12,
  },
  emptyMembershipsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyMembershipsText: {
    fontSize: 13,
    color: '#94A3B8',
    fontFamily: 'PlusJakartaSans-Regular',
    textAlign: 'center',
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#64748B',
    fontFamily: 'PlusJakartaSans-Medium',
  },
  errorTitle: {
    marginTop: 12,
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
    fontFamily: 'PlusJakartaSans-Bold',
  },
  errorSubtitle: {
    marginTop: 4,
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    fontFamily: 'PlusJakartaSans-Regular',
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: '#E23744',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
    fontFamily: 'PlusJakartaSans-Bold',
  },
});
