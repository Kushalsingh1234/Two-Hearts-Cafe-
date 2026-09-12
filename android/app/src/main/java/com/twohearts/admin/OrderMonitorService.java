package com.twohearts.admin;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.Context;
import android.content.Intent;
import android.media.AudioAttributes;
import android.media.MediaPlayer;
import android.net.Uri;
import android.os.Build;
import android.os.IBinder;
import android.os.PowerManager;
import android.os.VibrationEffect;
import android.os.Vibrator;
import android.util.Log;

import androidx.core.app.NotificationCompat;
import androidx.core.app.NotificationManagerCompat;

import com.google.firebase.firestore.DocumentChange;
import com.google.firebase.firestore.DocumentSnapshot;
import com.google.firebase.firestore.FirebaseFirestore;
import com.google.firebase.firestore.ListenerRegistration;

import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

public class OrderMonitorService extends Service {
    private static final String TAG = "OrderMonitorService";
    private static final String SERVICE_CHANNEL_ID = "kitchen_monitor_service_channel";
    private static final String ORDERS_CHANNEL_ID = "orders_channel_v2";
    private static final int SERVICE_NOTIFICATION_ID = 1001;

    private FirebaseFirestore db;
    private ListenerRegistration ordersListener;
    private final Set<String> alertedOrderKeys = new HashSet<>();
    private boolean isInitialLoad = true;
    private PowerManager.WakeLock wakeLock;

    @Override
    public void onCreate() {
        super.onCreate();
        Log.d(TAG, "OrderMonitorService onCreate");

        createNotificationChannels();
        startForeground(SERVICE_NOTIFICATION_ID, buildServiceNotification());

        acquireWakeLock();
        startFirestoreOrderListener();
    }

    private void acquireWakeLock() {
        try {
            PowerManager powerManager = (PowerManager) getSystemService(Context.POWER_SERVICE);
            if (powerManager != null) {
                wakeLock = powerManager.newWakeLock(PowerManager.PARTIAL_WAKE_LOCK, "TwoHearts::KitchenMonitorWakeLock");
                wakeLock.acquire(10 * 60 * 1000L /* 10 minutes timeout, auto-renewed */);
            }
        } catch (Exception e) {
            Log.w(TAG, "Could not acquire wake lock:", e);
        }
    }

    private void createNotificationChannels() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationManager nm = (NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);
            if (nm == null) return;

            // 1. Silent persistent notification channel for the foreground service
            NotificationChannel serviceChannel = new NotificationChannel(
                    SERVICE_CHANNEL_ID,
                    "Kitchen Background Monitor",
                    NotificationManager.IMPORTANCE_LOW
            );
            serviceChannel.setDescription("Keeps Two Hearts Cafe monitoring for incoming orders 24/7");
            serviceChannel.setShowBadge(false);
            nm.createNotificationChannel(serviceChannel);

            // 2. High priority alert channel for customer orders
            NotificationChannel orderChannel = new NotificationChannel(
                    ORDERS_CHANNEL_ID,
                    "Two Hearts Cafe Order Alerts",
                    NotificationManager.IMPORTANCE_HIGH
            );
            orderChannel.setDescription("High priority sound and vibration alerts for kitchen orders");
            orderChannel.enableVibration(true);
            orderChannel.setVibrationPattern(new long[]{0, 400, 150, 400, 150, 600});
            orderChannel.setLockscreenVisibility(Notification.VISIBILITY_PUBLIC);

            Uri soundUri = Uri.parse("android.resource://" + getPackageName() + "/" + R.raw.ting);
            AudioAttributes audioAttributes = new AudioAttributes.Builder()
                    .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
                    .setUsage(AudioAttributes.USAGE_NOTIFICATION)
                    .build();
            orderChannel.setSound(soundUri, audioAttributes);

            nm.createNotificationChannel(orderChannel);
        }
    }

    private Notification buildServiceNotification() {
        Intent launchIntent = new Intent(this, MainActivity.class);
        launchIntent.setFlags(Intent.FLAG_ACTIVITY_SINGLE_TOP | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        PendingIntent pendingIntent = PendingIntent.getActivity(
                this, 0, launchIntent,
                PendingIntent.FLAG_UPDATE_CURRENT | (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M ? PendingIntent.FLAG_IMMUTABLE : 0)
        );

        return new NotificationCompat.Builder(this, SERVICE_CHANNEL_ID)
                .setContentTitle("Two Hearts Cafe • Kitchen Monitor")
                .setContentText("Listening for live table and online orders 24/7")
                .setSmallIcon(R.mipmap.ic_launcher)
                .setContentIntent(pendingIntent)
                .setOngoing(true)
                .setPriority(NotificationCompat.PRIORITY_LOW)
                .build();
    }

    private void startFirestoreOrderListener() {
        try {
            db = FirebaseFirestore.getInstance();
            ordersListener = db.collection("orders")
                    .addSnapshotListener((snapshots, error) -> {
                        if (error != null) {
                            Log.w(TAG, "Firestore order listener error:", error);
                            return;
                        }
                        if (snapshots == null) return;

                        if (isInitialLoad) {
                            // On initial service boot, record existing orders
                            for (DocumentSnapshot doc : snapshots.getDocuments()) {
                                String orderId = doc.getId();
                                alertedOrderKeys.add(orderId);
                                String lastAddedAt = doc.getString("lastItemAddedAt");
                                if (lastAddedAt != null) {
                                    alertedOrderKeys.add(orderId + "_add_" + lastAddedAt);
                                }
                                Boolean billReq = doc.getBoolean("billRequested");
                                if (Boolean.TRUE.equals(billReq)) {
                                    alertedOrderKeys.add(orderId + "_bill");
                                }
                                Boolean payInit = doc.getBoolean("paymentInitiated");
                                if (Boolean.TRUE.equals(payInit)) {
                                    alertedOrderKeys.add(orderId + "_pay_init");
                                }
                            }
                            isInitialLoad = false;
                            Log.d(TAG, "Initial load completed with " + alertedOrderKeys.size() + " known keys");
                            return;
                        }

                        // Inspect newly arrived or modified documents
                        for (DocumentChange dc : snapshots.getDocumentChanges()) {
                            DocumentSnapshot doc = dc.getDocument();
                            String orderId = doc.getId();
                            String status = doc.getString("status");
                            String tableNum = doc.get("tableNumber") != null ? String.valueOf(doc.get("tableNumber")) : "Online";
                            Object totalObj = doc.get("total");
                            String totalText = totalObj != null ? "₹" + totalObj : "";
                            String lastAddedAt = doc.getString("lastItemAddedAt");
                            Boolean billReq = doc.getBoolean("billRequested");
                            Boolean payInit = doc.getBoolean("paymentInitiated");
                            String payApp = doc.getString("paymentInitiatedApp");

                            // 1. New placed order
                            if ("placed".equals(status) && !alertedOrderKeys.contains(orderId)) {
                                alertedOrderKeys.add(orderId);
                                String title = "🔔 New Order Received! (" + (tableNum.equalsIgnoreCase("Delivery") || tableNum.equalsIgnoreCase("Takeaway") ? tableNum : "Table " + tableNum) + ")";
                                String body = totalText + " • Ready for kitchen preparation";
                                triggerNativeAlert(title, body, orderId);
                            }

                            // 2. Additional items added to existing table
                            if (lastAddedAt != null) {
                                String addKey = orderId + "_add_" + lastAddedAt;
                                if (!alertedOrderKeys.contains(addKey)) {
                                    alertedOrderKeys.add(addKey);
                                    String summary = doc.getString("lastAdditionSummary");
                                    String title = "🔔 Items Added to Table #" + tableNum + "!";
                                    String body = (summary != null ? summary : "New items added") + " • Bill: " + totalText;
                                    triggerNativeAlert(title, body, orderId);
                                }
                            }

                            // 3. Customer requested cash bill at counter
                            if (Boolean.TRUE.equals(billReq)) {
                                String billKey = orderId + "_bill";
                                if (!alertedOrderKeys.contains(billKey)) {
                                    alertedOrderKeys.add(billKey);
                                    String title = "💵 Table #" + tableNum + " Requested Cash Bill!";
                                    String body = "Total: " + totalText + " • Customer paying cash at counter";
                                    triggerNativeAlert(title, body, orderId);
                                }
                            }

                            // 4. Online payment initiated (UPI / QR)
                            if (Boolean.TRUE.equals(payInit)) {
                                String payKey = orderId + "_pay_init";
                                if (!alertedOrderKeys.contains(payKey)) {
                                    alertedOrderKeys.add(payKey);
                                    String appLabel = (payApp != null && !payApp.isEmpty()) ? payApp : "UPI / QR";
                                    String title = "💳 Online Payment Initiated (" + (tableNum.equalsIgnoreCase("Delivery") || tableNum.equalsIgnoreCase("Takeaway") ? tableNum : "Table " + tableNum) + ")";
                                    String body = totalText + " • Customer opened " + appLabel + " (Awaiting payment)";
                                    triggerNativeAlert(title, body, orderId);
                                }
                            }
                        }
                    });
        } catch (Exception e) {
            Log.e(TAG, "Failed to start Firestore order listener:", e);
        }
    }

    private void triggerNativeAlert(String title, String body, String orderId) {
        Log.d(TAG, "triggerNativeAlert: " + title + " - " + body);

        // 1. Play signature cafe Ting! chime sound directly via MediaPlayer
        try {
            MediaPlayer mediaPlayer = MediaPlayer.create(this, R.raw.ting);
            if (mediaPlayer != null) {
                mediaPlayer.setOnCompletionListener(MediaPlayer::release);
                mediaPlayer.start();
            }
        } catch (Exception e) {
            Log.w(TAG, "MediaPlayer ting playback failed:", e);
        }

        // 2. Trigger strong phone vibration
        try {
            Vibrator vibrator = (Vibrator) getSystemService(Context.VIBRATOR_SERVICE);
            if (vibrator != null) {
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                    vibrator.vibrate(VibrationEffect.createWaveform(new long[]{0, 400, 150, 400, 150, 600}, -1));
                } else {
                    vibrator.vibrate(new long[]{0, 400, 150, 400, 150, 600}, -1);
                }
            }
        } catch (Exception e) {
            Log.w(TAG, "Vibrator failed:", e);
        }

        // 3. Pop up heads-up high-importance Notification that wakes screen
        try {
            Intent intent = new Intent(this, MainActivity.class);
            intent.setFlags(Intent.FLAG_ACTIVITY_SINGLE_TOP | Intent.FLAG_ACTIVITY_CLEAR_TOP);
            intent.putExtra("orderId", orderId);

            PendingIntent pendingIntent = PendingIntent.getActivity(
                    this, (int) System.currentTimeMillis(), intent,
                    PendingIntent.FLAG_UPDATE_CURRENT | (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M ? PendingIntent.FLAG_IMMUTABLE : 0)
            );

            NotificationCompat.Builder builder = new NotificationCompat.Builder(this, ORDERS_CHANNEL_ID)
                    .setSmallIcon(R.mipmap.ic_launcher)
                    .setContentTitle(title)
                    .setContentText(body)
                    .setPriority(NotificationCompat.PRIORITY_MAX)
                    .setCategory(NotificationCompat.CATEGORY_ALARM)
                    .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
                    .setAutoCancel(true)
                    .setFullScreenIntent(pendingIntent, true) // Wakes up the screen on lock screen
                    .setContentIntent(pendingIntent);

            NotificationManagerCompat nmc = NotificationManagerCompat.from(this);
            nmc.notify((int) (System.currentTimeMillis() % Integer.MAX_VALUE), builder.build());
        } catch (Exception e) {
            Log.w(TAG, "NotificationManager notify failed:", e);
        }
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        Log.d(TAG, "OrderMonitorService onStartCommand");
        return START_STICKY;
    }

    @Override
    public void onDestroy() {
        Log.d(TAG, "OrderMonitorService onDestroy");
        if (ordersListener != null) {
            ordersListener.remove();
        }
        if (wakeLock != null && wakeLock.isHeld()) {
            wakeLock.release();
        }
        super.onDestroy();
    }

    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }
}
