import { Check, Copy, Maximize2 } from "lucide-react";
import { useEffect, useId, useRef, useState, type MouseEvent } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Hint } from "@/components/ui/tooltip";
import { BeforeAfter } from "./before-after";
import type { GalleryPrompt } from "./catalog";

export function PromptCard({ prompt }: { prompt: GalleryPrompt }) {
  const id = useId();
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

  useEffect(
    () => () => {
      if (resetTimer.current) clearTimeout(resetTimer.current);
    },
    [],
  );

  const copyPrompt = async (event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
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
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
      <article
        className="preview-card prompt-gallery-card card-hover-scale"
        aria-labelledby={`${id}-title`}
      >
        <div className="prompt-gallery-card-media">
          <BeforeAfter prompt={prompt} />
          <Hint label="View full prompt" side="top">
            <DialogTrigger asChild>
              <button
                type="button"
                className="prompt-gallery-details-toggle"
                aria-label={`View full prompt: ${prompt.title}`}
                onClick={(event) => event.stopPropagation()}
              >
                <Maximize2 aria-hidden="true" />
              </button>
            </DialogTrigger>
          </Hint>
        </div>
        <div className="preview-card-meta prompt-gallery-card-body">
          <div className="prompt-gallery-card-metadata">
            <h2
              id={`${id}-title`}
              className="preview-card-title"
              title={prompt.title}
            >
              {prompt.title}
            </h2>
            <p className="preview-card-subtitle">{prompt.category}</p>
          </div>
          <Hint label="Copy prompt" side="top">
            <button
              type="button"
              className="prompt-gallery-card-copy"
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
              <span className="sr-only">{copyText}</span>
            </button>
          </Hint>
        </div>
      </article>
      <DialogContent className="prompt-gallery-dialog">
        <div className="prompt-gallery-dialog-heading">
          <span className="prompt-gallery-category">{prompt.category}</span>
          <DialogTitle>{prompt.title}</DialogTitle>
          <DialogDescription>{prompt.summary}</DialogDescription>
        </div>
        <div className="prompt-gallery-dialog-scroll">
          <div className="prompt-gallery-dialog-preview">
            <BeforeAfter prompt={prompt} />
          </div>
          <section aria-labelledby={`${id}-prompt-label`}>
            <h3 id={`${id}-prompt-label`}>Prompt</h3>
            <p className="prompt-gallery-dialog-prompt">
              {prompt.refinedPrompt}
            </p>
          </section>
          <p className="prompt-gallery-dialog-note">
            Example tool: {prompt.exampleTool}. Results vary by image and tool.
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
  );
}
