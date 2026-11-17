import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useTrialSettings } from '@/hooks/useTrialSettings';
import { TrialBanner } from '@/components/trial/TrialBanner';
import { SlotProgressBar } from '@/components/trial/SlotProgressBar';
import { TrialGuestCard } from '@/components/trial/TrialGuestCard';
import { TrialItem } from '@/api/trialApi';

export default function TrialManagerScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const {
    todayTrials,
    tomorrowTrials,
    upcomingTrials,
    isTrialEnabled,
    dailyTrialLimit,
    minLimit,
    freeLeadsCount,
    toggleTrialEnabled,
    incrementLimit,
    decrementLimit,
    isLoading,
    isRefetching,
    isUpdating,
    refetch,
    error,
  } = useTrialSettings();

  const handleScanPress = (item?: TrialItem) => {
    // Navigate to the check-in scanner screen
    router.push('/(tabs)/checkins');
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar style="dark" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => router.back()}
          style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color="#0F172A" />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Trial Manager</Text>

        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => router.push('/notification')}
          style={styles.notificationButton}>
          <Ionicons name="notifications" size={22} color="#E23744" />
        </TouchableOpacity>
      </View>

      {isLoading && !isRefetching ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#E23744" />
          <Text style={styles.loadingText}>Loading trial settings...</Text>
        </View>
      ) : error ? (
        <View style={styles.centerContainer}>
          <Ionicons name="alert-circle-outline" size={48} color="#EF4444" />
          <Text style={styles.errorTitle}>Failed to load trial settings</Text>
          <Text style={styles.errorSubtitle}>
            {error instanceof Error ? error.message : 'Please check your connection'}
          </Text>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => refetch()}
            style={styles.retryButton}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={[
              styles.scrollContent,
              { paddingBottom: insets.bottom + 90 },
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
            {/* 1. Top Red Gradient Banner (Accept free trials & Daily slot counter) */}
            <TrialBanner
              isTrialEnabled={isTrialEnabled}
              dailyTrialLimit={dailyTrialLimit}
              minLimit={minLimit}
              onToggle={toggleTrialEnabled}
              onIncrement={incrementLimit}
              onDecrement={decrementLimit}
              isUpdating={isUpdating}
            />

            {/* 2. Today's Trial Guests Section Card */}
            <View style={styles.sectionCard}>
              <View style={styles.sectionHeaderRow}>
                <Text style={styles.sectionTitle}>Today&apos;s trial guests</Text>
                <Text style={styles.slotCountText}>
                  {`${todayTrials.length} of ${dailyTrialLimit} filled`}
                </Text>
              </View>

              {/* Segmented capsules progress bar */}
              <SlotProgressBar
                totalSlots={dailyTrialLimit}
                filledSlots={todayTrials.length}
              />

              {/* Guest Rows */}
              {todayTrials.length === 0 ? (
                <View style={styles.emptyGuestsRow}>
                  <Text style={styles.emptyGuestsText}>
                    No trial guests booked for today yet.
                  </Text>
                </View>
              ) : (
                todayTrials.map((item, index) => (
                  <TrialGuestCard
                    key={item.id || item.client?.clientId || `today-${index}`}
                    item={item}
                    isToday={true}
                    onScan={handleScanPress}
                  />
                ))
              )}
            </View>

            {/* 3. Tomorrow Section Card */}
            <View style={styles.sectionCard}>
              <View style={styles.sectionHeaderRow}>
                <Text style={styles.sectionTitle}>Tomorrow</Text>
                <Text style={styles.slotCountText}>
                  {`${tomorrowTrials.length} of ${dailyTrialLimit} filled`}
                </Text>
              </View>

              {/* Guest Rows */}
              {tomorrowTrials.length === 0 ? (
                <View style={styles.emptyGuestsRow}>
                  <Text style={styles.emptyGuestsText}>
                    No trial guests booked for tomorrow.
                  </Text>
                </View>
              ) : (
                tomorrowTrials.map((item, index) => (
                  <TrialGuestCard
                    key={item.id || item.client?.clientId || `tomorrow-${index}`}
                    item={item}
                    isToday={false}
                    onScan={handleScanPress}
                  />
                ))
              )}
            </View>

            {/* Optional: Upcoming Trials (Beyond Tomorrow) */}
            {upcomingTrials.length > 0 && (
              <View style={styles.sectionCard}>
                <View style={styles.sectionHeaderRow}>
                  <Text style={styles.sectionTitle}>Upcoming Trials</Text>
                  <Text style={styles.slotCountText}>
                    {`${upcomingTrials.length} booked`}
                  </Text>
                </View>

                {upcomingTrials.map((item, index) => (
                  <TrialGuestCard
                    key={item.id || item.client?.clientId || `upcoming-${index}`}
                    item={item}
                    isToday={false}
                    onScan={handleScanPress}
                  />
                ))}
              </View>
            )}

            {/* 4. Free Leads This Month Card */}
            <View style={styles.leadsCard}>
              <View style={styles.leadsLeft}>
                <View style={styles.leadsIconBox}>
                  <Ionicons name="people" size={20} color="#E23744" />
                </View>
                <Text style={styles.leadsLabel}>Free leads this month</Text>
              </View>
              <Text style={styles.leadsValue}>{freeLeadsCount}</Text>
            </View>

            {/* 5. Info Banner */}
            <View style={styles.infoBanner}>
              <Ionicons
                name="information-circle-outline"
                size={22}
                color="#3B82F6"
              />
              <Text style={styles.infoBannerText}>
                Trial sessions are free (₹0). Passes not scanned by closing time
                are marked expired automatically.
              </Text>
            </View>
          </ScrollView>

          {/* 6. Bottom Fixed "Scan trial pass" Button */}
          <View
            style={[
              styles.bottomBar,
              { paddingBottom: Math.max(insets.bottom, 16) },
            ]}>
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => handleScanPress()}
              style={styles.scanPassButton}>
              <Ionicons
                name="scan-outline"
                size={20}
                color="#FFFFFF"
                style={{ marginRight: 8 }}
              />
              <Text style={styles.scanPassButtonText}>Scan trial pass</Text>
            </TouchableOpacity>
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
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
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 24,
  },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
    fontFamily: 'PlusJakartaSans-Bold',
  },
  slotCountText: {
    fontSize: 13,
    color: '#64748B',
    fontFamily: 'PlusJakartaSans-Medium',
  },
  emptyGuestsRow: {
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyGuestsText: {
    fontSize: 13,
    color: '#94A3B8',
    fontFamily: 'PlusJakartaSans-Regular',
  },
  leadsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginHorizontal: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  leadsLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  leadsIconBox: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  leadsLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
    fontFamily: 'PlusJakartaSans-Bold',
  },
  leadsValue: {
    fontSize: 26,
    fontWeight: '800',
    color: '#E23744',
    fontFamily: 'PlusJakartaSans-Bold',
  },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    borderRadius: 18,
    padding: 14,
    marginHorizontal: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  infoBannerText: {
    flex: 1,
    marginLeft: 10,
    fontSize: 12,
    color: '#475569',
    fontFamily: 'PlusJakartaSans-Regular',
    lineHeight: 17,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 8,
  },
  scanPassButton: {
    backgroundColor: '#E23744',
    height: 52,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#E23744',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  scanPassButtonText: {
    color: '#FFFFFF',
    fontSize: 15.5,
    fontWeight: '700',
    fontFamily: 'PlusJakartaSans-Bold',
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
