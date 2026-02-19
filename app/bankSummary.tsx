import React from 'react';
import { View, Text, TouchableOpacity, Image } from 'react-native';
import { ChevronLeft, Bell } from 'lucide-react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Container } from '@/components/Container';
import LineGradient from '@/components/lineGradient/LineGradient';
import { Button } from '@/components/Button';

const BankSummaryScreen = () => {
  const router = useRouter();
  const params = useLocalSearchParams();

  const DetailRow = ({
    label,
    value,
    isLast = false,
  }: {
    label: string;
    value: any;
    isLast?: boolean;
  }) => (
    <View className="mb-4">
      <View className="pb-3">
        <Text className="mb-1 font-medium text-xs text-gray-400">{label}</Text>
        <Text className="font-bold text-base text-gray-800">{value || 'N/A'}</Text>
      </View>

      {!isLast && <LineGradient />}
    </View>
  );

  return (
    <Container>
      {/* Header */}
      <View className="flex-row items-center justify-between py-4">
        <TouchableOpacity onPress={() => router.back()}>
          <ChevronLeft color="black" size={24} />
        </TouchableOpacity>
        <Text className="font-medium text-base text-[#697281]">Bank Account</Text>
        <TouchableOpacity>
          <Bell color="#EF4444" size={24} fill="#EF4444" />
        </TouchableOpacity>
      </View>

      {/* Main Details Card */}
      <View className="mt-4 rounded-3xl border border-gray-100 bg-white p-6 shadow-sm">
        <View className="mb-6">
          <Image
            source={{
              uri:
                (params.logo as string) ||
                'https://cdn-icons-png.flaticon.com/512/2830/2830284.png',
            }}
            style={{ width: 48, height: 48 }}
            resizeMode="contain"
          />
        </View>

        <Text className="mb-6 font-bold text-xl text-gray-800">
          {params.name || 'Bank Details'}
        </Text>

        <View>
          <DetailRow label="Bank Account Holder Name" value={params.holder} />

          <DetailRow label="Bank Account No." value={params.acc} />
          <DetailRow label="IFSC Code:" value={params.ifsc} />

          <DetailRow label="Branch Name:" value={params.branch} isLast={true} />
        </View>
      </View>

      {/* Bottom Button */}
      <View className="absolute bottom-6 left-5 right-5">
           <Button onPress={()=> router.replace('/(tabs)') } title={'Back to Main Menu'} />
       </View>
    </Container>
  );
};

export default BankSummaryScreen;
