import React, { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  Dimensions,
  TouchableOpacity,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import * as Haptics from 'expo-haptics';

const { width } = Dimensions.get('window');
const TICK_SPACING = 15;
const AGE_ITEM_SIZE = 65;

const OnBoarding2 = () => {
  const [age, setAge] = useState<number>(24);
  const [weight, setWeight] = useState<number>(70);
  const [height, setHeight] = useState<number>(170);

  const [weightUnit, setWeightUnit] = useState<'kg' | 'lb'>('kg');
  const [heightUnit, setHeightUnit] = useState<'cm' | 'inches'>('cm');

  const ages = Array.from({ length: 63 }, (_, i) => i + 18);
  const weights = Array.from({ length: 251 }, (_, i) => i + 20);
  const heights = Array.from({ length: 201 }, (_, i) => i + 50);

  // --- Fixed Conversion Logic with Types ---
  const convertWeight = (val: number, toUnit: 'kg' | 'lb'): number => {
    if (toUnit === 'lb') return Math.round(val * 2.20462);
    return Math.round(val / 2.20462);
  };

  const convertHeight = (val: number, toUnit: 'cm' | 'inches'): number => {
    if (toUnit === 'inches') return Math.round(val / 2.54);
    return Math.round(val * 2.54);
  };

  const handleUnitChange = (type: 'weight' | 'height', newUnit: any) => {
    if (type === 'weight' && weightUnit !== newUnit) {
      setWeight(convertWeight(weight, newUnit));
      setWeightUnit(newUnit);
    } else if (type === 'height' && heightUnit !== newUnit) {
      setHeight(convertHeight(height, newUnit));
      setHeightUnit(newUnit);
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  // --- Fixed Scroll Event Types ---
  const handleScrollSelection = (
    event: NativeSyntheticEvent<NativeScrollEvent>,
    setter: (value: number) => void,
    data: number[],
    spacing: number,
    currentVal: number
  ) => {
    const index = Math.round(event.nativeEvent.contentOffset.x / spacing);
    const value = data[index];
    if (value !== undefined && value !== currentVal) {
      setter(value);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  return (
    <View className="flex-1">
      {/* --- AGE SELECTOR --- */}
      <View className="mb-6">
        <Text className="mb-4 font-bold text-lg text-slate-900">What is your Age</Text>
        <View className="h-24 items-center justify-center overflow-hidden rounded-[25px] bg-slate-50">
          <View
            className="absolute rounded-full bg-[#F6163C]"
            style={{ width: AGE_ITEM_SIZE - 5, height: AGE_ITEM_SIZE - 5 }}
          />
          <FlatList
            data={ages}
            horizontal
            showsHorizontalScrollIndicator={false}
            snapToInterval={AGE_ITEM_SIZE}
            decelerationRate="fast"
            onScroll={(e) => handleScrollSelection(e, setAge, ages, AGE_ITEM_SIZE, age)}
            initialScrollIndex={ages.indexOf(24)}
            getItemLayout={(_, i) => ({
              length: AGE_ITEM_SIZE,
              offset: AGE_ITEM_SIZE * i,
              index: i,
            })}
            contentContainerStyle={{ paddingHorizontal: (width - 40 - AGE_ITEM_SIZE) / 2 }}
            renderItem={({ item }) => (
              <View style={{ width: AGE_ITEM_SIZE }} className="h-24 items-center justify-center">
                <Text
                  className={`font-bold text-xl ${item === age ? 'text-2xl text-white' : 'text-slate-300'}`}>
                  {item}
                </Text>
              </View>
            )}
          />
        </View>
      </View>

      {/* --- WEIGHT SELECTOR --- */}
      <View className="mb-6 rounded-[25px] bg-slate-50 p-5">
        <Text className="mb-4 font-bold text-lg text-slate-900">What is your Weight?</Text>

        <View className="mb-6 flex-row">
          <TouchableOpacity
            onPress={() => handleUnitChange('weight', 'kg')}
            className={`flex-1 items-center rounded-xl border py-3 ${weightUnit === 'kg' ? 'border-[#F6163C] bg-[#F6163C]' : 'mr-2 border-slate-200 bg-white'}`}>
            <Text className={`font-bold ${weightUnit === 'kg' ? 'text-white' : 'text-slate-400'}`}>
              kg
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => handleUnitChange('weight', 'lb')}
            className={`flex-1 items-center rounded-xl border py-3 ${weightUnit === 'lb' ? 'border-[#F6163C] bg-[#F6163C]' : 'ml-2 border-slate-200 bg-white'}`}>
            <Text className={`font-bold ${weightUnit === 'lb' ? 'text-white' : 'text-slate-400'}`}>
              lb
            </Text>
          </TouchableOpacity>
        </View>

        <View className="mb-4 flex-row items-baseline justify-center">
          <Text className="text-5xl font-black text-slate-900">{weight}</Text>
          <Text className="ml-1 font-bold text-xl text-[#F6163C]">{weightUnit}</Text>
        </View>

        <View className="h-24 justify-center overflow-hidden rounded-2xl">
          <View
            className="absolute bottom-4 left-1/2 z-10 h-12 w-1 rounded-full bg-slate-900"
            style={{ marginLeft: -1 }}
          />
          <FlatList
            key={`weight-list-${weightUnit}`}
            data={weights}
            horizontal
            showsHorizontalScrollIndicator={false}
            snapToInterval={TICK_SPACING}
            decelerationRate="fast"
            onScroll={(e) => handleScrollSelection(e, setWeight, weights, TICK_SPACING, weight)}
            initialScrollIndex={weights.indexOf(weight) !== -1 ? weights.indexOf(weight) : 0}
            getItemLayout={(_, i) => ({ length: TICK_SPACING, offset: TICK_SPACING * i, index: i })}
            contentContainerStyle={{ paddingHorizontal: (width - 80) / 2 }}
            renderItem={({ item }) => (
              <View style={{ width: TICK_SPACING }} className="items-center justify-end pb-4">
                {item % 10 === 0 && (
                  <Text className="absolute top-2 text-[10px] font-black text-slate-400">
                    {item}
                  </Text>
                )}
                <View
                  className={`w-[2px] rounded-full ${item % 10 === 0 ? 'h-8 bg-slate-800' : 'h-4 bg-slate-300'}`}
                />
              </View>
            )}
          />
        </View>
      </View>

      {/* --- HEIGHT SELECTOR --- */}
      <View className="mb-6 rounded-[25px] bg-slate-50 p-5">
        <Text className="mb-4 font-bold text-lg text-slate-900">What is your height?</Text>

        <View className="mb-6 flex-row">
          <TouchableOpacity
            onPress={() => handleUnitChange('height', 'cm')}
            className={`flex-1 items-center rounded-xl border py-3 ${heightUnit === 'cm' ? 'border-[#F6163C] bg-[#F6163C]' : 'mr-2 border-slate-200 bg-white'}`}>
            <Text className={`font-bold ${heightUnit === 'cm' ? 'text-white' : 'text-slate-400'}`}>
              cm
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => handleUnitChange('height', 'inches')}
            className={`flex-1 items-center rounded-xl border py-3 ${heightUnit === 'inches' ? 'border-[#F6163C] bg-[#F6163C]' : 'ml-2 border-slate-200 bg-white'}`}>
            <Text
              className={`font-bold ${heightUnit === 'inches' ? 'text-white' : 'text-slate-400'}`}>
              inches
            </Text>
          </TouchableOpacity>
        </View>

        <View className="mb-4 flex-row items-baseline justify-center">
          <Text className="text-5xl font-black text-slate-900">{height}</Text>
          <Text className="ml-1 font-bold text-xl text-[#F6163C]">{heightUnit}</Text>
        </View>

        <View className="h-24 justify-center overflow-hidden rounded-2xl">
          <View
            className="absolute bottom-4 left-1/2 z-10 h-12 w-1 rounded-full bg-slate-900"
            style={{ marginLeft: -1 }}
          />
          <FlatList
            key={`height-list-${heightUnit}`}
            data={heights}
            horizontal
            showsHorizontalScrollIndicator={false}
            snapToInterval={TICK_SPACING}
            decelerationRate="fast"
            onScroll={(e) => handleScrollSelection(e, setHeight, heights, TICK_SPACING, height)}
            initialScrollIndex={heights.indexOf(height) !== -1 ? heights.indexOf(height) : 0}
            getItemLayout={(_, i) => ({ length: TICK_SPACING, offset: TICK_SPACING * i, index: i })}
            contentContainerStyle={{ paddingHorizontal: (width - 80) / 2 }}
            renderItem={({ item }) => (
              <View style={{ width: TICK_SPACING }} className="items-center justify-end pb-4">
                {item % 10 === 0 && (
                  <Text className="absolute top-2 text-[10px] font-black text-slate-400">
                    {item}
                  </Text>
                )}
                <View
                  className={`w-[2px] rounded-full ${item % 10 === 0 ? 'h-8 bg-slate-800' : 'h-4 bg-slate-300'}`}
                />
              </View>
            )}
          />
        </View>
      </View>
    </View>
  );
};

export default OnBoarding2;
