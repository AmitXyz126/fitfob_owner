import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Container } from '@/components/Container';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'other';
  time: string;
}

export default function ChatScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: "Hi, can I book a morning slots available. I'll book you",
      sender: 'other',
      time: '5:10 AM',
    },
    {
      id: '2',
      text: "Sure, we have morning slots available. I'll book in for 7 AM tomorrow.",
      sender: 'user',
      time: '5:40 AM',
    },
  ]);
  const [inputText, setInputText] = useState('');
  const flatListRef = useRef<FlatList>(null);

  const handleSend = () => {
    if (inputText.trim() === '') return;

    const now = new Date();
    let hours = now.getHours();
    const minutes = now.getMinutes().toString().padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12; // the hour '0' should be '12'
    const timeString = `${hours}:${minutes} ${ampm}`;

    const newMessage: Message = {
      id: Date.now().toString(),
      text: inputText.trim(),
      sender: 'user',
      time: timeString,
    };

    setMessages((prev) => [...prev, newMessage]);
    setInputText('');

    // Scroll to bottom
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  const renderMessageItem = ({ item }: { item: Message }) => {
    const isMe = item.sender === 'user';
    return (
      <View className={`mb-4 flex-row ${isMe ? 'justify-end' : 'justify-start'}`}>
        <View className="max-w-[75%]">
          <View
            className={`rounded-2xl px-4 py-3 ${
              isMe ? 'bg-[#F4F6F9] rounded-tr-none' : 'bg-[#F4F6F9] rounded-tl-none'
            }`}
          >
            <Text className="font-sans text-[14px] font-normal leading-[20px] text-[#1C1C1C]">
              {item.text}
            </Text>
          </View>
          <Text
            className={`font-sans text-[10px] text-slate-400 mt-1 ${
              isMe ? 'text-right mr-1' : 'text-left ml-1'
            }`}
          >
            {item.time}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <Container style={{ flex: 1, backgroundColor: '#FFF' }}>
      {/* Header */}
      <View className="flex-row items-center justify-between py-3">
        <TouchableOpacity
          onPress={() => router.back()}
          className="h-10 w-10 items-center justify-center rounded-full active:bg-gray-100"
        >
          <Ionicons name="chevron-back" size={24} color="#1C1C1C" />
        </TouchableOpacity>

        <Text className="font-sans font-bold text-[18px] text-[#1C1C1C] text-center flex-1 mr-10">
          Chat
        </Text>
      </View>

      {/* Gym Profile info */}
      <View className="flex-row items-center border-b border-[#F1F3F5] pb-4 px-1 mt-2">
        <View className="h-12 w-12 items-center justify-center rounded-2xl bg-[#7C3AED]">
          <Ionicons name="walk" size={26} color="#FFF" />
        </View>
        <View className="ml-3 flex-1">
          <Text className="font-sans font-bold text-[16px] text-[#1C1C1C]">
            Fitfob Fitness Gym
          </Text>
          <Text className="font-sans text-[12px] font-semibold text-[#10B981]">
            Online
          </Text>
        </View>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.OS === 'ios' ? insets.bottom : 0}
      >
        {/* Message List */}
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessageItem}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingVertical: 16 }}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
          className="flex-1"
        />

        {/* Input Area */}
        <View 
          style={{ 
            paddingBottom: insets.bottom > 0 ? insets.bottom : 8,
            backgroundColor: '#FFF'
          }}
        >
          <View className="flex-row items-center bg-white border border-[#E2E8F0] rounded-full p-2 shadow-sm">
            <TouchableOpacity className="p-2">
              <Ionicons name="happy-outline" size={24} color="#94A3B8" />
            </TouchableOpacity>
            <TextInput
              placeholder="Type message here..."
              placeholderTextColor="#94A3B8"
              className="flex-1 px-2 py-1 text-slate-800 text-[14px]"
              value={inputText}
              onChangeText={setInputText}
              onSubmitEditing={handleSend}
            />
            <TouchableOpacity
              onPress={handleSend}
              className="h-10 w-10 items-center justify-center rounded-full bg-[#F6163C]"
            >
              <Ionicons name="send" size={16} color="#FFF" />
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Container>
  );
}
