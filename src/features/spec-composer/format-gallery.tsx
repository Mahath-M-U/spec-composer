import type { CSSProperties, ElementType } from "react";
import AutoAwesomeOutlinedIcon from "@mui/icons-material/AutoAwesomeOutlined";
import CategoryOutlinedIcon from "@mui/icons-material/CategoryOutlined";
import FacebookIcon from "@mui/icons-material/Facebook";
import InstagramIcon from "@mui/icons-material/Instagram";
import LinkedInIcon from "@mui/icons-material/LinkedIn";
import PinterestIcon from "@mui/icons-material/Pinterest";
import WhatsAppIcon from "@mui/icons-material/WhatsApp";
import XIcon from "@mui/icons-material/X";
import YouTubeIcon from "@mui/icons-material/YouTube";
import { History, Music2, Play, Plus } from "lucide-react";
import type { PlatformFilter } from "./formats";
import type { Format } from "./types";

const platformIcons: Record<PlatformFilter, ElementType> = {
  Popular: AutoAwesomeOutlinedIcon,
  WhatsApp: WhatsAppIcon,
  Instagram: InstagramIcon,
  Facebook: FacebookIcon,
  LinkedIn: LinkedInIcon,
  YouTube: YouTubeIcon,
  TikTok: Music2,
  X: XIcon,
  Pinterest: PinterestIcon,
  History,
  Other: CategoryOutlinedIcon,
};

export function PlatformFilterBar({
  platforms,
  value,
  onChange,
}: {
  platforms: readonly PlatformFilter[];
  value: PlatformFilter;
  onChange: (platform: PlatformFilter) => void;
}) {
  return (
    <div className="platform-scroll" aria-label="Filter formats by platform">
      {platforms.map((platform) => {
        const Icon = platformIcons[platform];
        const active = value === platform;
        return (
          <button
            key={platform}
            type="button"
            className="platform-chip"
            data-platform={platform.toLowerCase()}
            aria-pressed={active}
            onClick={() => onChange(platform)}
          >
            <Icon aria-hidden="true" />
            <span>{platform}</span>
          </button>
        );
      })}
    </div>
  );
}

const headlines: Record<string, [string, string]> = {
  geometric: ["MAKE", "IT BOLD"],
  editorial: ["BUILD", "VISUALLY"],
  type: ["COMPOSE", "CLEARLY"],
  tint: ["NEW", "ENERGY"],
  product: ["DESIGN", "WITH INTENT"],
  minimal: ["LESS", "BUT BETTER"],
  profile: ["YOUR", "STORY"],
  banner: ["MAKE SPACE", "FOR IDEAS"],
  carousel: ["ONE IDEA", "AT A TIME"],
  video: ["MOVE", "WITH PURPOSE"],
};
const DEFAULT_HEADLINE: [string, string] = ["MAKE", "IT BOLD"];

function platformMark(format: Format) {
  if (format.category === "LinkedIn") return "in";
  if (format.category === "Instagram") return "ig";
  if (format.category === "WhatsApp") return "wa";
  if (format.category === "Facebook") return "f";
  if (format.category === "YouTube") return "yt";
  return format.category.slice(0, 1).toLowerCase();
}

export function FormatPreview({
  format,
  index = 0,
}: {
  format: Format;
  index?: number;
}) {
  const variant = format.previewVariant ?? "geometric";
  const [lineOne, lineTwo] = headlines[variant] ?? DEFAULT_HEADLINE;
  const ratio = format.width / format.height;
  const orientation =
    ratio > 1.2 ? "landscape" : ratio < 0.8 ? "portrait" : "square";
  const style = {
    aspectRatio: `${format.width} / ${format.height}`,
    "--preview-index": index,
  } as CSSProperties;

  return (
    <div className="format-well" aria-hidden="true">
      <div
        className={`preview-art preview-${variant} preview-type-${format.type ?? "post"} preview-orientation-${orientation}`}
        style={style}
      >
        <span className="preview-platform">{platformMark(format)}</span>
        <span className="preview-kicker">
          SPEC / {String(index + 1).padStart(2, "0")}
        </span>
        <span className="preview-image" />
        <strong>
          {lineOne}
          <br />
          {lineTwo}
        </strong>
        <i />
        <small>{format.category}</small>
        {format.animated ? (
          <span className="preview-play">
            <Play size={9} fill="currentColor" />
          </span>
        ) : null}
      </div>
      <span className="format-action">Use template</span>
    </div>
  );
}

export function FormatCard({
  format,
  index,
  onSelect,
}: {
  format: Format;
  index: number;
  onSelect: (format: Format) => void;
}) {
  return (
    <button
      type="button"
      className="format-card group"
      onClick={() => onSelect(format)}
      aria-label={`Create ${format.label}, ${format.width} by ${format.height} pixels`}
    >
      <FormatPreview format={format} index={index} />
      <span className="format-name">{format.label}</span>
      <span className="format-meta">
        <span>
          {format.width} × {format.height} px <b>·</b> {format.subtitle}
        </span>
        {format.animated ? <em>Animated</em> : null}
      </span>
    </button>
  );
}

export function AddFormatCard({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      className="format-card format-card--add group"
      onClick={onClick}
      aria-label="Create a design with a preset or custom size"
    >
      <div className="format-well format-well--add" aria-hidden="true">
        <Plus size={26} />
      </div>
      <span className="format-name">Create a design</span>
      <span className="format-meta">Preset or custom size</span>
    </button>
  );
}

export function FormatGrid({
  formats,
  onSelect,
  onCreateCustom,
}: {
  formats: Format[];
  onSelect: (format: Format) => void;
  onCreateCustom?: () => void;
}) {
  return (
    <div className="format-grid">
      {onCreateCustom ? <AddFormatCard onClick={onCreateCustom} /> : null}
      {formats.map((format, index) => (
        <FormatCard
          key={format.id}
          format={format}
          index={index}
          onSelect={onSelect}
        />
      ))}
    </div>
  );
}
