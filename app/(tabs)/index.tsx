import { View, Text } from 'react-native';
import { Container } from '@/components/Container';

export default function HomeScreen() {
  return (
    <Container>
      <View className="flex-1 items-center justify-center">
        <Text className="text-2xl font-bold">Welcome directly to FitFob!</Text>
        <Text className="text-secondaryText mt-4">This is your dashboard.</Text>
      </View>
    </Container>
  );
}
