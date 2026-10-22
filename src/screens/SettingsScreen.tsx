// src/screens/SettingsScreen.tsx
import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  TextInput, StyleSheet, Alert, Linking, Switch, Platform,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { useStore } from '../store';
import { requestNotificationPermission, scheduleAllEvents } from '../services/notifications';
import { getCallDetectionCapabilities } from '../services/callDetection';
import { Card, SectionHeader, Label, Btn } from '../components/UI';
import { C } from '../utils/theme';

export default function SettingsScreen() {
  const { apiKey, setApiKey, events, meetings, setEvents } = useStore();
  const [keyInput, setKeyInput] = useState(apiKey);
  const [showKey, setShowKey] = useState(false);
  const [notifEnabled, setNotifEnabled] = useState(false);
  const caps = getCallDetectionCapabilities();

  async function saveKey() {
    setApiKey(keyInput.trim());
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Alert.alert('Saved', 'Your API key has been saved securely on your device.');
  }

  async function enableNotifications() {
    const granted = await requestNotificationPermission();
    if (granted) {
      await scheduleAllEvents(events);
      setNotifEnabled(true);
      Alert.alert('✅ Notifications enabled', `Reminders scheduled for ${events.length} events.`);
    } else {
      Alert.alert('Permission denied', 'Please enable notifications in your device settings.', [
        { text: 'Open Settings', onPress: () => Linking.openSettings() },
        { text: 'Cancel', style: 'cancel' },
      ]);
    }
  }

  function clearAllData() {
    Alert.alert('Clear All Data', 'This will delete all events, meetings, and chat history. Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Clear All', style: 'destructive',
        onPress: () => {
          setEvents([]);
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        },
      },
    ]);
  }

  return (
    <ScrollView style={{ flex: 1, backgroundColor: C.bg }} contentContainerStyle={{ padding: 16 }}>
      <SectionHeader title="Settings" sub="Configure your assistant" />

      {/* API Key */}
      <Card>
        <Text style={styles.sectionLabel}>🔑 Anthropic API Key</Text>
        <Text style={{ color: C.muted, fontSize: 12, marginBottom: 10 }}>
          Required for AI features. Get yours free at console.anthropic.com
        </Text>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <TextInput
            value={keyInput}
            onChangeText={setKeyInput}
            placeholder="sk-ant-..."
            placeholderTextColor={C.muted}
            secureTextEntry={!showKey}
            autoCapitalize="none"
            autoCorrect={false}
            style={[styles.keyInput, { flex: 1 }]}
          />
          <TouchableOpacity onPress={() => setShowKey((p) => !p)} style={styles.eyeBtn}>
            <Text style={{ fontSize: 18 }}>{showKey ? '🙈' : '👁'}</Text>
          </TouchableOpacity>
        </View>
        <Btn label="Save API Key" onPress={saveKey} style={{ marginTop: 12 }} />
        <TouchableOpacity onPress={() => Linking.openURL('https://console.anthropic.com')}>
          <Text style={{ color: C.teal, fontSize: 12, marginTop: 8, textDecorationLine: 'underline' }}>
            Get a free API key →
          </Text>
        </TouchableOpacity>
      </Card>

      {/* Notifications */}
      <Card>
        <Text style={styles.sectionLabel}>🔔 Notifications</Text>
        <Text style={{ color: C.muted, fontSize: 12, marginBottom: 12 }}>
          Get reminded before birthdays and anniversaries
        </Text>
        <View style={styles.row}>
          <Text style={{ color: C.text, fontSize: 14 }}>Birthday & Anniversary Reminders</Text>
          <Switch
            value={notifEnabled}
            onValueChange={(val) => val ? enableNotifications() : setNotifEnabled(false)}
            trackColor={{ true: C.amber, false: C.border }}
            thumbColor={notifEnabled ? '#fff' : C.muted}
          />
        </View>
        <Text style={{ color: C.muted, fontSize: 11, marginTop: 6 }}>
          {events.length} events tracked · {events.filter((e) => e.notifyDaysBefore > 0).length} with advance reminders
        </Text>
      </Card>

      {/* Call Detection */}
      <Card>
        <Text style={styles.sectionLabel}>📞 Call Detection</Text>
        <View style={styles.capRow}>
          <Text style={{ color: C.muted, fontSize: 13 }}>Platform</Text>
          <Text style={{ color: C.text, fontSize: 13, fontWeight: '600' }}>
            {caps.platform === 'android' ? '🤖 Android' : '🍎 iOS'}
          </Text>
        </View>
        <View style={styles.capRow}>
          <Text style={{ color: C.muted, fontSize: 13 }}>Detect incoming calls</Text>
          <Text style={{ color: caps.canDetectIncoming ? C.green : C.red, fontSize: 13, fontWeight: '600' }}>
            {caps.canDetectIncoming ? '✅ Yes' : '❌ Requires native module'}
          </Text>
        </View>
        <View style={styles.capRow}>
          <Text style={{ color: C.muted, fontSize: 13 }}>Auto-answer calls</Text>
          <Text style={{ color: C.red, fontSize: 13, fontWeight: '600' }}>
            ❌ Not possible (OS restriction)
          </Text>
        </View>
        {Platform.OS === 'android' && (
          <View style={{ marginTop: 10, backgroundColor: `${C.amber}18`, borderRadius: 10, padding: 10 }}>
            <Text style={{ color: C.amber, fontSize: 12, lineHeight: 18 }}>
              💡 To enable call detection, the CallReceiver.java native module must be compiled into your APK.
              See the android/ folder in the project for setup instructions.
            </Text>
          </View>
        )}
        {Platform.OS === 'ios' && (
          <View style={{ marginTop: 10, backgroundColor: `${C.muted}18`, borderRadius: 10, padding: 10 }}>
            <Text style={{ color: C.muted, fontSize: 12, lineHeight: 18 }}>
              ℹ️ iOS does not allow third-party apps to intercept or detect phone calls for privacy reasons.
              Notifications are the best way to get reminded on iOS.
            </Text>
          </View>
        )}
      </Card>

      {/* Stats */}
      <Card>
        <Text style={styles.sectionLabel}>📊 Your Data</Text>
        {[
          ['Events tracked', events.length],
          ['Meetings saved', meetings.length],
          ['Storage', 'On-device only'],
        ].map(([label, val]) => (
          <View key={String(label)} style={styles.capRow}>
            <Text style={{ color: C.muted, fontSize: 13 }}>{label}</Text>
            <Text style={{ color: C.text, fontSize: 13, fontWeight: '600' }}>{String(val)}</Text>
          </View>
        ))}
      </Card>

      {/* About */}
      <Card>
        <Text style={styles.sectionLabel}>ℹ️ About</Text>
        <Text style={{ color: C.muted, fontSize: 13, lineHeight: 20 }}>
          Phone Assistant uses Claude AI (claude-sonnet-4-6) to generate wishes,
          summarize meetings, and answer your questions.{'\n\n'}
          Your API key and all data are stored only on your device.
          Nothing is sent to any server except the Anthropic API when you use AI features.
        </Text>
        <TouchableOpacity onPress={() => Linking.openURL('https://anthropic.com/privacy')}>
          <Text style={{ color: C.teal, fontSize: 12, marginTop: 8, textDecorationLine: 'underline' }}>
            Anthropic Privacy Policy →
          </Text>
        </TouchableOpacity>
      </Card>

      <Btn label="🗑 Clear All Data" onPress={clearAllData} color={`${C.red}22`}
        textColor={C.red} style={{ marginTop: 4, marginBottom: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  sectionLabel: { fontWeight: '700', fontSize: 15, color: C.text, marginBottom: 10 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  capRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 5 },
  keyInput: {
    backgroundColor: C.surface, borderWidth: 1, borderColor: C.border,
    borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10,
    color: C.text, fontSize: 13, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  eyeBtn: {
    width: 46, height: 46, backgroundColor: C.border,
    borderRadius: 10, alignItems: 'center', justifyContent: 'center',
  },
});
