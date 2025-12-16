/**
 * VoiceRecorder Component
 *
 * WhatsApp-style voice message recorder with waveform visualization
 * and preview before sending.
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Alert,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-av';

export interface VoiceRecordingResult {
  uri: string;
  duration: number;
  waveformData: number[];
}

interface VoiceRecorderProps {
  onRecordingComplete: (recording: VoiceRecordingResult) => void;
  onCancel: () => void;
  maxDuration?: number; // in seconds, default 180 (3 minutes)
}

type RecorderState = 'idle' | 'recording' | 'preview';

const MAX_WAVEFORM_BARS = 50;

export default function VoiceRecorder({
  onRecordingComplete,
  onCancel,
  maxDuration = 180,
}: VoiceRecorderProps) {
  const [state, setState] = useState<RecorderState>('idle');
  const [duration, setDuration] = useState(0);
  const [waveformData, setWaveformData] = useState<number[]>([]);
  const [recordingUri, setRecordingUri] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackProgress, setPlaybackProgress] = useState(0);

  const recordingRef = useRef<Audio.Recording | null>(null);
  const soundRef = useRef<Audio.Sound | null>(null);
  const durationIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const waveformAnimations = useRef<Animated.Value[]>(
    Array(MAX_WAVEFORM_BARS).fill(null).map(() => new Animated.Value(0.2))
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanup();
    };
  }, []);

  const cleanup = useCallback(async () => {
    if (durationIntervalRef.current) {
      clearInterval(durationIntervalRef.current);
      durationIntervalRef.current = null;
    }
    if (recordingRef.current) {
      try {
        await recordingRef.current.stopAndUnloadAsync();
      } catch (e) {
        // Already stopped
      }
      recordingRef.current = null;
    }
    if (soundRef.current) {
      try {
        await soundRef.current.unloadAsync();
      } catch (e) {
        // Already unloaded
      }
      soundRef.current = null;
    }
  }, []);

  const startRecording = useCallback(async () => {
    try {
      console.log('[VoiceRecorder] Requesting permissions...');
      const permission = await Audio.requestPermissionsAsync();

      if (!permission.granted) {
        Alert.alert(
          'Permission Required',
          'Please allow microphone access to record voice messages.',
          [{ text: 'OK' }]
        );
        return;
      }

      console.log('[VoiceRecorder] Setting audio mode...');
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
      });

      console.log('[VoiceRecorder] Creating recording...');
      const recording = new Audio.Recording();

      await recording.prepareToRecordAsync({
        android: {
          extension: '.m4a',
          outputFormat: Audio.AndroidOutputFormat.MPEG_4,
          audioEncoder: Audio.AndroidAudioEncoder.AAC,
          sampleRate: 44100,
          numberOfChannels: 2,
          bitRate: 128000,
        },
        ios: {
          extension: '.m4a',
          audioQuality: Audio.IOSAudioQuality.HIGH,
          sampleRate: 44100,
          numberOfChannels: 2,
          bitRate: 128000,
          outputFormat: Audio.IOSOutputFormat.MPEG4AAC,
        },
        web: {
          mimeType: 'audio/webm',
          bitsPerSecond: 128000,
        },
        isMeteringEnabled: true,
      });

      // Set up metering for waveform
      recording.setOnRecordingStatusUpdate((status) => {
        if (status.isRecording && status.metering !== undefined) {
          // Convert dB to amplitude (0-1 range)
          // Metering values are in dB, typically -160 to 0
          const normalizedAmplitude = Math.max(0, Math.min(1, (status.metering + 60) / 60));

          setWaveformData((prev) => {
            const newData = [...prev, normalizedAmplitude];
            // Keep only the last MAX_WAVEFORM_BARS values
            if (newData.length > MAX_WAVEFORM_BARS) {
              return newData.slice(-MAX_WAVEFORM_BARS);
            }
            return newData;
          });

          // Animate the last bar
          const lastIndex = Math.min(waveformData.length, MAX_WAVEFORM_BARS - 1);
          Animated.spring(waveformAnimations.current[lastIndex], {
            toValue: normalizedAmplitude,
            friction: 5,
            tension: 100,
            useNativeDriver: false,
          }).start();
        }

        // Check max duration
        if (status.durationMillis && status.durationMillis >= maxDuration * 1000) {
          stopRecording();
        }
      });

      await recording.startAsync();
      recordingRef.current = recording;
      setState('recording');
      setDuration(0);
      setWaveformData([]);

      // Start duration timer
      durationIntervalRef.current = setInterval(() => {
        setDuration((prev) => {
          if (prev >= maxDuration) {
            stopRecording();
            return prev;
          }
          return prev + 1;
        });
      }, 1000);

      console.log('[VoiceRecorder] Recording started');
    } catch (error) {
      console.error('[VoiceRecorder] Failed to start recording:', error);
      Alert.alert('Error', 'Failed to start recording. Please try again.');
    }
  }, [maxDuration, waveformData.length]);

  const stopRecording = useCallback(async () => {
    if (!recordingRef.current) return;

    try {
      console.log('[VoiceRecorder] Stopping recording...');

      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
        durationIntervalRef.current = null;
      }

      const recording = recordingRef.current;
      await recording.stopAndUnloadAsync();

      const uri = recording.getURI();
      const status = await recording.getStatusAsync();

      console.log('[VoiceRecorder] Recording stopped:', {
        uri,
        duration: status.durationMillis,
      });

      recordingRef.current = null;

      if (uri) {
        setRecordingUri(uri);
        setDuration(Math.floor((status.durationMillis || 0) / 1000));
        setState('preview');
      }

      // Reset audio mode
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
      });
    } catch (error) {
      console.error('[VoiceRecorder] Failed to stop recording:', error);
      Alert.alert('Error', 'Failed to stop recording.');
      setState('idle');
    }
  }, []);

  const cancelRecording = useCallback(async () => {
    await cleanup();
    setState('idle');
    setDuration(0);
    setWaveformData([]);
    setRecordingUri(null);
    onCancel();
  }, [cleanup, onCancel]);

  const playPreview = useCallback(async () => {
    if (!recordingUri) return;

    try {
      if (soundRef.current) {
        await soundRef.current.unloadAsync();
      }

      const { sound } = await Audio.Sound.createAsync(
        { uri: recordingUri },
        { shouldPlay: true },
        (status) => {
          if (status.isLoaded) {
            if (status.positionMillis && status.durationMillis) {
              setPlaybackProgress(status.positionMillis / status.durationMillis);
            }
            setIsPlaying(status.isPlaying);

            if (status.didJustFinish) {
              setIsPlaying(false);
              setPlaybackProgress(0);
            }
          }
        }
      );

      soundRef.current = sound;
      setIsPlaying(true);
    } catch (error) {
      console.error('[VoiceRecorder] Failed to play preview:', error);
    }
  }, [recordingUri]);

  const pausePreview = useCallback(async () => {
    if (soundRef.current) {
      await soundRef.current.pauseAsync();
      setIsPlaying(false);
    }
  }, []);

  const handleSend = useCallback(() => {
    if (!recordingUri) return;

    onRecordingComplete({
      uri: recordingUri,
      duration,
      waveformData: waveformData.length > 0 ? waveformData : Array(MAX_WAVEFORM_BARS).fill(0.3),
    });
  }, [recordingUri, duration, waveformData, onRecordingComplete]);

  const handleReRecord = useCallback(async () => {
    await cleanup();
    setState('idle');
    setDuration(0);
    setWaveformData([]);
    setRecordingUri(null);
    setPlaybackProgress(0);
    // Start recording again
    startRecording();
  }, [cleanup, startRecording]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Auto-start recording when component mounts
  useEffect(() => {
    if (state === 'idle') {
      startRecording();
    }
  }, []);

  // Render waveform bars
  const renderWaveform = (isPreview: boolean = false) => {
    const bars = isPreview ? waveformData : waveformData.slice(-MAX_WAVEFORM_BARS);
    const displayBars = bars.length > 0 ? bars : Array(MAX_WAVEFORM_BARS).fill(0.2);

    // Pad to MAX_WAVEFORM_BARS if needed
    while (displayBars.length < MAX_WAVEFORM_BARS) {
      displayBars.push(0.2);
    }

    return (
      <View style={styles.waveformContainer}>
        {displayBars.map((amplitude, index) => {
          const height = 4 + amplitude * 20; // 4-24px range
          const isActive = isPreview ? index / displayBars.length <= playbackProgress : true;

          return (
            <View
              key={index}
              style={[
                styles.waveformBar,
                {
                  height,
                  backgroundColor: state === 'recording'
                    ? '#EF4444' // Red during recording
                    : isActive
                      ? '#1E40AF' // Blue when played
                      : '#CBD5E1', // Grey when not played
                },
              ]}
            />
          );
        })}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {state === 'recording' && (
        <View style={styles.recordingContainer}>
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={cancelRecording}
            activeOpacity={0.7}
          >
            <Ionicons name="close" size={24} color="#64748B" />
          </TouchableOpacity>

          <View style={styles.recordingInfo}>
            <View style={styles.recordingIndicator}>
              <Animated.View
                style={[
                  styles.recordingDot,
                  {
                    opacity: new Animated.Value(1),
                  },
                ]}
              />
            </View>
            <Text style={styles.durationText}>
              {formatTime(duration)} / {formatTime(maxDuration)}
            </Text>
          </View>

          {renderWaveform()}

          <TouchableOpacity
            style={styles.stopButton}
            onPress={stopRecording}
            activeOpacity={0.7}
          >
            <View style={styles.stopIcon} />
          </TouchableOpacity>
        </View>
      )}

      {state === 'preview' && (
        <View style={styles.previewContainer}>
          <View style={styles.previewHeader}>
            <Text style={styles.previewTitle}>Voice Message</Text>
            <Text style={styles.previewDuration}>{formatTime(duration)}</Text>
          </View>

          <View style={styles.previewPlayer}>
            <TouchableOpacity
              style={styles.playButton}
              onPress={isPlaying ? pausePreview : playPreview}
              activeOpacity={0.7}
            >
              <Ionicons
                name={isPlaying ? 'pause' : 'play'}
                size={24}
                color="#fff"
              />
            </TouchableOpacity>

            {renderWaveform(true)}
          </View>

          <View style={styles.previewActions}>
            <TouchableOpacity
              style={styles.reRecordButton}
              onPress={handleReRecord}
              activeOpacity={0.7}
            >
              <Ionicons name="trash-outline" size={20} color="#EF4444" />
              <Text style={styles.reRecordText}>Re-record</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.sendVoiceButton}
              onPress={handleSend}
              activeOpacity={0.7}
            >
              <Ionicons name="send" size={20} color="#fff" />
              <Text style={styles.sendVoiceText}>Send</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: 12,
    marginHorizontal: 8,
    marginBottom: 8,
  },
  recordingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  cancelButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  recordingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    minWidth: 100,
  },
  recordingIndicator: {
    width: 12,
    height: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  recordingDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#EF4444',
  },
  durationText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
    fontVariant: ['tabular-nums'],
  },
  waveformContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    height: 32,
    gap: 2,
  },
  waveformBar: {
    width: 3,
    borderRadius: 1.5,
    minHeight: 4,
  },
  stopButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#EF4444',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  stopIcon: {
    width: 14,
    height: 14,
    borderRadius: 2,
    backgroundColor: '#fff',
  },
  previewContainer: {
    gap: 12,
  },
  previewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  previewTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
  },
  previewDuration: {
    fontSize: 13,
    color: '#64748B',
    fontVariant: ['tabular-nums'],
  },
  previewPlayer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  playButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#1E40AF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#1E40AF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  previewActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  reRecordButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#FEE2E2',
  },
  reRecordText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#EF4444',
  },
  sendVoiceButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#1E40AF',
    shadowColor: '#1E40AF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  sendVoiceText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
});
