// =============================================================================
// ProfileScreen.js
// User Profile + Settings — Bijli-Dost
// =============================================================================

import React, { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  ScrollView, TextInput, Image, KeyboardAvoidingView, Platform
} from 'react-native';
import * as SecureStore from 'expo-secure-store';
import * as ImagePicker from 'expo-image-picker';
import { useLanguage } from '../LanguageContext';
import CustomAlert from '../components/CustomAlert';

export default function ProfileScreen({ navigation }) {
  const { language, setLanguage } = useLanguage();

  const [userName,      setUserName]      = useState('');
  const [discoCompany,  setDiscoCompany]  = useState(null);
  const [memberSince,   setMemberSince]   = useState('');
  const [schedulesRun,  setSchedulesRun]  = useState(0);
  const [profilePhoto,  setProfilePhoto]  = useState(null);
  const [editingName,   setEditingName]   = useState(false);
  const [newName,       setNewName]       = useState('');
  const [alertConfig,   setAlertConfig]   = useState({
    visible: false, type: 'info', title: '', message: '', buttons: [{ text: 'OK' }],
  });

  const showAlert = (type, title, message, buttons = [{ text: 'OK' }]) => {
    setAlertConfig({ visible: true, type, title, message, buttons });
  };
  const hideAlert = () => setAlertConfig(prev => ({ ...prev, visible: false }));

  // ── Load all saved data ─────────────────────────────────────────────
  useEffect(() => {
    const loadData = async () => {
      try {
        const name   = await SecureStore.getItemAsync('bd_username');
        const disco  = await SecureStore.getItemAsync('bd_selected_disco');
        const since  = await SecureStore.getItemAsync('bd_member_since');
        const runs   = await SecureStore.getItemAsync('bd_schedules_run');
        const photo  = await SecureStore.getItemAsync('bd_profile_photo');

        if (name)  { setUserName(name); setNewName(name); }
        if (disco) setDiscoCompany(JSON.parse(disco));
        if (runs)  setSchedulesRun(parseInt(runs) || 0);
        if (photo) setProfilePhoto(photo);

        if (!since) {
          const today = new Date().toLocaleDateString('en-GB', {
            day: '2-digit', month: 'short', year: 'numeric'
          });
          await SecureStore.setItemAsync('bd_member_since', today);
          setMemberSince(today);
        } else {
          setMemberSince(since);
        }
      } catch (_) {}
    };
    loadData();
  }, []);

  // ── Pick profile photo ──────────────────────────────────────────────
  const handlePickPhoto = async () => {
    try {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) {
        const camPerm = await ImagePicker.requestCameraPermissionsAsync();
        if (!camPerm.granted) {
          showAlert('warning', 'Permission Needed', 'Camera or gallery permission is required.');
          return;
        }
      }

      showAlert(
        'info',
        'Add Profile Photo',
        'Choose how to add your photo:',
        [
          {
            text: '📷 Camera',
            style: 'primary',
            onPress: async () => {
              const result = await ImagePicker.launchCameraAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [1, 1],
                quality: 0.7,
              });
              if (!result.canceled && result.assets[0]) {
                const uri = result.assets[0].uri;
                setProfilePhoto(uri);
                await SecureStore.setItemAsync('bd_profile_photo', uri);
              }
            }
          },
          {
            text: '🖼️ Gallery',
            style: 'secondary',
            onPress: async () => {
              const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [1, 1],
                quality: 0.7,
              });
              if (!result.canceled && result.assets[0]) {
                const uri = result.assets[0].uri;
                setProfilePhoto(uri);
                await SecureStore.setItemAsync('bd_profile_photo', uri);
              }
            }
          },
          { text: 'Cancel', style: 'cancel' },
        ]
      );
    } catch (_) {
      showAlert('error', 'Error', 'Could not open image picker.');
    }
  };

  // ── Save new name ───────────────────────────────────────────────────
  const handleSaveName = async () => {
    if (!newName.trim()) {
      showAlert('warning', 'Empty Name', 'Please enter your name.');
      return;
    }
    try {
      await SecureStore.setItemAsync('bd_username', newName.trim());
      setUserName(newName.trim());
      setEditingName(false);
      showAlert('success', 'Name Updated!', `Your name has been changed to ${newName.trim()}.`);
    } catch (_) {
      showAlert('error', 'Error', 'Could not save name. Please try again.');
    }
  };

  // ── Clear all data ──────────────────────────────────────────────────
  const handleClearData = () => {
    showAlert(
      'warning',
      'Clear All Data',
      'This will delete your name, company, photo and all saved settings. Are you sure?',
      [
        {
          text: 'Yes, Clear',
          style: 'primary',
          onPress: async () => {
            try {
              const keys = [
                'bd_username', 'bd_selected_disco', 'bd_lang_selected',
                'bd_member_since', 'bd_schedules_run', 'bd_total_saved',
                'bd_profile_photo',
              ];
              for (const key of keys) {
                await SecureStore.deleteItemAsync(key);
              }
              navigation.reset({
                index: 0,
                routes: [{ name: 'Auth' }],
              });
            } catch (_) {
              showAlert('error', 'Error', 'Could not clear data. Please try again.');
            }
          }
        },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  // ── Avatar initials ─────────────────────────────────────────────────
  const getInitials = (name) => {
    if (!name) return '?';
    const parts = name.trim().split(' ');
    if (parts.length === 1) return parts[0][0].toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>

        {/* ── PROFILE HERO ── */}
        <View style={styles.profileHero}>

          {/* Avatar — tappable for photo */}
          <TouchableOpacity style={styles.avatarWrap} onPress={handlePickPhoto}>
            {profilePhoto ? (
              <Image source={{ uri: profilePhoto }} style={styles.avatarImage} />
            ) : (
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{getInitials(userName)}</Text>
              </View>
            )}
            {/* Camera icon overlay */}
            <View style={styles.avatarCameraBtn}>
              <Text style={styles.avatarCameraIcon}>📷</Text>
            </View>
          </TouchableOpacity>

          {/* Name — editable */}
          {editingName ? (
            <View style={styles.nameEditWrap}>
              <TextInput
                style={styles.nameInput}
                value={newName}
                onChangeText={setNewName}
                placeholder="Enter your name"
                placeholderTextColor="#4b5563"
                autoFocus
                returnKeyType="done"
                onSubmitEditing={handleSaveName}
              />
              <View style={styles.nameEditBtns}>
                <TouchableOpacity style={styles.nameSaveBtn} onPress={handleSaveName}>
                  <Text style={styles.nameSaveBtnText}>Save</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.nameCancelBtn}
                  onPress={() => { setEditingName(false); setNewName(userName); }}>
                  <Text style={styles.nameCancelBtnText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.nameRow}
              onPress={() => setEditingName(true)}>
              <Text style={styles.profileName}>{userName || 'Tap to add name'}</Text>
              <Text style={styles.nameEditIcon}>✏️</Text>
            </TouchableOpacity>
          )}

          <Text style={styles.profileSub}>Bijli-Dost Member</Text>

          <View style={styles.memberBadge}>
            <Text style={styles.memberBadgeText}>🇵🇰 Pakistan · Since {memberSince}</Text>
          </View>
        </View>

        {/* ── STATS GRID ── */}
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statIcon}>🤖</Text>
            <Text style={styles.statVal}>{schedulesRun}</Text>
            <Text style={styles.statLabel}>Schedules{'\n'}Run</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statIcon}>🛡️</Text>
            <Text style={styles.statVal}>199</Text>
            <Text style={styles.statLabel}>Unit Slab{'\n'}Protected</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statIcon}>🇵🇰</Text>
            <Text style={styles.statVal}>All</Text>
            <Text style={styles.statLabel}>DISCO{'\n'}Supported</Text>
          </View>
        </View>

        {/* ── DISCO INFO ── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>⚡ Electricity Company</Text>
          {discoCompany ? (
            <View style={styles.discoCard}>
              <View style={styles.discoBadge}>
                <Text style={styles.discoBadgeText}>{discoCompany.id}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.discoName}>{discoCompany.name}</Text>
                <Text style={styles.discoRegion}>
                  {discoCompany.city} · {discoCompany.region}
                </Text>
              </View>
              <Text style={styles.discoTick}>✓</Text>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.discoCard}
              onPress={() => navigation.navigate('Home')}>
              <Text style={styles.discoEmpty}>
                No company selected — tap to go to Home and select
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* ── LANGUAGE SETTINGS ── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🌐 Language</Text>
          <View style={styles.settingsCard}>
            {[
              { lang: 'en', flag: '🇬🇧', label: 'English' },
              { lang: 'ur', flag: '🇵🇰', label: 'اُردُو' },
              { lang: 'ps', flag: '🏔️',  label: 'پښتو' },
            ].map((item, i) => (
              <View key={item.lang}>
                <TouchableOpacity
                  style={[styles.langRow, language === item.lang && styles.langRowActive]}
                  onPress={() => setLanguage(item.lang)}
                >
                  <Text style={styles.langFlag}>{item.flag}</Text>
                  <Text style={[styles.langLabel,
                    language === item.lang && styles.langLabelActive]}>
                    {item.label}
                  </Text>
                  {language === item.lang && (
                    <Text style={styles.langCheck}>✓</Text>
                  )}
                </TouchableOpacity>
                {i < 2 && <View style={styles.divider} />}
              </View>
            ))}
          </View>
        </View>

        {/* ── APP INFO ── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>ℹ️ App Info</Text>
          <View style={styles.settingsCard}>
            {[
              ['📱', 'App Version',  'v1.0.0'],
              ['🤖', 'AI Engine',    'CSP + SA + Beam Search'],
              ['🏢', 'Developer',    'NITROSOFT'],
              ['🎓', 'Institution',  'FAST-NUCES · BS AI'],
              ['📧', 'Contact',      'usmanghani5129@gmail.com'],
            ].map(([icon, label, value], i) => (
              <View key={i}>
                <View style={styles.infoRow}>
                  <Text style={styles.infoIcon}>{icon}</Text>
                  <Text style={styles.infoLabel}>{label}</Text>
                  <Text style={styles.infoValue}>{value}</Text>
                </View>
                {i < 4 && <View style={styles.divider} />}
              </View>
            ))}
          </View>
        </View>

        {/* ── ACCOUNT ACTIONS ── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>⚙️ Account</Text>
          <View style={styles.settingsCard}>

            <TouchableOpacity
              style={styles.actionRow}
              onPress={() => setEditingName(true)}>
              <Text style={styles.actionIcon}>✏️</Text>
              <Text style={styles.actionLabel}>Change Name</Text>
              <Text style={styles.actionArrow}>›</Text>
            </TouchableOpacity>

            <View style={styles.divider} />

            <TouchableOpacity
              style={styles.actionRow}
              onPress={handlePickPhoto}>
              <Text style={styles.actionIcon}>📷</Text>
              <Text style={styles.actionLabel}>Change Profile Photo</Text>
              <Text style={styles.actionArrow}>›</Text>
            </TouchableOpacity>

            <View style={styles.divider} />

            <TouchableOpacity
              style={styles.actionRow}
              onPress={() => navigation.navigate('Home')}>
              <Text style={styles.actionIcon}>🏠</Text>
              <Text style={styles.actionLabel}>Go to Home</Text>
              <Text style={styles.actionArrow}>›</Text>
            </TouchableOpacity>

            <View style={styles.divider} />

            <TouchableOpacity
              style={[styles.actionRow]}
              onPress={handleClearData}>
              <Text style={styles.actionIcon}>🗑️</Text>
              <Text style={styles.dangerLabel}>Clear All Data</Text>
              <Text style={styles.actionArrow}>›</Text>
            </TouchableOpacity>

          </View>
        </View>

        <Text style={styles.copyright}>© 2026 Bijli-Dost · v1.0.0 · Pakistan</Text>
        <Text style={styles.copyright}>by NITROSOFT</Text>

        <CustomAlert
          visible={alertConfig.visible}
          type={alertConfig.type}
          title={alertConfig.title}
          message={alertConfig.message}
          buttons={alertConfig.buttons}
          onClose={hideAlert}
        />

      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container:        { flex: 1, backgroundColor: '#060810' },
  content:          { padding: 20, paddingBottom: 40 },

  profileHero:      { backgroundColor: '#0d1b2a', borderRadius: 24,
                      borderWidth: 1, borderColor: '#00d4ff22',
                      padding: 28, alignItems: 'center', marginBottom: 20 },

  avatarWrap:       { position: 'relative', marginBottom: 16 },
  avatar:           { width: 90, height: 90, borderRadius: 45,
                      backgroundColor: '#00d4ff22', borderWidth: 2,
                      borderColor: '#00d4ff', alignItems: 'center',
                      justifyContent: 'center' },
  avatarImage:      { width: 90, height: 90, borderRadius: 45,
                      borderWidth: 2, borderColor: '#00d4ff' },
  avatarText:       { fontSize: 32, fontWeight: '800', color: '#00d4ff' },
  avatarCameraBtn:  { position: 'absolute', bottom: 0, right: -4,
                      width: 30, height: 30, borderRadius: 15,
                      backgroundColor: '#0d1b2a', borderWidth: 2,
                      borderColor: '#00d4ff33', alignItems: 'center',
                      justifyContent: 'center' },
  avatarCameraIcon: { fontSize: 14 },

  nameRow:          { flexDirection: 'row', alignItems: 'center',
                      gap: 8, marginBottom: 4 },
  profileName:      { fontSize: 24, fontWeight: '800', color: '#ffffff' },
  nameEditIcon:     { fontSize: 16 },

  nameEditWrap:     { width: '100%', alignItems: 'center', marginBottom: 4 },
  nameInput:        { width: '100%', backgroundColor: '#161f2e',
                      borderWidth: 1, borderColor: '#00d4ff33',
                      borderRadius: 12, color: '#ffffff', fontSize: 18,
                      fontWeight: '700', padding: 12, textAlign: 'center',
                      marginBottom: 10 },
  nameEditBtns:     { flexDirection: 'row', gap: 10 },
  nameSaveBtn:      { backgroundColor: '#00d4ff', borderRadius: 10,
                      paddingHorizontal: 24, paddingVertical: 10 },
  nameSaveBtnText:  { color: '#000', fontWeight: '800', fontSize: 14 },
  nameCancelBtn:    { backgroundColor: '#1f2937', borderRadius: 10,
                      paddingHorizontal: 24, paddingVertical: 10 },
  nameCancelBtnText:{ color: '#6b7280', fontWeight: '700', fontSize: 14 },

  profileSub:       { fontSize: 13, color: '#6b7280', marginBottom: 12 },
  memberBadge:      { backgroundColor: '#00d4ff12', borderWidth: 1,
                      borderColor: '#00d4ff33', borderRadius: 20,
                      paddingHorizontal: 14, paddingVertical: 6 },
  memberBadgeText:  { color: '#00d4ff', fontSize: 12, fontWeight: '600' },

  statsGrid:        { flexDirection: 'row', gap: 10, marginBottom: 20 },
  statCard:         { flex: 1, backgroundColor: '#0f1724', borderRadius: 16,
                      borderWidth: 1, borderColor: '#1a2332',
                      padding: 16, alignItems: 'center' },
  statIcon:         { fontSize: 24, marginBottom: 8 },
  statVal:          { fontSize: 16, fontWeight: '800', color: '#00d4ff',
                      marginBottom: 4, textAlign: 'center' },
  statLabel:        { fontSize: 10, color: '#6b7280', textAlign: 'center',
                      lineHeight: 14, fontWeight: '600' },

  section:          { marginBottom: 20 },
  sectionTitle:     { fontSize: 13, fontWeight: '700', color: '#6b7280',
                      textTransform: 'uppercase', letterSpacing: 0.5,
                      marginBottom: 10 },

  discoCard:        { backgroundColor: '#0f1724', borderRadius: 16,
                      borderWidth: 1, borderColor: '#1a2332',
                      padding: 16, flexDirection: 'row',
                      alignItems: 'center', gap: 12 },
  discoBadge:       { backgroundColor: '#00d4ff15', borderWidth: 1,
                      borderColor: '#00d4ff33', borderRadius: 8,
                      paddingHorizontal: 10, paddingVertical: 6 },
  discoBadgeText:   { color: '#00d4ff', fontWeight: '800', fontSize: 13 },
  discoName:        { color: '#ffffff', fontWeight: '700', fontSize: 15 },
  discoRegion:      { color: '#6b7280', fontSize: 12, marginTop: 2 },
  discoTick:        { color: '#4ade80', fontSize: 18, fontWeight: '800' },
  discoEmpty:       { color: '#4b5563', fontSize: 13, flex: 1 },

  settingsCard:     { backgroundColor: '#0f1724', borderRadius: 16,
                      borderWidth: 1, borderColor: '#1a2332',
                      overflow: 'hidden' },

  langRow:          { flexDirection: 'row', alignItems: 'center',
                      padding: 16, gap: 12 },
  langRowActive:    { backgroundColor: '#00d4ff08' },
  langFlag:         { fontSize: 22 },
  langLabel:        { flex: 1, fontSize: 15, color: '#9ca3af', fontWeight: '600' },
  langLabelActive:  { color: '#00d4ff', fontWeight: '700' },
  langCheck:        { color: '#00d4ff', fontSize: 18, fontWeight: '800' },

  infoRow:          { flexDirection: 'row', alignItems: 'center',
                      padding: 14, gap: 12 },
  infoIcon:         { fontSize: 18, width: 28 },
  infoLabel:        { flex: 1, fontSize: 13, color: '#6b7280', fontWeight: '600' },
  infoValue:        { fontSize: 12, color: '#9ca3af', fontWeight: '600',
                      maxWidth: 160, textAlign: 'right' },

  actionRow:        { flexDirection: 'row', alignItems: 'center',
                      padding: 16, gap: 12 },
  actionIcon:       { fontSize: 20 },
  actionLabel:      { flex: 1, fontSize: 15, color: '#ffffff', fontWeight: '600' },
  actionArrow:      { color: '#4b5563', fontSize: 20, fontWeight: '800' },
  dangerLabel:      { flex: 1, fontSize: 15, color: '#f87171', fontWeight: '600' },
  divider:          { height: 1, backgroundColor: '#1a2332' },

  copyright:        { textAlign: 'center', color: '#1f2937',
                      fontSize: 11, marginBottom: 4 },
});