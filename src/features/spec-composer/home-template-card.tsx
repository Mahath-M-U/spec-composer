import { ArrowRight, Check, Copy, ExternalLink, FileText } from "lucide-react";
import {
  PreviewCard,
  type PreviewCardAction,
  type PreviewCardMenuItem,
} from "@/components/preview-card";
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
    secondaryActions?: PreviewCardAction[];
    menuItems?: PreviewCardMenuItem[];
  } = onCopy
    ? {
        secondaryActions: [
          {
            label: "Copy",
            ariaLabel: `Copy ${copyLabel}: ${doc.name}`,
            icon: copied ? (
              <Check size={14} aria-hidden="true" />
            ) : (
              <Copy size={14} aria-hidden="true" />
            ),
            onSelect: onCopy,
            disabled: copying,
            busy: copying,
            status: copied ? "Copied" : copying ? "Copying…" : "",
          },
        ],
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
    <PreviewCard
      {...(className !== undefined ? { className } : {})}
      title={doc.name}
      subtitle={category ?? doc.format.label}
      subtitleTitle={category ?? doc.format.label}
      media={
        <TemplateCardMedia
          doc={doc}
          image={templatePhoto ? templateImageFor(doc.name) : undefined}
          priority={priority}
        />
      }
      pills={[
        ...(category
          ? [{ id: "category", label: category, decorative: true }]
          : []),
        {
          id: "format",
          label: `${doc.format.width} × ${doc.format.height}`,
          title: doc.format.label,
        },
      ]}
      primaryAction={{
        label: "Use template",
        ariaLabel: `Use template: ${doc.name}`,
        icon: <ArrowRight size={14} aria-hidden="true" />,
        onSelect: onOpen,
      }}
      {...copyProps}
      {...(onWarmEditor !== undefined ? { onWarm: onWarmEditor } : {})}
    />
  );
}
