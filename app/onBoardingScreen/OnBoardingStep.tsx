import React, { useState } from 'react';
import { View, TouchableOpacity } from 'react-native';

import { Button } from '@/components/Button';
import { Container } from '@/components/Container';
import { KeyboardAwareScrollView } from '@pietile-native-kit/keyboard-aware-scrollview';
import OnBoarding1 from '../../components/screen/OnBoarding1';
import OnBoarding2 from '@/components/screen/OnBoarding2';
import OnBoarding3 from '@/components/screen/OnBoarding3';
import OnBoarding4 from '@/components/screen/OnBoarding4';
import OnBoarding5 from '@/components/screen/OnBoarding5'; // Success Screen

import { useRouter } from 'expo-router';

export default function OnBoardingStep() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [isFinished, setIsFinished] = useState(false); // Success state
  const totalSteps = 4; 

  const handleNext = () => {
    if (step < totalSteps) {
      setStep(step + 1);
    } else if (step === totalSteps && !isFinished) {
      // Step 4 par Submit dabane se Success Screen dikhegi
      setIsFinished(true);
    } else {
      // Success Screen (Finish) dabane par redirect
      router.replace('/(tabs)');
    }
  };

  // Agar Finish ho gaya hai toh sirf Success Screen dikhao
  if (isFinished) {
    return (
      <Container>
        <OnBoarding5 />
        <View className="px-6 pb-10">
          <Button title="Finish" onPress={handleNext} />
        </View>
      </Container>
    );
  }

  return (
    <Container>
      {/* --- PROGRESS BAR (Only 4 dots) --- */}
      <View className="ios:mt-1 mt-4 flex-row justify-between bg-white pb-2">
        {[1, 2, 3, 4].map((item) => {
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

      {/* --- CONTENT --- */}
      <KeyboardAwareScrollView
        style={{ flex: 1, backgroundColor: 'white' }}
        contentContainerStyle={{ flexGrow: 1 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled">
        
        <View className="mt-6 flex-1">
          {step === 1 && <OnBoarding1 />}
          {step === 2 && <OnBoarding2 />}
          {step === 3 && <OnBoarding3 />}
          {step === 4 && <OnBoarding4 />}
        </View>

        <View className="mb-10 mt-auto pt-6">
          <Button
            title={step === totalSteps ? 'Submit' : 'Next'}
            onPress={handleNext}
          />
        </View>
      </KeyboardAwareScrollView>
    </Container>
  );
}