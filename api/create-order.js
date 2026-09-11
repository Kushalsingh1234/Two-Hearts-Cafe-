import Razorpay from "razorpay";

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

  const key_id = process.env.RAZORPAY_KEY_ID || process.env.VITE_RAZORPAY_KEY_ID;
  const key_secret = process.env.RAZORPAY_KEY_SECRET;

  if (!key_id || !key_secret) {
    console.error("Missing Razorpay credentials in environment");
    return res.status(401).json({
      success: false,
      error: "Razorpay credentials not configured on server"
    });
  }

  try {
    const { amount, currency = "INR", receipt, notes = {} } = req.body || {};

    // Validate amount (in paise, minimum 100 paise = ₹1)
    const numericAmount = parseInt(amount, 10);
    if (isNaN(numericAmount) || numericAmount < 100) {
      return res.status(400).json({
        success: false,
        error: "Invalid amount. Minimum payable amount is 100 paise (Rs.1)"
      });
    }

    const instance = new Razorpay({
      key_id,
      key_secret
    });

    const orderOptions = {
      amount: numericAmount,
      currency: currency || "INR",
      receipt: (receipt || `rcpt_${Date.now()}`).slice(0, 40),
      notes: {
        cafe: "Two Hearts Cafe",
        ...notes
      }
    };

    const razorpayOrder = await instance.orders.create(orderOptions);

    return res.status(200).json({
      success: true,
      order_id: razorpayOrder.id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
      key_id
    });
  } catch (error) {
    console.error("Razorpay create-order error:", error);
    const statusCode = error.statusCode || 500;
    return res.status(statusCode).json({
      success: false,
      error: error.error?.description || error.message || "Failed to create Razorpay order"
    });
  }
}
