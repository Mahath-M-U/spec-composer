import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { TooltipProvider } from "@/components/ui/tooltip";
import { PromptCard } from "./prompt-card";
import type { GalleryPrompt } from "./catalog";

vi.mock("./before-after", () => ({
  BeforeAfter: () => createElement("span", { "data-before-after": true }),
}));

const prompt: GalleryPrompt = {
  id: "warm-editorial-portrait",
  title: "Warm editorial portrait",
  category: "Portrait · Editorial",
  summary: "Turn a natural portrait into a softly lit fashion editorial.",
  refinedPrompt: "Edit the uploaded photograph into a warm fashion editorial.",
  beforeImage: "/prompt-gallery/portrait-before.webp",
  afterImage: "/prompt-gallery/portrait-after.webp",
  beforeAlt: "Before",
  afterAlt: "After",
  exampleTool: "OpenAI image generation",
};

function renderCard() {
  return renderToStaticMarkup(
    createElement(TooltipProvider, null, createElement(PromptCard, { prompt })),
  );
}

describe("prompt card", () => {
  it("shares the discovery card standard with For You, Templates, and My designs", () => {
    const html = renderCard();
    expect(html).toContain('class="preview-card prompt-gallery-card"');
    expect(html).toContain(`id="${prompt.id}-title"`);
    expect(html).toContain(`aria-labelledby="${prompt.id}-title"`);
  });

  it("uses the shared primary button style for the card copy action", () => {
    const html = renderCard();
    expect(html).toContain('class="preview-card-primary"');
    expect(html).toContain(`aria-label="Copy prompt: ${prompt.title}"`);
  });

  it("keeps the dialog toggle for viewing the full prompt", () => {
    const html = renderCard();
    expect(html).toContain(`aria-label="View full prompt: ${prompt.title}"`);
    expect(html).toContain('class="prompt-gallery-details-toggle"');
  });
});
