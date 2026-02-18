import { Button } from '@/components/Button';
import { Container } from '@/components/Container';
import OnBoarding1 from '@/components/screen/OnBoarding1';
import OnBoarding2_Part2 from '@/components/screen/OnBoarding2';
import OnBoarding2_Details from '@/components/screen/OnBoarding2_Details';
import OnBoarding3 from '@/components/screen/OnBoarding3';
import OnBoarding4 from '@/components/screen/OnBoarding4';
import { KeyboardAwareScrollView } from '@pietile-native-kit/keyboard-aware-scrollview';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { TouchableOpacity, View } from 'react-native';

export default function OnBoardingStep() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [subStep, setSubStep] = useState(1);
  const [isFinished, setIsFinished] = useState(false);
  const totalSteps = 4;

  const handleNext = () => {
    if (step === 2 && subStep === 1) {
      setSubStep(2);
      return;
    }

    if (step < totalSteps) {
      setStep(step + 1);
      setSubStep(1);
    } else if (step === totalSteps && !isFinished) {
      setIsFinished(true);
    } else {
      router.replace('/ReviewStatusScreen');
    }
  };

  const handleBackPress = (targetStep: number) => {
    if (targetStep < step) {
      setStep(targetStep);
      setSubStep(1);
    }
  };

  return (
    <Container>
      {/* PROGRESS BAR */}
      <View className="ios:mt-1 mt-4 flex-row justify-between bg-white pb-2  ">
        {[1, 2, 3, 4].map((item) => {
          let bgColor =
            item === step
              ? 'bg-primary border-2 border-[#FFC1C1] h-4'
              : item < step
                ? 'bg-[#FFC1C1] h-3'
                : 'border h-3 border-border';

          return (
            <TouchableOpacity
              key={item}
              onPress={() => handleBackPress(item)}
              activeOpacity={0.7}
              disabled={item >= step}
              className="mx-1 flex-1 justify-center">
              <View className={`w-full rounded-full ${bgColor}`} />
            </TouchableOpacity>
          );
        })}
      </View>

      <KeyboardAwareScrollView
        style={{ flex: 1, backgroundColor: 'white' }}
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>
        <View className=" mt-5 flex-1">
          {step === 1 && <OnBoarding1 />}

          {step === 2 && (subStep === 1 ? <OnBoarding2_Part2 /> : <OnBoarding2_Details />)}

          {step === 3 && <OnBoarding3 />}
          {step  === 4 && <OnBoarding4 />}
        </View>

        <View className="">
          <Button
            title={step === totalSteps && subStep === 2 ? 'Submit' : 'Next'}
            onPress={handleNext}
          />
        </View>
      </KeyboardAwareScrollView>
    </Container>
  );
}
