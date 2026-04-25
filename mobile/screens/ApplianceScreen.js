import React, { useEffect, useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  ScrollView, ActivityIndicator
} from 'react-native';
import CustomAlert from '../components/CustomAlert';
import Slider from '@react-native-community/slider';
import axios from 'axios';
import { useLanguage } from '../LanguageContext';

const API_URL = 'https://web-production-37b3b.up.railway.app';

const GROUPS = {
  '❄️ Cooling & Heating': ['ac 1 ton','ac 1 5 ton','ac 2 ton','ceiling fan','pedestal fan','cooler'],
  '🍳 Kitchen'          : ['refrigerator','deep freezer','microwave','electric kettle','toaster','washing machine'],
  '💡 Lighting'         : ['led bulb','energy saver','tube light'],
  '💻 Entertainment'    : ['tv led 32','tv led 55','laptop','desktop pc','wifi router'],
  '🔧 Utilities'        : ['water pump','geyser electric','iron'],
};

export default function ApplianceScreen({ route, navigation }) {
  const { t } = useLanguage();
  const { unitsConsumed, daysRemaining, discoCompany } = route.params || {};

  const [appliances, setAppliances] = useState([]);
  const [selected,   setSelected]   = useState({});
  {/* Adding this for quantity selection */}
  const [quantities, setQuantities] = useState({});
  const [loading,    setLoading]     = useState(true);
  const [optimizing, setOptimizing] = useState(false);
  const [expanded,   setExpanded]   = useState({ '❄️ Cooling & Heating': true });
  const [alertConfig, setAlertConfig] = useState({
    visible : false,
    type    : 'info',
    title   : '',
    message : '',
    buttons : [{ text: 'OK' }],
  });

  const showAlert = (type, title, message, buttons = [{ text: 'OK' }]) => {
    setAlertConfig({ visible: true, type, title, message, buttons });
  };
  const hideAlert = () => {
    setAlertConfig(prev => ({ ...prev, visible: false }));
  };

  useEffect(() => {
    axios.get(`${API_URL}/appliances`)
      .then(res => { setAppliances(res.data.appliances); setLoading(false); })
      .catch(() => {
        showAlert('error', 'Connection Error',
          'Cannot connect to server. Please check your internet connection.');
        setLoading(false);
      });
  }, []);

  {/* Adding this for quantity selection */}
  const toggleAppliance = (key, minHours, maxHours) => {
    setSelected(prev => {
      if (prev[key] !== undefined) {
        const updated = { ...prev };
        delete updated[key];
        setQuantities(q => { const u = { ...q }; delete u[key]; return u; });
        return updated;
      }
      const defaultHours = minHours === 0 ? Math.min(4, maxHours) : minHours;
      setQuantities(q => ({ ...q, [key]: 1 }));
      return { ...prev, [key]: defaultHours };
    });
  };

  {/* Adding this for quantity selection */}
  const updateHours = (key, value) => {
    setSelected(prev => ({ ...prev, [key]: value }));
  };

  const updateQuantity = (key, delta) => {
    setQuantities(prev => {
      const current = prev[key] || 1;
      const next = Math.max(1, Math.min(10, current + delta));
      return { ...prev, [key]: next };
    });
  };

  const toggleGroup = (group) => {
    setExpanded(prev => ({ ...prev, [group]: !prev[group] }));
  };

  const handleOptimize = async () => {
    if (Object.keys(selected).length === 0) {
      showAlert('warning', 'No Appliances', t.applianceNone);
      return;
    }
    setOptimizing(true);
    try {
      // Multiply hours by quantity for accurate AI calculation
      const adjustedAppliances = {};
      Object.keys(selected).forEach(key => {
        const qty = quantities[key] || 1;
        adjustedAppliances[key] = selected[key] * qty;
      });

      const res = await axios.post(`${API_URL}/optimize`, {
        units_consumed: parseFloat(unitsConsumed) || 0,
        days_remaining: parseInt(daysRemaining)   || 15,
        appliances    : adjustedAppliances,
        quantities    : quantities,
      });

      // Navigate to Result screen with AI response and original data
      navigation.navigate('Result', {
        result       : res.data,
        unitsConsumed,
        daysRemaining,
        discoCompany,
        selected,
        quantities,
      });
   } catch (err) {
      showAlert('error', 'Error', err.response?.data?.error || 'Something went wrong.');
    }
    setOptimizing(false);
  };

  const getAppliancesByGroup = (groupKey) => {
    const normalizedKeys = GROUPS[groupKey];
    return appliances.filter(a =>
      normalizedKeys.includes(a.name.toLowerCase())
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#00d4ff" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>

      {/* ── HEADER CARD ── */}
      <View style={styles.headerCard}>
        <Text style={styles.headerTitle}>🏠 {t.applianceTitle}</Text>
        <Text style={styles.headerSub}>{t.applianceSub}</Text>
        {discoCompany && (
          <View style={styles.discoBadgeRow}>
            <View style={styles.discoBadge}>
              <Text style={styles.discoBadgeText}>{discoCompany.id}</Text>
            </View>
            <Text style={styles.discoName}>{discoCompany.city} · {discoCompany.region}</Text>
          </View>
        )}
      </View>

      {/* ── GROUPS ── */}
      {Object.keys(GROUPS).map(groupName => {
        const groupAppliances = getAppliancesByGroup(groupName);
        if (groupAppliances.length === 0) return null;
        const isExpanded = expanded[groupName];

        return (
          <View key={groupName} style={styles.groupCard}>

            {/* Group Header */}
            <TouchableOpacity
              style={styles.groupHeader}
              onPress={() => toggleGroup(groupName)}>
              <Text style={styles.groupTitle}>{groupName}</Text>
              <Text style={styles.groupArrow}>{isExpanded ? '▲' : '▼'}</Text>
            </TouchableOpacity>

            {/* Appliances in Group */}
            {isExpanded && groupAppliances.map(app => {
              const isSelected = selected[app.key] !== undefined;
              const hours      = selected[app.key] ?? app.min_hours;
              {/* Adding this for quantity selection */}
              const qty        = quantities[app.key] || 1;
              const dailyKwh   = ((app.watts * hours * qty) / 1000).toFixed(2);
              return (
                <View key={app.key} style={styles.appItem}>

                  {/* Appliance Row */}
                  <TouchableOpacity
                    style={styles.appRow}
                    onPress={() => toggleAppliance(app.key, app.min_hours, app.max_hours)}>
                    <View style={[styles.checkbox, isSelected && styles.checkboxSelected]}>
                      {isSelected && <Text style={styles.checkmark}>✓</Text>}
                    </View>
                    <View style={styles.appInfo}>
                      <Text style={[styles.appName, isSelected && styles.appNameSelected]}>
                        {app.name}
                      </Text>
                      <Text style={styles.appWatts}>
                        {app.watts} {t.applianceWatts}
                      </Text>
                    </View>
                    {isSelected && (
                      <Text style={styles.appKwh}>{dailyKwh} kWh/day</Text>
                    )}
                  </TouchableOpacity>

                  {/* Quantity + Slider — only when selected */}
                  {isSelected && (
                    <View style={styles.sliderWrap}>

                      {/* Quantity Row */}
                      <View style={styles.qtyRow}>
                        <Text style={styles.qtyLabel}>Quantity:</Text>
                        <View style={styles.qtyControls}>
                          <TouchableOpacity
                            style={styles.qtyBtn}
                            onPress={() => updateQuantity(app.key, -1)}>
                            <Text style={styles.qtyBtnText}>−</Text>
                          </TouchableOpacity>
                          <Text style={styles.qtyVal}>{qty}</Text>
                          <TouchableOpacity
                            style={styles.qtyBtn}
                            onPress={() => updateQuantity(app.key, +1)}>
                            <Text style={styles.qtyBtnText}>+</Text>
                          </TouchableOpacity>
                        </View>
                        <Text style={styles.qtyTotal}>
                          {(app.watts * qty / 1000).toFixed(2)} kW total
                        </Text>
                      </View>

                      {/* Slider Row */}
                      <View style={styles.sliderRow}>
                        <Text style={styles.sliderLabel}>
                          {t.applianceMin}: {app.min_hours}h
                        </Text>
                        <Text style={styles.sliderValue}>{hours}h / day</Text>
                        <Text style={styles.sliderLabel}>
                          {t.applianceMax}: {app.max_hours}h
                        </Text>
                      </View>
                      <Slider
                        style={styles.slider}
                        minimumValue={app.min_hours}
                        maximumValue={app.max_hours}
                        step={0.5}
                        value={hours}
                        onValueChange={val => updateHours(app.key, val)}
                        minimumTrackTintColor="#00d4ff"
                        maximumTrackTintColor="#1f2937"
                        thumbTintColor="#00d4ff"
                      />
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        );
      })}

      {/* ── SELECTED COUNT ── */}
      {Object.keys(selected).length > 0 && (
        <View style={styles.selectedCount}>
          <Text style={styles.selectedCountText}>
            ✅ {Object.keys(selected).length} {t.applianceSelected}
          </Text>
        </View>
      )}

      {/* ── SUBMIT BUTTON ── */}
      <TouchableOpacity
        style={styles.submitBtn}
        onPress={handleOptimize}
        disabled={optimizing}>
        {optimizing
          ? <ActivityIndicator color="#000" />
          : <Text style={styles.submitText}>⚡  Run AI Optimizer</Text>}
      </TouchableOpacity>

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
  );
}

const styles = StyleSheet.create({
  container:         { flex: 1, backgroundColor: '#060810' },
  content:           { padding: 20, paddingBottom: 40 },

  loadingContainer:  { flex: 1, backgroundColor: '#060810',
                       alignItems: 'center', justifyContent: 'center' },
  loadingText:       { color: '#6b7280', marginTop: 12, fontSize: 14 },

  headerCard:        { backgroundColor: '#0f1724', borderRadius: 20,
                       borderWidth: 1, borderColor: '#1a2332',
                       padding: 20, marginBottom: 16 },
  headerTitle:       { fontSize: 20, fontWeight: '800', color: '#ffffff', marginBottom: 4 },
  headerSub:         { fontSize: 13, color: '#6b7280', marginBottom: 12 },
  discoBadgeRow:     { flexDirection: 'row', alignItems: 'center', gap: 10 },
  discoBadge:        { backgroundColor: '#00d4ff15', borderWidth: 1,
                       borderColor: '#00d4ff33', borderRadius: 8,
                       paddingHorizontal: 10, paddingVertical: 4 },
  discoBadgeText:    { color: '#00d4ff', fontWeight: '800', fontSize: 12 },
  discoName:         { color: '#9ca3af', fontSize: 13 },

  groupCard:         { backgroundColor: '#0f1724', borderRadius: 16,
                       borderWidth: 1, borderColor: '#1a2332',
                       marginBottom: 12, overflow: 'hidden' },
  groupHeader:       { flexDirection: 'row', justifyContent: 'space-between',
                       alignItems: 'center', padding: 16,
                       backgroundColor: '#161f2e' },
  groupTitle:        { fontSize: 15, fontWeight: '700', color: '#00d4ff' },
  groupArrow:        { color: '#00d4ff', fontSize: 12 },

  appItem:           { borderTopWidth: 1, borderTopColor: '#1a2332' },
  appRow:            { flexDirection: 'row', alignItems: 'center',
                       padding: 14, gap: 12 },
  checkbox:          { width: 24, height: 24, borderRadius: 6,
                       borderWidth: 2, borderColor: '#374151',
                       alignItems: 'center', justifyContent: 'center' },
  checkboxSelected:  { backgroundColor: '#00d4ff', borderColor: '#00d4ff' },
  checkmark:         { color: '#000', fontWeight: '800', fontSize: 14 },
  appInfo:           { flex: 1 },
  appName:           { fontSize: 14, fontWeight: '600', color: '#9ca3af' },
  appNameSelected:   { color: '#ffffff', fontWeight: '700' },
  appWatts:          { fontSize: 12, color: '#4b5563', marginTop: 2 },
  appKwh:            { fontSize: 12, color: '#00d4ff', fontWeight: '600' },

  sliderWrap:        { paddingHorizontal: 14, paddingBottom: 14,
                       backgroundColor: '#0d1a28' },
  sliderRow:         { flexDirection: 'row', justifyContent: 'space-between',
                       marginBottom: 4 },
  sliderLabel:       { fontSize: 11, color: '#4b5563' },
  sliderValue:       { fontSize: 13, fontWeight: '700', color: '#00d4ff' },
  slider:            { width: '100%', height: 40 },

  selectedCount:     { backgroundColor: '#00d4ff15', borderRadius: 12,
                       borderWidth: 1, borderColor: '#00d4ff33',
                       padding: 12, alignItems: 'center', marginBottom: 12 },
  selectedCountText: { color: '#00d4ff', fontWeight: '700', fontSize: 14 },

  submitBtn:         { backgroundColor: '#00d4ff', borderRadius: 16,
                       padding: 18, alignItems: 'center', marginBottom: 20 },
  submitText:        { color: '#000000', fontSize: 17, fontWeight: '800' },

  copyright:         { textAlign: 'center', color: '#1f2937',
                       fontSize: 11, marginBottom: 4 },

  qtyRow:      { flexDirection: 'row', alignItems: 'center',
                 gap: 10, marginBottom: 12,
                 paddingTop: 10, borderTopWidth: 1,
                 borderTopColor: '#1a2332' },
  qtyLabel:    { fontSize: 12, color: '#6b7280', fontWeight: '600', flex: 1 },
  qtyControls: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  qtyBtn:      { width: 30, height: 30, borderRadius: 8,
                 backgroundColor: '#00d4ff22', borderWidth: 1,
                 borderColor: '#00d4ff44', alignItems: 'center',
                 justifyContent: 'center' },
  qtyBtnText:  { color: '#00d4ff', fontWeight: '800', fontSize: 18 },
  qtyVal:      { fontSize: 18, fontWeight: '800', color: '#ffffff',
                 minWidth: 30, textAlign: 'center' },
  qtyTotal:    { fontSize: 11, color: '#4b5563', fontWeight: '600' },
});