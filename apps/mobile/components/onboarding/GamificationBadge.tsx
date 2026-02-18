/**
 * Gamification Badge Component
 *
 * Displays user's points and level during onboarding.
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface GamificationBadgeProps {
  points: number;
  level: number;
  compact?: boolean;
}

export default function GamificationBadge({
  points,
  level,
  compact = false,
}: GamificationBadgeProps) {
  const getLevelTitle = (lvl: number): string => {
    const titles = ['Beginner', 'Explorer', 'Achiever', 'Champion', 'Master'];
    return titles[Math.min(lvl - 1, titles.length - 1)] || 'Beginner';
  };

  if (compact) {
    return (
      <View style={styles.compactContainer}>
        <Ionicons name="star" size={14} color="#F59E0B" />
        <Text style={styles.compactPoints}>{points}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.levelBadge}>
        <Ionicons name="trophy" size={16} color="#F59E0B" />
        <Text style={styles.levelText}>Lv.{level}</Text>
      </View>
      <View style={styles.pointsContainer}>
        <Ionicons name="star" size={14} color="#F59E0B" />
        <Text style={styles.pointsText}>{points} pts</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'flex-end',
  },
  levelBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 4,
  },
  levelText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#D97706',
    marginLeft: 4,
  },
  pointsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pointsText: {
    fontSize: 11,
    color: '#6B7280',
    marginLeft: 2,
  },
  compactContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
  },
  compactPoints: {
    fontSize: 12,
    fontWeight: '600',
    color: '#D97706',
    marginLeft: 2,
  },
});
