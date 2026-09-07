import {
  View,
  Text,
  ImageBackground,
  Dimensions,
  Pressable,
  FlatList,
  Image,
  Animated,
  Easing,
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

const MOTIVATIONAL_DATA = [
  {
    tag: 'PUSH YOUR LIMITS',
    line1: 'Sweat Today,',
    line2: 'Conquer Tomorrow',
    quote: 'Turn your fitness club into a powerhouse of champions.',
  },
  {
    tag: 'POWER & PASSION',
    line1: 'Greatness Is Built',
    line2: 'One Rep At A Time',
    quote: 'Inspire your members to break barriers and shatter goals.',
  },
  {
    tag: 'LEAD THE REVOLUTION',
    line1: 'Discipline Over',
    line2: 'Temporary Motivation',
    quote: 'Fuel the fire of dedication inside your fitness community.',
  },
  {
    tag: 'RELENTLESS DRIVE',
    line1: 'Transform Ambition',
    line2: 'Into Real Strength',
    quote: 'Create an atmosphere where hard work speaks louder than words.',
  },
  {
    tag: 'UNSTOPPABLE EMPIRE',
    line1: 'Forge Legends,',
    line2: 'Break All Boundaries',
    quote: 'Empower every athlete and celebrate every single victory.',
  },
];

export default function Welcome() {
  const [index, setIndex] = useState(1);
  const ref = useRef<FlatList>(null);

  // Staggered converging animation values:
  // Tag slides from left, Line 1 from left, Line 2 from right, Quote from bottom
  const tagAnim = useRef(new Animated.Value(0)).current;
  const line1Anim = useRef(new Animated.Value(0)).current;
  const line2Anim = useRef(new Animated.Value(0)).current;
  const quoteAnim = useRef(new Animated.Value(0)).current;

  const realIndex = (index - 1 + images.length) % images.length;
  const currentMotivational = MOTIVATIONAL_DATA[realIndex] || MOTIVATIONAL_DATA[0];

  useEffect(() => {
    // Reset to separated positions
    tagAnim.setValue(0);
    line1Anim.setValue(0);
    line2Anim.setValue(0);
    quoteAnim.setValue(0);

    // Converge together smoothly
    Animated.parallel([
      Animated.timing(tagAnim, {
        toValue: 1,
        duration: 450,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(line1Anim, {
        toValue: 1,
        duration: 480,
        easing: Easing.out(Easing.back(1.15)),
        useNativeDriver: true,
      }),
      Animated.timing(line2Anim, {
        toValue: 1,
        duration: 480,
        easing: Easing.out(Easing.back(1.15)),
        useNativeDriver: true,
      }),
      Animated.sequence([
        Animated.delay(120),
        Animated.timing(quoteAnim, {
          toValue: 1,
          duration: 400,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  }, [realIndex]);

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
          colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.5)', '#000000']}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
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
                return (
                  <View
                    key={i}
                    style={{
                      transitionDuration: '700ms',
                      transitionProperty: 'all',
                      transitionTimingFunction: 'ease-in-out',
                    }}
                    className={`mr-2 h-2 rounded-full ${i === realIndex ? 'w-8 bg-primary' : 'w-2 bg-white'
                      }`}
                  />
                );
              })}
            </View>
          </View>

          {/* Bottom CTA */}
          <View className="pb-14">
            {/* Stylish Converging Motivational Comment */}
            <View className="mb-10">
              {/* Tag Line from Left */}
              <Animated.View
                style={{
                  opacity: tagAnim,
                  transform: [
                    {
                      translateX: tagAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [-35, 0],
                      }),
                    },
                  ],
                }}
                className="flex-row items-center mb-2">
                <View className="h-[2px] w-6 bg-primary mr-2 rounded-full" />
                <Text className="font-sans font-bold text-xs uppercase tracking-widest text-primary">
                  {currentMotivational.tag}
                </Text>
              </Animated.View>

              {/* Title Lines: Line 1 from Left, Line 2 from Right -> Converge into One */}
              <View>
                <Animated.Text
                  style={{
                    opacity: line1Anim,
                    transform: [
                      {
                        translateX: line1Anim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [-45, 0],
                        }),
                      },
                    ],
                  }}
                  className="font-sans text-[28px] font-extrabold leading-[34px] text-white">
                  {currentMotivational.line1}
                </Animated.Text>

                <Animated.Text
                  style={{
                    opacity: line2Anim,
                    transform: [
                      {
                        translateX: line2Anim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [45, 0],
                        }),
                      },
                    ],
                  }}
                  className="font-sans text-[28px] font-extrabold leading-[34px] text-white">
                  {currentMotivational.line2}
                </Animated.Text>
              </View>

              {/* Quote from Bottom */}
              <Animated.Text
                style={{
                  opacity: quoteAnim,
                  transform: [
                    {
                      translateY: quoteAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [18, 0],
                      }),
                    },
                  ],
                }}
                className="font-sans text-sm font-normal text-white/80 mt-2 leading-5">
                {currentMotivational.quote}
              </Animated.Text>
            </View>

            <Pressable
              onPress={() => router.push('/auth/Login')}
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
                <Text onPress={() => router.push('/terms')}>Terms & Conditions</Text>
                <Text className="font-sans text-sm leading-sm text-background no-underline">
                  {'   '}&{'   '}
                </Text>
                <Text onPress={() => router.push('/privacy')}>Privacy Policy.</Text>
              </Text>
            </View>
          </View>
        </LinearGradient>
      </View>
    </View>
  );
}
