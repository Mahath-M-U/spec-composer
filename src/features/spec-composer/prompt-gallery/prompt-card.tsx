import { Check, Copy, Maximize2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { Hint } from "@/components/ui/tooltip";
import { BeforeAfter } from "./before-after";
import type { GalleryPrompt } from "./catalog";
import { categoryIcon } from "./category-icons";

export function PromptCard({ prompt }: { prompt: GalleryPrompt }) {
  const [copied, setCopied] = useState(false);
  const [copying, setCopying] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const resetTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const copyLabel = copied
    ? `Copied prompt: ${prompt.title}`
    : copying
      ? `Copying prompt: ${prompt.title}`
      : `Copy prompt: ${prompt.title}`;
  const copyText = copied ? "Copied" : copying ? "Copying…" : "Copy prompt";
  const CategoryIcon = categoryIcon(prompt.category);

  useEffect(
    () => () => {
      if (resetTimer.current) clearTimeout(resetTimer.current);
    },
    [],
  );

  const copyPrompt = async () => {
    if (copying) return;
    setCopying(true);
    try {
      await navigator.clipboard.writeText(prompt.refinedPrompt);
      setCopied(true);
      toast.success("Prompt copied");
      if (resetTimer.current) clearTimeout(resetTimer.current);
      resetTimer.current = setTimeout(() => setCopied(false), 2500);
    } catch {
      setCopied(false);
      toast.error("Couldn't copy prompt", {
        description: "Open the full prompt to select and copy it manually.",
      });
    } finally {
      setCopying(false);
    }
  };

  return (
    <>
      <article
        className="prompt-gallery-card"
        aria-labelledby={`${prompt.id}-title`}
      >
        <div className="prompt-gallery-card-media">
          <BeforeAfter prompt={prompt} />
        </div>
        <div className="prompt-gallery-card-body">
          <span className="prompt-gallery-category prompt-gallery-chip">
            <CategoryIcon aria-hidden="true" />
            <span>{prompt.category}</span>
          </span>
          <h2 id={`${prompt.id}-title`}>{prompt.title}</h2>
          <p>{prompt.summary}</p>
          <div className="prompt-gallery-actions">
            <button
              type="button"
              className="prompt-gallery-copy"
              onClick={copyPrompt}
              disabled={copying}
              aria-label={copyLabel}
              aria-live="polite"
            >
              {copied ? (
                <Check aria-hidden="true" />
              ) : (
                <Copy aria-hidden="true" />
              )}
              <span>{copyText}</span>
            </button>
            <Hint label="View full prompt" side="top">
              <button
                type="button"
                className="prompt-gallery-details-toggle"
                aria-haspopup="dialog"
                aria-label={`View full prompt: ${prompt.title}`}
                onClick={() => setDialogOpen(true)}
              >
                <Maximize2 aria-hidden="true" />
              </button>
            </Hint>
          </div>
        </div>
      </article>
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="prompt-gallery-dialog">
          <div className="prompt-gallery-dialog-heading">
            <span className="prompt-gallery-category">{prompt.category}</span>
            <DialogTitle>{prompt.title}</DialogTitle>
            <DialogDescription>{prompt.summary}</DialogDescription>
          </div>
          <div className="prompt-gallery-dialog-scroll">
            <section aria-labelledby={`${prompt.id}-prompt-label`}>
              <h3 id={`${prompt.id}-prompt-label`}>Prompt</h3>
              <p className="prompt-gallery-dialog-prompt">
                {prompt.refinedPrompt}
              </p>
            </section>
            <p className="prompt-gallery-dialog-note">
              Example tool: {prompt.exampleTool}. Results vary by image and
              tool.
            </p>
          </div>
          <div className="prompt-gallery-dialog-actions">
            <DialogClose asChild>
              <button type="button" className="prompt-gallery-dialog-close">
                Close
              </button>
            </DialogClose>
            <button
              type="button"
              className="prompt-gallery-copy"
              onClick={copyPrompt}
              disabled={copying}
              aria-label={copyLabel}
              aria-live="polite"
            >
              {copied ? (
                <Check aria-hidden="true" />
              ) : (
                <Copy aria-hidden="true" />
              )}
              <span>{copyText}</span>
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
