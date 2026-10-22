// App.tsx — Main entry point
import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  StatusBar, SafeAreaView, Platform,
} from 'react-native';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Notifications from 'expo-notifications';
import * as Haptics from 'expo-haptics';

import { useStore } from './src/store';
import { scheduleAllEvents, addNotificationResponseListener } from './src/services/notifications';
import { initCallDetection, stopCallDetection } from './src/services/callDetection';
import { Toast } from './src/components/UI';
import { C } from './src/utils/theme';

import EventsScreen from './src/screens/EventsScreen';
import WishesScreen from './src/screens/WishesScreen';
import MeetingsScreen from './src/screens/MeetingsScreen';
import AssistantScreen from './src/screens/AssistantScreen';
import SettingsScreen from './src/screens/SettingsScreen';

const TABS = [
  { key: 'events',    label: 'Events',    icon: '📅' },
  { key: 'wishes',    label: 'Wishes',    icon: '💌' },
  { key: 'meetings',  label: 'Meetings',  icon: '🎤' },
  { key: 'assistant', label: 'Assistant', icon: '💬' },
  { key: 'settings',  label: 'Settings',  icon: '⚙️' },
];

type TabKey = 'events' | 'wishes' | 'meetings' | 'assistant' | 'settings';

export default function App() {
  return (
    <SafeAreaProvider>
      <StatusBar barStyle="light-content" backgroundColor={C.bg} />
      <Main />
    </SafeAreaProvider>
  );
}

function Main() {
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<TabKey>('events');
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
  const { loadFromStorage, events } = useStore();
  const notifListenerRef = useRef<Notifications.Subscription | null>(null);

  // ── Bootstrap ────────────────────────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      await loadFromStorage();
      await scheduleAllEvents(events);
      initCallDetection();

      // Navigate to Wishes tab when user taps a birthday notification
      notifListenerRef.current = addNotificationResponseListener((screen, eventId) => {
        if (screen === 'wishes') setActiveTab('wishes');
      });
    })();

    return () => {
      stopCallDetection();
      notifListenerRef.current?.remove();
    };
  }, []);

  function showToast(msg: string, type: 'success' | 'error' = 'success') {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  }

  function switchTab(key: TabKey) {
    Haptics.selectionAsync();
    setActiveTab(key);
  }

  const screens: Record<TabKey, React.ReactNode> = {
    events:    <EventsScreen />,
    wishes:    <WishesScreen />,
    meetings:  <MeetingsScreen />,
    assistant: <AssistantScreen />,
    settings:  <SettingsScreen />,
  };

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      {/* Header */}
      <SafeAreaView style={{ backgroundColor: C.bg }}>
        <View style={styles.header}>
          <View style={styles.headerIcon}>
            <Text style={{ fontSize: 20 }}>📱</Text>
          </View>
          <View>
            <Text style={styles.headerTitle}>Phone Assistant</Text>
            <Text style={styles.headerSub}>Powered by Claude AI</Text>
          </View>
        </View>
      </SafeAreaView>

      {/* Screen content */}
      <View style={{ flex: 1 }}>
        {screens[activeTab]}
      </View>

      {/* Toast */}
      {toast && <Toast message={toast.msg} type={toast.type} />}

      {/* Bottom tab bar */}
      <View style={[styles.tabBar, { paddingBottom: insets.bottom || 12 }]}>
        {TABS.map((tab) => {
          const active = activeTab === tab.key;
          return (
            <TouchableOpacity
              key={tab.key}
              onPress={() => switchTab(tab.key as TabKey)}
              style={styles.tabItem}
              activeOpacity={0.7}
            >
              <View style={[styles.tabIconWrap, active && styles.tabIconActive]}>
                <Text style={{ fontSize: active ? 22 : 20 }}>{tab.icon}</Text>
              </View>
              <Text style={[styles.tabLabel, { color: active ? C.amber : C.muted }]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 20, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: C.border,
  },
  headerIcon: {
    width: 42, height: 42, borderRadius: 12,
    backgroundColor: C.amber,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: C.amber, shadowOpacity: 0.5, shadowRadius: 8,
    elevation: 6,
  },
  headerTitle: { fontWeight: '700', fontSize: 17, color: C.text },
  headerSub: { fontSize: 11, color: C.muted },

  tabBar: {
    flexDirection: 'row',
    backgroundColor: C.surface,
    borderTopWidth: 1,
    borderTopColor: C.border,
    paddingTop: 8,
  },
  tabItem: {
    flex: 1, alignItems: 'center', gap: 3,
  },
  tabIconWrap: {
    width: 42, height: 32, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
  },
  tabIconActive: {
    backgroundColor: `${C.amber}22`,
  },
  tabLabel: {
    fontSize: 10, fontWeight: '600',
  },
});
