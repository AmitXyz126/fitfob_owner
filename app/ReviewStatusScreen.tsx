import { View, Text, TouchableOpacity, Image } from 'react-native';
import { Container } from '@/components/Container';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '@/components/Button';
import { router } from 'expo-router';

export default function ReviewStatusScreen() {
  return (
    <Container style={{ flex: 1 }}>
      {/* Back Button */}
      <TouchableOpacity className="ml-2 mt-5 p-2">
        <Ionicons name="chevron-back" size={24} color="#CBD5E1" />
      </TouchableOpacity>

      <View className="flex-1 items-center justify-center px-6">
        <Text className="text-center font-bold font-sans text-[24px] leading-8 text-[#1C1C1C]">
          We’re reviewing your submission
        </Text>

        <Text className="mt-2 text-center font-sans text-[12px] font-normal  leading-6 text-slate-500">
          We need more time to verify your identity. This may be due to your document requiring
          manual review or delays with our third-party partner. We’ll update you once the review is
          complete.
        </Text>
        {/* Megaphone Icon */}
        <Image
          className="mt-3"
          source={require('../assets/images/submission.png')}
          style={{ width: 124, height: 124 }}
          resizeMode="contain"
        />
      </View>

      <View className="mb-6 px-6">
        <Button title="Done" onPress={() => router.replace('/OnBoarding5')} />
      </View>
    </Container>
  );
}
