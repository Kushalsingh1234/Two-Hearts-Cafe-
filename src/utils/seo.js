/**
 * Dynamic SEO Management for Two Hearts Cafe
 * Updates document.title, meta descriptions, Open Graph, Twitter cards,
 * and canonical link on every page and route change.
 */

export const PAGE_SEO_METADATA = {
  home: {
    title: "Two Hearts Cafe | Best Pure Veg Cafe & Italian Bistro in Muradnagar",
    description:
      "Two Hearts Cafe is Muradnagar's premier 100% pure vegetarian cafe & Italian bistro at Pillar No. 852, Delhi-Meerut Road. Savor stone-baked pizzas, creamy Alfredo & Arabiata pastas, artisan burgers, crispy momos, waffles, and thick shakes in a romantic ambience. Dine-in, takeaway & fast online delivery.",
    canonical: "https://twoheartscafe.in/",
  },
  menu: {
    title: "Menu & Prices - Pizzas, Pastas, Burgers & Shakes | Two Hearts Cafe",
    description:
      "Explore the 100% pure-veg menu at Two Hearts Cafe Muradnagar. Stone-baked pizzas, creamy pastas, handcrafted burgers, crispy momos, waffles, and thick milkshakes with instant delivery & dine-in ordering.",
    canonical: "https://twoheartscafe.in/menu",
  },
  about: {
    title: "About Our Story & Ambience | Two Hearts Cafe Muradnagar",
    description:
      "Discover the passion, craftsmanship, and cozy romantic atmosphere behind Two Hearts Cafe. 100% pure vegetarian cuisine, ethically sourced ingredients, and student-friendly pricing in Muradnagar.",
    canonical: "https://twoheartscafe.in/about",
  },
  contact: {
    title: "Contact, Location (Pillar 852) & Timings | Two Hearts Cafe",
    description:
      "Visit Two Hearts Cafe at Shivam Vihar Colony, Pillar No. 852, Delhi-Meerut Road, Muradnagar. Open daily 12 PM - 12 AM. Phone: +91 9027012158. Directions, map, and party reservations.",
    canonical: "https://twoheartscafe.in/contact",
  },
  cart: {
    title: "Your Cart | Two Hearts Cafe",
    description:
      "Review your selected food and drinks before proceeding to checkout at Two Hearts Cafe.",
    canonical: "https://twoheartscafe.in/cart",
  },
  checkout: {
    title: "Secure Checkout | Two Hearts Cafe",
    description:
      "Complete your online delivery or pickup order securely and conveniently with Two Hearts Cafe.",
    canonical: "https://twoheartscafe.in/checkout",
  },
  "order-confirmation": {
    title: "Order Placed Successfully | Two Hearts Cafe",
    description:
      "Your order has been confirmed! Two Hearts Cafe is preparing your freshly made food and drinks with love.",
    canonical: "https://twoheartscafe.in/order-confirmation",
  },
  "order-status": {
    title: "Track Your Order | Two Hearts Cafe",
    description:
      "Live order tracker for Two Hearts Cafe. Watch real-time updates as your food is prepared, packed, and delivered.",
    canonical: "https://twoheartscafe.in/order-status",
  },
  "sign-in": {
    title: "Sign In & Loyalty Club | Two Hearts Cafe",
    description:
      "Sign in to your Two Hearts Cafe account to access rapid checkout, save favorite delivery addresses, and earn cafe loyalty rewards.",
    canonical: "https://twoheartscafe.in/sign-in",
  },
  profile: {
    title: "My Account & Orders | Two Hearts Cafe",
    description:
      "Manage your Two Hearts Cafe account, review past orders, manage loyalty points, and update delivery addresses.",
    canonical: "https://twoheartscafe.in/profile",
  },
};

/**
 * Updates document.title and all relevant SEO meta tags dynamically
 */
export function updatePageSEO({ pageKey, view, tableNumber }) {
  let seo = PAGE_SEO_METADATA[pageKey] || PAGE_SEO_METADATA.home;

  if (view === "customer") {
    const tableStr = tableNumber ? `Table ${tableNumber}` : "Dine-In";
    seo = {
      title: `${tableStr} - Dine-In Menu & Instant Order | Two Hearts Cafe`,
      description: `Instant digital dine-in ordering for ${tableStr} at Two Hearts Cafe Muradnagar. Browse live menu and order directly to the kitchen.`,
      canonical: `https://twoheartscafe.in/?table=${tableNumber || "5"}`,
    };
  } else if (view === "admin") {
    seo = {
      title: "Staff Kitchen & Admin Dashboard | Two Hearts Cafe",
      description:
        "Kitchen display system, real-time incoming orders, and menu administration portal for Two Hearts Cafe staff.",
      canonical: "https://twoheartscafe.in/admin",
    };
  }

  // 1. Update Browser Tab Title
  document.title = seo.title;

  // Helper function to safely update or create meta tags
  const setMetaTag = (selectorAttr, selectorValue, content) => {
    let el = document.querySelector(`meta[${selectorAttr}="${selectorValue}"]`);
    if (!el) {
      el = document.createElement("meta");
      el.setAttribute(selectorAttr, selectorValue);
      document.head.appendChild(el);
    }
    el.setAttribute("content", content);
  };

  // 2. Meta Description
  setMetaTag("name", "description", seo.description);

  // 3. Open Graph Tags
  setMetaTag("property", "og:title", seo.title);
  setMetaTag("property", "og:description", seo.description);
  setMetaTag("property", "og:url", seo.canonical);

  // 4. Twitter Card Tags
  setMetaTag("name", "twitter:title", seo.title);
  setMetaTag("name", "twitter:description", seo.description);
  setMetaTag("name", "twitter:url", seo.canonical);

  // 5. Canonical Link
  let canonicalEl = document.querySelector('link[rel="canonical"]');
  if (!canonicalEl) {
    canonicalEl = document.createElement("link");
    canonicalEl.setAttribute("rel", "canonical");
    document.head.appendChild(canonicalEl);
  }
  canonicalEl.setAttribute("href", seo.canonical);
}
