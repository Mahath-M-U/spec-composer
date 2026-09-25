import { useEffect, useState } from "react";
import { DiscoveryShell } from "../discovery";
import { Sparkles } from "lucide-react";
import { galleryPrompts, type GalleryPrompt } from "./catalog";
import { PromptCard } from "./prompt-card";
import { shuffled } from "./shuffle";

export function PromptGalleryPage() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [ordered, setOrdered] = useState<GalleryPrompt[] | null>(null);
  // Shuffle on the client after hydration, so the server markup stays
  // deterministic; the grid stays hidden until the order lands.
  useEffect(() => {
    setOrdered(shuffled(galleryPrompts));
  }, []);
  const categories = [
    ...new Set(galleryPrompts.map((prompt) => prompt.category)),
  ];
  const search = query.trim().toLocaleLowerCase();
  const visiblePrompts = (ordered ?? galleryPrompts).filter(
    (prompt) =>
      (category === "all" || prompt.category === category) &&
      (!search ||
        `${prompt.title} ${prompt.category} ${prompt.summary} ${prompt.refinedPrompt}`
          .toLocaleLowerCase()
          .includes(search)),
  );

  return (
    <DiscoveryShell>
      <div className="discovery-content prompt-gallery-page">
        <header className="prompt-gallery-page-heading">
          <p className="eyebrow">PHOTO PROMPTS</p>
          <h1>Prompt gallery</h1>
          <p>Explore a style. Copy its prompt. Make it yours.</p>
        </header>
        <section
          className="prompt-gallery-banner"
          aria-labelledby="prompt-gallery-banner-title"
        >
          <div className="prompt-gallery-banner-copy">
            <span className="prompt-gallery-category">Up next</span>
            <h2 id="prompt-gallery-banner-title">More prompts coming soon</h2>
            <p>New before-and-after styles are on the way. Check back soon.</p>
          </div>
          <div className="prompt-gallery-banner-visual" aria-hidden="true">
            <span className="prompt-gallery-coming-orbit" />
            <span className="prompt-gallery-coming-sparkle prompt-gallery-coming-sparkle--one" />
            <span className="prompt-gallery-coming-sparkle prompt-gallery-coming-sparkle--two" />
            <span className="prompt-gallery-coming-photo prompt-gallery-banner-photo prompt-gallery-banner-photo--portrait">
              <img
                src="/prompt-gallery/teaser-portrait.webp"
                alt=""
                width={512}
                height={768}
                loading="eager"
                decoding="async"
              />
            </span>
            <span className="prompt-gallery-coming-photo prompt-gallery-banner-photo prompt-gallery-banner-photo--coast">
              <img
                src="/prompt-gallery/teaser-coast.webp"
                alt=""
                width={512}
                height={768}
                loading="eager"
                decoding="async"
              />
            </span>
            <span className="prompt-gallery-coming-photo prompt-gallery-banner-photo prompt-gallery-banner-photo--mountains">
              <img
                src="/prompt-gallery/teaser-mountains.webp"
                alt=""
                width={512}
                height={768}
                loading="eager"
                decoding="async"
              />
            </span>
            <span className="prompt-gallery-coming-badge prompt-gallery-banner-badge">
              Coming soon
            </span>
          </div>
        </section>
        <div className="prompt-gallery-filters">
          <label>
            <span className="sr-only">Search prompts</span>
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search prompts"
            />
          </label>
          <label>
            <span className="sr-only">Filter by category</span>
            <select
              value={category}
              onChange={(event) => setCategory(event.target.value)}
            >
              <option value="all">All categories</option>
              {categories.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </label>
          <p aria-live="polite">
            {visiblePrompts.length}{" "}
            {visiblePrompts.length === 1 ? "prompt" : "prompts"}
          </p>
        </div>
        <div
          className="prompt-gallery-grid"
          data-ready={ordered ? "" : undefined}
        >
          {visiblePrompts.length === 0 && (
            <p className="prompt-gallery-empty">
              No prompts match that search. Try another term or category.
            </p>
          )}
          {visiblePrompts.map((prompt) => (
            <PromptCard key={prompt.id} prompt={prompt} />
          ))}
          <article
            className="prompt-gallery-card prompt-gallery-card--coming-soon"
            aria-labelledby="prompt-gallery-coming-soon-title"
          >
            <div className="prompt-gallery-card-media">
              <div className="prompt-gallery-coming-visual" aria-hidden="true">
                <span className="prompt-gallery-coming-orbit" />
                <span className="prompt-gallery-coming-sparkle prompt-gallery-coming-sparkle--one" />
                <span className="prompt-gallery-coming-sparkle prompt-gallery-coming-sparkle--two" />
                <span className="prompt-gallery-coming-sparkle prompt-gallery-coming-sparkle--three" />
                <span className="prompt-gallery-coming-photo prompt-gallery-coming-photo--portrait">
                  <img
                    src="/prompt-gallery/teaser-portrait.webp"
                    alt=""
                    width={512}
                    height={768}
                    loading="lazy"
                    decoding="async"
                  />
                </span>
                <span className="prompt-gallery-coming-photo prompt-gallery-coming-photo--coast">
                  <img
                    src="/prompt-gallery/teaser-coast.webp"
                    alt=""
                    width={512}
                    height={768}
                    loading="lazy"
                    decoding="async"
                  />
                </span>
                <span className="prompt-gallery-coming-photo prompt-gallery-coming-photo--mountains">
                  <img
                    src="/prompt-gallery/teaser-mountains.webp"
                    alt=""
                    width={512}
                    height={768}
                    loading="lazy"
                    decoding="async"
                  />
                </span>
                <span className="prompt-gallery-coming-badge">Coming soon</span>
              </div>
            </div>
            <div className="prompt-gallery-card-body">
              <span className="prompt-gallery-category prompt-gallery-chip">
                <Sparkles aria-hidden="true" />
                <span>Up next</span>
              </span>
              <h2 id="prompt-gallery-coming-soon-title">More prompts soon</h2>
              <p>More before-and-after styles are on the way.</p>
              <p className="prompt-gallery-coming-note">
                <Sparkles size={14} aria-hidden="true" />
                New examples will join the gallery here.
              </p>
            </div>
          </article>
        </div>
      </div>
    </DiscoveryShell>
  );
}
