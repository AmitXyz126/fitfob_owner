/* eslint-disable react/no-unescaped-entities */
import React, { useState, useMemo } from 'react';
import {
  Text,
  View,
  TouchableOpacity,
  Image,
  FlatList,
  Modal,
  TextInput,
  StyleSheet,
  Platform,
  TouchableWithoutFeedback,
} from 'react-native';
import { Container } from '@/components/Container';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';

type TabType = 'Daily' | 'Weekly' | 'Monthly';

const DATA = [
  // Daily Transactions
  {
    id: '1',
    name: 'Barbara Gordon',
    plan: 'Premium pass',
    price: '₹699.00',
    date: 'Today, 9:30 pm',
    image: 'https://randomuser.me/api/portraits/women/1.jpg',
    type: 'Daily',
  },
  {
    id: '2',
    name: 'Sarah Connor',
    plan: 'Premium pass',
    price: '₹699.00',
    date: 'Today, 8:15 pm',
    image: 'https://randomuser.me/api/portraits/women/10.jpg',
    type: 'Daily',
  },
  {
    id: '3',
    name: 'John Doe',
    plan: 'Standard pass',
    price: '₹499.00',
    date: 'Today, 3:00 pm',
    image: 'https://randomuser.me/api/portraits/men/11.jpg',
    type: 'Daily',
  },
  // Weekly Transactions
  {
    id: '4',
    name: 'James Gordon',
    plan: 'Premium pass',
    price: '₹1200.00',
    date: 'This Week',
    image: 'https://randomuser.me/api/portraits/men/2.jpg',
    type: 'Weekly',
  },
  {
    id: '5',
    name: 'Peter Parker',
    plan: 'Premium pass',
    price: '₹1500.00',
    date: '3 days ago',
    image: 'https://randomuser.me/api/portraits/men/20.jpg',
    type: 'Weekly',
  },
  {
    id: '6',
    name: 'Clark Kent',
    plan: 'Premium pass',
    price: '₹1800.00',
    date: '5 days ago',
    image: 'https://randomuser.me/api/portraits/men/21.jpg',
    type: 'Weekly',
  },
  // Monthly Transactions
  {
    id: '7',
    name: 'Bruce Wayne',
    plan: 'Premium pass',
    price: '₹2500.00',
    date: '22nd Jan',
    image: 'https://randomuser.me/api/portraits/men/3.jpg',
    type: 'Monthly',
  },
  {
    id: '8',
    name: 'Diana Prince',
    plan: 'Premium pass',
    price: '₹2500.00',
    date: '20th Jan',
    image: 'https://randomuser.me/api/portraits/women/4.jpg',
    type: 'Monthly',
  },
  {
    id: '9',
    name: 'Barry Allen',
    plan: 'Premium pass',
    price: '₹2500.00',
    date: '15th Jan',
    image: 'https://randomuser.me/api/portraits/men/5.jpg',
    type: 'Monthly',
  },
  {
    id: '10',
    name: 'Hal Jordan',
    plan: 'Premium pass',
    price: '₹2500.00',
    date: '12th Jan',
    image: 'https://randomuser.me/api/portraits/men/6.jpg',
    type: 'Monthly',
  },
  {
    id: '11',
    name: 'Arthur Curry',
    plan: 'Premium pass',
    price: '₹2500.00',
    date: '10th Jan',
    image: 'https://randomuser.me/api/portraits/men/7.jpg',
    type: 'Monthly',
  },
];

const Wallet = () => {
  const [activeTab, setActiveTab] = useState<TabType>('Monthly');

  // Filter & Search states
  const [showFilters, setShowFilters] = useState(false);
  const [selectedPassType, setSelectedPassType] = useState<string>('All');
  const [selectedSort, setSelectedSort] = useState<string>('None');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Temporary holding states for the modal
  const [tempPassType, setTempPassType] = useState<string>('All');
  const [tempSort, setTempSort] = useState<string>('None');

  const stats: Record<TabType, { label: string; amount: string; change: string }> = {
    Daily: { label: 'Daily Earnings', amount: '₹8,000', change: '+5% today' },
    Weekly: { label: 'Weekly Earnings', amount: '₹56,000', change: '+12% this week' },
    Monthly: { label: 'Monthly Earnings', amount: '₹2,40,000', change: '+20% this month' },
  };

  const filteredData = useMemo(() => {
    let result = DATA.filter((item) => item.type === activeTab);

    // 1. Filter by Pass Type
    if (selectedPassType !== 'All') {
      result = result.filter((item) => item.plan.toLowerCase() === selectedPassType.toLowerCase());
    }

    // 2. Filter by Search Query (Name)
    if (searchQuery.trim().length > 0) {
      result = result.filter((item) =>
        item.name.toLowerCase().includes(searchQuery.toLowerCase().trim())
      );
    }

    // 3. Sort by Price
    if (selectedSort !== 'None') {
      result = [...result].sort((a, b) => {
        const priceA = parseFloat(a.price.replace(/[^\d.]/g, ''));
        const priceB = parseFloat(b.price.replace(/[^\d.]/g, ''));
        return selectedSort === 'LowToHigh' ? priceA - priceB : priceB - priceA;
      });
    }

    return result;
  }, [activeTab, selectedPassType, selectedSort, searchQuery]);

  const openFilterModal = () => {
    setTempPassType(selectedPassType);
    setTempSort(selectedSort);
    setShowFilters(true);
  };

  const applyFilters = () => {
    setSelectedPassType(tempPassType);
    setSelectedSort(tempSort);
    setShowFilters(false);
  };

  const clearAllFilters = () => {
    setTempPassType('All');
    setTempSort('None');
    setSearchQuery('');
  };

  const isAnyFilterActive = selectedPassType !== 'All' || selectedSort !== 'None' || searchQuery.trim().length > 0;

  const renderItem = ({ item }: { item: (typeof DATA)[0] }) => (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={() =>
        router.push({
          pathname: '/(tabs)/earningDetail',
          params: { ...item },
        })
      }
      className="mb-3 flex-row items-center rounded-lg border border-[#E5E7EB] bg-white p-3">
      <Image source={{ uri: item.image }} className="h-[50px] w-[50px] rounded-lg" />
      <View className="ml-3 flex-1">
        <View className="flex-row items-center">
          <Text className="font-bold text-[15px] text-slate-800">{item.name}</Text>
          <Image className="ml-1 h-3.5 w-3.5" source={require('../../assets/images/tick.png')} />
        </View>
        <View className="flex-row items-center">
          <Text className="text-xs text-slate-400">
            {item.plan} • {item.date}
          </Text>
        </View>
      </View>
      <Text className="font-bold text-[14px] text-slate-900">{item.price}</Text>
    </TouchableOpacity>
  );

  return (
    <Container style={{ flex: 1 }}>
      {/* Fixed Top Section */}
      <View>
        <View className="flex-row items-center justify-between pb-2 pt-2">
          <TouchableOpacity
            onPress={() => router.back()}
            className="h-10 w-10 items-center justify-center rounded-full border border-slate-200/60 bg-white/80 backdrop-blur-md">
            <Ionicons name="chevron-back" size={20} color="#1C1C1C" />
          </TouchableOpacity>
          <Text className="font-bold text-lg text-slate-800">Earnings Overview</Text>
          <View className="w-10" />
        </View>

        <View className="my-4 flex-row rounded-xl bg-slate-100 p-1">
          {/* Tabs UI */}
          {(['Daily', 'Weekly', 'Monthly'] as TabType[]).map((tab) => (
            <TouchableOpacity
              key={tab}
              onPress={() => setActiveTab(tab)}
              style={
                activeTab === tab
                  ? {
                      shadowColor: '#000',
                      shadowOffset: { width: 0, height: 1 },
                      shadowOpacity: 0.1,
                      shadowRadius: 2,
                      elevation: 1,
                      backgroundColor: 'white',
                    }
                  : {}
              }
              className={`flex-1 items-center rounded-lg py-2.5`}>
              <Text
                className={`font-bold ${
                  activeTab === tab ? 'text-slate-900' : 'text-slate-400'
                }`}>
                {tab}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* LinearGradient */}
        <LinearGradient
          colors={['#F6163C', '#FF5F7A']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{
            borderRadius: 16,
            overflow: 'hidden',
            shadowColor: '#F6163C',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.2,
            shadowRadius: 8,
            elevation: 4,
          }}
          className="relative mb-6">
          <Image
            source={require('../../assets/images/bgLayer.png')}
            className="absolute right-0 top-0 h-full w-1/2"
            resizeMode="cover"
          />
          <View className="relative z-10 px-4 py-5">
            <Text className="font-medium text-white" style={{ opacity: 0.8 }}>
              {stats[activeTab].label}
            </Text>
            <View className="mt-2 flex-row items-center justify-between">
              <Text className="font-bold font-sans text-4xl leading-9 text-white">
                {stats[activeTab].amount}
              </Text>
              <View
                className="rounded-full px-3 py-1.5 backdrop-blur-md"
                style={{ backgroundColor: 'rgba(0, 0, 0, 0.1)' }}>
                <Text className="font-bold text-[10px] text-white">
                  {stats[activeTab].change}
                </Text>
              </View>
            </View>
          </View>
        </LinearGradient>

        <View className="mb-2 mt-6">
          <Text className="font-bold text-lg text-slate-800 mb-3">{activeTab} Transactions</Text>
          
          <View className="flex-row items-center gap-3">
            {/* Search Input on main screen */}
            <View className="flex-1 flex-row items-center rounded-2xl border border-slate-200 bg-[#F8FAFC] px-4 h-12">
              <Ionicons name="search-outline" size={18} color="#64748B" />
              <TextInput
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder="Search by customer name..."
                placeholderTextColor="#94A3B8"
                className="flex-1 ml-3 h-full text-slate-850 text-sm font-semibold"
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery('')}>
                  <Ionicons name="close-circle" size={18} color="#CBD5E1" />
                </TouchableOpacity>
              )}
            </View>

            {/* Filter Toggle Button */}
            <TouchableOpacity
              onPress={openFilterModal}
              style={isAnyFilterActive ? styles.activeFilterBtn : styles.filterBtn}
              activeOpacity={0.7}
              className="h-12 w-12 items-center justify-center rounded-2xl border">
              <Ionicons
                name={isAnyFilterActive ? "funnel" : "options-outline"}
                size={20}
                color={isAnyFilterActive ? "white" : "#F6163C"}
              />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Scrollable List */}
      <FlatList
        data={filteredData}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: Platform.OS === 'ios' ? 100 : 30 }}
        ListEmptyComponent={
          <View className="items-center justify-center py-20">
            <Ionicons name="receipt-outline" size={48} color="#CBD5E1" />
            <Text className="mt-4 font-semibold text-slate-400">No transactions match filters.</Text>
          </View>
        }
      />

      {/* Premium Filter Slide-up Bottom Sheet Modal */}
      <Modal
        animationType="slide"
        transparent
        visible={showFilters}
        onRequestClose={() => setShowFilters(false)}>
        <TouchableWithoutFeedback onPress={() => setShowFilters(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={styles.modalContent}>
                {/* Modal Pill handle */}
                <View style={styles.pullHandle} />

                {/* Header */}
                <View className="flex-row items-center justify-between mb-6">
                  <Text className="font-bold text-xl text-slate-900">Filter Transactions</Text>
                  <TouchableOpacity onPress={clearAllFilters} activeOpacity={0.7}>
                    <Text className="font-bold text-sm text-[#F6163C]">Clear All</Text>
                  </TouchableOpacity>
                </View>


                {/* Pass Type filter */}
                <View className="mb-6">
                  <Text className="mb-3 font-bold text-xs uppercase tracking-wider text-slate-400">
                    Pass Type
                  </Text>
                  <View className="flex-row flex-wrap gap-2">
                    {[
                      { label: 'All Passes', value: 'All' },
                      { label: 'Premium', value: 'Premium pass' },
                      { label: 'Standard', value: 'Standard pass' },
                    ].map((pass) => {
                      const isSelected = tempPassType === pass.value;
                      return (
                        <TouchableOpacity
                          key={pass.value}
                          onPress={() => setTempPassType(pass.value)}
                          activeOpacity={0.7}
                          style={isSelected ? styles.pillActive : styles.pillInactive}
                          className="px-4 py-2.5 rounded-full border">
                          <Text
                            style={isSelected ? styles.pillTextActive : styles.pillTextInactive}
                            className="font-bold text-xs">
                            {pass.label}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>

                {/* Sorting options */}
                <View className="mb-8">
                  <Text className="mb-3 font-bold text-xs uppercase tracking-wider text-slate-400">
                    Sort Price
                  </Text>
                  <View className="flex-row flex-wrap gap-2">
                    {[
                      { label: 'Default', value: 'None' },
                      { label: 'Low to High', value: 'LowToHigh' },
                      { label: 'High to Low', value: 'HighToLow' },
                    ].map((sortOption) => {
                      const isSelected = tempSort === sortOption.value;
                      return (
                        <TouchableOpacity
                          key={sortOption.value}
                          onPress={() => setTempSort(sortOption.value)}
                          activeOpacity={0.7}
                          style={isSelected ? styles.pillActive : styles.pillInactive}
                          className="px-4 py-2.5 rounded-full border">
                          <Text
                            style={isSelected ? styles.pillTextActive : styles.pillTextInactive}
                            className="font-bold text-xs">
                            {sortOption.label}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>

                {/* Action button */}
                <TouchableOpacity
                  onPress={applyFilters}
                  activeOpacity={0.8}
                  style={styles.applyBtn}
                  className="h-14 w-full flex-row items-center justify-center rounded-2xl bg-[#F6163C]">
                  <Text className="font-bold text-base text-white">Apply Filters</Text>
                </TouchableOpacity>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </Container>
  );
};

const styles = StyleSheet.create({
  filterBtn: {
    borderColor: '#E2E8F0',
  },
  filterText: {
    color: '#334155',
  },
  activeFilterBtn: {
    backgroundColor: '#F6163C',
    borderColor: '#F6163C',
  },
  activeFilterText: {
    color: '#FFFFFF',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 44 : 32,
    ...Platform.select({
      ios: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: -8 },
        shadowOpacity: 0.12,
        shadowRadius: 20,
      },
      android: {
        elevation: 16,
      },
    }),
  },
  pullHandle: {
    width: 36,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#E2E8F0',
    alignSelf: 'center',
    marginBottom: 20,
  },
  pillActive: {
    backgroundColor: 'rgba(246, 22, 60, 0.08)',
    borderColor: '#F6163C',
  },
  pillInactive: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E2E8F0',
  },
  pillTextActive: {
    color: '#F6163C',
  },
  pillTextInactive: {
    color: '#64748B',
  },
  applyBtn: {
    ...Platform.select({
      ios: {
        shadowColor: '#F6163C',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.2,
        shadowRadius: 10,
      },
      android: {
        elevation: 3,
      },
    }),
  },
});

export default Wallet;
