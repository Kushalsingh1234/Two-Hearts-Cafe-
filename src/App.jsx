import React, { useState, useEffect } from "react";
import Navbar from "./components/common/Navbar";
import SiteNavbar from "./components/common/SiteNavbar";
import SiteFooter from "./components/common/SiteFooter";
import HomePage from "./components/marketing/HomePage";
import AboutPage from "./components/marketing/AboutPage";
import MenuLandingPage from "./components/marketing/MenuLandingPage";
import ContactPage from "./components/marketing/ContactPage";
import CartPage from "./components/ordering/CartPage";
import CheckoutPage from "./components/ordering/CheckoutPage";
import OrderConfirmationPage from "./components/ordering/OrderConfirmationPage";
import OrderStatusPage from "./components/ordering/OrderStatusPage";
import CustomerView from "./components/customer/CustomerView";
import AdminDashboard from "./components/admin/AdminDashboard";
import StaffLogin from "./components/admin/StaffLogin";
import { OnlineOrderProvider } from "./context/OnlineOrderContext";
import { CustomerAuthProvider } from "./context/CustomerAuthContext";
import CustomerAuthModal from "./components/auth/CustomerAuthModal";
import SignInPage from "./components/auth/SignInPage";
import UserProfilePage from "./components/profile/UserProfilePage";
import { subscribeMenuItems, subscribeLiveOrders } from "./firebase/services";
import { subscribeAuth, logoutUser } from "./firebase/auth";
import { INITIAL_MENU_ITEMS } from "./data/seedMenu";

export default function App() {
  // Parse table parameter ONLY if accessed via physical QR code scan (e.g. ?table=5)
  const getInitialTable = () => {
    const params = new URLSearchParams(window.location.search);
    return params.get("table") || "5";
  };

  // Determine initial view:
  const getInitialView = () => {
    const params = new URLSearchParams(window.location.search);
    const hash = window.location.hash.replace("#", "");
    const pathname = window.location.pathname.replace("/", "").toLowerCase();

    if (params.get("admin") === "true" || hash === "admin" || pathname === "admin") {
      return "admin";
    }
    // If explicitly requesting menu showcase, show marketing menu page
    if (pathname === "menu" || hash === "menu" || params.get("menu") === "true" || params.get("page") === "menu") {
      return "marketing";
    }
    if (pathname === "order" || (params.get("order") === "true" && hash !== "menu") || params.get("table")) {
      return "customer";
    }
    return "marketing";
  };

  const getInitialMarketingPage = () => {
    const params = new URLSearchParams(window.location.search);
    const hash = window.location.hash.replace("#", "");
    const pathname = window.location.pathname.replace("/", "").toLowerCase();

    if (params.get("page")) return params.get("page");
    if (params.get("menu") === "true") return "menu";
    const validPages = ["home", "about", "menu", "contact", "cart", "checkout", "order-confirmation", "order-status", "sign-in", "profile"];
    if (validPages.includes(pathname)) return pathname;
    if (validPages.includes(hash)) return hash;
    return "home";
  };

  const getInitialProfileTab = () => {
    try {
      const rawHash = window.location.hash.replace("#", "");
      if (rawHash.includes("?")) {
        const parts = rawHash.split("?");
        const tab = new URLSearchParams(parts[1]).get("tab");
        if (tab) return tab;
      }
      const params = new URLSearchParams(window.location.search);
      return params.get("tab") || "orders";
    } catch {
      return "orders";
    }
  };

  const [tableNumber, setTableNumber] = useState(getInitialTable);
  const [currentView, setCurrentView] = useState(getInitialView);
  const [marketingPage, setMarketingPage] = useState(getInitialMarketingPage);
  const [profileTab, setProfileTab] = useState(getInitialProfileTab);
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

  // Listen to browser navigation
  useEffect(() => {
    const handleUrlChange = () => {
      const params = new URLSearchParams(window.location.search);
      const rawHash = window.location.hash.replace("#", "");
      let hash = rawHash;
      if (rawHash.includes("?")) {
        const parts = rawHash.split("?");
        hash = parts[0];
        const tab = new URLSearchParams(parts[1]).get("tab");
        if (tab) setProfileTab(tab);
      }
      const pathname = window.location.pathname.replace("/", "").toLowerCase();
      const newTable = params.get("table");

      if (params.get("admin") === "true" || hash === "admin" || pathname === "admin") {
        setCurrentView("admin");
      } else if (pathname === "menu" || hash === "menu" || params.get("menu") === "true" || params.get("page") === "menu") {
        setCurrentView("marketing");
        setMarketingPage("menu");
      } else if (pathname === "order" || (params.get("order") === "true" && hash !== "menu") || newTable) {
        if (newTable) setTableNumber(newTable);
        setCurrentView("customer");
      } else {
        setCurrentView("marketing");
        const validPages = ["home", "about", "menu", "contact", "cart", "checkout", "order-confirmation", "order-status", "sign-in", "profile"];
        if (validPages.includes(pathname)) {
          setMarketingPage(pathname);
        } else if (validPages.includes(hash)) {
          setMarketingPage(hash);
        } else {
          setMarketingPage("home");
        }
      }
    };

    window.addEventListener("popstate", handleUrlChange);
    window.addEventListener("hashchange", handleUrlChange);
    return () => {
      window.removeEventListener("popstate", handleUrlChange);
      window.removeEventListener("hashchange", handleUrlChange);
    };
  }, []);

  // Subscribe to real-time menu items from Firestore for the order engine
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

  // Compute active orders for current table (QR ordering only)
  const tableActiveOrders = orders.filter(
    (ord) => String(ord.tableNumber) === String(tableNumber) && ord.status !== "settled" && ord.status !== "cancelled"
  );

  const handleSetMarketingPage = (pageId, tabId) => {
    setMarketingPage(pageId);
    if (pageId === "profile") {
      const targetTab = tabId || profileTab || "orders";
      if (tabId) setProfileTab(tabId);
      window.location.hash = `profile?tab=${targetTab}`;
    } else {
      window.location.hash = pageId;
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      {/* 1. MARKETING WEBSITE & ONLINE FOOD DELIVERY VIEW */}
      {currentView === "marketing" && (
        <CustomerAuthProvider>
          <OnlineOrderProvider>
            <CustomerAuthModal />

            <SiteNavbar
              currentPage={marketingPage}
              setPage={handleSetMarketingPage}
            />

            <main style={{ flex: 1 }}>
              {marketingPage === "home" && (
                <HomePage
                  setPage={handleSetMarketingPage}
                  menuItems={menuItems}
                />
              )}
              {marketingPage === "about" && (
                <AboutPage
                  setPage={handleSetMarketingPage}
                />
              )}
              {marketingPage === "menu" && (
                <MenuLandingPage
                  menuItems={menuItems}
                  onNavigate={handleSetMarketingPage}
                />
              )}
              {marketingPage === "cart" && (
                <CartPage
                  onNavigate={handleSetMarketingPage}
                />
              )}
              {marketingPage === "checkout" && (
                <CheckoutPage
                  onNavigate={handleSetMarketingPage}
                />
              )}
              {marketingPage === "order-confirmation" && (
                <OrderConfirmationPage
                  onNavigate={handleSetMarketingPage}
                />
              )}
              {marketingPage === "order-status" && (
                <OrderStatusPage
                  onNavigate={handleSetMarketingPage}
                />
              )}
              {marketingPage === "sign-in" && (
                <SignInPage
                  setPage={handleSetMarketingPage}
                />
              )}
              {marketingPage === "profile" && (
                <UserProfilePage
                  setPage={handleSetMarketingPage}
                  initialTab={profileTab}
                />
              )}
              {marketingPage === "contact" && (
                <ContactPage />
              )}
            </main>

            <SiteFooter
              setPage={handleSetMarketingPage}
            />
          </OnlineOrderProvider>
        </CustomerAuthProvider>
      )}

      {/* 2. QR-ONLY CLOSED TABLE ORDERING VIEW (Only reachable via physical QR code ?table=...) */}
      {currentView === "customer" && (
        <>
          <Navbar
            currentView={currentView}
            setView={setCurrentView}
            tableNumber={tableNumber}
            cartCount={0}
            onOpenCart={() => setIsCartOpen(true)}
            activeOrderCount={tableActiveOrders.length}
            onOpenTracker={() => setIsTrackerOpen(true)}
          />

          <main style={{ flex: 1 }}>
            <CustomerView
              tableNumber={tableNumber}
              setTableNumber={setTableNumber}
              menuItems={menuItems}
              orders={orders}
              onOpenCart={() => setIsCartOpen(true)}
              isCartOpen={isCartOpen}
              setIsCartOpen={setIsCartOpen}
            />
          </main>
        </>
      )}

      {/* 3. STAFF / ADMIN DASHBOARD */}
      {currentView === "admin" && (
        <>
          <Navbar
            currentView={currentView}
            setView={setCurrentView}
            tableNumber={tableNumber}
            cartCount={0}
            onOpenCart={() => setIsCartOpen(true)}
            activeOrderCount={tableActiveOrders.length}
            onOpenTracker={() => setIsTrackerOpen(true)}
          />

          <main style={{ flex: 1 }}>
            {!currentUser ? (
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
        </>
      )}
    </div>
  );
}
