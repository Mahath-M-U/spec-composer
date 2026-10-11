import { useRef, type ChangeEvent } from "react";
import { Upload } from "lucide-react";
import { toast } from "sonner";
import { readImageUpload } from "../image-upload";
import { useEditorStore } from "../store";

const UPLOAD_CONFIG = {
  subject: {
    kind: "heroImage",
    label: "Use your photo",
    name: "Your photo",
    aiDescription: "the subject shown in the attached reference image",
  },
  brand: {
    kind: "logo",
    label: "Use your logo",
    name: "Your logo",
    aiDescription:
      "the brand logo exactly as shown in the attached reference image",
  },
} as const;

/**
 * The first tile in the Subject and Brand role tabs: a tile-styled button
 * that opens a file picker, then auto-slots the uploaded image as that
 * role (replacing today's occupant, same as a catalog click). Visually
 * matches AssetTile's `.asset-tile` metrics: a preview-area-sized media box
 * (here, an upload icon) with its label below.
 */
export function UploadTile({ role }: { role: "subject" | "brand" }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const config = UPLOAD_CONFIG[role];

  const onChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const f = event.target.files?.[0];
    event.target.value = "";
    if (!f) return;
    try {
      const src = await readImageUpload(f);
      useEditorStore.getState().slotElement(role, config.kind, {
        src,
        name: config.name,
        slot: role,
        aiDescription: config.aiDescription,
      });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Image is invalid");
    }
  };

  return (
    <>
      <button
        type="button"
        className="asset-tile"
        data-roving-tile
        onClick={() => inputRef.current?.click()}
        title={config.label}
        aria-label={config.label}
      >
        <span
          className="asset-tile-media asset-icon-fallback"
          aria-hidden="true"
        >
          <Upload />
        </span>
        <span className="asset-tile-label">{config.label}</span>
      </button>
      <input
        ref={inputRef}
        type="file"
        hidden
        tabIndex={-1}
        accept="image/png,image/jpeg,image/webp"
        onChange={onChange}
      />
    </>
  );
}
