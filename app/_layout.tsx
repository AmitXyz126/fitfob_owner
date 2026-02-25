import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import Toast from 'react-native-toast-message';


const queryClient = new QueryClient();
export default function RootLayout() {
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
      </Stack>
      <Toast />
    </QueryClientProvider>
  );
}
