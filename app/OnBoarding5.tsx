import React from 'react';
import { View, Text, Image } from 'react-native';
import { router } from 'expo-router';
import { Button } from '@/components/Button';
import { Container } from '@/components/Container';

const OnBoarding5 = () => {
  return (
    <Container>
      <View className="flex-1 items-center justify-center bg-white">
        <View className="mb-2 items-center">
          <Text className="mb-1.5 text-center font-bold text-[24px] leading-8 text-[#1C1C1C]">
            Congratulations
          </Text>

          <Text className="px-1 text-center text-[12px] leading-5 text-[#666D6D]">
            You have successfully completed the process
          </Text>
          <View className=" mb-2 h-[200px] w-[200px] items-center justify-center bg-white">
            <Image
              source={require('../assets/gif/tick.gif')}
              className="h-[126px] w-[126px]"
              resizeMode="contain"
            />
          </View>
        </View>
      </View>
        <View className="mb-6 px-4">
          <Button title={'Finish'} onPress={() => router.replace('/ReviewStatusScreen')} />
        </View>
    </Container>
  );
};

export default OnBoarding5;
