import React, { useState } from "react";
import { Plus, Minus, MessageSquare, Star } from "lucide-react";

export default function MenuItemCard({
  item,
  cartQuantity,
  onAddToCart,
  onUpdateQty
}) {
  const [showNoteInput, setShowNoteInput] = useState(false);
  const [customNote, setCustomNote] = useState("");
  const isOutOfStock = item.isAvailable === false;

  const handleAdd = () => {
    onAddToCart({
      ...item,
      note: customNote.trim()
    });
    setCustomNote("");
    setShowNoteInput(false);
  };

  return (
    <div style={{
      backgroundColor: "#ffffff",
      borderRadius: "var(--radius-sm)",
      border: "1px solid var(--border-color)",
      padding: "12px 14px",
      marginBottom: 10,
      opacity: isOutOfStock ? 0.5 : 1,
      boxShadow: "var(--shadow-sm)",
      width: "100%",
      boxSizing: "border-box"
    }}>
      {/* Top Details & Action */}
      <div style={{
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "space-between",
        gap: 12
      }}>
        {/* Name and Price */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            display: "flex",
            flexWrap: "wrap",
            alignItems: "baseline",
            gap: 6
          }}>
            <span style={{
              fontFamily: "var(--font-serif)",
              fontSize: 16,
              fontWeight: 700,
              color: "var(--color-ink)",
              lineHeight: 1.25
            }}>
              {item.name}
            </span>
            {item.isSpecial && (
              <span style={{
                fontSize: 10,
                fontFamily: "var(--font-serif)",
                fontStyle: "italic",
                color: "var(--color-bronze)",
                border: "1px solid var(--color-bronze)",
                padding: "0 4px",
                borderRadius: 2
              }}>
                Special
              </span>
            )}
            {item.rating && (
              <span style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 2.5,
                fontSize: 11,
                fontFamily: "var(--font-serif)",
                fontWeight: 700,
                color: "#b45309",
                backgroundColor: "#fef3c7",
                padding: "1px 6px",
                borderRadius: "var(--radius-pill)",
                border: "1px solid #fde68a"
              }}>
                <Star size={10} fill="#f59e0b" color="#f59e0b" />
                <span>{item.rating.toFixed(1)}</span>
                {item.ratingCount ? <span style={{ opacity: 0.75, fontSize: 9.5 }}>({item.ratingCount})</span> : null}
              </span>
            )}
          </div>

          {/* Description (matching the warm bronze italic typography of the menu) */}
          {item.description && (
            <p style={{
              fontFamily: "var(--font-serif)",
              fontStyle: "italic",
              fontSize: 13,
              color: "var(--color-bronze)",
              marginTop: 3,
              lineHeight: 1.35
            }}>
              {item.description}
            </p>
          )}

          {/* Price */}
          <div style={{
            fontFamily: "var(--font-serif)",
            fontSize: 15,
            fontWeight: 700,
            color: "var(--color-ink)",
            marginTop: 6
          }}>
            Rs.{item.price}
          </div>
        </div>

        {/* Action Button on the right */}
        <div style={{ flexShrink: 0, marginTop: 2 }}>
          {isOutOfStock ? (
            <span style={{
              fontSize: 11,
              fontFamily: "var(--font-serif)",
              fontStyle: "italic",
              color: "#dc2626",
              backgroundColor: "#fee2e2",
              padding: "3px 8px",
              borderRadius: "var(--radius-pill)"
            }}>
              Sold Out
            </span>
          ) : cartQuantity > 0 ? (
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              border: "1.2px solid var(--color-ink)",
              backgroundColor: "#fff",
              borderRadius: "var(--radius-pill)",
              padding: "3px 8px"
            }}>
              <button
                onClick={() => onUpdateQty(item.id, cartQuantity - 1)}
                style={{ color: "var(--color-ink)", display: "flex", alignItems: "center" }}
              >
                <Minus size={13} />
              </button>
              <span style={{
                fontFamily: "var(--font-serif)",
                fontSize: 14,
                fontWeight: 700,
                minWidth: 16,
                textAlign: "center"
              }}>
                {cartQuantity}
              </span>
              <button
                onClick={() => onUpdateQty(item.id, cartQuantity + 1)}
                style={{ color: "var(--color-ink)", display: "flex", alignItems: "center" }}
              >
                <Plus size={13} />
              </button>
            </div>
          ) : (
            <button
              onClick={handleAdd}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 3,
                padding: "5px 14px",
                borderRadius: "var(--radius-pill)",
                border: "1.2px solid var(--color-ink)",
                backgroundColor: "#fff",
                color: "var(--color-ink)",
                fontSize: 12,
                fontFamily: "var(--font-serif)",
                fontWeight: 700,
                letterSpacing: 0.5,
                textTransform: "uppercase",
                boxShadow: "0 1px 3px rgba(0,0,0,0.05)"
              }}
            >
              <Plus size={12} />
              <span>Add</span>
            </button>
          )}
        </div>
      </div>

      {/* Optional Note for kitchen */}
      {cartQuantity > 0 && (
        <div style={{ marginTop: 8, paddingTop: 6, borderTop: "1px dashed var(--border-color)" }}>
          {!showNoteInput ? (
            <button
              onClick={() => setShowNoteInput(true)}
              style={{
                fontSize: 11,
                fontFamily: "var(--font-serif)",
                fontStyle: "italic",
                color: "var(--color-bronze)",
                display: "inline-flex",
                alignItems: "center",
                gap: 4
              }}
            >
              <MessageSquare size={11} />
              <span>{item.note ? `Note: "${item.note}" (Edit)` : "Add cooking instruction"}</span>
            </button>
          ) : (
            <div style={{ display: "flex", gap: 6, marginTop: 4 }}>
              <input
                type="text"
                placeholder="e.g. extra spicy, less salt, cut in half"
                value={customNote}
                onChange={(e) => setCustomNote(e.target.value)}
                style={{
                  flex: 1,
                  padding: "4px 8px",
                  borderRadius: 4,
                  border: "1px solid var(--border-color)",
                  fontSize: 12,
                  fontFamily: "var(--font-serif)",
                  fontStyle: "italic",
                  outline: "none"
                }}
              />
              <button
                onClick={() => {
                  if (customNote.trim()) {
                    onAddToCart({ ...item, note: customNote.trim(), quantity: cartQuantity });
                  }
                  setShowNoteInput(false);
                }}
                style={{
                  padding: "4px 10px",
                  backgroundColor: "var(--color-bronze)",
                  color: "#fff",
                  fontSize: 11,
                  fontFamily: "var(--font-serif)",
                  fontWeight: 600,
                  borderRadius: 4
                }}
              >
                Save
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
