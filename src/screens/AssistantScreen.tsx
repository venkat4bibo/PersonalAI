// src/screens/AssistantScreen.tsx
import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, ScrollView, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform, StyleSheet, ActivityIndicator,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import * as Speech from 'expo-speech';
import { useStore, ChatMessage } from '../store';
import { chatWithAssistant } from '../services/claudeApi';
import { C } from '../utils/theme';

const QUICK_PROMPTS = [
  "Draft a quick apology message",
  "Help me reschedule politely",
  "Summarize my last meeting",
  "3 conversation starters",
  "Write a thank you note",
  "How to decline a meeting",
];

export default function AssistantScreen() {
  const { chatHistory, meetings, addChat, clearChat, apiKey } = useStore();
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
  }, [chatHistory]);

  const meetingContext = meetings
    .slice(0, 2)
    .map((m) => m.aiNotes || m.transcript)
    .filter(Boolean)
    .join(' | ');

  async function send(text?: string) {
    const msg = (text || input).trim();
    if (!msg || loading) return;
    setInput('');

    const userMsg: ChatMessage = { role: 'user', text: msg, timestamp: Date.now() };
    addChat(userMsg);
    setLoading(true);
    Haptics.selectionAsync();

    try {
      const history = chatHistory.slice(-10).map((m) => ({
        role: m.role,
        content: m.text,
      }));
      const res = await chatWithAssistant(msg, history, meetingContext, apiKey);
      addChat({ role: 'assistant', text: res, timestamp: Date.now() });
    } catch {
      addChat({ role: 'assistant', text: 'Sorry, I encountered an error. Please check your API key in Settings.', timestamp: Date.now() });
    }
    setLoading(false);
  }

  function speakMessage(text: string) {
    Speech.speak(text, { language: 'en-US', rate: 0.9 });
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: C.bg }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={90}
    >
      {/* Quick prompts */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ padding: 12, gap: 6 }}
        style={{ maxHeight: 50, borderBottomWidth: 1, borderBottomColor: C.border }}>
        {QUICK_PROMPTS.map((q) => (
          <TouchableOpacity key={q} onPress={() => send(q)} style={styles.quickChip}>
            <Text style={{ color: C.muted, fontSize: 12 }}>{q}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Messages */}
      <ScrollView ref={scrollRef} style={{ flex: 1 }} contentContainerStyle={{ padding: 16, gap: 10 }}>
        {chatHistory.map((msg, i) => (
          <ChatBubble key={i} msg={msg} onSpeak={() => speakMessage(msg.text)} />
        ))}
        {loading && (
          <View style={[styles.bubble, styles.assistantBubble, { width: 70 }]}>
            <ActivityIndicator color={C.muted} size="small" />
          </View>
        )}
      </ScrollView>

      {/* Clear chat */}
      <TouchableOpacity onPress={clearChat} style={styles.clearBtn}>
        <Text style={{ color: C.muted, fontSize: 11 }}>Clear chat</Text>
      </TouchableOpacity>

      {/* Input bar */}
      <View style={[styles.inputBar, { paddingBottom: Platform.OS === 'ios' ? 20 : 12 }]}>
        <TextInput
          value={input}
          onChangeText={setInput}
          placeholder="Ask me anything…"
          placeholderTextColor={C.muted}
          style={styles.textInput}
          multiline
          onSubmitEditing={() => send()}
          returnKeyType="send"
        />
        <TouchableOpacity
          onPress={() => send()}
          disabled={!input.trim() || loading}
          style={[styles.sendBtn, { backgroundColor: input.trim() ? C.amber : C.border }]}
        >
          <Text style={{ color: input.trim() ? '#000' : C.muted, fontSize: 18, fontWeight: '700' }}>↑</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

function ChatBubble({ msg, onSpeak }: { msg: ChatMessage; onSpeak: () => void }) {
  const isUser = msg.role === 'user';
  return (
    <View style={[styles.bubbleRow, isUser && { justifyContent: 'flex-end' }]}>
      <TouchableOpacity onLongPress={onSpeak} activeOpacity={0.8}
        style={[styles.bubble, isUser ? styles.userBubble : styles.assistantBubble]}>
        <Text style={{ color: isUser ? '#000' : C.text, fontSize: 14, lineHeight: 21 }}>
          {msg.text}
        </Text>
        <Text style={{ color: isUser ? '#0008' : C.muted, fontSize: 10, marginTop: 4, textAlign: 'right' }}>
          {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  quickChip: {
    backgroundColor: C.card, borderRadius: 16,
    paddingHorizontal: 12, paddingVertical: 6,
    borderWidth: 1, borderColor: C.border,
  },
  bubbleRow: { flexDirection: 'row', marginBottom: 4 },
  bubble: { maxWidth: '85%', borderRadius: 18, padding: 12 },
  userBubble: { backgroundColor: C.amber, borderBottomRightRadius: 4 },
  assistantBubble: { backgroundColor: C.card, borderBottomLeftRadius: 4 },
  inputBar: {
    flexDirection: 'row', alignItems: 'flex-end', gap: 8,
    padding: 12, borderTopWidth: 1, borderTopColor: C.border,
    backgroundColor: C.bg,
  },
  textInput: {
    flex: 1, backgroundColor: C.surface, borderWidth: 1, borderColor: C.border,
    borderRadius: 20, paddingHorizontal: 16, paddingVertical: 10,
    color: C.text, fontSize: 14, maxHeight: 100,
  },
  sendBtn: {
    width: 44, height: 44, borderRadius: 22,
    alignItems: 'center', justifyContent: 'center',
  },
  clearBtn: {
    alignSelf: 'center', paddingVertical: 4, paddingHorizontal: 12,
  },
});
