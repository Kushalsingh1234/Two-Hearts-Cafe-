package com.twohearts.admin;

import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.content.ContentResolver;
import android.content.Context;
import android.graphics.Color;
import android.media.AudioAttributes;
import android.net.Uri;
import android.content.Intent;
import android.os.Build;
import android.os.Bundle;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        createNotificationChannels();

        // Start 24/7 background order monitoring foreground service
        try {
            Intent serviceIntent = new Intent(this, OrderMonitorService.class);
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                startForegroundService(serviceIntent);
            } else {
                startService(serviceIntent);
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    private void createNotificationChannels() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationManager notificationManager = (NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);
            if (notificationManager == null) return;

            // Custom sound URI pointing to res/raw/ting
            Uri soundUri = Uri.parse(ContentResolver.SCHEME_ANDROID_RESOURCE + "://" + getPackageName() + "/" + R.raw.ting);

            AudioAttributes audioAttributes = new AudioAttributes.Builder()
                    .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
                    .setUsage(AudioAttributes.USAGE_NOTIFICATION)
                    .build();

            // 1. Primary Order Alerts Channel
            NotificationChannel channel = new NotificationChannel(
                    "orders_channel_v2",
                    "Two Hearts Cafe Order Alerts",
                    NotificationManager.IMPORTANCE_HIGH
            );
            channel.setDescription("High priority notifications with Ting chime for kitchen orders");
            channel.enableLights(true);
            channel.setLightColor(Color.parseColor("#8D2837"));
            channel.enableVibration(true);
            channel.setVibrationPattern(new long[]{0, 400, 150, 400, 150, 600});
            channel.setSound(soundUri, audioAttributes);
            channel.setLockscreenVisibility(android.app.Notification.VISIBILITY_PUBLIC);
            channel.setBypassDnd(true);

            notificationManager.createNotificationChannel(channel);

            // 2. FCM Fallback Channel
            NotificationChannel fallbackChannel = new NotificationChannel(
                    "fcm_fallback_notification_channel",
                    "Two Hearts Cafe Updates",
                    NotificationManager.IMPORTANCE_HIGH
            );
            fallbackChannel.setDescription("Order and table alerts");
            fallbackChannel.enableVibration(true);
            fallbackChannel.setVibrationPattern(new long[]{0, 400, 150, 400, 150, 600});
            fallbackChannel.setSound(soundUri, audioAttributes);
            fallbackChannel.setLockscreenVisibility(android.app.Notification.VISIBILITY_PUBLIC);

            notificationManager.createNotificationChannel(fallbackChannel);
        }
    }
}
