import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SplashScreen, Stack, ErrorBoundaryProps } from 'expo-router';
import Toast, { BaseToast, ErrorToast, InfoToast, ToastConfig } from 'react-native-toast-message';
import '../global.css';
import { useFonts } from 'expo-font';
import { useEffect } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useAuthStore } from '@/store/useAuthStore';
import {
  registerDeviceTokenWithBackend,
  setupNotificationListeners,
} from '@/services/notificationService';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000,
      refetchOnWindowFocus: false, // Prevents duplicate requests on window/app focus
      refetchOnReconnect: false,
      refetchOnMount: false,
      retry: 1,
    },
  },
});

// Keep the splash screen visible while loading fonts and assets to avoid white screen flash
SplashScreen.preventAutoHideAsync().catch(() => { });

export function ErrorBoundary({ error, retry }: ErrorBoundaryProps) {
  return (
    <SafeAreaProvider>
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24, backgroundColor: '#FFFFFF' }}>
        <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#0F172A', marginBottom: 8 }}>
          Something went wrong
        </Text>
        <Text style={{ fontSize: 13, color: '#64748B', textAlign: 'center', marginBottom: 24, lineHeight: 18 }}>
          {error?.message || 'An unexpected error occurred.'}
        </Text>
        <TouchableOpacity
          onPress={retry}
          style={{ backgroundColor: '#F6163C', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 14 }}>
          <Text style={{ color: '#FFFFFF', fontWeight: 'bold', fontSize: 14 }}>Try Again</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaProvider>
  );
}

const toastConfig: ToastConfig = {
  success: (props) => (
    <BaseToast
      {...props}
      text1NumberOfLines={2}
      text2NumberOfLines={3}
      style={{ borderLeftColor: '#28a745', height: 'auto', minHeight: 60, paddingVertical: 8, zIndex: 9999999 }}
      text1Style={{ fontSize: 13, fontWeight: '700' }}
      text2Style={{ fontSize: 12, color: '#475569', lineHeight: 16 }}
    />
  ),
  error: (props) => (
    <ErrorToast
      {...props}
      text1NumberOfLines={2}
      text2NumberOfLines={3}
      style={{ borderLeftColor: '#FE6301', height: 'auto', minHeight: 60, paddingVertical: 8, zIndex: 9999999 }}
      text1Style={{ fontSize: 13, fontWeight: '700' }}
      text2Style={{ fontSize: 12, color: '#475569', lineHeight: 16 }}
    />
  ),
  info: (props) => (
    <InfoToast
      {...props}
      text1NumberOfLines={2}
      text2NumberOfLines={3}
      style={{ borderLeftColor: '#87CEFA', height: 'auto', minHeight: 60, paddingVertical: 8, zIndex: 9999999 }}
      text1Style={{ fontSize: 13, fontWeight: '700' }}
      text2Style={{ fontSize: 12, color: '#475569', lineHeight: 16 }}
    />
  ),
};

export default function Layout() {

  const [loaded] = useFonts({
    'PlusJakartaSans-Regular': require('../assets/fonts/PlusJakartaSans-Regular.ttf'),
    'PlusJakartaSans-Medium': require('../assets/fonts/PlusJakartaSans-Medium.ttf'),
    'PlusJakartaSans-SemiBold': require('../assets/fonts/PlusJakartaSans-SemiBold.ttf'),
    'PlusJakartaSans-Bold': require('../assets/fonts/PlusJakartaSans-Bold.ttf'),
  });

  const user = useAuthStore((state) => state.user);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync().catch(() => { });
    }
  }, [loaded]);

  // Setup push notification listeners (foreground alerts, taps, token refresh)
  useEffect(() => {
    const unsubscribe = setupNotificationListeners(
      (notification) => {
        console.log('🔔 Foreground push notification received:', notification);
      },
      (response) => {
        console.log('📲 Push notification tapped by user:', response);
      }
    );

    return () => {
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
  }, []);

  // Automatically register device token with FitFob backend once user is authenticated
  useEffect(() => {
    const authToken = user?.token || user?.jwt;
    if (authToken) {
      registerDeviceTokenWithBackend().catch((e) => {
        console.warn('⚠️ Push notification device token registration warning:', e);
      });
    }
  }, [user?.token, user?.jwt]);

  if (!loaded) return null;

  return (
    <SafeAreaProvider>
      <StatusBar style="dark" animated />
      <QueryClientProvider client={queryClient}>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" options={{ gestureEnabled: false }} />
          <Stack.Screen name="splash" options={{ gestureEnabled: false }} />
          <Stack.Screen name="welcome" options={{ gestureEnabled: false }} />
          <Stack.Screen name="(tabs)" options={{ gestureEnabled: false }} />
          <Stack.Screen name="onBoardingScreen/OnBoardingStep" options={{ gestureEnabled: false }} />
          <Stack.Screen name="ReviewStatusScreen" options={{ gestureEnabled: false }} />
          <Stack.Screen name="RejectRequestScreen" options={{ gestureEnabled: false }} />
          <Stack.Screen name="clubProfile" />
          <Stack.Screen name="ClubPhotosScreen" />
          <Stack.Screen name="ManageBankScreen" />
          <Stack.Screen name="addBankAccount" />
          <Stack.Screen name="bankSummary" />
          <Stack.Screen name="payoutHistory" />
          <Stack.Screen name="checkin-list" />
          <Stack.Screen name="notification" />
          <Stack.Screen name="chat" />
          <Stack.Screen name="documents" />
          <Stack.Screen name="clubAmenities" />
          <Stack.Screen name="verificationStatus" />
          <Stack.Screen name="clubTimings" />
          <Stack.Screen name="holidays" />
          <Stack.Screen name="MembershipPlansScreen" />
          <Stack.Screen name="gym-contracts" />
          <Stack.Screen name="members" />
          <Stack.Screen name="offline-members" />
          <Stack.Screen name="member-details" />
          <Stack.Screen name="TrialManagerScreen" />
          <Stack.Screen name="TrialGuestsScreen" />
        </Stack>
        <Toast config={toastConfig} />
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}

