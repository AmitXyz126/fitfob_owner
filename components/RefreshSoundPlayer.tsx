import React, { forwardRef, useEffect, useImperativeHandle } from 'react';
import { useAudioPlayer, setAudioModeAsync } from 'expo-audio';
import * as Haptics from 'expo-haptics';

export interface RefreshSoundPlayerRef {
  playSound: () => void;
}

// High-quality crisp upbeat UI notification chime (like Swiggy / Zomato order & refresh)
const SWIGGY_REFRESH_SOUND = require('../assets/sounds/swiggy_tune.mp3');

export const RefreshSoundPlayer = forwardRef<RefreshSoundPlayerRef>((_, ref) => {
  const player = useAudioPlayer(SWIGGY_REFRESH_SOUND);

  useEffect(() => {
    // Configure audio mode to ensure sound plays even if the phone is on silent mode
    setAudioModeAsync({
      playsInSilentMode: true,
      interruptionMode: 'mixWithOthers',
    }).catch(() => {});
  }, []);

  useImperativeHandle(ref, () => ({
    playSound: () => {
      // 1. Crisp tactile haptic feedback
      try {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } catch {}

      // 2. Play cheerful Swiggy-style notification tune
      try {
        if (player) {
          if (typeof player.seekTo === 'function') {
            player.seekTo(0).catch(() => {});
          }
          player.play();
        }
      } catch (err) {
        console.log('Error playing refresh sound:', err);
      }
    },
  }));

  return null;
});

RefreshSoundPlayer.displayName = 'RefreshSoundPlayer';
