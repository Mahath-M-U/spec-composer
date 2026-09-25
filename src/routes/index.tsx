import { createFileRoute } from "@tanstack/react-router";
import { HomePage } from "@/features/spec-composer/discovery";
export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "SpecComposer-Create a design" },
      {
        name: "description",
        content:
          "Compose semantic posters and export structured creative specifications.",
      },
      { property: "og:title", content: "SpecComposer-Create a design" },
      {
        property: "og:description",
        content:
          "Compose semantic posters and export structured creative specifications.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: HomePage,
});
