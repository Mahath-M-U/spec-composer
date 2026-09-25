import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
  type RefObject,
} from "react";
import { Image } from "lucide-react";
import { MediaSkeleton } from "@/components/media-skeleton";
import { useInView } from "@/hooks/use-in-view";
import {
  hasPlaceholderArt,
  PlaceholderArt,
  type ArtColors,
} from "./illustrations";
import { isImageKind, type SpecDocument, type SpecElement } from "./types";

/** Noninteractive document rendering shared by the editor, PNG export, and gallery previews. */

export function backgroundStyle(d: SpecDocument): CSSProperties {
  return {
    background:
      d.background.type === "gradient"
        ? `linear-gradient(${d.background.angle ?? 135}deg, ${d.background.value}, ${d.background.secondaryValue ?? d.background.value})`
        : d.background.value,
  };
}

const ArtColorsContext = createContext<ArtColors>({
  accent: "#A78BFA",
  ink: "#18181B",
});

/** Supplies the document's colors to placeholder motifs rendered beneath it. */
export function ArtColorsProvider({
  doc,
  children,
}: {
  doc: SpecDocument;
  children: ReactNode;
}) {
  const { primaryColor, secondaryColor } = doc.creativeDirection;
  const colors = useMemo(
    () => ({ accent: secondaryColor, ink: primaryColor }),
    [primaryColor, secondaryColor],
  );
  return (
    <ArtColorsContext.Provider value={colors}>
      {children}
    </ArtColorsContext.Provider>
  );
}

export function StaticElement({ el }: { el: SpecElement }) {
  if (!el.visible) return null;
  return (
    <div
      className="static-element"
      style={{
        position: "absolute",
        left: el.x,
        top: el.y,
        width: el.width,
        height: el.height,
        transform: `rotate(${el.rotation}deg)`,
        zIndex: el.zIndex,
      }}
    >
      <ElementContent el={el} />
    </div>
  );
}

/** The inline style a text element renders with, shared by `ElementContent`
 * and the canvas text editor so editing never shifts the layer on screen. */
export function textStyle(el: SpecElement): CSSProperties {
  const st = el.style;
  return {
    fontFamily: st.fontFamily,
    fontSize: st.fontSize,
    fontWeight: st.fontWeight,
    fontStyle: st.fontStyle,
    lineHeight: st.lineHeight,
    letterSpacing: st.letterSpacing,
    textAlign: st.alignment,
    // Single-line text shrinks to its content inside the flex box, so text-align alone has no effect.
    justifyContent:
      st.alignment === "center"
        ? "center"
        : st.alignment === "right"
          ? "flex-end"
          : undefined,
    color: st.color,
    background: st.background,
    borderRadius: st.borderRadius,
    borderColor: st.borderColor,
    borderWidth: st.borderWidth,
    borderStyle: st.borderWidth ? "solid" : undefined,
    opacity: st.opacity,
  };
}

export function ElementContent({ el }: { el: SpecElement }) {
  const artColors = useContext(ArtColorsContext);
  const st = el.style;
  if (isImageKind(el.kind)) {
    if (!el.src && el.placeholderArt === "brand-wordmark") {
      return (
        <div
          className="canvas-wordmark"
          style={{
            color: st.color ?? artColors.ink,
            fontFamily: st.fontFamily ?? "Manrope",
            fontSize: Math.min(
              st.fontSize ?? 72,
              el.height * 0.7,
              (el.width / Math.max(el.content?.length ?? 1, 1)) * 1.35,
            ),
            fontWeight: st.fontWeight ?? 800,
            letterSpacing: st.letterSpacing,
            opacity: st.opacity,
          }}
        >
          {el.content ?? "BRAND"}
        </div>
      );
    }
    const art =
      !el.src && hasPlaceholderArt(el.placeholderArt)
        ? el.placeholderArt
        : undefined;
    return (
      <div
        className={`canvas-image${art ? " has-art" : ""}`}
        style={{ borderRadius: st.borderRadius, opacity: st.opacity }}
      >
        {el.src ? (
          <img
            src={el.src}
            alt={el.aiDescription || el.name}
            style={{
              objectFit: st.objectFit,
              objectPosition: `${(st.focalX ?? 0.5) * 100}% ${(st.focalY ?? 0.5) * 100}%`,
            }}
          />
        ) : art ? (
          <PlaceholderArt
            art={art}
            colors={artColors}
            fit={st.objectFit ?? "contain"}
            focalX={st.focalX ?? 0.5}
            focalY={st.focalY ?? 0.5}
          />
        ) : (
          <>
            <Image />
            <span>{el.name}</span>
            <small>{el.aiDescription}</small>
          </>
        )}
      </div>
    );
  }
  if (el.kind === "shape" || el.kind === "divider") {
    return (
      <div
        className={`canvas-shape ${st.shapeType === "circle" ? "circle" : ""}`}
        style={{
          background: st.background,
          borderRadius: st.borderRadius,
          opacity: st.opacity,
          borderColor: st.borderColor,
          borderWidth: st.borderWidth,
        }}
      />
    );
  }
  return (
    <div className={`canvas-text kind-${el.kind}`} style={textStyle(el)}>
      {el.content}
    </div>
  );
}

export function StaticDocument({
  doc,
  exportRef,
}: {
  doc: SpecDocument;
  exportRef?: RefObject<HTMLDivElement | null> | undefined;
}) {
  return (
    <div ref={exportRef} className="artboard" style={backgroundStyle(doc)}>
      <ArtColorsProvider doc={doc}>
        {[...doc.elements]
          .filter((e) => e.visible)
          .sort((a, b) => a.zIndex - b.zIndex)
          .map((e) => (
            <StaticElement key={e.id} el={e} />
          ))}
      </ArtColorsProvider>
    </div>
  );
}

/**
 * Renders a document at its native size, scaled to fit its container. Used by
 * gallery cards so a card shows exactly what opens in the editor. The page
 * mounts lazily, once the card nears the viewport; a skeleton fills the frame
 * until then. Only this preview is deferred: StaticDocument itself must stay
 * synchronous so export and server rendering see the full tree.
 */
export function DocumentPreview({ doc }: { doc: SpecDocument }) {
  const frameRef = useRef<HTMLDivElement>(null);
  const inView = useInView(frameRef, { rootMargin: "240px" });
  const [scale, setScale] = useState(0);
  const { width, height } = doc.format;

  useEffect(() => {
    const frame = frameRef.current;
    if (!frame) return;
    const measure = () => {
      // client sizes ignore the card's hover transforms.
      setScale(
        Math.min(frame.clientWidth / width, frame.clientHeight / height),
      );
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(frame);
    return () => observer.disconnect();
  }, [width, height]);

  return (
    <div ref={frameRef} className="document-preview" aria-hidden="true">
      {(!inView || !scale) && <MediaSkeleton />}
      {inView && (
        <div
          className="document-preview-page"
          style={{
            width,
            height,
            transform: `translate(-50%, -50%) scale(${scale})`,
            visibility: scale ? "visible" : "hidden",
          }}
        >
          <StaticDocument doc={doc} />
        </div>
      )}
    </div>
  );
}
