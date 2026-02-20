/* eslint-disable no-unused-expressions */
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
  Alert,
  KeyboardAvoidingView,
  Platform,
  Modal,
} from 'react-native';
import { Ionicons, } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { Button } from '@/components/Button';
import { Container } from '@/components/Container';
import DateTimePicker from '@react-native-community/datetimepicker';

const EditClubDetails = () => {
  const router = useRouter();

  // --- FORM STATES ---
  const [clubImage, setClubImage] = useState('https://i.pravatar.cc/150?u=fitness');
  const [clubName, setClubName] = useState('Lois');
  const [ownerName, setOwnerName] = useState('Rohan Mehta');
  const [phone, setPhone] = useState('9400000000');
  const [email, setEmail] = useState('Loisbecket@gmail.com');
  const [isVerified, setIsVerified] = useState(true);

  // --- TIME & DAY STATES ---
  const [weekdayRange, setWeekdayRange] = useState('Monday to Friday');
  const [weekendRange, setWeekendRange] = useState('Saturday & Sunday');
  const [startTime, setStartTime] = useState(new Date().setHours(5, 0));
  const [endTime, setEndTime] = useState(new Date().setHours(22, 0));

  const [showPicker, setShowPicker] = useState<'start' | 'end' | null>(null);
  const [showDayModal, setShowDayModal] = useState<'weekday' | 'weekend' | null>(null);

  const weekdayOptions = ['Monday to Friday', 'Monday to Saturday', 'Monday to Sunday', 'Monday to Thursday'];
  const weekendOptions = ['Saturday & Sunday', 'Sunday Only', 'Saturday Only', 'Closed'];

  const formatTimeParts = (timeValue: any) => {
    const date = new Date(timeValue);
    let hours = date.getHours();
    const minutes = date.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12 || 12;
    const strHours = hours < 10 ? `0${hours}` : hours;
    const strMinutes = minutes < 10 ? `0${minutes}` : minutes;
    return { time: `${strHours}:${strMinutes}`, ampm };
  };

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    if (!result.canceled) setClubImage(result.assets[0].uri);
  };

  return (
    <Container>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        
        {/* HEADER */}
        <View className="flex-row items-center py-3">
          <TouchableOpacity onPress={() => router.back()} className="p-1">
            <Ionicons name="chevron-back" size={24} color="black" />
          </TouchableOpacity>
          <Text className="mr-6 flex-1 text-center font-semibold text-base text-slate-600">
            Edit Club Details
          </Text>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} className="flex-1" contentContainerStyle={{ paddingBottom: 40 }}>
          {/* PROFILE IMAGE */}
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

          {/* FORM FIELDS - ALL SET TO h-14 */}
          <View className="px-1">
            <Text className="mb-2 ml-1 text-sm text-[#697281] leading-5 font-sans">Gym/ Club Name</Text>
            <TextInput
              value={clubName}
              onChangeText={setClubName}
              className="mb-5 h-14 rounded-xl border border-slate-200 bg-white px-4 text-base text-slate-800 "
            />

            <Text className="mb-2 ml-1 text-sm text-[#697281] leading-5 font-sans">Owner's Name</Text>
            <TextInput
              value={ownerName}
              onChangeText={setOwnerName}
              className="mb-5 h-14 rounded-xl border border-slate-200 bg-white px-4 text-base text-slate-800 "
            />

            <Text className="mb-2 ml-1 text-sm text-[#697281] leading-5 font-sans">Phone Number</Text>
            <View className="mb-5 h-14 flex-row items-center rounded-xl border border-slate-200 bg-white px-3 ">
              <Image source={{ uri: 'https://flagcdn.com/w40/in.png' }} className="mr-2 h-4 w-6 rounded-sm" />
              <Ionicons name="chevron-down" size={14} color="#64748B" />
              <View style={{ width: 1, height: '40%', backgroundColor: '#E2E8F0', marginHorizontal: 12 }} />
              <TextInput
                value={phone}
                keyboardType="numeric"
                onChangeText={setPhone}
                className="flex-1 text-base text-slate-800"
              />
            </View>

            <Text className="mb-2 ml-1 text-sm text-[#697281] leading-5 font-sans">Email Address</Text>
            <TextInput
              value={email}
              keyboardType="email-address"
              onChangeText={setEmail}
              className="mb-5 h-14 rounded-xl border border-slate-200 bg-white px-4 text-base text-slate-800"
            />

            <View className="mb-8 flex-row items-center justify-between rounded-xl border border-slate-100 bg-white p-4 ">
              <Text className="font-medium text-sm text-slate-500">Verification Status</Text>
              <Switch
                value={isVerified}
                onValueChange={setIsVerified}
                trackColor={{ false: '#E2E8F0', true: '#4ADE80' }}
                thumbColor={'white'}
              />
            </View>

            {/* TIMINGS SECTION */}
            <Text className="mb-4 ml-1 font-bold text-xs uppercase  text-[]">Working Hours</Text>
            <View className="mb-6 flex-row items-center justify-between gap-3">
              <TouchableOpacity
                onPress={() => setShowPicker(showPicker === 'start' ? null : 'start')}
                className={`h-14 flex-1 flex-row items-center justify-between rounded-xl px-4 border ${showPicker === 'start' ? 'border-[#F6163C] bg-red-50' : 'border-slate-200 bg-white'} `}>
                <Text className="font-bold text-base text-slate-900">{formatTimeParts(startTime).time}</Text>
                <Text className="font-bold text-[10px] uppercase text-slate-400">{formatTimeParts(startTime).ampm}</Text>
              </TouchableOpacity>

              <Text className="font-bold text-xs italic text-slate-300">To</Text>

              <TouchableOpacity
                onPress={() => setShowPicker(showPicker === 'end' ? null : 'end')}
                className={`h-14 flex-1 flex-row items-center justify-between rounded-xl px-4 border ${showPicker === 'end' ? 'border-[#F6163C] bg-red-50' : 'border-slate-200 bg-white'} `}>
                <Text className="font-bold text-base text-slate-900">{formatTimeParts(endTime).time}</Text>
                <Text className="font-bold text-[10px] uppercase text-slate-400">{formatTimeParts(endTime).ampm}</Text>
              </TouchableOpacity>
            </View>

            {showPicker && (
              <View className="mb-6 rounded-2xl border border-slate-100 bg-slate-50 p-2 ">
                <View className="flex-row items-center justify-between px-4 py-2">
                  <Text className="font-bold text-[10px] uppercase text-slate-400">Set {showPicker} Time</Text>
                  {Platform.OS === 'ios' && (
                    <TouchableOpacity onPress={() => setShowPicker(null)}>
                      <Text className="font-bold text-[#F6163C]">Done</Text>
                    </TouchableOpacity>
                  )}
                </View>
                <DateTimePicker
                  value={new Date(showPicker === 'start' ? startTime : endTime)}
                  mode="time"
                  is24Hour={false}
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  onChange={(e, date) => {
                    if (Platform.OS === 'android') setShowPicker(null);
                    if (date) showPicker === 'start' ? setStartTime(date.getTime()) : setEndTime(date.getTime());
                  }}
                  style={{ height: 120 }}
                  textColor="#F6163C"
                />
              </View>
            )}

            {/* DAY SELECTORS - Also h-14 */}
            <Text className="mb-2 ml-1 text-sm text-[#697281] leading-5 font-sans">Weekdays Schedule</Text>
            <TouchableOpacity
              onPress={() => setShowDayModal('weekday')}
              className="mb-5 h-14 flex-row items-center justify-between rounded-xl border border-slate-200 bg-white px-4 ">
              <Text className="text-base text-slate-800">{weekdayRange}</Text>
              <Ionicons name="chevron-down" size={20} color="#64748B" />
            </TouchableOpacity>

            <Text className="mb-2 ml-1 text-sm text-[#697281] leading-5 font-sans">Weekends Schedule</Text>
            <TouchableOpacity
              onPress={() => setShowDayModal('weekend')}
              className="mb-10 h-14 flex-row items-center justify-between rounded-xl border border-slate-200 bg-white px-4 ">
              <Text className="text-base text-slate-800">{weekendRange}</Text>
              <Ionicons name="chevron-down" size={20} color="#64748B" />
            </TouchableOpacity>
          </View>
        </ScrollView>

        {/* BOTTOM BUTTONS */}
        <View className="flex-row gap-3 border-t border-slate-100 bg-white px-6 py-4">
          <View className="flex-1">
            <Button title={'Save Changes'} onPress={() => Alert.alert('Success', 'Details updated!')} />
          </View>
          <View className="flex-1">
            <Button variant="secondary" title={'Cancel'} onPress={() => router.back()} />
          </View>
        </View>

      </KeyboardAvoidingView>

      {/* --- DAY MODAL --- */}
      <Modal visible={!!showDayModal} transparent animationType="slide">
        <TouchableOpacity className="flex-1 justify-end bg-black/40" activeOpacity={1} onPress={() => setShowDayModal(null)}>
          <View className="rounded-t-[32px] bg-white p-6 pb-12 shadow-2xl">
            <View className="mb-6 h-1.5 w-12 self-center rounded-full bg-slate-200" />
            <Text className="mb-6 text-center font-bold text-lg text-slate-800">Select Range</Text>
            {(showDayModal === 'weekday' ? weekdayOptions : weekendOptions).map((option) => (
              <TouchableOpacity
                key={option}
                onPress={() => {
                  showDayModal === 'weekday' ? setWeekdayRange(option) : setWeekendRange(option);
                  setShowDayModal(null);
                }}
                className="flex-row items-center justify-between border-b border-slate-50 py-4">
                <Text className={`text-base ${(showDayModal === 'weekday' ? weekdayRange : weekendRange) === option ? 'font-bold text-[#F6163C]' : 'text-slate-700'}`}>
                  {option}
                </Text>
                {(showDayModal === 'weekday' ? weekdayRange : weekendRange) === option && <Ionicons name="checkmark-circle" size={24} color="#F6163C" />}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
    </Container>
  );
};

export default EditClubDetails;