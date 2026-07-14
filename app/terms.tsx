import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StatusBar,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

interface TermSectionProps {
  number: string;
  title: string;
  content: string;
  bullets?: string[];
}

const TermSection = ({ number, title, content, bullets }: TermSectionProps) => (
  <View className="mb-6 rounded-2xl border border-[#F3F4F6] bg-white p-5 shadow-sm">
    <View className="mb-3 flex-row items-center">
      <View className="mr-3 items-center justify-center rounded-xl bg-[#E23744]/10 h-8 w-8">
        <Text className="font-bold text-sm text-[#E23744]">{number}</Text>
      </View>
      <Text className="flex-1 font-sans font-bold text-lg text-[#1C1C1C]">
        {title}
      </Text>
    </View>
    <Text className="font-sans text-sm leading-6 text-[#6B7280]">
      {content}
    </Text>
    {bullets && bullets.length > 0 && (
      <View className="mt-3 pl-2">
        {bullets.map((bullet, index) => (
          <View key={index} className="mb-2 flex-row items-start">
            <Text className="mr-2 text-[#E23744] font-bold">•</Text>
            <Text className="flex-1 font-sans text-sm leading-5 text-[#6B7280]">
              {bullet}
            </Text>
          </View>
        ))}
      </View>
    )}
  </View>
);

export default function TermsAndConditions() {
  return (
    <SafeAreaView className="flex-1 bg-white">
      <StatusBar barStyle="dark-content" />

      {/* Header */}
      <View className="flex-row items-center border-b border-[#F3F4F6] px-4 py-4">
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => router.back()}
          className="mr-4 rounded-xl border border-[#E5E7EB] p-2"
        >
          <Ionicons name="chevron-back" size={20} color="#1C1C1C" />
        </TouchableOpacity>
        <Text className="font-sans font-bold text-xl text-[#1C1C1C]">
          Terms & Conditions
        </Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 20, paddingBottom: 40 }}
      >
        {/* Intro */}
        <View className="mb-6">
          <View className="mb-2 self-start rounded-full bg-[#E23744]/10 px-3 py-1">
            <Text className="font-semibold text-xs text-[#E23744]">
              Last Updated: July 2026
            </Text>
          </View>
          <Text className="font-sans font-bold text-2xl text-[#1C1C1C]">
            FitFob Owner Terms
          </Text>
          <Text className="mt-2 font-sans text-sm leading-5 text-[#6B7280]">
            Please read these terms carefully before registering and listing your club/gym facilities on the FitFob platform. By using the FitFob Owner App, you agree to these Terms.
          </Text>
        </View>

        {/* Sections */}
        <TermSection
          number="1"
          title="Account Creation & Verification"
          content="To list your facilities, you must create a FitFob Owner account. You are responsible for ensuring that all data uploaded is accurate and current. FitFob reserves the right to suspend accounts with incomplete or unverifiable documents."
          bullets={[
            'Provide valid government/business licenses.',
            'Maintain safe and secure login credentials.',
            'Notify support immediately of any unauthorized account access.'
          ]}
        />

        <TermSection
          number="2"
          title="Club Listings & Schedule"
          content="As a club owner, you represent that you have legal authorization to list facilities. You agree to maintain high standards of cleanliness, safety, and operation as represented in your listings."
          bullets={[
            'Photos uploaded must represent the actual condition of the gym.',
            'Schedules and slot availability must be kept up to date.',
            'Any sudden changes or closures must be communicated to the members immediately.'
          ]}
        />

        <TermSection
          number="3"
          title="Payments, Fees & Payouts"
          content="FitFob processes customer bookings and releases funds to the designated bank accounts based on the billing frequency selected. FitFob charges a platform commission on bookings as agreed during onboarding."
          bullets={[
            'Payouts are subject to verification of bank accounts.',
            'FitFob is not responsible for delayed payouts due to bank issues or wrong input details.',
            'All taxes applicable on local earnings are the responsibility of the owner.'
          ]}
        />

        <TermSection
          number="4"
          title="Cancellation & Refund Policies"
          content="If a session or slot is cancelled by the club owner, FitFob reserves the right to issue a full refund to the user and deduct matching booking payouts or commission shares from the owner's balance."
        />

        <TermSection
          number="5"
          title="User Safety & Rules of Conduct"
          content="Owners must maintain an inclusive and respectful environment. Any report of misconduct, discrimination, or unsafe operations will result in immediate termination of partnership."
        />

        <TermSection
          number="6"
          title="Amendments to Terms"
          content="FitFob reserves the right to update these terms at any time. Changes will be notified through app updates. Continuing to use the platform post updates signifies your acceptance of the revised Terms."
        />
      </ScrollView>

      {/* Understood Action Button */}
      <View className="border-t border-[#F3F4F6] px-5 py-4">
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => router.back()}
          className="h-14 w-full items-center justify-center rounded-2xl bg-[#E23744]"
        >
          <Text className="font-bold text-base text-white">I Agree & Accept</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
