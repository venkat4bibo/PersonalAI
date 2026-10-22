# 📱 Phone Assistant — React Native App

A personal AI phone assistant built with Expo + React Native.
Powered by Claude AI (claude-sonnet-4-6).

---

## ✨ Features

| Feature | Android | iOS |
|---|---|---|
| Birthday & Anniversary reminders | ✅ | ✅ |
| Push notifications | ✅ | ✅ |
| AI wish generator + call scripts | ✅ | ✅ |
| Meeting recording | ✅ | ✅ |
| AI meeting notes & Q&A | ✅ | ✅ |
| AI chat assistant | ✅ | ✅ |
| Incoming call detection | ✅ (native module) | ❌ (OS restriction) |
| Auto-answer calls | ❌ (OS restriction) | ❌ (OS restriction) |

---

## 🚀 Quick Start (Run on Your Phone)

### Prerequisites
- Node.js 18+ installed on your computer
- [Expo Go](https://expo.dev/go) app installed on your phone
- An [Anthropic API key](https://console.anthropic.com) (free tier available)

### Step 1 — Install dependencies
```bash
cd PhoneAssistant
npm install
```

### Step 2 — Start the development server
```bash
npx expo start
```

### Step 3 — Open on your phone
1. Open the **Expo Go** app on your Android or iPhone
2. Scan the QR code shown in your terminal
3. The app loads on your phone instantly!

### Step 4 — Add your API key
1. Tap the ⚙️ Settings tab in the app
2. Enter your Anthropic API key (`sk-ant-...`)
3. Tap **Save API Key**

That's it! All AI features now work.

---

## 📦 Build a Standalone APK (Android — No Computer Needed to Run)

To build an APK you can install directly on any Android phone:

### Option A — EAS Build (Recommended, cloud-based, free)
```bash
# Install EAS CLI
npm install -g eas-cli

# Login to Expo account (free at expo.dev)
eas login

# Build APK for Android
eas build --platform android --profile preview
```
EAS builds in the cloud (~10-15 min). You get a download link for the APK.
Share it with anyone — they can install it directly (enable "Install from unknown sources" in Android settings).

### Option B — Local build (requires Android Studio)
```bash
# Generate native Android project
npx expo prebuild --platform android

# Build APK locally
cd android
./gradlew assembleRelease

# APK is at:
# android/app/build/outputs/apk/release/app-release.apk
```

---

## 🍎 Build for iOS

iOS requires an Apple Developer account ($99/year) to install on real devices.

```bash
# Build for iOS (requires macOS + Xcode)
eas build --platform ios --profile preview

# Or run in iOS Simulator (macOS only)
npx expo run:ios
```

---

## 📞 Enabling Android Call Detection (Advanced)

The app includes a native Android module for detecting incoming calls.
To activate it:

### Step 1 — Prebuild the native project
```bash
npx expo prebuild --platform android
```

### Step 2 — Add the native module files
Copy these files to your Android project:
```
android/CallReceiver.java        → android/app/src/main/java/com/phoneassistant/
android/CallDetectionModule.java → android/app/src/main/java/com/phoneassistant/
```

### Step 3 — Register in AndroidManifest.xml
Add inside `<application>`:
```xml
<receiver android:name=".CallReceiver" android:exported="true">
  <intent-filter>
    <action android:name="android.intent.action.PHONE_STATE"/>
  </intent-filter>
</receiver>
```

Add permissions:
```xml
<uses-permission android:name="android.permission.READ_PHONE_STATE"/>
<uses-permission android:name="android.permission.READ_CALL_LOG"/>
```

### Step 4 — Register the module in MainApplication.java
```java
// In getPackages():
packages.add(new CallDetectionPackage());
```

### Step 5 — Rebuild
```bash
cd android && ./gradlew assembleDebug
```

The app will now show a notification when a contact calls, with a
quick link to their wish/script if it's their birthday! 🎉

---

## 📁 Project Structure

```
PhoneAssistant/
├── App.tsx                          # Main entry, tab navigation
├── app.json                         # Expo config + permissions
├── eas.json                         # Build profiles (APK/IPA)
├── babel.config.js
├── package.json
│
├── src/
│   ├── store.ts                     # Global state (Zustand)
│   ├── utils/theme.ts               # Colors & shared styles
│   ├── components/UI.tsx            # Reusable components
│   │
│   ├── services/
│   │   ├── claudeApi.ts             # All Claude API calls
│   │   ├── notifications.ts         # Push notification scheduling
│   │   └── callDetection.ts         # Android call state listener
│   │
│   └── screens/
│       ├── EventsScreen.tsx         # Birthday/anniversary manager
│       ├── WishesScreen.tsx         # AI wish + call script generator
│       ├── MeetingsScreen.tsx       # Meeting recorder + AI notes
│       ├── AssistantScreen.tsx      # AI chat
│       └── SettingsScreen.tsx       # API key, notifications, info
│
└── android/
    ├── CallReceiver.java            # Native BroadcastReceiver
    └── CallDetectionModule.java     # RN native module bridge
```

---

## 🔒 Privacy

- Your API key is stored **only on your device** using AsyncStorage
- No data is sent to any server except the Anthropic API (only when you use AI features)
- Audio recordings are processed locally; only the text transcript is sent to Claude
- All events, meetings and chat history stay on your device

---

## 💡 Tips

- **Long-press** any AI message in the chat to have it read aloud
- **Add a phone number** to events to get a "Call Now" button in Wishes
- **Set advance reminders** (1 day, 3 days, 1 week) per event in the Events form
- Meeting notes can be **shared or copied** to paste into email/Slack

---

## 🛠 Troubleshooting

| Problem | Fix |
|---|---|
| "Could not generate wish" | Check API key in Settings tab |
| Notifications not arriving | Go to Settings → tap "Enable Notifications" |
| Mic not working on Android | Grant microphone permission in Android Settings → Apps → Phone Assistant |
| QR code not scanning | Make sure phone and computer are on the same WiFi |
| Build fails | Run `npx expo doctor` to check for issues |
