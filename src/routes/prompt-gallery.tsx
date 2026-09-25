import { createFileRoute } from "@tanstack/react-router";
import { PromptGalleryPage } from "@/features/spec-composer/prompt-gallery/prompt-gallery-page";

export const Route = createFileRoute("/prompt-gallery")({
  head: () => ({
    meta: [
      { title: "Spec Composer – Prompt gallery" },
      {
        name: "description",
        content:
          "Explore before-and-after image prompts and copy a style to try on your own photo.",
      },
    ],
  }),
  component: PromptGalleryPage,
});
