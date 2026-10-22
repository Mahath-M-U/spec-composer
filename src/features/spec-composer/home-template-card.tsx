import { ArrowRight, Check, Copy, ExternalLink, FileText } from "lucide-react";
import {
  PreviewCard,
  type PreviewCardMenuItem,
} from "@/components/preview-card";
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
  category,
  priority = false,
  copied,
  copying,
  onOpen,
  onCopy,
  onWarmEditor,
}: HomeTemplateCardProps) {
  const copyLabel = doc.promptMode === "design_skill" ? "DESIGN.md" : "prompt";
  const menuItems: PreviewCardMenuItem[] = [
    {
      id: "use",
      label: "Use template",
      icon: <ExternalLink aria-hidden="true" />,
      onSelect: onOpen,
    },
    {
      id: "copy",
      label:
        doc.promptMode === "design_skill" ? "Copy DESIGN.md" : "Copy prompt",
      icon: <FileText aria-hidden="true" />,
      onSelect: onCopy,
      disabled: copying,
    },
  ];

  return (
    <PreviewCard
      title={doc.name}
      subtitle={category ?? doc.format.label}
      subtitleTitle={category ?? doc.format.label}
      media={
        <TemplateCardMedia
          doc={doc}
          image={templateImageFor(doc.name)}
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
      secondaryActions={[
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
      ]}
      menuItems={menuItems}
      onWarm={onWarmEditor}
    />
  );
}
