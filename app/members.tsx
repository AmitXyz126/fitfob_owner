import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  RefreshControl,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useMemberList } from '@/hooks/useMembers';
import { MemberCard } from '@/components/members/MemberCard';
import { MemberFilterTabs } from '@/components/members/MemberFilterTabs';
import { MemberListItem } from '@/api/memberApi';

export default function MemberListScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const {
    members,
    allCount,
    activeCount,
    inactiveCount,
    activeFilter,
    setActiveFilter,
    searchQuery,
    setSearchQuery,
    isLoading,
    isRefetching,
    refetch,
    error,
  } = useMemberList();

  const [inputVal, setInputVal] = useState(searchQuery);

  const handleSearchSubmit = () => {
    setSearchQuery(inputVal);
  };

  const handleClearSearch = () => {
    setInputVal('');
    setSearchQuery('');
  };

  const renderMemberItem = ({ item }: { item: MemberListItem }) => (
    <MemberCard
      member={item}
      onPress={() => {
        router.push({
          pathname: '/member-details',
          params: { docId: item.clientDocumentId },
        });
      }}
    />
  );

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

        <Text style={styles.headerTitle}>Members</Text>

        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => router.push('/notification')}
          style={styles.notificationButton}>
          <Ionicons name="notifications" size={22} color="#E23744" />
          <View style={styles.notificationDot} />
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchSection}>
        <View style={styles.searchBarContainer}>
          <TextInput
            value={inputVal}
            onChangeText={(txt) => {
              setInputVal(txt);
              setSearchQuery(txt);
            }}
            placeholder="Search Members"
            placeholderTextColor="#94A3B8"
            returnKeyType="search"
            onSubmitEditing={handleSearchSubmit}
            style={styles.searchInput}
          />

          {inputVal.length > 0 && (
            <TouchableOpacity
              onPress={handleClearSearch}
              style={styles.clearButton}>
              <Ionicons name="close-circle" size={18} color="#94A3B8" />
            </TouchableOpacity>
          )}

          <TouchableOpacity
            activeOpacity={0.8}
            onPress={handleSearchSubmit}
            style={styles.searchIconBtn}>
            <Ionicons name="search" size={18} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {/* Filter Tabs: All, Active, Inactive */}
        <MemberFilterTabs
          activeFilter={activeFilter}
          onSelectFilter={setActiveFilter}
          allCount={allCount}
          activeCount={activeCount}
          inactiveCount={inactiveCount}
        />
      </View>

      {/* Main List */}
      {isLoading && !isRefetching ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color="#E23744" />
          <Text style={styles.loadingText}>Loading members...</Text>
        </View>
      ) : error ? (
        <View style={styles.centerContainer}>
          <Ionicons name="alert-circle-outline" size={48} color="#EF4444" />
          <Text style={styles.errorTitle}>Failed to load members</Text>
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
        <FlatList
          data={members}
          keyExtractor={(item, index) => item.clientDocumentId || `member-${index}`}
          renderItem={renderMemberItem}
          contentContainerStyle={[
            styles.listContent,
            { paddingBottom: insets.bottom + 80 },
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
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <View style={styles.emptyIconCircle}>
                <Ionicons name="people-outline" size={40} color="#94A3B8" />
              </View>
              <Text style={styles.emptyStateTitle}>No Members Found</Text>
              <Text style={styles.emptyStateText}>
                {searchQuery
                  ? `No members match "${searchQuery}".`
                  : 'There are no members in this category right now.'}
              </Text>
            </View>
          }
        />
      )}

      {/* Floating / Bottom CTA: Add Offline Member (Opens Figma Flow) */}
      <View
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          backgroundColor: '#FFFFFF',
          paddingHorizontal: 20,
          paddingTop: 10,
          paddingBottom: Math.max(insets.bottom, 16),
          borderTopWidth: 1,
          borderTopColor: '#F1F5F9',
        }}>
        <TouchableOpacity
          onPress={() => router.push('/offline-members' as any)}
          activeOpacity={0.85}
          style={{
            height: 48,
            backgroundColor: '#F6163C',
            borderRadius: 16,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            shadowColor: '#F6163C',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.2,
            shadowRadius: 4,
            elevation: 3,
          }}>
          <Ionicons name="add" size={20} color="#FFFFFF" />
          <Text
            style={{
              color: '#FFFFFF',
              fontSize: 15,
              fontWeight: '700',
              fontFamily: 'PlusJakartaSans-Bold',
              marginLeft: 4,
            }}>
            Add Offline Member
          </Text>
        </TouchableOpacity>
      </View>
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
  searchSection: {
    paddingHorizontal: 16,
    paddingTop: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 30,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingLeft: 16,
    paddingRight: 4,
    height: 48,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#0F172A',
    fontFamily: 'PlusJakartaSans-Regular',
    paddingVertical: 0,
  },
  clearButton: {
    padding: 6,
    marginRight: 4,
  },
  searchIconBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#E23744',
    alignItems: 'center',
    justifyContent: 'center',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 14,
  },
  loaderContainer: {
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
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
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
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  emptyStateTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
    fontFamily: 'PlusJakartaSans-Bold',
    marginBottom: 6,
  },
  emptyStateText: {
    fontSize: 13,
    color: '#64748B',
    fontFamily: 'PlusJakartaSans-Regular',
    textAlign: 'center',
    maxWidth: 240,
  },
});
