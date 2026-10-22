import { describe, expect, it } from "vitest";
import {
  formats,
  RESIZE_PRESET_GROUPS,
  homePreset,
  resizePreset,
  dimensionRatio,
} from "./preset-catalog";
import { PRESET_ARTWORK_IDS } from "./resize-preset-preview";

const expectedHome = [
  ["instagram-post", "Instagram Post", 1080, 1350],
  ["instagram-square", "Instagram Square", 1080, 1080],
  ["instagram-story", "Instagram Story", 1080, 1920],
  ["instagram-reel", "Instagram Reel", 1080, 1920],
  ["instagram-ad", "Instagram Ad", 1080, 1350],
  ["instagram-animated-post", "Animated Instagram Post", 1080, 1350],
  ["instagram-feed-ad", "Instagram Feed Ad", 1080, 1080],
  ["instagram-story-ad", "Instagram Story Ad", 1080, 1920],
  ["whatsapp-status", "WhatsApp Status", 1080, 1920],
  ["whatsapp-good-morning", "Good Morning WhatsApp Status", 1080, 1920],
  ["whatsapp-good-night", "Good Night WhatsApp Status", 1080, 1920],
  ["facebook-post", "Facebook Post", 1200, 630],
  ["facebook-cover", "Facebook Cover", 1640, 624],
  ["facebook-ad", "Facebook Ad", 1200, 628],
  ["facebook-event-cover", "Facebook Event Cover", 1920, 1005],
  ["facebook-video", "Facebook Video", 1920, 1080],
  ["facebook-story", "Facebook Story", 1080, 1920],
  ["facebook-app-ad", "Facebook App Ad", 1200, 628],
  ["facebook-shops-ad", "Facebook Shops Ad", 1080, 1080],
  ["facebook-shops-cover", "Facebook Shops Cover", 1640, 624],
  ["facebook-animated-cover", "Animated Facebook Cover", 1640, 624],
  ["facebook-shops-logo", "Facebook Shops Logo", 500, 500],
  ["facebook-feed-ad", "Facebook Feed Ad", 1080, 1350],
  ["linkedin-banner", "LinkedIn Background Photo", 1584, 396],
  ["linkedin-career-background", "LinkedIn Career Page Background", 1128, 705],
  ["linkedin-carousel", "LinkedIn Carousel", 1080, 1350],
  ["linkedin-life-tab", "LinkedIn Life Tab", 1200, 628],
  ["linkedin-post", "LinkedIn Post", 1200, 1200],
  ["linkedin-profile", "LinkedIn Profile Picture", 400, 400],
  ["linkedin-single-image-ad", "LinkedIn Single Image Ad", 1200, 627],
  ["linkedin-video-ad", "LinkedIn Video Ad", 1080, 1080],
  ["x-post", "X Post", 1600, 900],
  ["youtube-thumbnail", "YouTube Thumbnail", 1280, 720],
  ["youtube-intro", "YouTube Intro", 1920, 1080],
  ["tiktok-video", "TikTok Video", 1080, 1920],
  ["pinterest-pin", "Pinterest Pin", 1000, 1500],
  ["history-template", "History Template", 1080, 1350],
  ["social-post", "Social Media Post", 1080, 1080],
  ["animated-social-post", "Animated Social Post", 1080, 1080],
];
const expectedResize = [
  ["instagram-post", "Post", 1080, 1080],
  ["instagram-story", "Story", 1080, 1920],
  ["instagram-ad", "Ad", 1080, 1080],
  ["facebook-landscape", "Post (Landscape)", 1200, 630],
  ["facebook-square", "Post (Square)", 1080, 1080],
  ["facebook-cover", "Cover", 851, 315],
  ["youtube-thumbnail", "Thumbnail", 1280, 720],
  ["youtube-channel", "Channel", 2560, 1440],
  ["youtube-short", "Short", 1080, 1920],
  ["linkedin-post", "Post", 1200, 627],
  ["linkedin-banner", "Banner", 1584, 396],
  ["linkedin-square", "Square", 1080, 1080],
  ["x-post", "Post", 1600, 900],
  ["x-header", "Header", 1500, 500],
  ["x-square", "Square", 1080, 1080],
  ["video-full-hd", "Full HD", 1920, 1080],
  ["video-4k-uhd", "4K UHD", 3840, 2160],
];

const resize = RESIZE_PRESET_GROUPS.flatMap((group) => group.presets);
const identity = ({
  id,
  label,
  width,
  height,
}: {
  id: string;
  label: string;
  width: number;
  height: number;
}) => [id, label, width, height];

describe("preset catalog", () => {
  it("preserves every Home and Resize name, dimension and ordering", () => {
    expect(formats).toHaveLength(39);
    expect(resize).toHaveLength(17);
    expect(formats.map(identity)).toEqual(expectedHome);
    expect(resize.map(identity)).toEqual(expectedResize);
    expect(RESIZE_PRESET_GROUPS.map((group) => group.label)).toEqual([
      "Instagram",
      "Facebook",
      "YouTube",
      "LinkedIn",
      "Twitter/X",
      "Video",
    ]);
  });
  it.each([
    [1080, 1080, "1:1"],
    [1080, 1350, "4:5"],
    [1080, 1920, "9:16"],
    [1200, 627, "400:209"],
    [1584, 396, "4:1"],
    [1640, 624, "205:78"],
    [3840, 2160, "16:9"],
  ])("derives %s by %s from dimensions", (width, height, ratio) => {
    expect(dimensionRatio(width as number, height as number)).toBe(ratio);
  });
  it("keeps conflicting IDs explicitly scoped to their original catalog", () => {
    for (const id of [
      "instagram-post",
      "instagram-ad",
      "linkedin-post",
      "facebook-cover",
    ]) {
      const home = homePreset(formats.find((format) => format.id === id)!);
      const group = RESIZE_PRESET_GROUPS.find((group) =>
        group.presets.some((preset) => preset.id === id),
      )!;
      const preset = resizePreset(
        group.presets.find((preset) => preset.id === id)!,
        group.label,
      );
      expect([home.width, home.height]).not.toEqual([
        preset.width,
        preset.height,
      ]);
      expect(home.label).toBe(
        formats.find((format) => format.id === id)!.label,
      );
      expect(preset.label).toBe(
        `${group.label} ${group.presets.find((preset) => preset.id === id)!.label}`,
      );
    }
  });
  it("adapts every preset without changing its dimensions and keeps artwork aliases explicit", () => {
    const before = JSON.stringify({ formats, resize });
    for (const format of formats) {
      const preset = homePreset(format);
      expect(identity(preset)).toEqual(identity(format));
      expect(PRESET_ARTWORK_IDS).toContain(preset.artworkId);
      expect(preset.animated).toBe(format.animated ? true : undefined);
    }
    for (const group of RESIZE_PRESET_GROUPS)
      for (const preset of group.presets) {
        const normalized = resizePreset(preset, group.label);
        expect(normalized).toMatchObject({
          id: preset.id,
          width: preset.width,
          height: preset.height,
          artworkId: preset.id,
        });
        expect(PRESET_ARTWORK_IDS).toContain(normalized.artworkId);
      }
    expect(
      homePreset(formats.find((format) => format.id === "linkedin-post")!)
        .artworkId,
    ).toBe("linkedin-square");
    expect(
      homePreset({
        id: "future",
        label: "Future",
        subtitle: "",
        category: "Other",
        width: 600,
        height: 800,
      }).artworkId,
    ).toBe("dimensions");
    expect(JSON.stringify({ formats, resize })).toBe(before);
  });
});
