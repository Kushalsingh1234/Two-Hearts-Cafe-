import React, { useRef } from "react";
import { Printer, X, Receipt } from "lucide-react";
import CafeLogoIcon from "../common/CafeLogoIcon";

export default function DigitalInvoiceModal({ isOpen, onClose, order }) {
  const invoiceRef = useRef(null);

  if (!isOpen || !order) return null;

  const invoiceNumber = `INV-${order.orderNumber || (order.id ? order.id.slice(0, 6) : "1001")}`;
  const orderDate = new Date(order.settledAt || order.updatedAt || order.createdAt || Date.now());
  const dateFormatted = orderDate.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric"
  });
  const timeFormatted = orderDate.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit"
  });

  const isOnlinePayment = order.paymentMethod === "upi" || order.paymentStatus === "paid_online";
  const utr = order.paymentDetails?.utr;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div style={{
      position: "fixed",
      inset: 0,
      zIndex: 90,
      backgroundColor: "rgba(28, 25, 23, 0.7)",
      backdropFilter: "blur(4px)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: 16
    }}>
      <div style={{
        width: "100%",
        maxWidth: 480,
        backgroundColor: "#FAF7F2",
        borderRadius: 8,
        border: "2px solid var(--color-border-frame)",
        boxShadow: "var(--shadow-floating)",
        display: "flex",
        flexDirection: "column",
        maxHeight: "92vh",
        overflow: "hidden"
      }}>
        {/* Top Header Controls (Hidden during print) */}
        <div className="no-print" style={{
          padding: "14px 18px",
          borderBottom: "1.5px solid var(--color-border-frame)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          backgroundColor: "#FAF7F2"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Receipt size={18} style={{ color: "var(--color-bronze)" }} />
            <span style={{ fontFamily: "var(--font-serif)", fontSize: 16, fontWeight: 700, color: "var(--color-ink)" }}>
              Digital Invoice
            </span>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <button
              onClick={handlePrint}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 5,
                padding: "6px 14px",
                borderRadius: "var(--radius-pill)",
                backgroundColor: "var(--color-ink)",
                color: "#FAF7F2",
                border: "none",
                fontFamily: "var(--font-serif)",
                fontSize: 12,
                fontWeight: 700,
                letterSpacing: 0.5,
                textTransform: "uppercase",
                cursor: "pointer"
              }}
              title="Print or Save Invoice as PDF"
            >
              <Printer size={13} />
              <span>Download PDF</span>
            </button>

            <button
              onClick={onClose}
              style={{
                width: 30,
                height: 30,
                borderRadius: "50%",
                backgroundColor: "#fff",
                border: "1px solid var(--color-border-frame)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "var(--color-ink)",
                cursor: "pointer"
              }}
            >
              <X size={15} />
            </button>
          </div>
        </div>

        {/* Printable Invoice Container */}
        <div style={{ padding: "20px 24px", overflowY: "auto", flex: 1 }}>
          <div
            ref={invoiceRef}
            id="printable-digital-invoice"
            style={{
              backgroundColor: "#ffffff",
              padding: 24,
              borderRadius: 6,
              border: "1.5px solid var(--color-border-frame)",
              boxShadow: "var(--shadow-sm)",
              color: "var(--color-ink)",
              fontFamily: "var(--font-serif)"
            }}
          >
            {/* Cafe Logo & Header */}
            <div style={{ textAlign: "center", borderBottom: "1.5px dashed var(--color-border-frame)", paddingBottom: 16, marginBottom: 16 }}>
              <div style={{ display: "flex", justifyContent: "center", marginBottom: 6 }}>
                <CafeLogoIcon size={44} />
              </div>
              <h2 style={{
                fontFamily: "var(--font-script)",
                fontSize: 34,
                color: "var(--color-bronze)",
                margin: 0,
                lineHeight: 1
              }}>
                Two Hearts Cafe
              </h2>
              <div style={{ fontSize: 11, fontStyle: "italic", color: "var(--color-bronze)", marginTop: 4 }}>
                Daily Open: 12 PM - 12 PM
              </div>
              <div style={{ fontSize: 11, color: "var(--color-ink)", opacity: 0.8, marginTop: 4, lineHeight: 1.4 }}>
                Shivam Vihar Colony, Pillar No. 852, Near KIET University, Muradnagar, 201206
              </div>
              <div style={{ fontSize: 11, color: "var(--color-ink)", opacity: 0.8 }}>
                Helpline: +91 90270 12158
              </div>
            </div>

            {/* Invoice Meta Grid */}
            <div style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 8,
              fontSize: 12,
              borderBottom: "1px dashed var(--color-border-subtle)",
              paddingBottom: 12,
              marginBottom: 14
            }}>
              <div>
                <span style={{ color: "var(--color-bronze)", display: "block" }}>Invoice No:</span>
                <strong>{invoiceNumber}</strong>
              </div>
              <div style={{ textAlign: "right" }}>
                <span style={{ color: "var(--color-bronze)", display: "block" }}>Table:</span>
                <strong>Table #{order.tableNumber}</strong>
              </div>
              <div>
                <span style={{ color: "var(--color-bronze)", display: "block" }}>Date & Time:</span>
                <span>{dateFormatted}, {timeFormatted}</span>
              </div>
              <div style={{ textAlign: "right" }}>
                <span style={{ color: "var(--color-bronze)", display: "block" }}>Payment Status:</span>
                <strong style={{ color: "#15803d" }}>PAID & SETTLED</strong>
              </div>
            </div>

            {/* Items Table */}
            <div style={{ marginBottom: 16 }}>
              <div style={{
                display: "grid",
                gridTemplateColumns: "3fr 1fr 1fr",
                fontSize: 11,
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: 0.5,
                color: "var(--color-bronze)",
                borderBottom: "1px solid var(--color-border-frame)",
                paddingBottom: 6,
                marginBottom: 6
              }}>
                <div>Dish</div>
                <div style={{ textAlign: "center" }}>Qty</div>
                <div style={{ textAlign: "right" }}>Amount</div>
              </div>

              {order.items?.map((it, idx) => (
                <div
                  key={idx}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "3fr 1fr 1fr",
                    fontSize: 13,
                    padding: "4px 0",
                    borderBottom: idx < order.items.length - 1 ? "1px dashed #f0ece6" : "none"
                  }}
                >
                  <div>
                    <span>{it.name}</span>
                    {it.note && (
                      <div style={{ fontSize: 10, fontStyle: "italic", color: "var(--color-bronze)" }}>
                        Note: {it.note}
                      </div>
                    )}
                  </div>
                  <div style={{ textAlign: "center" }}>{it.quantity}</div>
                  <div style={{ textAlign: "right", fontWeight: 600 }}>Rs.{it.price * it.quantity}</div>
                </div>
              ))}
            </div>

            {/* Bill Totals */}
            <div style={{
              borderTop: "1.5px solid var(--color-border-frame)",
              paddingTop: 10,
              marginBottom: 16
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 4 }}>
                <span>Subtotal:</span>
                <span>Rs.{order.subtotal || order.total}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "var(--color-bronze)", marginBottom: 4 }}>
                <span>Taxes & Service:</span>
                <span>Included in prices</span>
              </div>
              <div style={{
                display: "flex",
                justifyContent: "space-between",
                fontSize: 18,
                fontWeight: 800,
                color: "var(--color-ink)",
                borderTop: "1px dashed var(--color-border-frame)",
                paddingTop: 8,
                marginTop: 6
              }}>
                <span>Total Amount Paid:</span>
                <span>Rs.{order.total}</span>
              </div>
            </div>

            {/* Payment Mode Stamp */}
            <div style={{
              backgroundColor: "#FAF7F2",
              border: "1px solid var(--color-border-frame)",
              borderRadius: 4,
              padding: "10px 12px",
              textAlign: "center",
              fontSize: 12,
              marginBottom: 16
            }}>
              <div style={{ fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5, color: "var(--color-ink)" }}>
                {isOnlinePayment ? "Paid Online via UPI" : "Paid at Cafe Counter"}
              </div>
              {isOnlinePayment && (
                <div style={{ fontSize: 11, color: "var(--color-bronze)", marginTop: 2 }}>
                  Payee: <strong>twohearts@ptaxis</strong>
                  {utr ? ` • UTR: ${utr}` : ""}
                </div>
              )}
            </div>

            {/* Footer Thank You */}
            <div style={{ textAlign: "center", fontSize: 12, fontStyle: "italic", color: "var(--color-bronze)", lineHeight: 1.4 }}>
              <div>Thank you for visiting Two Hearts Cafe!</div>
              <div style={{ fontSize: 10, marginTop: 4 }}>
                This is a digitally generated paperless receipt. Save or screenshot for your records.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
