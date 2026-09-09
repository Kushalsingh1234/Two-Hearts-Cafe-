import React, { useState, useEffect } from "react";
import Navbar from "./components/common/Navbar";
import CustomerView from "./components/customer/CustomerView";
import AdminDashboard from "./components/admin/AdminDashboard";
import StaffLogin from "./components/admin/StaffLogin";
import { subscribeMenuItems, subscribeLiveOrders } from "./firebase/services";
import { subscribeAuth, logoutUser } from "./firebase/auth";
import { INITIAL_MENU_ITEMS } from "./data/seedMenu";

export default function App() {
  // Parse query params on load (e.g., ?table=5 or ?admin=true)
  const getInitialTable = () => {
    const params = new URLSearchParams(window.location.search);
    const tableParam = params.get("table");
    if (tableParam) return tableParam;
    const stored = localStorage.getItem("twohearts_current_table");
    return stored || "5"; // Default to Table 5 for sample demonstration
  };

  const getInitialView = () => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("admin") === "true" || window.location.hash === "#admin") {
      return "admin";
    }
    return "customer";
  };

  const [tableNumber, setTableNumber] = useState(getInitialTable);
  const [currentView, setCurrentView] = useState(getInitialView);
  const [menuItems, setMenuItems] = useState(INITIAL_MENU_ITEMS);
  const [orders, setOrders] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isTrackerOpen, setIsTrackerOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  // Subscribe to Firebase Auth state
  useEffect(() => {
    const unsubscribeAuth = subscribeAuth((user) => {
      setCurrentUser(user);
    });
    return () => {
      if (unsubscribeAuth) unsubscribeAuth();
    };
  }, []);

  const handleLogout = async () => {
    await logoutUser();
    setCurrentUser(null);
  };

  // Listen to browser navigation & URL parameter changes (e.g., scanning a new table QR)
  useEffect(() => {
    const handleUrlChange = () => {
      const params = new URLSearchParams(window.location.search);
      const newTable = params.get("table");
      if (newTable) {
        setTableNumber(newTable);
        localStorage.setItem("twohearts_current_table", newTable);
      }
      if (params.get("admin") === "true" || window.location.hash === "#admin") {
        setCurrentView("admin");
      } else {
        setCurrentView("customer");
      }
    };

    window.addEventListener("popstate", handleUrlChange);
    return () => window.removeEventListener("popstate", handleUrlChange);
  }, []);

  // Subscribe to real-time menu items from Firestore
  useEffect(() => {
    const unsubscribeMenu = subscribeMenuItems((items) => {
      setMenuItems(items);
    });

    const unsubscribeOrders = subscribeLiveOrders((liveOrders) => {
      setOrders(liveOrders);
    });

    return () => {
      if (unsubscribeMenu) unsubscribeMenu();
      if (unsubscribeOrders) unsubscribeOrders();
    };
  }, []);

  // Compute active orders for current table
  const tableActiveOrders = orders.filter(
    (ord) => String(ord.tableNumber) === String(tableNumber) && ord.status !== "settled" && ord.status !== "cancelled"
  );

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      {/* Top Universal Navbar */}
      <Navbar
        currentView={currentView}
        setView={setCurrentView}
        tableNumber={tableNumber}
        cartCount={0}
        onOpenCart={() => setIsCartOpen(true)}
        activeOrderCount={tableActiveOrders.length}
        onOpenTracker={() => setIsTrackerOpen(true)}
      />

      {/* Main View Area */}
      <main style={{ flex: 1 }}>
        {currentView === "customer" ? (
          <CustomerView
            tableNumber={tableNumber}
            setTableNumber={setTableNumber}
            menuItems={menuItems}
            orders={orders}
            onOpenCart={() => setIsCartOpen(true)}
            isCartOpen={isCartOpen}
            setIsCartOpen={setIsCartOpen}
          />
        ) : !currentUser ? (
          <StaffLogin onLoginSuccess={(user) => setCurrentUser(user)} />
        ) : (
          <AdminDashboard
            orders={orders}
            menuItems={menuItems}
            currentUser={currentUser}
            onLogout={handleLogout}
          />
        )}
      </main>
    </div>
  );
}
