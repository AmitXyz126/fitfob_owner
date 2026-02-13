/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Image } from 'react-native';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { Container } from '../Container';

const OnBoarding1 = () => {
  const [clubName, setClubName] = useState('Lois');
  const [ownerName, setOwnerName] = useState('Rohan Mehta');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('Loisbecket@gmail.com');
  const [image, setImage] = useState<string | null>(null);

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
    });
    if (!result.canceled) setImage(result.assets[0].uri);
  };

  return (
    <>
      <Text className="mb-8 font-bold text-[24px] text-[#1C1C1C]">Fill your club details</Text>

       <View className="mb-10 items-center">
        <TouchableOpacity onPress={pickImage} activeOpacity={0.8} className="relative">
          <View
            style={{ borderStyle: 'dashed' }}
            className="h-36 w-36 items-center justify-center overflow-hidden rounded-full border-2 border-[#CBD5E1] bg-white">
            {image ? (
              <Image source={{ uri: image }} className="h-full w-full" />
            ) : (
              <View className="items-center justify-center">
                {/* Custom placeholder icon using Ionicons */}
                <Ionicons name="images-outline" size={48} color="#FFC1C1" />
              </View>
            )}
          </View>
          {/* Red Camera Floating Button */}
          <View className="absolute bottom-1 right-2 h-9 w-9 items-center justify-center rounded-full border-2 border-white bg-[#F6163C]">
            <MaterialIcons name="photo-camera" size={18} color="white" />
          </View>
        </TouchableOpacity>
      </View>

      {/* INPUT SECTION */}
      <View className="space-y-4">
        {/* GYM/CLUB NAME */}
        <View>
          <Text className="mb-2 ml-1 font-medium text-[13px] text-slate-500">Gym/ Club Name</Text>
          <TextInput
            value={clubName}
            onChangeText={setClubName}
            placeholder="Enter gym name"
            placeholderTextColor="#94A3B8"
            className="h-14 w-full rounded-xl border border-slate-200 bg-white px-4 font-medium text-[15px] text-slate-900"
          />
        </View>

        <Text className="mb-2 mt-4 font-bold text-[16px] text-[#1C1C1C]">Owner’s details</Text>

        {/* OWNER NAME */}
        <View>
          <Text className="mb-2 ml-1 font-medium text-[13px] text-slate-500">Owner’s name</Text>
          <TextInput
            value={ownerName}
            onChangeText={setOwnerName}
            placeholder="Enter owner name"
            placeholderTextColor="#94A3B8"
            className="h-14 w-full rounded-xl border border-slate-200 bg-white px-4 font-medium text-[15px] text-slate-900"
          />
        </View>

        {/* PHONE NUMBER */}
        <View>
          <Text className="mb-2 ml-1 mt-4 font-medium text-[13px] text-slate-500">Phone Number</Text>
          <View className="h-14 w-full flex-row items-center rounded-xl border border-slate-200 bg-white px-3">
            <View className="mr-3 h-6 flex-row items-center border-r border-slate-200 pr-3">
              <Image
                source={{ uri: 'https://flagcdn.com/w40/in.png' }}
                className="mr-1 h-4 w-6"
                resizeMode="contain"
              />
              <Ionicons name="chevron-down" size={14} color="#64748B" />
            </View>
            <TextInput
              value={phone}
              onChangeText={setPhone}
              keyboardType="numeric"
              placeholder="Enter mobile number"
              placeholderTextColor="#94A3B8"
              className="flex-1 font-medium text-[15px] text-slate-900"
            />
          </View>
        </View>

        {/* EMAIL ADDRESS */}
        <View className="mb-6 mt-4">
          <Text className="mb-2 ml-1 font-medium text-[13px] text-slate-500">Email Address</Text>
          <TextInput
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            placeholder="Enter email address"
            placeholderTextColor="#94A3B8"
            className="h-14 w-full rounded-xl border border-slate-200 bg-white px-4 font-medium text-[15px] text-slate-900"
          />
        </View>
      </View>
    </>
  );
};

export default OnBoarding1;
