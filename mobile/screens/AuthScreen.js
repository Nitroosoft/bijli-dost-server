// =============================================================================
// AuthScreen.js
// Name Entry + Language Selection — Bijli-Dost
// =============================================================================

import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, Alert, Modal,
} from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { useLanguage } from '../LanguageContext';

export default function AuthScreen({ navigation }) {
  const { language, setLanguage, t } = useLanguage();
  const [name,      setName]      = useState('');
  const [langModal, setLangModal] = useState(false);

  const handleContinue = async () => {
    if (!name.trim()) {
      Alert.alert('', 'Please enter your name to continue.');
      return;
    }
    try {
      await SecureStore.setItemAsync('bd_username', name.trim());
      navigation.replace('Home', { userName: name.trim() });
    } catch (e) {
      Alert.alert('Error', 'Could not save name.');
    }
  };

  const selectLanguage = (lang) => {
    setLanguage(lang);
    setLangModal(false);
  };

  return (
    <View style={styles.container}>

      {/* ── LANGUAGE SELECTION MODAL ── */}
      <Modal visible={langModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.langModal}>
            <Text style={styles.langModalIcon}>🌐</Text>
            <Text style={styles.langModalTitle}>{t.authSelectLang}</Text>
            <Text style={styles.langModalHint}>{t.authLangHint}</Text>

            {/* English */}
            <TouchableOpacity
              style={[styles.langBtn, language === 'en' && styles.langBtnActive]}
              onPress={() => selectLanguage('en')}>
              <Text style={styles.langBtnFlag}>🇬🇧</Text>
              <Text style={[styles.langBtnText, language === 'en' && styles.langBtnTextActive]}>
                English
              </Text>
              {language === 'en' && <Text style={styles.langCheck}>✓</Text>}
            </TouchableOpacity>

            {/* Urdu */}
            <TouchableOpacity
              style={[styles.langBtn, language === 'ur' && styles.langBtnActive]}
              onPress={() => selectLanguage('ur')}>
              <Text style={styles.langBtnFlag}>🇵🇰</Text>
              <Text style={[styles.langBtnText, language === 'ur' && styles.langBtnTextActive]}>
                اُردُو
              </Text>
              {language === 'ur' && <Text style={styles.langCheck}>✓</Text>}
            </TouchableOpacity>

            {/* Pashto */}
            <TouchableOpacity
              style={[styles.langBtn, language === 'ps' && styles.langBtnActive]}
              onPress={() => selectLanguage('ps')}>
              <Text style={styles.langBtnFlag}>🏔️</Text>
              <Text style={[styles.langBtnText, language === 'ps' && styles.langBtnTextActive]}>
                پښتو
              </Text>
              {language === 'ps' && <Text style={styles.langCheck}>✓</Text>}
            </TouchableOpacity>

          </View>
        </View>
      </Modal>

      {/* ── MAIN CONTENT ── */}
      <Text style={styles.logo}>⚡</Text>
      <Text style={styles.appName}>Bijli-Dost</Text>
      <Text style={styles.tagline}>AI ELECTRICITY SLAB SCHEDULER</Text>
      <Text style={styles.sub}>Pakistan's smartest electricity guardian</Text>

      <View style={styles.card}>
        <Text style={styles.welcomeText}>{t.authWhatName}</Text>
        <Text style={styles.hintText}>{t.authHint}</Text>

        <View style={styles.inputRow}>
          <Text style={styles.inputIcon}>👤</Text>
          <TextInput
            style={styles.input}
            placeholder={t.authPlaceholder}
            placeholderTextColor="#4b5563"
            value={name}
            onChangeText={setName}
            autoFocus={false}
            returnKeyType="done"
            onSubmitEditing={handleContinue}
          />
        </View>

        <TouchableOpacity style={styles.btn} onPress={handleContinue}>
          <Text style={styles.btnText}>{t.authBtn}</Text>
        </TouchableOpacity>

        {/* Change Language Button */}
        <TouchableOpacity
          style={styles.changeLangBtn}
          onPress={() => setLangModal(true)}>
          <Text style={styles.changeLangText}>🌐 ENG / اُردُو / پښتو</Text>
        </TouchableOpacity>

      </View>

      <Text style={styles.copyright}>© 2026 Bijli-Dost · v1.0.0 · Pakistan</Text>
      <Text style={styles.copyright}>by NITROSOFT</Text>

    </View>
  );
}

const styles = StyleSheet.create({
  container:        { flex: 1, backgroundColor: '#0a0a0f', alignItems: 'center',
                      justifyContent: 'center', padding: 24 },
  logo:             { fontSize: 60 },
  appName:          { fontSize: 32, fontWeight: '800', color: '#00d4ff', marginTop: 8 },
  tagline:          { fontSize: 11, fontWeight: '700', color: '#00d4ff',
                      letterSpacing: 2, marginTop: 4 },
  sub:              { fontSize: 13, color: '#6b7280', marginTop: 6, marginBottom: 32 },

  card:             { width: '100%', backgroundColor: '#111827', borderRadius: 20,
                      borderWidth: 1, borderColor: '#1f2937', padding: 24 },
  welcomeText:      { fontSize: 20, fontWeight: '800', color: '#ffffff', marginBottom: 8 },
  hintText:         { fontSize: 13, color: '#6b7280', marginBottom: 20 },

  inputRow:         { flexDirection: 'row', alignItems: 'center',
                      backgroundColor: '#1f2937', borderRadius: 12,
                      borderWidth: 1, borderColor: '#374151',
                      paddingHorizontal: 14, marginBottom: 16 },
  inputIcon:        { fontSize: 18, marginRight: 10 },
  input:            { flex: 1, color: '#ffffff', fontSize: 16, paddingVertical: 14 },

  btn:              { backgroundColor: '#00d4ff', borderRadius: 14,
                      paddingVertical: 16, alignItems: 'center', marginBottom: 12 },
  btnText:          { color: '#000000', fontWeight: '800', fontSize: 16 },

  changeLangBtn:    { alignItems: 'center', paddingVertical: 10 },
  changeLangText:   { color: '#4b5563', fontSize: 13, fontWeight: '600' },

  copyright:        { color: '#374151', marginTop: 24, fontSize: 11 },

  // Language Modal
  modalOverlay:     { flex: 1, backgroundColor: '#000000cc',
                      justifyContent: 'center', alignItems: 'center', padding: 24 },
  langModal:        { width: '100%', backgroundColor: '#111827', borderRadius: 24,
                      borderWidth: 1, borderColor: '#1f2937', padding: 28,
                      alignItems: 'center' },
  langModalIcon:    { fontSize: 40, marginBottom: 12 },
  langModalTitle:   { fontSize: 22, fontWeight: '800', color: '#ffffff', marginBottom: 8 },
  langModalHint:    { fontSize: 13, color: '#6b7280', marginBottom: 24,
                      textAlign: 'center' },

  langBtn:          { width: '100%', flexDirection: 'row', alignItems: 'center',
                      backgroundColor: '#1f2937', borderRadius: 14,
                      borderWidth: 1, borderColor: '#374151',
                      padding: 16, marginBottom: 12 },
  langBtnActive:    { borderColor: '#00d4ff', backgroundColor: '#00d4ff15' },
  langBtnFlag:      { fontSize: 24, marginRight: 14 },
  langBtnText:      { flex: 1, fontSize: 18, color: '#9ca3af', fontWeight: '700' },
  langBtnTextActive:{ color: '#00d4ff' },
  langCheck:        { color: '#00d4ff', fontWeight: '800', fontSize: 18 },
});