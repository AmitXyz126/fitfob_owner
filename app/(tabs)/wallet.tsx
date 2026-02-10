import React, { useState, useMemo } from 'react';
import { Text, View, TouchableOpacity, Image, FlatList } from 'react-native';
import { Container } from '@/components/Container';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router'; // 1. Navigation ke liye import

type TabType = 'Daily' | 'Weekly' | 'Monthly';

const DATA = [
  { id: '1', name: 'Barbara Gordon', plan: 'Premium pass', price: '₹699.00', date: 'Today, 9:30 pm', image: 'https://randomuser.me/api/portraits/women/1.jpg', type: 'Daily' },
  { id: '2', name: 'James Gordon', plan: 'Premium pass', price: '₹1200.00', date: 'This Week', image: 'https://randomuser.me/api/portraits/men/2.jpg', type: 'Weekly' },
  { id: '3', name: 'Bruce Wayne', plan: 'Premium pass', price: '₹2500.00', date: '22nd Jan', image: 'https://randomuser.me/api/portraits/men/3.jpg', type: 'Monthly' },
];

const Wallet = () => {
  const router = useRouter(); // 2. Router initialize kiya
  const [activeTab, setActiveTab] = useState<TabType>('Monthly');

  const stats: Record<TabType, { label: string; amount: string; change: string }> = {
    Daily: { label: 'Daily Earnings', amount: '₹8,000', change: '+5% today' },
    Weekly: { label: 'Weekly Earnings', amount: '₹56,000', change: '+12% this week' },
    Monthly: { label: 'Monthly Earnings', amount: '₹2,40,000', change: '+20% this month' },
  };

  const filteredData = useMemo(() => {
    return DATA.filter(item => item.type === activeTab || activeTab === 'Monthly');
  }, [activeTab]);

  const renderItem = ({ item }: { item: typeof DATA[0] }) => (
 
    <TouchableOpacity 
      activeOpacity={0.7}
      onPress={() => router.push({
        pathname: "/(tabs)/earningDetail", 
        params: { 
          name: item.name, 
          price: item.price, 
          image: item.image, 
          date: item.date,
          plan: item.plan 
        } 
      })}
      className="flex-row items-center bg-white border border-slate-100 rounded-2xl p-3 mb-3 shadow-sm"
    >
      <Image source={{ uri: item.image }} className="h-12 w-12 rounded-xl" />
      <View className="ml-3 flex-1">
        <View className="flex-row items-center">
          <Text className="font-bold text-slate-800 text-[15px]">{item.name}</Text>
          <Image className="h-3.5 w-3.5 ml-1" source={require("../../assets/images/tick.png")} />
        </View>
        <View className="flex-row items-center">
          <Text className="text-slate-400 text-xs">{item.plan} • {item.date}</Text>
        </View>
      </View>
      <Text className="font-bold text-slate-900 text-[14px]">{item.price}</Text>
    </TouchableOpacity>
  );

  return (
    <Container>
      <View className="pt-4 pb-2">
        <Text className="text-2xl font-bold text-slate-800">Earnings Overview</Text>
      </View>

      <View className="flex-row bg-slate-100 rounded-xl p-1 my-4">
        {(['Daily', 'Weekly', 'Monthly'] as TabType[]).map((tab) => (
          <TouchableOpacity
            key={tab}
            onPress={() => setActiveTab(tab)}
            className={`flex-1 py-2.5 rounded-lg items-center ${activeTab === tab ? 'bg-white shadow-sm' : ''}`}
          >
            <Text className={`font-bold ${activeTab === tab ? 'text-slate-900' : 'text-slate-400'}`}>
              {tab}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View>
        <LinearGradient
          colors={['#F6163C', '#FF5F7A']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ borderRadius: 24, overflow: 'hidden' }}
          className="relative mb-6 shadow-xl shadow-red-300"
        >
          <Image
            source={require('../../assets/images/bgLayer.png')}
            className="absolute right-0 top-0 h-full w-1/2 opacity-40"
            resizeMode="cover"
          />

          <View className="relative z-10 px-5 py-7">
            <View className="flex-row items-start justify-between">
              <Text className="font-medium text-white/90 text-lg">{stats[activeTab].label}</Text>
              <View className="rounded-full bg-white/20 px-3 py-1.5 backdrop-blur-md">
                <Text className="font-bold text-[10px] text-white">{stats[activeTab].change}</Text>
              </View>
            </View>
            <Text className="mt-2 text-4xl font-black tracking-tighter text-white">
              {stats[activeTab].amount}
            </Text>
          </View>
        </LinearGradient>
      </View>

      <View className="flex-row justify-between items-center mb-4 mt-4">
        <Text className="text-lg font-bold text-slate-800">{activeTab} Transactions</Text>
        <TouchableOpacity className="flex-row items-center border border-slate-200 px-3 py-1.5 rounded-full">
          <Ionicons name="options-outline" size={18} color="#F6163C" />
          <Text className="ml-1.5 font-bold text-slate-700">Filter</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={filteredData}
        renderItem={renderItem}
        keyExtractor={item => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 20 }}
      />
    </Container>
  );
};

export default Wallet;