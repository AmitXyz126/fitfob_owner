import { View, Text, ImageBackground, Image } from 'react-native';
import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import Entypo from '@expo/vector-icons/Entypo';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useAuthStore } from '@/store/useAuthStore';

import { userDetailsApi } from '@/api/userdetailsApi';

export default function Splash() {
  const router = useRouter();
  const { initializeAuth } = useAuthStore();

  // Logo animation values
  const translateY = useSharedValue(40);
  const logoOpacity = useSharedValue(0);

  // Text animation value
  const textOpacity = useSharedValue(0);

  const logoStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: logoOpacity.value,
  }));

  const textStyle = useAnimatedStyle(() => ({
    opacity: textOpacity.value,
  }));

  useEffect(() => {
    // Logo comes up
    translateY.value = withTiming(0, {
      duration: 500,
      easing: Easing.out(Easing.cubic),
    });

    logoOpacity.value = withTiming(1, {
      duration: 500,
    });

    // Text fades slightly after
    textOpacity.value = withTiming(1, {
      duration: 400,
      easing: Easing.inOut(Easing.ease),
    });

    const checkAuthAndNavigate = async () => {
      try {
        await initializeAuth();
      } catch (error) {
        console.error('Failed to initialize auth in splash:', error);
      }

      setTimeout(async () => {
        const currentUser = useAuthStore.getState().user;
        if (currentUser && (currentUser.token || currentUser.jwt)) {
          // If clubOwnerDetail is NOT null in stored user, redirect to /(tabs) directly without calling GET_ONBOARDING_STATUS
          if (currentUser.clubOwnerDetail !== null && currentUser.clubOwnerDetail !== undefined) {
            console.log('✅ clubOwnerDetail is NOT null in stored user -> Directing to /(tabs) WITHOUT calling GET_ONBOARDING_STATUS');
            router.replace('/(tabs)');
            return;
          }

          try {
            const statusData = await userDetailsApi.getMe();
            const verificationStatus =
              statusData?.verification_status ||
              statusData?.verificationStatus ||
              currentUser?.verification_status;
            const status = statusData?.status;
            const clubOwnerDetail = statusData?.clubOwnerDetail || currentUser?.clubOwnerDetail;
            const isApproved =
              (clubOwnerDetail !== null && clubOwnerDetail !== undefined) ||
              statusData?.isApprovedOwner ||
              verificationStatus === 'approved' ||
              status === 'approved';

            if (isApproved) {
              router.replace('/(tabs)');
              return;
            }

            if (verificationStatus === 'rejected' || status === 'rejected') {
              router.replace('/RejectRequestScreen');
              return;
            }

            if (
              status === 'in_review' ||
              status === 'completed' ||
              verificationStatus === 'in_review' ||
              verificationStatus === 'completed'
            ) {
              router.replace('/ReviewStatusScreen');
              return;
            }

            router.replace('/onBoardingScreen/OnBoardingStep');
          } catch (e) {
            console.log('Error checking status in splash, defaulting to tabs:', e);
            router.replace('/(tabs)');
          }
        } else {
          router.replace('/welcome');
        }
      }, 1500);
    };

    checkAuthAndNavigate();
  }, []);

  return (
    <ImageBackground
      source={require('../assets/images/splash-grid.png')}
      className="flex-1 items-center justify-center bg-primary px-6"
      resizeMode="cover"
    >
      {/* Logo + Title */}
      <View className="items-center justify-center gap-4">
        <Animated.View style={logoStyle}>
          <Image
            source={require('../assets/images/logoVector.png')}
            className="h-[117px] w-[117px]"
            resizeMode="contain"
          />
        </Animated.View>

        <Animated.Text
          style={textStyle}
          className="text-background font-bold text-[40px] leading-[44px]"
        >
          fit fob
        </Animated.Text>
      </View>

      {/* Quote Card */}
      <View className="absolute bottom-20 flex w-full flex-col items-start gap-2 rounded-2xl bg-background px-5 py-4">
        <Entypo
          name="quote"
          size={24}
          className="scale-x-[-1]"
          color="red"
        />
        <Text className="font-sans text-sm leading-snug text-darkText">
          Every rep takes you closer.
        </Text>
      </View>
    </ImageBackground>
  );
}
