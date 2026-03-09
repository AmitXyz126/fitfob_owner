/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-unused-vars */
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
import { useState, useRef, useEffect } from 'react';
import { TouchableOpacity, View } from 'react-native';
import { useUserDetail } from '@/hooks/useUserDetail';
import { useAuthStore } from '@/store/useAuthStore';

export default function OnBoardingStep() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [subStep, setSubStep] = useState(1);
  const totalSteps = 5;
  const { user } = useAuthStore();

  // --- 1. Centralized Parent State ---
  const [formData, setFormData] = useState<any>({});
  const [isDataSynced, setIsDataSynced] = useState(false);

  const onboarding1Ref = useRef<any>(null);
  const onboarding2DetailsRef = useRef<any>(null);
  const onboarding3Ref = useRef<any>(null);
  const onboarding4Ref = useRef<any>(null);
  const onboarding5Ref = useRef<any>(null);

  const {
    submitStep1,
    submitStep2,
    submitStep3,
    submitStep4,
    submitStep7,
    confirmDocs,
    profileStatus,
  } = useUserDetail();

  // --- 2. Sync Global State with API Once ---
  useEffect(() => {
    if (!profileStatus) return;

    if (!isDataSynced) {
      setFormData(profileStatus);
      setIsDataSynced(true);

      if (profileStatus.currentStep && profileStatus.currentStep > 1) {
        setStep(profileStatus.currentStep);
      }
    }
  }, [profileStatus]);

  //  useEffect
  useEffect(() => {
    if (!user) return;
    if (!profileStatus) return;
    console.log(user, 'user data');
    console.log(profileStatus, 'profile status');
    const { status } = profileStatus;

    if (status === 'completed') {
      if (user.verification_status === 'rejected') {
        router.replace('/RejectRequestScreen');
        return;
      }

      if (user.verification_status === 'pending') {
        router.replace('/ReviewStatusScreen');
        return;
      }

      if (user.verification_status === 'approved') {
        router.replace('/(tabs)');
        return;
      }
    } else if (status === 'draft') {
      if (!isDataSynced) {
        setStep(profileStatus?.currentStep || 1);
      }
    } else {
      router.replace('/onBoardingScreen/OnBoardingStep');
    }
  }, [user, profileStatus]);

  const updateFormData = (newData: any) => {
    setFormData((prev: any) => ({ ...prev, ...newData }));
  };

  const isLoading =
    submitStep1.isPending ||
    submitStep3.isPending ||
    submitStep4.isPending ||
    submitStep7.isPending ||
    confirmDocs.isPending;

  const handleNext = async () => {
    if (step === 1) {
      const data = onboarding1Ref.current?.getFormData();
      if (data) updateFormData(data);
      onboarding1Ref.current?.handleSave();
      return;
    }
    if (step === 2) {
      if (subStep === 1) {
        setSubStep(2);
      } else {
        const data = onboarding2DetailsRef.current?.getFormData();
        if (data) updateFormData(data);
        onboarding2DetailsRef.current?.handleSave();
      }
      return;
    }
    if (step === 3) {
      const data = onboarding3Ref.current?.getFormData();
      if (data) updateFormData(data);
      onboarding3Ref.current?.handleSave();
      return;
    }
    if (step === 4) {
      if (subStep === 1) {
        onboarding4Ref.current?.openModal();
      } else {
        confirmDocs.mutate(undefined, {
          onSuccess: () => {
            setStep(5);
            setSubStep(1);
          },
        });
      }
      return;
    }
    if (step === 5) {
      onboarding5Ref.current?.handleUpload();
      return;
    }
  };

  const getButtonTitle = () => {
    if (step === 5) return 'Submit Photos';
    if (step === 2 && subStep === 2) return 'Confirm & Proceed';
    if (step === 3) return 'Save & Continue';
    if (step === 4) return subStep === 1 ? 'Upload Document' : 'Next Step';
    return 'Next';
  };

  return (
    <Container>
      {/* Progress Bar */}
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
              onPress={() => {
                if (item <= (profileStatus?.currentStep || step)) {
                  setStep(item);
                  setSubStep(1);
                }
              }}
              activeOpacity={0.7}
              disabled={item > (profileStatus?.currentStep || 1) && item > step}
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
          {step === 1 && (
            <OnBoarding1 ref={onboarding1Ref} initialData={formData} onNext={() => setStep(2)} />
          )}

          {step === 2 &&
            (subStep === 1 ? (
              <OnBoarding2_Part2 onConfirm={() => setSubStep(2)} />
            ) : (
              <OnBoarding2_Details
                ref={onboarding2DetailsRef}
                initialData={formData}
                onBack={() => setSubStep(1)}
                onNext={() => {
                  setStep(3);
                  setSubStep(1);
                }}
              />
            ))}

          {step === 3 && (
            <OnBoarding3
              ref={onboarding3Ref}
              initialData={formData}
              onNext={() => {
                setStep(4);
                setSubStep(1);
              }}
            />
          )}

          {step === 4 &&
            (subStep === 1 ? (
              <OnBoarding4
                ref={onboarding4Ref}
                onUploadDone={() => setSubStep(2)}
                onUploadSuccess={() => {
                  if (subStep === 1) {
                    setSubStep(2);
                  }
                }}
              />
            ) : (
              <OnBoarding4_List onAddMore={() => setSubStep(1)} />
            ))}

          {step === 5 && <OnBoarding5 ref={onboarding5Ref} initialData={formData} />}
        </View>

        {!(step === 2 && subStep === 1) && (
          <View className="bg-white pb-8 pt-4 ">
            <Button
              title={getButtonTitle()}
              onPress={handleNext}
              loading={isLoading}
              disabled={isLoading}
            />
          </View>
        )}
      </KeyboardAwareScrollView>
    </Container>
  );
}
