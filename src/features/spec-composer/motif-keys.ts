/**
 * Every placeholder-art motif key, defined either in `illustrations.tsx`
 * (people figures and the original object motifs) or under `motifs/*.tsx`
 * (device, screen, AI, social, chart, object and sticker motifs added for
 * the asset library). `tests/asset-catalog.test.mjs` checks this list
 * against both sources with an fs regex, so every key here must resolve to
 * a real motif, and every motif must be listed here.
 */
export const MOTIF_KEYS = [
  // Original set (illustrations.tsx)
  "person-man",
  "person-child",
  "person-elder",
  "family",
  "person-active-man",
  "person-wheelchair",
  "portrait-man",
  "product-bottle",
  "product-bag",
  "person-standing",
  "event-stage",
  "logo-mark",
  "landscape",
  "photo-frame",
  "brand-mark",
  "food-bowl",
  "balloons",
  "laptop-screen",
  "house",
  "person-active",
  "person-meditate",
  "microphone",
  "person-portrait",
  "gift",
  "florals",
  "moon-cloud",
  "graduation-cap",
  "holiday-tree",
  "fireworks",
  "guitar",
  "book-stack",
  "chart-growth",
  "product-boxes",
  "heart-hands",
  "lightbulb",
  "phone-app",
  "champagne",
  "team",
  "bust-woman",
  "bust-man",
  "bust-woman-2",
  "bust-curly",
  "profile",
  "perfume",
  "headphones",
  "cocktail",
  "vase-set",
  "city-skyline",
  "gold-frame",
  "floral-frame",
  "laurel",
  "abstract",

  // Tier A — devices (motifs/devices.tsx)
  "devices-phone-blank",
  "devices-tablet",
  "devices-desktop-monitor",
  "devices-smartwatch",
  "devices-browser-blank",
  "devices-phone-laptop",

  // Tier A — mobile app screens (motifs/mobile-ui.tsx)
  "phone-onboarding",
  "phone-login",
  "phone-dashboard",
  "phone-chat",
  "phone-product",
  "phone-checkout",
  "phone-profile",
  "phone-map",
  "phone-music",
  "phone-fitness",
  "phone-wallet",
  "phone-notifications",

  // Tier A — web pages (motifs/web-ui.tsx)
  "browser-landing",
  "browser-pricing",
  "browser-features",
  "browser-testimonial",
  "browser-dashboard",
  "browser-blog",
  "browser-404",
  "browser-signup",
  "browser-store",
  "browser-portfolio",

  // Tier A — AI (motifs/ai.tsx)
  "ai-chat-window",
  "ai-robot",
  "ai-sparkle",
  "ai-prompt-bar",
  "ai-copilot",
  "ai-node-graph",
  "ai-voice-wave",
  "ai-chat-bubbles",
  "ai-chip",
  "ai-image-grid",
  "ai-task-list",
  "ai-agents-network",

  // Tier A — social (motifs/social.tsx)
  "social-post",
  "social-story",
  "social-reel",
  "social-profile",
  "social-reactions",

  // Tier A — charts (motifs/charts.tsx)
  "chart-bar",
  "chart-line",
  "chart-pie",
  "chart-donut",
  "chart-area",
  "chart-kpi",

  // Tier B — objects, abstract and background fills (motifs/objects.tsx)
  "briefcase",
  "handshake",
  "calendar",
  "coffee-cup",
  "pizza",
  "burger",
  "cake",
  "lipstick",
  "hanger-dress",
  "sneaker",
  "game-controller",
  "camera",
  "confetti",
  "pumpkin",
  "sun-waves",
  "pencil-ruler",
  "backpack",
  "dumbbell",
  "heart-pulse",
  "plane",
  "suitcase",
  "palm-beach",
  "map-pin",
  "globe",
  "house-key",
  "floor-plan",
  "credit-card",
  "coin-stack",
  "crypto-coin",
  "piggy-bank",
  "abstract-blobs",
  "pattern-dots",
  "spheres-3d",
  "torus-3d",
  "glass-cards",
  "sparkle-cluster",
  "polaroid",
  "brand-wordmark",
  "brand-app-icon",

  // Tier C — stickers (motifs/stickers.tsx)
  "sticker-star",
  "sticker-heart",
  "sticker-check",
  "sticker-arrow",
  "sticker-bolt",
  "sticker-fire",
  "sticker-crown",
  "sticker-thumbs-up",

  // Street scene: separate flat vector pieces (motifs/street.tsx)
  "street-crossing",
  "street-shadows",
  "street-shopfront",
  "street-facade",
  "street-sunbeams",
  "street-lamp",
  "street-tree",
  "street-railing",
  "street-planter",
  "street-cast-shadow",
  "person-walking",

  // Bathroom scene: the Everyday Skincare pieces (motifs/bathroom.tsx)
  "bathroom-wall",
  "bathroom-towel",
  "plant-vase",
  "skincare-pump",
  "bust-skincare",

  // Cafe scene: the Cafe Morning pieces (motifs/cafe.tsx)
  "cafe-interior",
  "hanging-plant",
  "person-cafe",
  "mug-ceramic",

  // Park scene: the Movement Club pieces (motifs/park.tsx)
  "park-lakeside",
  "park-stone-wall",
  "person-stretch",
  "bust-athlete",

  // Coast scene: the Coastal Weekend pieces (motifs/coast.tsx)
  "coast-promenade",
  "coast-town",
  "coast-terrace",
  "person-linen-dress",
] as const;

export type MotifKey = (typeof MOTIF_KEYS)[number];

/**
 * An art key is a motif name, optionally suffixed with ":silhouette" to draw
 * the whole motif in the document's ink as a single flat shape.
 */
export type ArtKey = MotifKey | `${MotifKey}:silhouette`;
