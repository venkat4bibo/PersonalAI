// ─────────────────────────────────────────────────────────────────────────────
// FILE: android/app/src/main/java/com/phoneassistant/CallReceiver.java
//
// Android BroadcastReceiver that listens for phone call state changes
// and bridges them to React Native via the CallDetectionModule.
//
// Add to AndroidManifest.xml inside <application>:
//
//   <receiver android:name=".CallReceiver"
//             android:exported="true">
//     <intent-filter>
//       <action android:name="android.intent.action.PHONE_STATE"/>
//     </intent-filter>
//   </receiver>
//
// Required permissions in AndroidManifest.xml:
//   <uses-permission android:name="android.permission.READ_PHONE_STATE"/>
//   <uses-permission android:name="android.permission.READ_CALL_LOG"/>
// ─────────────────────────────────────────────────────────────────────────────

package com.phoneassistant;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.telephony.TelephonyManager;
import android.util.Log;

import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.modules.core.DeviceEventManagerModule;

public class CallReceiver extends BroadcastReceiver {
    private static final String TAG = "PhoneAssistant:Call";
    private static ReactApplicationContext reactContext;

    public static void setReactContext(ReactApplicationContext ctx) {
        reactContext = ctx;
    }

    @Override
    public void onReceive(Context context, Intent intent) {
        if (!TelephonyManager.ACTION_PHONE_STATE_CHANGED.equals(intent.getAction())) {
            return;
        }

        String state = intent.getStringExtra(TelephonyManager.EXTRA_STATE);
        String number = intent.getStringExtra(TelephonyManager.EXTRA_INCOMING_NUMBER);

        Log.d(TAG, "Call state: " + state + ", number: " + number);

        if (reactContext == null || !reactContext.hasActiveReactInstance()) return;

        com.facebook.react.bridge.WritableMap params =
            com.facebook.react.bridge.Arguments.createMap();
        params.putString("state", state != null ? state : "IDLE");
        params.putString("phoneNumber", number != null ? number : "");

        try {
            reactContext
                .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
                .emit("CallStateChanged", params);
        } catch (Exception e) {
            Log.e(TAG, "Failed to emit call event", e);
        }
    }
}
