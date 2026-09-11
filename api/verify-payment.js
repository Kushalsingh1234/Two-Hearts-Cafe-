import crypto from "crypto";

export default async function handler(req, res) {
  // CORS & Method check
  if (req.method === "OPTIONS") {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ success: false, error: "Method Not Allowed" });
  }

  const key_secret = process.env.RAZORPAY_KEY_SECRET;

  if (!key_secret) {
    console.error("Missing RAZORPAY_KEY_SECRET in environment");
    return res.status(500).json({
      success: false,
      error: "Server configuration error"
    });
  }

  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body || {};

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({
        success: false,
        error: "Missing required payment parameters (order_id, payment_id, or signature)"
      });
    }

    // Standard Razorpay Signature Verification:
    // HMAC-SHA256 of (order_id + "|" + payment_id) with key_secret
    const hmac = crypto.createHmac("sha256", key_secret);
    hmac.update(`${razorpay_order_id}|${razorpay_payment_id}`);
    const generatedSignature = hmac.digest("hex");

    // Secure timing-safe string comparison (guard against different length Buffer error)
    const generatedBuffer = Buffer.from(generatedSignature, "utf8");
    const receivedBuffer = Buffer.from(razorpay_signature, "utf8");

    const isSignatureValid =
      generatedBuffer.length === receivedBuffer.length &&
      crypto.timingSafeEqual(generatedBuffer, receivedBuffer);

    if (!isSignatureValid) {
      console.warn("Payment verification failed: signature mismatch", {
        razorpay_order_id,
        razorpay_payment_id
      });
      return res.status(400).json({
        success: false,
        verified: false,
        error: "Invalid payment signature. Verification failed."
      });
    }

    return res.status(200).json({
      success: true,
      verified: true,
      order_id: razorpay_order_id,
      payment_id: razorpay_payment_id
    });
  } catch (error) {
    console.error("Payment verification server error:", error);
    return res.status(500).json({
      success: false,
      error: error.message || "Failed to verify payment signature"
    });
  }
}
