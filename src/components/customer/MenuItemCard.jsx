import React, { useState } from "react";
import { Plus, Minus, MessageSquare, Star } from "lucide-react";

export default function MenuItemCard({
  item,
  cartQuantity,
  cartItems = [],
  onAddToCart,
  onUpdateQty
}) {
  const [showNoteInput, setShowNoteInput] = useState(false);
  const [customNote, setCustomNote] = useState("");
  const isOutOfStock = item.isAvailable === false;
  const hasPortions = Boolean(item.portions && item.portions.length > 0);

  const handleAdd = () => {
    if (isOutOfStock) return;
    onAddToCart({
      ...item,
      note: customNote.trim()
    });
    setCustomNote("");
    setShowNoteInput(false);
  };

  return (
    <div style={{
      backgroundColor: isOutOfStock ? "#f4f4f5" : "#ffffff",
      borderRadius: "var(--radius-sm)",
      border: isOutOfStock ? "1px solid #e4e4e7" : "1px solid var(--border-color)",
      padding: "12px 14px",
      marginBottom: 10,
      opacity: isOutOfStock ? 0.72 : 1,
      boxShadow: isOutOfStock ? "none" : "var(--shadow-sm)",
      width: "100%",
      boxSizing: "border-box",
      transition: "background-color 0.2s"
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
            alignItems: "center",
            gap: 6
          }}>
            <span style={{
              fontFamily: "var(--font-serif)",
              fontSize: 16,
              fontWeight: 700,
              color: isOutOfStock ? "#71717a" : "var(--color-ink)",
              lineHeight: 1.25
            }}>
              {item.name}
            </span>
            {isOutOfStock && (
              <span style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 4,
                fontSize: 10.5,
                fontFamily: "var(--font-serif)",
                fontWeight: 700,
                letterSpacing: 0.5,
                textTransform: "uppercase",
                color: "#52525b",
                backgroundColor: "#e4e4e7",
                border: "1px solid #d4d4d8",
                padding: "2px 8px",
                borderRadius: "var(--radius-pill)"
              }}>
                <span style={{ width: 5, height: 5, borderRadius: "50%", backgroundColor: "#71717a" }} />
                Out of Stock
              </span>
            )}
            {item.isSpecial && !isOutOfStock && (
              <span style={{
                display: "inline-flex",
                alignItems: "center",
                fontSize: 12,
                fontFamily: "var(--font-serif)",
                fontStyle: "italic",
                fontWeight: 600,
                color: "#7A442D",
                border: "1.5px solid #8C533E",
                padding: "1px 7px 2px 7px",
                borderRadius: 4,
                backgroundColor: "transparent",
                lineHeight: 1.2
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
                color: isOutOfStock ? "#71717a" : "#b45309",
                backgroundColor: isOutOfStock ? "#e4e4e7" : "#fef3c7",
                padding: "1px 6px",
                borderRadius: "var(--radius-pill)",
                border: isOutOfStock ? "1px solid #d4d4d8" : "1px solid #fde68a"
              }}>
                <Star size={10} fill={isOutOfStock ? "#71717a" : "#f59e0b"} color={isOutOfStock ? "#71717a" : "#f59e0b"} />
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
              color: isOutOfStock ? "#a1a1aa" : "var(--color-bronze)",
              marginTop: 3,
              lineHeight: 1.35
            }}>
              {item.description}
            </p>
          )}

          {/* Standard Price (only if NOT multi-portion) */}
          {!hasPortions && (
            <div style={{
              fontFamily: "var(--font-serif)",
              fontSize: 15,
              fontWeight: 700,
              color: isOutOfStock ? "#71717a" : "var(--color-ink)",
              marginTop: 6
            }}>
              Rs.{item.price}
            </div>
          )}
        </div>

        {/* Action Button on the right (only if NOT multi-portion) */}
        {!hasPortions && (
          <div style={{ flexShrink: 0, marginTop: 2 }}>
          {isOutOfStock ? (
            <button
              type="button"
              disabled
              aria-disabled="true"
              title="This dish is currently out of stock and cannot be ordered"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 4,
                fontSize: 11,
                fontFamily: "var(--font-serif)",
                fontWeight: 700,
                letterSpacing: 0.5,
                textTransform: "uppercase",
                color: "#71717a",
                backgroundColor: "#e4e4e7",
                border: "1px solid #d4d4d8",
                padding: "5px 10px",
                borderRadius: "var(--radius-pill)",
                cursor: "not-allowed",
                userSelect: "none"
              }}
            >
              <span style={{ width: 6, height: 6, borderRadius: "50%", backgroundColor: "#71717a" }} />
              Out of Stock
            </button>
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
        )}
      </div>

      {/* Portion Options (Half & Full) */}
      {hasPortions && (
        <div style={{
          marginTop: 10,
          paddingTop: 8,
          borderTop: isOutOfStock ? "1px solid #e4e4e7" : "1px solid var(--border-color)",
          display: "flex",
          flexDirection: "column",
          gap: 6
        }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{
              fontSize: 11,
              fontFamily: "var(--font-serif)",
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: 0.8,
              color: "var(--color-bronze)"
            }}>
              Portion Options
            </span>
            <span style={{
              fontSize: 10.5,
              fontFamily: "var(--font-serif)",
              fontStyle: "italic",
              color: "var(--color-ink-soft)"
            }}>
              Choose Half or Full
            </span>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            {item.portions.map((portion) => {
              const portionId = `${item.id}_${portion.id}`;
              const pInCart = cartItems ? cartItems.find((c) => c.id === portionId) : null;
              const pQty = pInCart ? pInCart.quantity : 0;
              const isHalf = portion.id === "half";

              return (
                <div
                  key={portion.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "6px 8px",
                    backgroundColor: pQty > 0 ? "rgba(82, 162, 111, 0.08)" : "#FAFAFA",
                    border: pQty > 0 ? "1.5px solid rgba(82, 162, 111, 0.5)" : "1px solid var(--border-color)",
                    borderRadius: "var(--radius-sm)",
                    gap: 6
                  }}
                >
                  <div>
                    <div style={{
                      fontSize: 11,
                      fontFamily: "var(--font-serif)",
                      fontWeight: 700,
                      textTransform: "uppercase",
                      color: isHalf ? "#6B21A8" : "#92400E"
                    }}>
                      {portion.label}
                    </div>
                    <div style={{
                      fontSize: 14,
                      fontFamily: "var(--font-serif)",
                      fontWeight: 700,
                      color: isOutOfStock ? "#71717a" : "var(--color-ink)"
                    }}>
                      Rs.{portion.price}
                    </div>
                  </div>

                  {isOutOfStock ? (
                    <span style={{ fontSize: 10, color: "#71717a" }}>N/A</span>
                  ) : pQty > 0 ? (
                    <div style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 4,
                      border: "1px solid var(--color-ink)",
                      backgroundColor: "#fff",
                      borderRadius: "var(--radius-pill)",
                      padding: "2px 5px"
                    }}>
                      <button
                        type="button"
                        onClick={() => onUpdateQty(portionId, pQty - 1)}
                        style={{ color: "var(--color-ink)", display: "flex", alignItems: "center", background: "none", border: "none", cursor: "pointer", padding: 0 }}
                      >
                        <Minus size={11} />
                      </button>
                      <span style={{
                        fontFamily: "var(--font-serif)",
                        fontSize: 12,
                        fontWeight: 700,
                        minWidth: 14,
                        textAlign: "center"
                      }}>
                        {pQty}
                      </span>
                      <button
                        type="button"
                        onClick={() => onUpdateQty(portionId, pQty + 1)}
                        style={{ color: "var(--color-ink)", display: "flex", alignItems: "center", background: "none", border: "none", cursor: "pointer", padding: 0 }}
                      >
                        <Plus size={11} />
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => onAddToCart({
                        ...item,
                        id: portionId,
                        name: `${item.name} (${portion.label})`,
                        price: portion.price,
                        portion: portion.label,
                        baseDishId: item.id,
                        note: customNote.trim()
                      })}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 3,
                        fontSize: 11,
                        fontWeight: 700,
                        fontFamily: "var(--font-serif)",
                        color: "var(--color-ink)",
                        border: "1.2px solid var(--color-ink)",
                        backgroundColor: "#fff",
                        borderRadius: "var(--radius-pill)",
                        padding: "3px 8px",
                        cursor: "pointer"
                      }}
                    >
                      <Plus size={10} />
                      <span>ADD</span>
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Optional Note for kitchen */}
      {(cartQuantity > 0 || (cartItems && cartItems.some((c) => c.baseDishId === item.id))) && (
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
