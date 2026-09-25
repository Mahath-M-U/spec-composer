import { createFileRoute } from "@tanstack/react-router";
import { BrandKitsPage } from "@/features/spec-composer/discovery";

export const Route = createFileRoute("/design-kit")({
  head: () => ({
    meta: [
      { title: "SpecComposer - Design kits" },
      {
        name: "description",
        content: "Manage reusable design colors, typography, style, and mood.",
      },
      { property: "og:title", content: "SpecComposer - Design kits" },
      {
        property: "og:description",
        content: "Manage reusable design colors, typography, style, and mood.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: BrandKitsPage,
});
