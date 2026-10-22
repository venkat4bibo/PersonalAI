// src/services/notifications.ts
// Handles scheduling local push notifications for birthdays & anniversaries
// Works on both iOS and Android via expo-notifications

import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { CalendarEvent } from '../store';

// Configure how notifications appear when app is in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

// ── Permission ─────────────────────────────────────────────────────────────────
export async function requestNotificationPermission(): Promise<boolean> {
  const { status: existing } = await Notifications.getPermissionsAsync();
  if (existing === 'granted') return true;

  const { status } = await Notifications.requestPermissionsAsync();
  if (status !== 'granted') return false;

  // Android 8+ requires a channel
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('birthday-reminders', {
      name: 'Birthday & Anniversary Reminders',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      sound: 'default',
      lightColor: '#F5A623',
    });
    await Notifications.setNotificationChannelAsync('meeting-assistant', {
      name: 'Meeting Assistant',
      importance: Notifications.AndroidImportance.DEFAULT,
      sound: 'default',
    });
  }

  return true;
}

// ── Schedule notifications for a single event ──────────────────────────────────
export async function scheduleEventNotifications(event: CalendarEvent) {
  // Cancel any existing notifications for this event first
  await cancelEventNotifications(event.id);

  const eventDate = new Date(event.date);
  const today = new Date();

  // Schedule for the next N years (so it repeats annually)
  for (let yearOffset = 0; yearOffset <= 2; yearOffset++) {
    const triggerYear = today.getFullYear() + yearOffset;
    const notifyDate = new Date(
      triggerYear,
      eventDate.getMonth(),
      eventDate.getDate() - event.notifyDaysBefore,
      9, // 9 AM
      0
    );

    if (notifyDate <= today) continue;

    const isToday = event.notifyDaysBefore === 0;
    const emoji = event.type === 'birthday' ? '🎂' : '💍';
    const typeLabel = event.type === 'birthday' ? 'Birthday' : 'Anniversary';

    const title = isToday
      ? `${emoji} ${event.name}'s ${typeLabel} is TODAY!`
      : `${emoji} Reminder: ${event.name}'s ${typeLabel} in ${event.notifyDaysBefore} day${event.notifyDaysBefore > 1 ? 's' : ''}`;

    const body = isToday
      ? `Don't forget to wish ${event.name}! Open the app for a personalized message & call script.`
      : `Prepare your wish for ${event.name}. Open Phone Assistant to generate a heartfelt message.`;

    await Notifications.scheduleNotificationAsync({
      identifier: `${event.id}-${yearOffset}-${event.notifyDaysBefore}`,
      content: {
        title,
        body,
        data: { eventId: event.id, screen: 'wishes' },
        sound: 'default',
        ...(Platform.OS === 'android' ? { channelId: 'birthday-reminders' } : {}),
      },
      trigger: {
        date: notifyDate,
      },
    });

    // Also schedule a day-of notification if notify is set to days before
    if (event.notifyDaysBefore > 0) {
      const dayOfDate = new Date(triggerYear, eventDate.getMonth(), eventDate.getDate(), 9, 0);
      if (dayOfDate > today) {
        await Notifications.scheduleNotificationAsync({
          identifier: `${event.id}-${yearOffset}-dayof`,
          content: {
            title: `${emoji} TODAY: ${event.name}'s ${typeLabel}!`,
            body: `Open Phone Assistant for your personalized wish & call script.`,
            data: { eventId: event.id, screen: 'wishes' },
            sound: 'default',
            ...(Platform.OS === 'android' ? { channelId: 'birthday-reminders' } : {}),
          },
          trigger: { date: dayOfDate },
        });
      }
    }
  }
}

// ── Cancel notifications for a removed event ───────────────────────────────────
export async function cancelEventNotifications(eventId: string) {
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  const toCancel = scheduled
    .filter((n) => n.identifier.startsWith(eventId))
    .map((n) => n.identifier);

  await Promise.all(toCancel.map((id) => Notifications.cancelScheduledNotificationAsync(id)));
}

// ── Schedule all events (call on app startup) ──────────────────────────────────
export async function scheduleAllEvents(events: CalendarEvent[]) {
  const hasPermission = await requestNotificationPermission();
  if (!hasPermission) return;

  for (const event of events) {
    await scheduleEventNotifications(event);
  }
}

// ── Get upcoming events in next N days ────────────────────────────────────────
export function getUpcomingEvents(events: CalendarEvent[], withinDays = 30) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return events
    .map((event) => {
      const d = new Date(event.date);
      const thisYear = new Date(today.getFullYear(), d.getMonth(), d.getDate());
      const nextYear = new Date(today.getFullYear() + 1, d.getMonth(), d.getDate());
      const next = thisYear >= today ? thisYear : nextYear;
      const daysUntil = Math.round((next.getTime() - today.getTime()) / 86400000);
      return { ...event, daysUntil, nextDate: next };
    })
    .filter((e) => e.daysUntil <= withinDays)
    .sort((a, b) => a.daysUntil - b.daysUntil);
}

// ── Listen for notification taps ──────────────────────────────────────────────
export function addNotificationResponseListener(
  callback: (screen: string, eventId: string) => void
) {
  return Notifications.addNotificationResponseReceivedListener((response) => {
    const data = response.notification.request.content.data;
    if (data?.screen && data?.eventId) {
      callback(data.screen as string, data.eventId as string);
    }
  });
}
