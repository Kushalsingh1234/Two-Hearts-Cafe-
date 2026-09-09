import React, { useState, useMemo } from "react";
import { Plus, Trash2, RefreshCw, X, Edit3, Check } from "lucide-react";
import {
  saveMenuItem,
  deleteMenuItem,
  toggleItemAvailability,
  seedMenuToFirestore,
  updateMenuItemPrice
} from "../../firebase/services";

export default function MenuManager({ menuItems }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState("add"); // 'add' | 'edit'
  const [editingItemId, setEditingItemId] = useState(null);
  const [isSeeding, setIsSeeding] = useState(false);

  // Inline price quick-editing state
  const [editingPriceId, setEditingPriceId] = useState(null);
  const [tempPrice, setTempPrice] = useState("");
  const [isSavingPrice, setIsSavingPrice] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    name: "",
    category: "pasta",
    newCategoryName: "",
    price: "",
    description: "",
    isSpecial: false
  });

  // Dynamically extract all categories from menuItems plus standard ones
  const availableCategories = useMemo(() => {
    const standard = [
      { id: "pasta", label: "Pasta" },
      { id: "pizza", label: "Pizza" },
      { id: "burger", label: "Burger" },
      { id: "sandwiches", label: "Sandwiches" },
      { id: "momo", label: "Momo" },
      { id: "roll", label: "Rolls" },
      { id: "combo", label: "Combos" },
      { id: "platter", label: "Platter" },
      { id: "desi", label: "Desi Cuisine" },
      { id: "breads", label: "Breads" },
      { id: "noodles", label: "Noodles" },
      { id: "rice", label: "Rice" },
      { id: "paneer", label: "Paneer" },
      { id: "snacks", label: "Snacks" },
      { id: "waffles", label: "Waffles" },
      { id: "shakes", label: "Shakes & Drinks" },
      { id: "maggie", label: "Maggie" }
    ];
    const map = new Map();
    standard.forEach((s) => map.set(s.id.toLowerCase(), s.label));

    menuItems.forEach((item) => {
      if (item.category) {
        const key = item.category.toLowerCase().trim();
        if (!map.has(key)) {
          const label = item.categoryTitle || (item.category.charAt(0).toUpperCase() + item.category.slice(1));
          map.set(key, label);
        }
      }
    });

    return Array.from(map.entries()).map(([id, label]) => ({ id, label }));
  }, [menuItems]);

  const handleToggleStock = async (item) => {
    await toggleItemAvailability(item.id, !item.isAvailable);
  };

  const handleDelete = async (itemId) => {
    if (confirm("Delete this menu item?")) {
      await deleteMenuItem(itemId);
    }
  };

  const handleOpenAddModal = () => {
    setModalMode("add");
    setEditingItemId(null);
    setFormData({
      name: "",
      category: availableCategories[0]?.id || "pasta",
      newCategoryName: "",
      price: "",
      description: "",
      isSpecial: false
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (item) => {
    setModalMode("edit");
    setEditingItemId(item.id);
    setFormData({
      name: item.name || "",
      category: item.category || "pasta",
      newCategoryName: "",
      price: item.price ? String(item.price) : "",
      description: item.description || "",
      isSpecial: Boolean(item.isSpecial)
    });
    setIsModalOpen(true);
  };

  const handleSaveItem = async (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.price) {
      alert("Please enter item name and price.");
      return;
    }

    let finalCategory = formData.category;
    let finalCategoryTitle = "";

    if (formData.category === "__new__") {
      if (!formData.newCategoryName.trim()) {
        alert("Please enter the name of the new category.");
        return;
      }
      finalCategory = formData.newCategoryName.toLowerCase().trim().replace(/[^a-z0-9_-]/g, "_");
      finalCategoryTitle = formData.newCategoryName.trim();
    } else {
      const match = availableCategories.find((c) => c.id === formData.category.toLowerCase().trim());
      finalCategoryTitle = match ? match.label : formData.category;
    }

    const payload = {
      ...(editingItemId ? { id: editingItemId } : {}),
      name: formData.name.trim(),
      category: finalCategory,
      categoryTitle: finalCategoryTitle,
      price: Number(formData.price),
      description: formData.description.trim(),
      isSpecial: Boolean(formData.isSpecial),
      isAvailable: true
    };

    await saveMenuItem(payload);
    setIsModalOpen(false);
  };

  // Inline Quick Price Edit
  const handleStartInlinePriceEdit = (item) => {
    setEditingPriceId(item.id);
    setTempPrice(String(item.price));
  };

  const handleSaveInlinePrice = async (itemId) => {
    const num = Number(tempPrice);
    if (!tempPrice || isNaN(num) || num <= 0) {
      alert("Please enter a valid price greater than 0");
      return;
    }
    setIsSavingPrice(true);
    await updateMenuItemPrice(itemId, num);
    setIsSavingPrice(false);
    setEditingPriceId(null);
  };

  const handleResetToPrinted = async () => {
    if (!confirm("This will reset menu items to original printed menu (Pasta, Sandwiches, Noodles, Maggie). Continue?")) {
      return;
    }
    setIsSeeding(true);
    const res = await seedMenuToFirestore();
    setIsSeeding(false);
    if (res.success) {
      alert("Seeded Two Hearts Cafe menu to Firestore!");
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
            Edit prices inline or click edit, toggle dish stock, and add dishes with custom categories.
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
              color: "var(--color-ink)",
              cursor: isSeeding ? "not-allowed" : "pointer"
            }}
          >
            <RefreshCw size={13} className={isSeeding ? "animate-spin" : ""} />
            <span>Reset to Printed Menu</span>
          </button>

          <button
            onClick={handleOpenAddModal}
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
              textTransform: "uppercase",
              cursor: "pointer"
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
        <div style={{ minWidth: 640 }}>
          <div style={{
            display: "grid",
            gridTemplateColumns: "2fr 1fr 140px 130px 80px",
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
            <div>Price (Click to edit)</div>
            <div>Stock Status</div>
            <div style={{ textAlign: "right" }}>Action</div>
          </div>

          <div>
            {menuItems.map((item) => (
              <div
                key={item.id}
                style={{
                  display: "grid",
                  gridTemplateColumns: "2fr 1fr 140px 130px 80px",
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
                  color: "var(--color-bronze)",
                  fontWeight: 600
                }}>
                  {item.categoryTitle || item.category}
                </div>

                {/* Price (with Inline Edit) */}
                <div>
                  {editingPriceId === item.id ? (
                    <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                      <span style={{ fontFamily: "var(--font-serif)", fontWeight: 700, fontSize: 14 }}>Rs.</span>
                      <input
                        type="number"
                        min="1"
                        value={tempPrice}
                        onChange={(e) => setTempPrice(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleSaveInlinePrice(item.id);
                          if (e.key === "Escape") setEditingPriceId(null);
                        }}
                        autoFocus
                        style={{
                          width: 60,
                          padding: "3px 6px",
                          borderRadius: 3,
                          border: "1.5px solid var(--color-ink)",
                          fontSize: 14,
                          fontWeight: 700,
                          fontFamily: "var(--font-serif)",
                          outline: "none"
                        }}
                      />
                      <button
                        onClick={() => handleSaveInlinePrice(item.id)}
                        disabled={isSavingPrice}
                        title="Save price"
                        style={{
                          background: "var(--color-ink)",
                          color: "#fff",
                          border: "none",
                          borderRadius: 3,
                          padding: "4px",
                          cursor: "pointer",
                          display: "inline-flex",
                          alignItems: "center"
                        }}
                      >
                        <Check size={13} />
                      </button>
                      <button
                        onClick={() => setEditingPriceId(null)}
                        title="Cancel"
                        style={{
                          background: "#fee2e2",
                          color: "#dc2626",
                          border: "none",
                          borderRadius: 3,
                          padding: "4px",
                          cursor: "pointer",
                          display: "inline-flex",
                          alignItems: "center"
                        }}
                      >
                        <X size={13} />
                      </button>
                    </div>
                  ) : (
                    <div
                      onClick={() => handleStartInlinePriceEdit(item)}
                      title="Click to edit price"
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 6,
                        cursor: "pointer",
                        padding: "3px 6px",
                        borderRadius: 4,
                        border: "1px solid transparent",
                        transition: "all 0.15s"
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = "#F5EFEB";
                        e.currentTarget.style.borderColor = "var(--color-border-frame)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = "transparent";
                        e.currentTarget.style.borderColor = "transparent";
                      }}
                    >
                      <span style={{ fontFamily: "var(--font-serif)", fontSize: 16, fontWeight: 700, color: "var(--color-ink)" }}>
                        Rs.{item.price}
                      </span>
                      <Edit3 size={12} style={{ color: "var(--color-bronze)", opacity: 0.7 }} />
                    </div>
                  )}
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

                {/* Actions: Edit Dish + Delete */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 6 }}>
                  <button
                    onClick={() => handleOpenEditModal(item)}
                    style={{
                      color: "var(--color-ink)",
                      padding: 5,
                      borderRadius: 4,
                      cursor: "pointer",
                      background: "transparent",
                      border: "none",
                      display: "flex",
                      alignItems: "center"
                    }}
                    title="Edit dish details & price"
                  >
                    <Edit3 size={15} />
                  </button>
                  <button
                    onClick={() => handleDelete(item.id)}
                    style={{
                      color: "#dc2626",
                      padding: 5,
                      borderRadius: 4,
                      cursor: "pointer",
                      background: "transparent",
                      border: "none",
                      display: "flex",
                      alignItems: "center"
                    }}
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

      {/* Add / Edit Dish Modal */}
      {isModalOpen && (
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
            boxShadow: "var(--shadow-floating)",
            maxHeight: "90vh",
            overflowY: "auto"
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <h3 style={{ fontFamily: "var(--font-serif)", fontSize: 20, fontWeight: 700, color: "var(--color-ink)" }}>
                {modalMode === "add" ? "Add New Dish to Menu" : `Edit Dish: ${formData.name || "Item"}`}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                style={{ background: "transparent", border: "none", cursor: "pointer" }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveItem} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
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
                    boxSizing: "border-box",
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
                      boxSizing: "border-box",
                      padding: "8px 12px",
                      borderRadius: 2,
                      border: "1px solid var(--color-border-frame)",
                      fontFamily: "var(--font-serif)",
                      fontSize: 14,
                      outline: "none",
                      backgroundColor: "#fff",
                      cursor: "pointer"
                    }}
                  >
                    {availableCategories.map((c) => (
                      <option key={c.id} value={c.id}>{c.label}</option>
                    ))}
                    <option value="__new__">✨ + Add New Category...</option>
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
                      boxSizing: "border-box",
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

              {/* Conditional Input for New Category */}
              {formData.category === "__new__" && (
                <div style={{
                  padding: "10px 12px",
                  backgroundColor: "#fff",
                  border: "1px dashed var(--color-border-frame)",
                  borderRadius: 3
                }}>
                  <label style={{
                    fontFamily: "var(--font-serif)",
                    fontSize: 12,
                    fontWeight: 700,
                    display: "block",
                    marginBottom: 4,
                    color: "var(--color-bronze)",
                    textTransform: "uppercase",
                    letterSpacing: 0.5
                  }}>
                    New Category Name *
                  </label>
                  <input
                    type="text"
                    required
                    autoFocus
                    placeholder="e.g. Beverages, Desserts, Burgers, Shakes"
                    value={formData.newCategoryName}
                    onChange={(e) => setFormData({ ...formData, newCategoryName: e.target.value })}
                    style={{
                      width: "100%",
                      boxSizing: "border-box",
                      padding: "8px 12px",
                      borderRadius: 2,
                      border: "1px solid var(--color-ink)",
                      fontFamily: "var(--font-serif)",
                      fontSize: 14,
                      outline: "none",
                      backgroundColor: "#FAF7F2"
                    }}
                  />
                  <div style={{ fontSize: 11, fontStyle: "italic", color: "var(--color-bronze)", marginTop: 4 }}>
                    This category will immediately appear on the menu for customers and in staff filters.
                  </div>
                </div>
              )}

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
                    boxSizing: "border-box",
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
                  onClick={() => setIsModalOpen(false)}
                  style={{
                    padding: "7px 16px",
                    borderRadius: "var(--radius-pill)",
                    border: "1px solid var(--color-border-frame)",
                    fontFamily: "var(--font-serif)",
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: "pointer",
                    backgroundColor: "#fff"
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{
                    backgroundColor: "var(--color-ink)",
                    color: "#FAF7F2",
                    padding: "7px 20px",
                    borderRadius: "var(--radius-pill)",
                    border: "none",
                    fontFamily: "var(--font-serif)",
                    fontSize: 13,
                    fontWeight: 700,
                    cursor: "pointer"
                  }}
                >
                  {modalMode === "add" ? "Save Dish" : "Update Dish & Price"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
