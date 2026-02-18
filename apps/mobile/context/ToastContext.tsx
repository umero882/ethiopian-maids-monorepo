/**
 * Toast Context
 *
 * Provides a global toast notification system that can be accessed
 * from anywhere in the app using the useToast hook.
 */

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { View, StyleSheet } from 'react-native';
import Toast, { ToastData, ToastType } from '../components/Toast';

interface ToastOptions {
  title: string;
  message?: string;
  duration?: number;
  onPress?: () => void;
  avatar?: string;
  showAvatar?: boolean;
}

interface ToastContextType {
  showToast: (type: ToastType, options: ToastOptions) => void;
  showSuccess: (title: string, message?: string) => void;
  showError: (title: string, message?: string) => void;
  showWarning: (title: string, message?: string) => void;
  showInfo: (title: string, message?: string) => void;
  showMessage: (options: ToastOptions) => void;
  hideToast: (id: string) => void;
  hideAll: () => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

interface ToastProviderProps {
  children: ReactNode;
}

export function ToastProvider({ children }: ToastProviderProps) {
  const [toasts, setToasts] = useState<ToastData[]>([]);

  const generateId = () => `toast_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  const showToast = useCallback((type: ToastType, options: ToastOptions) => {
    const id = generateId();
    const toast: ToastData = {
      id,
      type,
      ...options,
    };

    setToasts(prev => {
      // Limit to max 3 toasts at a time
      const newToasts = [...prev, toast];
      if (newToasts.length > 3) {
        return newToasts.slice(-3);
      }
      return newToasts;
    });

    return id;
  }, []);

  const showSuccess = useCallback((title: string, message?: string) => {
    return showToast('success', { title, message });
  }, [showToast]);

  const showError = useCallback((title: string, message?: string) => {
    return showToast('error', { title, message, duration: 5000 });
  }, [showToast]);

  const showWarning = useCallback((title: string, message?: string) => {
    return showToast('warning', { title, message });
  }, [showToast]);

  const showInfo = useCallback((title: string, message?: string) => {
    return showToast('info', { title, message });
  }, [showToast]);

  const showMessage = useCallback((options: ToastOptions) => {
    return showToast('message', { ...options, showAvatar: true });
  }, [showToast]);

  const hideToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const hideAll = useCallback(() => {
    setToasts([]);
  }, []);

  const value: ToastContextType = {
    showToast,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    showMessage,
    hideToast,
    hideAll,
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
      {/* Only render overlay when toasts exist - prevents iOS touch blocking */}
      {toasts.length > 0 && (
        <View style={styles.toastContainer} pointerEvents="box-none">
          {toasts.map((toast, index) => (
            <View
              key={toast.id}
              style={[styles.toastWrapper, { top: index * 80 }]}
              pointerEvents="box-none"
            >
              <Toast toast={toast} onHide={hideToast} />
            </View>
          ))}
        </View>
      )}
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextType {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}

const styles = StyleSheet.create({
  toastContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    // Note: bottom: 0 removed to prevent fullscreen overlay blocking touches on iOS
    zIndex: 9999,
  },
  toastWrapper: {
    position: 'absolute',
    left: 0,
    right: 0,
  },
});

export default ToastProvider;
