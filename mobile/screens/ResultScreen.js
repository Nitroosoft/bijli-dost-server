// =============================================================================
// ResultScreen.js
// Screen 3: AI Optimized Schedule Results
// =============================================================================

import React from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity
} from 'react-native';
import { useLanguage } from '../LanguageContext';

const PROTECTED_SLAB = 199;

export default function ResultScreen({ route, navigation }) {
  const { t } = useLanguage();
  // Extracting all necessary data passed from ApplianceScreen
 const { result, unitsConsumed, daysRemaining, discoCompany } = route.params;

  const getWarning = (level) => {
    const map = {
      SAFE    : { color: '#4ade80', bg: '#052e16', emoji: '✅', border: '#16a34a' },
      WARNING : { color: '#fbbf24', bg: '#1c1502', emoji: '⚠️', border: '#ca8a04' },
      CRITICAL: { color: '#fb923c', bg: '#1c0a02', emoji: '🔴', border: '#ea580c' },
      EXCEEDED: { color: '#f87171', bg: '#1c0202', emoji: '❌', border: '#dc2626' },
    };
    return map[level] || map.EXCEEDED;
  };

  const calculateBill = (units) => {
    const isKE = discoCompany?.id === 'KELECTRIC';

    // 2026 NEPRA Rates
    const PROT_1   = isKE ? 10.54 : 7.74;
    const PROT_2   = isKE ? 13.01 : 10.06;
    const UNPROT_1 = 16.48;
    const UNPROT_2 = isKE ? 22.94 : 21.32;
    const UNPROT_3 = isKE ? 27.14 : 25.09;
    const FC       = 0.43;
    const GST      = 0.18;
    const TV_FEE   = 35;
    const FIXED_P  = isKE ? 250 : 0;

    const calcEnergy = (u, r1, r2, r3) => {
      let cost = 0;
      if (u <= 0) return 0;
      cost += Math.min(u, 100) * r1;
      if (u > 100) cost += Math.min(u - 100, 100) * r2;
      if (u > 200) cost += Math.min(u - 200, 100) * r3;
      return cost;
    };

    const protEnergy   = calcEnergy(units, PROT_1,   PROT_2,   PROT_2);
    const unprotEnergy = calcEnergy(units, UNPROT_1, UNPROT_2, UNPROT_3);

    const subtotalP  = protEnergy   + (units * FC) + TV_FEE + FIXED_P;
    const subtotalNP = unprotEnergy + (units * FC) + TV_FEE + FIXED_P;

    const totalP  = Math.round(subtotalP  + subtotalP  * GST);
    const totalNP = Math.round(subtotalNP + subtotalNP * GST);

    return {
      protected   : totalP,
      nonProtected: totalNP,
      saved       : totalNP - totalP,
    };
  };

  const warning = getWarning(result.warning_level);
  const pct     = Math.min((result.total_units / PROTECTED_SLAB) * 100, 100);

  // Impossible case
  if (result.impossible) {
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <View style={styles.impossibleCard}>
          <Text style={styles.impossibleTitle}>❌ Mathematically Impossible</Text>
          <Text style={styles.impossibleText}>
            Even running all appliances at minimum hours exceeds
            the 199-unit protected slab given your current consumption.
          </Text>
          <Text style={styles.impossibleStat}>
            Minimum possible: {result.total_units} units
          </Text>
          <Text style={styles.impossibleStat}>
            Protected limit: {PROTECTED_SLAB} units
          </Text>
          <Text style={styles.impossibleTip}>
            💡 Remove heavy appliances like AC, Geyser, or Deep Freezer.
          </Text>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => navigation.goBack()}>
            <Text style={styles.backBtnText}>← Try Different Appliances</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>

      {/* ── STATUS CARD ── */}
      <View style={[styles.statusCard,
        { backgroundColor: warning.bg, borderColor: warning.border }]}>
        <Text style={[styles.statusText, { color: warning.color }]}>
          {warning.emoji}  STATUS: {result.warning_level}
        </Text>
        <View style={styles.progressWrap}>
          <View style={[styles.progressFill,
            { width: `${pct}%`, backgroundColor: warning.color }]} />
        </View>
        <Text style={[styles.statusUnits, { color: warning.color }]}>
          {result.total_units} units / {PROTECTED_SLAB} limit
        </Text>
      </View>

      {/* ── STATS GRID ── */}
      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>TOTAL UNITS</Text>
          <Text style={styles.statValue}>{result.total_units}</Text>
          <Text style={styles.statSub}>kWh projected</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>DAILY USAGE</Text>
          <Text style={styles.statValue}>{result.daily_units}</Text>
          <Text style={styles.statSub}>kWh/day</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>SAFETY BUFFER</Text>
          <Text style={[styles.statValue, { color: '#4ade80' }]}>
            {result.units_saved}
          </Text>
          <Text style={styles.statSub}>units saved</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>DAILY BUDGET</Text>
          <Text style={styles.statValue}>{result.daily_budget}</Text>
          <Text style={styles.statSub}>kWh allowed</Text>
        </View>
      </View>

      {/* ── NEW ONE ── */}
      {/* ── OPTIMIZED SCHEDULE ── */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>📋 Optimized Schedule</Text>
        {result.schedule.map((item) => {
          const reduced = item.change.startsWith('Reduced');
          const hasQty  = item.qty > 1;

          return (
            <View key={item.key} style={styles.scheduleItem}>

              {/* ── Main Row ── */}
              <View style={styles.scheduleRow}>
                <View style={styles.scheduleLeft}>
                  <View style={styles.scheduleNameRow}>
                    <Text style={styles.scheduleName}>{item.name}</Text>
                    {hasQty && (
                      <View style={styles.qtyBadge}>
                        <Text style={styles.qtyBadgeText}>×{item.qty}</Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.scheduleKwh}>{item.daily_kwh} kWh/day</Text>
                </View>
                <View style={styles.scheduleRight}>
                  <Text style={styles.schedulePreferred}>{item.user_pref}h →</Text>
                  {reduced ? (
                    <Text style={styles.scheduleReduced}>↓ {item.ai_hours}h</Text>
                  ) : (
                    <Text style={styles.scheduleKept}>✓ {item.ai_hours}h</Text>
                  )}
                </View>
              </View>

              {/* ── Per Unit Breakdown ── */}
              {hasQty && item.unit_schedule && (
                <View style={styles.unitBreakdown}>
                  {item.unit_schedule.map((u) => (
                    <View key={u.unit} style={styles.unitRow}>

                      {/* Unit Label */}
                      <Text style={styles.unitLabel}>Unit {u.unit}</Text>

                      {/* Progress Bar */}
                      <View style={styles.unitBarWrap}>
                        <View style={[styles.unitBarFill, {
                          width          : u.on
                            ? `${Math.min((u.hours / 24) * 100, 100)}%`
                            : '0%',
                          backgroundColor: u.on ? '#00d4ff' : '#1f2937',
                        }]} />
                      </View>

                      {/* Hours */}
                      <Text style={[styles.unitHours, {
                        color: u.on ? '#ffffff' : '#374151'
                      }]}>
                        {u.on ? `${u.hours}h` : '0h'}
                      </Text>

                      {/* Status */}
                      <Text style={styles.unitStatus}>
                        {u.on ? '✅' : '❌'}
                      </Text>

                    </View>
                  ))}
                </View>
              )}

            </View>
          );
        })}
      </View>

      {/* ── TIPS ── */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>💡 Bijli-Dost Tips</Text>
        <View style={[styles.tipBox, {
          backgroundColor: result.units_saved >= 5 ? '#052e16' : '#1c0a02',
          borderColor    : result.units_saved >= 5 ? '#16a34a' : '#ea580c',
        }]}>
          <Text style={styles.tipText}>
            {result.units_saved >= 5
              ? '✅ Good buffer! You have some flexibility in daily usage.'
              : '⚠️ Tight buffer! Follow the schedule strictly.'}
          </Text>
        </View>
        <View style={styles.tipBox}>
          <Text style={styles.tipText}>
            🕐 Run washing machine and iron during off-peak hours to reduce grid stress.
          </Text>
        </View>
        <View style={styles.tipBox}>
          <Text style={styles.tipText}>
            🔄 If you add a new appliance mid-month, re-run Bijli-Dost to recalculate.
          </Text>
        </View>
      </View>

      {/* ── ESTIMATED BILL ── */}
      {(() => {
        const bill = calculateBill(result.total_units);
        return (
          <View style={styles.billCard}>
            <Text style={styles.billCardTitle}>💰 Estimated Bill</Text>
            <Text style={styles.billCardSub}>
              Based on 2026 NEPRA rates · Approximate only
              {discoCompany ? ` · ${discoCompany.name}` : ''}
            </Text>

            {/* Protected Bill */}
            <View style={styles.billRow}>
              <View style={styles.billRowLeft}>
                <Text style={styles.billRowIcon}>✅</Text>
                <View>
                  <Text style={styles.billRowLabel}>Your Bill (Protected)</Text>
                  <Text style={styles.billRowDesc}>Staying under 199 units</Text>
                </View>
              </View>
              <Text style={styles.billAmountGreen}>
                Rs {bill.protected.toLocaleString()}
              </Text>
            </View>

            <View style={styles.billDivider} />

            {/* Non Protected Bill */}
            <View style={styles.billRow}>
              <View style={styles.billRowLeft}>
                <Text style={styles.billRowIcon}>❌</Text>
                <View>
                  <Text style={styles.billRowLabel}>Without Bijli-Dost</Text>
                  <Text style={styles.billRowDesc}>If you crossed 199 units</Text>
                </View>
              </View>
              <Text style={styles.billAmountRed}>
                Rs {bill.nonProtected.toLocaleString()}
              </Text>
            </View>

            <View style={styles.billDivider} />

            {/* Savings */}
            <View style={styles.savingsRow}>
              <Text style={styles.savingsLabel}>🎉 You Saved</Text>
              <Text style={styles.savingsAmount}>
                Rs {bill.saved.toLocaleString()}
              </Text>
            </View>

            <Text style={styles.billNote}>
              * Includes 18% GST + FC Surcharge + TV Fee.
              Actual bill may vary due to FPA and QTA adjustments.
            </Text>
          </View>
        );
      })()}

      {/* ── BUTTONS ── */}
      <TouchableOpacity
        style={styles.secondaryBtn}
        onPress={() => navigation.goBack()}>
        <Text style={styles.secondaryBtnText}>← Try Different Appliances</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.homeBtn}
        onPress={() => navigation.navigate('Home')}>
        <Text style={styles.homeBtnText}>🏠 Start Over</Text>
      </TouchableOpacity>

      <Text style={styles.copyright}>© 2026 Bijli-Dost · v1.0.0 · Pakistan</Text>
      <Text style={styles.copyright}>by NITROSOFT</Text>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container:          { flex: 1, backgroundColor: '#060810' },
  content:            { padding: 20, paddingBottom: 40 },

  statusCard:         { borderRadius: 20, borderWidth: 1,
                        padding: 20, marginBottom: 16 },
  statusText:         { fontSize: 22, fontWeight: '800', marginBottom: 12 },
  progressWrap:       { backgroundColor: '#1f2937', borderRadius: 999,
                        height: 10, overflow: 'hidden', marginBottom: 10 },
  progressFill:       { height: '100%', borderRadius: 999 },
  statusUnits:        { fontSize: 15, fontWeight: '700' },

  statsGrid:          { flexDirection: 'row', flexWrap: 'wrap',
                        gap: 10, marginBottom: 16 },
  statCard:           { flex: 1, minWidth: '45%', backgroundColor: '#0f1724',
                        borderRadius: 16, borderWidth: 1,
                        borderColor: '#1a2332', padding: 16,
                        alignItems: 'center' },
  statLabel:          { fontSize: 11, color: '#6b7280', fontWeight: '700',
                        letterSpacing: 0.5, marginBottom: 8, textAlign: 'center' },
  statValue:          { fontSize: 28, fontWeight: '800', color: '#ffffff' },
  statSub:            { fontSize: 11, color: '#4b5563', marginTop: 4 },

  card:               { backgroundColor: '#0f1724', borderRadius: 20,
                        borderWidth: 1, borderColor: '#1a2332',
                        padding: 20, marginBottom: 16 },
  cardTitle:          { fontSize: 16, fontWeight: '800', color: '#ffffff',
                        marginBottom: 16 },

  scheduleRow:        { flexDirection: 'row', justifyContent: 'space-between',
                        alignItems: 'center', paddingVertical: 12 },
  scheduleLeft:       { flex: 1 },
  scheduleName:       { fontSize: 14, fontWeight: '700', color: '#ffffff' },
  scheduleKwh:        { fontSize: 12, color: '#6b7280', marginTop: 2 },
  scheduleRight:      { flexDirection: 'row', alignItems: 'center', gap: 8 },
  schedulePreferred:  { fontSize: 13, color: '#6b7280' },
  scheduleReduced:    { fontSize: 14, fontWeight: '800', color: '#fb923c' },
  scheduleKept:       { fontSize: 14, fontWeight: '800', color: '#4ade80' },

  tipBox:             { backgroundColor: '#0f1724', borderRadius: 12,
                        borderWidth: 1, borderColor: '#1a2332',
                        padding: 14, marginBottom: 10 },
  tipText:            { color: '#9ca3af', fontSize: 13, lineHeight: 20 },

  secondaryBtn:       { backgroundColor: '#00d4ff', borderRadius: 16,
                        padding: 18, alignItems: 'center', marginBottom: 12 },
  secondaryBtnText:   { color: '#000000', fontSize: 16, fontWeight: '800' },

  homeBtn:            { backgroundColor: 'transparent', borderRadius: 16,
                        borderWidth: 1, borderColor: '#1f2937',
                        padding: 16, alignItems: 'center', marginBottom: 20 },
  homeBtnText:        { color: '#6b7280', fontSize: 15, fontWeight: '700' },

  impossibleCard:     { backgroundColor: '#1c0202', borderRadius: 20,
                        borderWidth: 1, borderColor: '#dc2626',
                        padding: 24, marginBottom: 16 },
  impossibleTitle:    { fontSize: 20, fontWeight: '800', color: '#f87171',
                        marginBottom: 12 },
  impossibleText:     { color: '#9ca3af', fontSize: 14, lineHeight: 22,
                        marginBottom: 16 },
  impossibleStat:     { color: '#f87171', fontSize: 15, fontWeight: '700',
                        marginBottom: 6 },
  impossibleTip:      { color: '#fbbf24', fontSize: 13, marginTop: 12,
                        marginBottom: 20 },
  backBtn:            { backgroundColor: '#00d4ff', borderRadius: 14,
                        padding: 16, alignItems: 'center' },
  backBtnText:        { color: '#000', fontWeight: '800', fontSize: 15 },

  copyright:          { textAlign: 'center', color: '#1f2937',
                        fontSize: 11, marginBottom: 4 },

  billCard:           { backgroundColor: '#0a1628', borderRadius: 20,
                        borderWidth: 1, borderColor: '#00d4ff22',
                        padding: 20, marginBottom: 16 },
  billCardTitle:      { fontSize: 16, fontWeight: '800', color: '#00d4ff',
                        marginBottom: 4 },
  billCardSub:        { fontSize: 11, color: '#4b5563', marginBottom: 16 },
  billRow:            { flexDirection: 'row', justifyContent: 'space-between',
                        alignItems: 'center', paddingVertical: 12 },
  billRowLeft:        { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  billRowIcon:        { fontSize: 20 },
  billRowLabel:       { fontSize: 14, fontWeight: '700', color: '#ffffff' },
  billRowDesc:        { fontSize: 11, color: '#6b7280', marginTop: 2 },
  billAmountGreen:    { fontSize: 16, fontWeight: '800', color: '#4ade80' },
  billAmountRed:      { fontSize: 16, fontWeight: '800', color: '#f87171' },
  billDivider:        { height: 1, backgroundColor: '#1a2332' },
  savingsRow:         { flexDirection: 'row', justifyContent: 'space-between',
                        alignItems: 'center', backgroundColor: '#052e16',
                        borderRadius: 12, borderWidth: 1,
                        borderColor: '#16a34a', padding: 14,
                        marginTop: 12, marginBottom: 12 },
  savingsLabel:       { fontSize: 15, fontWeight: '800', color: '#4ade80' },
  savingsAmount:      { fontSize: 18, fontWeight: '800', color: '#4ade80' },
  billNote:           { fontSize: 11, color: '#374151', textAlign: 'center',
                        lineHeight: 16 },
  scheduleItem:       { borderBottomWidth: 1, borderBottomColor: '#1a2332' },
  scheduleNameRow:    { flexDirection: 'row', alignItems: 'center', gap: 8 },
  qtyBadge:           { backgroundColor: '#00d4ff22', borderWidth: 1,
                        borderColor: '#00d4ff44', borderRadius: 6,
                        paddingHorizontal: 6, paddingVertical: 2 },
  qtyBadgeText:       { color: '#00d4ff', fontSize: 11, fontWeight: '800' },

  unitBreakdown:      { backgroundColor: '#0a1220', borderRadius: 12,
                        padding: 12, marginBottom: 12, gap: 8 },
  unitRow:            { flexDirection: 'row', alignItems: 'center', gap: 8 },
  unitLabel:          { fontSize: 12, color: '#6b7280', fontWeight: '600',
                        width: 45 },
  unitBarWrap:        { flex: 1, backgroundColor: '#1f2937', borderRadius: 999,
                        height: 6, overflow: 'hidden' },
  unitBarFill:        { height: '100%', borderRadius: 999 },
  unitHours:          { fontSize: 12, fontWeight: '700', width: 32,
                        textAlign: 'right' },
  unitStatus:         { fontSize: 14, width: 24, textAlign: 'center' },
  
});