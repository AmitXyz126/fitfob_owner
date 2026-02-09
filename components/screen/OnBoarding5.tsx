import React from 'react';
import { View, Text, Image } from 'react-native'; 

const OnBoarding5 = () => {
  return (
    <View className="flex-1 bg-white items-center justify-center">
      <View className="items-center mb-2">
        
        {/* --- SUCCESS IMAGE/GIF --- */}

        {/* --- TEXT SECTION --- */}
        <Text className="text-[28px] font-bold text-slate-900 mb-3 text-center">
          Congratulations
        </Text>
        
        <Text className="text-[15px] text-slate-400 text-center leading-5 px-1">
          You have successfully completed the process
        </Text>
        <View className=" bg-white w-[200px] h-[200px] items-center justify-center mb-2">
          <Image 
            source={require('../../assets/gif/tick.gif')} 
            className="w-[126px] h-[126px]"
            resizeMode="contain"
          />
        </View>
      </View>
    </View>
  );
};

export default OnBoarding5;