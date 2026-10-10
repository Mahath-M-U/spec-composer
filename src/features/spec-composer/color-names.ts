/**
 * Nearest-name lookup for hex colors, so brand kit swatches can show a
 * human-readable name ("Tiger Lily") next to the hex code, the way palette
 * tools like Canva's Color Wheel do.
 */
const NAMED_COLORS: { name: string; hex: string }[] = [
  { name: "Black", hex: "#0A0A0A" },
  { name: "Charcoal", hex: "#26282B" },
  { name: "Slate", hex: "#495464" },
  { name: "Graphite", hex: "#3A3A3A" },
  { name: "Ash Gray", hex: "#B2BEB5" },
  { name: "Silver", hex: "#C0C0C0" },
  { name: "Cloud", hex: "#E4E4E4" },
  { name: "White", hex: "#FAFAFA" },
  { name: "Ivory", hex: "#F5F0E6" },
  { name: "Cream", hex: "#F0E6D2" },
  { name: "Taupe", hex: "#DBD7D3" },
  { name: "Sand", hex: "#D8C3A5" },
  { name: "Beige", hex: "#E1CDA8" },
  { name: "Camel", hex: "#C19A6B" },
  { name: "Tan", hex: "#B08968" },
  { name: "Coffee", hex: "#6F4E37" },
  { name: "Espresso", hex: "#4B3621" },
  { name: "Chocolate", hex: "#3D2B1F" },
  { name: "Terracotta", hex: "#C46B4B" },
  { name: "Tiger Lily", hex: "#CB674C" },
  { name: "Rust", hex: "#B7410E" },
  { name: "Burnt Orange", hex: "#CB6D51" },
  { name: "Tangerine", hex: "#F28C28" },
  { name: "Amber", hex: "#E8A33D" },
  { name: "Gold", hex: "#D4AF37" },
  { name: "Mustard", hex: "#D9A15B" },
  { name: "Honey", hex: "#E8B65A" },
  { name: "Olive", hex: "#595421" },
  { name: "Moss", hex: "#6B7A3A" },
  { name: "Fern", hex: "#4F7942" },
  { name: "Sage", hex: "#9CAF88" },
  { name: "Forest Green", hex: "#1B4332" },
  { name: "Emerald", hex: "#2E8B57" },
  { name: "Mint", hex: "#98D8C1" },
  { name: "Seafoam", hex: "#93E9BE" },
  { name: "Teal", hex: "#297C7C" },
  { name: "Cornflower", hex: "#6C95B0" },
  { name: "Steel Blue", hex: "#4682B4" },
  { name: "Denim", hex: "#3B5998" },
  { name: "Navy", hex: "#1B2A4A" },
  { name: "Sky Blue", hex: "#8FC1E3" },
  { name: "Powder Blue", hex: "#C7E0E8" },
  { name: "Indigo", hex: "#3F3B6C" },
  { name: "Periwinkle", hex: "#8A9EDB" },
  { name: "Lavender", hex: "#B7A6D6" },
  { name: "Violet", hex: "#7B4B94" },
  { name: "Plum", hex: "#5C2A4A" },
  { name: "Magenta", hex: "#C21E7C" },
  { name: "Fuchsia", hex: "#D6409F" },
  { name: "Rose", hex: "#D9738C" },
  { name: "Blush", hex: "#F0C4C4" },
  { name: "Coral", hex: "#E8836B" },
  { name: "Salmon", hex: "#F09A8C" },
  { name: "Crimson", hex: "#A31E30" },
  { name: "Scarlet", hex: "#C1272D" },
  { name: "Cherry", hex: "#8E2436" },
  { name: "Maroon", hex: "#5C1F2E" },
  { name: "Brick Red", hex: "#9E4638" },
  { name: "Lilac", hex: "#C9A8D6" },
  { name: "Orchid", hex: "#9A5B9E" },
];

function hexToRgb(hex: string): [number, number, number] | undefined {
  const match = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  const digits = match?.[1];
  if (!digits) return undefined;
  const value = Number.parseInt(digits, 16);
  return [(value >> 16) & 255, (value >> 8) & 255, value & 255];
}

const namedRgb = NAMED_COLORS.map((entry) => ({
  ...entry,
  rgb: hexToRgb(entry.hex) ?? [0, 0, 0],
}));

/** Picks readable ink ("#111311" or "#FFFFFF") for text/icons drawn over a
 * brand kit swatch, by relative luminance. */
export function brandKitTileForeground(hex: string): "#111311" | "#FFFFFF" {
  const value = Number.parseInt(hex.replace("#", ""), 16);
  const red = (value >> 16) & 255;
  const green = (value >> 8) & 255;
  const blue = value & 255;
  const luminance = (red * 299 + green * 587 + blue * 114) / 255000;
  return luminance > 0.58 ? "#111311" : "#FFFFFF";
}

/** Returns the closest named color to a hex value, or "Custom" if the hex is invalid. */
export function nearestColorName(hex: string): string {
  const rgb = hexToRgb(hex);
  if (!rgb) return "Custom";
  const [r, g, b] = rgb;

  let best = "Custom";
  let bestDistance = Infinity;
  for (const candidate of namedRgb) {
    const [cr, cg, cb] = candidate.rgb;
    const distance = (r - cr) ** 2 + (g - cg) ** 2 + (b - cb) ** 2;
    if (distance < bestDistance) {
      bestDistance = distance;
      best = candidate.name;
    }
  }
  return best;
}
