import { MediaSkeleton } from "@/components/media-skeleton";
import { useImageStatus } from "@/hooks/use-image-status";
import { imageLoadingProps } from "@/lib/image-status";
import { DocumentPreview } from "./static-render";
import type { SpecDocument } from "./types";
import type { TemplateImage } from "./template-images";

export function TemplateCardMedia({
  doc,
  image,
  priority = false,
}: {
  doc: SpecDocument;
  image: TemplateImage | undefined;
  priority?: boolean | undefined;
}) {
  const { ref, status, onLoad, onError } = useImageStatus(image?.src);

  if (!image || status === "error") return <DocumentPreview doc={doc} />;

  return (
    <>
      {status !== "loaded" && <MediaSkeleton />}
      <img
        ref={ref}
        className="template-card-image"
        src={image.src}
        alt={image.alt}
        width={image.width}
        height={image.height}
        {...imageLoadingProps(priority)}
        onLoad={onLoad}
        onError={onError}
      />
    </>
  );
}
