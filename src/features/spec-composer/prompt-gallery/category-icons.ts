import {
  Aperture,
  Camera,
  Car,
  Eraser,
  Flame,
  History,
  Image as ImageIcon,
  Package,
  Palette,
  Shirt,
  SlidersHorizontal,
  Sparkles,
  Sun,
  UserRound,
  WandSparkles,
  type LucideIcon,
} from "lucide-react";

// Keys are the category strings from catalog.ts and the group() calls in
// curated-prompts.ts. Keep them in sync; unknown categories fall back below.
const categoryIcons: Record<string, LucideIcon> = {
  Trending: Flame,
  "Cinematic selfie": Camera,
  Backgrounds: ImageIcon,
  "Portrait retouch": UserRound,
  "Portrait · Editorial": Aperture,
  "Automotive · Cinematic": Car,
  "Style transfer": Palette,
  "Outfit edits": Shirt,
  "Color grading": SlidersHorizontal,
  "Object removal": Eraser,
  "Photo restoration": History,
  "Product photography": Package,
  "Creative effects": WandSparkles,
  Lighting: Sun,
};

export function categoryIcon(category: string): LucideIcon {
  return categoryIcons[category] ?? Sparkles;
}
