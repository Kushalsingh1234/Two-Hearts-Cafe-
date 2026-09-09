export const CAFE_INFO = {
  name: "Two Hearts Cafe",
  tagline: "Daily open from 12 PM - 12 PM",
  address: "Shivam Vihar Colony, pillar no 852, KIET university, muradnagar, 201206",
  phone: "9027012158"
};

export const INITIAL_CATEGORIES = [
  { id: "all", name: "Full Menu" },
  { id: "pasta", name: "Pasta" },
  { id: "sandwiches", name: "Sandwiches" },
  { id: "noodles", name: "Noodles" },
  { id: "maggie", name: "Maggie" }
];

export const INITIAL_MENU_ITEMS = [
  // --- PASTA ---
  {
    id: "th_penne_arabiata",
    name: "Penne Arabiata",
    category: "pasta",
    price: 139,
    description: "Penne tossed in tomato sauce with vegetables",
    isVeg: true,
    isAvailable: true
  },
  {
    id: "th_penne_alfredo",
    name: "Penne Alfredo Primavera",
    category: "pasta",
    price: 149,
    description: "Penne tossed in cheese cream sauce with vegetables",
    isVeg: true,
    isAvailable: true
  },
  {
    id: "th_creamy_makhani",
    name: "Creamy Makhani Sauce Pasta",
    category: "pasta",
    price: 159,
    description: "Penne tossed in makhani sauce with vegetables",
    isVeg: true,
    isAvailable: true
  },
  {
    id: "th_penne_rosa_love",
    name: "Penne Rosa Love Pasta",
    category: "pasta",
    price: 159,
    description: "A silly marriage of sun-ripened san marzano tomatoes and velvet smooth heavy cream creating a mix pink cream.",
    isVeg: true,
    isAvailable: true,
    isSpecial: true
  },

  // --- SANDWICHES ---
  {
    id: "th_veg_club",
    name: "Veg Club Sandwich",
    category: "sandwiches",
    price: 79,
    description: "Traditional sandwich with veggies , mayo & grilled to perfectio",
    isVeg: true,
    isAvailable: true
  },
  {
    id: "th_peri_peri_paneer_corn",
    name: "Peri Peri Paneer & Corn Grilled Sandwich",
    category: "sandwiches",
    price: 99,
    description: "Grilled sandwich with peri peri paneer with corn & garlic mayo",
    isVeg: true,
    isAvailable: true
  },
  {
    id: "th_corn_spinach_cheese",
    name: "Corn & Spinach Grilled Cheese Sandwich",
    category: "sandwiches",
    price: 109,
    description: "A crispy grilled sandwich loaded with sweet corn, fresh spinach, and gooey melted cheese for a deliciously wholesome bite.",
    isVeg: true,
    isAvailable: true
  },
  {
    id: "th_bombay_grilled",
    name: "Bombay Grilled Sandwich",
    category: "sandwiches",
    price: 119,
    description: "A crispy grilled sandwich layered with fresh veggies, flavorful green chutney, and aromatic Mumbai-style spices for the perfect street-food taste.",
    isVeg: true,
    isAvailable: true,
    isSpecial: true
  },

  // --- NOODLES ---
  {
    id: "th_veg_noodles",
    name: "Veg Noodles",
    category: "noodles",
    price: 119,
    description: "Wok-tossed noodles with fresh shredded vegetables and light oriental seasoning",
    isVeg: true,
    isAvailable: true
  },
  {
    id: "th_paneer_noodles",
    name: "Paneer Noodles",
    category: "noodles",
    price: 139,
    description: "Tossed noodles with spiced golden paneer cubes and crunchy bell peppers",
    isVeg: true,
    isAvailable: true
  },
  {
    id: "th_schezwan_noodles",
    name: "Schezwan Noodles",
    category: "noodles",
    price: 139,
    description: "Spicy noodles tossed in bold, fiery in-house schezwan pepper sauce",
    isVeg: true,
    isAvailable: true
  },
  {
    id: "th_chilli_garlic_noodles",
    name: "Chilli Garlic Noodles",
    category: "noodles",
    price: 139,
    description: "Classic stir-fry infused with roasted garlic, red chilies, and scallions",
    isVeg: true,
    isAvailable: true
  },
  {
    id: "th_hakka_noodles",
    name: "Hakka Noodles",
    category: "noodles",
    price: 149,
    description: "Traditional Indo-Chinese street style hakka noodles with crisp julienned vegetables",
    isVeg: true,
    isAvailable: true
  },
  {
    id: "th_singapuri_noodles",
    name: "Singapuri Noodles",
    category: "noodles",
    price: 149,
    description: "Mildly spiced yellow curry flavored noodles loaded with exotic stir-fried veggies",
    isVeg: true,
    isAvailable: true
  },
  {
    id: "th_mashroom_noodles",
    name: "Mashroom Noodles",
    category: "noodles",
    price: 149,
    description: "Fresh button mushrooms wok-seared with long grain noodles and soy reduction",
    isVeg: true,
    isAvailable: true
  },

  // --- MAGGIE ---
  {
    id: "th_classic_masala_maggie",
    name: "Classic Masala Maggie",
    category: "maggie",
    price: 79,
    description: "All-time favorite classic masala recipe cooked to hot steamy perfection",
    isVeg: true,
    isAvailable: true
  },
  {
    id: "th_cheese_butter_maggie",
    name: "Cheese Butter Maggie",
    category: "maggie",
    price: 89,
    description: "Rich noodles topped with a generous dollop of Amul butter and melted cheddar cheese",
    isVeg: true,
    isAvailable: true
  },
  {
    id: "th_vegetable_masala_maggie",
    name: "Vegetable Masala Maggie",
    category: "maggie",
    price: 99,
    description: "Loaded with fresh onions, sweet peas, tomatoes, carrots, and special herbs",
    isVeg: true,
    isAvailable: true
  },
  {
    id: "th_schezwan_maggie",
    name: "Schezwan Maggie",
    category: "maggie",
    price: 99,
    description: "Hot & spicy twist infused with pungent Schezwan chili paste and spring onions",
    isVeg: true,
    isAvailable: true
  },
  {
    id: "th_peri_peri_maggie_veggies",
    name: "Peri Peri Maggie with Veggies",
    category: "maggie",
    price: 109,
    description: "Zesty South African peri-peri spiced noodles sautéed with crunchy vegetables",
    isVeg: true,
    isAvailable: true,
    isSpecial: true
  }
];
