import { useState } from "react";
import {
  Check,
  Copy,
  ExternalLink,
  FileText,
  MoreHorizontal,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { TemplateCardMedia } from "./template-card-media";
import { templateImageFor } from "./template-images";
import type { SpecDocument } from "./types";

type HomeTemplateCardProps = {
  doc: SpecDocument;
  category?: string | undefined;
  priority?: boolean | undefined;
  copied: boolean;
  copying: boolean;
  onOpen: () => void;
  onCopy: () => void | Promise<void>;
  onWarmEditor: () => void;
};

/** Home presentation only; the caller retains template creation and clipboard logic. */
export function HomeTemplateCard({
  doc,
  priority = false,
  copied,
  copying,
  onOpen,
  onCopy,
  onWarmEditor,
}: HomeTemplateCardProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <article
      className="recent-design-card home-template-card"
      data-menu-open={menuOpen || undefined}
      onPointerEnter={onWarmEditor}
      onFocus={onWarmEditor}
    >
      <div className="recent-design-preview">
        <button
          type="button"
          className="recent-design-preview-link"
          onClick={onOpen}
          tabIndex={-1}
          aria-label={`Use template: ${doc.name}`}
        >
          <TemplateCardMedia
            doc={doc}
            image={templateImageFor(doc.name)}
            priority={priority}
          />
        </button>
        <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="recent-design-menu-trigger"
              aria-label={`More actions for ${doc.name}`}
            >
              <MoreHorizontal size={18} aria-hidden="true" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="recent-design-menu"
            align="end"
            sideOffset={6}
          >
            <DropdownMenuItem onSelect={onOpen}>
              <ExternalLink aria-hidden="true" /> Use template
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={onCopy} disabled={copying}>
              <FileText aria-hidden="true" />
              {doc.promptMode === "design_skill"
                ? "Copy DESIGN.md"
                : "Copy prompt"}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <div className="recent-design-actions">
          <button
            type="button"
            className="recent-design-action recent-design-open"
            onClick={onOpen}
            aria-label={`Use template: ${doc.name}`}
          >
            <ExternalLink size={14} aria-hidden="true" /> Use
          </button>
          <button
            type="button"
            className="recent-design-action recent-design-copy"
            onClick={onCopy}
            disabled={copying}
            aria-label={`Copy ${doc.promptMode === "design_skill" ? "DESIGN.md" : "prompt"}: ${doc.name}`}
            aria-busy={copying}
          >
            {copied ? (
              <Check size={14} aria-hidden="true" />
            ) : (
              <Copy size={14} aria-hidden="true" />
            )}
            Copy
            <span className="sr-only" role="status">
              {copied ? "Copied" : copying ? "Copying…" : ""}
            </span>
          </button>
        </div>
      </div>
      <div className="recent-design-metadata">
        <h3 className="recent-design-title" title={doc.name}>
          {doc.name}
        </h3>
        <p className="recent-design-format" title={doc.format.label}>
          {doc.format.label} · {doc.format.width} × {doc.format.height}
        </p>
      </div>
    </article>
  );
}
