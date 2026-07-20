import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SplashScreen, Stack } from 'expo-router';
import Toast from 'react-native-toast-message';
import '../global.css';
import { useFonts } from 'expo-font';
import { useEffect } from 'react';


const queryClient = new QueryClient();
export default function Layout() {

  const [loaded] = useFonts({
    'PlusJakartaSans-Regular': require('../assets/fonts/PlusJakartaSans-Regular.ttf'),
    'PlusJakartaSans-Medium': require('../assets/fonts/PlusJakartaSans-Medium.ttf'),
    'PlusJakartaSans-SemiBold': require('../assets/fonts/PlusJakartaSans-SemiBold.ttf'),
    'PlusJakartaSans-Bold': require('../assets/fonts/PlusJakartaSans-Bold.ttf'),
  });

  useEffect(() => {
    if (loaded) SplashScreen.hideAsync();
  }, [loaded]);

  if (!loaded) return null;


  return (
    <QueryClientProvider client={queryClient}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="clubProfile" />
        <Stack.Screen name="ClubPhotosScreen" />
        <Stack.Screen name="ManageBankScreen" />
        <Stack.Screen name="addBankAccount" />
        <Stack.Screen name="bankSummary" />
        <Stack.Screen name="payoutHistory" />
        <Stack.Screen name="ViewAllScreen" />
        <Stack.Screen name="notification" />
        <Stack.Screen name="chat" />
        <Stack.Screen name="documents" />
        <Stack.Screen name="clubAmenities" />
        <Stack.Screen name="verificationStatus" />
        <Stack.Screen name="clubTimings" />
      </Stack>
      <Toast />
    </QueryClientProvider>
  );
}
 