import {
  isImageKind,
  type ElementKind,
  type SpecElement,
  type Format,
} from "./types";
import { DEFAULT_PLACEHOLDER_ART } from "./illustrations";
const labels: Record<ElementKind, string> = {
  title: "Title",
  subheading: "Subheading",
  body: "Body",
  eyebrow: "Eyebrow",
  offer: "Offer",
  price: "Price",
  badge: "Badge",
  cta: "CTA",
  heroImage: "Hero image",
  productImage: "Product",
  humanModelImage: "Human model",
  supportingImage: "Image",
  logo: "Logo",
  brandMark: "Brand mark",
  shape: "Shape",
  divider: "Divider",
};
const content: Partial<Record<ElementKind, string>> = {
  title: "Your headline",
  subheading: "Add supporting message",
  body: "Add supporting copy",
  eyebrow: "NEW",
  offer: "30% OFF",
  price: "$49",
  badge: "LIMITED",
  cta: "Shop now",
  logo: "SPEC",
  brandMark: "S",
};
export function createElement(
  kind: ElementKind,
  format: Format,
  index: number,
  x?: number,
  y?: number,
): SpecElement {
  const text = [
    "title",
    "subheading",
    "body",
    "eyebrow",
    "offer",
    "price",
    "badge",
    "cta",
  ].includes(kind);
  const visual = [
    "heroImage",
    "productImage",
    "humanModelImage",
    "supportingImage",
  ].includes(kind);
  const w = visual
    ? Math.round(format.width * 0.42)
    : kind === "divider"
      ? Math.round(format.width * 0.5)
      : kind === "logo" || kind === "brandMark"
        ? Math.round(format.width * 0.18)
        : Math.round(format.width * (kind === "title" ? 0.68 : 0.4));
  const h = visual
    ? Math.round(format.height * 0.36)
    : kind === "divider"
      ? 8
      : kind === "title"
        ? Math.round(format.height * 0.13)
        : kind === "body" || kind === "subheading"
          ? Math.round(format.height * 0.08)
          : Math.round(format.height * 0.06);
  return {
    id: `${kind}_${crypto.randomUUID().slice(0, 8)}`,
    kind,
    name: `${labels[kind]}${index > 0 ? ` ${index + 1}` : ""}`,
    content: content[kind],
    aiDescription: visual
      ? `Describe the ${labels[kind].toLowerCase()}`
      : undefined,
    ...(isImageKind(kind)
      ? { placeholderArt: DEFAULT_PLACEHOLDER_ART[kind] }
      : {}),
    x: x ?? Math.round(format.width * 0.1),
    y: y ?? Math.round(format.height * (0.1 + (index % 6) * 0.12)),
    width: w,
    height: h,
    rotation: 0,
    zIndex: index + 1,
    visible: true,
    locked: false,
    style: text
      ? {
          fontFamily: "Manrope",
          fontSize:
            kind === "title"
              ? 84
              : kind === "offer"
                ? 62
                : kind === "price"
                  ? 58
                  : kind === "eyebrow" || kind === "badge"
                    ? 28
                    : kind === "cta"
                      ? 30
                      : 36,
          fontWeight: kind === "title" || kind === "offer" ? 800 : 600,
          lineHeight: 1,
          letterSpacing: 0,
          alignment: "left",
          color: "#18181B",
          background: kind === "cta" ? "#18181B" : undefined,
          borderRadius: kind === "cta" || kind === "badge" ? 12 : 0,
          opacity: 1,
        }
      : kind === "shape"
        ? {
            background: "#EDE9FE",
            shapeType: "rectangle",
            borderRadius: 16,
            opacity: 1,
          }
        : {
            objectFit: kind === "heroImage" ? "cover" : "contain",
            focalX: 0.5,
            focalY: 0.5,
            borderRadius: 0,
            opacity: 1,
          },
  };
}
