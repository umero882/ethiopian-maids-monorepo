/**
 * Step Card Component
 *
 * Card wrapper for onboarding step content with title and description.
 */

import React, { ReactNode } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { IconName } from '../../data/onboardingConfig';

interface StepCardProps {
  title: string;
  subtitle?: string;
  description?: string;
  icon?: IconName;
  iconColor?: string;
  children: ReactNode;
  centerContent?: boolean;
}

export default function StepCard({
  title,
  subtitle,
  description,
  icon,
  iconColor = '#1E40AF',
  children,
  centerContent = false,
}: StepCardProps) {
  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, centerContent && styles.headerCentered]}>
        {icon && (
          <View style={[styles.iconContainer, { backgroundColor: iconColor + '20' }]}>
            <Ionicons name={icon as any} size={32} color={iconColor} />
          </View>
        )}
        <View style={[styles.titleContainer, centerContent && styles.titleCentered]}>
          {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
          <Text style={[styles.title, centerContent && styles.titleCentered]}>{title}</Text>
          {description && (
            <Text style={[styles.description, centerContent && styles.descriptionCentered]}>
              {description}
            </Text>
          )}
        </View>
      </View>

      {/* Content */}
      <View style={styles.content}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    marginBottom: 24,
  },
  headerCentered: {
    alignItems: 'center',
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  titleContainer: {
    marginTop: 8,
  },
  titleCentered: {
    alignItems: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#1E40AF',
    fontWeight: '600',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 8,
  },
  description: {
    fontSize: 16,
    color: '#6B7280',
    lineHeight: 24,
  },
  descriptionCentered: {
    textAlign: 'center',
  },
  content: {
    flex: 1,
  },
});
