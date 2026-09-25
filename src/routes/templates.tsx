import { createFileRoute } from "@tanstack/react-router";
import { TemplatesPage } from "@/features/spec-composer/discovery";
export const Route = createFileRoute("/templates")({
  head: () => ({
    meta: [
      { title: "SpecComposer-Templates" },
      {
        name: "description",
        content: "Start from editable semantic poster templates.",
      },
      { property: "og:title", content: "SpecComposer-Templates" },
      {
        property: "og:description",
        content: "Start from editable semantic poster templates.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: TemplatesPage,
});
