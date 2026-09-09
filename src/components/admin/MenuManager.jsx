import React, { useState, useMemo } from "react";
import { Plus, Trash2, RefreshCw, X, Edit3, Check, Search, Tag } from "lucide-react";
import {
  saveMenuItem,
  deleteMenuItem,
  toggleItemAvailability,
  seedMenuToFirestore,
  updateMenuItemPrice
} from "../../firebase/services";

export default function MenuManager({ menuItems }) {
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

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

  // Group items by category with item count for categorized view
  const categoryGroups = useMemo(() => {
    const map = new Map();

    // Map existing items to their respective category
    menuItems.forEach((item) => {
      const catKey = (item.category || "other").toLowerCase().trim();
      if (!map.has(catKey)) {
        const matched = availableCategories.find((c) => c.id === catKey);
        const label = item.categoryTitle || (matched ? matched.label : (catKey.charAt(0).toUpperCase() + catKey.slice(1)));
        map.set(catKey, { id: catKey, label, items: [] });
      }
      map.get(catKey).items.push(item);
    });

    return Array.from(map.values());
  }, [availableCategories, menuItems]);

  // Filtered category groups based on selected category & search query
  const filteredGroups = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();

    return categoryGroups
      .filter((group) => selectedCategory === "all" || group.id === selectedCategory)
      .map((group) => {
        const matchingItems = group.items.filter((item) => {
          if (!q) return true;
          return item.name.toLowerCase().includes(q) || (item.description || "").toLowerCase().includes(q);
        });
        return { ...group, items: matchingItems };
      })
      .filter((group) => group.items.length > 0);
  }, [categoryGroups, selectedCategory, searchQuery]);

  const handleToggleStock = async (item) => {
    await toggleItemAvailability(item.id, !item.isAvailable);
  };

  const handleDelete = async (itemId) => {
    const item = menuItems.find((i) => i.id === itemId);
    const itemName = item ? `"${item.name}"` : "this dish";
    if (confirm(`Are you sure you want to remove ${itemName} from the menu?`)) {
      await deleteMenuItem(itemId);
    }
  };

  const handleOpenAddModal = (presetCategory = null) => {
    setModalMode("add");
    setEditingItemId(null);
    setFormData({
      name: "",
      category: presetCategory || availableCategories[0]?.id || "pasta",
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
            Menu & Pricing Manager
          </h2>
          <p style={{ fontFamily: "var(--font-serif)", fontStyle: "italic", fontSize: 14, color: "var(--color-bronze)" }}>
            Categorized view to quickly update dish pricing, stock availability, or remove items.
          </p>
        </div>

        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
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
            onClick={() => handleOpenAddModal()}
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

      {/* Category Bar & Search Filter (Just like customer side) */}
      <div style={{
        backgroundColor: "#fff",
        borderRadius: 6,
        border: "1px solid var(--border-color)",
        padding: "14px 16px",
        marginBottom: 20,
        boxShadow: "var(--shadow-sm)"
      }}>
        {/* Search Bar */}
        <div style={{ position: "relative", marginBottom: 12 }}>
          <Search size={15} style={{
            position: "absolute",
            left: 12,
            top: "50%",
            transform: "translateY(-50%)",
            color: "var(--color-bronze)"
          }} />
          <input
            type="text"
            placeholder="Search dishes by name or description to quickly edit prices..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: "100%",
              boxSizing: "border-box",
              padding: "9px 34px 9px 36px",
              borderRadius: "var(--radius-pill)",
              border: "1px solid var(--border-color)",
              backgroundColor: "#FAF7F2",
              fontSize: 13,
              fontFamily: "var(--font-serif)",
              color: "var(--color-ink)",
              outline: "none"
            }}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              style={{
                position: "absolute",
                right: 12,
                top: "50%",
                transform: "translateY(-50%)",
                background: "transparent",
                border: "none",
                fontSize: 13,
                color: "var(--color-bronze)",
                cursor: "pointer"
              }}
            >
              ✕
            </button>
          )}
        </div>

        {/* Category Filter Pills */}
        <div
          className="no-scrollbar"
          style={{
            display: "flex",
            gap: 6,
            overflowX: "auto",
            paddingBottom: 2,
            alignItems: "center"
          }}
        >
          <button
            onClick={() => setSelectedCategory("all")}
            style={{
              padding: "6px 14px",
              borderRadius: "var(--radius-pill)",
              fontSize: 12,
              fontFamily: "var(--font-serif)",
              fontWeight: 700,
              letterSpacing: 0.5,
              textTransform: "uppercase",
              whiteSpace: "nowrap",
              cursor: "pointer",
              transition: "all 0.15s",
              backgroundColor: selectedCategory === "all" ? "var(--color-ink)" : "#FAF7F2",
              color: selectedCategory === "all" ? "#FAF7F2" : "var(--color-ink)",
              border: selectedCategory === "all" ? "1px solid var(--color-ink)" : "1px solid var(--border-color)"
            }}
          >
            All Categories ({menuItems.length})
          </button>

          {categoryGroups.map((cat) => {
            const isSelected = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                style={{
                  padding: "6px 14px",
                  borderRadius: "var(--radius-pill)",
                  fontSize: 12,
                  fontFamily: "var(--font-serif)",
                  fontWeight: 700,
                  letterSpacing: 0.5,
                  textTransform: "uppercase",
                  whiteSpace: "nowrap",
                  cursor: "pointer",
                  transition: "all 0.15s",
                  backgroundColor: isSelected ? "var(--color-ink)" : "#FAF7F2",
                  color: isSelected ? "#FAF7F2" : "var(--color-ink)",
                  border: isSelected ? "1px solid var(--color-ink)" : "1px solid var(--border-color)"
                }}
              >
                {cat.label} ({cat.items.length})
              </button>
            );
          })}
        </div>
      </div>

      {/* Categorized Menu Groups Display */}
      {filteredGroups.length === 0 ? (
        <div style={{
          backgroundColor: "#fff",
          borderRadius: 6,
          border: "1px dashed var(--color-border-frame)",
          padding: "40px 20px",
          textAlign: "center"
        }}>
          <div style={{ fontFamily: "var(--font-serif)", fontSize: 16, fontWeight: 700, color: "var(--color-ink)", marginBottom: 6 }}>
            No dishes found matching your criteria.
          </div>
          <p style={{ fontFamily: "var(--font-serif)", fontStyle: "italic", fontSize: 13, color: "var(--color-bronze)", marginBottom: 16 }}>
            Try clearing your search or adding a new dish to this category.
          </p>
          <button
            onClick={() => { setSelectedCategory("all"); setSearchQuery(""); }}
            style={{
              padding: "7px 18px",
              borderRadius: "var(--radius-pill)",
              backgroundColor: "var(--color-ink)",
              color: "#FAF7F2",
              fontFamily: "var(--font-serif)",
              fontSize: 13,
              fontWeight: 700,
              cursor: "pointer"
            }}
          >
            View All Dishes
          </button>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          {filteredGroups.map((group) => (
            <div
              key={group.id}
              style={{
                backgroundColor: "#fff",
                borderRadius: 6,
                border: "1px solid var(--border-color)",
                boxShadow: "var(--shadow-sm)",
                overflow: "hidden"
              }}
            >
              {/* Category Section Header */}
              <div style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "12px 18px",
                backgroundColor: "#FAF7F2",
                borderBottom: "1.5px solid var(--color-border-frame)"
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <Tag size={16} style={{ color: "var(--color-bronze)" }} />
                  <h3 style={{
                    fontFamily: "var(--font-serif)",
                    fontSize: 17,
                    fontWeight: 800,
                    letterSpacing: 1,
                    textTransform: "uppercase",
                    color: "var(--color-ink)",
                    margin: 0
                  }}>
                    {group.label}
                  </h3>
                  <span style={{
                    fontSize: 12,
                    color: "var(--color-bronze)",
                    fontFamily: "var(--font-serif)",
                    fontStyle: "italic"
                  }}>
                    ({group.items.length} {group.items.length === 1 ? "dish" : "dishes"})
                  </span>
                </div>

                <button
                  onClick={() => handleOpenAddModal(group.id)}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 5,
                    padding: "5px 12px",
                    borderRadius: "var(--radius-pill)",
                    backgroundColor: "#fff",
                    border: "1px solid var(--color-border-frame)",
                    fontFamily: "var(--font-serif)",
                    fontSize: 12,
                    fontWeight: 700,
                    color: "var(--color-ink)",
                    cursor: "pointer"
                  }}
                  title={`Add a new dish to ${group.label}`}
                >
                  <Plus size={13} />
                  <span>Add in {group.label}</span>
                </button>
              </div>

              {/* Items Table for this Category */}
              <div style={{ overflowX: "auto", width: "100%" }}>
                <div style={{ minWidth: 620 }}>
                  {/* Table Column Headers */}
                  <div style={{
                    display: "grid",
                    gridTemplateColumns: "minmax(200px, 2fr) 140px 130px 170px",
                    padding: "10px 18px",
                    borderBottom: "1px solid var(--border-color)",
                    fontFamily: "var(--font-serif)",
                    fontSize: 12,
                    fontWeight: 700,
                    color: "var(--color-bronze)",
                    textTransform: "uppercase",
                    letterSpacing: 0.5
                  }}>
                    <div>Dish & Recipe</div>
                    <div>Price (Click to edit)</div>
                    <div>Stock Status</div>
                    <div style={{ textAlign: "right" }}>Actions</div>
                  </div>

                  {/* Rows */}
                  {group.items.map((item) => (
                    <div
                      key={item.id}
                      style={{
                        display: "grid",
                        gridTemplateColumns: "minmax(200px, 2fr) 140px 130px 170px",
                        alignItems: "center",
                        padding: "12px 18px",
                        borderBottom: "1px dashed var(--color-border-subtle)",
                        fontSize: 14,
                        transition: "background-color 0.15s"
                      }}
                    >
                      {/* Name & Desc */}
                      <div style={{ paddingRight: 12 }}>
                        <div style={{
                          fontFamily: "var(--font-serif)",
                          fontSize: 16,
                          fontWeight: 700,
                          color: "var(--color-ink)"
                        }}>
                          {item.name}
                        </div>
                        {item.description && (
                          <div style={{
                            fontFamily: "var(--font-serif)",
                            fontStyle: "italic",
                            fontSize: 12,
                            color: "var(--color-bronze)",
                            marginTop: 2
                          }}>
                            {item.description}
                          </div>
                        )}
                      </div>

                      {/* Price with Inline Edit */}
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
                                width: 58,
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
                            title="Click to quickly edit price"
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 6,
                              cursor: "pointer",
                              padding: "3px 8px",
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
                            <span style={{
                              fontFamily: "var(--font-serif)",
                              fontSize: 16,
                              fontWeight: 700,
                              color: "var(--color-ink)"
                            }}>
                              Rs.{item.price}
                            </span>
                            <Edit3 size={12} style={{ color: "var(--color-bronze)", opacity: 0.7 }} />
                          </div>
                        )}
                      </div>

                      {/* Stock Toggle */}
                      <div>
                        <button
                          onClick={() => handleToggleStock(item)}
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 6,
                            padding: "4px 10px",
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

                      {/* Actions: Edit Dish + Dedicated Remove Button */}
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 6 }}>
                        <button
                          onClick={() => handleOpenEditModal(item)}
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 4,
                            padding: "4px 9px",
                            borderRadius: "var(--radius-pill)",
                            border: "1px solid var(--color-border-frame)",
                            backgroundColor: "#fff",
                            color: "var(--color-ink)",
                            fontFamily: "var(--font-serif)",
                            fontSize: 12,
                            fontWeight: 600,
                            cursor: "pointer"
                          }}
                          title="Edit details & price"
                        >
                          <Edit3 size={13} />
                          <span>Edit</span>
                        </button>

                        <button
                          onClick={() => handleDelete(item.id)}
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 4,
                            padding: "4px 9px",
                            borderRadius: "var(--radius-pill)",
                            border: "1px solid #fecaca",
                            backgroundColor: "#fef2f2",
                            color: "#dc2626",
                            fontFamily: "var(--font-serif)",
                            fontSize: 12,
                            fontWeight: 700,
                            cursor: "pointer"
                          }}
                          title="Remove dish from menu"
                        >
                          <Trash2 size={13} />
                          <span>Remove</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

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
            borderRadius: 6,
            border: "1.5px solid var(--color-border-frame)",
            padding: 24,
            width: "100%",
            maxWidth: 480,
            boxShadow: "var(--shadow-floating)",
            maxHeight: "90vh",
            overflowY: "auto"
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <h3 style={{ fontFamily: "var(--font-serif)", fontSize: 20, fontWeight: 700, color: "var(--color-ink)", margin: 0 }}>
                {modalMode === "add" ? "Add New Dish to Menu" : `Edit Dish: ${formData.name || "Item"}`}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                style={{ background: "transparent", border: "none", cursor: "pointer", color: "var(--color-bronze)" }}
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
                    borderRadius: 3,
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
                      borderRadius: 3,
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
                      borderRadius: 3,
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
                    borderRadius: 3,
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

              {/* Modal Footer with Save, Cancel, and Remove Dish */}
              <div style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 10,
                marginTop: 10,
                flexWrap: "wrap"
              }}>
                {modalMode === "edit" ? (
                  <button
                    type="button"
                    onClick={() => {
                      setIsModalOpen(false);
                      handleDelete(editingItemId);
                    }}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 5,
                      padding: "7px 14px",
                      borderRadius: "var(--radius-pill)",
                      backgroundColor: "#fef2f2",
                      border: "1px solid #fecaca",
                      color: "#dc2626",
                      fontFamily: "var(--font-serif)",
                      fontSize: 13,
                      fontWeight: 700,
                      cursor: "pointer"
                    }}
                    title="Delete this dish"
                  >
                    <Trash2 size={14} />
                    <span>Remove Dish</span>
                  </button>
                ) : <div />}

                <div style={{ display: "flex", gap: 10 }}>
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
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
