/**
 * VoiceRecorder Component
 *
 * WhatsApp-style voice message recorder with waveform visualization
 * and preview before sending.
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { X, Square, Play, Pause, Trash2, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';

const MAX_WAVEFORM_BARS = 50;

const VoiceRecorder = ({ onRecordingComplete, onCancel, maxDuration = 180 }) => {
  const [state, setState] = useState('recording'); // 'recording' | 'preview'
  const [duration, setDuration] = useState(0);
  const [waveformData, setWaveformData] = useState([]);
  const [audioBlob, setAudioBlob] = useState(null);
  const [audioUrl, setAudioUrl] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackProgress, setPlaybackProgress] = useState(0);

  const mediaRecorderRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const streamRef = useRef(null);
  const chunksRef = useRef([]);
  const animationFrameRef = useRef(null);
  const durationIntervalRef = useRef(null);
  const audioRef = useRef(null);

  // Start recording on mount
  useEffect(() => {
    startRecording();
    return () => cleanup();
  }, []);

  const cleanup = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    if (durationIntervalRef.current) {
      clearInterval(durationIntervalRef.current);
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close();
    }
    if (audioRef.current) {
      audioRef.current.pause();
    }
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
    }
  }, [audioUrl]);

  const startRecording = async () => {
    try {
      // Request audio with specific constraints for consistent sample rate
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: 48000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
        }
      });
      streamRef.current = stream;

      // Set up audio analysis for waveform with matching sample rate
      const audioContext = new (window.AudioContext || window.webkitAudioContext)({
        sampleRate: 48000,
      });
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      const source = audioContext.createMediaStreamSource(stream);
      source.connect(analyser);

      audioContextRef.current = audioContext;
      analyserRef.current = analyser;

      // Determine best supported mime type
      let mimeType = 'audio/webm';
      if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
        mimeType = 'audio/webm;codecs=opus';
      } else if (MediaRecorder.isTypeSupported('audio/mp4')) {
        mimeType = 'audio/mp4';
      } else if (MediaRecorder.isTypeSupported('audio/ogg')) {
        mimeType = 'audio/ogg';
      }

      console.log('[VoiceRecorder] Using mimeType:', mimeType);

      // MediaRecorder for actual recording
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType,
        audioBitsPerSecond: 128000, // 128kbps for good quality
      });

      chunksRef.current = [];
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mimeType });
        const url = URL.createObjectURL(blob);
        setAudioBlob(blob);
        setAudioUrl(url);
        setState('preview');
        stream.getTracks().forEach(track => track.stop());
      };

      // Don't use timeslice - collect all data at once for better timing
      mediaRecorder.start();
      mediaRecorderRef.current = mediaRecorder;

      // Start duration timer
      durationIntervalRef.current = setInterval(() => {
        setDuration(prev => {
          if (prev >= maxDuration) {
            stopRecording();
            return prev;
          }
          return prev + 1;
        });
      }, 1000);

      // Start waveform sampling
      sampleWaveform();

      console.log('[VoiceRecorder] Recording started');
    } catch (error) {
      console.error('[VoiceRecorder] Failed to start recording:', error);
      onCancel();
    }
  };

  const sampleWaveform = () => {
    const analyser = analyserRef.current;
    if (!analyser) return;

    const dataArray = new Uint8Array(analyser.frequencyBinCount);

    const sample = () => {
      if (state !== 'recording' || !analyserRef.current) return;

      analyser.getByteFrequencyData(dataArray);
      const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
      const normalized = average / 255;

      setWaveformData(prev => {
        const newData = [...prev, normalized];
        if (newData.length > MAX_WAVEFORM_BARS) {
          return newData.slice(-MAX_WAVEFORM_BARS);
        }
        return newData;
      });

      animationFrameRef.current = requestAnimationFrame(sample);
    };

    // Sample every 100ms
    const intervalSample = () => {
      sample();
      if (state === 'recording') {
        setTimeout(intervalSample, 100);
      }
    };
    intervalSample();
  };

  const stopRecording = useCallback(() => {
    if (durationIntervalRef.current) {
      clearInterval(durationIntervalRef.current);
    }
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
    console.log('[VoiceRecorder] Recording stopped');
  }, []);

  const handleCancel = useCallback(() => {
    cleanup();
    onCancel();
  }, [cleanup, onCancel]);

  const handleReRecord = useCallback(() => {
    cleanup();
    setState('recording');
    setDuration(0);
    setWaveformData([]);
    setAudioBlob(null);
    setAudioUrl(null);
    setPlaybackProgress(0);
    // Wait a bit before restarting
    setTimeout(() => startRecording(), 100);
  }, [cleanup]);

  const handleSend = useCallback(() => {
    if (!audioBlob) return;
    onRecordingComplete({
      blob: audioBlob,
      duration,
      waveformData: waveformData.length > 0 ? waveformData : Array(MAX_WAVEFORM_BARS).fill(0.3),
    });
  }, [audioBlob, duration, waveformData, onRecordingComplete]);

  const togglePlayback = useCallback(() => {
    if (!audioUrl) return;

    if (!audioRef.current) {
      audioRef.current = new Audio(audioUrl);
      audioRef.current.addEventListener('timeupdate', () => {
        const audio = audioRef.current;
        if (audio) {
          setPlaybackProgress(audio.currentTime / audio.duration);
        }
      });
      audioRef.current.addEventListener('ended', () => {
        setIsPlaying(false);
        setPlaybackProgress(0);
      });
    }

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play();
      setIsPlaying(true);
    }
  }, [audioUrl, isPlaying]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Render waveform bars
  const renderWaveform = (isPreview = false) => {
    const bars = waveformData.length > 0 ? waveformData : Array(MAX_WAVEFORM_BARS).fill(0.2);
    const displayBars = bars.slice(-MAX_WAVEFORM_BARS);

    // Pad to MAX_WAVEFORM_BARS if needed
    while (displayBars.length < MAX_WAVEFORM_BARS) {
      displayBars.push(0.2);
    }

    return (
      <div className="flex items-center h-8 gap-[2px] flex-1">
        {displayBars.map((amplitude, index) => {
          const height = 4 + amplitude * 24; // 4-28px range
          const isActive = isPreview ? index / displayBars.length <= playbackProgress : true;

          return (
            <div
              key={index}
              className="w-[3px] rounded-full transition-all duration-75"
              style={{
                height: `${height}px`,
                backgroundColor: state === 'recording'
                  ? '#EF4444' // Red during recording
                  : isActive
                    ? '#1E40AF' // Blue when played
                    : '#CBD5E1', // Grey when not played
              }}
            />
          );
        })}
      </div>
    );
  };

  return (
    <div className="bg-slate-100 rounded-xl p-3 mx-2 mb-2">
      {state === 'recording' && (
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCancel}
            className="h-10 w-10 rounded-full p-0 bg-white shadow-sm hover:bg-gray-50"
          >
            <X className="h-5 w-5 text-gray-600" />
          </Button>

          <div className="flex items-center gap-2 min-w-[100px]">
            <div className="w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse" />
            <span className="text-sm font-semibold text-slate-700 tabular-nums">
              {formatTime(duration)} / {formatTime(maxDuration)}
            </span>
          </div>

          {renderWaveform()}

          <Button
            variant="destructive"
            size="sm"
            onClick={stopRecording}
            className="h-10 w-10 rounded-full p-0 shadow-md"
          >
            <Square className="h-4 w-4 fill-current" />
          </Button>
        </div>
      )}

      {state === 'preview' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-slate-700">Voice Message</span>
            <span className="text-xs text-slate-500 tabular-nums">{formatTime(duration)}</span>
          </div>

          <div className="flex items-center gap-3 bg-white rounded-lg p-3 shadow-sm">
            <Button
              variant="default"
              size="sm"
              onClick={togglePlayback}
              className="h-11 w-11 rounded-full p-0 bg-blue-800 hover:bg-blue-900 shadow-md"
            >
              {isPlaying ? (
                <Pause className="h-5 w-5" />
              ) : (
                <Play className="h-5 w-5 ml-0.5" />
              )}
            </Button>

            {renderWaveform(true)}
          </div>

          <div className="flex gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={handleReRecord}
              className="flex-1 gap-2 bg-red-50 border-red-200 text-red-600 hover:bg-red-100"
            >
              <Trash2 className="h-4 w-4" />
              Re-record
            </Button>

            <Button
              size="sm"
              onClick={handleSend}
              className="flex-1 gap-2 bg-blue-800 hover:bg-blue-900 shadow-md"
            >
              <Send className="h-4 w-4" />
              Send
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default VoiceRecorder;
