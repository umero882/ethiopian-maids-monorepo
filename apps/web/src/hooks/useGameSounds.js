/**
 * useGameSounds - Gamification sound effects for onboarding
 * Uses Web Audio API to generate sounds programmatically (no external files needed)
 */
import { useCallback, useRef } from 'react';

// Create AudioContext lazily (browsers require user interaction first)
let audioCtx = null;
function getAudioContext() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

// Generate a pleasant chime/ding sound
function playChime(frequency = 880, duration = 0.15, volume = 0.3) {
  try {
    const ctx = getAudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(frequency, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(frequency * 1.5, ctx.currentTime + duration * 0.3);
    
    gain.gain.setValueAtTime(volume, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + duration);
  } catch (e) {
    // Silently fail if audio isn't available
  }
}

// Points awarded sound - quick ascending notes
function playPointsSound() {
  playChime(523, 0.1, 0.2);  // C5
  setTimeout(() => playChime(659, 0.1, 0.2), 80);  // E5
  setTimeout(() => playChime(784, 0.15, 0.25), 160); // G5
}

// Level up sound - triumphant ascending arpeggio
function playLevelUpSound() {
  playChime(523, 0.15, 0.3);  // C5
  setTimeout(() => playChime(659, 0.15, 0.3), 120);  // E5
  setTimeout(() => playChime(784, 0.15, 0.3), 240);  // G5
  setTimeout(() => playChime(1047, 0.3, 0.35), 360); // C6
}

// Achievement/badge unlocked - fanfare
function playAchievementSound() {
  playChime(784, 0.12, 0.25);   // G5
  setTimeout(() => playChime(988, 0.12, 0.25), 100);  // B5
  setTimeout(() => playChime(1175, 0.12, 0.25), 200); // D6
  setTimeout(() => playChime(1568, 0.4, 0.3), 300);   // G6
  setTimeout(() => playChime(1568, 0.15, 0.15), 500);  // G6 (echo)
}

// Step complete - satisfying click/pop
function playStepCompleteSound() {
  playChime(1047, 0.08, 0.2);  // Quick high note
  setTimeout(() => playChime(1319, 0.12, 0.25), 60); // Higher resolve
}

// Celebration/confetti sound - sparkly cascade
function playCelebrationSound() {
  const notes = [1047, 1175, 1319, 1397, 1568, 1760, 2093];
  notes.forEach((freq, i) => {
    setTimeout(() => playChime(freq, 0.1, 0.15 + i * 0.02), i * 50);
  });
}

// Error/wrong sound - gentle descending
function playErrorSound() {
  playChime(440, 0.15, 0.2);
  setTimeout(() => playChime(370, 0.2, 0.15), 120);
}

// Button click - subtle tap
function playClickSound() {
  playChime(800, 0.05, 0.1);
}

// Navigation/transition whoosh
function playTransitionSound() {
  try {
    const ctx = getAudioContext();
    const bufferSize = ctx.sampleRate * 0.15;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufferSize, 3) * 0.1;
    }
    
    const source = ctx.createBufferSource();
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(2000, ctx.currentTime);
    filter.frequency.exponentialRampToValueAtTime(500, ctx.currentTime + 0.15);
    filter.Q.value = 2;
    
    source.buffer = buffer;
    source.connect(filter);
    filter.connect(ctx.destination);
    source.start();
  } catch (e) {
    // Silently fail
  }
}

// Completion fanfare - full celebration
function playCompletionSound() {
  // Grand arpeggio
  const notes = [523, 659, 784, 1047]; // C major chord ascending
  notes.forEach((freq, i) => {
    setTimeout(() => playChime(freq, 0.2, 0.3), i * 150);
  });
  // Final flourish
  setTimeout(() => {
    playChime(1568, 0.15, 0.2);
    setTimeout(() => playChime(2093, 0.4, 0.35), 100);
  }, 700);
}

export function useGameSounds() {
  const enabledRef = useRef(true);

  const setEnabled = useCallback((enabled) => {
    enabledRef.current = enabled;
  }, []);

  const play = useCallback((soundType) => {
    if (!enabledRef.current) return;

    switch (soundType) {
      case 'points':
        playPointsSound();
        break;
      case 'levelUp':
        playLevelUpSound();
        break;
      case 'achievement':
        playAchievementSound();
        break;
      case 'stepComplete':
        playStepCompleteSound();
        break;
      case 'celebration':
      case 'confetti':
      case 'confetti-burst':
      case 'confetti-sides':
      case 'confetti-rain':
        playCelebrationSound();
        break;
      case 'confetti-cannon':
      case 'completion':
        playCompletionSound();
        break;
      case 'error':
        playErrorSound();
        break;
      case 'click':
        playClickSound();
        break;
      case 'transition':
        playTransitionSound();
        break;
      default:
        playClickSound();
    }
  }, []);

  return { play, setEnabled };
}

export default useGameSounds;
