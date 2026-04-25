// =============================================================================
// CustomAlert.js
// Reusable Dark-Themed Alert Modal for Bijli-Dost
// =============================================================================

import React from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Modal
} from 'react-native';
import { BlurView } from 'expo-blur';

export default function CustomAlert({
  visible,
  type = 'info',      // 'success' | 'error' | 'warning' | 'info'
  title = '',
  message = '',
  buttons = [{ text: 'OK', onPress: () => {} }],
  onClose = () => {},
}) {

  // ── Theme Colors Based On Type ───────────────────────────────────────────
  const colors = {
    success: { icon: '✅', color: '#4ade80', border: '#16a34a', bg: '#05261688' },
    error  : { icon: '❌', color: '#f87171', border: '#dc2626', bg: '#1c020288' },
    warning: { icon: '⚠️', color: '#fbbf24', border: '#ca8a04', bg: '#1c150288' },
    info   : { icon: 'ℹ️',  color: '#00d4ff', border: '#00d4ff', bg: '#0a162888' },
  };
  const theme = colors[type] || colors.info;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <BlurView intensity={40} style={styles.overlay}>
        <View style={[styles.card, { borderColor: theme.border }]}>

          {/* ── Icon Circle ── */}
          <View style={[styles.iconCircle, {
            backgroundColor: theme.bg,
            borderColor: theme.border,
          }]}>
            <Text style={styles.iconText}>{theme.icon}</Text>
          </View>

          {/* ── Title ── */}
          <Text style={[styles.title, { color: theme.color }]}>{title}</Text>

          {/* ── Message ── */}
          <Text style={styles.message}>{message}</Text>

          {/* ── Buttons ── */}
          <View style={[
            styles.buttonRow,
            buttons.length === 1 && styles.buttonRowSingle,
            buttons.length >= 3 && styles.buttonRowStacked,
          ]}>
            {buttons.map((btn, i) => {
              const isPrimary   = btn.style !== 'cancel' && btn.style !== 'secondary';
              const isCancel    = btn.style === 'cancel';
              const isSecondary = btn.style === 'secondary';

              return (
                <TouchableOpacity
                  key={i}
                  style={[
                    styles.button,
                    isPrimary   && [styles.primaryBtn,   { backgroundColor: theme.color }],
                    isSecondary && styles.secondaryBtn,
                    isCancel    && styles.cancelBtn,
                    buttons.length >= 3 && styles.buttonFullWidth,
                  ]}
                  onPress={() => {
                    if (btn.onPress) btn.onPress();
                    onClose();
                  }}
                >
                  <Text style={[
                    styles.buttonText,
                    isPrimary   && styles.primaryBtnText,
                    isSecondary && styles.secondaryBtnText,
                    isCancel    && styles.cancelBtnText,
                  ]}>
                    {btn.text}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

        </View>
      </BlurView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay:          { flex: 1, backgroundColor: '#000000cc',
                      justifyContent: 'center', alignItems: 'center',
                      padding: 24 },
  card:             { width: '100%', maxWidth: 360,
                      backgroundColor: '#0f1724', borderRadius: 24,
                      borderWidth: 1, padding: 28, alignItems: 'center' },

  iconCircle:       { width: 64, height: 64, borderRadius: 32,
                      borderWidth: 1, alignItems: 'center',
                      justifyContent: 'center', marginBottom: 16 },
  iconText:         { fontSize: 32 },

  title:            { fontSize: 20, fontWeight: '800',
                      textAlign: 'center', marginBottom: 10 },
  message:          { fontSize: 14, color: '#9ca3af',
                      textAlign: 'center', lineHeight: 22,
                      marginBottom: 24 },

  buttonRow:        { flexDirection: 'row', gap: 10, width: '100%' },
  buttonRowSingle:  { justifyContent: 'center' },
  buttonRowStacked: { flexDirection: 'column' },

  button:           { flex: 1, borderRadius: 12,
                      paddingVertical: 14, paddingHorizontal: 16,
                      alignItems: 'center', justifyContent: 'center',
                      minHeight: 48 },
  buttonFullWidth:  { flex: 0, width: '100%' },

  primaryBtn:       { backgroundColor: '#00d4ff' },
  primaryBtnText:   { color: '#000000', fontWeight: '800', fontSize: 14 },

  secondaryBtn:     { backgroundColor: '#1f2937',
                      borderWidth: 1, borderColor: '#374151' },
  secondaryBtnText: { color: '#ffffff', fontWeight: '700', fontSize: 14 },

  cancelBtn:        { backgroundColor: 'transparent',
                      borderWidth: 1, borderColor: '#374151' },
  cancelBtnText:    { color: '#6b7280', fontWeight: '600', fontSize: 14 },

  buttonText:       { fontSize: 14, fontWeight: '700' },
});