/**
 * Razorpay Standard Web Checkout Client Service for Two Hearts Cafe
 */

export const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    if (typeof window !== "undefined" && window.Razorpay) {
      return resolve(true);
    }
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

/**
 * Step 1: Request backend order creation
 */
export const createRazorpayOrder = async (orderData) => {
  const amountInPaise = Math.round((orderData.total || 0) * 100);
  if (amountInPaise < 100) {
    throw new Error("Order amount must be at least Rs.1 (100 paise)");
  }

  const receipt = `th_${orderData.tableNumber ? `t${orderData.tableNumber}_` : ""}${Date.now().toString().slice(-8)}`;

  const response = await fetch("/api/create-order", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      amount: amountInPaise,
      currency: "INR",
      receipt,
      notes: {
        tableNumber: orderData.tableNumber || "Online",
        orderNumber: orderData.orderNumber || orderData.id || "N/A"
      }
    })
  });

  const data = await response.json();
  if (!response.ok || !data.success) {
    throw new Error(data.error || "Failed to create payment order on server");
  }

  return data;
};

/**
 * Step 3: Send signature to backend to verify with HMAC-SHA256
 */
export const verifyRazorpayPayment = async (paymentResponse) => {
  const response = await fetch("/api/verify-payment", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      razorpay_order_id: paymentResponse.razorpay_order_id,
      razorpay_payment_id: paymentResponse.razorpay_payment_id,
      razorpay_signature: paymentResponse.razorpay_signature
    })
  });

  const data = await response.json();
  if (!response.ok || !data.success || !data.verified) {
    throw new Error(data.error || "Payment verification signature mismatch");
  }

  return data;
};

/**
 * Step 2: Open official Razorpay modal and handle complete lifecycle
 */
export const launchRazorpayCheckout = async ({
  order,
  onSuccess,
  onFailure,
  onDismiss
}) => {
  const isLoaded = await loadRazorpayScript();
  if (!isLoaded || !window.Razorpay) {
    throw new Error("Could not load Razorpay payment SDK. Please check your internet connection.");
  }

  // 1. Backend creates order
  const orderDetails = await createRazorpayOrder(order);

  const fallbackKey = import.meta.env.VITE_RAZORPAY_KEY_ID || "rzp_test_TapHf0ydwP8n0G";
  const keyToUse = orderDetails.key_id || fallbackKey;

  const orderTitle = order.orderType === "delivery"
    ? "Delivery Order"
    : order.orderType === "pickup"
    ? "Pickup Order"
    : `Table #${order.tableNumber} Bill`;

  const options = {
    key: keyToUse,
    amount: orderDetails.amount,
    currency: orderDetails.currency || "INR",
    name: "Two Hearts Cafe",
    description: `${orderTitle} (Rs.${order.total})`,
    image: "/images/pwa/icon-192.png",
    order_id: orderDetails.order_id,
    handler: async function (response) {
      try {
        // 2. Verify cryptographically on backend
        const verification = await verifyRazorpayPayment(response);
        if (onSuccess) {
          onSuccess({
            paymentId: response.razorpay_payment_id,
            orderId: response.razorpay_order_id,
            signature: response.razorpay_signature,
            verification
          });
        }
      } catch (err) {
        console.error("Payment verification error:", err);
        if (onFailure) {
          onFailure(err.message || "Payment verification failed on server");
        }
      }
    },
    prefill: {
      name: order.customerName || "",
      contact: order.customerPhone || ""
    },
    notes: {
      cafe: "Two Hearts Cafe",
      tableNumber: order.tableNumber || "Takeaway"
    },
    theme: {
      color: "#1C1917"
    },
    modal: {
      ondismiss: function () {
        if (onDismiss) onDismiss();
      }
    }
  };

  const rzp = new window.Razorpay(options);

  rzp.on("payment.failed", function (response) {
    console.warn("Razorpay payment failed:", response.error);
    if (onFailure) {
      onFailure(response.error?.description || "Payment failed or was cancelled by user");
    }
  });

  rzp.open();
};
