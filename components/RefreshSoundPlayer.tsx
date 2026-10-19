import React, { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';
import * as Haptics from 'expo-haptics';

export interface RefreshSoundPlayerRef {
  playSound: () => void;
}

// High-quality crisp upbeat UI notification chime (like Swiggy / Zomato order & refresh)
const SWIGGY_REFRESH_SOUND = require('../assets/sounds/swiggy_tune.mp3');

export const RefreshSoundPlayer = forwardRef<RefreshSoundPlayerRef>((_, ref) => {
  const playerRef = useRef<any>(null);

  useEffect(() => {
    let isMounted = true;

    const setupAudio = async () => {
      try {
        // Dynamically load expo-audio to prevent top-level hook crashes if native module is not ready
        const expoAudio = await import('expo-audio');
        if (!isMounted) return;

        if (expoAudio && typeof expoAudio.setAudioModeAsync === 'function') {
          expoAudio
            .setAudioModeAsync({
              playsInSilentMode: true,
              interruptionMode: 'mixWithOthers',
            })
            .catch(() => {});
        }

        if (expoAudio && typeof expoAudio.createAudioPlayer === 'function') {
          const p = expoAudio.createAudioPlayer(SWIGGY_REFRESH_SOUND);
          if (isMounted) {
            playerRef.current = p;
          }
        }
      } catch (err) {
        console.warn('Audio player initialization skipped (not critical):', err);
      }
    };

    setupAudio();

    return () => {
      isMounted = false;
      try {
        if (playerRef.current && typeof playerRef.current.remove === 'function') {
          playerRef.current.remove();
        }
      } catch {}
    };
  }, []);

  useImperativeHandle(ref, () => ({
    playSound: () => {
      // 1. Crisp tactile haptic feedback
      try {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } catch {}

      // 2. Play cheerful Swiggy-style notification tune
      try {
        const p = playerRef.current;
        if (p) {
          if (typeof p.seekTo === 'function') {
            p.seekTo(0).catch(() => {});
          }
          if (typeof p.play === 'function') {
            p.play();
          }
        }
      } catch (err) {
        console.log('Error playing refresh sound:', err);
      }
    },
  }));

  return null;
});

RefreshSoundPlayer.displayName = 'RefreshSoundPlayer';

