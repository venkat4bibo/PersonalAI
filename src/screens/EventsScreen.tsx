// src/screens/EventsScreen.tsx
import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  Modal, Switch, StyleSheet, Alert,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { useStore, CalendarEvent } from '../store';
import { scheduleEventNotifications, cancelEventNotifications, getUpcomingEvents } from '../services/notifications';
import { Card, SectionHeader, Input, Btn, Label, Pill, EmptyState } from '../components/UI';
import { C } from '../utils/theme';

const RELATIONS = ['Mother', 'Father', 'Sister', 'Brother', 'Spouse', 'Friend', 'Colleague', 'Other'];

export default function EventsScreen() {
  const { events, addEvent, removeEvent } = useStore();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<Partial<CalendarEvent>>({
    type: 'birthday',
    notifyDaysBefore: 1,
    relation: '',
  });
  const [saving, setSaving] = useState(false);

  const upcoming = getUpcomingEvents(events, 365);

  async function handleAdd() {
    if (!form.name?.trim() || !form.date) {
      Alert.alert('Missing info', 'Please enter a name and date.');
      return;
    }
    setSaving(true);
    const newEvent: CalendarEvent = {
      id: `${Date.now()}`,
      name: form.name.trim(),
      type: form.type || 'birthday',
      date: form.date,
      relation: form.relation || '',
      phone: form.phone || '',
      notifyDaysBefore: form.notifyDaysBefore ?? 1,
    };
    addEvent(newEvent);
    await scheduleEventNotifications(newEvent);
    setSaving(false);
    setShowForm(false);
    setForm({ type: 'birthday', notifyDaysBefore: 1, relation: '' });
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }

  async function handleRemove(event: CalendarEvent) {
    Alert.alert(
      'Remove Event',
      `Remove ${event.name}? This will cancel all reminders.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove', style: 'destructive',
          onPress: async () => {
            await cancelEventNotifications(event.id);
            removeEvent(event.id);
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          },
        },
      ]
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <SectionHeader title="Birthdays & Anniversaries" sub="Tap an event to see details" />

        {upcoming.length === 0
          ? <EmptyState emoji="🎂" message="No events yet. Add your first birthday or anniversary!" />
          : upcoming.map((e) => (
            <EventCard key={e.id} event={e} onRemove={handleRemove} />
          ))
        }

        <TouchableOpacity
          onPress={() => setShowForm(true)}
          style={{
            borderWidth: 2, borderColor: C.border, borderStyle: 'dashed',
            borderRadius: 14, padding: 16, alignItems: 'center', marginTop: 6,
          }}
        >
          <Text style={{ color: C.amber, fontWeight: '700', fontSize: 15 }}>+ Add Event</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Add Event Modal */}
      <Modal visible={showForm} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <Text style={styles.modalTitle}>New Event</Text>

            <Input label="Name" value={form.name || ''} onChangeText={(v) => setForm((p) => ({ ...p, name: v }))} placeholder="e.g. Mom, John, Wedding" />
            <Input label="Phone (optional)" value={form.phone || ''} onChangeText={(v) => setForm((p) => ({ ...p, phone: v }))} placeholder="+1 555 000 0000" />

            <Label>Type</Label>
            <View style={{ flexDirection: 'row', gap: 8, marginBottom: 12 }}>
              <Pill label="🎂 Birthday" active={form.type === 'birthday'} onPress={() => setForm((p) => ({ ...p, type: 'birthday' }))} />
              <Pill label="💍 Anniversary" active={form.type === 'anniversary'} onPress={() => setForm((p) => ({ ...p, type: 'anniversary' }))} />
            </View>

            <Input
              label="Date (YYYY-MM-DD)"
              value={form.date || ''}
              onChangeText={(v) => setForm((p) => ({ ...p, date: v }))}
              placeholder="e.g. 1990-06-15"
            />

            <Label>Relation</Label>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
              {RELATIONS.map((r) => (
                <Pill key={r} label={r} active={form.relation === r}
                  onPress={() => setForm((p) => ({ ...p, relation: r }))} color={C.teal} />
              ))}
            </ScrollView>

            <Label>Remind me</Label>
            <View style={{ flexDirection: 'row', gap: 8, marginBottom: 16 }}>
              {[0, 1, 3, 7].map((d) => (
                <Pill key={d} label={d === 0 ? 'Day of' : `${d}d before`}
                  active={form.notifyDaysBefore === d}
                  onPress={() => setForm((p) => ({ ...p, notifyDaysBefore: d }))} />
              ))}
            </View>

            <Btn label={saving ? 'Saving…' : 'Save Event'} onPress={handleAdd} loading={saving} />
            <Btn label="Cancel" onPress={() => setShowForm(false)}
              color={C.border} textColor={C.muted} style={{ marginTop: 8 }} />
          </View>
        </View>
      </Modal>
    </View>
  );
}

// ── Event Card ─────────────────────────────────────────────────────────────────
function EventCard({ event, onRemove }: { event: CalendarEvent & { daysUntil: number }; onRemove: (e: CalendarEvent) => void }) {
  const isToday = event.daysUntil === 0;
  const isSoon = event.daysUntil <= 7;

  return (
    <Card style={{
      borderLeftWidth: 3,
      borderLeftColor: isToday ? C.amber : isSoon ? C.teal : C.border,
      backgroundColor: isToday ? `${C.amber}18` : C.card,
    }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <Text style={{ fontSize: 32 }}>{event.type === 'birthday' ? '🎂' : '💍'}</Text>
        <View style={{ flex: 1 }}>
          <Text style={{ fontWeight: '700', fontSize: 15, color: C.text }}>{event.name}</Text>
          <Text style={{ color: C.muted, fontSize: 12 }}>
            {event.relation ? `${event.relation} · ` : ''}
            {new Date(event.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          </Text>
          {event.phone ? <Text style={{ color: C.muted, fontSize: 11 }}>{event.phone}</Text> : null}
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={{ fontWeight: '700', fontSize: 13, color: isToday ? C.amber : isSoon ? C.teal : C.muted }}>
            {isToday ? '🎉 Today!' : `${event.daysUntil}d`}
          </Text>
          <TouchableOpacity onPress={() => onRemove(event)} style={{ padding: 4 }}>
            <Text style={{ color: C.muted, fontSize: 18 }}>×</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1, justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  modalSheet: {
    backgroundColor: C.card, borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 24, paddingBottom: 40,
  },
  modalTitle: {
    fontSize: 18, fontWeight: '700', color: C.amber, marginBottom: 16,
  },
});
