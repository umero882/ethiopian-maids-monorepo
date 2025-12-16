/**
 * Toast Notification Component
 *
 * A beautiful, animated toast notification system for the app.
 * Supports different types: success, error, warning, info, message
 */

import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
  Dimensions,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export type ToastType = 'success' | 'error' | 'warning' | 'info' | 'message';

export interface ToastData {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
  onPress?: () => void;
  avatar?: string;
  showAvatar?: boolean;
}

interface ToastProps {
  toast: ToastData;
  onHide: (id: string) => void;
}

const TOAST_CONFIG: Record<ToastType, {
  icon: keyof typeof Ionicons.glyphMap;
  backgroundColor: string;
  borderColor: string;
  iconColor: string;
  titleColor: string;
}> = {
  success: {
    icon: 'checkmark-circle',
    backgroundColor: '#ECFDF5',
    borderColor: '#10B981',
    iconColor: '#10B981',
    titleColor: '#065F46',
  },
  error: {
    icon: 'close-circle',
    backgroundColor: '#FEF2F2',
    borderColor: '#EF4444',
    iconColor: '#EF4444',
    titleColor: '#991B1B',
  },
  warning: {
    icon: 'warning',
    backgroundColor: '#FFFBEB',
    borderColor: '#F59E0B',
    iconColor: '#F59E0B',
    titleColor: '#92400E',
  },
  info: {
    icon: 'information-circle',
    backgroundColor: '#EFF6FF',
    borderColor: '#3B82F6',
    iconColor: '#3B82F6',
    titleColor: '#1E40AF',
  },
  message: {
    icon: 'chatbubble-ellipses',
    backgroundColor: '#F0F9FF',
    borderColor: '#0EA5E9',
    iconColor: '#0EA5E9',
    titleColor: '#0C4A6E',
  },
};

export function Toast({ toast, onHide }: ToastProps) {
  const insets = useSafeAreaInsets();
  const translateY = useRef(new Animated.Value(-100)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  const config = TOAST_CONFIG[toast.type];
  const duration = toast.duration || 4000;

  useEffect(() => {
    // Slide in
    Animated.parallel([
      Animated.spring(translateY, {
        toValue: 0,
        useNativeDriver: true,
        tension: 80,
        friction: 10,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();

    // Auto hide after duration
    const timer = setTimeout(() => {
      hideToast();
    }, duration);

    return () => clearTimeout(timer);
  }, []);

  const hideToast = () => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: -100,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onHide(toast.id);
    });
  };

  const handlePress = () => {
    if (toast.onPress) {
      toast.onPress();
    }
    hideToast();
  };

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [{ translateY }],
          opacity,
          top: insets.top + 10,
          backgroundColor: config.backgroundColor,
          borderLeftColor: config.borderColor,
        },
      ]}
    >
      <TouchableOpacity
        style={styles.content}
        onPress={handlePress}
        activeOpacity={0.9}
      >
        {toast.showAvatar && toast.avatar ? (
          <View style={[styles.avatarContainer, { backgroundColor: config.borderColor }]}>
            <Text style={styles.avatarText}>
              {toast.avatar.charAt(0).toUpperCase()}
            </Text>
          </View>
        ) : (
          <View style={[styles.iconContainer, { backgroundColor: `${config.borderColor}20` }]}>
            <Ionicons name={config.icon} size={24} color={config.iconColor} />
          </View>
        )}

        <View style={styles.textContainer}>
          <Text style={[styles.title, { color: config.titleColor }]} numberOfLines={1}>
            {toast.title}
          </Text>
          {toast.message && (
            <Text style={styles.message} numberOfLines={2}>
              {toast.message}
            </Text>
          )}
        </View>

        <TouchableOpacity onPress={hideToast} style={styles.closeButton}>
          <Ionicons name="close" size={20} color="#9CA3AF" />
        </TouchableOpacity>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 16,
    right: 16,
    maxWidth: SCREEN_WIDTH - 32,
    borderRadius: 12,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    zIndex: 9999,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  textContainer: {
    flex: 1,
    marginRight: 8,
  },
  title: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 2,
  },
  message: {
    fontSize: 13,
    color: '#6B7280',
    lineHeight: 18,
  },
  closeButton: {
    padding: 4,
  },
});

export default Toast;
