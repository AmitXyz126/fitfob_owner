import React from 'react';
import { View, Text, Image } from 'react-native';
import { Button } from '../Button';
import { router } from 'expo-router';

const OnBoarding5 = () => {
  return (
    <View className="flex-1 items-center justify-center bg-white">
      <View className="mb-2 items-center">
        <Text className="mb-3 text-center font-bold text-[28px] text-slate-900">
          Congratulations
        </Text>

        <Text className="px-1 text-center text-[15px] leading-5 text-slate-400">
          You have successfully completed the process
        </Text>
        <View className=" mb-2 h-[200px] w-[200px] items-center justify-center bg-white">
          <Image
            source={require('../../assets/gif/tick.gif')}
            className="h-[126px] w-[126px]"
            resizeMode="contain"
          />
        </View>
        <Button onPress={() => router.push('/ReviewStatusScreen')} title={'Finish'} />
      </View>
    </View>
  );
};

export default OnBoarding5;
