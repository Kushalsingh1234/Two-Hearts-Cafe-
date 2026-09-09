import React, { useState, useEffect } from "react";
import { X, Plus, Minus, Check, Sparkles } from "lucide-react";

export default function ItemDetailModal({ item, onClose, onAddToCart }) {
  if (!item) return null;

  // Selected options state: { "Milk Preference": { label: "Oat Milk", price: 40 } }
  const [selectedChoices, setSelectedChoices] = useState({});
  const [quantity, setQuantity] = useState(1);
  const [itemNote, setItemNote] = useState("");

  // Initialize default options
  useEffect(() => {
    if (item.options && item.options.length > 0) {
      const defaults = {};
      item.options.forEach((group) => {
        if (group.choices && group.choices.length > 0) {
          defaults[group.name] = group.choices[0];
        }
      });
      setSelectedChoices(defaults);
    }
  }, [item]);

  // Compute unit price
  const addonTotal = Object.values(selectedChoices).reduce(
    (acc, choice) => acc + (choice?.price || 0),
    0
  );
  const unitPrice = item.price + addonTotal;
  const totalPrice = unitPrice * quantity;

  const handleOptionSelect = (groupName, choice) => {
    setSelectedChoices((prev) => ({
      ...prev,
      [groupName]: choice
    }));
  };

  const handleConfirm = () => {
    const formattedChoices = Object.entries(selectedChoices).map(
      ([groupName, choice]) => `${choice.label}${choice.price > 0 ? ` (+₹${choice.price})` : ""}`
    );

    const cartItem = {
      cartItemId: `${item.id}_${Date.now()}`,
      id: item.id,
      name: item.name,
      basePrice: item.price,
      unitPrice,
      price: unitPrice,
      quantity,
      selectedOptions: formattedChoices,
      note: itemNote.trim(),
      imageUrl: item.imageUrl,
      isVeg: item.isVeg
    };

    onAddToCart(cartItem);
    onClose();
  };

  return (
    <div style={{
      position: "fixed",
      inset: 0,
      zIndex: 50,
      backgroundColor: "rgba(0, 0, 0, 0.6)",
      backdropFilter: "blur(4px)",
      display: "flex",
      alignItems: "flex-end",
      justifyContent: "center"
    }}>
      <div 
        className="animate-slide-up"
        style={{
          width: "100%",
          maxWidth: 520,
          backgroundColor: "#fff",
          borderTopLeftRadius: "var(--radius-lg)",
          borderTopRightRadius: "var(--radius-lg)",
          maxHeight: "90vh",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          boxShadow: "var(--shadow-float)"
        }}
      >
        {/* Modal Header with Image */}
        <div style={{ position: "relative", height: 180, backgroundColor: "#000" }}>
          <img
            src={item.imageUrl}
            alt={item.name}
            style={{ width: "100%", height: "100%", objectFit: "cover", opacity: 0.85 }}
          />
          <button
            onClick={onClose}
            style={{
              position: "absolute",
              top: 14,
              right: 14,
              backgroundColor: "rgba(0, 0, 0, 0.5)",
              color: "#fff",
              width: 32,
              height: 32,
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center"
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div style={{
          padding: 18,
          overflowY: "auto",
          flex: 1,
          display: "flex",
          flexDirection: "column",
          gap: 16
        }}>
          {/* Title & Price */}
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
              {item.isVeg ? <span className="veg-indicator" /> : <span className="non-veg-indicator" />}
              <h3 style={{ fontSize: 18, fontWeight: 700, color: "var(--text-main)" }}>
                {item.name}
              </h3>
            </div>
            <p style={{ fontSize: 13, color: "var(--text-muted)", lineHeight: 1.4 }}>
              {item.description}
            </p>
          </div>

          {/* Customization Options */}
          {item.options && item.options.map((group) => (
            <div key={group.name} style={{
              borderTop: "1px solid var(--border-light)",
              paddingTop: 12
            }}>
              <div style={{
                fontSize: 13,
                fontWeight: 700,
                color: "var(--color-brand-dark)",
                marginBottom: 8,
                textTransform: "uppercase",
                letterSpacing: 0.5
              }}>
                {group.name}
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {group.choices.map((choice) => {
                  const isSelected = selectedChoices[group.name]?.label === choice.label;

                  return (
                    <div
                      key={choice.label}
                      onClick={() => handleOptionSelect(group.name, choice)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "8px 12px",
                        borderRadius: "var(--radius-sm)",
                        border: isSelected ? "1.5px solid var(--color-accent)" : "1px solid var(--border-light)",
                        backgroundColor: isSelected ? "var(--color-accent-light)" : "var(--bg-card)",
                        cursor: "pointer",
                        transition: "all 0.15s"
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <div style={{
                          width: 18,
                          height: 18,
                          borderRadius: "50%",
                          border: isSelected ? "5px solid var(--color-accent)" : "2px solid #ccc",
                          backgroundColor: "#fff"
                        }} />
                        <span style={{ fontSize: 14, fontWeight: isSelected ? 600 : 400 }}>
                          {choice.label}
                        </span>
                      </div>
                      {choice.price > 0 && (
                        <span style={{ fontSize: 13, fontWeight: 600, color: "var(--color-accent)" }}>
                          +₹{choice.price}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}

          {/* Kitchen Note */}
          <div style={{ borderTop: "1px solid var(--border-light)", paddingTop: 12 }}>
            <label style={{
              fontSize: 12,
              fontWeight: 700,
              color: "var(--text-muted)",
              display: "block",
              marginBottom: 6
            }}>
              Special request for kitchen (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. extra hot, no cinnamon, less ice"
              value={itemNote}
              onChange={(e) => setItemNote(e.target.value)}
              style={{
                width: "100%",
                padding: "8px 12px",
                borderRadius: "var(--radius-sm)",
                border: "1px solid var(--border-light)",
                fontSize: 13,
                outline: "none"
              }}
            />
          </div>
        </div>

        {/* Modal Footer */}
        <div style={{
          padding: "12px 18px",
          borderTop: "1px solid var(--border-light)",
          backgroundColor: "#fff",
          display: "flex",
          alignItems: "center",
          gap: 14
        }}>
          {/* Quantity Stepper */}
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            border: "1px solid var(--border-light)",
            borderRadius: "var(--radius-full)",
            padding: "6px 14px"
          }}>
            <button
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
              disabled={quantity <= 1}
              style={{ color: quantity <= 1 ? "#ccc" : "var(--color-brand-dark)" }}
            >
              <Minus size={16} />
            </button>
            <span style={{ fontSize: 15, fontWeight: 700, minWidth: 20, textAlign: "center" }}>
              {quantity}
            </span>
            <button
              onClick={() => setQuantity(quantity + 1)}
              style={{ color: "var(--color-brand-dark)" }}
            >
              <Plus size={16} />
            </button>
          </div>

          {/* Add to Cart Button */}
          <button
            onClick={handleConfirm}
            style={{
              flex: 1,
              backgroundColor: "var(--color-brand-dark)",
              color: "#fff",
              padding: "12px 16px",
              borderRadius: "var(--radius-full)",
              fontSize: 14,
              fontWeight: 700,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              boxShadow: "var(--shadow-md)"
            }}
          >
            <span>Add to Order</span>
            <span>₹{totalPrice}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
