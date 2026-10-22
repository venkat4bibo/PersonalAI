// src/components/UI.tsx
import React from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ActivityIndicator,
  StyleSheet, ViewStyle, TextStyle,
} from 'react-native';
import { C, S } from '../utils/theme';

// ── Card ──────────────────────────────────────────────────────────────────────
export function Card({ children, style }: { children: React.ReactNode; style?: ViewStyle }) {
  return <View style={[S.card, style]}>{children}</View>;
}

// ── Label ─────────────────────────────────────────────────────────────────────
export function Label({ children, style }: { children: string; style?: TextStyle }) {
  return <Text style={[S.label, style]}>{children}</Text>;
}

// ── Section header ─────────────────────────────────────────────────────────────
export function SectionHeader({ title, sub }: { title: string; sub: string }) {
  return (
    <View style={{ marginBottom: 14 }}>
      <Text style={S.sectionTitle}>{title}</Text>
      <Text style={S.sectionSub}>{sub}</Text>
    </View>
  );
}

// ── Input ─────────────────────────────────────────────────────────────────────
interface InputProps {
  label?: string;
  value: string;
  onChangeText: (t: string) => void;
  placeholder?: string;
  multiline?: boolean;
  style?: ViewStyle;
}
export function Input({ label, value, onChangeText, placeholder, multiline, style }: InputProps) {
  return (
    <View style={[{ marginBottom: 10 }, style]}>
      {label && <Label>{label}</Label>}
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={C.muted}
        multiline={multiline}
        style={[S.input, multiline && { height: 80, textAlignVertical: 'top' }]}
      />
    </View>
  );
}

// ── Button ─────────────────────────────────────────────────────────────────────
interface BtnProps {
  label: string;
  onPress: () => void;
  color?: string;
  textColor?: string;
  loading?: boolean;
  style?: ViewStyle;
  disabled?: boolean;
}
export function Btn({ label, onPress, color = C.amber, textColor = '#000', loading, style, disabled }: BtnProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
      style={[{
        backgroundColor: color, borderRadius: 12,
        paddingVertical: 13, alignItems: 'center', justifyContent: 'center',
        opacity: (disabled || loading) ? 0.6 : 1,
      }, style]}
    >
      {loading
        ? <ActivityIndicator color={textColor} />
        : <Text style={{ color: textColor, fontWeight: '700', fontSize: 14 }}>{label}</Text>
      }
    </TouchableOpacity>
  );
}

// ── Pill button ───────────────────────────────────────────────────────────────
export function Pill({
  label, active, onPress, color,
}: { label: string; active: boolean; onPress: () => void; color?: string }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={{
        paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20,
        backgroundColor: active ? (color || C.amber) : C.border,
        marginRight: 6,
      }}
    >
      <Text style={{ color: active ? (color === C.teal ? '#fff' : '#000') : C.muted, fontWeight: '600', fontSize: 12 }}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

// ── Empty state ───────────────────────────────────────────────────────────────
export function EmptyState({ emoji, message }: { emoji: string; message: string }) {
  return (
    <View style={{ alignItems: 'center', paddingVertical: 40 }}>
      <Text style={{ fontSize: 40, marginBottom: 10 }}>{emoji}</Text>
      <Text style={{ color: C.muted, fontSize: 14, textAlign: 'center' }}>{message}</Text>
    </View>
  );
}

// ── Toast (managed externally via state) ─────────────────────────────────────
export function Toast({ message, type }: { message: string; type: 'success' | 'error' }) {
  return (
    <View style={{
      position: 'absolute', bottom: 30, left: 20, right: 20,
      backgroundColor: type === 'success' ? C.green : C.red,
      borderRadius: 20, paddingVertical: 10, paddingHorizontal: 20,
      alignItems: 'center', zIndex: 999,
      shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 10,
    }}>
      <Text style={{ color: '#fff', fontWeight: '700', fontSize: 13 }}>{message}</Text>
    </View>
  );
}
