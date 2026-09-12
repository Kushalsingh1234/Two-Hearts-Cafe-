// Serverless API endpoint to broadcast push notifications to all registered admin devices
export default async function handler(req, res) {
  if (req.method === "OPTIONS") {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ success: false, error: "Method Not Allowed" });
  }

  try {
    const { title, body, orderId, data = {} } = req.body || {};

    if (!title) {
      return res.status(400).json({ success: false, error: "Missing title" });
    }

    const fcmServerKey =
      process.env.FCM_SERVER_KEY ||
      process.env.VITE_FCM_SERVER_KEY ||
      "AIzaSyALYSBLFoNc1-pBcisCfLrWItu1iiDqjX4";

    // Direct Firestore REST query to fetch active tokens from admin_device_tokens
    const projectId = "two-hearts-cafe-1144c";
    const firestoreUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/admin_device_tokens`;

    const tokenResponse = await fetch(firestoreUrl);
    const tokenData = await tokenResponse.json();

    const tokens = [];
    if (tokenData && tokenData.documents) {
      for (const doc of tokenData.documents) {
        const tokenField = doc.fields?.token?.stringValue;
        if (tokenField) {
          tokens.push(tokenField);
        }
      }
    }

    if (tokens.length === 0) {
      return res.status(200).json({
        success: true,
        message: "No registered admin device tokens found in Firestore yet.",
        deliveredCount: 0
      });
    }

    // Send push notification to each registered device
    const results = await Promise.allSettled(
      tokens.map(async (deviceToken) => {
        const fcmPayload = {
          to: deviceToken,
          priority: "high",
          notification: {
            title,
            body: body || "New order ready for kitchen prep.",
            sound: "ting",
            channel_id: "orders_channel_v2",
            android_channel_id: "orders_channel_v2"
          },
          data: {
            url: "/?admin=true&tab=orders",
            orderId: orderId || "",
            ...data
          }
        };

        const fcmRes = await fetch("https://fcm.googleapis.com/fcm/send", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `key=${fcmServerKey}`
          },
          body: JSON.stringify(fcmPayload)
        });

        return fcmRes.json();
      })
    );

    return res.status(200).json({
      success: true,
      deliveredCount: tokens.length,
      results
    });
  } catch (error) {
    console.error("send-order-push error:", error);
    return res.status(500).json({
      success: false,
      error: error.message || "Failed to dispatch push notification"
    });
  }
}
