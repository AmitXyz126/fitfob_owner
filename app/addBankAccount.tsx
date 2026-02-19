import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { ChevronLeft, Bell } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { Container } from '@/components/Container';
import { Button } from '@/components/Button';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const AddBankScreen = () => {
  const router = useRouter();

  const [isPrimary, setIsPrimary] = useState(false);
  const [formData, setFormData] = useState({
    accountNumber: '',
    confirmAccountNumber: '',
    ifsc: '',
  });

   const isFormValid = 
    formData.accountNumber.trim().length > 0 && 
    formData.confirmAccountNumber.trim().length > 0 && 
    formData.ifsc.trim().length > 0;

  return (
    <Container>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}>
        
        {/* Header */}
        <View className="flex-row items-center justify-between py-4">
          <TouchableOpacity onPress={() => router.back()}>
            <ChevronLeft color="black" size={24} />
          </TouchableOpacity>
          <Text className="font-medium text-base text-[#697281]">Add Bank Account</Text>
          <TouchableOpacity>
            <Bell color="#F6163C" size={24} fill="#F6163C" />
          </TouchableOpacity>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          className="mt-4"
          contentContainerStyle={{ flexGrow: 1 }}>
          
          <Text className="text-xl font-sans font-medium text-[#1C1C1C] mb-6">Add Bank Account</Text>

          <View className="space-y-5">
            {/* Account Number */}
            
            <View>
              <Text className="mb-2 ml-1 mt-4 font-sans text-sm leading-sm text-secondaryText">
                Bank Account Number
              </Text>
              <TextInput
                placeholder="Loisbecket@gmail.com"
                placeholderTextColor="#cbd5e1"
                 className="rounded-xl border border-gray-200 bg-gray-50 p-4 text-base text-slate-800"
                value={formData.accountNumber}
                onChangeText={(txt) => setFormData({ ...formData, accountNumber: txt })}
              />
            </View>

            {/* Confirm Account Number */}
            <View>
              <Text className="mb-2 ml-1 mt-4 font-sans text-sm leading-sm text-secondaryText">
                Confirm Bank Account Number
              </Text>
              <TextInput
                placeholder="Loisbecket@gmail.com"
                placeholderTextColor="#cbd5e1"
                className="rounded-xl border border-gray-200 bg-gray-50 p-4 text-base text-slate-800"
                value={formData.confirmAccountNumber}
                onChangeText={(txt) => setFormData({ ...formData, confirmAccountNumber: txt })}
              />
            </View>

            {/* IFSC Code */}
            <View>
              <Text className="mb-2 ml-1 mt-4 font-sans text-sm leading-sm text-secondaryText">
                IFSC Code
              </Text>
              <TextInput
                placeholder="Loisbecket@gmail.com"
                placeholderTextColor="#cbd5e1"
                autoCapitalize="characters"
                className="rounded-xl border border-gray-200 bg-gray-50 p-4 text-base text-slate-800"
                value={formData.ifsc}
                onChangeText={(txt) => setFormData({ ...formData, ifsc: txt })}
              />
            </View>
          </View>

          {/* Checkbox Section */}
          <TouchableOpacity 
            onPress={() => setIsPrimary(!isPrimary)}
            activeOpacity={0.7}
            className="flex-row items-center mt-3 ml-1"
          >
            <MaterialCommunityIcons 
              name={isPrimary ? "checkbox-marked" : "checkbox-blank-outline"} 
              size={24} 
              color={isPrimary ? "#F6163C" : "#D1D5DB"} 
            />
            <Text className="ml-1 text-[#666D6D] text-sm font-normal">Set this as my Primary Bank Account</Text>
          </TouchableOpacity>

          {/* Info Box */}
          <View className="mt-4 bg-[#F6F6F6] p-5 rounded-2xl ">
            <Text className="text-gray-400 text-xs font-semibold  leading-3">
              All your dividends and default payouts will be deposited to this bank account
            </Text>
          </View>

          <View className="flex-1" />

          {/* Continue Button */}
          <View className="pb-8 pt-4">
            <Button
              title="Continue"
              disabled={!isFormValid}
               style={{ backgroundColor: isFormValid ? '#F6163C' : '#E5E7EB' }}
              onPress={() => {
                router.push('/ManageBankScreen');
              }}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Container>
  );
};

export default AddBankScreen;