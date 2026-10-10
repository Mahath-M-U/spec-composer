import type { AssetItem } from "../types.ts";

/**
 * Topic imagery, reusing existing and Tier A motifs where a good fit
 * exists. Each of these 11 categories starts with 3 items here and gets
 * more (business, food, fashion, tech, events, seasonal, education,
 * health, travel, real estate and finance objects) once the Tier B object
 * motifs exist — see motifs/objects.tsx.
 */
export const topicsItems: AssetItem[] = [
  // Business
  {
    id: "business-team",
    label: "Team",
    category: "business",
    kind: "supportingImage",
    tags: ["business", "team", "colleagues", "office"],
    prompt:
      "Three colleagues in smart-casual clothing collaborating around a table, primary brand color accent on one figure's top",
    art: "team",
  },
  {
    id: "business-growth",
    label: "Growth",
    category: "business",
    kind: "supportingImage",
    tags: ["business", "growth", "chart", "trend"],
    prompt:
      "Upward business growth curve shown as a line chart, faint grid guides beneath, confident rising trajectory, primary brand color stroke with a soft gradient wash",
    art: "chart-growth",
  },
  {
    id: "business-presentation",
    label: "Presentation",
    category: "business",
    kind: "supportingImage",
    tags: ["business", "presentation", "slide", "meeting"],
    prompt:
      "Desktop monitor mockup displaying a business presentation slide with a bold headline and a content block, secondary brand color accents on screen",
    art: "devices-desktop-monitor",
  },

  // Food
  {
    id: "food-bowl",
    label: "Food bowl",
    category: "food",
    kind: "supportingImage",
    tags: ["food", "bowl", "meal", "dining"],
    prompt:
      "A hearty food bowl with visible ingredients and a garnish on top, primary brand color accent on the garnish",
    art: "food-bowl",
  },
  {
    id: "food-drinks",
    label: "Drinks",
    category: "food",
    kind: "supportingImage",
    tags: ["food", "drinks", "cocktail", "beverage"],
    prompt:
      "A garnished cocktail in a stemmed glass with a citrus twist, secondary brand color accent on the garnish",
    art: "cocktail",
  },
  {
    id: "food-celebration",
    label: "Celebration toast",
    category: "food",
    kind: "supportingImage",
    tags: ["food", "champagne", "toast", "celebration"],
    prompt:
      "Two clinking champagne glasses with rising bubbles, primary brand color accents on the glass rims",
    art: "champagne",
  },

  // Fashion
  {
    id: "fashion-bag",
    label: "Shopping bag",
    category: "fashion",
    kind: "productImage",
    tags: ["fashion", "bag", "retail", "shopping"],
    prompt:
      "A structured shopping bag with a folded handle, primary brand color panel on the front of the bag",
    art: "product-bag",
  },
  {
    id: "fashion-perfume",
    label: "Perfume",
    category: "fashion",
    kind: "productImage",
    tags: ["fashion", "perfume", "beauty", "fragrance"],
    prompt:
      "An elegant perfume bottle with a faceted cap, secondary brand color accent on the cap",
    art: "perfume",
  },
  {
    id: "fashion-skincare-pump",
    label: "Pump bottle",
    category: "fashion",
    kind: "productImage",
    tags: ["fashion", "skincare", "pump", "bottle", "beauty", "lotion"],
    prompt:
      "A skincare pump bottle with a blank label, a rounded clay-colored body and a black pump head",
    art: "skincare-pump",
  },
  {
    id: "fashion-product-bottle",
    label: "Beauty bottle",
    category: "fashion",
    kind: "productImage",
    tags: ["fashion", "beauty", "bottle", "cosmetics"],
    prompt:
      "A sleek cosmetic bottle with a pump lid, primary brand color label wrap around the bottle",
    art: "product-bottle",
    popularRank: 14,
  },

  // Tech
  {
    id: "tech-laptop",
    label: "Laptop workspace",
    category: "tech",
    kind: "supportingImage",
    tags: ["tech", "laptop", "workspace", "software"],
    prompt:
      "An open laptop displaying a code-editor interface, primary brand color accents on the screen",
    art: "laptop-screen",
  },
  {
    id: "tech-desktop",
    label: "Desktop workspace",
    category: "tech",
    kind: "supportingImage",
    tags: ["tech", "desktop", "software", "dashboard"],
    prompt:
      "A desktop monitor showing a software dashboard, secondary brand color accents on the screen",
    art: "devices-desktop-monitor",
  },
  {
    id: "tech-chip",
    label: "Processor chip",
    category: "tech",
    kind: "supportingImage",
    tags: ["tech", "chip", "hardware", "processor"],
    prompt:
      "A processor chip glyph representing modern hardware, primary brand color core with neutral connector pins",
    art: "ai-chip",
  },

  // Events
  {
    id: "events-stage",
    label: "Event stage",
    category: "events",
    kind: "supportingImage",
    tags: ["events", "stage", "spotlight", "live"],
    prompt:
      "A spotlighted event stage with a podium silhouette, primary brand color spotlight beam",
    art: "event-stage",
  },
  {
    id: "events-microphone",
    label: "Microphone",
    category: "events",
    kind: "supportingImage",
    tags: ["events", "microphone", "speaker", "live"],
    prompt:
      "A stage microphone on a stand, secondary brand color accent on the stand base",
    art: "microphone",
  },
  {
    id: "events-balloons",
    label: "Party balloons",
    category: "events",
    kind: "supportingImage",
    tags: ["events", "balloons", "party", "celebration"],
    prompt:
      "A cluster of floating party balloons with trailing ribbons, primary and secondary brand color balloons",
    art: "balloons",
  },

  // Seasonal
  {
    id: "seasonal-holiday",
    label: "Holiday tree",
    category: "seasonal",
    kind: "supportingImage",
    tags: ["seasonal", "holiday", "winter", "festive"],
    prompt:
      "A decorated holiday tree with ornament baubles, primary brand color ornaments",
    art: "holiday-tree",
  },
  {
    id: "seasonal-fireworks",
    label: "Fireworks",
    category: "seasonal",
    kind: "supportingImage",
    tags: ["seasonal", "fireworks", "celebration", "night"],
    prompt:
      "Bursting fireworks trails against a night sky, secondary brand color firework bursts",
    art: "fireworks",
  },
  {
    id: "seasonal-florals",
    label: "Spring florals",
    category: "seasonal",
    kind: "supportingImage",
    tags: ["seasonal", "florals", "spring", "bouquet"],
    prompt:
      "A loose bouquet of spring florals, primary brand color accent blooms",
    art: "florals",
  },

  // Education
  {
    id: "education-books",
    label: "Books",
    category: "education",
    kind: "supportingImage",
    tags: ["education", "books", "study", "reading"],
    prompt:
      "A stacked pile of books with a bookmark ribbon, primary brand color book spine",
    art: "book-stack",
  },
  {
    id: "education-graduation",
    label: "Graduation",
    category: "education",
    kind: "supportingImage",
    tags: ["education", "graduation", "achievement", "cap"],
    prompt:
      "A graduation cap with a swinging tassel, secondary brand color tassel",
    art: "graduation-cap",
  },
  {
    id: "education-idea",
    label: "Idea",
    category: "education",
    kind: "supportingImage",
    tags: ["education", "idea", "lightbulb", "innovation"],
    prompt:
      "A glowing lightbulb representing a bright idea, primary brand color glow",
    art: "lightbulb",
  },

  // Health
  {
    id: "health-heart",
    label: "Caring hands",
    category: "health",
    kind: "supportingImage",
    tags: ["health", "heart", "care", "wellness"],
    prompt:
      "Two cupped hands gently holding a small heart shape, primary brand color heart",
    art: "heart-hands",
  },
  {
    id: "health-active",
    label: "Active lifestyle",
    category: "health",
    kind: "supportingImage",
    tags: ["health", "active", "fitness", "wellness"],
    prompt:
      "An athlete mid-jump in activewear representing an active healthy lifestyle, secondary brand color activewear accent",
    art: "person-active",
  },
  {
    id: "health-calm",
    label: "Mindful calm",
    category: "health",
    kind: "supportingImage",
    tags: ["health", "calm", "meditate", "wellness"],
    prompt:
      "A person seated in a calm meditative pose representing mindful wellness, primary brand color accent",
    art: "person-meditate",
  },

  // Travel
  {
    id: "travel-city",
    label: "City skyline",
    category: "travel",
    kind: "supportingImage",
    tags: ["travel", "city", "skyline", "urban"],
    prompt:
      "A simplified city skyline with varied building silhouettes, primary brand color accent building",
    art: "city-skyline",
  },
  {
    id: "travel-landscape",
    label: "Scenic landscape",
    category: "travel",
    kind: "supportingImage",
    tags: ["travel", "landscape", "scenic", "nature"],
    prompt:
      "A scenic rolling landscape with soft hills and a simple sky, secondary brand color hill accent",
    art: "landscape",
  },
  {
    id: "travel-map",
    label: "Travel map",
    category: "travel",
    kind: "supportingImage",
    tags: ["travel", "map", "navigation", "destination"],
    prompt:
      "A smartphone showing a travel map screen with a single destination pin, primary brand color pin",
    art: "phone-map",
  },

  // Real estate
  {
    id: "realestate-house",
    label: "House",
    category: "realestate",
    kind: "supportingImage",
    tags: ["real estate", "house", "property", "home"],
    prompt:
      "A simple house silhouette with a peaked roof and a front door, primary brand color door accent",
    art: "house",
  },
  {
    id: "realestate-city",
    label: "Urban property",
    category: "realestate",
    kind: "supportingImage",
    tags: ["real estate", "city", "urban", "property"],
    prompt:
      "A row of city building silhouettes representing urban property, secondary brand color accent building",
    art: "city-skyline",
  },
  {
    id: "realestate-dashboard",
    label: "Listings dashboard",
    category: "realestate",
    kind: "supportingImage",
    tags: ["real estate", "listings", "dashboard", "property"],
    prompt:
      "A browser window showing a property-listings dashboard with stat cards, primary brand color stat cards",
    art: "browser-dashboard",
  },

  // Finance
  {
    id: "finance-growth",
    label: "Financial growth",
    category: "finance",
    kind: "supportingImage",
    tags: ["finance", "growth", "trend", "chart"],
    prompt:
      "A rising financial trend line over faint grid guides, confident upward trajectory, secondary brand color stroke with a soft gradient wash",
    art: "chart-growth",
  },
  {
    id: "finance-bar",
    label: "Financial comparison",
    category: "finance",
    kind: "supportingImage",
    tags: ["finance", "bar chart", "comparison", "data"],
    prompt:
      "A financial bar comparison chart with five columns of varying height, primary brand color highlighted column",
    art: "chart-bar",
  },
  {
    id: "finance-kpi",
    label: "Financial KPI",
    category: "finance",
    kind: "supportingImage",
    tags: ["finance", "kpi", "stat", "metric"],
    prompt:
      "A financial KPI stat card with a bold number and a mini upward sparkline, secondary brand color sparkline",
    art: "chart-kpi",
  },

  // Business (+5, using Tier B object motifs)
  {
    id: "business-briefcase",
    label: "Briefcase",
    category: "business",
    kind: "supportingImage",
    tags: ["business", "briefcase", "office", "work"],
    prompt:
      "A structured briefcase with a handle and a metal clasp, primary brand color clasp accent",
    art: "briefcase",
  },
  {
    id: "business-handshake",
    label: "Handshake",
    category: "business",
    kind: "supportingImage",
    tags: ["business", "handshake", "partnership", "deal"],
    prompt:
      "Two hands meeting in a firm handshake, secondary brand color sleeve accent",
    art: "handshake",
  },
  {
    id: "business-calendar",
    label: "Calendar",
    category: "business",
    kind: "supportingImage",
    tags: ["business", "calendar", "schedule", "planning"],
    prompt:
      "A wall calendar page with one date highlighted, primary brand color highlighted date",
    art: "calendar",
  },
  {
    id: "business-planning",
    label: "Planning",
    category: "business",
    kind: "supportingImage",
    tags: ["business", "planning", "pencil", "ruler"],
    prompt:
      "A crossed pencil and ruler representing project planning, primary brand color pencil tip",
    art: "pencil-ruler",
  },
  {
    id: "business-payments",
    label: "Payments",
    category: "business",
    kind: "supportingImage",
    tags: ["business", "payments", "card", "invoice"],
    prompt:
      "A rounded payment card with a magnetic strip and a chip, primary brand color card face",
    art: "credit-card",
  },

  // Food (+4)
  {
    id: "food-pizza",
    label: "Pizza",
    category: "food",
    kind: "supportingImage",
    tags: ["food", "pizza", "slice", "dining"],
    prompt:
      "A triangular pizza slice topped with pepperoni circles, primary brand color crust accent",
    art: "pizza",
  },
  {
    id: "food-burger",
    label: "Burger",
    category: "food",
    kind: "supportingImage",
    tags: ["food", "burger", "fast food", "dining"],
    prompt:
      "A stacked burger with a bun, patty and lettuce layer, secondary brand color bun highlight",
    art: "burger",
  },
  {
    id: "food-cake",
    label: "Cake",
    category: "food",
    kind: "supportingImage",
    tags: ["food", "cake", "dessert", "bakery"],
    prompt:
      "A two-tier celebration cake with a lit candle on top, primary brand color frosting accent",
    art: "cake",
  },
  {
    id: "food-coffee",
    label: "Coffee",
    category: "food",
    kind: "supportingImage",
    tags: ["food", "coffee", "cafe", "drink"],
    prompt:
      "A coffee cup with a curled handle and rising steam lines, secondary brand color cup body",
    art: "coffee-cup",
  },

  {
    id: "food-ceramic-mug",
    label: "Ceramic mug",
    category: "food",
    kind: "supportingImage",
    tags: ["food", "mug", "coffee", "ceramic", "cafe", "flat"],
    prompt:
      "A cream ceramic mug with a brown rim and foot and a side handle, standing on a plain surface",
    art: "mug-ceramic",
  },

  // Fashion (+3)
  {
    id: "fashion-lipstick",
    label: "Lipstick",
    category: "fashion",
    kind: "productImage",
    tags: ["fashion", "beauty", "lipstick", "makeup"],
    prompt:
      "An open lipstick tube with an angled tip, primary brand color lipstick bullet",
    art: "lipstick",
  },
  {
    id: "fashion-dress",
    label: "Dress",
    category: "fashion",
    kind: "productImage",
    tags: ["fashion", "dress", "hanger", "boutique"],
    prompt:
      "A dress silhouette on a wire hanger, secondary brand color dress fill",
    art: "hanger-dress",
  },
  {
    id: "fashion-sneaker",
    label: "Sneaker",
    category: "fashion",
    kind: "productImage",
    tags: ["fashion", "sneaker", "shoe", "streetwear"],
    prompt:
      "A side-profile sneaker with a chunky sole, primary brand color sole accent",
    art: "sneaker",
  },

  // Tech (+3)
  {
    id: "tech-controller",
    label: "Game controller",
    category: "tech",
    kind: "supportingImage",
    tags: ["tech", "gaming", "controller", "console"],
    prompt:
      "A handheld game controller with a directional pad and round buttons, primary brand color body",
    art: "game-controller",
  },
  {
    id: "tech-camera",
    label: "Camera",
    category: "tech",
    kind: "supportingImage",
    tags: ["tech", "camera", "photography", "gadget"],
    prompt:
      "A compact camera with a round lens and a small flash, secondary brand color lens ring",
    art: "camera",
  },
  {
    id: "tech-connectivity",
    label: "Connectivity",
    category: "tech",
    kind: "supportingImage",
    tags: ["tech", "globe", "connectivity", "network"],
    prompt:
      "A globe with latitude and longitude lines representing global connectivity, primary brand color globe fill",
    art: "globe",
  },

  // Events (+5)
  {
    id: "events-confetti",
    label: "Confetti",
    category: "events",
    kind: "supportingImage",
    tags: ["events", "confetti", "party", "celebration"],
    prompt:
      "Scattered confetti pieces at playful angles, alternating primary and secondary brand color pieces",
    art: "confetti",
  },
  {
    id: "events-cake",
    label: "Celebration cake",
    category: "events",
    kind: "supportingImage",
    tags: ["events", "cake", "party", "celebration"],
    prompt:
      "A celebration cake with a lit candle on top, secondary brand color frosting accent",
    art: "cake",
  },
  {
    id: "events-calendar",
    label: "Save the date",
    category: "events",
    kind: "supportingImage",
    tags: ["events", "calendar", "save the date", "schedule"],
    prompt:
      "A wall calendar page marking a save-the-date, secondary brand color highlighted date",
    art: "calendar",
  },
  {
    id: "events-photography",
    label: "Event photography",
    category: "events",
    kind: "supportingImage",
    tags: ["events", "camera", "photography", "live"],
    prompt:
      "A compact camera capturing event moments, primary brand color lens ring",
    art: "camera",
  },
  {
    id: "events-sun-waves",
    label: "Outdoor festival",
    category: "events",
    kind: "supportingImage",
    tags: ["events", "sun", "outdoor", "festival"],
    prompt:
      "A bright sun with radiating rays over gentle ground waves, primary brand color sun fill",
    art: "sun-waves",
  },

  // Seasonal (+4)
  {
    id: "seasonal-pumpkin",
    label: "Pumpkin",
    category: "seasonal",
    kind: "supportingImage",
    tags: ["seasonal", "pumpkin", "autumn", "harvest"],
    prompt:
      "A ridged pumpkin with a short stem, primary brand color ridge shading",
    art: "pumpkin",
  },
  {
    id: "seasonal-sun",
    label: "Summer sun",
    category: "seasonal",
    kind: "supportingImage",
    tags: ["seasonal", "sun", "summer", "warm"],
    prompt:
      "A radiant sun over gentle wave lines, secondary brand color sun fill",
    art: "sun-waves",
  },
  {
    id: "seasonal-beach",
    label: "Summer beach",
    category: "seasonal",
    kind: "supportingImage",
    tags: ["seasonal", "beach", "palm", "summer"],
    prompt:
      "A leaning palm tree beside a bright sun, primary brand color sun fill",
    art: "palm-beach",
  },
  {
    id: "seasonal-backpack",
    label: "Back to school",
    category: "seasonal",
    kind: "supportingImage",
    tags: ["seasonal", "backpack", "school", "autumn"],
    prompt:
      "A rounded backpack with a front pocket and shoulder straps, secondary brand color pocket accent",
    art: "backpack",
  },

  // Education (+2)
  {
    id: "education-planning",
    label: "Schoolwork",
    category: "education",
    kind: "supportingImage",
    tags: ["education", "pencil", "ruler", "study"],
    prompt:
      "A crossed pencil and ruler representing schoolwork, primary brand color pencil tip",
    art: "pencil-ruler",
  },
  {
    id: "education-backpack",
    label: "First day of school",
    category: "education",
    kind: "supportingImage",
    tags: ["education", "backpack", "school", "student"],
    prompt:
      "A rounded backpack with a front pocket and shoulder straps, primary brand color pocket accent",
    art: "backpack",
  },

  // Health (+3)
  {
    id: "health-dumbbell",
    label: "Strength training",
    category: "health",
    kind: "supportingImage",
    tags: ["health", "dumbbell", "fitness", "strength"],
    prompt:
      "A dumbbell with weighted ends on a short bar, primary brand color weight plates",
    art: "dumbbell",
  },
  {
    id: "health-pulse",
    label: "Heartbeat",
    category: "health",
    kind: "supportingImage",
    tags: ["health", "heart", "pulse", "cardio"],
    prompt:
      "A heart shape crossed by a heartbeat line, secondary brand color heartbeat line",
    art: "heart-pulse",
  },
  {
    id: "health-running",
    label: "Running",
    category: "health",
    kind: "supportingImage",
    tags: ["health", "running", "shoe", "fitness"],
    prompt:
      "A side-profile running shoe with a chunky sole, secondary brand color sole accent",
    art: "sneaker",
  },

  // Travel (+4)
  {
    id: "travel-plane",
    label: "Airplane",
    category: "travel",
    kind: "supportingImage",
    tags: ["travel", "plane", "flight", "airport"],
    prompt:
      "An airplane silhouette angled upward mid-flight, primary brand color fuselage accent",
    art: "plane",
  },
  {
    id: "travel-suitcase",
    label: "Suitcase",
    category: "travel",
    kind: "supportingImage",
    tags: ["travel", "suitcase", "luggage", "packing"],
    prompt:
      "A rolling suitcase with a top handle and belt straps, secondary brand color shell accent",
    art: "suitcase",
  },
  {
    id: "travel-beach",
    label: "Beach vacation",
    category: "travel",
    kind: "supportingImage",
    tags: ["travel", "beach", "palm", "vacation"],
    prompt:
      "A leaning palm tree beside a bright sun, secondary brand color sun fill",
    art: "palm-beach",
  },
  {
    id: "travel-coast-town",
    label: "Hillside town",
    category: "travel",
    kind: "supportingImage",
    tags: ["travel", "town", "coast", "hillside", "houses", "flat"],
    prompt:
      "A hillside seaside town with cream houses, terracotta roofs and a bell tower, and a second cluster on a headland",
    art: "coast-town",
    style: { objectFit: "cover", focalY: 1 },
    size: { w: 0.66, aspect: 900 / 400 },
  },
  {
    id: "travel-destination",
    label: "Destination pin",
    category: "travel",
    kind: "supportingImage",
    tags: ["travel", "map pin", "destination", "navigation"],
    prompt:
      "A teardrop map pin marking a destination, primary brand color pin fill",
    art: "map-pin",
  },

  // Real estate (+2)
  {
    id: "realestate-key",
    label: "Home ownership",
    category: "realestate",
    kind: "supportingImage",
    tags: ["real estate", "house", "key", "ownership"],
    prompt:
      "A house silhouette with a keyhole and key shape, primary brand color roofline accent",
    art: "house-key",
  },
  {
    id: "realestate-floorplan",
    label: "Floor plan",
    category: "realestate",
    kind: "supportingImage",
    tags: ["real estate", "floor plan", "layout", "listing"],
    prompt:
      "A simple room floor plan with wall outlines and a door swing, secondary brand color door arc",
    art: "floor-plan",
  },

  // Finance (+3)
  {
    id: "finance-coins",
    label: "Coin stack",
    category: "finance",
    kind: "supportingImage",
    tags: ["finance", "coins", "savings", "wealth"],
    prompt:
      "A short stack of overlapping coins of different sizes, primary brand color top coin",
    art: "coin-stack",
  },
  {
    id: "finance-crypto",
    label: "Crypto coin",
    category: "finance",
    kind: "supportingImage",
    tags: ["finance", "crypto", "digital currency", "coin"],
    prompt:
      "A round coin with an abstract diamond glyph at the center, secondary brand color coin face",
    art: "crypto-coin",
  },
  {
    id: "finance-savings",
    label: "Piggy bank",
    category: "finance",
    kind: "supportingImage",
    tags: ["finance", "piggy bank", "savings", "budget"],
    prompt:
      "A rounded piggy bank with a coin slot on top, primary brand color body",
    art: "piggy-bank",
  },
];
