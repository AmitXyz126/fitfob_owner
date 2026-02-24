import { Button } from '@/components/Button';
import { Container } from '@/components/Container';
import OnBoarding1 from '@/components/screen/OnBoarding1';
import OnBoarding2_Part2 from '@/components/screen/OnBoarding2';
import OnBoarding2_Details from '@/components/screen/OnBoarding2_Details';
import OnBoarding3 from '@/components/screen/OnBoarding3';
import OnBoarding4 from '@/components/screen/OnBoarding4';
import OnBoarding4_List from '@/components/screen/OnBoarding4_List'; 
import OnBoarding5 from '@/components/screen/OnBoarding5';
import { KeyboardAwareScrollView } from '@pietile-native-kit/keyboard-aware-scrollview';
import { useRouter } from 'expo-router';
import { useState, useRef } from 'react';  
import { TouchableOpacity, View } from 'react-native';

export default function OnBoardingStep() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [subStep, setSubStep] = useState(1);
  const totalSteps = 5;

  const onboarding4Ref = useRef<any>(null);

  const handleNext = () => {
    // --- Step 2 Logic ---
    if (step === 2 && subStep === 1) {
      setSubStep(2);
      return;
    }

    // --- Step 4 Logic ---
    if (step === 4) {
      if (subStep === 1) {
         onboarding4Ref.current?.openModal();
      } else {
         setStep(5);
        setSubStep(1);
      }
      return;
    }

    // General Navigation
    if (step < totalSteps) {
      setStep(step + 1);
      setSubStep(1);
    } else {
      router.replace('/ReviewStatusScreen');
    }
  };

  const getButtonTitle = () => {
    if (step === 5) return 'Submit';
    if (step === 2 && subStep === 2) return 'Confirm & Proceed';
    if (step === 4) return subStep === 1 ? 'Upload Document' : 'Next Step';
    return 'Next';
  };

  return (
    <Container>
      {/* 1. Progress Bar */}
      <View className="ios:mt-1 mt-4 flex-row justify-between bg-white pb-4 ">
        {[1, 2, 3, 4, 5].map((item) => {
          let bgColor =
            item === step
              ? 'bg-[#F6163C] border-2 border-[#FFC1C1] h-4'
              : item < step
                ? 'bg-[#FFC1C1] h-3'
                : 'border h-3 border-gray-200';

          return (
            <TouchableOpacity
              key={item}
              onPress={() => item < step && setStep(item)}
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
        
        <View className="mt-5 flex-1">
          {step === 1 && <OnBoarding1 />}
          
          {step === 2 && (
            subStep === 1 
              ? <OnBoarding2_Part2 onConfirm={handleNext} /> 
              : <OnBoarding2_Details onBack={() => setSubStep(1)} />
          )}
          
          {step === 3 && <OnBoarding3 />}
          
          {/* Step 4: Scanner OR List View */}
          {step === 4 && (
            subStep === 1 ? (
              <OnBoarding4 
                ref={onboarding4Ref} 
                 onUploadDone={() => setSubStep(2)} 
                onUploadSuccess={() => setSubStep(2)} 
              />
            ) : (
              <OnBoarding4_List onAddMore={() => setSubStep(1)} />
            )
          )}

          {step === 5 && <OnBoarding5 />}
        </View>

        {/* Bottom Button Logic */}
        {!(step === 2 && subStep === 1) && (
          <View className="bg-white pb-8 pt-4 ">
            <Button title={getButtonTitle()} onPress={handleNext} />
          </View>
        )}
      </KeyboardAwareScrollView>
    </Container>
  );
}