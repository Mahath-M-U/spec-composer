import { createFileRoute } from "@tanstack/react-router";
import { LegalPage } from "@/features/spec-composer/legal-page";

export const Route = createFileRoute("/legal")({
  head: () => ({
    meta: [
      { title: "Spec Composer – Legal & credits" },
      {
        name: "description",
        content:
          "License, AI-generated content, trademarks and privacy notes for Spec Composer.",
      },
    ],
  }),
  component: LegalPage,
});
