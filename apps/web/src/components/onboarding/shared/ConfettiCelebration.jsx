import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import confetti from 'canvas-confetti';

const ConfettiCelebration = ({ type = 'confetti-burst' }) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    // Fire confetti based on type
    switch (type) {
      case 'confetti-burst':
        fireBurst();
        break;
      case 'confetti-sides':
        fireSides();
        break;
      case 'confetti-rain':
        fireRain();
        break;
      case 'confetti-cannon':
        fireCannon();
        break;
      case 'achievement':
        fireAchievement();
        break;
      default:
        fireBurst();
    }

    // Hide overlay after animation
    const timer = setTimeout(() => {
      setIsVisible(false);
    }, getDuration(type));

    return () => clearTimeout(timer);
  }, [type]);

  const getDuration = (celebrationType) => {
    switch (celebrationType) {
      case 'confetti-cannon':
        return 5000;
      case 'confetti-rain':
        return 3000;
      default:
        return 2500;
    }
  };

  // Burst from center
  const fireBurst = () => {
    const count = 200;
    const defaults = {
      origin: { y: 0.7 },
      zIndex: 9999,
    };

    function fire(particleRatio, opts) {
      confetti({
        ...defaults,
        ...opts,
        particleCount: Math.floor(count * particleRatio),
      });
    }

    fire(0.25, {
      spread: 26,
      startVelocity: 55,
    });
    fire(0.2, {
      spread: 60,
    });
    fire(0.35, {
      spread: 100,
      decay: 0.91,
      scalar: 0.8,
    });
    fire(0.1, {
      spread: 120,
      startVelocity: 25,
      decay: 0.92,
      scalar: 1.2,
    });
    fire(0.1, {
      spread: 120,
      startVelocity: 45,
    });
  };

  // Sides celebration
  const fireSides = () => {
    const duration = 2000;
    const end = Date.now() + duration;

    const colors = ['#a855f7', '#ec4899', '#6366f1', '#22c55e', '#eab308'];

    (function frame() {
      confetti({
        particleCount: 2,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: colors,
        zIndex: 9999,
      });
      confetti({
        particleCount: 2,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: colors,
        zIndex: 9999,
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    })();
  };

  // Rain from top
  const fireRain = () => {
    const duration = 2500;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 9999 };

    function randomInRange(min, max) {
      return Math.random() * (max - min) + min;
    }

    const interval = setInterval(function () {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        return clearInterval(interval);
      }

      const particleCount = 50 * (timeLeft / duration);

      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
      });
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
      });
    }, 250);
  };

  // Full cannon celebration
  const fireCannon = () => {
    const duration = 4000;
    const end = Date.now() + duration;

    const colors = ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff'];

    // Initial burst
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors: colors,
      zIndex: 9999,
    });

    // Continuous celebration
    (function frame() {
      confetti({
        particleCount: 5,
        angle: 60,
        spread: 55,
        origin: { x: 0, y: 0.6 },
        colors: colors,
        zIndex: 9999,
      });
      confetti({
        particleCount: 5,
        angle: 120,
        spread: 55,
        origin: { x: 1, y: 0.6 },
        colors: colors,
        zIndex: 9999,
      });
      confetti({
        particleCount: 3,
        angle: 90,
        spread: 45,
        origin: { x: 0.5, y: 0.3 },
        colors: colors,
        zIndex: 9999,
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    })();

    // Final burst
    setTimeout(() => {
      confetti({
        particleCount: 200,
        spread: 100,
        origin: { y: 0.5 },
        colors: colors,
        zIndex: 9999,
      });
    }, 3500);
  };

  // Achievement unlock celebration
  const fireAchievement = () => {
    const colors = ['#fbbf24', '#f59e0b', '#d97706', '#ffffff'];

    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.8 },
      colors: colors,
      zIndex: 9999,
      scalar: 1.2,
    });

    setTimeout(() => {
      confetti({
        particleCount: 30,
        spread: 40,
        origin: { y: 0.7 },
        colors: colors,
        zIndex: 9999,
      });
    }, 150);
  };

  if (!isVisible) return null;

  return (
    <motion.div
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 pointer-events-none z-50"
      aria-hidden="true"
    />
  );
};

export default ConfettiCelebration;
