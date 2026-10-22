// src/screens/MeetingsScreen.tsx
import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, Alert, Animated, Easing,
} from 'react-native';
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import { useStore, MeetingNote } from '../store';
import { generateMeetingNotes, askAboutMeeting } from '../services/claudeApi';
import { Card, SectionHeader, Input, Btn, Label, EmptyState } from '../components/UI';
import { C } from '../utils/theme';

type MeetingState = 'idle' | 'recording' | 'paused' | 'done';

export default function MeetingsScreen() {
  const { meetings, addMeeting, removeMeeting, apiKey } = useStore();
  const [state, setState] = useState<MeetingState>('idle');
  const [transcript, setTranscript] = useState('');
  const [manualPoint, setManualPoint] = useState('');
  const [aiNotes, setAiNotes] = useState('');
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [loading, setLoading] = useState(false);
  const [elapsedSec, setElapsedSec] = useState(0);
  const [meetingTitle, setMeetingTitle] = useState('');

  const recordingRef = useRef<Audio.Recording | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const startTimeRef = useRef<number>(0);

  // Pulse animation for recording indicator
  useEffect(() => {
    if (state === 'recording') {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.3, duration: 600, useNativeDriver: true, easing: Easing.inOut(Easing.ease) }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 600, useNativeDriver: true, easing: Easing.inOut(Easing.ease) }),
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [state]);

  useEffect(() => () => {
    timerRef.current && clearInterval(timerRef.current);
  }, []);

  async function startRecording() {
    try {
      const { granted } = await Audio.requestPermissionsAsync();
      if (!granted) { Alert.alert('Permission needed', 'Microphone access is required to record meetings.'); return; }

      await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });

      const rec = new Audio.Recording();
      await rec.prepareToRecordAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
      await rec.startAsync();
      recordingRef.current = rec;

      startTimeRef.current = Date.now();
      setState('recording');
      setElapsedSec(0);
      timerRef.current = setInterval(() => {
        setElapsedSec(Math.floor((Date.now() - startTimeRef.current) / 1000));
      }, 1000);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch (e: any) {
      Alert.alert('Error', `Could not start recording: ${e.message}`);
    }
  }

  async function stopRecording() {
    timerRef.current && clearInterval(timerRef.current);
    if (!recordingRef.current) return;
    try {
      await recordingRef.current.stopAndUnloadAsync();
      // Note: For real transcription, send the audio URI to a speech-to-text API.
      // Whisper API (OpenAI) or Google Speech-to-Text work great here.
      // For now, we prompt the user to confirm manual notes were added.
      setState('done');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (e: any) {
      Alert.alert('Error', e.message);
    }
  }

  function addManualPoint() {
    if (!manualPoint.trim()) return;
    setTranscript((p) => p + (p ? '\n• ' : '• ') + manualPoint.trim());
    setManualPoint('');
    Haptics.selectionAsync();
  }

  async function getAINotes() {
    if (!transcript.trim()) { Alert.alert('No content', 'Add some meeting points first.'); return; }
    setLoading(true);
    try {
      const notes = await generateMeetingNotes(transcript, apiKey);
      setAiNotes(notes);
    } catch (e: any) {
      setAiNotes('Could not generate notes. Check your API key in Settings.');
    }
    setLoading(false);
  }

  async function handleAskQuestion() {
    if (!question.trim() || !transcript) return;
    setLoading(true);
    try {
      const res = await askAboutMeeting(question, transcript, apiKey);
      setAnswer(res);
    } catch { setAnswer('Could not get an answer.'); }
    setQuestion('');
    setLoading(false);
  }

  async function saveMeeting() {
    const meeting: MeetingNote = {
      id: `${Date.now()}`,
      title: meetingTitle.trim() || `Meeting ${new Date().toLocaleDateString()}`,
      transcript,
      aiNotes,
      date: new Date().toISOString(),
      durationSeconds: elapsedSec,
    };
    addMeeting(meeting);
    setState('idle');
    setTranscript('');
    setAiNotes('');
    setAnswer('');
    setMeetingTitle('');
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }

  function formatTime(sec: number) {
    const m = Math.floor(sec / 60).toString().padStart(2, '0');
    const s = (sec % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  }

  if (state === 'idle') {
    return (
      <ScrollView style={{ flex: 1, backgroundColor: C.bg }} contentContainerStyle={{ padding: 16 }}>
        <SectionHeader title="Meeting Notes" sub="Record, transcribe & summarize" />

        <Btn label="🎤 Start New Meeting" onPress={startRecording} style={{ marginBottom: 16 }} />

        {meetings.length === 0
          ? <EmptyState emoji="📋" message="No saved meetings yet. Start one above!" />
          : meetings.map((m) => <SavedMeetingCard key={m.id} meeting={m} onRemove={removeMeeting} />)
        }
      </ScrollView>
    );
  }

  return (
    <ScrollView style={{ flex: 1, backgroundColor: C.bg }} contentContainerStyle={{ padding: 16 }}>
      {/* Live header */}
      <View style={styles.liveHeader}>
        <Animated.View style={[styles.liveDot, { transform: [{ scale: state === 'recording' ? pulseAnim : 1 }] }]} />
        <Text style={{ color: C.text, fontWeight: '700', fontSize: 15 }}>
          {state === 'recording' ? 'Recording…' : 'Review & Save'}
        </Text>
        <Text style={{ color: C.amber, fontWeight: '700', marginLeft: 'auto', fontVariant: ['tabular-nums'] }}>
          {formatTime(elapsedSec)}
        </Text>
      </View>

      {/* Recording controls */}
      {state === 'recording' ? (
        <Btn label="⏹ Stop Recording" onPress={stopRecording} color={C.red} textColor="#fff" style={{ marginBottom: 12 }} />
      ) : null}

      {/* Manual notes */}
      <Card>
        <Label>Add meeting points</Label>
        <View style={{ flexDirection: 'row', gap: 8, marginTop: 4 }}>
          <Input
            value={manualPoint}
            onChangeText={setManualPoint}
            placeholder="Type a key point…"
            style={{ flex: 1, marginBottom: 0 }}
          />
          <TouchableOpacity onPress={addManualPoint} style={styles.addBtn}>
            <Text style={{ color: '#fff', fontSize: 22, fontWeight: '700' }}>+</Text>
          </TouchableOpacity>
        </View>
      </Card>

      {/* Transcript */}
      {transcript ? (
        <Card>
          <Label>Notes ({transcript.split('\n').filter(Boolean).length} points)</Label>
          <Text style={{ color: C.text, fontSize: 13, lineHeight: 22, marginTop: 4 }}>
            {transcript}
          </Text>
        </Card>
      ) : null}

      {/* AI actions */}
      {state === 'done' && (
        <>
          <Btn label={loading ? 'Generating…' : '📝 Generate AI Notes'} onPress={getAINotes} loading={loading} style={{ marginBottom: 8 }} />

          {aiNotes ? (
            <Card>
              <View style={styles.noteHeader}>
                <Text style={styles.noteTitle}>📋 AI Meeting Notes</Text>
                <TouchableOpacity onPress={() => Clipboard.setStringAsync(aiNotes)}>
                  <Text style={{ color: C.muted, fontSize: 12 }}>📋 Copy</Text>
                </TouchableOpacity>
              </View>
              <Text style={{ color: C.text, fontSize: 13, lineHeight: 22 }}>{aiNotes}</Text>
            </Card>
          ) : null}

          {/* Q&A */}
          {transcript ? (
            <Card>
              <Label>Ask about this meeting</Label>
              <View style={{ flexDirection: 'row', gap: 8, marginTop: 4 }}>
                <Input value={question} onChangeText={setQuestion}
                  placeholder="Who will follow up on…?" style={{ flex: 1, marginBottom: 0 }} />
                <TouchableOpacity onPress={handleAskQuestion} style={[styles.addBtn, { backgroundColor: C.teal }]}>
                  <Text style={{ color: '#fff', fontSize: 18 }}>→</Text>
                </TouchableOpacity>
              </View>
              {answer ? (
                <View style={styles.answerBox}>
                  <Text style={{ color: C.text, fontSize: 13, lineHeight: 20 }}>{answer}</Text>
                </View>
              ) : null}
            </Card>
          ) : null}

          {/* Save */}
          <Input label="Meeting title (optional)" value={meetingTitle} onChangeText={setMeetingTitle} placeholder="e.g. Product sync, Client call…" />
          <Btn label="💾 Save Meeting" onPress={saveMeeting} color={C.green} textColor="#fff" />
          <Btn label="Discard" onPress={() => setState('idle')} color={C.border} textColor={C.muted} style={{ marginTop: 8 }} />
        </>
      )}
    </ScrollView>
  );
}

function SavedMeetingCard({ meeting, onRemove }: { meeting: MeetingNote; onRemove: (id: string) => void }) {
  const [open, setOpen] = useState(false);
  return (
    <Card>
      <TouchableOpacity onPress={() => setOpen((p) => !p)} style={styles.meetingRow}>
        <View style={{ flex: 1 }}>
          <Text style={{ fontWeight: '700', color: C.text, fontSize: 14 }}>{meeting.title}</Text>
          <Text style={{ color: C.muted, fontSize: 12 }}>
            {new Date(meeting.date).toLocaleDateString()} · {Math.ceil(meeting.durationSeconds / 60)} min
          </Text>
        </View>
        <Text style={{ color: C.muted }}>{open ? '▲' : '▼'}</Text>
      </TouchableOpacity>
      {open && (
        <View style={{ marginTop: 10 }}>
          {meeting.aiNotes ? (
            <Text style={{ color: C.text, fontSize: 13, lineHeight: 20 }}>{meeting.aiNotes}</Text>
          ) : meeting.transcript ? (
            <Text style={{ color: C.muted, fontSize: 13 }}>{meeting.transcript}</Text>
          ) : null}
          <View style={{ flexDirection: 'row', gap: 8, marginTop: 10 }}>
            <TouchableOpacity onPress={() => Clipboard.setStringAsync(meeting.aiNotes || meeting.transcript)} style={styles.smallBtn}>
              <Text style={{ color: C.muted, fontSize: 12 }}>📋 Copy</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => Alert.alert('Delete', 'Remove this meeting?', [
              { text: 'Cancel' }, { text: 'Delete', style: 'destructive', onPress: () => onRemove(meeting.id) },
            ])} style={[styles.smallBtn, { borderColor: C.red }]}>
              <Text style={{ color: C.red, fontSize: 12 }}>🗑 Delete</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  liveHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    marginBottom: 14, padding: 14,
    backgroundColor: C.card, borderRadius: 14,
  },
  liveDot: {
    width: 12, height: 12, borderRadius: 6, backgroundColor: C.red,
    shadowColor: C.red, shadowOpacity: 0.8, shadowRadius: 6,
  },
  addBtn: {
    width: 46, height: 46, borderRadius: 12,
    backgroundColor: C.amber, alignItems: 'center', justifyContent: 'center',
  },
  noteHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  noteTitle: { fontWeight: '700', fontSize: 14, color: C.amber },
  answerBox: { marginTop: 10, backgroundColor: C.border, borderRadius: 10, padding: 12 },
  meetingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  smallBtn: { borderWidth: 1, borderColor: C.border, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5 },
});
