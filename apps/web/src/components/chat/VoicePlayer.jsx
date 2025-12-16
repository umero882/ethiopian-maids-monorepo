/**
 * VoicePlayer Component
 *
 * WhatsApp-style voice message player with waveform visualization
 * Includes local caching to avoid re-downloading previously played messages
 */

import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { Play, Pause, AlertCircle, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';

const MAX_WAVEFORM_BARS = 40;
const CACHE_NAME = 'voice-messages-cache';

// In-memory cache to track blob URLs
const blobUrlCache = new Map();

/**
 * Get cached audio blob URL or null
 */
const getCachedBlobUrl = async (url) => {
  // Check in-memory cache first
  if (blobUrlCache.has(url)) {
    return blobUrlCache.get(url);
  }

  try {
    const cache = await caches.open(CACHE_NAME);
    const response = await cache.match(url);

    if (response) {
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      blobUrlCache.set(url, blobUrl);
      console.log('[VoicePlayer] Found cached voice:', url.substring(0, 50));
      return blobUrl;
    }
  } catch (error) {
    console.warn('[VoicePlayer] Cache read error:', error);
  }

  return null;
};

/**
 * Download and cache voice file
 */
const downloadAndCache = async (url, onProgress) => {
  console.log('[VoicePlayer] Downloading voice to cache...');

  try {
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    // Get total size for progress tracking
    const contentLength = response.headers.get('content-length');
    const total = contentLength ? parseInt(contentLength, 10) : 0;

    // Read response as stream for progress tracking
    const reader = response.body.getReader();
    const chunks = [];
    let loaded = 0;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      chunks.push(value);
      loaded += value.length;

      if (total > 0 && onProgress) {
        onProgress((loaded / total) * 100);
      }
    }

    // Combine chunks into blob
    const blob = new Blob(chunks, { type: 'audio/webm' });
    const blobUrl = URL.createObjectURL(blob);

    // Cache the response for future use
    try {
      const cache = await caches.open(CACHE_NAME);
      const cacheResponse = new Response(blob.slice(), {
        headers: { 'Content-Type': 'audio/webm' }
      });
      await cache.put(url, cacheResponse);
      console.log('[VoicePlayer] Voice cached successfully');
    } catch (cacheError) {
      console.warn('[VoicePlayer] Cache write error:', cacheError);
    }

    // Store in memory cache
    blobUrlCache.set(url, blobUrl);

    return blobUrl;
  } catch (error) {
    console.error('[VoicePlayer] Download failed:', error);
    throw error;
  }
};

const VoicePlayer = ({ url, duration, waveformData, isOwn }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [localUrl, setLocalUrl] = useState(null);
  const [error, setError] = useState(null);

  const audioRef = useRef(null);

  // Check for cached file on mount and preload audio
  useEffect(() => {
    const initAudio = async () => {
      // Check cache first
      const cached = await getCachedBlobUrl(url);
      if (cached) {
        setLocalUrl(cached);
      }

      // Preload audio for faster playback
      // For Firebase URLs, we can preload directly
      const isFirebaseUrl = url.includes('firebasestorage.googleapis.com') ||
                            url.includes('.firebasestorage.app');

      if (isFirebaseUrl || cached) {
        const preloadUrl = cached || url;
        const preloadAudio = new Audio();
        preloadAudio.preload = 'metadata';
        preloadAudio.src = preloadUrl;
        console.log('[VoicePlayer] Preloading audio metadata');
      }
    };
    initAudio();
  }, [url]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  // Normalize waveform data to fixed number of bars
  const normalizedWaveform = useMemo(() => {
    if (!waveformData || waveformData.length === 0) {
      return Array(MAX_WAVEFORM_BARS).fill(0.3);
    }

    if (waveformData.length === MAX_WAVEFORM_BARS) {
      return waveformData;
    }

    // Resample to MAX_WAVEFORM_BARS
    const result = [];
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
    setIsLoading(true);
    setDownloadProgress(0);
    setError(null);

    // If already loaded, just play
    if (audioRef.current) {
      try {
        await audioRef.current.play();
        setIsPlaying(true);
        setIsLoading(false);
        return;
      } catch (err) {
        console.warn('[VoicePlayer] Audio element stale, recreating...', err);
        audioRef.current = null;
      }
    }

    // Determine which URL to use (cached or remote)
    let playUrl = localUrl;

    if (!playUrl) {
      // Check cache first (only if we have a cached version)
      playUrl = await getCachedBlobUrl(url);

      if (!playUrl) {
        // For Firebase Storage URLs, skip fetch-based caching due to CORS
        // The audio element can load directly from Firebase without CORS issues
        const isFirebaseUrl = url.includes('firebasestorage.googleapis.com') ||
                              url.includes('.firebasestorage.app');

        if (isFirebaseUrl) {
          console.log('[VoicePlayer] Using direct Firebase URL (CORS-safe for audio element)');
          playUrl = url;
        } else {
          // For non-Firebase URLs, try to cache
          console.log('[VoicePlayer] Downloading voice message...');
          try {
            playUrl = await downloadAndCache(url, setDownloadProgress);
            setLocalUrl(playUrl);
          } catch (downloadError) {
            console.error('[VoicePlayer] Download failed, trying direct URL:', downloadError);
            // Fallback to direct URL if download fails
            playUrl = url;
          }
        }
      }
    }

    console.log('[VoicePlayer] Playing from:', playUrl.substring(0, 50));

    // Create new audio element
    const audio = new Audio();
    audioRef.current = audio;

    // Set up event listeners before setting src
    audio.addEventListener('timeupdate', () => {
      if (audioRef.current) {
        const pos = audioRef.current.currentTime;
        const dur = audioRef.current.duration || duration;
        setProgress(pos / dur);
        setCurrentTime(Math.floor(pos));
      }
    });

    audio.addEventListener('ended', () => {
      setIsPlaying(false);
      setProgress(0);
      setCurrentTime(0);
    });

    audio.addEventListener('canplaythrough', () => {
      console.log('[VoicePlayer] Audio ready to play');
      setIsLoading(false);
    });

    audio.addEventListener('error', (e) => {
      console.error('[VoicePlayer] Audio error:', e.target?.error);
      setIsLoading(false);
      setError('Failed to load audio');
      // Reset and try direct URL if cached version failed
      if (playUrl !== url && localUrl) {
        console.log('[VoicePlayer] Retrying with direct URL...');
        setLocalUrl(null);
        blobUrlCache.delete(url);
      }
    });

    audio.addEventListener('loadstart', () => {
      console.log('[VoicePlayer] Load started');
    });

    audio.addEventListener('waiting', () => {
      console.log('[VoicePlayer] Buffering...');
    });

    // Only set crossOrigin if using a blob URL (cached)
    // Firebase Storage URLs don't need/want crossOrigin as they have auth tokens
    if (playUrl.startsWith('blob:')) {
      audio.crossOrigin = 'anonymous';
    }

    // Ensure correct playback rate (fix for slow playback issue)
    audio.playbackRate = 1.0;
    audio.defaultPlaybackRate = 1.0;
    audio.preservesPitch = true;

    // Preload the audio
    audio.preload = 'auto';

    // Set the source
    audio.src = playUrl;
    audio.load();

    // Set timeout to prevent infinite loading
    const loadTimeout = setTimeout(() => {
      if (isLoading) {
        console.warn('[VoicePlayer] Load timeout, trying direct play...');
        setIsLoading(false);
      }
    }, 10000); // 10 second timeout

    try {
      await audio.play();
      clearTimeout(loadTimeout);
      setIsPlaying(true);
      setIsLoading(false);
    } catch (playError) {
      clearTimeout(loadTimeout);
      console.error('[VoicePlayer] Failed to play:', playError);
      setIsLoading(false);

      // Check if it's an autoplay policy issue
      if (playError.name === 'NotAllowedError') {
        setError('Click to play');
      } else {
        setError('Playback failed');
      }
    }
  }, [url, duration, localUrl, isLoading]);

  const pause = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
    }
  }, []);

  const togglePlay = useCallback(() => {
    if (error) {
      // Retry on error
      setError(null);
      setLocalUrl(null);
      blobUrlCache.delete(url);
      loadAndPlay();
      return;
    }

    if (isPlaying) {
      pause();
    } else {
      loadAndPlay();
    }
  }, [isPlaying, pause, loadAndPlay, error, url]);

  const handleSeek = useCallback((e) => {
    if (!audioRef.current) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const seekProgress = x / rect.width;
    const dur = audioRef.current.duration || duration;
    audioRef.current.currentTime = seekProgress * dur;
  }, [duration]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div
      className={`flex items-center gap-3 p-3 rounded-2xl min-w-[200px] max-w-[280px] ${
        isOwn ? 'bg-blue-800' : 'bg-slate-100'
      }`}
    >
      <Button
        variant="ghost"
        size="sm"
        onClick={togglePlay}
        disabled={isLoading}
        className={`h-9 w-9 rounded-full p-0 shrink-0 relative ${
          error
            ? 'bg-red-500 text-white hover:bg-red-600'
            : isOwn
              ? 'bg-white text-blue-800 hover:bg-white/90'
              : 'bg-blue-800 text-white hover:bg-blue-900'
        }`}
        title={error || undefined}
      >
        {error ? (
          <RotateCcw className="h-4 w-4" />
        ) : isLoading ? (
          downloadProgress > 0 && downloadProgress < 100 ? (
            // Show download progress
            <span className="text-[9px] font-bold">
              {Math.round(downloadProgress)}%
            </span>
          ) : (
            <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
          )
        ) : isPlaying ? (
          <Pause className="h-4 w-4" />
        ) : (
          <Play className="h-4 w-4 ml-0.5" />
        )}
        {/* Cached indicator */}
        {localUrl && !isLoading && !error && (
          <span
            className={`absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full border border-white ${
              isOwn ? 'bg-blue-800' : 'bg-green-500'
            }`}
          />
        )}
      </Button>

      <div
        className="flex items-center h-8 gap-[2px] flex-1 cursor-pointer"
        onClick={handleSeek}
      >
        {normalizedWaveform.map((amplitude, index) => {
          const height = 4 + amplitude * 20; // 4-24px range
          const isActive = index / normalizedWaveform.length <= progress;

          return (
            <div
              key={index}
              className="w-[3px] rounded-full transition-colors"
              style={{
                height: `${height}px`,
                backgroundColor: isOwn
                  ? isActive
                    ? '#BFDBFE' // Light blue when played (own message)
                    : 'rgba(255,255,255,0.4)' // Faded white
                  : isActive
                    ? '#1E40AF' // Dark blue when played (other message)
                    : '#CBD5E1', // Grey
              }}
            />
          );
        })}
      </div>

      <span
        className={`text-xs font-medium tabular-nums min-w-[32px] text-right ${
          isOwn ? 'text-white/80' : 'text-slate-500'
        }`}
      >
        {formatTime(isPlaying ? currentTime : duration)}
      </span>
    </div>
  );
};

export default VoicePlayer;
