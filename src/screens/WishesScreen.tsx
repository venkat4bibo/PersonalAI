// src/screens/WishesScreen.tsx
import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  Share, Linking, ActivityIndicator, StyleSheet,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import * as Speech from 'expo-speech';
import { useStore } from '../store';
import { generateWish } from '../services/claudeApi';
import { getUpcomingEvents } from '../services/notifications';
import { Card, SectionHeader, Label, Btn, Pill, EmptyState } from '../components/UI';
import { C } from '../utils/theme';

const TONES = ['warm', 'funny', 'heartfelt', 'formal', 'poetic'];

export default function WishesScreen() {
  const { events, apiKey } = useStore();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [tone, setTone] = useState('warm');
  const [wish, setWish] = useState('');
  const [callScript, setCallScript] = useState('');
  const [loading, setLoading] = useState(false);
  const [speaking, setSpeaking] = useState(false);

  const upcoming = getUpcomingEvents(events, 365);
  const selected = events.find((e) => e.id === selectedId);

  async function generate() {
    if (!selected) return;
    setLoading(true);
    setWish('');
    setCallScript('');
    try {
      const res = await generateWish(selected.name, selected.type, selected.relation, tone, apiKey);
      const wishMatch = res.match(/WISH:([\s\S]*?)(?:CALL_SCRIPT:|$)/i);
      const callMatch = res.match(/CALL_SCRIPT:([\s\S]*?)$/i);
      setWish(wishMatch?.[1]?.trim() || res);
      setCallScript(callMatch?.[1]?.trim() || '');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (e: any) {
      setWish('Could not generate wish. Check your API key in Settings.');
    }
    setLoading(false);
  }

  async function copyText(text: string) {
    await Clipboard.setStringAsync(text);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }

  async function shareText(text: string) {
    await Share.share({ message: text });
  }

  async function callPerson() {
    if (selected?.phone) {
      Linking.openURL(`tel:${selected.phone}`);
    }
  }

  async function speakScript() {
    if (speaking) {
      Speech.stop();
      setSpeaking(false);
      return;
    }
    setSpeaking(true);
    Speech.speak(callScript, {
      language: 'en-US',
      pitch: 1.0,
      rate: 0.9,
      onDone: () => setSpeaking(false),
      onError: () => setSpeaking(false),
    });
  }

  return (
    <ScrollView style={{ flex: 1, backgroundColor: C.bg }} contentContainerStyle={{ padding: 16 }}>
      <SectionHeader title="Wish Generator" sub="Personalized messages & call scripts" />

      {/* Person selector */}
      <Card>
        <Label>Who are you wishing?</Label>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 4 }}>
          {upcoming.map((e) => (
            <TouchableOpacity
              key={e.id}
              onPress={() => setSelectedId(e.id)}
              style={[styles.personChip, selectedId === e.id && styles.personChipActive]}
            >
              <Text style={{ fontSize: 18 }}>{e.type === 'birthday' ? '🎂' : '💍'}</Text>
              <View>
                <Text style={{ color: selectedId === e.id ? '#000' : C.text, fontWeight: '600', fontSize: 13 }}>
                  {e.name}
                </Text>
                <Text style={{ color: selectedId === e.id ? '#00000088' : C.muted, fontSize: 11 }}>
                  {e.daysUntil === 0 ? 'Today!' : `in ${e.daysUntil}d`}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {upcoming.length === 0 && (
          <Text style={{ color: C.muted, fontSize: 13, marginTop: 4 }}>
            Add events in the Events tab first.
          </Text>
        )}
      </Card>

      {/* Tone */}
      <Card>
        <Label>Tone</Label>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 4 }}>
          {TONES.map((t) => (
            <Pill key={t} label={t} active={tone === t} onPress={() => setTone(t)} color={C.teal} />
          ))}
        </View>
      </Card>

      <Btn
        label={loading ? 'Generating…' : '✨ Generate Wish & Script'}
        onPress={generate}
        loading={loading}
        disabled={!selectedId}
        style={{ marginBottom: 14 }}
      />

      {/* Wish */}
      {wish ? (
        <Card>
          <View style={styles.resultHeader}>
            <Text style={styles.resultTitle}>💌 Message</Text>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <ActionIcon label="Copy" onPress={() => copyText(wish)} />
              <ActionIcon label="Share" onPress={() => shareText(wish)} />
            </View>
          </View>
          <Text style={styles.resultText}>{wish}</Text>
        </Card>
      ) : null}

      {/* Call Script */}
      {callScript ? (
        <Card>
          <View style={styles.resultHeader}>
            <Text style={[styles.resultTitle, { color: C.teal }]}>📞 Call Script</Text>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <ActionIcon label={speaking ? '⏹' : '🔊'} onPress={speakScript} color={C.teal} />
              <ActionIcon label="Copy" onPress={() => copyText(callScript)} />
            </View>
          </View>
          <Text style={[styles.resultText, { fontStyle: 'italic' }]}>"{callScript}"</Text>

          {selected?.phone ? (
            <TouchableOpacity onPress={callPerson} style={styles.callNowBtn}>
              <Text style={{ color: '#fff', fontWeight: '700', fontSize: 14 }}>📱 Call {selected.name} Now</Text>
            </TouchableOpacity>
          ) : null}
        </Card>
      ) : null}
    </ScrollView>
  );
}

function ActionIcon({ label, onPress, color = C.amber }: { label: string; onPress: () => void; color?: string }) {
  return (
    <TouchableOpacity onPress={onPress} style={{ backgroundColor: C.border, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 }}>
      <Text style={{ color, fontSize: 12, fontWeight: '600' }}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  personChip: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: C.border, borderRadius: 12,
    paddingHorizontal: 12, paddingVertical: 8, marginRight: 8,
  },
  personChipActive: {
    backgroundColor: C.amber,
  },
  resultHeader: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 10,
  },
  resultTitle: {
    fontWeight: '700', fontSize: 14, color: C.amber,
  },
  resultText: {
    fontSize: 14, lineHeight: 22, color: C.text,
  },
  callNowBtn: {
    marginTop: 14, backgroundColor: C.green,
    borderRadius: 12, paddingVertical: 12, alignItems: 'center',
  },
});
