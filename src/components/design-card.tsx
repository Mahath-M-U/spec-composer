import {
  Fragment,
  useState,
  type CSSProperties,
  type ReactElement,
  type ReactNode,
  type Ref,
} from "react";
import { Check, Copy, MoreHorizontal } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Hint } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import type { PreviewCardLinkProps, PreviewCardMenuItem } from "./preview-card";
import "./design-card.css";

export type { PreviewCardLinkProps, PreviewCardMenuItem };

export type DesignCardCopyAction = {
  ariaLabel: string;
  tooltip: string;
  onSelect: () => void | Promise<void>;
  busy?: boolean;
  copied?: boolean;
  status?: string;
  disabled?: boolean | undefined;
};

export type DesignCardProps = {
  title: string;
  category?: string;
  dimensions?: string;
  media: ReactNode;
  aspectRatio?: string;
  previewLabel?: string;
  renderLink?: (props: PreviewCardLinkProps) => ReactElement;
  onOpen?: () => void;
  modifiedBadge?: ReactNode;
  copyAction?: DesignCardCopyAction;
  menuItems?: PreviewCardMenuItem[];
  menuLabel?: string;
  menuTriggerRef?: Ref<HTMLButtonElement>;
  onMenuCloseAutoFocus?: (event: Event) => void;
  onWarm?: () => void;
  className?: string;
};

function copyStatusContent(copyAction: DesignCardCopyAction) {
  const status =
    copyAction.status ??
    (copyAction.copied ? "Copied" : copyAction.busy ? "Copying…" : undefined);
  if (status === undefined) return null;
  return (
    <span className="sr-only" role="status">
      {status}
    </span>
  );
}

/** Reusable image-first card: a clickable preview, a compact title/metadata
 * footer, and a circular copy action, with a modified-time badge and an
 * overflow menu revealed on hover/focus/touch. Shared by recent designs. */
export function DesignCard({
  title,
  category,
  dimensions,
  media,
  aspectRatio = "4 / 5",
  previewLabel,
  renderLink,
  onOpen,
  modifiedBadge,
  copyAction,
  menuItems = [],
  menuLabel,
  menuTriggerRef,
  onMenuCloseAutoFocus,
  onWarm,
  className,
}: DesignCardProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const mediaAriaLabel = previewLabel ?? title;
  const mediaLinkProps: PreviewCardLinkProps = {
    className: "design-card-media-link",
    "aria-label": mediaAriaLabel,
    children: media,
  };
  const meta = [category, dimensions]
    .filter((part): part is string => Boolean(part))
    .join(" · ");

  return (
    <article
      className={cn("design-card", className)}
      data-menu-open={menuOpen || undefined}
      onPointerEnter={onWarm}
      onFocus={onWarm}
    >
      <div
        className="design-card-media"
        style={{ "--design-card-aspect": aspectRatio } as CSSProperties}
      >
        {renderLink ? (
          renderLink(mediaLinkProps)
        ) : (
          <button
            type="button"
            className="design-card-media-link"
            onClick={onOpen}
            aria-label={mediaAriaLabel}
          >
            {media}
          </button>
        )}
        {modifiedBadge && (
          <div className="design-card-badge">{modifiedBadge}</div>
        )}
        {menuItems.length > 0 && (
          <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
            <Hint label="More actions">
              <DropdownMenuTrigger asChild>
                <button
                  ref={menuTriggerRef}
                  type="button"
                  className="design-card-more"
                  aria-label={menuLabel ?? `More actions for ${title}`}
                >
                  <MoreHorizontal size={16} aria-hidden="true" />
                </button>
              </DropdownMenuTrigger>
            </Hint>
            <DropdownMenuContent
              className="design-card-menu"
              align="end"
              side="bottom"
              sideOffset={6}
              collisionPadding={8}
              onCloseAutoFocus={onMenuCloseAutoFocus}
            >
              {menuItems.map((item) => (
                <Fragment key={item.id}>
                  {item.separatorBefore && <DropdownMenuSeparator />}
                  {item.renderLink ? (
                    <DropdownMenuItem
                      asChild
                      disabled={item.disabled ?? false}
                      className={cn(
                        item.destructive &&
                          "design-card-menu-item--destructive",
                      )}
                    >
                      {item.renderLink({
                        ...(item.ariaLabel !== undefined
                          ? { "aria-label": item.ariaLabel }
                          : {}),
                        children: (
                          <>
                            {item.icon}
                            {item.label}
                          </>
                        ),
                      })}
                    </DropdownMenuItem>
                  ) : (
                    <DropdownMenuItem
                      onSelect={item.onSelect ?? (() => {})}
                      disabled={item.disabled ?? false}
                      aria-label={item.ariaLabel}
                      className={cn(
                        item.destructive &&
                          "design-card-menu-item--destructive",
                      )}
                    >
                      {item.icon}
                      {item.label}
                    </DropdownMenuItem>
                  )}
                </Fragment>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
      <div className="design-card-footer">
        <div className="design-card-meta">
          <h3 className="design-card-title" title={title}>
            {title}
          </h3>
          {meta && <p className="design-card-subtitle">{meta}</p>}
        </div>
        {copyAction && (
          <Hint label={copyAction.tooltip}>
            <button
              type="button"
              className="design-card-copy"
              onClick={copyAction.onSelect}
              disabled={copyAction.disabled}
              aria-busy={copyAction.busy}
              aria-label={copyAction.ariaLabel}
            >
              {copyAction.copied ? (
                <Check size={16} aria-hidden="true" />
              ) : (
                <Copy size={16} aria-hidden="true" />
              )}
              {copyStatusContent(copyAction)}
            </button>
          </Hint>
        )}
      </div>
    </article>
  );
}
