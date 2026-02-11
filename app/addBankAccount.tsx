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

const AddBankScreen = () => {
  const router = useRouter();

  const [formData, setFormData] = useState({
    holderName: '',
    accountNumber: '',
    ifsc: '',
    branch: '',
  });

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
          <Text className="font-bold text-lg text-gray-500">Add Bank Account</Text>
          <TouchableOpacity>
            <Bell color="#EF4444" size={24} fill="#EF4444" />
          </TouchableOpacity>
        </View>

         <ScrollView
          showsVerticalScrollIndicator={false}
          className="mt-4"
          contentContainerStyle={{ flexGrow: 1 }}>
          <View className="space-y-5">
            {/* Holder Name */}
            <View>
              <Text className="mb-2 font-bold text-sm text-gray-700">Bank Account Holder Name</Text>
              <TextInput
                placeholder="Enter holder name"
                className="rounded-xl border border-gray-200 bg-gray-50 p-4 text-base"
                value={formData.holderName}
                onChangeText={(txt) => setFormData({ ...formData, holderName: txt })}
              />
            </View>

            {/* Account Number */}
            <View>
              <Text className="mb-2 font-bold text-sm text-gray-700">Bank Account No.</Text>
              <TextInput
                placeholder="Enter account number"
                keyboardType="numeric"
                className="rounded-xl border border-gray-200 bg-gray-50 p-4 text-base"
                value={formData.accountNumber}
                onChangeText={(txt) => setFormData({ ...formData, accountNumber: txt })}
              />
            </View>

            {/* IFSC Code */}
            <View>
              <Text className="mb-2 font-bold text-sm text-gray-700">IFSC Code</Text>
              <TextInput
                placeholder="Enter IFSC code"
                autoCapitalize="characters"
                className="rounded-xl border border-gray-200 bg-gray-50 p-4 text-base"
                value={formData.ifsc}
                onChangeText={(txt) => setFormData({ ...formData, ifsc: txt })}
              />
            </View>

            {/* Branch Name */}
            <View>
              <Text className="mb-2 font-bold text-sm text-gray-700">Branch Name</Text>
              <TextInput
                placeholder="Enter branch name"
                className="rounded-xl border border-gray-200 bg-gray-50 p-4 text-base"
                value={formData.branch}
                onChangeText={(txt) => setFormData({ ...formData, branch: txt })}
              />
            </View>
          </View>

          <Text className="mt-6 text-xs leading-5 text-gray-400">
            Make sure you enter the correct details. This information will be used for all future
            withdrawals.
          </Text>
 
          <View className="flex-1" />

          
          <View className="pb-6 pt-4">
            <Button
              title="Save Bank Account"
              onPress={() => {
                if (!formData.holderName || !formData.accountNumber)
                  return alert('Details bharo bhai!');

                router.replace({
                  pathname: '/ManageBankScreen',
                  params: {
                    newBankName: 'New Bank Added',
                    newAcc: formData.accountNumber,
                  },
                });
              }}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Container>
  );
};

export default AddBankScreen;
