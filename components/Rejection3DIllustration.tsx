import React from 'react';
import { View } from 'react-native';
import Svg, {
  Circle,
  Path,
  Rect,
  Defs,
  LinearGradient as SvgGradient,
  Stop,
  Filter,
  FeDropShadow,
  G,
} from 'react-native-svg';

export const Rejection3DIllustration = () => {
  return (
    <View className="items-center justify-center py-2">
      <Svg width={180} height={180} viewBox="0 0 180 180" fill="none">
        <Defs>
          {/* Base Platform Shadow */}
          <Filter id="dropShadow" x="-20%" y="-20%" width="140%" height="140%">
            <FeDropShadow dx={0} dy={10} stdDeviation={12} floodColor="#F6163C" floodOpacity={0.22} />
          </Filter>

          <Filter id="shieldShadow" x="-20%" y="-20%" width="140%" height="140%">
            <FeDropShadow dx={0} dy={8} stdDeviation={8} floodColor="#900C22" floodOpacity={0.35} />
          </Filter>

          {/* Platform Gradient */}
          <SvgGradient id="platformGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor="#FFFFFF" />
            <Stop offset="50%" stopColor="#FFF4F6" />
            <Stop offset="100%" stopColor="#FFE4E8" />
          </SvgGradient>

          {/* Platform Ring Gradient */}
          <SvgGradient id="ringGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor="#F6163C" stopOpacity={0.4} />
            <Stop offset="100%" stopColor="#F6163C" stopOpacity={0.08} />
          </SvgGradient>

          {/* Shield Main Gradient */}
          <SvgGradient id="shieldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor="#FF4B6B" />
            <Stop offset="50%" stopColor="#F6163C" />
            <Stop offset="100%" stopColor="#C90022" />
          </SvgGradient>

          {/* Shield Gloss Overlay */}
          <SvgGradient id="glossGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor="#FFFFFF" stopOpacity={0.4} />
            <Stop offset="100%" stopColor="#FFFFFF" stopOpacity={0.0} />
          </SvgGradient>
        </Defs>

       

        {/* Outer Pulsing Halo */}
        <Circle cx="90" cy="95" r="76" fill="#FFF0F3" opacity={0.8} />

        {/* 3D Platform Base */}
        <G filter="url(#dropShadow)">
          <Circle cx="90" cy="95" r="66" fill="url(#platformGrad)" stroke="url(#ringGrad)" strokeWidth={3} />
          <Circle cx="90" cy="95" r="54" fill="#FFFFFF" stroke="#FFE4E8" strokeWidth={2} />
        </G>

        {/* 3D Shield Graphic */}
        <G filter="url(#shieldShadow)">
          {/* Main Shield Path */}
          <Path
            d="M90 40 L122 52 C122 84 108 112 90 124 C72 112 58 84 58 52 Z"
            fill="url(#shieldGrad)"
          />
          {/* Gloss Highlight on Shield */}
          <Path
            d="M90 42 L118 53 C118 78 107 102 90 114 Z"
            fill="url(#glossGrad)"
          />

          {/* Crisp White Rejection Cross (X) inside Shield */}
          <Path
            d="M78 70 L102 94 M102 70 L78 94"
            stroke="#FFFFFF"
            strokeWidth={6.5}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </G>

        {/* Top Floating Badge Decorator */}
        <Circle cx="120" cy="48" r="10" fill="#FFFFFF" />
        <Circle cx="120" cy="48" r="8" fill="#F6163C" />
        <Path d="M117 48 L123 48" stroke="#FFFFFF" strokeWidth={2.5} strokeLinecap="round" />
      </Svg>
    </View>
  );
};
