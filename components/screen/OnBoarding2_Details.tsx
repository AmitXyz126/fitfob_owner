 import { View, Text, TextInput, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const OnBoarding2_Details = () => {
  return (
    <View className="flex-1 bg-white">
      <Text className="text-[24px] font-bold text-[#1C1C1C]  font-sans mb-6">Add your location details</Text>

      {/* Selected Location Card */}
      <View className="flex-row items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100 mb-6">
        <View className="flex-1 pr-4">
          <Text className="font-bold text-slate-900">CP67 Mall Mohali</Text>
          <Text className="text-slate-500 text-xs mt-1" numberOfLines={1}>International Airport Road, Sector 67, Mohali...</Text>
        </View>
        <TouchableOpacity className="bg-white px-3 py-1 rounded-full border border-slate-200">
          <Text className="text-slate-500 text-xs font-bold">Change</Text>
        </TouchableOpacity>
      </View>

      {/* Form Fields */}
      <View className="space-y-5">
        <View>
          <Text className="text-[#697281] text-sm font-normal mb-2 ml-1">Address details*</Text>
          <TextInput placeholder="Building Name" className="h-14 border border-slate-200 rounded-2xl px-4 bg-white" />
        </View>

        <View>
          <Text className="text-[#697281] text-sm font-normal  mb-2 ml-1 mt-3">City</Text>
          <View className="h-14 border border-slate-200 rounded-2xl px-4 flex-row items-center justify-between bg-white">
            <Text className="text-slate-900">Mohali</Text>
            <Ionicons name="chevron-down" size={18} color="#64748B" />
          </View>
        </View>

        <View>
          <Text className="text-[#697281] text-sm font-normal mb-2 ml-1 mt-3">State</Text>
          <View className="h-14 border border-slate-200 rounded-2xl px-4 flex-row items-center justify-between bg-white">
            <Text className="text-slate-900">Punjab</Text>
            <Ionicons name="chevron-down" size={18} color="#64748B" />
          </View>
        </View>

        <View>
          <Text className="text-[#697281] text-sm font-normal mb-2 ml-1 mt-3">Pincode</Text>
          <TextInput placeholder="160067" keyboardType="numeric" className="h-14 border border-slate-200 rounded-2xl px-4 bg-white" />
        </View>
      </View>
    </View>
  );
};

export default OnBoarding2_Details;