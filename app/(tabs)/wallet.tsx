/* eslint-disable react/no-unescaped-entities */
import React, { useState, useMemo } from 'react';
import { Text, View, TouchableOpacity, Image, FlatList } from 'react-native';
import { Container } from '@/components/Container';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';

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
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabType>('Monthly');

  const stats: Record<TabType, { label: string; amount: string; change: string }> = {
    Daily: { label: 'Daily Earnings', amount: '₹8,000', change: '+5% today' },
    Weekly: { label: 'Weekly Earnings', amount: '₹56,000', change: '+12% this week' },
    Monthly: { label: 'Monthly Earnings', amount: '₹2,40,000', change: '+20% this month' },
  };

  const filteredData = useMemo(() => {
    return DATA.filter((item) => item.type === activeTab);
  }, [activeTab]);

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
        <View className="pb-2 pt-4">
          <Text className="font-medium text-xl ">Earnings Overview</Text>
        </View>

        <View className="my-4 flex-row rounded-xl bg-slate-100 p-1">
          {/* Tabs UI with inline styling to bypass NativeWind shadow race condition */}
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

        {/* LinearGradient with inline styles to prevent NativeWind opacity/shadow race condition */}
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

        <View className="mb-4 mt-4 flex-row items-center justify-between">
          <Text className="font-bold text-lg text-slate-800">{activeTab} Transactions</Text>
          <TouchableOpacity className="flex-row items-center rounded-full border border-slate-200 px-3 py-1.5">
            <Ionicons name="options-outline" size={18} color="#F6163C" />
            <Text className="ml-1.5 font-bold text-slate-700">Filter</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Scrollable List */}
      <FlatList
        data={filteredData}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 20 }}
      />
    </Container>
  );
};

export default Wallet;
