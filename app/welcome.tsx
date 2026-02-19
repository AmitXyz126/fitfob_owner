import {
  View,
  Text,
  ImageBackground,
  Dimensions,
  Pressable,
  FlatList,
  Image,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import { useEffect, useRef, useState } from 'react';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';

const images = [
  require('../assets/images/welcome4.png'),
  require('../assets/images/welcome5.png'),
  require('../assets/images/welcome6.png'),
  require('../assets/images/welcome7.png'),
  require('../assets/images/welcome8.png'),
];

// Create loop data
const loopImages = [images[images.length - 1], ...images, images[0]];

const { width } = Dimensions.get('window');

export default function Welcome() {
  const [index, setIndex] = useState(1);
  const ref = useRef<FlatList>(null);

  // ⏱ Autoplay
  useEffect(() => {
    const interval = setInterval(() => {
      ref.current?.scrollToIndex({
        index: index + 1,
        animated: true,
      });
    }, 3000);

    return () => clearInterval(interval);
  }, [index]);

  // 🔁 Handle seamless looping
  const onScrollEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const currentIndex = Math.round(e.nativeEvent.contentOffset.x / width);

    if (currentIndex === 0) {
      ref.current?.scrollToIndex({
        index: images.length,
        animated: false,
      });
      setIndex(images.length);
    } else if (currentIndex === loopImages.length - 1) {
      ref.current?.scrollToIndex({
        index: 1,
        animated: false,
      });
      setIndex(1);
    } else {
      setIndex(currentIndex);
    }
  };

  return (
    <View className="flex-1 bg-black">
      <FlatList
        ref={ref}
        data={loopImages}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        initialScrollIndex={1}
        getItemLayout={(_, i) => ({
          length: width,
          offset: width * i,
          index: i,
        })}
        onMomentumScrollEnd={onScrollEnd}
        keyExtractor={(_, i) => i.toString()}
        renderItem={({ item }) => (
          <ImageBackground source={item} style={{ width, height: '100%' }} resizeMode="cover" />
        )}
      />

      {/* Overlay UI */}
      <View className="absolute inset-0 h-full justify-between">
        <LinearGradient
          colors={['rgba(0,0,0,0)', '#000000']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{
            height: '100%',
            justifyContent: 'space-between',
            paddingHorizontal: 24,
            paddingTop: 80,
          }}>
          {/* Logo */}
          <View className="flex-row items-start justify-between">
            <Image
              source={require('../assets/images/logoVector.png')}
              className="h-[54px] w-[54px]"
              resizeMode="contain"
            />
            {/* Indicators */}
            <View className="mb-6 flex-row">
              {images.map((_, i) => {
                const realIndex = index - 1;
                return (
                  <View
                    key={i}
                    style={{
                      transitionDuration: '700ms',
                      transitionProperty: 'all',
                      transitionTimingFunction: 'ease-in-out',
                    }}
                    className={`mr-2 h-2 rounded-full ${
                      i === realIndex ? 'w-8 bg-primary' : 'w-2 bg-white'
                    }`}
                  />
                );
              })}
            </View>
          </View>

          {/* Bottom CTA */}
          <View className="pb-12">
            <Pressable
              onPress={() => router.push('/(tabs)')}
              className="mb-4 rounded-2xl border border-primary bg-primary py-4">
              <Text className="text-center font-bold text-sm leading-sm text-background">
                Login
              </Text>
            </Pressable>

            <Pressable
              onPress={() => router.push('/auth/SignUp')}
              className="mb-8 rounded-2xl border border-white py-4 active:opacity-80">
              <Text className="text-center font-bold text-sm leading-sm text-background">
                Sign Up
              </Text>
            </Pressable>
            <View className="items-center gap-1">
              <Text className="font-sans text-sm leading-sm text-background">
                By proceeding, you agree to
              </Text>
              <Text className="font-sans text-sm leading-sm text-primary underline">
                Terms & Conditions
                <Text className="font-sans text-sm leading-sm text-background no-underline">
                  {'   '}&{'   '}
                </Text>
                Privacy Policy.
              </Text>
            </View>
          </View>
        </LinearGradient>
      </View>
    </View>
  );
}
