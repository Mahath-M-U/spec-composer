import {
  Fragment,
  useState,
  type CSSProperties,
  type ReactElement,
  type ReactNode,
  type Ref,
} from "react";
import { MoreHorizontal } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MediaSkeleton } from "@/components/media-skeleton";
import { cn } from "@/lib/utils";

export type PreviewCardLinkProps = {
  className?: string;
  "aria-label"?: string;
  tabIndex?: number;
  children: ReactNode;
};

export type PreviewCardAction = {
  label: string;
  ariaLabel: string;
  icon?: ReactNode;
  className?: string;
  onSelect?: () => void | Promise<void>;
  renderLink?: (props: PreviewCardLinkProps) => ReactElement;
  disabled?: boolean;
  busy?: boolean;
  status?: string;
};

export type PreviewCardMenuItem = {
  id: string;
  label: ReactNode;
  icon?: ReactNode;
  ariaLabel?: string;
  onSelect?: (event: Event) => void;
  renderLink?: (props: PreviewCardLinkProps) => ReactElement;
  disabled?: boolean;
  destructive?: boolean;
  separatorBefore?: boolean;
};

export type PreviewCardPill = {
  id: string;
  label: ReactNode;
  title?: string;
  decorative?: boolean;
};

export type PreviewCardProps = {
  title: string;
  subtitle?: ReactNode;
  subtitleTitle?: string;
  media: ReactNode;
  previewLabel?: string;
  aspectRatio?: string;
  pills?: PreviewCardPill[];
  badge?: ReactNode;
  primaryAction: PreviewCardAction;
  secondaryActions?: PreviewCardAction[];
  menuItems?: PreviewCardMenuItem[];
  menuLabel?: string;
  menuTriggerRef?: Ref<HTMLButtonElement>;
  onMenuCloseAutoFocus?: (event: Event) => void;
  onWarm?: () => void;
  className?: string;
};

function iconActionContent(action: PreviewCardAction) {
  return (
    <>
      {action.icon}
      {action.status !== undefined && (
        <span className="sr-only" role="status">
          {action.status}
        </span>
      )}
    </>
  );
}

function renderPrimaryAction(action: PreviewCardAction) {
  const className = cn("preview-card-primary", action.className);
  if (action.renderLink) {
    return action.renderLink({
      className,
      "aria-label": action.ariaLabel,
      children: (
        <>
          {action.icon}
          {action.label}
        </>
      ),
    });
  }
  return (
    <button
      type="button"
      className={className}
      onClick={action.onSelect}
      disabled={action.disabled}
      aria-busy={action.busy}
      aria-label={action.ariaLabel}
    >
      {action.icon}
      {action.label}
    </button>
  );
}

function renderSecondaryAction(action: PreviewCardAction) {
  const className = cn(
    "preview-card-icon preview-card-secondary",
    action.className,
  );
  if (action.renderLink) {
    return action.renderLink({
      className,
      "aria-label": action.ariaLabel,
      children: iconActionContent(action),
    });
  }
  return (
    <button
      type="button"
      className={className}
      onClick={action.onSelect}
      disabled={action.disabled}
      aria-busy={action.busy}
      aria-label={action.ariaLabel}
    >
      {iconActionContent(action)}
    </button>
  );
}

/** Presentational card shared by home templates and recent designs: a media
 * preview with a hover/focus overlay (pills, title, primary + secondary
 * actions, overflow menu), then compact title/subtitle metadata. */
export function PreviewCard({
  title,
  subtitle,
  subtitleTitle,
  media,
  previewLabel,
  aspectRatio = "4 / 5",
  pills,
  badge,
  primaryAction,
  secondaryActions = [],
  menuItems = [],
  menuLabel,
  menuTriggerRef,
  onMenuCloseAutoFocus,
  onWarm,
  className,
}: PreviewCardProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const mediaAriaLabel = previewLabel ?? primaryAction.ariaLabel;
  const mediaLinkProps: PreviewCardLinkProps = {
    className: "preview-card-media-link",
    "aria-label": mediaAriaLabel,
    tabIndex: -1,
    children: media,
  };

  return (
    <article
      className={cn("preview-card", className)}
      data-menu-open={menuOpen || undefined}
      onPointerEnter={onWarm}
      onFocus={onWarm}
    >
      <div
        className="preview-card-media"
        style={{ "--preview-card-aspect": aspectRatio } as CSSProperties}
      >
        {primaryAction.renderLink ? (
          primaryAction.renderLink(mediaLinkProps)
        ) : (
          <button
            type="button"
            className="preview-card-media-link"
            onClick={primaryAction.onSelect}
            tabIndex={-1}
            aria-label={mediaAriaLabel}
          >
            {media}
          </button>
        )}
        {badge && <div className="preview-card-badge">{badge}</div>}
        <div className="preview-card-overlay">
          {pills && pills.length > 0 && (
            <div className="preview-card-pills">
              {pills.map((pill) => (
                <span
                  key={pill.id}
                  className="preview-card-pill"
                  title={pill.title}
                  aria-hidden={pill.decorative || undefined}
                >
                  {pill.label}
                </span>
              ))}
            </div>
          )}
          <p className="preview-card-overlay-title" aria-hidden="true">
            {title}
          </p>
          <div className="preview-card-actions">
            {renderPrimaryAction(primaryAction)}
            {secondaryActions.map((action, index) => (
              <Fragment key={action.ariaLabel || index}>
                {renderSecondaryAction(action)}
              </Fragment>
            ))}
            {menuItems.length > 0 && (
              <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
                <DropdownMenuTrigger asChild>
                  <button
                    ref={menuTriggerRef}
                    type="button"
                    className="preview-card-icon preview-card-more"
                    aria-label={menuLabel ?? `More actions for ${title}`}
                  >
                    <MoreHorizontal size={16} aria-hidden="true" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  className="preview-card-menu"
                  align="end"
                  sideOffset={6}
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
                              "preview-card-menu-item--destructive",
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
                              "preview-card-menu-item--destructive",
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
        </div>
      </div>
      <div className="preview-card-meta">
        <h3 className="preview-card-title" title={title}>
          {title}
        </h3>
        {subtitle !== undefined && (
          <p className="preview-card-subtitle" title={subtitleTitle}>
            {subtitle}
          </p>
        )}
      </div>
    </article>
  );
}

export type PreviewCardSkeletonProps = {
  aspectRatio?: string;
};

export function PreviewCardSkeleton(props: PreviewCardSkeletonProps = {}) {
  const aspectRatio = props.aspectRatio ?? "4 / 5";
  return (
    <div className="preview-card-skeleton">
      <div
        className="preview-card-media"
        style={{ "--preview-card-aspect": aspectRatio } as CSSProperties}
      >
        <MediaSkeleton />
      </div>
      <MediaSkeleton className="media-skeleton--line" />
    </div>
  );
}
