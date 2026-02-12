/* eslint-disable react/no-unescaped-entities */
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  ScrollView,
  Switch,
  SafeAreaView,
  Alert,
  KeyboardAvoidingView, 
  Platform, 
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { Button } from '@/components/Button';
import { LinearGradient } from 'expo-linear-gradient';

const EditClubDetails = () => {
  const router = useRouter();

  const [clubImage, setClubImage] = useState('https://i.pravatar.cc/150?u=fitness');
  const [clubName, setClubName] = useState('Lois');
  const [ownerName, setOwnerName] = useState('Rohan Mehta');
  const [phone, setPhone] = useState('9400000000');
  const [email, setEmail] = useState('Loisbecket@gmail.com');
  const [isVerified, setIsVerified] = useState(true);
  const [weekdays, setWeekdays] = useState('05:00 AM - 11:00 PM');
  const [weekends, setWeekends] = useState('06:00 AM - 10:00 PM');

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });

    if (!result.canceled) {
      setClubImage(result.assets[0].uri);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
       <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        {/* HEADER */}
        <View className="flex-row items-center px-4 py-3">
          <TouchableOpacity onPress={() => router.back()} className="p-1">
            <Ionicons name="chevron-back" size={24} color="black" />
          </TouchableOpacity>
          <Text className="mr-6 flex-1 text-center font-semibold text-base text-slate-600">
            Edit Club Details
          </Text>
        </View>

        <ScrollView 
          showsVerticalScrollIndicator={false} 
          className="px-6"
          contentContainerStyle={{ paddingBottom: 20 }}  
        >
          {/* PROFILE IMAGE SECTION */}
          <View className="my-6 items-center">
            <TouchableOpacity onPress={pickImage} className="relative">
              <View className="h-32 w-32 items-center justify-center overflow-hidden rounded-full border-4 border-slate-50 bg-purple-600">
                <Image source={{ uri: clubImage }} className="h-full w-full" />
              </View>
              <View className="absolute bottom-1 right-1 rounded-full border-2 border-white bg-[#F6163C] p-2">
                <Ionicons name="camera" size={16} color="white" />
              </View>
            </TouchableOpacity>
          </View>

          {/* FORM FIELDS */}
          <View className="space-y-4">
            <View>
              <Text className="mb-2 ml-1 mt-2 font-sans text-sm text-slate-500">Gym/ Club Name</Text>
              <TextInput
                value={clubName}
                onChangeText={setClubName}
                className="h-12 rounded-xl border border-slate-200 bg-white px-4 text-slate-800"
              />
            </View>

            <View>
              <Text className="mb-2 ml-1 mt-4 font-sans text-sm text-slate-500">Owner's name</Text>
              <TextInput
                value={ownerName}
                onChangeText={setOwnerName}
                className="h-12 rounded-xl border border-slate-200 bg-white px-4 text-slate-800"
              />
            </View>

            <View>
              <Text className="mb-2 ml-1 mt-4 font-sans text-sm text-slate-500">Phone Number</Text>
              <View className="h-12 flex-row items-center rounded-xl border border-slate-200 bg-white px-3">
                <Image
                  source={{ uri: 'https://flagcdn.com/w40/in.png' }}
                  className="mr-2 h-4 w-6 rounded-sm"
                />
                <Ionicons name="chevron-down" size={14} color="#64748B" />
                <LinearGradient
                  colors={['rgba(28, 28, 28, 0)', 'rgba(28, 28, 28, 0.2)', 'rgba(28, 28, 28, 0)']}
                  style={{ width: 1.2, height: '50%', marginHorizontal: 8 }}
                />
                <TextInput
                  value={phone}
                  keyboardType="numeric"
                  onChangeText={setPhone}
                  className="flex-1 text-slate-800"
                />
              </View>
            </View>

            <View>
              <Text className="mb-2 ml-1 mt-4 font-sans text-sm text-slate-500">Email Address</Text>
              <TextInput
                value={email}
                keyboardType="email-address"
                onChangeText={setEmail}
                className="h-12 rounded-xl border border-slate-200 bg-white px-4 text-slate-800"
              />
            </View>

            <View className="mt-4 flex-row items-center justify-between rounded-xl border border-slate-100 bg-white p-4 shadow-sm shadow-slate-100">
              <Text className="font-medium text-sm text-slate-400">Verification Status</Text>
              <Switch
                value={isVerified}
                onValueChange={setIsVerified}
                trackColor={{ false: '#E2E8F0', true: '#4ADE80' }}
                thumbColor={'white'}
              />
            </View>

            <View className="mb-4">
              <Text className="mb-2 ml-1 mt-4 font-sans text-sm text-slate-500">Weekdays</Text>
              <View className="h-12 flex-row items-center rounded-xl border border-slate-200 bg-white px-4">
                <TextInput value={weekdays} onChangeText={setWeekdays} className="flex-1 text-slate-800" />
                <MaterialCommunityIcons name="clock-outline" size={20} color="#64748B" />
              </View>
            </View>

            <View className="mb-4">
              <Text className="mb-2 ml-1 mt-4 font-sans text-sm text-slate-500">Weekends</Text>
              <View className="h-12 flex-row items-center rounded-xl border border-slate-200 bg-white px-4">
                <TextInput value={weekends} onChangeText={setWeekends} className="flex-1 text-slate-800" />
                <MaterialCommunityIcons name="clock-outline" size={20} color="#64748B" />
              </View>
            </View>
          </View>
        </ScrollView>

         <View className=" px-6 py-4  flex-row gap-3">
          <View className="flex-1">
            <Button title={'Save'} onPress={() => Alert.alert('Success', 'Details updated!')} />
          </View>
          <View className="flex-1">
            <Button variant="secondary" title={'Cancel'} onPress={() => router.back()} />
          </View>
        </View>

      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default EditClubDetails;