import { Stack } from 'expo-router';

export default function RootLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />

      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="clubProfile" />
      <Stack.Screen name="ClubPhotoScreen" />
      <Stack.Screen name="ManageBankScreen" />
      <Stack.Screen name="addBankAccount" />
      <Stack.Screen name="bankSummary" />
      <Stack.Screen name="payoutHistory" />
      <Stack.Screen name="earningDetail" />
      <Stack.Screen name="ViewAllScreen" />
    </Stack>
  );
}
