import React, { useRef, useState } from "react";
import { Download, Printer, X, Receipt, Loader2, Check, Star } from "lucide-react";
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";
import CafeLogoIcon from "../common/CafeLogoIcon";

export default function DigitalInvoiceModal({ isOpen, onClose, order, onOpenReview }) {
  const invoiceRef = useRef(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);

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

  const handleDownloadPdf = async () => {
    if (isGenerating) return;
    const invoiceElement = invoiceRef.current;
    if (!invoiceElement) return;

    setIsGenerating(true);
    setDownloadSuccess(false);

    try {
      // High-resolution canvas snapshot of the digital receipt
      const canvas = await html2canvas(invoiceElement, {
        scale: 2.5,
        useCORS: true,
        allowTaint: true,
        backgroundColor: "#ffffff",
        logging: false
      });

      const imgData = canvas.toDataURL("image/jpeg", 0.98);

      // Create PDF in A4 portrait format (595.28 x 841.89 pt)
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "pt",
        format: "a4"
      });

      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();

      // Neat margins
      const margin = 32;
      const printWidth = pageWidth - (margin * 2);
      const printHeight = (canvas.height * printWidth) / canvas.width;

      // Center vertically if it fits, else top margin
      const yOffset = printHeight < (pageHeight - 60) ? Math.max(24, (pageHeight - printHeight) / 2) : 24;

      pdf.addImage(imgData, "JPEG", margin, yOffset, printWidth, printHeight);

      const fileName = `Two_Hearts_Invoice_${invoiceNumber}.pdf`;
      pdf.save(fileName);

      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 4000);
    } catch (error) {
      console.error("Failed to generate PDF invoice:", error);
      alert("Error creating PDF. Please try again or take a screenshot.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div style={{
      position: "fixed",
      inset: 0,
      zIndex: 90,
      backgroundColor: "rgba(28, 25, 23, 0.75)",
      backdropFilter: "blur(4px)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "clamp(8px, 2.5vw, 16px)",
      boxSizing: "border-box"
    }}>
      <div style={{
        width: "100%",
        maxWidth: 460,
        backgroundColor: "#FAF7F2",
        borderRadius: 10,
        border: "2px solid var(--color-border-frame)",
        boxShadow: "var(--shadow-floating)",
        display: "flex",
        flexDirection: "column",
        maxHeight: "92vh",
        overflow: "hidden",
        boxSizing: "border-box"
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
              onClick={handleDownloadPdf}
              disabled={isGenerating}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: "7px 16px",
                borderRadius: "var(--radius-pill)",
                backgroundColor: downloadSuccess ? "#15803d" : "var(--color-ink)",
                color: "#FAF7F2",
                border: "none",
                fontFamily: "var(--font-serif)",
                fontSize: 12,
                fontWeight: 700,
                letterSpacing: 0.5,
                textTransform: "uppercase",
                cursor: isGenerating ? "not-allowed" : "pointer",
                opacity: isGenerating ? 0.7 : 1,
                transition: "background-color 0.2s ease"
              }}
              title="Download Invoice as PDF file"
            >
              {isGenerating ? (
                <>
                  <Loader2 size={13} className="spin-animation" />
                  <span>Generating...</span>
                </>
              ) : downloadSuccess ? (
                <>
                  <Check size={13} />
                  <span>Downloaded!</span>
                </>
              ) : (
                <>
                  <Download size={13} />
                  <span>Download PDF</span>
                </>
              )}
            </button>

            <button
              onClick={onClose}
              style={{
                width: 32,
                height: 32,
                borderRadius: "50%",
                backgroundColor: "#fff",
                border: "1px solid var(--color-border-frame)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "var(--color-ink)",
                cursor: "pointer"
              }}
              title="Close"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Printable Invoice Container */}
        <div style={{ padding: "12px 14px", overflowY: "auto", flex: 1, boxSizing: "border-box" }}>
          <div
            ref={invoiceRef}
            id="printable-digital-invoice"
            style={{
              backgroundColor: "#ffffff",
              padding: "clamp(14px, 3.5vw, 20px)",
              borderRadius: 6,
              border: "1.5px solid var(--color-border-frame)",
              boxShadow: "var(--shadow-sm)",
              color: "var(--color-ink)",
              fontFamily: "var(--font-serif)",
              boxSizing: "border-box"
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
                  Payee: <strong>{order.paymentDetails?.upiId || "q086839601@ybl"}</strong>
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

        {/* Bottom Modal Actions (Hidden during print) */}
        <div className="no-print" style={{
          padding: "12px 16px",
          borderTop: "1.5px solid var(--color-border-frame)",
          display: "flex",
          alignItems: "center",
          gap: 10,
          backgroundColor: "#FAF7F2",
          boxSizing: "border-box",
          width: "100%"
        }}>
          <button
            onClick={onClose}
            style={{
              padding: "10px 18px",
              borderRadius: "var(--radius-pill)",
              backgroundColor: "#ffffff",
              border: "1.5px solid var(--color-border-frame)",
              color: "var(--color-ink)",
              fontFamily: "var(--font-serif)",
              fontSize: 12.5,
              fontWeight: 700,
              cursor: "pointer",
              whiteSpace: "nowrap"
            }}
          >
            Close
          </button>

          {onOpenReview && (
            <button
              onClick={() => onOpenReview(order)}
              style={{
                flex: 1,
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 6,
                padding: "10px 16px",
                borderRadius: "var(--radius-pill)",
                backgroundColor: "#8A5738",
                color: "#FFFFFF",
                border: "none",
                fontFamily: "var(--font-serif)",
                fontSize: 12.5,
                fontWeight: 700,
                letterSpacing: 0.4,
                cursor: "pointer",
                boxShadow: "var(--shadow-sm)",
                whiteSpace: "nowrap"
              }}
            >
              <Star size={14} fill="#F59E0B" color="#F59E0B" />
              <span>Rate Meal & Dishes</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
