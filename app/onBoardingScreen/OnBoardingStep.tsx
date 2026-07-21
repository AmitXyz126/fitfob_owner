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
import { TouchableOpacity, View, ActivityIndicator } from 'react-native';
import { useUserDetail } from '@/hooks/useUserDetail';
import { useAuthStore } from '@/store/useAuthStore';
import GymLoader from '@/components/GymLoader';
import { useMutationState } from '@tanstack/react-query';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function OnBoardingStep() {
  const router = useRouter();
  const pendingMutations = useMutationState({
    filters: { status: 'pending' },
  });
  const isLoading = pendingMutations.length > 0;
  const [step, setStep] = useState(1);
  const [subStep, setSubStep] = useState(1);
  const [hasCheckedDocuments, setHasCheckedDocuments] = useState(false);
  const totalSteps = 5;
  const { user } = useAuthStore();

  // --- Step Mapping Helpers (Backend vs Frontend) ---
  const mapApiStepToFrontend = (apiStep: number) => {
    switch (apiStep) {
      case 1:
        return { step: 1, subStep: 1 };
      case 2:
        return { step: 2, subStep: 1 };
      case 3:
        return { step: 2, subStep: 2 };
      case 4:
        return { step: 3, subStep: 1 };
      case 5:
        return { step: 4, subStep: 1 };
      case 6:
        return { step: 4, subStep: 2 };
      case 7:
        return { step: 5, subStep: 1 };
      default:
        return { step: 1, subStep: 1 };
    }
  };

  const mapFrontendToApiStep = (stepVal: number, subStepVal: number) => {
    if (stepVal === 1) return 1;
    if (stepVal === 2) return subStepVal === 1 ? 2 : 3;
    if (stepVal === 3) return 4;
    if (stepVal === 4) return subStepVal === 1 ? 5 : 6;
    if (stepVal === 5) return 7;
    return 1;
  };

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
    // submitStep2,
    submitStep3,
    submitStep4,
    submitStep7,
    confirmDocs,
    profileStatus,
    isFetchingStatus,
    documents,
  } = useUserDetail();

  // --- 2. Sync Global State with API Once ---
  useEffect(() => {
    if (!profileStatus) return;

    if (!isDataSynced) {
      setFormData(profileStatus);
      setIsDataSynced(true);

      const loadSavedProgress = async () => {
        try {
          const savedStep = await AsyncStorage.getItem(`@onboarding_current_step_${user?.id}`);
          const savedSubStep = await AsyncStorage.getItem(`@onboarding_current_substep_${user?.id}`);
          
          const apiStep = profileStatus.currentStep || 1;
          const backendMapped = mapApiStepToFrontend(apiStep);
          
          if (savedStep) {
            const parsedStep = parseInt(savedStep);
            const parsedSubStep = savedSubStep ? parseInt(savedSubStep) : 1;
            const savedApiVal = mapFrontendToApiStep(parsedStep, parsedSubStep);

            if (savedApiVal >= apiStep && parsedStep <= 5) {
              setStep(parsedStep);
              setSubStep(parsedSubStep);
              return;
            }
          }
          
          setStep(backendMapped.step);
          setSubStep(backendMapped.subStep);
        } catch (e) {
          console.log('Error loading onboarding progress', e);
        }
      };

      loadSavedProgress();
    }
  }, [profileStatus, user]);

  // --- Save Onboarding Progress ---
  useEffect(() => {
    if (!user?.id) return;
    const saveProgress = async () => {
      try {
        await AsyncStorage.setItem(`@onboarding_current_step_${user.id}`, String(step));
        await AsyncStorage.setItem(`@onboarding_current_substep_${user.id}`, String(subStep));
      } catch (e) {
        console.log('Error saving onboarding progress', e);
      }
    };
    saveProgress();
  }, [step, subStep, user]);

  //  useEffect
  useEffect(() => {
    if (!user) return;
    if (!profileStatus) return;
    console.log(user, 'user data');
    console.log(profileStatus, 'profile status');
    const { status } = profileStatus;

    if (status === 'completed') {
      if (user.verification_status === 'rejected') {
        if (router.canGoBack()) {
          router.dismissAll();
        }
        router.replace('/RejectRequestScreen');
        return;
      }

      if (user.verification_status === 'pending') {
        if (router.canGoBack()) {
          router.dismissAll();
        }
        router.replace('/ReviewStatusScreen');
        return;
      }

      if (user.verification_status === 'approved') {
        if (router.canGoBack()) {
          router.dismissAll();
        }
        router.replace('/(tabs)');
        return;
      }

      // Fallback redirect for completed status if verification_status is not set/updated
      if (router.canGoBack()) {
        router.dismissAll();
      }
      router.replace('/ReviewStatusScreen');
      return;
    } else if (status === 'draft') {
      if (!isDataSynced) {
        const backendMapped = mapApiStepToFrontend(profileStatus?.currentStep || 1);
        setStep(backendMapped.step);
        setSubStep(backendMapped.subStep);
      }
    } else {
      router.replace('/onBoardingScreen/OnBoardingStep');
    }
  }, [user, profileStatus]);

  useEffect(() => {
    if (step === 4 && documents && !hasCheckedDocuments) {
      const docList = documents?.documents || documents?.data || documents || [];
      if (docList.length > 0) {
        setSubStep(2);
      }
      setHasCheckedDocuments(true);
    } else if (step !== 4 && hasCheckedDocuments) {
      setHasCheckedDocuments(false);
    }
  }, [step, documents, hasCheckedDocuments]);

  if (isFetchingStatus && !profileStatus) {
    return (
      <Container>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'white' }}>
          <ActivityIndicator size="large" color="#F6163C" />
        </View>
      </Container>
    );
  }

  const updateFormData = (newData: any) => {
    setFormData((prev: any) => ({ ...prev, ...newData }));
  };



  const handleNext = async () => {
    if (step === 1) {
      const data = onboarding1Ref.current?.getFormData();
      if (data) updateFormData(data);
      onboarding1Ref.current?.handleSave();
      return;
    } if (step === 2) {
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
      <GymLoader visible={isLoading} />
      {/* Progress Bar */}
      <View className="ios:mt-1 mt-4 flex-row justify-between bg-white pb-4 ">
        {[1, 2, 3, 4, 5].map((item) => {
          let bgColor =
            item === step
              ? 'bg-[#F6163C] border-2 border-[#FFC1C1] h-4'
              : item < step
                ? 'bg-[#FFC1C1] h-3'
                : 'border h-3 border-gray-200';
          
          const maxAllowedFrontendStep = mapApiStepToFrontend(profileStatus?.currentStep || 1).step;

          return (
            <TouchableOpacity
              key={item}
              onPress={() => {
                if (item <= maxAllowedFrontendStep) {
                  setStep(item);
                  setSubStep(1);
                }
              }}
              activeOpacity={0.7}
              disabled={item > maxAllowedFrontendStep && item > step}
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
                onBack={() => {
                  const docList = documents?.documents || documents?.data || documents || [];
                  if (docList.length > 0) {
                    setSubStep(2);
                  } else {
                    setStep(3);
                    setSubStep(1);
                  }
                }}
              />
            ) : (
              <OnBoarding4_List onAddMore={() => setSubStep(1)} />
            ))}

          {step === 5 && <OnBoarding5 ref={onboarding5Ref} initialData={formData} />}
        </View>

        {!(step === 2 && subStep === 1) && !(step === 4 && subStep === 1) && (
          <View className="bg-white pb-8 pt-4">
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
