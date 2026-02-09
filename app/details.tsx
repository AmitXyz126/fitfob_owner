import { Text, View } from 'react-native';

import { useLocalSearchParams } from 'expo-router';

import { Container } from '@/components/Container';
 
import { Button } from '@/components/Button';
import { useStore } from 'expo-router/build/global-state/router-store';

export default function Details() {
  const { name } = useLocalSearchParams();
  const { bears, increasePopulation, decreasePopulation, removeAllBears } = useStore();

  return (
 
      <Container>
        <View className="flex-row items-center justify-center gap-x-10">
          <Button title="-" onPress={decreasePopulation} />
          <Text className="text-xl font-medium ios:font-bold">{bears}</Text>
          <Button title="+" onPress={increasePopulation} />
        </View>
          <Button title="Reset" onPress={removeAllBears} />
        <View className="mt-1 ">
          <Text className="text-green-600 font-semibold">{name}</Text>
        </View>
      </Container>
  );
}
