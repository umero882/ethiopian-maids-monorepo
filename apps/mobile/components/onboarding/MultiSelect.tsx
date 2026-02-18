/**
 * Multi Select Component
 *
 * Allows selection of multiple options from a list.
 */

import React from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface Option {
  value: string;
  label: string;
  icon?: keyof typeof Ionicons.glyphMap;
}

interface MultiSelectProps {
  label: string;
  options: Option[];
  selected: string[];
  onChange: (selected: string[]) => void;
  error?: string;
  required?: boolean;
  maxSelect?: number;
  columns?: number;
}

export default function MultiSelect({
  label,
  options,
  selected,
  onChange,
  error,
  required,
  maxSelect,
  columns = 2,
}: MultiSelectProps) {
  const handleToggle = (value: string) => {
    if (selected.includes(value)) {
      onChange(selected.filter((v) => v !== value));
    } else {
      if (maxSelect && selected.length >= maxSelect) {
        return; // Don't allow more selections
      }
      onChange([...selected, value]);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.labelRow}>
        <Text style={styles.label}>{label}</Text>
        {required && <Text style={styles.required}>*</Text>}
        {maxSelect && (
          <Text style={styles.hint}>
            {selected.length}/{maxSelect} selected
          </Text>
        )}
      </View>
      <View style={[styles.optionsContainer, { flexDirection: columns === 1 ? 'column' : 'row' }]}>
        {options.map((option) => {
          const isSelected = selected.includes(option.value);
          return (
            <Pressable
              key={option.value}
              style={({ pressed }) => [
                styles.option,
                columns === 2 && styles.optionHalf,
                isSelected && styles.optionSelected,
                pressed && styles.optionPressed,
              ]}
              onPress={() => handleToggle(option.value)}
            >
              {option.icon && (
                <View style={[styles.iconContainer, isSelected && styles.iconContainerSelected]}>
                  <Ionicons
                    name={option.icon}
                    size={20}
                    color={isSelected ? '#1E40AF' : '#6B7280'}
                  />
                </View>
              )}
              <Text
                style={[
                  styles.optionText,
                  isSelected && styles.optionTextSelected,
                ]}
                numberOfLines={2}
              >
                {option.label}
              </Text>
              {isSelected && (
                <Ionicons name="checkmark-circle" size={20} color="#1E40AF" />
              )}
            </Pressable>
          );
        })}
      </View>
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  required: {
    fontSize: 14,
    color: '#EF4444',
    marginLeft: 4,
  },
  hint: {
    marginLeft: 'auto',
    fontSize: 12,
    color: '#6B7280',
  },
  optionsContainer: {
    flexWrap: 'wrap',
    gap: 10,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 14,
    gap: 12,
  },
  optionHalf: {
    width: '48%',
  },
  optionSelected: {
    backgroundColor: '#EFF6FF',
    borderColor: '#1E40AF',
    borderWidth: 2,
  },
  optionPressed: {
    opacity: 0.7,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainerSelected: {
    backgroundColor: '#DBEAFE',
  },
  optionText: {
    flex: 1,
    fontSize: 15,
    color: '#374151',
    fontWeight: '500',
  },
  optionTextSelected: {
    color: '#1E40AF',
    fontWeight: '600',
  },
  errorText: {
    fontSize: 12,
    color: '#EF4444',
    marginTop: 4,
  },
});
