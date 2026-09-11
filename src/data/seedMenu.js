export const CAFE_INFO = {
  name: "Two Hearts Cafe",
  tagline: "Daily open from 12 PM - 12 AM",
  address: "Shivam Vihar Colony, Pillar No. 852, Muradnagar, 201206",
  phone: "9027012158",
  instagram: "Two_hearts_cafe",
  instagramUrl: "https://www.instagram.com/Two_hearts_cafe/"
};

export const INITIAL_CATEGORIES = [
  { id: "all", name: "Full Menu" },
  { id: "pasta", name: "Pasta" },
  { id: "pizza", name: "Pizza" },
  { id: "burger", name: "Burger" },
  { id: "sandwiches", name: "Sandwiches" },
  { id: "momo", name: "Momo" },
  { id: "roll", name: "Rolls" },
  { id: "combo", name: "Combos" },
  { id: "platter", name: "Platter" },
  { id: "desi", name: "Desi Cuisine" },
  { id: "breads", name: "Breads" },
  { id: "noodles", name: "Noodles" },
  { id: "rice", name: "Rice" },
  { id: "paneer", name: "Paneer" },
  { id: "snacks", name: "Snacks" },
  { id: "waffles", name: "Waffles" },
  { id: "shakes", name: "Shakes & Drinks" },
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
    name: "White Sauce Pasta",
    category: "pasta",
    price: 149,
    description: "Penne tossed in a rich, cheesy Alfredo cream sauce with tender garden vegetables.",
    isVeg: true,
    isAvailable: true,
    isSpecial: true
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

  // --- BURGER ---
  {
    id: "th_aloo_tikki_burger",
    name: "Aloo Tikki Burger",
    category: "burger",
    price: 79,
    description: "A crispy, golden aloo tikki layered with fresh veggies and creamy sauces in a soft bun.",
    isVeg: true,
    isAvailable: true
  },
  {
    id: "th_double_cheese_veg_burger",
    name: "Double Cheese Vegetable Burger",
    category: "burger",
    price: 99,
    description: "Vegetable burger with double cheese, ttomato, lettuce jalapenos",
    isVeg: true,
    isAvailable: true
  },
  {
    id: "th_cottage_cheese_burger",
    name: "Cottage Cheese Burger",
    category: "burger",
    price: 109,
    description: "Cottage cheese patty with tomato, onion & barbecue sauce",
    isVeg: true,
    isAvailable: true
  },
  {
    id: "th_double_tikki_cheese_burger",
    name: "Double Tikki Cheese Burger",
    category: "burger",
    price: 129,
    description: "Two crispy, flavour-packed veggie patties layered with melted cheese, fresh veggies, and our signature sauces.",
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
  },

  // --- PIZZA ---
  {
    id: "th_simple_veg_pizza",
    name: "Simple Veg Pizza",
    category: "pizza",
    price: 179,
    description: "Choice of: 1. Cheese & Corn, 2. Cheese & Onion, 3. Cheese & Capsicum",
    isVeg: true,
    isAvailable: true
  },
  {
    id: "th_margherita_pizza",
    name: "Margherita Pizza",
    category: "pizza",
    price: 199,
    description: "Fresh tomato sauce , basil & mozzarella",
    isVeg: true,
    isAvailable: true
  },
  {
    id: "th_the_hero_pizza",
    name: "The Hero Pizza",
    category: "pizza",
    price: 259,
    description: "Onion, capsicum, tomato, mushrooms & corn",
    isVeg: true,
    isAvailable: true,
    isSpecial: true
  },
  {
    id: "th_paneer_tikka_pizza",
    name: "Paneer Tikka Pizza",
    category: "pizza",
    price: 279,
    description: "Paneer topping, Indian flavourful sauce with cheese",
    isVeg: true,
    isAvailable: true
  },
  {
    id: "th_neapolitan_pizza",
    name: "Neapolitan Pizza (8 slice)",
    category: "pizza",
    price: 319,
    description: "You can also customize your slice with favourite toppings",
    isVeg: true,
    isAvailable: true,
    isSpecial: true
  },

  // --- MOMO ---
  {
    id: "th_steamed_veg_momo",
    name: "Steamed Veg Momo",
    category: "momo",
    price: 109,
    description: "Delicate steamed dumplings stuffed with finely minced garden vegetables and herbs, served with spicy red chutney.",
    isVeg: true,
    isAvailable: true
  },
  {
    id: "th_fried_veg_momo",
    name: "Fried Veg Momo",
    category: "momo",
    price: 119,
    description: "Crispy golden fried vegetable momos served hot with signature dip.",
    isVeg: true,
    isAvailable: true
  },
  {
    id: "th_kurkure_veg_momo",
    name: "Kurkure Veg Momo",
    category: "momo",
    price: 139,
    description: "Coated in spiced crunch crust, deep-fried until ultra-crispy.",
    isVeg: true,
    isAvailable: true
  },
  {
    id: "th_crunchy_veg_momo",
    name: "Crunchy Veg Momo",
    category: "momo",
    price: 149,
    description: "Extra-crunchy panko-crusted vegetable momos tossed with cafe seasoning.",
    isVeg: true,
    isAvailable: true
  },
  {
    id: "th_steamed_paneer_momo",
    name: "Steamed Paneer Momo",
    category: "momo",
    price: 119,
    description: "Soft steamed dumplings stuffed with spiced cottage cheese and aromatics.",
    isVeg: true,
    isAvailable: true
  },
  {
    id: "th_fried_paneer_momo",
    name: "Fried Paneer Momo",
    category: "momo",
    price: 139,
    description: "Golden crisp fried dumplings packed with rich, savory paneer filling.",
    isVeg: true,
    isAvailable: true
  },
  {
    id: "th_kurkure_paneer_momo",
    name: "Kurkure Paneer Momo",
    category: "momo",
    price: 149,
    description: "Flavourful paneer dumplings enveloped in a crackling kurkure batter.",
    isVeg: true,
    isAvailable: true
  },
  {
    id: "th_crunchy_paneer_momo",
    name: "Crunchy Paneer Momo",
    category: "momo",
    price: 159,
    description: "Premium paneer momos fried with a special crunchy coating.",
    isVeg: true,
    isAvailable: true
  },
  {
    id: "th_veg_heaven_momo",
    name: "Veg Heaven Momo",
    category: "momo",
    price: 139,
    description: "House-special recipe loaded with lush vegetables and secret herbs.",
    isVeg: true,
    isAvailable: true
  },
  {
    id: "th_paneer_heaven_momo",
    name: "Paneer Heaven Momo",
    category: "momo",
    price: 149,
    description: "Mouth-watering paneer momos in chef's heavenly seasoning.",
    isVeg: true,
    isAvailable: true
  },
  {
    id: "th_butter_steamed_veg_momo",
    name: "Butter Steamed Veg Momo",
    category: "momo",
    price: 119,
    description: "Steamed veg dumplings glazed with melted Amul butter.",
    isVeg: true,
    isAvailable: true
  },
  {
    id: "th_butter_steamed_paneer_momo",
    name: "Butter Steamed Paneer Momo",
    category: "momo",
    price: 129,
    description: "Steamed paneer dumplings generously brushed with warm butter.",
    isVeg: true,
    isAvailable: true
  },
  {
    id: "th_cheese_corn_steamed_momo",
    name: "Cheese & Corn Steamed Momo",
    category: "momo",
    price: 139,
    description: "Melted cheese and sweet golden corn inside tender steamed dumplings.",
    isVeg: true,
    isAvailable: true
  },
  {
    id: "th_cheese_corn_fried_momo",
    name: "Cheese & Corn Fried Momo",
    category: "momo",
    price: 149,
    description: "Crispy fried momos oozing with gooey cheese and sweet corn.",
    isVeg: true,
    isAvailable: true
  },
  {
    id: "th_cheese_corn_crunchy_momo",
    name: "Cheese & Corn Crunchy Momo",
    category: "momo",
    price: 169,
    description: "Extra crispy coated dumplings filled with melted cheese and corn.",
    isVeg: true,
    isAvailable: true,
    isSpecial: true
  },
  {
    id: "th_cheese_corn_kurkure_momo",
    name: "Cheese & Corn Kurkure Momo",
    category: "momo",
    price: 159,
    description: "Signature kurkure crunchy layer stuffed with hot melted cheese and corn.",
    isVeg: true,
    isAvailable: true
  },

  // --- RICE ---
  {
    id: "th_veg_fried_rice",
    name: "Veg Fried Rice",
    category: "rice",
    price: 139,
    description: "Fragrant wok-fried long grain basmati rice tossed with fresh garden vegetables and mild soya.",
    isVeg: true,
    isAvailable: true
  },
  {
    id: "th_paneer_fried_rice",
    name: "Paneer Fried Rice",
    category: "rice",
    price: 159,
    description: "Wok-seared fried rice loaded with golden spiced paneer cubes and spring onions.",
    isVeg: true,
    isAvailable: true
  },
  {
    id: "th_schezwan_fried_rice",
    name: "Schezwan Fried Rice",
    category: "rice",
    price: 149,
    description: "Fiery wok-tossed rice flavored with bold in-house Schezwan pepper sauce and herbs.",
    isVeg: true,
    isAvailable: true
  },

  // --- PANEER ---
  {
    id: "th_chilli_paneer",
    name: "Chilli Paneer",
    category: "paneer",
    price: 179,
    description: "Crispy fried cottage cheese cubes tossed with bell peppers, onions, and spicy Indo-Chinese chilli glaze.",
    isVeg: true,
    isAvailable: true,
    isSpecial: true
  },
  {
    id: "th_lemon_paneer",
    name: "Lemon Paneer",
    category: "paneer",
    price: 199,
    description: "Zesty stir-fried paneer cubes infused with fresh lemon glaze, ginger, and cracked peppercorns.",
    isVeg: true,
    isAvailable: true
  },
  {
    id: "th_paneer_65",
    name: "Paneer 65",
    category: "paneer",
    price: 219,
    description: "South Indian style spiced crisp paneer bites tempered with curry leaves, mustard seeds, and red chillies.",
    isVeg: true,
    isAvailable: true,
    isSpecial: true
  },

  // --- SNACKS ---
  {
    id: "th_salted_french_fries",
    name: "Salted French Fries",
    category: "snacks",
    price: 99,
    description: "Classic golden crisp potato fries sprinkled with fine sea salt.",
    isVeg: true,
    isAvailable: true
  },
  {
    id: "th_peri_peri_french_fries",
    name: "Peri Peri French Fries",
    category: "snacks",
    price: 119,
    description: "Crisp potato fries dusted heavily with tangy and spicy African peri-peri seasoning.",
    isVeg: true,
    isAvailable: true
  },
  {
    id: "th_cheese_loaded_french_fries",
    name: "Cheese Loaded French Fries",
    category: "snacks",
    price: 129,
    description: "Hot golden fries smothered in creamy warm cheese sauce and herbs.",
    isVeg: true,
    isAvailable: true,
    isSpecial: true
  },
  {
    id: "th_chilli_potato",
    name: "Chilli Potato",
    category: "snacks",
    price: 149,
    description: "Crispy potato fingers tossed with sweet & spicy chilli reduction and spring onions.",
    isVeg: true,
    isAvailable: true
  },
  {
    id: "th_honey_chilli_potato",
    name: "Honey Chilli Potato",
    category: "snacks",
    price: 159,
    description: "Crispy finger potatoes glazed with sweet blossom honey, roasted sesame, and spicy red chillies.",
    isVeg: true,
    isAvailable: true,
    isSpecial: true
  },
  {
    id: "th_crispy_corn",
    name: "Crispy Corn",
    category: "snacks",
    price: 129,
    description: "Crunchy golden sweet corn kernels tossed with diced onions, green chillies, chaat spices, and fresh coriander.",
    isVeg: true,
    isAvailable: true
  },
  {
    id: "th_chilli_mushroom",
    name: "Chilli Mushroom",
    category: "snacks",
    price: 149,
    description: "Batter-crisped whole button mushrooms tossed in savoury garlic and chilli reduction.",
    isVeg: true,
    isAvailable: true
  },

  // --- ROLL ---
  {
    id: "th_veg_roll",
    name: "Veg Roll",
    category: "roll",
    price: 79,
    description: "Flaky paratha wrap stuffed with spiced sautéed garden vegetables and tangy mint sauce.",
    isVeg: true,
    isAvailable: true
  },
  {
    id: "th_paneer_roll",
    name: "Paneer Roll",
    category: "roll",
    price: 99,
    description: "Tender spiced cottage cheese strips wrapped with sliced onions, capsicum, and chaat masala.",
    isVeg: true,
    isAvailable: true
  },
  {
    id: "th_spring_roll",
    name: "Spring Roll",
    category: "roll",
    price: 119,
    description: "Golden crispy fried rolls stuffed with shredded cabbage, carrots, and sweet chilli glaze.",
    isVeg: true,
    isAvailable: true
  },
  {
    id: "th_veg_cheese_roll",
    name: "Veg Cheese Roll",
    category: "roll",
    price: 89,
    description: "Garden fresh veggie filling layered with rich melted cheese inside a toasted wrap.",
    isVeg: true,
    isAvailable: true
  },
  {
    id: "th_paneer_cheese_roll",
    name: "Paneer Cheese Roll",
    category: "roll",
    price: 109,
    description: "Spiced paneer cubes topped with melted cheese, spicy sauces, and crunchy onions.",
    isVeg: true,
    isAvailable: true,
    isSpecial: true
  },

  // --- COMBO ---
  {
    id: "th_combo_1",
    name: "COMBO 1",
    category: "combo",
    price: 159,
    description: "Fries, Aloo Tikki Burger, Cold Drink",
    isVeg: true,
    isAvailable: true,
    isSpecial: true
  },
  {
    id: "th_combo_2",
    name: "COMBO 2",
    category: "combo",
    price: 199,
    description: "Fries, Double Cheese Burger, Cold Coffee",
    isVeg: true,
    isAvailable: true,
    isSpecial: true
  },
  {
    id: "th_combo_3",
    name: "COMBO 3",
    category: "combo",
    price: 209,
    description: "Chilli Paneer, Fried Rice",
    isVeg: true,
    isAvailable: true,
    isSpecial: true
  },

  // --- WAFFLES ---
  {
    id: "th_chocolate_chip_waffle",
    name: "Chocolate Chip Waffle",
    category: "waffles",
    price: 109,
    description: "Golden Belgian waffle loaded with rich melted chocolate chips and dark chocolate drizzle.",
    isVeg: true,
    isAvailable: true
  },
  {
    id: "th_chocolate_creamy_waffle",
    name: "Chocolate & Creamy Waffle",
    category: "waffles",
    price: 129,
    description: "Warm crispy waffle topped with smooth whipped cream and decadent warm chocolate ganache.",
    isVeg: true,
    isAvailable: true
  },
  {
    id: "th_rainbow_waffle",
    name: "Rainbow Waffle",
    category: "waffles",
    price: 149,
    description: "Colorful delightful waffle topped with sweet vanilla cream, rainbow sprinkles, and berry drizzle.",
    isVeg: true,
    isAvailable: true,
    isSpecial: true
  },

  // --- SHAKES ---
  {
    id: "th_cold_coffee",
    name: "Cold Coffee",
    category: "shakes",
    price: 109,
    description: "Classic creamy iced cafe blend brewed with rich espresso and chilled milk.",
    isVeg: true,
    isAvailable: true,
    isSpecial: true
  },
  {
    id: "th_kitkat_shake",
    name: "Kitkat Shake",
    category: "shakes",
    price: 129,
    description: "Thick chocolate milkshake blended with crunchy KitKat wafers and chocolate syrup.",
    isVeg: true,
    isAvailable: true
  },
  {
    id: "th_vanilla_shake",
    name: "Vanilla Shake",
    category: "shakes",
    price: 129,
    description: "Smooth and creamy classic vanilla bean shake topped with whipped cream.",
    isVeg: true,
    isAvailable: true
  },
  {
    id: "th_oreo_shake",
    name: "Oreo Shake",
    category: "shakes",
    price: 129,
    description: "Rich blended shake packed with crushed chocolate Oreo cookies and vanilla ice cream.",
    isVeg: true,
    isAvailable: true,
    isSpecial: true
  },
  {
    id: "th_butterscotch_shake",
    name: "Butterscotch Shake",
    category: "shakes",
    price: 129,
    description: "Creamy butterscotch shake studded with crunchy caramel praline crunchies.",
    isVeg: true,
    isAvailable: true
  },
  {
    id: "th_strawberry_shake",
    name: "Strawberry Shake",
    category: "shakes",
    price: 129,
    description: "Refreshing sweet strawberry puree blended into a luscious velvety shake.",
    isVeg: true,
    isAvailable: true
  },
  {
    id: "th_chocolate_shake",
    name: "Chocolate Shake",
    category: "shakes",
    price: 129,
    description: "Indulgent double cocoa chocolate thick shake with rich chocolate fudge swirl.",
    isVeg: true,
    isAvailable: true
  },
  {
    id: "th_hazelnut_shake",
    name: "Hazelnut Shake",
    category: "shakes",
    price: 129,
    description: "Fragrant roasted hazelnut and chocolate blended into an ultra-smooth cafe shake.",
    isVeg: true,
    isAvailable: true
  },

  // --- DESI CUISINE ---
  {
    id: "th_dal_tadka",
    name: "Dal Tadka",
    category: "desi",
    price: 139,
    description: "Yellow lentils tempered with fragrant garlic, cumin seeds, tomatoes, and dry red chillies. (Half: ₹139 / Full: ₹199)",
    portions: [
      { id: "half", label: "Half", price: 139 },
      { id: "full", label: "Full", price: 199 }
    ],
    options: [
      {
        name: "Portion Size",
        choices: [
          { label: "Half Portion", price: 0 },
          { label: "Full Portion", price: 60 }
        ]
      }
    ],
    isVeg: true,
    isAvailable: true
  },
  {
    id: "th_dal_makhani",
    name: "Dal Makhani",
    category: "desi",
    price: 169,
    description: "Slow-cooked black urad dal simmered overnight with cream, butter, and mild spices. (Half: ₹169 / Full: ₹239)",
    portions: [
      { id: "half", label: "Half", price: 169 },
      { id: "full", label: "Full", price: 239 }
    ],
    options: [
      {
        name: "Portion Size",
        choices: [
          { label: "Half Portion", price: 0 },
          { label: "Full Portion", price: 70 }
        ]
      }
    ],
    isVeg: true,
    isAvailable: true,
    isSpecial: true
  },
  {
    id: "th_matar_paneer",
    name: "Matar Paneer",
    category: "desi",
    price: 169,
    description: "Tender paneer cubes and sweet green peas simmered in homestyle spiced onion tomato gravy. (Half: ₹169 / Full: ₹239)",
    portions: [
      { id: "half", label: "Half", price: 169 },
      { id: "full", label: "Full", price: 239 }
    ],
    options: [
      {
        name: "Portion Size",
        choices: [
          { label: "Half Portion", price: 0 },
          { label: "Full Portion", price: 70 }
        ]
      }
    ],
    isVeg: true,
    isAvailable: true
  },
  {
    id: "th_shahi_paneer",
    name: "Shahi Paneer",
    category: "desi",
    price: 159,
    description: "Royal cottage cheese simmered in a velvety cashew, melon seed, and saffron-scented gravy. (Half: ₹159 / Full: ₹249)",
    portions: [
      { id: "half", label: "Half", price: 159 },
      { id: "full", label: "Full", price: 249 }
    ],
    options: [
      {
        name: "Portion Size",
        choices: [
          { label: "Half Portion", price: 0 },
          { label: "Full Portion", price: 90 }
        ]
      }
    ],
    isVeg: true,
    isAvailable: true
  },
  {
    id: "th_kadhai_paneer",
    name: "Kadhai Paneer",
    category: "desi",
    price: 169,
    description: "Paneer cubes tossed with crunchy capsicum, onions, and freshly pounded kadhai spices. (Half: ₹169 / Full: ₹249)",
    portions: [
      { id: "half", label: "Half", price: 169 },
      { id: "full", label: "Full", price: 249 }
    ],
    options: [
      {
        name: "Portion Size",
        choices: [
          { label: "Half Portion", price: 0 },
          { label: "Full Portion", price: 80 }
        ]
      }
    ],
    isVeg: true,
    isAvailable: true
  },
  {
    id: "th_paneer_butter_masala",
    name: "Paneer Butter Masala",
    category: "desi",
    price: 189,
    description: "Rich buttery tomato makhani gravy infused with kasuri methi and soft paneer chunks. (Half: ₹189 / Full: ₹279)",
    portions: [
      { id: "half", label: "Half", price: 189 },
      { id: "full", label: "Full", price: 279 }
    ],
    options: [
      {
        name: "Portion Size",
        choices: [
          { label: "Half Portion", price: 0 },
          { label: "Full Portion", price: 90 }
        ]
      }
    ],
    isVeg: true,
    isAvailable: true,
    isSpecial: true
  },
  {
    id: "th_paneer_lababdar",
    name: "Paneer Lababdar",
    category: "desi",
    price: 179,
    description: "Luscious gravy enriched with grated paneer, fresh cream, onions, and aromatic herbs. (Half: ₹179 / Full: ₹279)",
    portions: [
      { id: "half", label: "Half", price: 179 },
      { id: "full", label: "Full", price: 279 }
    ],
    options: [
      {
        name: "Portion Size",
        choices: [
          { label: "Half Portion", price: 0 },
          { label: "Full Portion", price: 100 }
        ]
      }
    ],
    isVeg: true,
    isAvailable: true
  },
  {
    id: "th_paneer_do_pyaza",
    name: "Paneer Do Pyaza",
    category: "desi",
    price: 169,
    description: "Paneer cooked with twice the quantity of sautéed onions in a robust semi-dry masala. (Half: ₹169 / Full: ₹249)",
    portions: [
      { id: "half", label: "Half", price: 169 },
      { id: "full", label: "Full", price: 249 }
    ],
    options: [
      {
        name: "Portion Size",
        choices: [
          { label: "Half Portion", price: 0 },
          { label: "Full Portion", price: 80 }
        ]
      }
    ],
    isVeg: true,
    isAvailable: true
  },
  {
    id: "th_classic_mix_veg",
    name: "Classic Mix Veg",
    category: "desi",
    price: 169,
    description: "Seasonal cauliflower, carrots, beans, peas, and paneer cooked in aromatic North Indian spices. (Half: ₹169 / Full: ₹239)",
    portions: [
      { id: "half", label: "Half", price: 169 },
      { id: "full", label: "Full", price: 239 }
    ],
    options: [
      {
        name: "Portion Size",
        choices: [
          { label: "Half Portion", price: 0 },
          { label: "Full Portion", price: 70 }
        ]
      }
    ],
    isVeg: true,
    isAvailable: true
  },

  // --- BREADS ---
  {
    id: "th_plain_paratha",
    name: "Plain Paratha",
    category: "breads",
    price: 30,
    description: "Flaky golden pan-toasted layered whole wheat flatbread.",
    isVeg: true,
    isAvailable: true
  },
  {
    id: "th_aloo_paratha",
    name: "Aloo Paratha",
    category: "breads",
    price: 60,
    description: "Crispy tawa paratha stuffed with spiced mashed potatoes, fresh coriander, and green chillies.",
    isVeg: true,
    isAvailable: true
  },
  {
    id: "th_paneer_paratha",
    name: "Paneer Paratha",
    category: "breads",
    price: 80,
    description: "Golden stuffed paratha packed with seasoned grated cottage cheese and herbs.",
    isVeg: true,
    isAvailable: true,
    isSpecial: true
  },
  {
    id: "th_mix_paratha",
    name: "Mix Paratha",
    category: "breads",
    price: 70,
    description: "Multi-grain stuffed flatbread loaded with mixed spiced vegetables and paneer.",
    isVeg: true,
    isAvailable: true
  },
  {
    id: "th_laccha_paratha",
    name: "Laccha Paratha",
    category: "breads",
    price: 40,
    description: "Traditional crispy multi-layered flaky flatbread baked with butter glaze.",
    isVeg: true,
    isAvailable: true
  },
  {
    id: "th_plain_tawa_roti",
    name: "Plain Tawa Roti",
    category: "breads",
    price: 12,
    description: "Freshly made soft whole wheat phulka roti from the iron tawa.",
    isVeg: true,
    isAvailable: true
  },
  {
    id: "th_butter_tawa_roti",
    name: "Butter Tawa Roti",
    category: "breads",
    price: 14,
    description: "Hot whole wheat tawa roti generously brushed with pure Amul butter.",
    isVeg: true,
    isAvailable: true
  },
  {
    id: "th_plain_naan",
    name: "Plain Naan",
    category: "breads",
    price: 35,
    description: "Soft and pillowy clay oven baked tandoor bread.",
    isVeg: true,
    isAvailable: true
  },
  {
    id: "th_butter_naan",
    name: "Butter Naan",
    category: "breads",
    price: 45,
    description: "Classic tender naan glazed with rich melted butter and toasted till golden brown.",
    isVeg: true,
    isAvailable: true,
    isSpecial: true
  },
  {
    id: "th_missi_roti",
    name: "Missi Roti",
    category: "breads",
    price: 20,
    description: "Wholesome spiced gram flour flatbread infused with carom seeds, kasuri methi, and onions.",
    isVeg: true,
    isAvailable: true
  },

  // --- PLATTER ---
  {
    id: "th_students_tawa_thali",
    name: "Students Tawa Thali",
    category: "platter",
    price: 110,
    description: "1 sabji, 4 chapati, salad",
    isVeg: true,
    isAvailable: true,
    isSpecial: true
  },
  {
    id: "th_students_special_tawa_thali",
    name: "Students Special Tawa Thali",
    category: "platter",
    price: 200,
    description: "2 sabji, 4 chapati, salad, rice, raita",
    isVeg: true,
    isAvailable: true,
    isSpecial: true
  },
  {
    id: "th_delux_tawa_thali",
    name: "Delux Tawa Thali",
    category: "platter",
    price: 240,
    description: "3 sabji, 4 chapati, salad, rice, raita, sweets",
    isVeg: true,
    isAvailable: true,
    isSpecial: true
  },
  {
    id: "th_tandoori_thali",
    name: "Tandoori Thali",
    category: "platter",
    price: 300,
    description: "3 sabji, 1 butter naan, 1 laccha paratha, salad, rice, raita, sweets",
    isVeg: true,
    isAvailable: true,
    isSpecial: true
  }
];
