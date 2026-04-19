// =============================================================================
// BillScannerScreen.js — Version 2
// Two-photo flow: Bill photo + Meter photo + Date picker
// Project: Bijli-Dost — AI Electricity Slab Scheduler
// =============================================================================

import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  ScrollView, Alert, Image, ActivityIndicator, Platform,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useLanguage } from '../LanguageContext';

const SERVER_IP = '172.20.0.173';
const API_URL   = `http://${SERVER_IP}:5000`;

export default function BillScannerScreen({ navigation, route }) {
  const { t } = useLanguage();
  const { selectedDISCO } = route.params || {};

  // ── State ──────────────────────────────────────────────────────────────────
  const [step,          setStep]          = useState(1); // 1=bill, 2=meter, 3=date, 4=result
  const [billImage,     setBillImage]     = useState(null);
  const [meterImage,    setMeterImage]    = useState(null);
  const [scanning,      setScanning]      = useState(false);
  const [scanStatus,    setScanStatus]    = useState('');
  const [billData,      setBillData]      = useState(null); // from bill scan
  const [meterData,     setMeterData]     = useState(null); // from meter scan
  const [showDatePicker,setShowDatePicker]= useState(false);
  const [todayDate,     setTodayDate]     = useState(new Date());
  const [finalResult,   setFinalResult]   = useState(null);

  // ── Pick Image ─────────────────────────────────────────────────────────────
  const pickImage = async (fromCamera, forBill) => {
    try {
      let res;
      if (fromCamera) {
        const perm = await ImagePicker.requestCameraPermissionsAsync();
        if (!perm.granted) {
          Alert.alert('Permission needed', 'Camera permission is required.');
          return;
        }
        res = await ImagePicker.launchCameraAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          quality: 0.8,
          base64: true,
        });
      } else {
        res = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          quality: 0.8,
          base64: true,
        });
      }
      if (!res.canceled && res.assets[0]) {
        if (forBill) {
          setBillImage(res.assets[0]);
        } else {
          setMeterImage(res.assets[0]);
        }
      }
    } catch (e) {
      Alert.alert('Error', 'Could not open image picker.');
    }
  };

  // ── Scan Bill Photo ────────────────────────────────────────────────────────
  const scanBillPhoto = async () => {
    if (!billImage?.base64) {
      Alert.alert('No Image', 'Please select your bill photo first.');
      return;
    }
    setScanning(true);
    setScanStatus('📡 Connecting to Gemini AI...');
    const t1 = setTimeout(() => setScanStatus('🔍 Reading your bill...'),         2000);
    const t2 = setTimeout(() => setScanStatus('🧠 Extracting meter readings...'), 5000);
    const t3 = setTimeout(() => setScanStatus('✅ Almost done...'),               8000);

    try {
      const res  = await fetch(`${API_URL}/scan-bill-v2`, {
        method : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body   : JSON.stringify({
          image     : billImage.base64,
          scan_type : 'bill',
          disco_name: selectedDISCO?.id   || '',
          disco_full: selectedDISCO?.name || '',
        }),
      });
      const data = await res.json();

      if (data.success) {
        setBillData(data);
        setStep(2);
      } else if (data.wrong_company) {
        Alert.alert(
          '❌ Wrong Company Bill',
          `You selected ${selectedDISCO?.name} but uploaded a ${data.actual_company} bill.\n\nWhat do you want to do?`,
          [
            { text: '🏢 Change Company', onPress: () => navigation.navigate('Home') },
            { text: '📸 Upload Again',   onPress: () => setBillImage(null) },
            { text: 'Cancel', style: 'cancel' },
          ]
        );
      } else {
        Alert.alert('Scan Failed', data.error || 'Could not read bill.');
      }
    } catch {
      Alert.alert('Error', 'Could not connect to server.');
    }
    clearTimeout(t1); clearTimeout(t2); clearTimeout(t3);
    setScanning(false);
    setScanStatus('');
  };

  // ── Scan Meter Photo ───────────────────────────────────────────────────────
  const scanMeterPhoto = async () => {
    if (!meterImage?.base64) {
      Alert.alert('No Image', 'Please take a photo of your meter first.');
      return;
    }
    setScanning(true);
    setScanStatus('📡 Connecting to Gemini AI...');
    const t1 = setTimeout(() => setScanStatus('🔍 Reading your meter...'),        2000);
    const t2 = setTimeout(() => setScanStatus('🧠 Extracting meter reading...'),  5000);
    const t3 = setTimeout(() => setScanStatus('✅ Almost done...'),               8000);

    try {
      const res  = await fetch(`${API_URL}/scan-bill-v2`, {
        method : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body   : JSON.stringify({
          image    : meterImage.base64,
          scan_type: 'meter',
        }),
      });
      const data = await res.json();

      if (data.success) {
        setMeterData(data);
        setStep(3);
      } else {
        Alert.alert('Scan Failed', data.error || 'Could not read meter.');
      }
    } catch {
      Alert.alert('Error', 'Could not connect to server.');
    }
    clearTimeout(t1); clearTimeout(t2); clearTimeout(t3);
    setScanning(false);
    setScanStatus('');
  };

  // ── Calculate Final Result ─────────────────────────────────────────────────
  const calculateResult = () => {
    if (!billData || !meterData) return;

    const previousReading = billData.current_reading;
    const currentReading  = meterData.meter_reading;
   const unitsUsed = Math.round((Math.max(0, currentReading - previousReading)) * 10) / 10;

    const readingDate = new Date(billData.reading_date);
    const today       = todayDate;
    const daysUsed    = Math.max(1, Math.round((today - readingDate) / (1000 * 60 * 60 * 24)));
    const daysRemaining = Math.max(1, 30 - daysUsed);

    if (unitsUsed > 199) {
      Alert.alert(
        '❌ Limit Exceeded',
        `You have already used ${unitsUsed} units which exceeds the 199-unit NEPRA protected slab limit.`,
        [{ text: 'OK' }]
      );
      return;
    }

    setFinalResult({
      previousReading,
      currentReading,
      unitsUsed,
      readingDate : billData.reading_date,
      todayDate   : today.toLocaleDateString('en-GB'),
      daysUsed,
      daysRemaining,
    });
    setStep(4);
  };

  // ── Use This Reading ───────────────────────────────────────────────────────
  const useThisReading = () => {
    if (!finalResult) return;
    navigation.navigate('Home', {
      scannedUnits   : finalResult.unitsUsed,
      scannedDays    : finalResult.daysRemaining,
    });
  };

  // ── Format Date ────────────────────────────────────────────────────────────
  const formatDate = (date) => {
    return date.toLocaleDateString('en-GB', {
      day: '2-digit', month: 'short', year: 'numeric'
    });
  };

  // ── RENDER ─────────────────────────────────────────────────────────────────
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>

      {/* ── HERO ── */}
      <View style={styles.hero}>
        <Text style={styles.heroIcon}>📸</Text>
        <Text style={styles.heroTitle}>Smart Bill Scanner</Text>
        <Text style={styles.heroDesc}>
          Scan your bill + meter for automatic unit and day calculation
        </Text>
        {selectedDISCO && (
          <View style={styles.discoBadge}>
            <Text style={styles.discoBadgeText}>
              📋 {selectedDISCO.name} · Auto Detection
            </Text>
          </View>
        )}
      </View>

      {/* ── PROGRESS STEPS ── */}
      <View style={styles.progressRow}>
        {['📄 Bill', '⚡ Meter', '📅 Date', '✅ Done'].map((label, i) => (
          <View key={i} style={styles.progressStep}>
            <View style={[styles.progressDot,
              step > i + 1 && styles.progressDotDone,
              step === i + 1 && styles.progressDotActive]}>
              <Text style={styles.progressDotText}>{i + 1}</Text>
            </View>
            <Text style={[styles.progressLabel,
              step === i + 1 && styles.progressLabelActive]}>
              {label}
            </Text>
          </View>
        ))}
      </View>

      {/* ══════════════════════════════════════════════════════════════════════
          STEP 1 — SCAN BILL
      ══════════════════════════════════════════════════════════════════════ */}
      {step === 1 && (
        <View style={styles.stepCard}>
          <Text style={styles.stepTitle}>Step 1 — Upload Your Electricity Bill</Text>
          <Text style={styles.stepDesc}>
            We will read the current meter reading and billing date from your bill automatically.
          </Text>

          <View style={styles.pickerRow}>
            <TouchableOpacity style={styles.pickerBtn} onPress={() => pickImage(true, true)}>
              <Text style={styles.pickerIcon}>📷</Text>
              <Text style={styles.pickerText}>Take Photo</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.pickerBtn} onPress={() => pickImage(false, true)}>
              <Text style={styles.pickerIcon}>🖼️</Text>
              <Text style={styles.pickerText}>Gallery</Text>
            </TouchableOpacity>
          </View>

          {billImage && (
            <View style={styles.previewCard}>
              <Image source={{ uri: billImage.uri }}
                style={styles.previewImage} resizeMode="contain" />
            </View>
          )}

          {billImage && (
            <TouchableOpacity
              style={styles.scanBtn}
              onPress={scanBillPhoto}
              disabled={scanning}>
              {scanning ? (
                <View style={styles.scanningWrap}>
                  <ActivityIndicator color="#000" />
                  <Text style={styles.scanningText}>{scanStatus}</Text>
                </View>
              ) : (
                <Text style={styles.scanBtnText}>🤖 Scan Bill with AI</Text>
              )}
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          STEP 2 — SCAN METER
      ══════════════════════════════════════════════════════════════════════ */}
      {step === 2 && (
        <View style={styles.stepCard}>

          {/* Bill scan result summary */}
          <View style={styles.summaryCard}>
            <Text style={styles.summaryTitle}>✅ Bill Scanned Successfully!</Text>
            <View style={styles.summaryRow}>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryVal}>{billData?.current_reading}</Text>
                <Text style={styles.summaryLabel}>Bill Reading</Text>
              </View>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryVal}>{billData?.reading_date}</Text>
                <Text style={styles.summaryLabel}>Reading Date</Text>
              </View>
            </View>
          </View>

          <Text style={styles.stepTitle}>Step 2 — Take Photo of Your Meter</Text>
          <Text style={styles.stepDesc}>
            Take a clear photo of your physical electricity meter display right now.
          </Text>

          <View style={styles.pickerRow}>
            <TouchableOpacity style={styles.pickerBtn} onPress={() => pickImage(true, false)}>
              <Text style={styles.pickerIcon}>📷</Text>
              <Text style={styles.pickerText}>Take Photo</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.pickerBtn} onPress={() => pickImage(false, false)}>
              <Text style={styles.pickerIcon}>🖼️</Text>
              <Text style={styles.pickerText}>Gallery</Text>
            </TouchableOpacity>
          </View>

          {meterImage && (
            <View style={styles.previewCard}>
              <Image source={{ uri: meterImage.uri }}
                style={styles.previewImage} resizeMode="contain" />
            </View>
          )}

          {meterImage && (
            <TouchableOpacity
              style={styles.scanBtn}
              onPress={scanMeterPhoto}
              disabled={scanning}>
              {scanning ? (
                <View style={styles.scanningWrap}>
                  <ActivityIndicator color="#000" />
                  <Text style={styles.scanningText}>{scanStatus}</Text>
                </View>
              ) : (
                <Text style={styles.scanBtnText}>🤖 Scan Meter with AI</Text>
              )}
            </TouchableOpacity>
          )}

          <TouchableOpacity style={styles.backBtn} onPress={() => setStep(1)}>
            <Text style={styles.backBtnText}>← Back to Bill</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          STEP 3 — SELECT DATE
      ══════════════════════════════════════════════════════════════════════ */}
      {step === 3 && (
        <View style={styles.stepCard}>

          {/* Meter scan result summary */}
          <View style={styles.summaryCard}>
            <Text style={styles.summaryTitle}>✅ Meter Scanned Successfully!</Text>
            <View style={styles.summaryRow}>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryVal}>{billData?.current_reading}</Text>
                <Text style={styles.summaryLabel}>Bill Reading</Text>
              </View>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryVal}>{meterData?.meter_reading}</Text>
                <Text style={styles.summaryLabel}>Meter Now</Text>
              </View>
              <View style={styles.summaryItem}>
                <Text style={[styles.summaryVal, { color: '#00d4ff' }]}>
                  {Math.max(0, meterData?.meter_reading - billData?.current_reading).toFixed(1)}
                </Text>
                <Text style={styles.summaryLabel}>Units Used</Text>
              </View>
            </View>
          </View>

          <Text style={styles.stepTitle}>Step 3 — Confirm Today's Date</Text>
          <Text style={styles.stepDesc}>
            Select today's date so we can calculate how many days are left in your billing cycle.
          </Text>

          <TouchableOpacity
            style={styles.datePickerBtn}
            onPress={() => setShowDatePicker(true)}>
            <Text style={styles.datePickerIcon}>📅</Text>
            <View>
              <Text style={styles.datePickerLabel}>Today's Date</Text>
              <Text style={styles.datePickerValue}>{formatDate(todayDate)}</Text>
            </View>
            <Text style={styles.datePickerArrow}>▼</Text>
          </TouchableOpacity>

          {showDatePicker && (
            <DateTimePicker
              value={todayDate}
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              maximumDate={new Date()}
              onChange={(event, selectedDate) => {
                setShowDatePicker(false);
                if (selectedDate) setTodayDate(selectedDate);
              }}
            />
          )}

          <TouchableOpacity style={styles.scanBtn} onPress={calculateResult}>
            <Text style={styles.scanBtnText}>⚡ Calculate My Usage</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.backBtn} onPress={() => setStep(2)}>
            <Text style={styles.backBtnText}>← Back to Meter</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          STEP 4 — FINAL RESULT
      ══════════════════════════════════════════════════════════════════════ */}
      {step === 4 && finalResult && (
        <View style={styles.stepCard}>
          <Text style={styles.resultTitle}>🎉 Calculation Complete!</Text>

          {/* Readings */}
          <View style={styles.resultGrid}>
            <View style={styles.resultItem}>
              <Text style={styles.resultVal}>{finalResult.previousReading}</Text>
              <Text style={styles.resultLabel}>Previous{'\n'}Reading</Text>
            </View>
            <View style={styles.resultItem}>
              <Text style={styles.resultVal}>{finalResult.currentReading}</Text>
              <Text style={styles.resultLabel}>Current{'\n'}Reading</Text>
            </View>
            <View style={[styles.resultItem, styles.resultItemHighlight]}>
              <Text style={[styles.resultVal, { color: '#00d4ff' }]}>
                {finalResult.unitsUsed}
              </Text>
              <Text style={styles.resultLabel}>Units{'\n'}Used</Text>
            </View>
          </View>

          {/* Days */}
          <View style={styles.resultGrid}>
            <View style={styles.resultItem}>
              <Text style={styles.resultVal}>{finalResult.readingDate}</Text>
              <Text style={styles.resultLabel}>Billing{'\n'}Start</Text>
            </View>
            <View style={styles.resultItem}>
              <Text style={styles.resultVal}>{finalResult.todayDate}</Text>
              <Text style={styles.resultLabel}>Today</Text>
            </View>
            <View style={[styles.resultItem, styles.resultItemHighlight]}>
              <Text style={[styles.resultVal, { color: '#4ade80' }]}>
                {finalResult.daysRemaining}
              </Text>
              <Text style={styles.resultLabel}>Days{'\n'}Remaining</Text>
            </View>
          </View>

          <View style={styles.autoFillBox}>
            <Text style={styles.autoFillText}>
              ✅ Units Consumed: <Text style={{ color: '#00d4ff', fontWeight: '800' }}>{finalResult.unitsUsed}</Text>
              {' '}will be auto-filled{'\n'}
              ✅ Days Remaining: <Text style={{ color: '#4ade80', fontWeight: '800' }}>{finalResult.daysRemaining}</Text>
              {' '}will be auto-filled
            </Text>
          </View>

          <TouchableOpacity style={styles.useBtn} onPress={useThisReading}>
            <Text style={styles.useBtnText}>✅ Use This Reading</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => {
              setStep(1);
              setBillImage(null);
              setMeterImage(null);
              setBillData(null);
              setMeterData(null);
              setFinalResult(null);
            }}>
            <Text style={styles.backBtnText}>🔄 Scan Again</Text>
          </TouchableOpacity>
        </View>
      )}

      <Text style={styles.copyright}>© 2026 Bijli-Dost · v1.0.0 · Pakistan</Text>
      <Text style={styles.copyright}>by NITROSOFT</Text>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container:          { flex: 1, backgroundColor: '#060810' },
  content:            { padding: 20, paddingBottom: 40 },

  hero:               { backgroundColor: '#0f1724', borderRadius: 20,
                        borderWidth: 1, borderColor: '#1a2332',
                        padding: 24, alignItems: 'center', marginBottom: 16 },
  heroIcon:           { fontSize: 48, marginBottom: 12 },
  heroTitle:          { fontSize: 24, fontWeight: '800', color: '#00d4ff', marginBottom: 8 },
  heroDesc:           { fontSize: 13, color: '#6b7280', textAlign: 'center',
                        lineHeight: 20, marginBottom: 14 },
  discoBadge:         { backgroundColor: '#00d4ff12', borderWidth: 1,
                        borderColor: '#00d4ff33', borderRadius: 10,
                        paddingHorizontal: 14, paddingVertical: 8 },
  discoBadgeText:     { color: '#00d4ff', fontSize: 12, fontWeight: '700' },

  progressRow:        { flexDirection: 'row', justifyContent: 'space-between',
                        alignItems: 'center', marginBottom: 16,
                        backgroundColor: '#0f1724', borderRadius: 16,
                        borderWidth: 1, borderColor: '#1a2332', padding: 16 },
  progressStep:       { alignItems: 'center', flex: 1 },
  progressDot:        { width: 28, height: 28, borderRadius: 14,
                        backgroundColor: '#1f2937', borderWidth: 1,
                        borderColor: '#374151', alignItems: 'center',
                        justifyContent: 'center', marginBottom: 6 },
  progressDotActive:  { backgroundColor: '#00d4ff15', borderColor: '#00d4ff' },
  progressDotDone:    { backgroundColor: '#052e16', borderColor: '#16a34a' },
  progressDotText:    { color: '#6b7280', fontWeight: '800', fontSize: 12 },
  progressLabel:      { color: '#4b5563', fontSize: 10, fontWeight: '600',
                        textAlign: 'center' },
  progressLabelActive:{ color: '#00d4ff' },

  stepCard:           { backgroundColor: '#0f1724', borderRadius: 20,
                        borderWidth: 1, borderColor: '#1a2332',
                        padding: 20, marginBottom: 16 },
  stepTitle:          { fontSize: 16, fontWeight: '800', color: '#ffffff', marginBottom: 8 },
  stepDesc:           { fontSize: 13, color: '#6b7280', lineHeight: 20, marginBottom: 20 },

  summaryCard:        { backgroundColor: '#0a1628', borderRadius: 14,
                        borderWidth: 1, borderColor: '#00d4ff22',
                        padding: 14, marginBottom: 20 },
  summaryTitle:       { fontSize: 13, fontWeight: '700', color: '#4ade80', marginBottom: 10 },
  summaryRow:         { flexDirection: 'row', justifyContent: 'space-around' },
  summaryItem:        { alignItems: 'center' },
  summaryVal:         { fontSize: 16, fontWeight: '800', color: '#ffffff' },
  summaryLabel:       { fontSize: 10, color: '#6b7280', marginTop: 4 },

  pickerRow:          { flexDirection: 'row', gap: 12, marginBottom: 16 },
  pickerBtn:          { flex: 1, backgroundColor: '#161f2e', borderRadius: 14,
                        borderWidth: 1, borderColor: '#1f2d3d',
                        padding: 18, alignItems: 'center' },
  pickerIcon:         { fontSize: 28, marginBottom: 6 },
  pickerText:         { color: '#ffffff', fontWeight: '700', fontSize: 13 },

  previewCard:        { borderRadius: 14, borderWidth: 1, borderColor: '#1a2332',
                        overflow: 'hidden', marginBottom: 14 },
  previewImage:       { width: '100%', height: 180 },

  scanBtn:            { backgroundColor: '#00d4ff', borderRadius: 14,
                        padding: 16, alignItems: 'center', marginBottom: 12,
                        minHeight: 54, justifyContent: 'center' },
  scanBtnText:        { color: '#000000', fontWeight: '800', fontSize: 15 },
  scanningWrap:       { alignItems: 'center' },
  scanningText:       { color: '#000000', fontWeight: '700', fontSize: 12, marginTop: 6 },

  backBtn:            { backgroundColor: 'transparent', borderRadius: 12,
                        borderWidth: 1, borderColor: '#1f2937',
                        padding: 14, alignItems: 'center' },
  backBtnText:        { color: '#6b7280', fontWeight: '600', fontSize: 13 },

  datePickerBtn:      { flexDirection: 'row', alignItems: 'center', gap: 12,
                        backgroundColor: '#161f2e', borderRadius: 14,
                        borderWidth: 1, borderColor: '#00d4ff33',
                        padding: 16, marginBottom: 16 },
  datePickerIcon:     { fontSize: 24 },
  datePickerLabel:    { fontSize: 11, color: '#6b7280', marginBottom: 4 },
  datePickerValue:    { fontSize: 16, fontWeight: '800', color: '#00d4ff' },
  datePickerArrow:    { color: '#00d4ff', marginLeft: 'auto' },

  resultTitle:        { fontSize: 20, fontWeight: '800', color: '#4ade80',
                        marginBottom: 16, textAlign: 'center' },
  resultGrid:         { flexDirection: 'row', gap: 8, marginBottom: 12 },
  resultItem:         { flex: 1, backgroundColor: '#161f2e', borderRadius: 12,
                        borderWidth: 1, borderColor: '#1f2d3d',
                        padding: 12, alignItems: 'center' },
  resultItemHighlight:{ borderColor: '#00d4ff33', backgroundColor: '#0a1628' },
  resultVal:          { fontSize: 16, fontWeight: '800', color: '#ffffff',
                        marginBottom: 4 },
  resultLabel:        { fontSize: 10, color: '#6b7280', textAlign: 'center',
                        lineHeight: 14 },

  autoFillBox:        { backgroundColor: '#052e16', borderRadius: 12,
                        borderWidth: 1, borderColor: '#16a34a',
                        padding: 14, marginBottom: 16, marginTop: 4 },
  autoFillText:       { color: '#9ca3af', fontSize: 13, lineHeight: 22 },

  useBtn:             { backgroundColor: '#00d4ff', borderRadius: 14,
                        padding: 16, alignItems: 'center', marginBottom: 12 },
  useBtnText:         { color: '#000000', fontWeight: '800', fontSize: 15 },

  copyright:          { textAlign: 'center', color: '#1f2937',
                        fontSize: 11, marginBottom: 4 },
});