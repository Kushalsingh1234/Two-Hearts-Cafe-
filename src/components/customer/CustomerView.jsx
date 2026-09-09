import React, { useState, useMemo } from "react";
import confetti from "canvas-confetti";
import { Edit3, ChevronRight, Utensils, MapPin, Clock } from "lucide-react";
import MenuCategoryBar from "./MenuCategoryBar";
import MenuItemCard from "./MenuItemCard";
import CartDrawer from "./CartDrawer";
import LiveOrderTracker from "./LiveOrderTracker";
import CafeLogoIcon from "../common/CafeLogoIcon";
import { CAFE_INFO } from "../../data/seedMenu";
import { placeOrder } from "../../firebase/services";

export default function CustomerView({
  tableNumber,
  setTableNumber,
  menuItems,
  orders,
  onOpenCart,
  isCartOpen,
  setIsCartOpen
}) {
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  const [cartItems, setCartItems] = useState([]);
  const [isPlacing, setIsPlacing] = useState(false);
  const [isTrackerOpen, setIsTrackerOpen] = useState(false);

  // Dynamic categories computed from menuItems
  const categoriesList = useMemo(() => {
    const baseCategories = [
      { id: "pasta", title: "Pasta" },
      { id: "pizza", title: "Pizza" },
      { id: "burger", title: "Burger" },
      { id: "sandwiches", title: "Sandwiches" },
      { id: "momo", title: "Momo" },
      { id: "roll", title: "Rolls" },
      { id: "combo", title: "Combos" },
      { id: "platter", title: "Platter" },
      { id: "desi", title: "Desi Cuisine" },
      { id: "breads", title: "Breads" },
      { id: "noodles", title: "Noodles" },
      { id: "rice", title: "Rice" },
      { id: "paneer", title: "Paneer" },
      { id: "snacks", title: "Snacks" },
      { id: "waffles", title: "Waffles" },
      { id: "shakes", title: "Shakes & Drinks" },
      { id: "maggie", title: "Maggie" }
    ];

    const knownIds = new Set(baseCategories.map((c) => c.id.toLowerCase()));
    const customCats = [];

    menuItems.forEach((item) => {
      if (item.category) {
        const catId = item.category.toLowerCase().trim();
        if (!knownIds.has(catId)) {
          knownIds.add(catId);
          const title = item.categoryTitle || (item.category.charAt(0).toUpperCase() + item.category.slice(1));
          customCats.push({ id: catId, title });
        }
      }
    });

    return [...baseCategories, ...customCats];
  }, [menuItems]);

  const categoryBarItems = useMemo(() => {
    return [
      { id: "all", name: "Full Menu" },
      ...categoriesList.map((c) => ({ id: c.id, name: c.title }))
    ];
  }, [categoriesList]);

  // Filter items
  const filteredItems = useMemo(() => {
    return menuItems.filter((item) => {
      if (selectedCategory !== "all" && item.category !== selectedCategory) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = item.name.toLowerCase().includes(q);
        const matchesDesc = (item.description || "").toLowerCase().includes(q);
        if (!matchesName && !matchesDesc) return false;
      }
      return true;
    });
  }, [menuItems, selectedCategory, searchQuery]);

  // Cart totals
  const cartTotalQty = useMemo(() => {
    return cartItems.reduce((acc, it) => acc + it.quantity, 0);
  }, [cartItems]);

  const cartTotalPrice = useMemo(() => {
    return cartItems.reduce((acc, it) => acc + it.price * it.quantity, 0);
  }, [cartItems]);

  const handleAddToCart = (itemWithNote) => {
    const existingIdx = cartItems.findIndex((c) => c.id === itemWithNote.id);
    if (existingIdx >= 0) {
      const updated = [...cartItems];
      if (itemWithNote.note) {
        updated[existingIdx].note = itemWithNote.note;
      }
      if (itemWithNote.quantity) {
        updated[existingIdx].quantity = itemWithNote.quantity;
      } else {
        updated[existingIdx].quantity += 1;
      }
      setCartItems(updated);
    } else {
      setCartItems([
        ...cartItems,
        {
          cartItemId: `${itemWithNote.id}_${Date.now()}`,
          id: itemWithNote.id,
          name: itemWithNote.name,
          price: itemWithNote.price,
          quantity: itemWithNote.quantity || 1,
          note: itemWithNote.note || ""
        }
      ]);
    }
  };

  const handleUpdateQty = (itemId, newQty) => {
    if (newQty <= 0) {
      setCartItems(cartItems.filter((i) => i.id !== itemId));
    } else {
      setCartItems(
        cartItems.map((i) => (i.id === itemId ? { ...i, quantity: newQty } : i))
      );
    }
  };

  const handleRemoveCartItem = (cartItemId) => {
    setCartItems(cartItems.filter((i) => i.cartItemId !== cartItemId));
  };

  const handlePlaceOrder = async (orderPayload) => {
    setIsPlacing(true);
    try {
      await placeOrder(orderPayload);
      setCartItems([]);
      setIsCartOpen(false);

      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 }
      });

      setIsTrackerOpen(true);
    } catch (err) {
      console.error("Order error:", err);
      alert("Could not place order. Please alert staff.");
    } finally {
      setIsPlacing(false);
    }
  };

  const customerActiveOrders = orders.filter(
    (ord) => String(ord.tableNumber) === String(tableNumber) && ord.status !== "settled" && ord.status !== "cancelled"
  );

  return (
    <div style={{
      width: "100%",
      maxWidth: 680,
      margin: "0 auto",
      padding: "12px 14px 110px 14px",
      boxSizing: "border-box"
    }}>
      {/* Live Order Active Banner if table has an active order */}
      {customerActiveOrders.length > 0 && (
        <div
          onClick={() => setIsTrackerOpen(true)}
          style={{
            marginBottom: 12,
            backgroundColor: "var(--color-bronze)",
            color: "#fff",
            borderRadius: "var(--radius-sm)",
            padding: "8px 12px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            cursor: "pointer",
            boxShadow: "var(--shadow-sm)"
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12 }}>
            <span style={{ width: 7, height: 7, borderRadius: "50%", backgroundColor: "#a7f3d0" }} />
            <span>
              <strong>Order Live:</strong> Status: {customerActiveOrders[0].status.toUpperCase()}
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 2, fontSize: 11, textDecoration: "underline" }}>
            <span>Track</span>
            <ChevronRight size={13} />
          </div>
        </div>
      )}

      {/* Clean, Modern Cafe Banner (No giant printed page mockups) */}
      <div style={{
        backgroundColor: "#fff",
        borderRadius: "var(--radius-md)",
        border: "1px solid var(--border-color)",
        padding: "16px",
        marginBottom: 16,
        boxShadow: "var(--shadow-sm)"
      }}>
        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 10
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <CafeLogoIcon size={46} />
            <div>
              <h1 style={{
                fontFamily: "var(--font-script)",
                fontSize: 32,
                color: "var(--color-bronze)",
                lineHeight: 1
              }}>
                Two Hearts Cafe
              </h1>
              <div style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                marginTop: 4,
                fontSize: 11,
                color: "var(--color-ink)",
                opacity: 0.75
              }}>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 3 }}>
                  <Clock size={11} />
                  <span>12 PM - 12 PM</span>
                </span>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 3 }}>
                  <MapPin size={11} />
                  <span>Near KIET University</span>
                </span>
              </div>
            </div>
          </div>

          {/* Static Table Badge (set via QR code scan) */}
          <div style={{
            backgroundColor: "var(--bg-subtle)",
            border: "1px solid var(--border-color)",
            borderRadius: "var(--radius-pill)",
            padding: "5px 14px",
            display: "flex",
            alignItems: "center"
          }}>
            <span style={{
              fontSize: 12,
              fontFamily: "var(--font-serif)",
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: 0.5,
              color: "var(--color-ink)"
            }}>
              Table #{tableNumber}
            </span>
          </div>
        </div>
      </div>

      {/* Category Bar & Search */}
      <MenuCategoryBar
        selectedCategory={selectedCategory}
        onSelectCategory={setSelectedCategory}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        categories={categoryBarItems}
      />

      {/* Menu Item Display */}
      {selectedCategory === "all" && !searchQuery ? (
        // Grouped by Category
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {categoriesList.map((cat) => {
            const catItems = menuItems.filter((i) => i.category === cat.id);
            if (catItems.length === 0) return null;

            return (
              <section key={cat.id}>
                {/* Category Header */}
                <div style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  marginBottom: 10,
                  borderBottom: "1.5px solid var(--border-color)",
                  paddingBottom: 6
                }}>
                  <h2 style={{
                    fontFamily: "var(--font-serif)",
                    fontSize: 19,
                    fontWeight: 700,
                    letterSpacing: 1,
                    textTransform: "uppercase",
                    color: "var(--color-ink)"
                  }}>
                    {cat.title}
                  </h2>
                  <span style={{
                    fontSize: 11,
                    color: "var(--color-bronze)",
                    fontStyle: "italic",
                    fontFamily: "var(--font-serif)"
                  }}>
                    ({catItems.length} items)
                  </span>
                </div>

                {/* Items */}
                <div style={{ display: "flex", flexDirection: "column" }}>
                  {catItems.map((item) => {
                    const inCart = cartItems.find((c) => c.id === item.id);
                    return (
                      <MenuItemCard
                        key={item.id}
                        item={item}
                        cartQuantity={inCart ? inCart.quantity : 0}
                        onAddToCart={handleAddToCart}
                        onUpdateQty={handleUpdateQty}
                      />
                    );
                  })}
                </div>
              </section>
            );
          })}
        </div>
      ) : (
        // Filtered List
        <div>
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            marginBottom: 10,
            borderBottom: "1.5px solid var(--border-color)",
            paddingBottom: 6
          }}>
            <h2 style={{
              fontFamily: "var(--font-serif)",
              fontSize: 19,
              fontWeight: 700,
              letterSpacing: 1,
              textTransform: "uppercase",
              color: "var(--color-ink)"
            }}>
              {selectedCategory !== "all"
                ? categoriesList.find((c) => c.id === selectedCategory)?.title || selectedCategory.toUpperCase()
                : "Search Results"}
            </h2>
            <span style={{
              fontSize: 11,
              color: "var(--color-bronze)",
              fontStyle: "italic",
              fontFamily: "var(--font-serif)"
            }}>
              ({filteredItems.length} items)
            </span>
          </div>

          <div style={{ display: "flex", flexDirection: "column" }}>
            {filteredItems.map((item) => {
              const inCart = cartItems.find((c) => c.id === item.id);
              return (
                <MenuItemCard
                  key={item.id}
                  item={item}
                  cartQuantity={inCart ? inCart.quantity : 0}
                  onAddToCart={handleAddToCart}
                  onUpdateQty={handleUpdateQty}
                />
              );
            })}
          </div>

          {filteredItems.length === 0 && (
            <div style={{ textAlign: "center", padding: "40px 10px" }}>
              <p style={{
                fontFamily: "var(--font-serif)",
                fontStyle: "italic",
                fontSize: 15,
                color: "var(--color-bronze)"
              }}>
                No items found. Try searching for pasta, noodles, or maggie.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Floating Bottom Bar for Table Order (Never overflows mobile width) */}
      {cartTotalQty > 0 && (
        <div style={{
          position: "fixed",
          bottom: 14,
          left: 14,
          right: 14,
          maxWidth: 652,
          margin: "0 auto",
          zIndex: 45
        }}>
          <button
            onClick={() => setIsCartOpen(true)}
            style={{
              width: "100%",
              backgroundColor: "var(--color-ink)",
              color: "#FAF7F2",
              padding: "12px 16px",
              borderRadius: "var(--radius-pill)",
              border: "1px solid var(--color-bronze)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              boxShadow: "var(--shadow-float)",
              boxSizing: "border-box"
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{
                backgroundColor: "var(--color-bronze)",
                color: "#fff",
                borderRadius: "50%",
                width: 24,
                height: 24,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 12,
                fontWeight: 700
              }}>
                {cartTotalQty}
              </span>
              <div style={{ textAlign: "left" }}>
                <div style={{ fontSize: 13, fontWeight: 700 }}>
                  Table #{tableNumber} Order
                </div>
                <div style={{ fontSize: 10, color: "#E0D7CD" }}>
                  Touch to review & send to kitchen
                </div>
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ fontSize: 15, fontWeight: 700 }}>
                Rs.{cartTotalPrice}
              </span>
              <ChevronRight size={16} />
            </div>
          </button>
        </div>
      )}

      {/* Cart Drawer */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cartItems={cartItems}
        tableNumber={tableNumber}
        onUpdateQuantity={handleUpdateQty}
        onRemoveItem={handleRemoveCartItem}
        onPlaceOrder={handlePlaceOrder}
        isPlacing={isPlacing}
      />

      {/* Live Order Tracker Modal */}
      <LiveOrderTracker
        isOpen={isTrackerOpen}
        onClose={() => setIsTrackerOpen(false)}
        orders={orders}
        tableNumber={tableNumber}
      />
    </div>
  );
}
