/**
 * useSound Hook
 *
 * Provides sound playback functionality for gamification events using expo-av.
 * Handles audio mode configuration and graceful fallbacks when sounds are unavailable.
 *
 * Sound types:
 * - points: Short coin/ding sound for points awarded
 * - achievement: Triumphant chime for unlocking achievements
 * - confetti: Pop/burst sound for celebrations
 * - levelUp: Ascending fanfare for leveling up
 * - success: Positive completion sound
 * - error: Error/failure notification
 * - click: UI feedback sound
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { Audio, AVPlaybackStatus } from 'expo-av';
import { Platform } from 'react-native';

// Sound type definitions
export type SoundType =
  | 'points'
  | 'achievement'
  | 'confetti'
  | 'levelUp'
  | 'success'
  | 'error'
  | 'click';

// Sound file mappings - these files are in assets/sounds/
// Metro bundler will handle requiring these at build time
const SOUND_FILES: Record<SoundType, ReturnType<typeof require>> = {
  points: require('../assets/sounds/points.mp3'),
  achievement: require('../assets/sounds/achievement.mp3'),
  confetti: require('../assets/sounds/confetti.mp3'),
  levelUp: require('../assets/sounds/level-up.mp3'),
  success: require('../assets/sounds/success.mp3'),
  error: require('../assets/sounds/error.mp3'),
  click: require('../assets/sounds/click.mp3'),
};

interface UseSoundOptions {
  enabled?: boolean;
  volume?: number;
}

interface UseSoundReturn {
  playSound: (type: SoundType) => Promise<void>;
  playPoints: () => Promise<void>;
  playAchievement: () => Promise<void>;
  playConfetti: () => Promise<void>;
  playLevelUp: () => Promise<void>;
  playSuccess: () => Promise<void>;
  playError: () => Promise<void>;
  playClick: () => Promise<void>;
  isEnabled: boolean;
  setEnabled: (enabled: boolean) => void;
  isSoundAvailable: (type: SoundType) => boolean;
}

export function useSound(options: UseSoundOptions = {}): UseSoundReturn {
  const { enabled: initialEnabled = true, volume = 1.0 } = options;
  const [isEnabled, setIsEnabled] = useState(initialEnabled);
  const soundRef = useRef<Audio.Sound | null>(null);
  const isConfigured = useRef(false);

  // Configure audio mode on mount
  useEffect(() => {
    const configureAudio = async () => {
      if (isConfigured.current) return;

      try {
        await Audio.setAudioModeAsync({
          playsInSilentModeIOS: true,
          staysActiveInBackground: false,
          shouldDuckAndroid: true,
          playThroughEarpieceAndroid: false,
        });
        isConfigured.current = true;
        console.log('[useSound] Audio mode configured');
      } catch (error) {
        console.warn('[useSound] Failed to configure audio mode:', error);
      }
    };

    configureAudio();

    // Cleanup on unmount
    return () => {
      if (soundRef.current) {
        soundRef.current.unloadAsync().catch(() => {});
      }
    };
  }, []);

  // Check if a sound file is available
  const isSoundAvailable = useCallback((type: SoundType): boolean => {
    return SOUND_FILES[type] !== null;
  }, []);

  // Play a sound by type
  const playSound = useCallback(
    async (type: SoundType): Promise<void> => {
      if (!isEnabled) {
        console.log('[useSound] Sounds disabled, skipping:', type);
        return;
      }

      const soundFile = SOUND_FILES[type];
      if (!soundFile) {
        console.log('[useSound] Sound file not available:', type);
        return;
      }

      try {
        // Unload previous sound if still loaded
        if (soundRef.current) {
          await soundRef.current.unloadAsync().catch(() => {});
          soundRef.current = null;
        }

        // Create and play the new sound
        const { sound } = await Audio.Sound.createAsync(soundFile, {
          volume,
          shouldPlay: true,
        });

        soundRef.current = sound;

        // Auto-unload when playback finishes
        sound.setOnPlaybackStatusUpdate((status: AVPlaybackStatus) => {
          if (status.isLoaded && status.didJustFinish) {
            sound.unloadAsync().catch(() => {});
            if (soundRef.current === sound) {
              soundRef.current = null;
            }
          }
        });

        console.log('[useSound] Playing sound:', type);
      } catch (error) {
        console.warn('[useSound] Error playing sound:', type, error);
      }
    },
    [isEnabled, volume]
  );

  // Convenience methods for each sound type
  const playPoints = useCallback(() => playSound('points'), [playSound]);
  const playAchievement = useCallback(() => playSound('achievement'), [playSound]);
  const playConfetti = useCallback(() => playSound('confetti'), [playSound]);
  const playLevelUp = useCallback(() => playSound('levelUp'), [playSound]);
  const playSuccess = useCallback(() => playSound('success'), [playSound]);
  const playError = useCallback(() => playSound('error'), [playSound]);
  const playClick = useCallback(() => playSound('click'), [playSound]);

  return {
    playSound,
    playPoints,
    playAchievement,
    playConfetti,
    playLevelUp,
    playSuccess,
    playError,
    playClick,
    isEnabled,
    setEnabled: setIsEnabled,
    isSoundAvailable,
  };
}

export default useSound;
