// src/services/callDetection.ts
// Android call state detection using react-native's DeviceEventEmitter
// NOTE: Full call interception requires a native module or Telecom API.
// This service provides call state hooks + a floating overlay suggestion.
//
// For FULL call answering on Android, see the companion Java module:
//   android/app/src/main/java/com/phoneassistant/CallReceiver.java
// which uses BroadcastReceiver + TelecomManager.

import { NativeModules, NativeEventEmitter, Platform, AppState } from 'react-native';

export type CallState = 'idle' | 'ringing' | 'offhook' | 'ended';

export interface CallInfo {
  state: CallState;
  phoneNumber?: string;
  contactName?: string;
  timestamp: number;
}

type CallStateListener = (info: CallInfo) => void;
const listeners: Set<CallStateListener> = new Set();
let currentState: CallState = 'idle';

// ── Subscribe / unsubscribe ────────────────────────────────────────────────────
export function onCallStateChange(fn: CallStateListener) {
  listeners.add(fn);
  return () => listeners.off(fn);
}

function emit(info: CallInfo) {
  currentState = info.state;
  listeners.forEach((fn) => fn(info));
}

// ── Android native call receiver ───────────────────────────────────────────────
// Requires the native module (CallDetectionModule) from:
//   android/app/src/main/java/com/phoneassistant/CallDetectionModule.java
let nativeEmitter: NativeEventEmitter | null = null;
let nativeSub: any = null;

export function initCallDetection() {
  if (Platform.OS !== 'android') return;

  try {
    const { CallDetectionModule } = NativeModules;
    if (CallDetectionModule) {
      nativeEmitter = new NativeEventEmitter(CallDetectionModule);
      nativeSub = nativeEmitter.addListener('CallStateChanged', (event: any) => {
        emit({
          state: mapAndroidState(event.state),
          phoneNumber: event.phoneNumber,
          contactName: event.contactName,
          timestamp: Date.now(),
        });
      });
      CallDetectionModule.startListening();
      console.log('[CallDetection] Native module active');
    } else {
      console.warn('[CallDetection] Native module not found — using AppState fallback');
      initAppStateFallback();
    }
  } catch (e) {
    console.warn('[CallDetection] Init error:', e);
    initAppStateFallback();
  }
}

export function stopCallDetection() {
  nativeSub?.remove();
  nativeSub = null;
}

function mapAndroidState(raw: string): CallState {
  switch (raw) {
    case 'RINGING': return 'ringing';
    case 'OFFHOOK': return 'offhook';
    case 'IDLE': return currentState === 'offhook' ? 'ended' : 'idle';
    default: return 'idle';
  }
}

// ── AppState fallback (detects app-to-background transitions during calls) ────
function initAppStateFallback() {
  AppState.addEventListener('change', (nextState) => {
    if (nextState === 'background' && currentState === 'idle') {
      // Possibly went to answer a call — can't confirm without native module
      emit({ state: 'ringing', timestamp: Date.now() });
    } else if (nextState === 'active' && currentState === 'ringing') {
      emit({ state: 'ended', timestamp: Date.now() });
    }
  });
}

// ── iOS: limited call detection via CallKit (read-only) ───────────────────────
// iOS does not allow 3rd party apps to intercept calls.
// Best we can do is detect via CXCallObserver (requires native Swift module).
// The app shows a reminder banner instead.
export function getCallDetectionCapabilities() {
  return {
    canDetectIncoming: Platform.OS === 'android',
    canAutoAnswer: false, // Requires accessibility service on Android
    canShowOverlay: Platform.OS === 'android',
    platform: Platform.OS,
  };
}
