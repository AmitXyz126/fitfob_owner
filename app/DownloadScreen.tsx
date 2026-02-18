import React from 'react';
import { View, Text, TouchableOpacity, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, FontAwesome5, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Button } from '@/components/Button';

const DownloadScreen = () => {
  const router = useRouter();

  return (
    <SafeAreaView className="flex-1 bg-white">
      <StatusBar barStyle="dark-content" />
      
      {/* HEADER */}
      <View className="flex-row items-center justify-between px-6 py-4">
        <TouchableOpacity onPress={() => router.back()} className="p-1">
          <Ionicons name="chevron-back" size={24} color="#334155" />
        </TouchableOpacity>
        
        <Text className="text-lg font-medium text-[#697281]">Download</Text>
        
        <TouchableOpacity className="relative p-1">
          <Ionicons name="notifications" size={24} color="#F6163C" />
          <View className="absolute right-2 top-1 h-2 w-2 rounded-full bg-[#F6163C] border border-white" />
        </TouchableOpacity>
      </View>

      {/* CARD CONTAINER */}
      <View className="px-5 mt-4">
        <View 
          className="bg-white rounded-[24px] p-6 border border-[#E5E7EB]"
        >
          {/* EARNINGS INFO */}
          <View className="flex-row justify-between items-center mb-8">
            <Text className="text-[#1C1C1C] font-medium text-base">Monthly Earnings:</Text>
            <Text className="text-[#1C1C1C] font-bold text-base">₹2,40,000</Text>
          </View>

          {/* DOWNLOAD PDF BUTTON */}
          <View className="mb-4">
            <Button 
              title="Download PDF"
              icon={<MaterialCommunityIcons name="file-pdf-box" size={24} color="white" />}
              onPress={() => console.log("PDF Downloading...")}
            />
          </View>

          {/* DOWNLOAD CSV BUTTON */}
          <View>
            <Button 
              title="Download CSV"
              variant="secondary"
              className="bg-[#E2E8F0] border-0" 
              icon={<FontAwesome5 name="file-csv" size={20} color="#64748B" />}
              onPress={() => console.log("CSV Downloading...")}
            />
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
};

export default DownloadScreen;