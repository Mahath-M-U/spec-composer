import type { PresetArtworkId } from "./resize-preset-preview";

/** Intentional editorial aliases; illustration choice never changes format data. */
export const FORMAT_ARTWORK = {
  "instagram-post": "instagram-post",
  "instagram-square": "instagram-post",
  "instagram-story": "instagram-story",
  "instagram-reel": "youtube-short",
  "instagram-ad": "instagram-ad",
  "instagram-animated-post": "facebook-square",
  "instagram-feed-ad": "instagram-ad",
  "instagram-story-ad": "instagram-story",
  "whatsapp-status": "instagram-story",
  "whatsapp-good-morning": "instagram-story",
  "whatsapp-good-night": "youtube-short",
  "facebook-post": "facebook-landscape",
  "facebook-cover": "facebook-cover",
  "facebook-ad": "facebook-landscape",
  "facebook-event-cover": "facebook-cover",
  "facebook-video": "video-full-hd",
  "facebook-story": "instagram-story",
  "facebook-app-ad": "youtube-thumbnail",
  "facebook-shops-ad": "facebook-square",
  "facebook-shops-cover": "facebook-cover",
  "facebook-animated-cover": "facebook-cover",
  "facebook-shops-logo": "instagram-post",
  "facebook-feed-ad": "instagram-ad",
  "linkedin-banner": "linkedin-banner",
  "linkedin-career-background": "linkedin-post",
  "linkedin-carousel": "linkedin-square",
  "linkedin-life-tab": "linkedin-post",
  "linkedin-post": "linkedin-square",
  "linkedin-profile": "linkedin-square",
  "linkedin-single-image-ad": "linkedin-post",
  "linkedin-video-ad": "youtube-channel",
  "x-post": "x-post",
  "youtube-thumbnail": "youtube-thumbnail",
  "youtube-intro": "video-4k-uhd",
  "tiktok-video": "youtube-short",
  "pinterest-pin": "instagram-ad",
  "history-template": "linkedin-square",
  "social-post": "x-square",
  "animated-social-post": "facebook-square",
} as const satisfies Record<string, PresetArtworkId>;

export function formatArtworkId(id: string): PresetArtworkId | undefined {
  return Object.hasOwn(FORMAT_ARTWORK, id)
    ? FORMAT_ARTWORK[id as keyof typeof FORMAT_ARTWORK]
    : undefined;
}
