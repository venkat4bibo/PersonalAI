// FILE: android/app/src/main/java/com/phoneassistant/CallDetectionModule.java
//
// React Native Native Module that exposes call detection to JS layer.
// Register this in MainApplication.java:
//   packages.add(new CallDetectionPackage());

package com.phoneassistant;

import android.Manifest;
import android.content.IntentFilter;
import android.content.pm.PackageManager;
import android.telephony.TelephonyManager;

import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;

import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.modules.core.DeviceEventManagerModule;

import java.util.HashMap;
import java.util.Map;

public class CallDetectionModule extends ReactContextBaseJavaModule {
    private static final String MODULE_NAME = "CallDetectionModule";
    private final ReactApplicationContext reactContext;
    private CallReceiver callReceiver;
    private boolean isListening = false;

    public CallDetectionModule(ReactApplicationContext ctx) {
        super(ctx);
        this.reactContext = ctx;
        CallReceiver.setReactContext(ctx);
    }

    @Override
    public String getName() { return MODULE_NAME; }

    @Override
    public Map<String, Object> getConstants() {
        final Map<String, Object> constants = new HashMap<>();
        constants.put("RINGING", TelephonyManager.EXTRA_STATE_RINGING);
        constants.put("OFFHOOK", TelephonyManager.EXTRA_STATE_OFFHOOK);
        constants.put("IDLE", TelephonyManager.EXTRA_STATE_IDLE);
        return constants;
    }

    @ReactMethod
    public void startListening(Promise promise) {
        if (isListening) { promise.resolve(true); return; }

        boolean hasPermission = ContextCompat.checkSelfPermission(
            reactContext, Manifest.permission.READ_PHONE_STATE
        ) == PackageManager.PERMISSION_GRANTED;

        if (!hasPermission) {
            promise.reject("PERMISSION_DENIED", "READ_PHONE_STATE permission not granted");
            return;
        }

        try {
            callReceiver = new CallReceiver();
            IntentFilter filter = new IntentFilter();
            filter.addAction(TelephonyManager.ACTION_PHONE_STATE_CHANGED);
            reactContext.registerReceiver(callReceiver, filter);
            isListening = true;
            promise.resolve(true);
        } catch (Exception e) {
            promise.reject("START_ERROR", e.getMessage());
        }
    }

    @ReactMethod
    public void stopListening(Promise promise) {
        if (callReceiver != null && isListening) {
            try {
                reactContext.unregisterReceiver(callReceiver);
                isListening = false;
            } catch (Exception ignored) {}
        }
        promise.resolve(true);
    }

    @ReactMethod
    public void addListener(String eventName) { /* Required for RN event emitter */ }

    @ReactMethod
    public void removeListeners(Integer count) { /* Required for RN event emitter */ }
}
