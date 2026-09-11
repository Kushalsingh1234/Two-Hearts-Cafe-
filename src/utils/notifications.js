// Two Hearts Cafe - Background Order Notification & PWA Manager
import { soundNotifier } from "./audio";

let swRegistration = null;
let deferredInstallPrompt = null;
const installListeners = new Set();

/**
 * Register Service Worker for PWA and background notifications
 */
export const registerServiceWorker = async () => {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
    return null;
  }

  try {
    swRegistration = await navigator.serviceWorker.register("/sw.js", { scope: "/" });
    console.log("[PWA] Service Worker registered successfully with scope:", swRegistration.scope);

    // If waiting service worker exists, prompt skipWaiting
    if (swRegistration.waiting) {
      swRegistration.waiting.postMessage({ type: "SKIP_WAITING" });
    }

    return swRegistration;
  } catch (error) {
    console.warn("[PWA] Service Worker registration failed:", error);
    return null;
  }
};

/**
 * Capture PWA beforeinstallprompt event for custom install button
 */
if (typeof window !== "undefined") {
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    deferredInstallPrompt = e;
    installListeners.forEach((listener) => listener(true));
  });

  window.addEventListener("appinstalled", () => {
    deferredInstallPrompt = null;
    installListeners.forEach((listener) => listener(false));
    console.log("[PWA] Two Hearts Cafe was installed successfully!");
  });
}

export const subscribeInstallPrompt = (callback) => {
  installListeners.add(callback);
  callback(Boolean(deferredInstallPrompt));
  return () => installListeners.delete(callback);
};

export const promptPwaInstall = async () => {
  if (!deferredInstallPrompt) {
    return false;
  }
  deferredInstallPrompt.prompt();
  const choice = await deferredInstallPrompt.userChoice;
  deferredInstallPrompt = null;
  installListeners.forEach((listener) => listener(false));
  return choice.outcome === "accepted";
};

/**
 * Request system notification permissions & test sound
 */
export const requestNotificationPermission = async () => {
  if (typeof window === "undefined" || !("Notification" in window)) {
    return "unsupported";
  }

  try {
    // 1. Unlock audio chime on user interaction
    soundNotifier.initContext();
    const permission = await Notification.requestPermission();

    if (permission === "granted") {
      // Play confirmation chime
      soundNotifier.playChime();
    }

    return permission;
  } catch (err) {
    console.warn("Notification permission error:", err);
    return "denied";
  }
};

/**
 * Check current notification permission
 */
export const getNotificationPermission = () => {
  if (typeof window === "undefined" || !("Notification" in window)) {
    return "unsupported";
  }
  return Notification.permission; // 'default' | 'granted' | 'denied'
};

/**
 * Trigger Rich Order Notification (with Ting Chime, Vibration & System Banner)
 */
export const triggerOrderNotification = async (order) => {
  // 1. Instantly play the signature cafe Ting! bell chime & vibrate
  soundNotifier.playChime();

  if (typeof window === "undefined") return;

  const tableText = order.tableNumber ? `Table ${order.tableNumber}` : "Online Order";
  const itemsCount = (order.items || []).reduce((acc, it) => acc + (it.quantity || 1), 0);
  const itemsPreview = (order.items || [])
    .slice(0, 3)
    .map((it) => `${it.name} (×${it.quantity || 1})`)
    .join(", ");
  const moreText = (order.items || []).length > 3 ? ` +${(order.items || []).length - 3} more` : "";

  const title = `🔔 New Order Received! (${tableText})`;
  const body = `₹${order.total || 0} • ${itemsCount} items (${itemsPreview}${moreText})`;

  // 2. Try Service Worker showNotification (works in background & mobile)
  try {
    if (!swRegistration && "serviceWorker" in navigator) {
      swRegistration = await navigator.serviceWorker.ready;
    }

    if (swRegistration && "showNotification" in swRegistration && Notification.permission === "granted") {
      await swRegistration.showNotification(title, {
        body,
        icon: "/images/pwa/icon-192.png",
        badge: "/images/pwa/badge-72.png",
        sound: "/audio/ting.mp3",
        vibrate: [300, 100, 300, 100, 500],
        tag: `order-${order.id || Date.now()}`,
        renotify: true,
        requireInteraction: true,
        data: {
          url: "/?admin=true",
          orderId: order.id
        }
      });
      return;
    }
  } catch (e) {
    console.warn("SW showNotification fallback:", e);
  }

  // 3. Fallback: Standard window Notification
  if ("Notification" in window && Notification.permission === "granted") {
    try {
      const notif = new Notification(title, {
        body,
        icon: "/images/pwa/icon-192.png",
        badge: "/images/pwa/badge-72.png",
        tag: `order-${order.id || Date.now()}`,
        renotify: true
      });
      notif.onclick = () => {
        window.focus();
        notif.close();
      };
    } catch (err) {
      console.warn("Window notification fallback error:", err);
    }
  }
};

/**
 * Trigger Payment Notification for Admin Panel
 * Plays bright payment chime, vibrates, and triggers system push notification
 */
export const triggerPaymentNotification = async (order) => {
  // 1. Play signature payment success chime
  soundNotifier.playPaymentSuccessChime();

  if (typeof window === "undefined") return;

  const tableText = order.tableNumber ? `Table #${order.tableNumber}` : "QR Order";
  const amountText = `₹${order.total || 0}`;
  const utrText = order.paymentDetails?.utr ? ` (UTR: ${order.paymentDetails.utr})` : "";
  const title = `💳 Online Payment Received! (${tableText})`;
  const body = `${amountText} paid online via UPI${utrText} • Bill settled automatically!`;

  try {
    if (!swRegistration && "serviceWorker" in navigator) {
      swRegistration = await navigator.serviceWorker.ready;
    }

    if (swRegistration && "showNotification" in swRegistration && Notification.permission === "granted") {
      await swRegistration.showNotification(title, {
        body,
        icon: "/images/pwa/icon-192.png",
        badge: "/images/pwa/badge-72.png",
        vibrate: [150, 80, 250],
        tag: `payment-${order.id || Date.now()}`,
        renotify: true,
        requireInteraction: true,
        data: {
          url: "/?admin=true&tab=orders",
          orderId: order.id
        }
      });
      return;
    }
  } catch (e) {
    console.warn("SW showNotification fallback:", e);
  }

  if ("Notification" in window && Notification.permission === "granted") {
    try {
      const notif = new Notification(title, {
        body,
        icon: "/images/pwa/icon-192.png",
        badge: "/images/pwa/badge-72.png",
        tag: `payment-${order.id || Date.now()}`,
        renotify: true
      });
      notif.onclick = () => {
        window.focus();
        notif.close();
      };
    } catch (err) {
      console.warn("Window notification fallback error:", err);
    }
  }
};
