import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity, FlatList, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Container } from '@/components/Container';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
} from 'react-native-reanimated';

interface NotificationItem {
  id: string;
  title: string;
  description: string;
  date: string;
  isUnread?: boolean;
}

// DUMMY NOTIFICATIONS DATA (COMMENTED OUT FOR LIVE DATA / EMPTY STATE)
/*
const DUMMY_NOTIFICATIONS: NotificationItem[] = [
  {
    id: '1',
    title: 'Booked for Tomorrow Morning',
    description:
      'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et...',
    date: '15 Oct 2024 · 9:30 AM',
    isUnread: true,
  },
  {
    id: '2',
    title: 'Personal training sessions available!',
    description:
      'Engage with our certified trainers for personalized workouts tailored to your fitness goals. Experience...',
    date: '17 Oct 2024 · 10:00 AM',
  },
  {
    id: '3',
    title: 'Unlimited gyms with anywhere pass!',
    description:
      'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et...',
    date: '15 Oct 2024 · 9:30 AM',
  },
  {
    id: '4',
    title: 'Nutrition counseling sessions offered!',
    description:
      'Transform your health with our nutrition experts who provide guidance on meal planning and healthy eat...',
    date: '21 Oct 2024 · 1:00 PM',
  },
  {
    id: '5',
    title: 'Group fitness classes every week!',
    description:
      'Join our vibrant community in various group classes ranging from yoga to high-intensity interval training...',
    date: '19 Oct 2024 · 5:30 PM',
  },
  {
    id: '6',
    title: 'Access to wellness workshops!',
    description:
      'Enhance your mind and body connection through workshops on stress management, meditation, and wellness...',
    date: '15 Oct 2024 · 9:30 AM',
  },
];
*/

const mockNotifications: NotificationItem[] = [];

const EmptyNotificationState = () => {
  const floatAnim = useSharedValue(0);

  useEffect(() => {
    floatAnim.value = withRepeat(
      withSequence(
        withTiming(-10, { duration: 2200, easing: Easing.inOut(Easing.ease) }),
        withTiming(0, { duration: 2200, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
  }, [floatAnim]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: floatAnim.value }],
  }));

  return (
    <View className="items-center justify-center py-6 px-4 flex-1">
      <Animated.View style={animatedStyle} className="items-center justify-center w-full">
        <Image
          source={require('../assets/images/notification_empty.png')}
          style={{ width: 420, height: 350 }}
          resizeMode="contain"
        />
      </Animated.View>
    </View>
  );
};

export default function NotificationScreen() {
  const router = useRouter();

  const renderItem = ({ item }: { item: NotificationItem }) => {
    if (item.isUnread) {
      return (
        <View className="mb-4 rounded-2xl bg-[#FFF0F2] p-4 border border-[#FFE2E6]">
          <View className="flex-row items-center mb-1">
            <View className="mr-2 h-2.5 w-2.5 rounded-full bg-[#F6163C]" />
            <Text className="font-sans font-semibold text-[15px] leading-tight text-[#1C1C1C] flex-1">
              {item.title}
            </Text>
          </View>
          <Text className="font-sans text-[13px] font-normal leading-[18px] text-slate-500 mb-2">
            {item.description}
          </Text>
          <Text className="font-sans text-[11px] font-medium text-slate-400">
            {item.date}
          </Text>
        </View>
      );
    }

    return (
      <View className="mb-6 px-1">
        <Text className="font-sans font-semibold text-[15px] leading-tight text-[#1C1C1C] mb-1">
          {item.title}
        </Text>
        <Text className="font-sans text-[13px] font-normal leading-[18px] text-slate-500 mb-2">
          {item.description}
        </Text>
        <Text className="font-sans text-[11px] font-medium text-slate-400">
          {item.date}
        </Text>
      </View>
    );
  };

  return (
    <Container style={{ flex: 1, backgroundColor: '#FFF' }}>
      {/* Header */}
      <View className="flex-row items-center justify-between py-3 mb-4">
        <TouchableOpacity
          onPress={() => router.back()}
          className="h-10 w-10 items-center justify-center rounded-full active:bg-gray-100"
        >
          <Ionicons name="chevron-back" size={24} color="#1C1C1C" />
        </TouchableOpacity>
        
        <Text className="font-sans font-bold text-[18px] text-[#1C1C1C] text-center flex-1 mr-10">
          Notification
        </Text>
      </View>

      {/* Notification List */}
      <FlatList
        data={mockNotifications}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 20, flexGrow: 1 }}
        ListEmptyComponent={<EmptyNotificationState />}
      />
    </Container>
  );
}
