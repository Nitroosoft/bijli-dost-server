import React, { useState } from 'react';
import { useLanguage } from '../LanguageContext';
import * as SecureStore from 'expo-secure-store';
import { BlurView } from 'expo-blur';

import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ScrollView, Alert, Modal
} from 'react-native';

const PROTECTED_SLAB = 199;

const DISCO_COMPANIES = [
  { id: 'LESCO',  name: 'LESCO',  city: 'Lahore',      region: 'Punjab' },
  { id: 'IESCO',  name: 'IESCO',  city: 'Islamabad',   region: 'Federal' },
  { id: 'PESCO',  name: 'PESCO',  city: 'Peshawar',    region: 'KPK' },
  { id: 'MEPCO',  name: 'MEPCO',  city: 'Multan',      region: 'Punjab' },
  { id: 'FESCO',  name: 'FESCO',  city: 'Faisalabad',  region: 'Punjab' },
  { id: 'GEPCO',  name: 'GEPCO',  city: 'Gujranwala',  region: 'Punjab' },
  { id: 'HESCO',  name: 'HESCO',  city: 'Hyderabad',   region: 'Sindh' },
  { id: 'SEPCO',  name: 'SEPCO',  city: 'Sukkur',      region: 'Sindh' },
  { id: 'QESCO',  name: 'QESCO',  city: 'Quetta',      region: 'Balochistan' },
  { id: 'TESCO',  name: 'TESCO',  city: 'Tribal Areas',region: 'KPK' },
  { id: 'KELECTRIC', name: 'K-Electric', city: 'Karachi', region: 'Sindh' },
];

export default function HomeScreen({ navigation, route }) {
  const { userName } = route.params || {};
  const { language, setLanguage, toggleLanguage, t } = useLanguage();
  
  React.useEffect(() => {
    navigation.setParams({
      onToggleLanguage: toggleLanguage,
      language: language,
    });
  }, [language]);
  const [unitsConsumed,  setUnitsConsumed]  = useState('');
  const [daysRemaining,  setDaysRemaining]  = useState('');
  const [selectedDISCO,  setSelectedDISCO]  = useState(null);
  const [discoModal,     setDiscoModal]     = useState(false);
  const [aboutVisible,   setAboutVisible]   = useState(false);
  const [helpVisible,    setHelpVisible]    = useState(false);
  const [contactVisible, setContactVisible] = useState(false);
  const [nepraVisible,   setNepraVisible]   = useState(false);
  const [langPopup, setLangPopup] = useState(false);

// Load saved company on first visit
  React.useEffect(() => {
    const loadSavedCompany = async () => {
      try {
        const saved = await SecureStore.getItemAsync('bd_selected_disco');
        if (saved) setSelectedDISCO(JSON.parse(saved));
      } catch (_) {}
    };
  loadSavedCompany();
}, []);
    
  React.useEffect(() => {
  if (route?.params?.scannedUnits !== undefined) {
    setUnitsConsumed(String(route.params.scannedUnits));
    if (route?.params?.scannedDays !== undefined) {
      setDaysRemaining(String(route.params.scannedDays));
      Alert.alert(
        '✅ Reading Applied!',
        `${route.params.scannedUnits} units and ${route.params.scannedDays} days remaining have been auto-filled automatically!`
      );
    } else {
      Alert.alert(
        '✅ Reading Applied!',
        `${route.params.scannedUnits} units have been auto-filled. Please enter the days remaining to continue.`
      );
    }
  }
}, [route?.params?.scannedUnits]);

React.useEffect(() => {
  const checkFirstVisit = async () => {
    try {
      const langSelected = await SecureStore.getItemAsync('bd_lang_selected');
      if (!langSelected) {
        await SecureStore.setItemAsync('bd_lang_selected', 'true');
        setLangPopup(true);
      }
    } catch (_) {}
  };
  checkFirstVisit();
}, []);

  const getWarningLevel = (units) => {
    if (units <= 194) return { level: 'SAFE',     color: '#4ade80', bg: '#052e16', border: '#16a34a' };
    if (units <= 196) return { level: 'WARNING',  color: '#fbbf24', bg: '#1c1502', border: '#ca8a04' };
    if (units <= 199) return { level: 'CRITICAL', color: '#fb923c', bg: '#1c0a02', border: '#ea580c' };
    return             { level: 'EXCEEDED',        color: '#f87171', bg: '#1c0202', border: '#dc2626' };
  };

  const handleContinue = () => {
    const units = parseFloat(unitsConsumed);
    const days  = parseInt(daysRemaining);
    if (!selectedDISCO) {
      Alert.alert('Select Company', 'Please select your electricity distribution company.');
      return;
    }
    if (isNaN(units) || units < 0 || units > 199) {
      Alert.alert('Invalid Input', 'Please enter units between 0 and 199.');
      return;
    }
    if (isNaN(days) || days < 1 || days > 30) {
      Alert.alert('Invalid Input', 'Please enter days between 1 and 30.');
      return;
    }
    navigation.navigate('Appliances', {
      unitsConsumed: units,
      daysRemaining: days,
      discoCompany : selectedDISCO,
    });
  };

  const units     = parseFloat(unitsConsumed) || 0;
  const warning   = getWarningLevel(units);
  const remaining = PROTECTED_SLAB - units;
  const pct       = Math.min((units / PROTECTED_SLAB) * 100, 100);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>

      {/* ── HERO ── */}
      <View style={styles.hero}>
        <Text style={styles.heroIcon}>⚡</Text>
        {userName ? (
          <Text style={styles.welcomeGreeting}>{t.welcome}, {userName}! 👋</Text>
        ) : null}
        <Text style={styles.heroTitle}>Bijli-Dost</Text>
        <Text style={styles.heroTagline}>AI Electricity Slab Scheduler</Text>
        <View style={styles.heroDivider} />
        <Text style={styles.heroDesc}>
          Protecting Pakistani households from accidentally crossing
          the NEPRA 199-unit protected slab limit
        </Text>
        <TouchableOpacity style={styles.nepraBtn} onPress={() => setNepraVisible(true)}>
          <Text style={styles.nepraBtnText}>{t.nepraBtn}</Text>
        </TouchableOpacity>

      </View>

      {/* ── DISCO SELECTOR ── */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardIcon}>🇵🇰</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.cardTitle}>{t.discoTitle}</Text>
            <Text style={styles.cardSub}>{t.discoSub}</Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.discoSelector}
          onPress={() => setDiscoModal(true)}
        >
          {selectedDISCO ? (
            <View style={styles.discoSelected}>
              <View style={styles.discoBadge}>
                <Text style={styles.discoBadgeText}>{selectedDISCO.id}</Text>
              </View>
              <View>
                <Text style={styles.discoName}>{selectedDISCO.name}</Text>
                <Text style={styles.discoRegion}>{selectedDISCO.city} · {selectedDISCO.region}</Text>
              </View>
            </View>
          ) : (
            <Text style={styles.discoPlaceholder}>{t.discoPlaceholder}</Text>
          )}
        </TouchableOpacity>

        <Text style={styles.discoNote}>{t.discoNote}</Text>
      </View>

      {/* ── BILLING CARD ── */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardIcon}>📋</Text>
          <View>
            <Text style={styles.cardTitle}>{t.billingTitle}</Text>
            <Text style={styles.cardSub}>{t.billingSub}</Text>
          </View>
        </View>

        <Text style={styles.label}>{t.unitsLabel}</Text>

{/* Scan Bill Button */}
<TouchableOpacity
  style={styles.scanBillBtn}
  onPress={() => {
  if (!selectedDISCO) {
    Alert.alert('Select Company First', 'Please select your electricity company before scanning a bill.');
    return;
  }
  navigation.navigate('BillScanner', { selectedDISCO });
}}
>
  <Text style={styles.scanBillIcon}>📸</Text>
  <View style={{ flex: 1 }}>
    <Text style={styles.scanBillTitle}>{t.scanTitle}</Text>
    <Text style={styles.scanBillSub}>{t.scanSub}</Text>
  </View>
  <Text style={styles.scanBillArrow}>→</Text>
</TouchableOpacity>

<View style={styles.inputWrap}>
  <Text style={styles.inputIcon}>🔢</Text>
  <TextInput
            style={styles.input}
            placeholder="e.g. 120"
            placeholderTextColor="#4b5563"
            keyboardType="numeric"
            value={unitsConsumed}
            onChangeText={setUnitsConsumed}
          />
          <Text style={styles.inputUnit}>kWh</Text>
        </View>

        <Text style={styles.label}>{t.daysLabel}</Text>
        <View style={styles.inputWrap}>
          <Text style={styles.inputIcon}>📅</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. 15"
            placeholderTextColor="#4b5563"
            keyboardType="numeric"
            value={daysRemaining}
            onChangeText={setDaysRemaining}
          />
          <Text style={styles.inputUnit}>days</Text>
        </View>
      </View>

      {/* ── STATUS ── */}
      {unitsConsumed !== '' && (
        <View style={[styles.statusCard, { backgroundColor: warning.bg, borderColor: warning.border }]}>
          <View style={styles.statusRow}>
            <Text style={[styles.statusLevel, { color: warning.color }]}>
              {warning.level === 'SAFE'     && '✅  SAFE'}
              {warning.level === 'WARNING'  && '⚠️  WARNING'}
              {warning.level === 'CRITICAL' && '🔴  CRITICAL'}
              {warning.level === 'EXCEEDED' && '❌  EXCEEDED'}
            </Text>
            <Text style={[styles.statusPct, { color: warning.color }]}>{pct.toFixed(1)}%</Text>
          </View>
          <View style={styles.progressWrap}>
            <View style={[styles.progressFill, { width: `${pct}%`, backgroundColor: warning.color }]} />
          </View>
          <View style={styles.statusStats}>
            <View style={styles.statItem}>
              <Text style={styles.statVal}>{units.toFixed(0)}</Text>
              <Text style={styles.statLabel}>Used</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statVal}>{remaining.toFixed(0)}</Text>
              <Text style={styles.statLabel}>Remaining</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statVal}>{PROTECTED_SLAB}</Text>
              <Text style={styles.statLabel}>NEPRA Limit</Text>
            </View>
          </View>
        </View>
      )}

      {/* ── MAIN BUTTON ── */}
      <TouchableOpacity style={styles.button} onPress={handleContinue}>
        <Text style={styles.buttonText}>{t.runAI}</Text>
      </TouchableOpacity>

      {/* ── HOW IT WORKS ── */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>{t.howTitle}</Text>
          <View style={styles.step}>
          <View style={styles.stepNum}><Text style={styles.stepNumText}>1</Text></View>
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>{t.step1Title}</Text>
            <Text style={styles.stepDesc}>{t.step1Desc}</Text>
          </View>
      </View>
        <View style={styles.step}>
        <View style={styles.stepNum}><Text style={styles.stepNumText}>2</Text></View>
        <View style={styles.stepContent}>
          <Text style={styles.stepTitle}>{t.step2Title}</Text>
          <Text style={styles.stepDesc}>{t.step2Desc}</Text>
      </View>
    </View>
      <View style={styles.step}>
        <View style={styles.stepNum}><Text style={styles.stepNumText}>3</Text></View>
        <View style={styles.stepContent}>
          <Text style={styles.stepTitle}>{t.step3Title}</Text>
          <Text style={styles.stepDesc}>{t.step3Desc}</Text>
        </View>
    </View>
      <View style={styles.step}>
      <View style={styles.stepNum}><Text style={styles.stepNumText}>4</Text></View>
      <View style={styles.stepContent}>
        <Text style={styles.stepTitle}>{t.step4Title}</Text>
        <Text style={styles.stepDesc}>{t.step4Desc}</Text>
      </View>
    </View>
  </View>

      {/* ── FOOTER MENU ── */}
      <View style={styles.footerMenu}>
        <TouchableOpacity style={styles.footerItem} onPress={() => setAboutVisible(true)}>
          <Text style={styles.footerIcon}>ℹ️</Text>
          <Text style={styles.footerLabel}>{t.about}</Text>
        </TouchableOpacity>
        <View style={styles.footerLine} />
        <TouchableOpacity style={styles.footerItem} onPress={() => setHelpVisible(true)}>
          <Text style={styles.footerIcon}>❓</Text>
          <Text style={styles.footerLabel}>{t.help}</Text>
        </TouchableOpacity>
        <View style={styles.footerLine} />
        <TouchableOpacity style={styles.footerItem} onPress={() => setContactVisible(true)}>
          <Text style={styles.footerIcon}>📞</Text>
          <Text style={styles.footerLabel}>{t.contact}</Text>
        </TouchableOpacity>
        <View style={styles.footerLine} />
        <TouchableOpacity style={styles.footerItem}>
          <Text style={styles.footerIcon}>⭐</Text>
          <Text style={styles.footerLabel}>{t.rate}</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.copyright}>© 2026 Bijli-Dost · v1.0.0 · Pakistan</Text>
      <Text style={styles.copyright}>by NITROSOFT</Text>

      {/* ── DISCO MODAL ── */}
      <Modal visible={discoModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>🇵🇰 Select Your DISCO Company</Text>
            <Text style={styles.modalSubtitle}>All companies follow NEPRA's 199-unit rule</Text>
            <ScrollView style={{ maxHeight: 400 }}>
              {DISCO_COMPANIES.map(company => (
                <TouchableOpacity
                  key={company.id}
                  style={[
                    styles.discoOption,
                    selectedDISCO?.id === company.id && styles.discoOptionSelected
                  ]}
                  onPress={async () => {
                    setSelectedDISCO(company);
                    setDiscoModal(false);
                    try {
                      await SecureStore.setItemAsync('bd_selected_disco', JSON.stringify(company));
                    } catch (_) {}
                  }}
                >
                  <View style={[
                    styles.discoBadge,
                    selectedDISCO?.id === company.id && { backgroundColor: '#00d4ff22' }
                  ]}>
                    <Text style={styles.discoBadgeText}>{company.id}</Text>
                  </View>
                  <View style={styles.discoInfo}>
                    <Text style={styles.discoOptionName}>{company.name}</Text>
                    <Text style={styles.discoOptionRegion}>{company.city} · {company.region}</Text>
                  </View>
                  {selectedDISCO?.id === company.id && (
                    <Text style={styles.discoCheck}>✓</Text>
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity style={styles.modalClose} onPress={() => setDiscoModal(false)}>
              <Text style={styles.modalCloseText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ── NEPRA MODAL ── */}
      <Modal visible={nepraVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>🏛️ NEPRA Guidelines</Text>
            <Text style={styles.modalText}>
              NEPRA (National Electric Power Regulatory Authority) is Pakistan's
              federal electricity regulator that sets tariff rules for all
              distribution companies.
            </Text>
            <View style={styles.nepraRule}>
              <Text style={styles.nepraRuleTitle}>⚡ The 199-Unit Protected Slab</Text>
              <Text style={styles.nepraRuleText}>
                Households consuming 199 units or less per month receive a
                heavily subsidized rate. Crossing even 1 unit above this limit
                removes the protected status and can double or triple your bill.
              </Text>
            </View>
            <View style={styles.nepraRule}>
              <Text style={styles.nepraRuleTitle}>🇵🇰 Applies Nationwide</Text>
              <Text style={styles.nepraRuleText}>
                This rule applies equally to all DISCO companies —
                LESCO, IESCO, PESCO, MEPCO, FESCO, GEPCO, HESCO, SEPCO, QESCO and TESCO.
              </Text>
            </View>
            <TouchableOpacity style={styles.modalClose} onPress={() => setNepraVisible(false)}>
              <Text style={styles.modalCloseText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ── ABOUT MODAL ── */}
      <Modal visible={aboutVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>⚡ About Bijli-Dost</Text>
            <Text style={styles.modalText}>
              Bijli-Dost is an AI-powered electricity slab scheduler that helps
              Pakistani households stay under the NEPRA 199-unit protected slab limit
              and avoid sudden bill increases.
            </Text>
            <View style={styles.nepraRule}>
              <Text style={styles.nepraRuleTitle}>🧠 AI Technology Used</Text>
              <Text style={styles.nepraRuleText}>
                • Constraint Satisfaction Problem (CSP){'\n'}
                • Hill Climbing with Random Restarts{'\n'}
                • Min-Conflicts Repair Algorithm
              </Text>
            </View>
            <View style={styles.modalTeam}>
              <Text style={styles.modalTeamTitle}>👨‍💻 Development Team — NITROSOFT</Text>
              <Text style={styles.modalTeamText}>FAST-NUCES · 4th Semester · BS AI</Text>
              {['Muhammad Usman Ghani','Wasiq Ahmed','Muhammad Azan',
                'Afrasiyab Khan','Muhammad Awais'].map((name, i) => (
                <Text key={i} style={styles.modalTeamMember}>• {name}</Text>
              ))}
            </View>
            <TouchableOpacity style={styles.modalClose} onPress={() => setAboutVisible(false)}>
              <Text style={styles.modalCloseText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ── HELP MODAL ── */}
      <Modal visible={helpVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>❓ Help & FAQ</Text>
            {[
              ['Where do I find my units consumed?',
               'Check your WAPDA or DISCO electricity bill — it shows units used this month.'],
              ['What is the 199-unit limit?',
               'NEPRA offers a subsidized rate for households using 199 units or less. Crossing this limit can double your bill.'],
              ['Which DISCO should I select?',
               'Select based on your city. PESCO for Peshawar/KPK, LESCO for Lahore, IESCO for Islamabad, etc.'],
              ['How accurate is the AI?',
               'The CSP + Hill Climbing optimizer guarantees mathematically safe schedules within your budget.'],
              ['What if my scenario is impossible?',
               'Bijli-Dost detects it and recommends which appliances to remove to save your slab.'],
            ].map(([q, a], i) => (
              <View key={i} style={{ marginBottom: 12 }}>
                <Text style={styles.modalQ}>{q}</Text>
                <Text style={styles.modalA}>{a}</Text>
              </View>
            ))}
            <TouchableOpacity style={styles.modalClose} onPress={() => setHelpVisible(false)}>
              <Text style={styles.modalCloseText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ── CONTACT MODAL ── */}
      <Modal visible={contactVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>📞 Contact Us</Text>
            <Text style={styles.modalText}>Have feedback or found a bug? Reach out to us:</Text>
            {[
              ['🏛️', 'NITROSOFT'],
              ['👥', 'NITROSOFT — AI Project Team'],
              ['📧', 'usmanghani5129@gmail.com'],
              ['🌐', 'nitrosoft.com'],
              ['🌍', 'Available across all of Pakistan'],
            ].map(([icon, text], i) => (
              <View key={i} style={styles.contactItem}>
                <Text style={styles.contactIcon}>{icon}</Text>
                <Text style={styles.contactText}>{text}</Text>
              </View>
            ))}
            <TouchableOpacity style={styles.modalClose} onPress={() => setContactVisible(false)}>
              <Text style={styles.modalCloseText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

    {/* ── FIRST VISIT LANGUAGE POPUP ── */}
      {langPopup && (
        <BlurView intensity={60} style={styles.blurOverlay}>
          <View style={styles.langPopup}>
            <Text style={styles.langPopupIcon}>🌐</Text>
            <Text style={styles.langPopupTitle}>{t.authSelectLang}</Text>
            <Text style={styles.langPopupHint}>{t.authLangHint}</Text>

            <TouchableOpacity
              style={[styles.langPopupBtn, language === 'en' && styles.langPopupBtnActive]}
              onPress={async () => {
                setLanguage('en');
                await SecureStore.setItemAsync('bd_lang_selected', 'true');
                setLangPopup(false);
              }}>
              <Text style={styles.langPopupFlag}>🇬🇧</Text>
              <Text style={[styles.langPopupBtnText, language === 'en' && styles.langPopupBtnTextActive]}>
                English
              </Text>
              {language === 'en' && <Text style={styles.langPopupCheck}>✓</Text>}
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.langPopupBtn, language === 'ur' && styles.langPopupBtnActive]}
              onPress={async () => {
                setLanguage('ur');
                await SecureStore.setItemAsync('bd_lang_selected', 'true');
                setLangPopup(false);
              }}>
              <Text style={styles.langPopupFlag}>🇵🇰</Text>
              <Text style={[styles.langPopupBtnText, language === 'ur' && styles.langPopupBtnTextActive]}>
                اُردُو
              </Text>
              {language === 'ur' && <Text style={styles.langPopupCheck}>✓</Text>}
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.langPopupBtn, language === 'ps' && styles.langPopupBtnActive]}
              onPress={async () => {
                setLanguage('ps');
                await SecureStore.setItemAsync('bd_lang_selected', 'true');
                setLangPopup(false);
              }}>
               <Text style={styles.langPopupFlag}>🏔️</Text> 
               <Text style={[styles.langPopupBtnText, language === 'ps' && styles.langPopupBtnTextActive]}>
                پښتو
               </Text>
               {language === 'ps' && <Text style={styles.langPopupCheck}>✓</Text>}
            </TouchableOpacity>

          </View>
        </BlurView>
      )}
  </ScrollView>
  );
}

const styles = StyleSheet.create({
  container:    { flex: 1, backgroundColor: '#060810' },
  content:      { padding: 20, paddingBottom: 40 },

  hero:         { backgroundColor: '#0d1b2a', borderRadius: 24,
                  borderWidth: 1, borderColor: '#00d4ff22',
                  padding: 28, alignItems: 'center', marginBottom: 20 },
  heroIcon:     { fontSize: 52, marginBottom: 8 },
  heroTitle:    { fontSize: 36, fontWeight: '800', color: '#00d4ff', letterSpacing: -1 },
  heroTagline:  { fontSize: 12, color: '#00d4ff99', fontWeight: '700',
                  letterSpacing: 2, textTransform: 'uppercase', marginTop: 4 },
  heroDivider:  { width: 40, height: 2, backgroundColor: '#00d4ff33',
                  borderRadius: 999, marginVertical: 16 },
  heroDesc:     { fontSize: 14, color: '#6b7280', textAlign: 'center',
                  lineHeight: 22, marginBottom: 16 },
  nepraBtn:     { backgroundColor: '#00d4ff12', borderWidth: 1,
                  borderColor: '#00d4ff33', borderRadius: 10,
                  paddingHorizontal: 16, paddingVertical: 8 },
  nepraBtnText: { color: '#00d4ff', fontSize: 12, fontWeight: '700' },

  card:         { backgroundColor: '#0f1724', borderRadius: 20,
                  borderWidth: 1, borderColor: '#1a2332',
                  padding: 20, marginBottom: 16 },
  cardHeader: { flexDirection: 'row', alignItems: 'center',
              gap: 12, marginBottom: 16, flexShrink: 1 },
  cardIcon:     { fontSize: 28 },
  cardTitle:    { fontSize: 16, fontWeight: '700', color: '#ffffff' },
  cardSub: { fontSize: 12, color: '#4b5563', marginTop: 2, flexShrink: 1, flexWrap: 'wrap' },

  discoSelector:{ backgroundColor: '#161f2e', borderWidth: 1,
                  borderColor: '#1f2d3d', borderRadius: 12,
                  padding: 16, marginBottom: 10 },
  discoSelected:{ flexDirection: 'row', alignItems: 'center', gap: 12 },
  discoBadge:   { backgroundColor: '#00d4ff15', borderWidth: 1,
                  borderColor: '#00d4ff33', borderRadius: 8,
                  paddingHorizontal: 10, paddingVertical: 6 },
  discoBadgeText:{ color: '#00d4ff', fontWeight: '800', fontSize: 13 },
  discoName:    { color: '#ffffff', fontWeight: '700', fontSize: 15 },
  discoRegion:  { color: '#6b7280', fontSize: 12, marginTop: 2 },
  discoPlaceholder:{ color: '#4b5563', fontSize: 14 },
  discoNote:    { color: '#374151', fontSize: 11, marginTop: 4 },

  label:        { fontSize: 11, color: '#6b7280', marginBottom: 8,
                  marginTop: 4, fontWeight: '700',
                  textTransform: 'uppercase', letterSpacing: 0.5 },
  inputWrap:    { flexDirection: 'row', alignItems: 'center',
                  backgroundColor: '#161f2e', borderWidth: 1,
                  borderColor: '#1f2d3d', borderRadius: 12,
                  paddingHorizontal: 14, marginBottom: 16 },
  inputIcon:    { fontSize: 18, marginRight: 10 },
  input:        { flex: 1, color: '#ffffff', fontSize: 16, paddingVertical: 14 },
  inputUnit:    { color: '#374151', fontSize: 13, fontWeight: '600' },

  statusCard:   { borderRadius: 20, borderWidth: 1, padding: 18, marginBottom: 16 },
  statusRow:    { flexDirection: 'row', justifyContent: 'space-between',
                  alignItems: 'center', marginBottom: 12 },
  statusLevel:  { fontSize: 16, fontWeight: '800' },
  statusPct:    { fontSize: 20, fontWeight: '800' },
  progressWrap: { backgroundColor: '#1f2937', borderRadius: 999,
                  height: 8, overflow: 'hidden', marginBottom: 16 },
  progressFill: { height: '100%', borderRadius: 999 },
  statusStats:  { flexDirection: 'row', justifyContent: 'space-around' },
  statItem:     { alignItems: 'center' },
  statVal:      { fontSize: 20, fontWeight: '800', color: '#ffffff' },
  statLabel:    { fontSize: 11, color: '#6b7280', marginTop: 2, fontWeight: '600' },
  statDivider:  { width: 1, backgroundColor: '#1f2937' },

  button:       { backgroundColor: '#00d4ff', borderRadius: 16,
                  padding: 18, alignItems: 'center', marginBottom: 20 },
  buttonText:   { color: '#000000', fontSize: 17, fontWeight: '800' },

  sectionTitle: { fontSize: 15, fontWeight: '700', color: '#ffffff', marginBottom: 16 },
  step:         { flexDirection: 'row', alignItems: 'flex-start',
                  gap: 14, marginBottom: 16 },
  stepNum:      { width: 30, height: 30, borderRadius: 999,
                  backgroundColor: '#00d4ff15', borderWidth: 1,
                  borderColor: '#00d4ff33', justifyContent: 'center',
                  alignItems: 'center', marginTop: 2 },
  stepNumText:  { color: '#00d4ff', fontWeight: '800', fontSize: 13 },
  stepContent:  { flex: 1 },
  stepTitle:    { color: '#ffffff', fontWeight: '700', fontSize: 14, marginBottom: 2 },
  stepDesc:     { color: '#6b7280', fontSize: 13, lineHeight: 20 },

  footerMenu:   { flexDirection: 'row', backgroundColor: '#0f1724',
                  borderRadius: 16, borderWidth: 1, borderColor: '#1a2332',
                  marginBottom: 12, overflow: 'hidden' },
  footerItem:   { flex: 1, alignItems: 'center', paddingVertical: 18 },
  footerIcon:   { fontSize: 22, marginBottom: 5 },
  footerLabel:  { color: '#6b7280', fontSize: 11, fontWeight: '600' },
  footerLine:   { width: 1, backgroundColor: '#1a2332' },
  copyright:    { textAlign: 'center', color: '#1f2937', fontSize: 11, marginBottom: 8 },

  modalOverlay: { flex: 1, backgroundColor: '#000000cc', justifyContent: 'flex-end' },
  modal:        { backgroundColor: '#0f1724', borderTopLeftRadius: 28,
                  borderTopRightRadius: 28, borderWidth: 1,
                  borderColor: '#1a2332', padding: 24, paddingBottom: 40 },
  modalTitle:   { fontSize: 20, fontWeight: '800', color: '#ffffff', marginBottom: 6 },
  modalSubtitle:{ fontSize: 12, color: '#6b7280', marginBottom: 16 },
  modalText:    { color: '#9ca3af', fontSize: 14, lineHeight: 22, marginBottom: 12 },

  nepraRule:    { backgroundColor: '#161f2e', borderRadius: 12,
                  borderWidth: 1, borderColor: '#1f2d3d',
                  padding: 14, marginBottom: 10 },
  nepraRuleTitle:{ color: '#00d4ff', fontWeight: '700', fontSize: 14, marginBottom: 6 },
  nepraRuleText: { color: '#9ca3af', fontSize: 13, lineHeight: 20 },

  modalTeam:    { backgroundColor: '#161f2e', borderRadius: 12,
                  padding: 14, marginTop: 8, marginBottom: 8 },
  modalTeamTitle:{ color: '#00d4ff', fontWeight: '700', fontSize: 13, marginBottom: 6 },
  modalTeamText: { color: '#6b7280', fontSize: 12, marginBottom: 4 },
  modalTeamMember:{ color: '#9ca3af', fontSize: 13, lineHeight: 24 },

  modalQ:       { color: '#ffffff', fontWeight: '700', fontSize: 14, marginBottom: 4 },
  modalA:       { color: '#9ca3af', fontSize: 13, lineHeight: 20 },

  contactItem:  { flexDirection: 'row', alignItems: 'center', gap: 12,
                  paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#1a2332' },
  contactIcon:  { fontSize: 22 },
  contactText:  { color: '#9ca3af', fontSize: 14 },

  discoOption:  { flexDirection: 'row', alignItems: 'center', gap: 12,
                  paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#1a2332' },
  discoOptionSelected:{ backgroundColor: '#00d4ff08', borderRadius: 8 },
  discoInfo:    { flex: 1 },
  discoOptionName:{ color: '#ffffff', fontWeight: '700', fontSize: 14 },
  discoOptionRegion:{ color: '#6b7280', fontSize: 12, marginTop: 2 },
  discoCheck:   { color: '#00d4ff', fontWeight: '800', fontSize: 18 },

  modalClose:   { backgroundColor: '#00d4ff', borderRadius: 12,
                  padding: 16, alignItems: 'center', marginTop: 16 },
  modalCloseText:{ color: '#000000', fontWeight: '800', fontSize: 15 },

  scanBillBtn:  { flexDirection: 'row', alignItems: 'center', gap: 12,
                backgroundColor: '#00d4ff08', borderWidth: 1,
                borderColor: '#00d4ff33', borderRadius: 12,
                padding: 14, marginBottom: 12 },
scanBillIcon: { fontSize: 24 },
scanBillTitle:{ color: '#00d4ff', fontWeight: '700', fontSize: 14 },
scanBillSub:  { color: '#4b5563', fontSize: 11, marginTop: 2 },
scanBillArrow:{ color: '#00d4ff', fontSize: 18 },
welcomeGreeting: { fontSize: 14, color: '#00d4ff', fontWeight: '600', marginBottom: 6 },
copyright: { textAlign: 'center', color: '#1f2937', fontSize: 11, marginBottom: 8 },
langToggleBtn:  { backgroundColor: '#00d4ff12', borderWidth: 1,
                  borderColor: '#00d4ff33', borderRadius: 10,
                  paddingHorizontal: 16, paddingVertical: 8, marginTop: 10 },
langToggleText: { color: '#00d4ff', fontSize: 12, fontWeight: '700' },
blurOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
               justifyContent: 'flex-start', alignItems: 'center', padding: 24, paddingTop: 60 },
langPopup:          { width: '100%', backgroundColor: '#111827ee', borderRadius: 24,
                      borderWidth: 1, borderColor: '#1f2937', padding: 28,
                      alignItems: 'center' },
langPopupIcon:      { fontSize: 40, marginBottom: 12 },
langPopupTitle:     { fontSize: 22, fontWeight: '800', color: '#ffffff', marginBottom: 8 },
langPopupHint:      { fontSize: 13, color: '#6b7280', marginBottom: 24, textAlign: 'center' },
langPopupBtn:       { width: '100%', flexDirection: 'row', alignItems: 'center',
                      backgroundColor: '#1f2937', borderRadius: 14,
                      borderWidth: 1, borderColor: '#374151',
                      padding: 16, marginBottom: 12 },
langPopupBtnActive: { borderColor: '#00d4ff', backgroundColor: '#00d4ff15' },
langPopupFlag:      { fontSize: 24, marginRight: 14 },
langPopupBtnText:   { flex: 1, fontSize: 18, color: '#9ca3af', fontWeight: '700' },
langPopupBtnTextActive: { color: '#00d4ff' },
langPopupCheck:     { color: '#00d4ff', fontWeight: '800', fontSize: 18 },

});