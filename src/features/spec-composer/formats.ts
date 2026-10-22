import type { Format } from "./types";

export const platformKeys = [
  "Popular",
  "WhatsApp",
  "Instagram",
  "Facebook",
  "LinkedIn",
  "YouTube",
  "TikTok",
  "X",
  "Pinterest",
  "History",
  "Other",
] as const;

export type PlatformFilter = (typeof platformKeys)[number];

export { formats } from "./preset-catalog";

export const platforms = platformKeys;

export function platformLabel(platform?: Format["platform"]): PlatformFilter {
  const match = platforms.find(
    (item) => item.toLowerCase() === (platform ?? "generic").toLowerCase(),
  );
  return match ?? "Other";
}
