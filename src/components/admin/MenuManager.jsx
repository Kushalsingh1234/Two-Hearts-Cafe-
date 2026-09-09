import React, { useState } from "react";
import { Plus, Trash2, RefreshCw, X } from "lucide-react";
import { saveMenuItem, deleteMenuItem, toggleItemAvailability, seedMenuToFirestore } from "../../firebase/services";

export default function MenuManager({ menuItems }) {
  const [isAddingItem, setIsAddingItem] = useState(false);
  const [isSeeding, setIsSeeding] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    category: "pasta",
    price: "",
    description: "",
    isSpecial: false
  });

  const handleToggleStock = async (item) => {
    await toggleItemAvailability(item.id, !item.isAvailable);
  };

  const handleDelete = async (itemId) => {
    if (confirm("Delete this menu item?")) {
      await deleteMenuItem(itemId);
    }
  };

  const handleSaveNewItem = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.price) {
      alert("Please enter item name and price.");
      return;
    }

    const payload = {
      name: formData.name,
      category: formData.category,
      price: Number(formData.price),
      description: formData.description,
      isSpecial: Boolean(formData.isSpecial),
      isAvailable: true
    };

    await saveMenuItem(payload);
    setIsAddingItem(false);
    setFormData({
      name: "",
      category: "pasta",
      price: "",
      description: "",
      isSpecial: false
    });
  };

  const handleResetToPrinted = async () => {
    setIsSeeding(true);
    const res = await seedMenuToFirestore();
    setIsSeeding(false);
    if (res.success) {
      alert("Seeded Two Hearts Cafe menu (Pasta, Sandwiches, Noodles, Maggie) to Firestore!");
    } else {
      alert("Saved menu to local cache: " + res.error);
    }
  };

  return (
    <div>
      {/* Top Header */}
      <div style={{
        display: "flex",
        flexWrap: "wrap",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 12,
        marginBottom: 20
      }}>
        <div>
          <h2 style={{
            fontFamily: "var(--font-serif)",
            fontSize: 24,
            fontWeight: 700,
            color: "var(--color-ink)"
          }}>
            Menu & Inventory Manager
          </h2>
          <p style={{ fontFamily: "var(--font-serif)", fontStyle: "italic", fontSize: 14, color: "var(--color-bronze)" }}>
            Toggle live dish availability (In Stock / Sold Out) and manage pricing.
          </p>
        </div>

        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={handleResetToPrinted}
            disabled={isSeeding}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "8px 16px",
              borderRadius: "var(--radius-pill)",
              backgroundColor: "#fff",
              border: "1.2px solid var(--color-border-frame)",
              fontFamily: "var(--font-serif)",
              fontSize: 13,
              fontWeight: 700,
              letterSpacing: 0.5,
              textTransform: "uppercase",
              color: "var(--color-ink)"
            }}
          >
            <RefreshCw size={13} className={isSeeding ? "animate-spin" : ""} />
            <span>Reset to Printed Menu</span>
          </button>

          <button
            onClick={() => setIsAddingItem(true)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "8px 18px",
              borderRadius: "var(--radius-pill)",
              backgroundColor: "var(--color-ink)",
              color: "#FAF7F2",
              fontFamily: "var(--font-serif)",
              fontSize: 13,
              fontWeight: 700,
              letterSpacing: 0.5,
              textTransform: "uppercase"
            }}
          >
            <Plus size={15} />
            <span>Add New Dish</span>
          </button>
        </div>
      </div>

      {/* Items Table */}
      <div style={{
        backgroundColor: "#fff",
        borderRadius: 4,
        border: "1px solid var(--border-color)",
        overflowX: "auto",
        width: "100%",
        boxSizing: "border-box",
        boxShadow: "var(--shadow-sm)"
      }}>
        <div style={{ minWidth: 600 }}>
          <div style={{
          display: "grid",
          gridTemplateColumns: "2fr 1fr 1fr 140px 70px",
          padding: "12px 16px",
          backgroundColor: "#FAF7F2",
          borderBottom: "1.2px solid var(--color-border-frame)",
          fontFamily: "var(--font-serif)",
          fontSize: 13,
          fontWeight: 700,
          color: "var(--color-ink)",
          textTransform: "uppercase",
          letterSpacing: 1
        }}>
          <div>Dish Name & Description</div>
          <div>Category</div>
          <div>Price</div>
          <div>Stock Status</div>
          <div style={{ textAlign: "right" }}>Action</div>
        </div>

        <div>
          {menuItems.map((item) => (
            <div
              key={item.id}
              style={{
                display: "grid",
                gridTemplateColumns: "2fr 1fr 1fr 140px 70px",
                alignItems: "center",
                padding: "12px 16px",
                borderBottom: "1px dashed var(--color-border-subtle)",
                fontSize: 14
              }}
            >
              {/* Name & Desc */}
              <div style={{ paddingRight: 12 }}>
                <div style={{ fontFamily: "var(--font-serif)", fontSize: 16, fontWeight: 700, color: "var(--color-ink)" }}>
                  {item.name}
                </div>
                {item.description && (
                  <div style={{ fontFamily: "var(--font-serif)", fontStyle: "italic", fontSize: 12, color: "var(--color-bronze)", marginTop: 2 }}>
                    {item.description}
                  </div>
                )}
              </div>

              {/* Category */}
              <div style={{
                fontFamily: "var(--font-serif)",
                textTransform: "uppercase",
                letterSpacing: 0.5,
                fontSize: 13,
                color: "var(--color-bronze)"
              }}>
                {item.category}
              </div>

              {/* Price */}
              <div style={{ fontFamily: "var(--font-serif)", fontSize: 16, fontWeight: 700, color: "var(--color-ink)" }}>
                Rs.{item.price}
              </div>

              {/* In Stock Toggle */}
              <div>
                <button
                  onClick={() => handleToggleStock(item)}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    padding: "3px 10px",
                    borderRadius: "var(--radius-pill)",
                    fontFamily: "var(--font-serif)",
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: "pointer",
                    backgroundColor: item.isAvailable !== false ? "#dcfce7" : "#fee2e2",
                    color: item.isAvailable !== false ? "#15803d" : "#dc2626",
                    border: item.isAvailable !== false ? "1px solid #86efac" : "1px solid #fca5a5"
                  }}
                >
                  <span style={{
                    width: 6,
                    height: 6,
                    borderRadius: "50%",
                    backgroundColor: item.isAvailable !== false ? "#15803d" : "#dc2626"
                  }} />
                  <span>{item.isAvailable !== false ? "In Stock" : "Sold Out"}</span>
                </button>
              </div>

              {/* Delete */}
              <div style={{ textAlign: "right" }}>
                <button
                  onClick={() => handleDelete(item.id)}
                  style={{ color: "#dc2626", padding: 4 }}
                  title="Delete dish"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          ))}
        </div>
        </div>
      </div>

      {/* Add New Item Modal */}
      {isAddingItem && (
        <div style={{
          position: "fixed",
          inset: 0,
          zIndex: 80,
          backgroundColor: "rgba(0,0,0,0.5)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 16
        }}>
          <div style={{
            backgroundColor: "#FAF7F2",
            borderRadius: 4,
            border: "1.5px solid var(--color-border-frame)",
            padding: 24,
            width: "100%",
            maxWidth: 480,
            boxShadow: "var(--shadow-floating)"
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <h3 style={{ fontFamily: "var(--font-serif)", fontSize: 20, fontWeight: 700, color: "var(--color-ink)" }}>
                Add New Dish to Menu
              </h3>
              <button onClick={() => setIsAddingItem(false)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveNewItem} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div>
                <label style={{ fontFamily: "var(--font-serif)", fontSize: 13, fontWeight: 700, display: "block", marginBottom: 4 }}>
                  Dish Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. White Sauce Penne Pasta"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    borderRadius: 2,
                    border: "1px solid var(--color-border-frame)",
                    fontFamily: "var(--font-serif)",
                    fontSize: 15,
                    outline: "none",
                    backgroundColor: "#fff"
                  }}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label style={{ fontFamily: "var(--font-serif)", fontSize: 13, fontWeight: 700, display: "block", marginBottom: 4 }}>
                    Category *
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    style={{
                      width: "100%",
                      padding: "8px 12px",
                      borderRadius: 2,
                      border: "1px solid var(--color-border-frame)",
                      fontFamily: "var(--font-serif)",
                      fontSize: 14,
                      outline: "none",
                      backgroundColor: "#fff"
                    }}
                  >
                    <option value="pasta">Pasta</option>
                    <option value="sandwiches">Sandwiches</option>
                    <option value="noodles">Noodles</option>
                    <option value="maggie">Maggie</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontFamily: "var(--font-serif)", fontSize: 13, fontWeight: 700, display: "block", marginBottom: 4 }}>
                    Price (Rs.) *
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    placeholder="139"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    style={{
                      width: "100%",
                      padding: "8px 12px",
                      borderRadius: 2,
                      border: "1px solid var(--color-border-frame)",
                      fontFamily: "var(--font-serif)",
                      fontSize: 15,
                      outline: "none",
                      backgroundColor: "#fff"
                    }}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontFamily: "var(--font-serif)", fontSize: 13, fontWeight: 700, display: "block", marginBottom: 4 }}>
                  Description
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Penne tossed in cheese cream sauce with vegetables"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    borderRadius: 2,
                    border: "1px solid var(--color-border-frame)",
                    fontFamily: "var(--font-serif)",
                    fontStyle: "italic",
                    fontSize: 14,
                    outline: "none",
                    backgroundColor: "#fff",
                    resize: "none"
                  }}
                />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 10 }}>
                <button
                  type="button"
                  onClick={() => setIsAddingItem(false)}
                  style={{
                    padding: "6px 14px",
                    borderRadius: "var(--radius-pill)",
                    border: "1px solid var(--color-border-frame)",
                    fontFamily: "var(--font-serif)",
                    fontSize: 13,
                    fontWeight: 600
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{
                    backgroundColor: "var(--color-ink)",
                    color: "#FAF7F2",
                    padding: "6px 18px",
                    borderRadius: "var(--radius-pill)",
                    fontFamily: "var(--font-serif)",
                    fontSize: 13,
                    fontWeight: 700
                  }}
                >
                  Save Dish
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
