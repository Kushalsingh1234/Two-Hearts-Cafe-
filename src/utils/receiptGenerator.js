/**
 * Two Hearts Cafe - Branded Receipt & PDF Generator
 * Generates an elegant European-cafe styled invoice/receipt with printable CSS & PDF saving.
 */

export function generateReceiptHtml(order) {
  const items = order.items || [];
  const orderNumber = order.orderNumber || order.id || "THD-1001";
  const dateFormatted = order.createdAt
    ? new Date(order.createdAt).toLocaleString("en-IN", {
        dateStyle: "medium",
        timeStyle: "short"
      })
    : new Date().toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });

  const customerName = order.customerName || "Valued Customer";
  const customerPhone = order.customerPhone || "";
  const address = order.deliveryAddress || "Takeaway Counter";
  const subtotal = Number(order.subtotal || 0);
  const deliveryFee = Number(order.deliveryFee || 0);
  const tax = Number(order.tax || 0);
  const total = Number(order.total || subtotal + deliveryFee + tax);
  const paymentMethod = (order.paymentMethod || "Online").replace("_", " ").toUpperCase();
  const paymentId = order.paymentId || "PAID";

  const itemRowsHtml = items
    .map(
      (item, idx) => `
    <tr>
      <td style="padding: 10px 12px; border-bottom: 1px solid #E6DFD5; font-size: 13px; color: #1C1917;">
        <strong>${item.name}</strong>
        ${item.specialInstructions ? `<br/><span style="font-size: 11px; color: #8A5738; font-style: italic;">Note: ${item.specialInstructions}</span>` : ""}
      </td>
      <td style="padding: 10px 12px; border-bottom: 1px solid #E6DFD5; text-align: center; font-size: 13px; color: #1C1917;">
        ${item.quantity}
      </td>
      <td style="padding: 10px 12px; border-bottom: 1px solid #E6DFD5; text-align: right; font-size: 13px; color: #1C1917;">
        ₹${item.price}
      </td>
      <td style="padding: 10px 12px; border-bottom: 1px solid #E6DFD5; text-align: right; font-weight: 600; font-size: 13px; color: #1C1917;">
        ₹${item.price * item.quantity}
      </td>
    </tr>
  `
    )
    .join("");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Receipt - ${orderNumber} - Two Hearts Cafe</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,500;0,600;0,700;1,400&family=Great+Vibes&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap');
    
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    body {
      font-family: 'Plus Jakarta Sans', sans-serif;
      background-color: #FAF7F2;
      color: #1C1917;
      padding: 40px 20px;
      line-height: 1.5;
    }
    .receipt-card {
      max-width: 640px;
      margin: 0 auto;
      background: #FFFFFF;
      border: 1px solid #E6DFD5;
      border-radius: 12px;
      padding: 36px 32px;
      box-shadow: 0 4px 20px rgba(28, 25, 23, 0.06);
    }
    .header {
      text-align: center;
      padding-bottom: 24px;
      border-bottom: 1px dashed #D6C8B8;
    }
    .brand-script {
      font-family: 'Great Vibes', cursive;
      font-size: 38px;
      color: #8A5738;
      line-height: 1.1;
    }
    .brand-sub {
      font-family: 'Cormorant Garamond', Georgia, serif;
      font-size: 14px;
      color: #663B20;
      text-transform: uppercase;
      letter-spacing: 2px;
      margin-top: 4px;
    }
    .cafe-meta {
      font-size: 12px;
      color: #57534E;
      margin-top: 6px;
    }
    .order-info {
      display: flex;
      justify-content: space-between;
      margin: 24px 0;
      font-size: 13px;
      gap: 16px;
    }
    .order-info div {
      flex: 1;
    }
    .meta-title {
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 1px;
      color: #8A5738;
      font-weight: 700;
      margin-bottom: 4px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 20px 0;
    }
    th {
      background-color: #F4ECE3;
      padding: 10px 12px;
      text-align: left;
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 1px;
      color: #663B20;
      font-weight: 700;
    }
    .totals-table {
      width: 280px;
      margin-left: auto;
      margin-top: 16px;
    }
    .totals-row {
      display: flex;
      justify-content: space-between;
      padding: 6px 0;
      font-size: 13px;
      color: #44403C;
    }
    .grand-total {
      display: flex;
      justify-content: space-between;
      padding: 12px 0 0 0;
      margin-top: 8px;
      border-top: 2px solid #1C1917;
      font-family: 'Cormorant Garamond', Georgia, serif;
      font-size: 20px;
      font-weight: 700;
      color: #1C1917;
    }
    .footer {
      text-align: center;
      margin-top: 32px;
      padding-top: 20px;
      border-top: 1px dashed #D6C8B8;
      font-size: 12px;
      color: #78716C;
    }
    .btn-print {
      display: inline-block;
      margin: 20px auto 0 auto;
      background: #1C1917;
      color: #FFFFFF;
      padding: 10px 24px;
      border-radius: 9999px;
      text-decoration: none;
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
    }
    @media print {
      body {
        background: #FFFFFF;
        padding: 0;
      }
      .receipt-card {
        border: none;
        box-shadow: none;
        padding: 10px;
      }
      .no-print {
        display: none !important;
      }
    }
  </style>
</head>
<body>
  <div class="receipt-card">
    <div class="header">
      <div class="brand-script">Two Hearts Cafe</div>
      <div class="brand-sub">Boutique European Cafe & Pure Vegetarian Kitchen</div>
      <div class="cafe-meta">
        Shivam Vihar, Near Pillar 852, Muradnagar, Ghaziabad<br/>
        Phone: +91 93103 40889 • GSTIN: 09AABCT2024H1Z5
      </div>
    </div>

    <div class="order-info">
      <div>
        <div class="meta-title">Order Details</div>
        <div><strong>Order No:</strong> ${orderNumber}</div>
        <div><strong>Date:</strong> ${dateFormatted}</div>
        <div><strong>Type:</strong> ${order.orderType === "pickup" ? "Takeaway Pick-up" : "Food Delivery"}</div>
        <div><strong>Status:</strong> ${order.status ? order.status.toUpperCase() : "DELIVERED"}</div>
      </div>
      <div style="text-align: right;">
        <div class="meta-title">Billed To</div>
        <div><strong>${customerName}</strong></div>
        ${customerPhone ? `<div>${customerPhone}</div>` : ""}
        <div style="max-width: 220px; margin-left: auto; word-break: break-word;">${address}</div>
      </div>
    </div>

    <table>
      <thead>
        <tr>
          <th>Dish / Item</th>
          <th style="text-align: center;">Qty</th>
          <th style="text-align: right;">Rate</th>
          <th style="text-align: right;">Amount</th>
        </tr>
      </thead>
      <tbody>
        ${itemRowsHtml}
      </tbody>
    </table>

    <div class="totals-table">
      <div class="totals-row">
        <span>Item Subtotal</span>
        <span>₹${subtotal}</span>
      </div>
      <div class="totals-row">
        <span>Delivery Charge</span>
        <span>${deliveryFee === 0 ? "FREE" : "₹" + deliveryFee}</span>
      </div>
      <div class="totals-row">
        <span>GST (5%)</span>
        <span>₹${tax}</span>
      </div>
      <div class="grand-total">
        <span>Total Paid</span>
        <span>₹${total}</span>
      </div>
    </div>

    <div style="margin-top: 20px; padding: 12px; background: #FAF7F2; border-radius: 8px; font-size: 12px; color: #57534E;">
      <div><strong>Payment Mode:</strong> ${paymentMethod}</div>
      <div><strong>Transaction Ref:</strong> ${paymentId} • Status: PAID</div>
    </div>

    <div class="footer">
      <p style="font-family: 'Cormorant Garamond', Georgia, serif; font-size: 16px; font-style: italic; color: #8A5738; margin-bottom: 4px;">
        Thank you for dining with Two Hearts Cafe!
      </p>
      <p>Handcrafted fresh with premium, 100% pure vegetarian ingredients.</p>
      <div class="no-print">
        <button class="btn-print" onclick="window.print()">Print or Save as PDF</button>
      </div>
    </div>
  </div>

  <script>
    // Auto-trigger print dialog if opened in standalone window
    window.addEventListener('load', () => {
      setTimeout(() => {
        window.print();
      }, 350);
    });
  </script>
</body>
</html>`;
}

/**
 * Open printable receipt in popup window for instant Save-As-PDF or printing
 */
export function printReceipt(order) {
  const htmlContent = generateReceiptHtml(order);
  const printWindow = window.open("", "_blank", "width=750,height=900");
  if (printWindow) {
    printWindow.document.open();
    printWindow.document.write(htmlContent);
    printWindow.document.close();
  } else {
    // Popup blocked: download file fallback
    downloadReceiptHtml(order);
  }
}

/**
 * Download standalone branded receipt HTML file
 */
export function downloadReceiptHtml(order) {
  const htmlContent = generateReceiptHtml(order);
  const blob = new Blob([htmlContent], { type: "text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  const safeId = (order.orderNumber || order.id || "order").replace(/[^a-zA-Z0-9_-]/g, "");
  link.download = `Two_Hearts_Receipt_${safeId}.html`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
