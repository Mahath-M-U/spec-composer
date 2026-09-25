import type { AssetItem } from "../types.ts";

const PHONE_SIZE = { h: 0.62, aspect: 280 / 420 };
const BROWSER_SIZE = { w: 0.72, aspect: 420 / 300 };

/** Device mockups, mobile app screens, web pages, social surfaces and chart
 * placeholders: the "UI & devices" collection. */
export const uiItems: AssetItem[] = [
  // Devices (8)
  {
    id: "devices-phone-blank",
    label: "Phone, blank",
    category: "devices",
    kind: "supportingImage",
    tags: ["phone", "device", "mockup", "blank", "smartphone"],
    prompt:
      "Blank smartphone mockup in straight-on front view with thin even bezels and a softly rounded screen, minimal flat vector illustration style, gentle drop shadow beneath the device, screen tinted with the primary brand color",
    art: "devices-phone-blank",
    size: PHONE_SIZE,
  },
  {
    id: "devices-phone-app",
    label: "Phone app",
    category: "devices",
    kind: "supportingImage",
    tags: ["phone", "device", "mockup", "app", "smartphone"],
    prompt:
      "Smartphone mockup in straight-on front view showing a generic app home screen with a header, rounded content cards and a bottom highlight button, clean flat interface, primary brand color accents throughout",
    art: "phone-app",
    size: PHONE_SIZE,
    popularRank: 3,
  },
  {
    id: "devices-tablet",
    label: "Tablet",
    category: "devices",
    kind: "supportingImage",
    tags: ["tablet", "device", "mockup", "ipad-style", "screen"],
    prompt:
      "Blank tablet mockup in straight-on front view with slim bezels and a rounded-corner screen, minimal flat vector illustration style, soft shadow beneath the device, screen tinted with the secondary brand color",
    art: "devices-tablet",
    size: { h: 0.55, aspect: 360 / 420 },
  },
  {
    id: "devices-laptop",
    label: "Laptop",
    category: "devices",
    kind: "supportingImage",
    tags: ["laptop", "device", "mockup", "computer", "screen"],
    prompt:
      "Laptop mockup in a three-quarter desk view with an open hinge and a wide screen, minimal flat vector illustration style, soft shadow beneath the base, screen tinted with the primary brand color",
    art: "laptop-screen",
    size: { w: 0.55, aspect: 400 / 300 },
  },
  {
    id: "devices-desktop-monitor",
    label: "Desktop monitor",
    category: "devices",
    kind: "supportingImage",
    tags: ["monitor", "device", "mockup", "desktop", "screen"],
    prompt:
      "Desktop monitor mockup on a slim stand in straight-on front view, minimal flat vector illustration style, generous bezel and a short cable hint below the stand, screen tinted with the secondary brand color",
    art: "devices-desktop-monitor",
    size: { w: 0.55, aspect: 400 / 320 },
  },
  {
    id: "devices-smartwatch",
    label: "Smartwatch",
    category: "devices",
    kind: "supportingImage",
    tags: ["watch", "device", "mockup", "wearable", "screen"],
    prompt:
      "Smartwatch mockup in straight-on front view with a rounded-square face and a slim strap top and bottom, minimal flat vector illustration style, primary brand color accents on the watch face",
    art: "devices-smartwatch",
    size: { h: 0.42, aspect: 240 / 320 },
  },
  {
    id: "devices-browser-blank",
    label: "Browser, blank",
    category: "devices",
    kind: "supportingImage",
    tags: ["browser", "device", "mockup", "window", "blank"],
    prompt:
      "Blank browser window mockup with a minimal top toolbar and three tab dots, flat vector illustration style, generous white page area below, soft outer shadow, secondary brand color toolbar accent",
    art: "devices-browser-blank",
    size: BROWSER_SIZE,
  },
  {
    id: "devices-phone-laptop",
    label: "Phone and laptop",
    category: "devices",
    kind: "supportingImage",
    tags: ["phone", "laptop", "device", "mockup", "scene"],
    prompt:
      "Paired device mockup with an open laptop behind a smaller smartphone overlapping its lower corner, three-quarter desk view, minimal flat vector illustration style, primary brand color accents on both screens",
    art: "devices-phone-laptop",
    size: { w: 0.68, aspect: 460 / 380 },
  },

  // Mobile app screens (12)
  {
    id: "mobile-onboarding",
    label: "App onboarding",
    category: "mobile",
    kind: "supportingImage",
    tags: ["mobile", "app", "onboarding", "welcome", "screen"],
    prompt:
      "Smartphone mockup in straight-on front view showing an app onboarding screen with a large illustration panel, three progress dots and a rounded call-to-action button, clean flat interface, primary brand color accents",
    art: "phone-onboarding",
    size: PHONE_SIZE,
  },
  {
    id: "mobile-login",
    label: "App login",
    category: "mobile",
    kind: "supportingImage",
    tags: ["mobile", "app", "login", "sign-in", "screen"],
    prompt:
      "Smartphone mockup in straight-on front view showing a sign-in screen with two input fields stacked above a rounded button, clean flat interface with a soft header label, primary brand color button fill",
    art: "phone-login",
    size: PHONE_SIZE,
  },
  {
    id: "mobile-dashboard",
    label: "App dashboard",
    category: "mobile",
    kind: "supportingImage",
    tags: ["mobile", "app", "dashboard", "stats", "screen"],
    prompt:
      "Smartphone mockup in straight-on front view showing an app dashboard with two small stat cards and a stacked list below, clean flat interface, primary and secondary brand color accents on the cards",
    art: "phone-dashboard",
    size: PHONE_SIZE,
    popularRank: 8,
  },
  {
    id: "mobile-chat",
    label: "App chat",
    category: "mobile",
    kind: "supportingImage",
    tags: ["mobile", "app", "chat", "messaging", "screen"],
    prompt:
      "Smartphone mockup in straight-on front view with thin even bezels, screen showing a messaging app with rounded chat bubbles alternating left and right, a slim header with a circular avatar and a message bar at the bottom, clean flat interface with a soft drop shadow, outgoing bubbles in the primary brand color, placeholder text as simple grey lines",
    art: "phone-chat",
    size: PHONE_SIZE,
  },
  {
    id: "mobile-product",
    label: "App product",
    category: "mobile",
    kind: "supportingImage",
    tags: ["mobile", "app", "product", "ecommerce", "screen"],
    prompt:
      "Smartphone mockup in straight-on front view showing a product detail screen with a large image panel, a title and price line, and a rounded add-to-cart button, clean flat interface, primary brand color accents",
    art: "phone-product",
    size: PHONE_SIZE,
  },
  {
    id: "mobile-checkout",
    label: "App checkout",
    category: "mobile",
    kind: "supportingImage",
    tags: ["mobile", "app", "checkout", "payment", "screen"],
    prompt:
      "Smartphone mockup in straight-on front view showing a checkout screen with an order summary list, a bold total line and a rounded pay button, clean flat interface, primary brand color button fill",
    art: "phone-checkout",
    size: PHONE_SIZE,
  },
  {
    id: "mobile-profile",
    label: "App profile",
    category: "mobile",
    kind: "supportingImage",
    tags: ["mobile", "app", "profile", "account", "screen"],
    prompt:
      "Smartphone mockup in straight-on front view showing a profile screen with a centered circular avatar, a name line, three small stat chips and a rounded edit button, clean flat interface, secondary brand color accents",
    art: "phone-profile",
    size: PHONE_SIZE,
  },
  {
    id: "mobile-map",
    label: "App map",
    category: "mobile",
    kind: "supportingImage",
    tags: ["mobile", "app", "map", "location", "screen"],
    prompt:
      "Smartphone mockup in straight-on front view showing a map screen with a tinted map area, a single location pin and a rounded info card docked at the bottom, clean flat interface, primary brand color pin",
    art: "phone-map",
    size: PHONE_SIZE,
  },
  {
    id: "mobile-music",
    label: "App music",
    category: "mobile",
    kind: "supportingImage",
    tags: ["mobile", "app", "music", "player", "screen"],
    prompt:
      "Smartphone mockup in straight-on front view showing a music player screen with a square album panel, a track title line, a thin progress bar and round playback controls, clean flat interface, primary brand color accents",
    art: "phone-music",
    size: PHONE_SIZE,
  },
  {
    id: "mobile-fitness",
    label: "App fitness",
    category: "mobile",
    kind: "supportingImage",
    tags: ["mobile", "app", "fitness", "health", "screen"],
    prompt:
      "Smartphone mockup in straight-on front view showing a fitness screen with a circular progress ring, a bold stat number and three summary rows below, clean flat interface, primary brand color progress ring",
    art: "phone-fitness",
    size: PHONE_SIZE,
  },
  {
    id: "mobile-wallet",
    label: "App wallet",
    category: "mobile",
    kind: "supportingImage",
    tags: ["mobile", "app", "wallet", "payment", "screen"],
    prompt:
      "Smartphone mockup in straight-on front view showing a wallet screen with two stacked payment cards and a short transaction list below, clean flat interface, primary brand color on the top card",
    art: "phone-wallet",
    size: PHONE_SIZE,
  },
  {
    id: "mobile-notifications",
    label: "App notifications",
    category: "mobile",
    kind: "supportingImage",
    tags: ["mobile", "app", "notifications", "alerts", "screen"],
    prompt:
      "Smartphone mockup in straight-on front view showing a notifications screen with four stacked alert rows, each with a small round icon and two text lines, clean flat interface, secondary brand color icon accents",
    art: "phone-notifications",
    size: PHONE_SIZE,
  },

  // Web pages (10)
  {
    id: "web-landing",
    label: "Landing page",
    category: "web",
    kind: "supportingImage",
    tags: ["web", "browser", "landing", "homepage", "screen"],
    prompt:
      "Desktop browser window mockup with a minimal tab bar, page showing a bold headline, a short supporting line and a rounded call-to-action button beside a large image panel, flat modern SaaS style, primary brand color button",
    art: "browser-landing",
    size: BROWSER_SIZE,
    popularRank: 4,
  },
  {
    id: "web-pricing",
    label: "Pricing page",
    category: "web",
    kind: "supportingImage",
    tags: ["web", "browser", "pricing", "plans", "screen"],
    prompt:
      "Desktop browser window mockup with a minimal tab bar, page showing a three-tier pricing table where the middle plan is raised and highlighted, each card with a large price, a short checklist and a pill button, flat modern SaaS style on a soft neutral page, highlighted plan filled with the primary brand color",
    art: "browser-pricing",
    size: BROWSER_SIZE,
  },
  {
    id: "web-features",
    label: "Features page",
    category: "web",
    kind: "supportingImage",
    tags: ["web", "browser", "features", "grid", "screen"],
    prompt:
      "Desktop browser window mockup with a minimal tab bar, page showing a three-column feature grid with a round icon and two text lines under each column, flat modern SaaS style, secondary brand color icon accents",
    art: "browser-features",
    size: BROWSER_SIZE,
  },
  {
    id: "web-testimonial",
    label: "Testimonial page",
    category: "web",
    kind: "supportingImage",
    tags: ["web", "browser", "testimonial", "review", "screen"],
    prompt:
      "Desktop browser window mockup with a minimal tab bar, page showing a centered quote panel above a small circular avatar and a name line, flat modern SaaS style on a soft neutral page, secondary brand color quote panel",
    art: "browser-testimonial",
    size: BROWSER_SIZE,
  },
  {
    id: "web-dashboard",
    label: "Web dashboard",
    category: "web",
    kind: "supportingImage",
    tags: ["web", "browser", "dashboard", "analytics", "screen"],
    prompt:
      "Desktop browser window mockup with a minimal tab bar, page showing a left sidebar, three small stat cards in a row and a large chart panel below, flat modern SaaS style, primary and secondary brand color stat cards",
    art: "browser-dashboard",
    size: BROWSER_SIZE,
  },
  {
    id: "web-blog",
    label: "Blog page",
    category: "web",
    kind: "supportingImage",
    tags: ["web", "browser", "blog", "article", "screen"],
    prompt:
      "Desktop browser window mockup with a minimal tab bar, page showing a bold article title, three body text lines and a tinted image panel in the right column, flat editorial style, secondary brand color image panel",
    art: "browser-blog",
    size: BROWSER_SIZE,
  },
  {
    id: "web-404",
    label: "404 page",
    category: "web",
    kind: "supportingImage",
    tags: ["web", "browser", "404", "error", "screen"],
    prompt:
      "Desktop browser window mockup with a minimal tab bar, page showing a large centered error mark, a short apology line and a rounded button back to the homepage, flat modern SaaS style, primary brand color button",
    art: "browser-404",
    size: BROWSER_SIZE,
  },
  {
    id: "web-signup",
    label: "Sign-up page",
    category: "web",
    kind: "supportingImage",
    tags: ["web", "browser", "signup", "form", "screen"],
    prompt:
      "Desktop browser window mockup with a minimal tab bar, page showing a centered card with two input fields stacked above a rounded sign-up button, flat modern SaaS style on a soft neutral page, primary brand color button",
    art: "browser-signup",
    size: BROWSER_SIZE,
  },
  {
    id: "web-store",
    label: "Store page",
    category: "web",
    kind: "supportingImage",
    tags: ["web", "browser", "store", "ecommerce", "screen"],
    prompt:
      "Desktop browser window mockup with a minimal tab bar, page showing a six-tile product grid with a tinted image and a price line under each tile, flat modern ecommerce style, secondary brand color tile accents",
    art: "browser-store",
    size: BROWSER_SIZE,
  },
  {
    id: "web-portfolio",
    label: "Portfolio page",
    category: "web",
    kind: "supportingImage",
    tags: ["web", "browser", "portfolio", "gallery", "screen"],
    prompt:
      "Desktop browser window mockup with a minimal tab bar, page showing an asymmetric masonry gallery of tinted image tiles at varying heights, flat modern portfolio style, secondary brand color tile accents",
    art: "browser-portfolio",
    size: BROWSER_SIZE,
  },

  // Social (8: 5 motif surfaces + 3 text presets)
  {
    id: "social-post",
    label: "Social post",
    category: "social",
    kind: "supportingImage",
    tags: ["social", "feed", "post", "mockup", "screen"],
    prompt:
      "Square social feed post mockup with a small header avatar and name line, a large tinted image panel and a row of reaction icons beneath, clean flat interface, primary and secondary brand color accents",
    art: "social-post",
    size: { w: 0.5, aspect: 1 },
  },
  {
    id: "social-story",
    label: "Social story",
    category: "social",
    kind: "supportingImage",
    tags: ["social", "story", "vertical", "mockup", "screen"],
    prompt:
      "Vertical social story mockup with three progress segments at the top, a small header avatar and a caption bar near the bottom, clean flat interface with rounded corners, primary brand color progress segment",
    art: "social-story",
    size: { h: 0.62, aspect: 220 / 360 },
  },
  {
    id: "social-reel",
    label: "Social reel",
    category: "social",
    kind: "supportingImage",
    tags: ["social", "reel", "video", "mockup", "screen"],
    prompt:
      "Vertical social video mockup with a centered play button over a tinted preview frame and three small action icons stacked along the right edge, clean flat interface, secondary brand color action icons",
    art: "social-reel",
    size: { h: 0.62, aspect: 220 / 360 },
  },
  {
    id: "social-profile",
    label: "Social profile",
    category: "social",
    kind: "supportingImage",
    tags: ["social", "profile", "grid", "mockup", "screen"],
    prompt:
      "Social profile mockup with a centered circular avatar, a name line, three small stat chips and a nine-tile photo grid below, clean flat interface, primary brand color stat chips",
    art: "social-profile",
    size: { w: 0.55, aspect: 300 / 340 },
  },
  {
    id: "social-reactions",
    label: "Social reactions",
    category: "social",
    kind: "supportingImage",
    tags: ["social", "reactions", "likes", "mockup", "card"],
    prompt:
      "Social reaction card mockup with three floating circular reaction bubbles including a heart mark over a soft rounded panel, clean flat interface, primary and secondary brand color reaction bubbles",
    art: "social-reactions",
    size: { w: 0.5, aspect: 260 / 220 },
  },
  {
    id: "social-follower-count",
    label: "Follower count",
    category: "social",
    kind: "eyebrow",
    tags: ["social", "followers", "stat", "count"],
    prompt:
      "Follower-count label in bold Inter numerals with a smaller unit word, sits on a compact single line, secondary brand color ink, reads instantly as a social stat",
    content: "24.8K followers",
    style: { fontFamily: "Inter", fontSize: 24, fontWeight: 700 },
  },
  {
    id: "social-link-in-bio",
    label: "Link in bio",
    category: "social",
    kind: "body",
    tags: ["social", "bio", "link", "caption"],
    prompt:
      "Link-in-bio prompt in medium Inter with a small upward arrow glyph, sits on a single short line near the footer, primary brand color ink, casual and legible social caption style",
    content: "Link in bio ↑",
    style: { fontFamily: "Inter", fontSize: 24, fontWeight: 500 },
  },
  {
    id: "social-handle",
    label: "Handle",
    category: "social",
    kind: "eyebrow",
    tags: ["social", "handle", "username", "tag"],
    prompt:
      "Social handle tag in medium Inter, lowercase with a leading at-symbol, sits on a single short line, secondary brand color ink, reads clearly as a profile handle",
    content: "@yourbrand",
    style: { fontFamily: "Inter", fontSize: 22, fontWeight: 500 },
  },

  // Charts (8: 6 motif charts + growth chart + big stat)
  {
    id: "charts-bar",
    label: "Bar chart",
    category: "charts",
    kind: "supportingImage",
    tags: ["chart", "bar", "data", "graph"],
    prompt:
      "Bar chart mockup with five vertical bars of varying height on a thin baseline, flat vector illustration style, one bar highlighted in the primary brand color against neutral grey bars",
    art: "chart-bar",
    size: { w: 0.55, aspect: 300 / 220 },
    popularRank: 13,
  },
  {
    id: "charts-line",
    label: "Line chart",
    category: "charts",
    kind: "supportingImage",
    tags: ["chart", "line", "data", "graph"],
    prompt:
      "Line chart mockup with a smooth rising-and-falling polyline and small round data markers on a thin baseline, flat vector illustration style, primary brand color line and markers",
    art: "chart-line",
    size: { w: 0.55, aspect: 300 / 220 },
  },
  {
    id: "charts-pie",
    label: "Pie chart",
    category: "charts",
    kind: "supportingImage",
    tags: ["chart", "pie", "data", "graph"],
    prompt:
      "Pie chart mockup with three unequal wedges, flat vector illustration style, primary brand color for the largest wedge and neutral tints for the rest",
    art: "chart-pie",
    size: { w: 0.45, aspect: 1 },
  },
  {
    id: "charts-donut",
    label: "Donut chart",
    category: "charts",
    kind: "supportingImage",
    tags: ["chart", "donut", "data", "graph"],
    prompt:
      "Donut chart mockup with three ring segments of varying length around an empty center, flat vector illustration style, primary brand color for the largest segment",
    art: "chart-donut",
    size: { w: 0.45, aspect: 1 },
  },
  {
    id: "charts-area",
    label: "Area chart",
    category: "charts",
    kind: "supportingImage",
    tags: ["chart", "area", "data", "graph"],
    prompt:
      "Area chart mockup with a filled rising curve above a thin baseline, flat vector illustration style, primary brand color fill at partial opacity beneath the line",
    art: "chart-area",
    size: { w: 0.55, aspect: 300 / 220 },
  },
  {
    id: "charts-kpi",
    label: "KPI stat",
    category: "charts",
    kind: "supportingImage",
    tags: ["chart", "kpi", "stat", "metric"],
    prompt:
      "KPI stat card mockup with a bold number block, a small upward arrow and a mini sparkline beneath, flat vector illustration style, primary brand color arrow and sparkline",
    art: "chart-kpi",
    size: { w: 0.45, aspect: 260 / 180 },
  },
  {
    id: "charts-growth",
    label: "Growth chart",
    category: "charts",
    kind: "supportingImage",
    tags: ["chart", "growth", "trend", "graph"],
    prompt:
      "Growth chart mockup with a smooth upward-sloping line over faint grid guides, flat vector illustration style, primary brand color line with a soft gradient fill beneath",
    art: "chart-growth",
    size: { w: 0.55, aspect: 400 / 300 },
  },
  {
    id: "charts-big-stat",
    label: "Big stat",
    category: "charts",
    kind: "price",
    tags: ["chart", "stat", "metric", "number"],
    prompt:
      "Big stat callout in heavy Manrope numerals with a small percent glyph, sits on its own line with generous surrounding space, primary brand color ink, reads instantly as a headline metric",
    content: "+128%",
    style: {
      fontFamily: "Manrope",
      fontSize: 72,
      fontWeight: 800,
      color: "$primary",
    },
  },
];
