import  { useState } from 'react';
import { View, Text, Image, TouchableOpacity, FlatList, TextInput, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Container } from '@/components/Container';

const ALL_CHECKINS = [
  { id: '1', name: 'Tina Sharma', time: '10 minutes ago', type: 'Standard', image: 'https://i.pravatar.cc/150?u=tina', color: '#94A3B8', verified: true },
  { id: '2', name: 'Amelia Thomas', time: '1 hour and 10 minutes ago', type: 'Premium', image: 'https://i.pravatar.cc/150?u=amelia', color: '#EAB308', verified: true },
  { id: '3', name: 'Sophia Lee', time: '35 minutes ago', type: 'Luxury', image: 'https://i.pravatar.cc/150?u=sophia', color: '#F6163C', verified: true },
  { id: '4', name: 'Liam Brown', time: '20 minutes ago', type: 'Luxury', image: 'https://i.pravatar.cc/150?u=liam', color: '#F6163C', verified: true },
  { id: '5', name: 'Noah Martinez', time: '45 minutes ago', type: 'Luxury', image: 'https://i.pravatar.cc/150?u=noah1', color: '#F6163C', verified: true },
  { id: '6', name: 'Noah Martinez', time: '45 minutes ago', type: 'Luxury', image: 'https://i.pravatar.cc/150?u=noah2', color: '#F6163C', verified: true },
];

const ViewAllScreen = () => {
  const router = useRouter();
  const [search, setSearch] = useState('');

  return (
    <Container>
      {/* --- HEADER --- */}
      <View 
        style={{ paddingTop: Platform.OS === 'ios' ? 10 : 20 }} 
        className="flex-row items-center justify-between  mb-4"
      >
        <TouchableOpacity onPress={() => router.back()} className="p-2">
          <Ionicons name="chevron-back" size={24} color="#1E293B" />
        </TouchableOpacity>
        
        <Text className="text-lg font-bold text-slate-800">Recent Check-ins</Text>
        
        <TouchableOpacity className="p-2">
          <Ionicons name="notifications" size={24} color="#F6163C" />
        </TouchableOpacity>
      </View>

      {/* --- SEARCH BAR --- */}
      <View className=" mb-6">
        <View className="flex-row items-center bg-white border border-slate-100 rounded-full px-4 py-1 shadow-sm shadow-slate-200">
          <TextInput 
            placeholder="Search Members" 
            placeholderTextColor="#94A3B8"
            className="flex-1 text-slate-600 h-11 font-medium"
            value={search}
            onChangeText={setSearch}
          />
          <TouchableOpacity className="bg-[#F6163C] p-2.5 rounded-full my-1">
            <Ionicons name="search" size={18} color="white" />
          </TouchableOpacity>
        </View>
      </View>

      {/* --- RECENT CHECK-INS LIST --- */}
      <FlatList
        data={ALL_CHECKINS}
        keyExtractor={(item, index) => item.id + index}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{  paddingBottom: 40 }}
        renderItem={({ item }) => (
          <View className="mb-4 flex-row items-center bg-white rounded-[24px] border border-slate-50 p-3 shadow-sm shadow-slate-100">
            {/* User Avatar */}
            <Image 
              source={{ uri: item.image }} 
              className="h-14 w-14 rounded-2xl bg-slate-100" 
            />

            {/* User Details */}
            <View className="ml-4 flex-1">
              <View className="flex-row items-center">
                <Text className="font-bold text-[15px] text-slate-900 mr-1">
                  {item.name}
                </Text>
                {item.verified && (
                  // <Ionicons name="checkmark-circle" size={16} color="#22C55E" />
                  <Image className='w-4 h-4' source={require("../assets/images/tick.png")}  />
                )}
              </View>
              <Text className="text-xs text-slate-400 font-medium mt-0.5">
                {item.time}
              </Text>
            </View>

            {/* Membership Badge */}
            <View 
              style={{ 
                backgroundColor: `${item.color}15`, 
                borderColor: `${item.color}25` 
              }}
              className="flex-row items-center rounded-full border px-3 py-1.5"
            >
              <Ionicons name="shield-checkmark" size={12} color={item.color} />
              <Text 
                style={{ color: item.color }} 
                className="ml-1.5 font-bold text-[11px]"
              >
                {item.type}
              </Text>
            </View>
          </View>
        )}
      />
    </Container>
  );
};

export default ViewAllScreen;