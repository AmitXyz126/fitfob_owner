import React, { useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';

import { Button } from '@/components/Button';
import { Container } from '@/components/Container';
import { KeyboardAwareScrollView } from '@pietile-native-kit/keyboard-aware-scrollview';
import OnBoarding1 from '../../components/screen/OnBoarding1';
import OnBoarding2 from '@/components/screen/OnBoarding2';

import { useRouter } from 'expo-router';
import OnBoarding3 from '@/components/screen/OnBoarding3';

export default function OnBoardingStep() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const totalSteps = 5;

  const handleNext = () => {
    if (step < totalSteps) setStep(step + 1);
    else {
      router.replace('/(tabs)');
    }
  };

  return (
    <Container>
      {/* --- FIXED PROGRESS BAR (Sticky) --- */}
      <View className="ios:mt-1 mt-4 flex-row justify-between  bg-white pb-2">
        {[1, 2, 3, 4, 5].map((item) => {
          let bgColor = ' ';
          if (item === step) bgColor = 'bg-primary border-2 border-[#FFC1C1] h-4';
          else if (item < step) bgColor = 'bg-[#FFC1C1] h-3';
          else bgColor = 'border h-3 border-border';

          return (
            <TouchableOpacity
              key={item}
              onPress={() => item < step && setStep(item)}
              disabled={item >= step}
              className="mx-1 h-auto flex-1 justify-center"
              activeOpacity={0.7}>
              <View className={`w-full rounded-full ${bgColor}`} />
            </TouchableOpacity>
          );
        })}
      </View>

      {/* --- SCROLLABLE CONTENT --- */}
      <KeyboardAwareScrollView
        style={{ flex: 1, backgroundColor: 'white' }}
        contentContainerStyle={{ flexGrow: 1,}}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled">
        
        <View className="mt-6 flex-1">
          {step === 1 && <OnBoarding1 />}
          {step === 2 && <OnBoarding2 />}
          {step === 3 && <OnBoarding3 />}
          {step === 4 && <SelfieStep />}
          {step === 5 && <IDUploadStep />}
        </View>

        <View className="mb-10 mt-auto pt-6">
          <Button
            title={step === 4 ? 'Take Photo' : step === 5 ? 'Submit' : 'Next'}
            onPress={handleNext}
          />
        </View>
      </KeyboardAwareScrollView>
    </Container>
  );
}

const SelfieStep = () => (
  <View>
    <Text className="font-bold text-2xl">Upload a Selfie</Text>
  </View>
);
const IDUploadStep = () => (
  <View>
    <Text className="font-bold text-2xl">Verify your ID</Text>
  </View>
);
