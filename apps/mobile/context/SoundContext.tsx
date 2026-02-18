/**
 * SoundContext
 *
 * Provides app-wide sound playback for gamification and UI feedback.
 * Uses expo-av for audio playback with support for both bundled and
 * remote sound files.
 */

import React, {
  createContext,
  useContext,
  useCallback,
  useEffect,
  useRef,
  useState,
  ReactNode,
} from 'react';
import { Audio, AVPlaybackStatus } from 'expo-av';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ==================== TYPES ====================

export type SoundType =
  | 'points'
  | 'achievement'
  | 'confetti'
  | 'levelUp'
  | 'success'
  | 'error'
  | 'click';

interface SoundContextType {
  playSound: (type: SoundType) => Promise<void>;
  playPoints: () => Promise<void>;
  playAchievement: () => Promise<void>;
  playConfetti: () => Promise<void>;
  playLevelUp: () => Promise<void>;
  playSuccess: () => Promise<void>;
  playError: () => Promise<void>;
  playClick: () => Promise<void>;
  soundEnabled: boolean;
  setSoundEnabled: (enabled: boolean) => void;
  toggleSound: () => void;
}

// ==================== CONSTANTS ====================

const SOUND_ENABLED_KEY = 'ethiopian_maids_sound_enabled';

// Sound file mappings
// Using CDN-hosted royalty-free sounds that are small and load quickly
// These can be replaced with local assets when available
const SOUND_URLS: Record<SoundType, string> = {
  // Short, pleasant notification sounds from Mixkit (royalty-free)
  points: 'https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3', // Coin clink
  achievement: 'https://assets.mixkit.co/active_storage/sfx/1435/1435-preview.mp3', // Achievement bell
  confetti: 'https://assets.mixkit.co/active_storage/sfx/2003/2003-preview.mp3', // Pop sound
  levelUp: 'https://assets.mixkit.co/active_storage/sfx/2019/2019-preview.mp3', // Level up fanfare
  success: 'https://assets.mixkit.co/active_storage/sfx/2000/2000-preview.mp3', // Success chime
  error: 'https://assets.mixkit.co/active_storage/sfx/2004/2004-preview.mp3', // Error tone
  click: 'https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3', // Click
};

// Local sound files - these are bundled with the app
const LOCAL_SOUNDS: Record<SoundType, ReturnType<typeof require>> = {
  points: require('../assets/sounds/points.mp3'),
  achievement: require('../assets/sounds/achievement.mp3'),
  confetti: require('../assets/sounds/confetti.mp3'),
  levelUp: require('../assets/sounds/level-up.mp3'),
  success: require('../assets/sounds/success.mp3'),
  error: require('../assets/sounds/error.mp3'),
  click: require('../assets/sounds/click.mp3'),
};

// ==================== CONTEXT ====================

const SoundContext = createContext<SoundContextType | null>(null);

// ==================== PROVIDER ====================

interface SoundProviderProps {
  children: ReactNode;
}

export function SoundProvider({ children }: SoundProviderProps) {
  const [soundEnabled, setSoundEnabledState] = useState(true);
  const soundRef = useRef<Audio.Sound | null>(null);
  const isConfigured = useRef(false);
  const preloadedSounds = useRef<Partial<Record<SoundType, Audio.Sound>>>({});

  // Load sound preference
  useEffect(() => {
    const loadSoundPreference = async () => {
      try {
        const stored = await AsyncStorage.getItem(SOUND_ENABLED_KEY);
        if (stored !== null) {
          setSoundEnabledState(stored === 'true');
        }
      } catch (error) {
        console.warn('[SoundContext] Error loading sound preference:', error);
      }
    };
    loadSoundPreference();
  }, []);

  // Configure audio mode
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
        console.log('[SoundContext] Audio mode configured');
      } catch (error) {
        console.warn('[SoundContext] Failed to configure audio:', error);
      }
    };

    configureAudio();

    // Cleanup
    return () => {
      // Unload all preloaded sounds
      Object.values(preloadedSounds.current).forEach(sound => {
        sound?.unloadAsync().catch(() => {});
      });
      soundRef.current?.unloadAsync().catch(() => {});
    };
  }, []);

  // Preload common sounds for faster playback
  useEffect(() => {
    const preloadSounds = async () => {
      const soundsToPreload: SoundType[] = ['points', 'success'];

      for (const type of soundsToPreload) {
        try {
          const localSound = LOCAL_SOUNDS[type];
          if (localSound) {
            const { sound } = await Audio.Sound.createAsync(localSound);
            preloadedSounds.current[type] = sound;
            console.log('[SoundContext] Preloaded local sound:', type);
          }
        } catch (error) {
          // Ignore preload errors, will load on-demand
        }
      }
    };

    if (soundEnabled) {
      preloadSounds();
    }
  }, [soundEnabled]);

  // Set sound enabled preference
  const setSoundEnabled = useCallback(async (enabled: boolean) => {
    setSoundEnabledState(enabled);
    try {
      await AsyncStorage.setItem(SOUND_ENABLED_KEY, String(enabled));
    } catch (error) {
      console.warn('[SoundContext] Error saving sound preference:', error);
    }
  }, []);

  // Toggle sound
  const toggleSound = useCallback(() => {
    setSoundEnabled(!soundEnabled);
  }, [soundEnabled, setSoundEnabled]);

  // Play a sound
  const playSound = useCallback(async (type: SoundType): Promise<void> => {
    if (!soundEnabled) {
      return;
    }

    try {
      // Check for preloaded sound first
      const preloaded = preloadedSounds.current[type];
      if (preloaded) {
        await preloaded.setPositionAsync(0);
        await preloaded.playAsync();
        console.log('[SoundContext] Played preloaded sound:', type);
        return;
      }

      // Unload previous sound
      if (soundRef.current) {
        await soundRef.current.unloadAsync().catch(() => {});
        soundRef.current = null;
      }

      // Use local bundled sound
      const localSound = LOCAL_SOUNDS[type];
      const result = await Audio.Sound.createAsync(localSound, {
        shouldPlay: true,
        volume: 0.8,
      });
      const sound = result.sound;
      console.log('[SoundContext] Playing sound:', type);

      soundRef.current = sound;

      // Auto-unload when finished
      sound.setOnPlaybackStatusUpdate((status: AVPlaybackStatus) => {
        if (status.isLoaded && status.didJustFinish) {
          sound.unloadAsync().catch(() => {});
          if (soundRef.current === sound) {
            soundRef.current = null;
          }
        }
      });
    } catch (error) {
      console.warn('[SoundContext] Error playing sound:', type, error);
    }
  }, [soundEnabled]);

  // Convenience methods
  const playPoints = useCallback(() => playSound('points'), [playSound]);
  const playAchievement = useCallback(() => playSound('achievement'), [playSound]);
  const playConfetti = useCallback(() => playSound('confetti'), [playSound]);
  const playLevelUp = useCallback(() => playSound('levelUp'), [playSound]);
  const playSuccess = useCallback(() => playSound('success'), [playSound]);
  const playError = useCallback(() => playSound('error'), [playSound]);
  const playClick = useCallback(() => playSound('click'), [playSound]);

  const value: SoundContextType = {
    playSound,
    playPoints,
    playAchievement,
    playConfetti,
    playLevelUp,
    playSuccess,
    playError,
    playClick,
    soundEnabled,
    setSoundEnabled,
    toggleSound,
  };

  return (
    <SoundContext.Provider value={value}>
      {children}
    </SoundContext.Provider>
  );
}

// ==================== HOOK ====================

export function useSoundContext(): SoundContextType {
  const context = useContext(SoundContext);
  if (!context) {
    throw new Error('useSoundContext must be used within a SoundProvider');
  }
  return context;
}

export default SoundContext;
