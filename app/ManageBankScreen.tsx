/* eslint-disable react-hooks/exhaustive-deps */
import React, { useState, useEffect } from 'react'; // useEffect add kiya
import { View, Text, TouchableOpacity, Image, ScrollView } from 'react-native';
import { ChevronLeft, Bell, MoreVertical } from 'lucide-react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Container } from '@/components/Container';
import { Button } from '@/components/Button';

const ManageBankScreen = () => {
  const router = useRouter();
  const params = useLocalSearchParams();

  const [selectedBank, setSelectedBank] = useState('1');

  // Initial Bank List
  const [banks, setBanks] = useState([
    {
      id: '1',
      name: 'Union Bank of India',
      acc: '**** 7463',
      logo: require('../assets/images/bank_logo.png'),
    },
    {
      id: '2',
      name: 'State Bank of India',
      acc: '**** 1234',
      logo: require('../assets/images/bank_logo.png'),
    },
  ]);

  useEffect(() => {
    if (params.newBankName) {
      const newEntry = {
        id: Math.random().toString(),
        name: params.newBankName as string,
        acc: `**** ${params.newAcc?.toString().slice(-4)}`,
        logo: 'https://cdn-icons-png.flaticon.com/512/2830/2830284.png',
      };
      setBanks((prev) => [...prev, newEntry]);
    }
  }, [params.newBankName]);

  return (
    <Container>
      {/* Header */}
      <View className="flex-row items-center justify-between py-4">
        <TouchableOpacity onPress={() => router.back()}>
          <ChevronLeft color="black" size={24} />
        </TouchableOpacity>
        <Text className="font-medium text-base text-[#697281]">Manage Bank Account</Text>
        <TouchableOpacity>
          <Bell color="#EF4444" size={24} fill="#EF4444" />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <View className="mt-4">
          <Text className="mb-4 font-medium text-[16px] text-[#1C1C1C]">Bank Details</Text>

          {banks.map((bank) => (
            <TouchableOpacity
              key={bank.id}
              onPress={() => setSelectedBank(bank.id)}
              className={`mb-4 flex-row items-center justify-between rounded-2xl border-2 bg-white p-4 ${
                selectedBank === bank.id ? 'border-[#EF4444]' : 'border-gray-100'
              }`}>
              <View className="flex-1 flex-row items-center">
                <View className="mr-4 h-12 w-12 items-center justify-center overflow-hidden rounded-xl border border-gray-100 bg-gray-50">
                   <Image
                    source={typeof bank.logo === 'string' ? { uri: bank.logo } : bank.logo}
                    className="h-8 w-8"
                    resizeMode="contain"
                  />
                </View>
                <View>
                  <Text
                    className={`font-bold text-[15px] ${selectedBank === bank.id ? 'text-black' : 'text-[#6B7280]'}`}>
                    {bank.name}
                  </Text>
                  <Text className="font-medium text-xs text-gray-400">{bank.acc}</Text>
                </View>
              </View>
              <MoreVertical size={20} color="#94A3B8" />
            </TouchableOpacity>
          ))}

          <TouchableOpacity
            onPress={() => router.push('/addBankAccount')}
            className="mt-2 flex-row items-center">
            <Text className="font-bold text-sm text-[#697281] ">Add Bank Account</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <View className="absolute bottom-8 left-5 right-5">
        <Button onPress={() => router.push('/bankSummary')} title="Withdrawal" />
      </View>
    </Container>
  );
};

export default ManageBankScreen;
