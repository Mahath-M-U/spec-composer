import type { ElementType, Ref } from "react";
import AutoAwesomeOutlinedIcon from "@mui/icons-material/AutoAwesomeOutlined";
import CategoryOutlinedIcon from "@mui/icons-material/CategoryOutlined";
import FacebookIcon from "@mui/icons-material/Facebook";
import InstagramIcon from "@mui/icons-material/Instagram";
import LinkedInIcon from "@mui/icons-material/LinkedIn";
import PinterestIcon from "@mui/icons-material/Pinterest";
import WhatsAppIcon from "@mui/icons-material/WhatsApp";
import XIcon from "@mui/icons-material/X";
import YouTubeIcon from "@mui/icons-material/YouTube";
import { History, Music2 } from "lucide-react";
import type { PlatformFilter } from "./formats";
import type { Format } from "./types";
import { homePreset } from "./preset-catalog";
import { PresetCard } from "./preset-card";

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

export function FormatCard({
  format,
  onSelect,
}: {
  format: Format;
  index: number;
  onSelect: (format: Format) => void;
}) {
  return (
    <PresetCard
      preset={homePreset(format)}
      onClick={() => onSelect(format)}
      ariaLabel={`Create ${format.label}, ${format.width} by ${format.height} pixels`}
    />
  );
}

export function AddFormatCard({ onClick }: { onClick: () => void }) {
  return <PresetCard mode="create" onClick={onClick} />;
}

export function FormatGrid({
  formats,
  onSelect,
  onCreateCustom,
  containerRef,
  className,
}: {
  formats: Format[];
  onSelect: (format: Format) => void;
  onCreateCustom?: () => void;
  containerRef?: Ref<HTMLDivElement>;
  className?: string;
}) {
  return (
    <div
      ref={containerRef}
      className={className ? `format-grid ${className}` : "format-grid"}
    >
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
