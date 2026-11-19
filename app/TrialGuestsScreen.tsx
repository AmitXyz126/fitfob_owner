import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  TextInput,
  StyleSheet,
  Share,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import { keepPreviousData } from '@tanstack/react-query';

import { useTrialGuests } from '@/hooks/useTrialGuests';
import { useClubOwnerMe } from '@/hooks/useUserDetail';
import { TrialGuestsSummaryCard } from '@/components/trial/TrialGuestsSummaryCard';
import { TrialGuestsCapacityCard } from '@/components/trial/TrialGuestsCapacityCard';
import { TrialGuestItemRow } from '@/components/trial/TrialGuestItemRow';
import { TrialWeekCalendarStrip } from '@/components/trial/TrialWeekCalendarStrip';
import { TrialDatePickerModal } from '@/components/trial/TrialDatePickerModal';

type TabType = 'all' | 'today' | 'tomorrow' | 'by-date';

export const getTodayDateString = (): string => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const getTomorrowDateString = (): string => {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export default function TrialGuestsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const { data: ownerData } = useClubOwnerMe();

  const [activeTab, setActiveTab] = useState<TabType>('all');
  const [selectedDate, setSelectedDate] = useState<string>(() => getTodayDateString());
  const [datePickerVisible, setDatePickerVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  // TanStack Query for trial guests
  const {
    data,
    club,
    tabCounts,
    summary,
    allTrials,
    tomorrowTrials,
    groupedByDate,
    groups,
    isLoading,
    isRefetching,
    isPlaceholderData,
    refetch,
    error,
  } = useTrialGuests({
    filter: activeTab,
    date: selectedDate,
    search: searchQuery,
    placeholderData: keepPreviousData,
  });

  // Gym Name & Subtitle
  const gymTitle = 'Trial guests';
  const gymSubtitle = useMemo(() => {
    const rawClub = ownerData?.club_name || ownerData?.clubName || 'Hit Fit Gym';
    const rawLoc = ownerData?.address || ownerData?.city || 'Sector 22, Mohali';
    return `${rawClub} · ${rawLoc}`;
  }, [ownerData]);

  // Dates with guests across the entire dataset for dot indicators
  const datesWithGuests = useMemo(() => {
    const datesSet = new Set<string>();
    if (data?.groupedByDate) {
      data.groupedByDate.forEach((g) => {
        if (g.date && g.trials && g.trials.length > 0) {
          datesSet.add(g.date);
        }
      });
    }
    if (data?.trials) {
      data.trials.forEach((t) => {
        if (t.trialDate) {
          datesSet.add(t.trialDate.split('T')[0]);
        }
      });
    }
    return Array.from(datesSet);
  }, [data]);

  // Handlers
  const handleScanPass = () => {
    router.push('/(tabs)/checkins');
  };

  const handleEditSlots = () => {
    router.push('/TrialManagerScreen');
  };

  const handleTabPress = (tab: TabType) => {
    if (tab === 'by-date') {
      setActiveTab('by-date');
      setDatePickerVisible(true);
    } else {
      setActiveTab(tab);
    }
  };

  // Format today's date for Today tab header e.g. "Wed, 18 Nov"
  const formattedTodayDate = useMemo(() => {
    try {
      const d = new Date();
      const weekday = d.toLocaleDateString('en-US', { weekday: 'short' });
      const day = d.getDate();
      const month = d.toLocaleDateString('en-US', { month: 'short' });
      return `${weekday}, ${day} ${month}`;
    } catch {
      return 'Today';
    }
  }, []);

  // Format tomorrow's date for Tomorrow tab header e.g. "Thu, 19 Nov"
  const formattedTomorrowDate = useMemo(() => {
    try {
      const d = new Date();
      d.setDate(d.getDate() + 1);
      const weekday = d.toLocaleDateString('en-US', { weekday: 'short' });
      const day = d.getDate();
      const month = d.toLocaleDateString('en-US', { month: 'short' });
      return `${weekday}, ${day} ${month}`;
    } catch {
      return 'Tomorrow';
    }
  }, []);

  // Format active selected date label for tab pill e.g. "Tue, 17 Nov"
  const formattedPillDate = useMemo(() => {
    try {
      const cleanDate = (selectedDate || '').split('T')[0];
      const parts = cleanDate.split('-');
      if (parts.length === 3) {
        const d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
        const weekday = d.toLocaleDateString('en-US', { weekday: 'short' });
        const day = d.getDate();
        const month = d.toLocaleDateString('en-US', { month: 'short' });
        return `${weekday}, ${day} ${month}`;
      }
      const d = new Date(selectedDate);
      if (!isNaN(d.getTime())) {
        const weekday = d.toLocaleDateString('en-US', { weekday: 'short' });
        const day = d.getDate();
        const month = d.toLocaleDateString('en-US', { month: 'short' });
        return `${weekday}, ${day} ${month}`;
      }
    } catch { }
    return selectedDate;
  }, [selectedDate]);

  // Selected date trials list for "By date" tab
  const selectedDateTrials = useMemo(() => {
    return allTrials.filter((t) => (t.trialDate || '').split('T')[0] === selectedDate);
  }, [allTrials, selectedDate]);

  // Export list function for "By date"
  const handleExportList = async () => {
    if (selectedDateTrials.length === 0) {
      Toast.show({
        type: 'info',
        text1: 'No guests to export',
        text2: 'There are no trial guests on this date.',
      });
      return;
    }

    const lines = [
      `FitFob Trial Guests - ${formattedPillDate}`,
      `Total: ${selectedDateTrials.length}`,
      '----------------------------------------',
      ...selectedDateTrials.map((t, idx) => {
        const status = t.trialStatus || 'booked';
        const phone = t.clientPhone || 'No Phone';
        return `${idx + 1}. ${t.clientName} (${t.clientId}) | ${status.toUpperCase()} | Phone: ${phone}`;
      }),
    ];
    const textContent = lines.join('\n');

    try {
      await Share.share({
        title: `Trial Guests - ${formattedPillDate}`,
        message: textContent,
      });
    } catch (err: any) {
      Toast.show({
        type: 'error',
        text1: 'Could not share list',
        text2: err?.message || 'Share dialog failed to open.',
      });
    }
  };

  // Metric configurations for Tab 'all'
  const allSummaryMetrics = useMemo(() => {
    return [
      { label: 'Total', value: summary.total || allTrials.length, color: '#0F172A' },
      { label: 'Checked in', value: summary.checkedIn, color: '#10B981' },
      { label: 'Upcoming', value: summary.upcoming, color: '#2563EB' },
      { label: 'Missed', value: summary.missed, color: '#EA580C' },
    ];
  }, [summary, allTrials.length]);

  // Metric configurations for Tab 'by-date'
  const dateSummaryMetrics = useMemo(() => {
    const completed = selectedDateTrials.filter(
      (t) => t.trialStatus === 'completed' || t.trialStatus === 'checked-in'
    ).length;
    const expired = selectedDateTrials.filter(
      (t) => t.trialStatus === 'no-show' || t.trialStatus === 'missed' || t.trialStatus === 'expired'
    ).length;
    const cancelled = selectedDateTrials.filter((t) => t.trialStatus === 'cancelled').length;

    return [
      { label: 'Guests', value: selectedDateTrials.length, color: '#0F172A' },
      { label: 'Checked in', value: completed, color: '#10B981' },
      { label: 'Expired', value: expired, color: '#EA580C' },
      { label: 'Cancelled', value: cancelled, color: '#64748B' },
    ];
  }, [selectedDateTrials]);

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

        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>{gymTitle}</Text>
          <Text style={styles.headerSubtitle} numberOfLines={1}>
            {gymSubtitle}
          </Text>
        </View>

        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => setIsSearchOpen((prev) => !prev)}
          style={[styles.searchButton, isSearchOpen && styles.searchButtonActive]}>
          <Ionicons
            name={isSearchOpen ? 'close' : 'search-outline'}
            size={20}
            color={isSearchOpen ? '#E23744' : '#0F172A'}
          />
        </TouchableOpacity>
      </View>

      {/* Search Input Bar */}
      {isSearchOpen && (
        <View style={styles.searchBarWrapper}>
          <Ionicons name="search" size={18} color="#94A3B8" style={{ marginRight: 8 }} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by guest name, phone or ID..."
            placeholderTextColor="#94A3B8"
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoFocus
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={18} color="#94A3B8" />
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Filter Tabs / Pills Row */}
      <View style={styles.tabsContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabsScrollContent}>
          {/* Tab 1: All */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => handleTabPress('all')}
            style={[styles.tabPill, activeTab === 'all' && styles.tabPillActive]}>
            <Text
              style={[styles.tabPillText, activeTab === 'all' && styles.tabPillTextActive]}>
              All
            </Text>
            <View
              style={[
                styles.tabBadge,
                activeTab === 'all' ? styles.tabBadgeActive : styles.tabBadgeInactive,
              ]}>
              <Text
                style={[
                  styles.tabBadgeText,
                  activeTab === 'all' ? styles.tabBadgeTextActive : styles.tabBadgeTextInactive,
                ]}>
                {tabCounts.all}
              </Text>
            </View>
          </TouchableOpacity>

          {/* Tab 2: Today */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => handleTabPress('today')}
            style={[styles.tabPill, activeTab === 'today' && styles.tabPillActive]}>
            <Text
              style={[styles.tabPillText, activeTab === 'today' && styles.tabPillTextActive]}>
              Today
            </Text>
            <View
              style={[
                styles.tabBadge,
                activeTab === 'today' ? styles.tabBadgeActive : styles.tabBadgeInactive,
              ]}>
              <Text
                style={[
                  styles.tabBadgeText,
                  activeTab === 'today' ? styles.tabBadgeTextActive : styles.tabBadgeTextInactive,
                ]}>
                {tabCounts.today}
              </Text>
            </View>
          </TouchableOpacity>

          {/* Tab 3: Tomorrow */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => handleTabPress('tomorrow')}
            style={[styles.tabPill, activeTab === 'tomorrow' && styles.tabPillActive]}>
            <Text
              style={[styles.tabPillText, activeTab === 'tomorrow' && styles.tabPillTextActive]}>
              Tomorrow
            </Text>
            <View
              style={[
                styles.tabBadge,
                activeTab === 'tomorrow' ? styles.tabBadgeActive : styles.tabBadgeInactive,
              ]}>
              <Text
                style={[
                  styles.tabBadgeText,
                  activeTab === 'tomorrow' ? styles.tabBadgeTextActive : styles.tabBadgeTextInactive,
                ]}>
                {tabCounts.tomorrow}
              </Text>
            </View>
          </TouchableOpacity>

          {/* Tab 4: By date */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => handleTabPress('by-date')}
            style={[styles.tabPill, activeTab === 'by-date' && styles.tabPillActive]}>
            <Ionicons
              name="calendar-outline"
              size={15}
              color={activeTab === 'by-date' ? '#FFFFFF' : '#334155'}
              style={{ marginRight: 6 }}
            />
            <Text
              style={[styles.tabPillText, activeTab === 'by-date' && styles.tabPillTextActive]}>
              {activeTab === 'by-date' ? formattedPillDate : 'By date'}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* Main Content Area */}
      {isLoading && !isRefetching && !isPlaceholderData ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#E23744" />
          <Text style={styles.loadingText}>Loading trial guests...</Text>
        </View>
      ) : error ? (
        <View style={styles.centerContainer}>
          <Ionicons name="alert-circle-outline" size={48} color="#EF4444" />
          <Text style={styles.errorTitle}>Failed to load trial guests</Text>
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
          {/* TAB 1: ALL */}
          {activeTab === 'all' && (
            <>
              {/* Summary 4-Column Card */}
              <TrialGuestsSummaryCard metrics={allSummaryMetrics} />

              {/* Grouped Date Sections */}
              {groupedByDate.length === 0 ? (
                <View style={styles.emptyStateCard}>
                  <Ionicons name="people-outline" size={44} color="#CBD5E1" />
                  <Text style={styles.emptyStateTitle}>No trial guests found</Text>
                  <Text style={styles.emptyStateSubtitle}>
                    When customers book a free trial, they will appear here.
                  </Text>
                </View>
              ) : (
                groupedByDate.map((group, idx) => (
                  <View key={`group-${group.date}-${idx + 1}`} style={styles.dateGroupContainer}>
                    {/* Header Row: Date & Capacity */}
                    <View style={styles.groupHeaderRow}>
                      <Text style={styles.groupHeaderTitle}>{group.headerTitle}</Text>
                      <Text style={styles.groupCapacityText}>{group.capacityText}</Text>
                    </View>

                    {/* Guest Cards Card */}
                    <View style={styles.guestsCardBox}>
                      {group.trials.map((item, idx) => (
                        <TrialGuestItemRow
                          key={`trial-${group.date}-${idx}-${item.clientId}`}
                          item={item}
                          tabMode="all"
                          onScan={handleScanPass}
                          isLast={idx === group.trials.length - 1}
                        />
                      ))}
                    </View>
                  </View>
                ))
              )}
            </>
          )}

          {/* TAB 2: TODAY */}
          {activeTab === 'today' && (
            <>
              {/* Top Capacity Progress Card */}
              <TrialGuestsCapacityCard
                title={`Today · ${formattedTodayDate}`}
                capacityText={club?.todayCapacityText || '0 of 4 filled'}
                totalSlots={club ? (club.todayFilled + club.todaySlotsLeft || 4) : 4}
                filledSlots={club?.todayFilled || 0}
                subtext={`${club?.todaySlotsLeft ?? 4} slots left · Passes valid until 10:00 PM`}
              />

              {/* Group: TO ARRIVE */}
              <View style={styles.sectionHeaderRow}>
                <Text style={styles.sectionHeaderText}>TO ARRIVE</Text>
                <Text style={styles.sectionCountText}>{groups.toArrive.length}</Text>
              </View>
              {groups.toArrive.length > 0 ? (
                <View style={styles.guestsCardBox}>
                  {groups.toArrive.map((item, idx) => (
                    <TrialGuestItemRow
                      key={`arrive-${idx}-${item.clientId}`}
                      item={item}
                      tabMode="today"
                      onScan={handleScanPass}
                      isLast={idx === groups.toArrive.length - 1}
                    />
                  ))}
                </View>
              ) : (
                <View style={styles.miniEmptyCard}>
                  <Text style={styles.miniEmptyText}>No pending guests to arrive today</Text>
                </View>
              )}

              {/* Group: CHECKED IN */}
              <View style={[styles.sectionHeaderRow, { marginTop: 18 }]}>
                <Text style={styles.sectionHeaderText}>CHECKED IN</Text>
                <Text style={styles.sectionCountText}>{groups.checkedIn.length}</Text>
              </View>
              {groups.checkedIn.length > 0 ? (
                <View style={styles.guestsCardBox}>
                  {groups.checkedIn.map((item, idx) => (
                    <TrialGuestItemRow
                      key={`in-${idx}-${item.clientId}`}
                      item={item}
                      tabMode="today"
                      onScan={handleScanPass}
                      isLast={idx === groups.checkedIn.length - 1}
                    />
                  ))}
                </View>
              ) : (
                <View style={styles.miniEmptyCard}>
                  <Text style={styles.miniEmptyText}>No checked-in guests yet today</Text>
                </View>
              )}

              {/* Group: CANCELLED (if any) */}
              {groups.cancelled.length > 0 && (
                <>
                  <View style={[styles.sectionHeaderRow, { marginTop: 18 }]}>
                    <Text style={styles.sectionHeaderText}>CANCELLED</Text>
                    <Text style={styles.sectionCountText}>{groups.cancelled.length}</Text>
                  </View>
                  <View style={styles.guestsCardBox}>
                    {groups.cancelled.map((item, idx) => (
                      <TrialGuestItemRow
                        key={`cancel-${idx}-${item.clientId}`}
                        item={item}
                        tabMode="today"
                        isLast={idx === groups.cancelled.length - 1}
                      />
                    ))}
                  </View>
                </>
              )}

              {/* Blue Info Notice Card */}
              <View style={styles.infoNoticeCard}>
                <Ionicons
                  name="information-circle-outline"
                  size={20}
                  color="#2563EB"
                  style={{ marginRight: 10, marginTop: 1 }}
                />
                <Text style={styles.infoNoticeText}>
                  When a guest cancels or reschedules, their slot opens for new bookings automatically.
                </Text>
              </View>
            </>
          )}

          {/* TAB 3: TOMORROW */}
          {activeTab === 'tomorrow' && (
            <>
              {/* Top Capacity Progress Card */}
              <TrialGuestsCapacityCard
                title={`Tomorrow · ${formattedTomorrowDate}`}
                capacityText={club?.tomorrowCapacityText || '0 of 4 filled'}
                totalSlots={club ? (club.tomorrowFilled + club.tomorrowSlotsOpen || 4) : 4}
                filledSlots={club?.tomorrowFilled || 0}
                subtext={`${club?.tomorrowSlotsOpen ?? 4} slots open for bookings`}
              />

              {/* Section Header: BOOKED */}
              <View style={styles.sectionHeaderRow}>
                <Text style={styles.sectionHeaderText}>BOOKED</Text>
                <Text style={styles.sectionCountText}>{tomorrowTrials.length}</Text>
              </View>

              {tomorrowTrials.length > 0 ? (
                <View style={styles.guestsCardBox}>
                  {tomorrowTrials.map((item, idx) => (
                    <TrialGuestItemRow
                      key={`tmr-${idx}-${item.clientId}`}
                      item={item}
                      tabMode="tomorrow"
                      onScan={handleScanPass}
                      isLast={idx === tomorrowTrials.length - 1}
                    />
                  ))}
                </View>
              ) : (
                <View style={styles.emptyStateCard}>
                  <Ionicons name="calendar-outline" size={44} color="#CBD5E1" />
                  <Text style={styles.emptyStateTitle}>No guests booked for tomorrow</Text>
                  <Text style={styles.emptyStateSubtitle}>
                    Slots are open for members to book free trial passes.
                  </Text>
                </View>
              )}

              {/* Blue Notification Notice */}
              <View style={styles.infoNoticeCard}>
                <Ionicons
                  name="notifications-outline"
                  size={20}
                  color="#2563EB"
                  style={{ marginRight: 10, marginTop: 1 }}
                />
                <Text style={styles.infoNoticeText}>
                  Guests can reschedule or cancel until their visit. You&apos;ll get a notification each time.
                </Text>
              </View>
            </>
          )}

          {/* TAB 4: BY DATE */}
          {activeTab === 'by-date' && (
            <>
              {/* Week Calendar Strip */}
              <TrialWeekCalendarStrip
                selectedDate={selectedDate}
                onSelectDate={(newDate) => setSelectedDate(newDate)}
                onOpenMonthPicker={() => setDatePickerVisible(true)}
                datesWithGuests={datesWithGuests}
              />

              {/* Date Summary Card */}
              <TrialGuestsSummaryCard metrics={dateSummaryMetrics} />

              {/* Group Header for Selected Date */}
              <View style={styles.groupHeaderRow}>
                <Text style={styles.groupHeaderTitle}>
                  {formattedPillDate.toUpperCase()}
                </Text>
                <Text style={styles.groupCapacityText}>
                  {`${selectedDateTrials.length} guests`}
                </Text>
              </View>

              {/* Guest Rows for Selected Date */}
              {selectedDateTrials.length > 0 ? (
                <View style={styles.guestsCardBox}>
                  {selectedDateTrials.map((item, idx, arr) => (
                    <TrialGuestItemRow
                      key={`date-${idx}-${item.clientId}`}
                      item={item}
                      tabMode="by-date"
                      onScan={handleScanPass}
                      isLast={idx === arr.length - 1}
                    />
                  ))}
                </View>
              ) : (
                <View style={styles.emptyStateCard}>
                  <Ionicons name="calendar-outline" size={44} color="#CBD5E1" />
                  <Text style={styles.emptyStateTitle}>No guests on this date</Text>
                  <Text style={styles.emptyStateSubtitle}>
                    Select another day from the calendar strip to inspect bookings.
                  </Text>
                </View>
              )}
            </>
          )}
        </ScrollView>
      )}

      {/* Floating Bottom Action Bar */}
      <View
        style={[
          styles.bottomBar,
          { paddingBottom: Math.max(insets.bottom + 8, 16) },
        ]}>
        {activeTab === 'tomorrow' ? (
          // Tomorrow tab has "Edit tomorrow's slots" button
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={handleEditSlots}
            style={styles.editSlotsButton}>
            <Text style={styles.editSlotsButtonText}>Edit tomorrow&apos;s slots</Text>
          </TouchableOpacity>
        ) : activeTab === 'by-date' ? (
          // By date tab has [Export list] + [Scan pass] buttons
          <View style={styles.dualBottomButtons}>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={handleExportList}
              style={styles.exportListButton}>
              <Ionicons
                name="arrow-forward-outline"
                size={18}
                color="#0F172A"
                style={{ marginRight: 6 }}
              />
              <Text style={styles.exportListButtonText}>Export list</Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.85}
              onPress={handleScanPass}
              style={styles.scanPassHalfButton}>
              <Ionicons
                name="scan-outline"
                size={18}
                color="#FFFFFF"
                style={{ marginRight: 6 }}
              />
              <Text style={styles.scanPassButtonText}>Scan pass</Text>
            </TouchableOpacity>
          </View>
        ) : (
          // Default: Big Red "Scan trial pass"
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={handleScanPass}
            style={styles.scanPassButton}>
            <Ionicons
              name="scan-outline"
              size={20}
              color="#FFFFFF"
              style={{ marginRight: 8 }}
            />
            <Text style={styles.scanPassButtonText}>Scan trial pass</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Full Month Date Picker Modal */}
      <TrialDatePickerModal
        visible={datePickerVisible}
        onClose={() => setDatePickerVisible(false)}
        selectedDate={selectedDate}
        onSelectDate={(newDate) => {
          setSelectedDate(newDate);
          setActiveTab('by-date');
        }}
        datesWithGuests={datesWithGuests}
      />
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
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 6,
  },
  headerTitleContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    fontFamily: 'PlusJakartaSans-Bold',
    color: '#0F172A',
  },
  headerSubtitle: {
    fontSize: 12.5,
    fontFamily: 'PlusJakartaSans-Medium',
    color: '#64748B',
    marginTop: 1,
  },
  searchButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  searchButtonActive: {
    borderColor: '#FEE2E2',
    backgroundColor: '#FFF1F2',
  },
  searchBarWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginBottom: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'PlusJakartaSans-Medium',
    color: '#0F172A',
  },
  tabsContainer: {
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  tabsScrollContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  tabPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 22,
    backgroundColor: '#F1F5F9',
  },
  tabPillActive: {
    backgroundColor: '#E23744',
  },
  tabPillText: {
    fontSize: 13.5,
    fontWeight: '700',
    fontFamily: 'PlusJakartaSans-Bold',
    color: '#334155',
  },
  tabPillTextActive: {
    color: '#FFFFFF',
  },
  tabBadge: {
    marginLeft: 6,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 12,
  },
  tabBadgeInactive: {
    backgroundColor: '#E2E8F0',
  },
  tabBadgeActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
  },
  tabBadgeText: {
    fontSize: 11.5,
    fontWeight: '800',
    fontFamily: 'PlusJakartaSans-Bold',
  },
  tabBadgeTextInactive: {
    color: '#475569',
  },
  tabBadgeTextActive: {
    color: '#FFFFFF',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
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
    fontFamily: 'PlusJakartaSans-Medium',
    color: '#64748B',
  },
  errorTitle: {
    marginTop: 12,
    fontSize: 16,
    fontWeight: '800',
    fontFamily: 'PlusJakartaSans-Bold',
    color: '#0F172A',
  },
  errorSubtitle: {
    marginTop: 4,
    fontSize: 13,
    fontFamily: 'PlusJakartaSans-Medium',
    color: '#64748B',
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 16,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: '#E23744',
  },
  retryButtonText: {
    fontSize: 14,
    fontWeight: '700',
    fontFamily: 'PlusJakartaSans-Bold',
    color: '#FFFFFF',
  },
  dateGroupContainer: {
    marginBottom: 20,
  },
  groupHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
    paddingHorizontal: 2,
  },
  groupHeaderTitle: {
    fontSize: 12.5,
    fontWeight: '800',
    fontFamily: 'PlusJakartaSans-Bold',
    color: '#475569',
    letterSpacing: 0.5,
  },
  groupCapacityText: {
    fontSize: 12,
    fontWeight: '600',
    fontFamily: 'PlusJakartaSans-Medium',
    color: '#64748B',
  },
  guestsCardBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 1,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
    paddingHorizontal: 2,
  },
  sectionHeaderText: {
    fontSize: 12,
    fontWeight: '800',
    fontFamily: 'PlusJakartaSans-Bold',
    color: '#475569',
    letterSpacing: 0.5,
  },
  sectionCountText: {
    fontSize: 12.5,
    fontWeight: '700',
    fontFamily: 'PlusJakartaSans-Bold',
    color: '#64748B',
  },
  miniEmptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  miniEmptyText: {
    fontSize: 13,
    fontFamily: 'PlusJakartaSans-Medium',
    color: '#94A3B8',
  },
  emptyStateCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 16,
  },
  emptyStateTitle: {
    marginTop: 12,
    fontSize: 16,
    fontWeight: '800',
    fontFamily: 'PlusJakartaSans-Bold',
    color: '#0F172A',
  },
  emptyStateSubtitle: {
    marginTop: 4,
    fontSize: 12.5,
    fontFamily: 'PlusJakartaSans-Medium',
    color: '#64748B',
    textAlign: 'center',
  },
  infoNoticeCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#EFF6FF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#DBEAFE',
    padding: 14,
    marginTop: 18,
    marginBottom: 10,
  },
  infoNoticeText: {
    flex: 1,
    fontSize: 12.5,
    fontFamily: 'PlusJakartaSans-Medium',
    color: '#1E40AF',
    lineHeight: 18,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.96)',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 12,
    paddingHorizontal: 16,
  },
  scanPassButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E23744',
    borderRadius: 18,
    paddingVertical: 15,
    shadowColor: '#E23744',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 3,
  },
  scanPassButtonText: {
    fontSize: 15,
    fontWeight: '800',
    fontFamily: 'PlusJakartaSans-Bold',
    color: '#FFFFFF',
  },
  editSlotsButton: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    paddingVertical: 14,
  },
  editSlotsButtonText: {
    fontSize: 15,
    fontWeight: '800',
    fontFamily: 'PlusJakartaSans-Bold',
    color: '#0F172A',
  },
  dualBottomButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  exportListButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    paddingVertical: 14,
  },
  exportListButtonText: {
    fontSize: 14.5,
    fontWeight: '800',
    fontFamily: 'PlusJakartaSans-Bold',
    color: '#0F172A',
  },
  scanPassHalfButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E23744',
    borderRadius: 18,
    paddingVertical: 14,
    shadowColor: '#E23744',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 3,
  },
});
