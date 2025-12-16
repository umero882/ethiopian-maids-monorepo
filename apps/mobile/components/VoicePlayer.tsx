/**
 * VoicePlayer Component
 *
 * WhatsApp-style voice message player with waveform visualization
 * Includes local caching to avoid re-downloading previously played messages
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import { File, Directory, Paths } from 'expo-file-system';
import * as FileSystemLegacy from 'expo-file-system/legacy';

interface VoicePlayerProps {
  uri: string;
  duration: number;
  waveformData: number[];
  isOwnMessage: boolean;
}

const MAX_WAVEFORM_BARS = 40;

// Cache directory for voice messages
const VOICE_CACHE_DIR_NAME = 'voice_messages';

// In-memory cache to track downloaded files
const downloadedCache = new Map<string, string>();

/**
 * Generate a cache key from the URL
 */
const getCacheKey = (url: string): string => {
  // Extract filename from URL or create hash
  const urlParts = url.split('/');
  const filename = urlParts[urlParts.length - 1].split('?')[0];
  // Remove any special characters
  return filename.replace(/[^a-zA-Z0-9._-]/g, '_');
};

/**
 * Get the cache directory
 */
const getCacheDir = (): Directory => {
  return new Directory(Paths.cache, VOICE_CACHE_DIR_NAME);
};

/**
 * Ensure cache directory exists
 */
const ensureCacheDir = async (): Promise<void> => {
  const cacheDir = getCacheDir();
  if (!cacheDir.exists) {
    cacheDir.create();
    console.log('[VoicePlayer] Created cache directory');
  }
};

/**
 * Get local path for cached voice file
 */
const getLocalPath = (url: string): string => {
  const cacheKey = getCacheKey(url);
  const cacheDir = getCacheDir();
  return `${cacheDir.uri}/${cacheKey}`;
};

/**
 * Get File object for cached voice file
 */
const getCacheFile = (url: string): File => {
  const cacheKey = getCacheKey(url);
  const cacheDir = getCacheDir();
  return new File(cacheDir, cacheKey);
};

/**
 * Check if file is cached locally
 */
const getCachedUri = async (url: string): Promise<string | null> => {
  // Check in-memory cache first
  if (downloadedCache.has(url)) {
    const cachedPath = downloadedCache.get(url)!;
    const file = new File(cachedPath);
    if (file.exists) {
      return cachedPath;
    }
    // File was deleted, remove from cache
    downloadedCache.delete(url);
  }

  // Check file system
  const file = getCacheFile(url);

  if (file.exists) {
    // Add to in-memory cache
    downloadedCache.set(url, file.uri);
    console.log('[VoicePlayer] Found cached voice:', file.uri);
    return file.uri;
  }

  return null;
};

/**
 * Download and cache voice file
 */
const downloadAndCache = async (
  url: string,
  onProgress?: (progress: number) => void
): Promise<string> => {
  await ensureCacheDir();

  const file = getCacheFile(url);

  console.log('[VoicePlayer] Downloading voice to cache:', file.uri);

  // Use legacy API for download with progress support
  const downloadResumable = FileSystemLegacy.createDownloadResumable(
    url,
    file.uri,
    {},
    (downloadProgress) => {
      const progress = downloadProgress.totalBytesWritten / downloadProgress.totalBytesExpectedToWrite;
      onProgress?.(progress * 100);
    }
  );

  const result = await downloadResumable.downloadAsync();

  if (result?.uri) {
    // Add to in-memory cache
    downloadedCache.set(url, result.uri);
    console.log('[VoicePlayer] Voice cached successfully:', result.uri);
    return result.uri;
  }

  throw new Error('Download failed');
};

export default function VoicePlayer({
  uri,
  duration,
  waveformData,
  isOwnMessage,
}: VoicePlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [localUri, setLocalUri] = useState<string | null>(null);
  const [unsupportedFormat, setUnsupportedFormat] = useState(false);

  const soundRef = useRef<Audio.Sound | null>(null);

  // Check for cached file on mount and validate URI
  useEffect(() => {
    console.log('[VoicePlayer] Mounted with URI:', uri);
    console.log('[VoicePlayer] Platform:', Platform.OS);

    // Check for unsupported formats (WebM not supported on iOS/Android native)
    // Web browsers can play WebM, so only flag on mobile platforms
    const lowerUri = uri.toLowerCase();
    const isWebM = lowerUri.includes('.webm') || lowerUri.includes('webm');
    const isMobilePlatform = Platform.OS === 'ios' || Platform.OS === 'android';

    if (isWebM && isMobilePlatform) {
      console.warn('[VoicePlayer] Unsupported format on mobile: WebM');
      setUnsupportedFormat(true);
      return;
    }

    // Skip caching on web - file system doesn't work the same way
    if (Platform.OS === 'web') {
      console.log('[VoicePlayer] Web platform - skipping cache check');
      return;
    }

    const checkCache = async () => {
      const cached = await getCachedUri(uri);
      if (cached) {
        setLocalUri(cached);
      }
    };
    checkCache();
  }, [uri]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (soundRef.current) {
        soundRef.current.unloadAsync();
      }
    };
  }, []);

  // Normalize waveform data to fixed number of bars
  const normalizedWaveform = useCallback(() => {
    if (!waveformData || waveformData.length === 0) {
      return Array(MAX_WAVEFORM_BARS).fill(0.3);
    }

    if (waveformData.length === MAX_WAVEFORM_BARS) {
      return waveformData;
    }

    // Resample to MAX_WAVEFORM_BARS
    const result: number[] = [];
    const ratio = waveformData.length / MAX_WAVEFORM_BARS;

    for (let i = 0; i < MAX_WAVEFORM_BARS; i++) {
      const start = Math.floor(i * ratio);
      const end = Math.floor((i + 1) * ratio);
      let sum = 0;
      let count = 0;

      for (let j = start; j < end && j < waveformData.length; j++) {
        sum += waveformData[j];
        count++;
      }

      result.push(count > 0 ? sum / count : 0.3);
    }

    return result;
  }, [waveformData]);

  const loadAndPlay = useCallback(async () => {
    try {
      setIsLoading(true);
      setDownloadProgress(0);

      // Set audio mode
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
      });

      // If already loaded, just play
      if (soundRef.current) {
        const status = await soundRef.current.getStatusAsync();
        if (status.isLoaded) {
          await soundRef.current.playAsync();
          setIsPlaying(true);
          setIsLoading(false);
          return;
        }
      }

      // Determine which URI to use (cached or remote)
      let playUri = localUri;

      // On web, always play directly from URL (no caching)
      if (Platform.OS === 'web') {
        playUri = uri;
        console.log('[VoicePlayer] Web platform - playing directly from URL');
      } else if (!playUri) {
        // Check cache again (mobile only)
        playUri = await getCachedUri(uri);

        if (!playUri) {
          // Try to download and cache, fallback to streaming if download fails
          try {
            console.log('[VoicePlayer] Downloading voice message...');
            playUri = await downloadAndCache(uri, setDownloadProgress);
            setLocalUri(playUri);
          } catch (downloadError) {
            console.warn('[VoicePlayer] Download failed, streaming directly:', downloadError);
            // Fallback to streaming from remote URL
            playUri = uri;
          }
        }
      }

      console.log('[VoicePlayer] Playing from:', playUri);

      // Validate URI before attempting to play
      if (!playUri || playUri === 'undefined' || playUri === 'null') {
        console.error('[VoicePlayer] Invalid URI:', playUri);
        setIsLoading(false);
        return;
      }

      // Load and play audio
      try {
        const { sound } = await Audio.Sound.createAsync(
          { uri: playUri },
          { shouldPlay: true },
          (status) => {
            if (status.isLoaded) {
              const pos = status.positionMillis || 0;
              const dur = status.durationMillis || duration * 1000;

              setProgress(pos / dur);
              setCurrentTime(Math.floor(pos / 1000));
              setIsPlaying(status.isPlaying);

              if (status.didJustFinish) {
                setIsPlaying(false);
                setProgress(0);
                setCurrentTime(0);
              }
            }
          }
        );

        soundRef.current = sound;
        setIsPlaying(true);
      } catch (audioError) {
        console.error('[VoicePlayer] Audio load failed for URI:', playUri);
        console.error('[VoicePlayer] Error details:', audioError);
        // The URI might be invalid or the audio format unsupported
      }

      setIsLoading(false);
    } catch (error) {
      console.error('[VoicePlayer] Failed to play:', error);
      setIsLoading(false);
    }
  }, [uri, duration, localUri]);

  const pause = useCallback(async () => {
    if (soundRef.current) {
      await soundRef.current.pauseAsync();
      setIsPlaying(false);
    }
  }, []);

  const togglePlay = useCallback(() => {
    if (isPlaying) {
      pause();
    } else {
      loadAndPlay();
    }
  }, [isPlaying, pause, loadAndPlay]);

  const handleSeek = useCallback(async (barIndex: number) => {
    if (!soundRef.current) return;

    try {
      const status = await soundRef.current.getStatusAsync();
      if (status.isLoaded && status.durationMillis) {
        const seekPosition = (barIndex / MAX_WAVEFORM_BARS) * status.durationMillis;
        await soundRef.current.setPositionAsync(seekPosition);
      }
    } catch (error) {
      console.error('[VoicePlayer] Failed to seek:', error);
    }
  }, []);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const bars = normalizedWaveform();

  // Show unsupported format message
  if (unsupportedFormat) {
    return (
      <View style={[
        styles.container,
        isOwnMessage ? styles.containerOwn : styles.containerOther,
      ]}>
        <View style={[
          styles.playButton,
          isOwnMessage ? styles.playButtonOwn : styles.playButtonOther,
          { opacity: 0.5 },
        ]}>
          <Ionicons
            name="alert-circle"
            size={20}
            color={isOwnMessage ? '#1E40AF' : '#fff'}
          />
        </View>
        <Text style={[
          styles.unsupportedText,
          { color: isOwnMessage ? 'rgba(255,255,255,0.7)' : '#64748B' },
        ]}>
          Audio format not supported
        </Text>
      </View>
    );
  }

  return (
    <View style={[
      styles.container,
      isOwnMessage ? styles.containerOwn : styles.containerOther,
    ]}>
      <TouchableOpacity
        style={[
          styles.playButton,
          isOwnMessage ? styles.playButtonOwn : styles.playButtonOther,
        ]}
        onPress={togglePlay}
        activeOpacity={0.7}
        disabled={isLoading}
      >
        {isLoading ? (
          <View style={styles.loadingContainer}>
            {downloadProgress > 0 && downloadProgress < 100 ? (
              // Show download progress
              <Text style={[
                styles.downloadProgress,
                { color: isOwnMessage ? '#1E40AF' : '#fff' }
              ]}>
                {Math.round(downloadProgress)}%
              </Text>
            ) : (
              <Ionicons
                name="refresh"
                size={20}
                color={isOwnMessage ? '#1E40AF' : '#fff'}
                style={styles.loadingSpinner}
              />
            )}
          </View>
        ) : (
          <View style={styles.playIconContainer}>
            <Ionicons
              name={isPlaying ? 'pause' : 'play'}
              size={20}
              color={isOwnMessage ? '#1E40AF' : '#fff'}
            />
            {/* Show cached indicator (mobile only) */}
            {localUri && Platform.OS !== 'web' && (
              <View style={[
                styles.cachedIndicator,
                { backgroundColor: isOwnMessage ? '#1E40AF' : '#22C55E' }
              ]} />
            )}
          </View>
        )}
      </TouchableOpacity>

      <View style={styles.waveformContainer}>
        {bars.map((amplitude, index) => {
          const height = 4 + amplitude * 20; // 4-24px range
          const isActive = index / bars.length <= progress;

          return (
            <TouchableOpacity
              key={index}
              onPress={() => handleSeek(index)}
              activeOpacity={0.8}
              style={styles.barTouchable}
            >
              <View
                style={[
                  styles.waveformBar,
                  {
                    height,
                    backgroundColor: isOwnMessage
                      ? isActive
                        ? '#BFDBFE' // Light blue when played (own message)
                        : 'rgba(255,255,255,0.4)' // Faded white
                      : isActive
                        ? '#1E40AF' // Dark blue when played (other message)
                        : '#CBD5E1', // Grey
                  },
                ]}
              />
            </TouchableOpacity>
          );
        })}
      </View>

      <Text style={[
        styles.duration,
        isOwnMessage ? styles.durationOwn : styles.durationOther,
      ]}>
        {formatTime(isPlaying ? currentTime : duration)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 8,
    minWidth: 200,
    maxWidth: 280,
    borderRadius: 16,
  },
  containerOwn: {
    backgroundColor: '#1E40AF',
  },
  containerOther: {
    backgroundColor: '#F1F5F9',
  },
  playButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  playButtonOwn: {
    backgroundColor: '#fff',
  },
  playButtonOther: {
    backgroundColor: '#1E40AF',
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingSpinner: {
    opacity: 0.7,
  },
  downloadProgress: {
    fontSize: 9,
    fontWeight: '700',
  },
  playIconContainer: {
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cachedIndicator: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 8,
    height: 8,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: '#fff',
  },
  waveformContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    height: 32,
    gap: 2,
  },
  barTouchable: {
    height: 32,
    justifyContent: 'center',
  },
  waveformBar: {
    width: 3,
    borderRadius: 1.5,
    minHeight: 4,
  },
  duration: {
    fontSize: 11,
    fontWeight: '500',
    marginLeft: 8,
    fontVariant: ['tabular-nums'],
    minWidth: 32,
    textAlign: 'right',
  },
  durationOwn: {
    color: 'rgba(255,255,255,0.8)',
  },
  durationOther: {
    color: '#64748B',
  },
  unsupportedText: {
    fontSize: 12,
    fontStyle: 'italic',
    flex: 1,
    marginLeft: 8,
  },
});
