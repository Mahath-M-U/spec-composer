import {
  BadgeCheck,
  BadgePercent,
  CaseUpper,
  CircleDollarSign,
  Gem,
  Heading1,
  Heading2,
  Images,
  MousePointerClick,
  Package,
  PanelsTopLeft,
  Shapes,
  Tag,
  TextQuote,
  UserRound,
  Minus,
  type LucideIcon,
} from "lucide-react";
import { useLayoutEffect, useRef, useState } from "react";
import { isTextKind, type ElementKind } from "../types";
import { PlaceholderArt, type ArtColors } from "../illustrations";
import type { AssetItem } from "../asset-catalog";
import { shapePreviewStyle, textPreviewStyle } from "./preview-style";

/** Fallback icon for a kind with neither placeholder art nor a shape/text
 * preview, e.g. a bare logo or brand-mark item that carries no `art`. */
const partIcons: Record<ElementKind, LucideIcon> = {
  title: Heading1,
  subheading: Heading2,
  body: TextQuote,
  eyebrow: CaseUpper,
  offer: BadgePercent,
  price: CircleDollarSign,
  badge: Tag,
  cta: MousePointerClick,
  heroImage: PanelsTopLeft,
  productImage: Package,
  humanModelImage: UserRound,
  supportingImage: Images,
  logo: BadgeCheck,
  brandMark: Gem,
  shape: Shapes,
  divider: Minus,
};

export function ArtPreview({
  item,
  colors,
  paper,
}: {
  item: AssetItem;
  colors: ArtColors;
  paper: string;
}) {
  return (
    <span
      className="asset-tile-media"
      style={{ background: paper }}
      aria-hidden="true"
    >
      <PlaceholderArt
        art={item.art!}
        colors={colors}
        fit={
          item.style?.objectFit ??
          (item.kind === "heroImage" ? "cover" : "contain")
        }
        focalX={item.style?.focalX ?? 0.5}
        focalY={item.style?.focalY ?? 0.5}
      />
    </span>
  );
}

/** Renders the item's actual copy and treatment at card scale. */
export function TextPresetPreview({
  item,
  colors,
  paper,
  baseTextColor,
}: {
  item: AssetItem;
  colors: ArtColors;
  paper: string;
  baseTextColor: string;
}) {
  const stageRef = useRef<HTMLSpanElement>(null);
  const textRef = useRef<HTMLSpanElement>(null);
  const [scale, setScale] = useState(1);

  useLayoutEffect(() => {
    const stage = stageRef.current;
    const specimen = textRef.current;
    if (!stage || !specimen) return;
    let active = true;

    const fit = () => {
      if (!active) return;
      const stageStyle = getComputedStyle(stage);
      const availableWidth =
        stage.clientWidth -
        parseFloat(stageStyle.paddingLeft) -
        parseFloat(stageStyle.paddingRight);
      const availableHeight =
        stage.clientHeight -
        parseFloat(stageStyle.paddingTop) -
        parseFloat(stageStyle.paddingBottom);
      const width = specimen.offsetWidth;
      const height = specimen.offsetHeight;
      if (width && height) {
        setScale(
          Math.max(
            0.01,
            Math.min(1, availableWidth / width, availableHeight / height),
          ),
        );
      }
    };

    const observer = new ResizeObserver(fit);
    observer.observe(stage);
    observer.observe(specimen);
    document.fonts.ready.then(fit);
    fit();
    return () => {
      active = false;
      observer.disconnect();
    };
  }, [item]);

  return (
    <span
      ref={stageRef}
      className="asset-tile-media asset-preview-stage"
      aria-hidden="true"
      style={{ background: paper }}
    >
      <span
        ref={textRef}
        className={`asset-preview-text kind-${item.kind}`}
        style={{
          ...textPreviewStyle(item, colors, baseTextColor),
          transform: `translate(-50%, -50%) scale(${scale})`,
        }}
      >
        {item.content}
      </span>
    </span>
  );
}

/** Renders a shape or divider preset's own fill, border and radius. */
export function ShapePresetPreview({
  item,
  colors,
  paper,
}: {
  item: AssetItem;
  colors: ArtColors;
  paper: string;
}) {
  return (
    <span
      className="asset-tile-media asset-preview-stage"
      style={{ background: paper }}
      aria-hidden="true"
    >
      <i
        className="asset-preview-shape"
        style={shapePreviewStyle(item, colors)}
      />
    </span>
  );
}

export function IconFallback({ kind }: { kind: ElementKind }) {
  const Icon = partIcons[kind];
  return (
    <span className="asset-tile-media asset-icon-fallback" aria-hidden="true">
      <Icon />
    </span>
  );
}

/** Picks the right preview for an item: its placeholder art, a text-preset
 * sample, a shape/divider swatch, or a lucide icon as the last resort. */
export function AssetPreview({
  item,
  colors,
  paper,
  baseTextColor,
}: {
  item: AssetItem;
  colors: ArtColors;
  paper: string;
  baseTextColor: string;
}) {
  if (item.art === "brand-wordmark")
    return (
      <TextPresetPreview
        item={item}
        colors={colors}
        paper={paper}
        baseTextColor={baseTextColor}
      />
    );
  if (item.art) return <ArtPreview item={item} colors={colors} paper={paper} />;
  if (isTextKind(item.kind))
    return (
      <TextPresetPreview
        item={item}
        colors={colors}
        paper={paper}
        baseTextColor={baseTextColor}
      />
    );
  if (item.kind === "shape" || item.kind === "divider")
    return <ShapePresetPreview item={item} colors={colors} paper={paper} />;
  return <IconFallback kind={item.kind} />;
}
