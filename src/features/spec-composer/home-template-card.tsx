import { ExternalLink, FileText, Ruler } from "lucide-react";
import {
  DesignCard,
  type DesignCardCopyAction,
  type PreviewCardMenuItem,
} from "@/components/design-card";
import { TemplateCardMedia } from "./template-card-media";
import { templateImageFor } from "./template-images";
import type { SpecDocument } from "./types";

type HomeTemplateCardProps = {
  doc: SpecDocument;
  category?: string | undefined;
  priority?: boolean | undefined;
  copied?: boolean | undefined;
  copying?: boolean | undefined;
  onOpen: () => void;
  onCopy?: (() => void | Promise<void>) | undefined;
  onWarmEditor?: (() => void) | undefined;
  className?: string | undefined;
  templatePhoto?: boolean | undefined;
};

/** Shared template card (home + editor sidebar) */
export function HomeTemplateCard({
  doc,
  category,
  priority = false,
  copied = false,
  copying = false,
  onOpen,
  onCopy,
  onWarmEditor,
  className,
  templatePhoto = true,
}: HomeTemplateCardProps) {
  const copyLabel = doc.promptMode === "design_skill" ? "DESIGN.md" : "prompt";
  const copyProps: {
    copyAction?: DesignCardCopyAction;
    menuItems?: PreviewCardMenuItem[];
  } = onCopy
    ? {
        copyAction: {
          ariaLabel: `Copy ${copyLabel}: ${doc.name}`,
          tooltip: copyLabel === "DESIGN.md" ? "Copy DESIGN.md" : "Copy prompt",
          onSelect: onCopy,
          busy: copying,
          copied,
          disabled: copying,
        },
        menuItems: [
          {
            id: "use",
            label: "Use template",
            icon: <ExternalLink aria-hidden="true" />,
            onSelect: onOpen,
          },
          {
            id: "copy",
            label:
              doc.promptMode === "design_skill"
                ? "Copy DESIGN.md"
                : "Copy prompt",
            icon: <FileText aria-hidden="true" />,
            onSelect: onCopy,
            disabled: copying,
          },
        ],
      }
    : {};

  return (
    <DesignCard
      {...(className !== undefined ? { className } : {})}
      title={doc.name}
      category={category ?? doc.format.label}
      media={
        <TemplateCardMedia
          doc={doc}
          image={templatePhoto ? templateImageFor(doc.name) : undefined}
          priority={priority}
        />
      }
      previewLabel={`Use template: ${doc.name}`}
      onOpen={onOpen}
      modifiedBadge={
        <span className="design-card-chip">
          <Ruler size={10} aria-hidden="true" />
          <span>
            {doc.format.width}×{doc.format.height}
          </span>
        </span>
      }
      {...copyProps}
      {...(onWarmEditor !== undefined ? { onWarm: onWarmEditor } : {})}
    />
  );
}
