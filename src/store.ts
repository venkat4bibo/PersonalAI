import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ── Types ──────────────────────────────────────────────────────────────────────
export type EventType = 'birthday' | 'anniversary';

export interface CalendarEvent {
  id: string;
  name: string;
  type: EventType;
  date: string; // ISO date string YYYY-MM-DD
  relation: string;
  phone?: string;
  notifyDaysBefore: number; // 0 = day of, 1 = 1 day before, etc.
}

export interface MeetingNote {
  id: string;
  title: string;
  transcript: string;
  aiNotes: string;
  date: string;
  durationSeconds: number;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  text: string;
  timestamp: number;
}

interface AppStore {
  events: CalendarEvent[];
  meetings: MeetingNote[];
  chatHistory: ChatMessage[];
  apiKey: string;

  setEvents: (events: CalendarEvent[]) => void;
  addEvent: (event: CalendarEvent) => void;
  removeEvent: (id: string) => void;

  addMeeting: (meeting: MeetingNote) => void;
  removeMeeting: (id: string) => void;

  addChat: (msg: ChatMessage) => void;
  clearChat: () => void;

  setApiKey: (key: string) => void;
  loadFromStorage: () => Promise<void>;
  saveToStorage: () => Promise<void>;
}

export const useStore = create<AppStore>((set, get) => ({
  events: [],
  meetings: [],
  chatHistory: [
    {
      role: 'assistant',
      text: "Hi! I'm your phone assistant. I can help you wish people on their birthdays & anniversaries, take meeting notes, and answer any questions.",
      timestamp: Date.now(),
    },
  ],
  apiKey: '',

  setEvents: (events) => { set({ events }); get().saveToStorage(); },
  addEvent: (event) => {
    set((s) => ({ events: [...s.events, event] }));
    get().saveToStorage();
  },
  removeEvent: (id) => {
    set((s) => ({ events: s.events.filter((e) => e.id !== id) }));
    get().saveToStorage();
  },

  addMeeting: (meeting) => {
    set((s) => ({ meetings: [meeting, ...s.meetings] }));
    get().saveToStorage();
  },
  removeMeeting: (id) => {
    set((s) => ({ meetings: s.meetings.filter((m) => m.id !== id) }));
    get().saveToStorage();
  },

  addChat: (msg) => {
    set((s) => ({ chatHistory: [...s.chatHistory, msg] }));
  },
  clearChat: () => {
    set({
      chatHistory: [{
        role: 'assistant',
        text: "Chat cleared. How can I help you?",
        timestamp: Date.now(),
      }],
    });
  },

  setApiKey: (key) => {
    set({ apiKey: key });
    AsyncStorage.setItem('pa_apikey', key);
  },

  loadFromStorage: async () => {
    try {
      const [eventsRaw, meetingsRaw, chatRaw, apiKey] = await Promise.all([
        AsyncStorage.getItem('pa_events'),
        AsyncStorage.getItem('pa_meetings'),
        AsyncStorage.getItem('pa_chat'),
        AsyncStorage.getItem('pa_apikey'),
      ]);
      set({
        events: eventsRaw ? JSON.parse(eventsRaw) : [],
        meetings: meetingsRaw ? JSON.parse(meetingsRaw) : [],
        chatHistory: chatRaw ? JSON.parse(chatRaw) : get().chatHistory,
        apiKey: apiKey || '',
      });
    } catch (e) {
      console.error('Storage load error:', e);
    }
  },

  saveToStorage: async () => {
    const { events, meetings, chatHistory } = get();
    try {
      await Promise.all([
        AsyncStorage.setItem('pa_events', JSON.stringify(events)),
        AsyncStorage.setItem('pa_meetings', JSON.stringify(meetings)),
        AsyncStorage.setItem('pa_chat', JSON.stringify(chatHistory.slice(-100))),
      ]);
    } catch (e) {
      console.error('Storage save error:', e);
    }
  },
}));
