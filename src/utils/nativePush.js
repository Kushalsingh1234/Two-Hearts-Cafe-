import { Capacitor } from "@capacitor/core";
import { PushNotifications } from "@capacitor/push-notifications";
import { LocalNotifications } from "@capacitor/local-notifications";
import { doc, setDoc } from "firebase/firestore";
import { db } from "../firebase/config";
import { soundNotifier } from "./audio";

let isInitialized = false;

/**
 * Check if the app is currently running as a native Android/iOS Capacitor app
 */
export const isNativeApp = () => {
  return typeof window !== "undefined" && Capacitor.isNativePlatform();
};

/**
 * Initialize Native Android Push Notifications & FCM Device Token Registration
 */
export const initNativePush = async () => {
  if (!isNativeApp()) {
    return null;
  }

  if (isInitialized) {
    return;
  }
  isInitialized = true;

  try {
    // 1. Create native local notification channel with custom sound as backup
    await LocalNotifications.createChannel({
      id: "orders_channel_v2",
      name: "Two Hearts Cafe Order Alerts",
      description: "High priority chime alerts for new kitchen orders",
      importance: 5, // MAX importance
      sound: "ting.wav",
      vibration: true,
      visibility: 1
    }).catch((e) => console.warn("[Native] Local channel creation:", e));

    // 2. Request Push Notification permissions
    let permStatus = await PushNotifications.checkPermissions();
    if (permStatus.receive === "prompt") {
      permStatus = await PushNotifications.requestPermissions();
    }

    if (permStatus.receive !== "granted") {
      console.warn("[Native] Push notification permission not granted:", permStatus.receive);
      return false;
    }

    // 3. Register with Google FCM
    await PushNotifications.register();

    // 4. Handle successful registration and store token in Firestore
    PushNotifications.addListener("registration", async (token) => {
      console.log("[Native FCM] Device registered successfully! Token:", token.value);
      try {
        localStorage.setItem("twohearts_native_fcm_token", token.value);
        const tokenDocRef = doc(db, "admin_device_tokens", token.value);
        await setDoc(
          tokenDocRef,
          {
            token: token.value,
            platform: Capacitor.getPlatform(),
            device: navigator.userAgent,
            updatedAt: new Date().toISOString(),
            status: "active",
            app: "Two Hearts Cafe Admin"
          },
          { merge: true }
        );
        console.log("[Native FCM] Token saved to Firestore admin_device_tokens collection.");
      } catch (err) {
        console.warn("[Native FCM] Could not save token to Firestore:", err);
      }
    });

    PushNotifications.addListener("registrationError", (error) => {
      console.error("[Native FCM] Registration error:", error);
    });

    // 5. Handle notification received in foreground
    PushNotifications.addListener("pushNotificationReceived", (notification) => {
      console.log("[Native FCM] Foreground push received:", notification);
      soundNotifier.playChime();
    });

    // 6. Handle notification click
    PushNotifications.addListener("pushNotificationActionPerformed", (action) => {
      console.log("[Native FCM] Notification action clicked:", action);
      const url = action.notification.data?.url || "/?admin=true&tab=orders";
      if (window.location.search !== "?admin=true") {
        window.history.pushState({}, "", url);
        window.dispatchEvent(new Event("popstate"));
      }
    });

    return true;
  } catch (err) {
    console.error("[Native FCM] Initialization failed:", err);
    return false;
  }
};
