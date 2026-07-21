import React, { useEffect, useRef, useState } from 'react';
import { View, Text, Modal, Animated, StyleSheet, Easing, Dimensions, Image } from 'react-native';

interface GymLoaderProps {
  visible: boolean;
}

const { width, height } = Dimensions.get('window');

const MOTIVATIONAL_LINES = [
  "WARMING UP...",
  "PREPPING THE BENCH...",
  "LOADING THE PLATES...",
  "PUMPING THE DATA...",
  "STRETCHING THE APIS..."
];

export default function GymLoader({ visible }: GymLoaderProps) {
  const liftAnim = useRef(new Animated.Value(0)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const [lineIndex, setLineIndex] = useState(0);

  useEffect(() => {
    if (visible) {
      // 1. Barbell Lifting animation
      Animated.loop(
        Animated.sequence([
          Animated.timing(liftAnim, {
            toValue: -22,
            duration: 1200,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(liftAnim, {
            toValue: 0,
            duration: 1200,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      ).start();

      // 2. Circular rotation animation for spinner ring
      Animated.loop(
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 1400,
          easing: Easing.linear,
          useNativeDriver: true,
        })
      ).start();

      // 3. Pulsing text animation
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.08,
            duration: 750,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 750,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      ).start();

      // Cycle motivational quotes
      const interval = setInterval(() => {
        setLineIndex((prev) => (prev + 1) % MOTIVATIONAL_LINES.length);
      }, 1600);

      return () => clearInterval(interval);
    } else {
      liftAnim.setValue(0);
      rotateAnim.setValue(0);
      pulseAnim.setValue(1);
      setLineIndex(0);
    }
  }, [visible, liftAnim, rotateAnim, pulseAnim]);

  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <Modal transparent visible={visible} animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.card}>
          
          {/* Circular Track and Barbell Container */}
          <View style={styles.animationArea}>
            {/* Spinning Outer Ring */}
            <Animated.View style={[styles.outerRing, { transform: [{ rotate: spin }] }]}>
              <View style={styles.ringDot} />
              <View style={styles.ringDotOpposite} />
            </Animated.View>
            
            {/* Centered Barbell Lifting */}
            <Animated.View style={[styles.barbell, { transform: [{ translateY: liftAnim }] }]}>
              <Image
                source={require('../assets/images/Vector.png')}
                style={{ width: 40, height: 40 }}
                resizeMode="contain"
              />
            </Animated.View>
            
            {/* Dynamic Ground Shadow */}
            <Animated.View 
              style={[
                styles.shadow, 
                { 
                  opacity: liftAnim.interpolate({
                    inputRange: [-22, 0],
                    outputRange: [0.15, 0.7]
                  }),
                  transform: [{ 
                    scaleX: liftAnim.interpolate({
                      inputRange: [-22, 0],
                      outputRange: [0.55, 1]
                    }) 
                  }]
                }
              ]} 
            />
          </View>

          {/* Motivational Gym Text */}
          <Animated.Text style={[styles.statusText, { transform: [{ scale: pulseAnim }] }]}>
            {MOTIVATIONAL_LINES[lineIndex]}
          </Animated.Text>
          
          <Text style={styles.subText}>Pumping up your details...</Text>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    width,
    height,
    backgroundColor: 'rgba(15, 23, 42, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    width: 250,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    paddingVertical: 35,
    paddingHorizontal: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 8,
  },
  animationArea: {
    width: 120,
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  outerRing: {
    position: 'absolute',
    width: 106,
    height: 106,
    borderRadius: 53,
    borderWidth: 3,
    borderColor: 'rgba(246, 22, 60, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  ringDot: {
    position: 'absolute',
    top: -5,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#F6163C',
    shadowColor: '#F6163C',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
    elevation: 3,
  },
  ringDotOpposite: {
    position: 'absolute',
    bottom: -5,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#F6163C',
    shadowColor: '#F6163C',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
    elevation: 3,
  },
  barbell: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 64,
    height: 64,
    zIndex: 2,
  },
  bar: {
    width: 46,
    height: 4,
    backgroundColor: '#64748B',
    borderRadius: 2,
    zIndex: 1,
  },
  plate: {
    backgroundColor: '#F6163C',
    borderRadius: 3.5,
    zIndex: 2,
  },
  plateInner: {
    width: 6,
    height: 26,
    marginHorizontal: -2,
    backgroundColor: '#F6163C',
  },
  plateOuter: {
    width: 5,
    height: 18,
    backgroundColor: '#cf1333',
  },
  shadow: {
    position: 'absolute',
    bottom: 22,
    width: 44,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(100, 116, 139, 0.25)',
    zIndex: 1,
  },
  statusText: {
    color: '#F6163C',
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 1.5,
    marginTop: 12,
    marginBottom: 6,
    textAlign: 'center',
  },
  subText: {
    color: '#475569',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
});
