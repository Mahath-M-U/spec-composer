import { useEffect, useId, useRef, useState } from "react";
import { Link, useRouter } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { Copy, ExternalLink, FileText, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DesignCard,
  type PreviewCardLinkProps,
  type PreviewCardMenuItem,
} from "@/components/design-card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { validateExternalToolRequirement } from "./compiler";
import { compileCopyText, type CopyKind } from "./copy-output";
import { projectKeys, useRemoveProject } from "./queries";
import {
  duplicateRecentDesign,
  renameRecentDesign,
} from "./recent-design-actions";
import { DocumentPreview } from "./static-render";
import { reportStorageError } from "./storage/errors";
import { useEditorStore } from "./store";
import type { SpecDocument } from "./types";

export function RecentDesignEditedTime({
  updatedAt,
  now,
}: {
  updatedAt: string;
  now: number | null;
}) {
  const edited = new Date(updatedAt);
  if (
    now === null ||
    !Number.isFinite(now) ||
    !Number.isFinite(edited.getTime())
  )
    return null;
  const minutes = Math.floor(Math.max(0, now - edited.getTime()) / 60_000);
  const label =
    minutes >= 1440
      ? `${Math.floor(minutes / 1440)}d ago`
      : minutes >= 60
        ? `${Math.floor(minutes / 60)}h ago`
        : minutes >= 1
          ? `${minutes}m ago`
          : "Just now";
  const timestamp = edited.toISOString();
  return (
    <time
      className="recent-design-edited-chip"
      dateTime={timestamp}
      title={timestamp}
      aria-label={`Last edited ${timestamp}`}
    >
      {label}
    </time>
  );
}

export function RecentDesignCard({ doc }: { doc: SpecDocument }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const removeProject = useRemoveProject();
  const [dialog, setDialog] = useState<"rename" | "delete" | null>(null);
  const [name, setName] = useState(doc.name);
  const [duplicating, setDuplicating] = useState(false);
  const [renaming, setRenaming] = useState(false);
  const [copyingText, setCopyingText] = useState(false);
  const [copied, setCopied] = useState(false);
  const [now, setNow] = useState<number | null>(null);
  const duplicatePending = useRef(false);
  const renamePending = useRef(false);
  const textPending = useRef(false);
  const deletePending = useRef(false);
  const dialogPending = useRef(false);
  const menuTrigger = useRef<HTMLButtonElement>(null);
  const copiedResetTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const nameId = useId();
  useEffect(() => {
    const updateClock = () => setNow(Date.now());
    updateClock();
    const interval = setInterval(updateClock, 60_000);
    return () => clearInterval(interval);
  }, []);
  useEffect(
    () => () => {
      if (copiedResetTimer.current) clearTimeout(copiedResetTimer.current);
    },
    [],
  );

  const warmEditor = () => {
    router
      .loadRouteChunk(router.routesById["/design/$projectId"])
      ?.catch(() => {});
  };
  const refreshProjects = () =>
    queryClient.invalidateQueries({ queryKey: projectKeys.all });
  const duplicateDesign = async () => {
    if (duplicatePending.current) return;
    duplicatePending.current = true;
    setDuplicating(true);
    try {
      await duplicateRecentDesign(doc.id);
      await refreshProjects();
      toast.success("Design duplicated");
    } catch (error) {
      reportStorageError(error, "duplicate-project");
    } finally {
      duplicatePending.current = false;
      setDuplicating(false);
    }
  };
  const copyText = async (kind: CopyKind) => {
    if (textPending.current) return;
    if (kind === "prompt") {
      const error = validateExternalToolRequirement(
        doc.externalToolRequirement,
      );
      if (error) {
        toast.error(error.message, {
          description:
            "Open the design to complete its external tool settings.",
        });
        return;
      }
    }
    textPending.current = true;
    setCopyingText(true);
    try {
      const kit = useEditorStore
        .getState()
        .brandKits.find((item) => item.id === doc.creativeDirection.brandKitId);
      const text = compileCopyText(doc, kit, kind);
      await navigator.clipboard.writeText(text);
      toast.success(kind === "design" ? "DESIGN.md copied" : "Prompt copied", {
        description:
          kind === "design"
            ? "DESIGN.md is ready to paste."
            : "The design prompt is ready to paste.",
      });
      if (kind === "design") {
        setCopied(true);
        if (copiedResetTimer.current) clearTimeout(copiedResetTimer.current);
        copiedResetTimer.current = setTimeout(() => setCopied(false), 2000);
      }
    } catch {
      toast.error("Couldn't copy design", {
        description: "Allow clipboard access in your browser and try again.",
      });
    } finally {
      textPending.current = false;
      setCopyingText(false);
    }
  };
  const copyDesignMarkdown = () => copyText("design");
  const copyPrompt = () => copyText("prompt");
  const openDialog = (next: "rename" | "delete") => {
    dialogPending.current = true;
    if (next === "rename") setName(doc.name);
    setDialog(next);
  };
  const restoreMenuFocus = (event: Event) => {
    event.preventDefault();
    dialogPending.current = false;
    menuTrigger.current?.focus();
  };
  const rename = async () => {
    if (renamePending.current || !name.trim()) return;
    renamePending.current = true;
    setRenaming(true);
    try {
      await renameRecentDesign(doc.id, name);
      await refreshProjects();
      setDialog(null);
      toast.success("Design renamed");
    } catch (error) {
      reportStorageError(error, "rename-project");
    } finally {
      renamePending.current = false;
      setRenaming(false);
    }
  };
  const deleteDesign = async () => {
    if (deletePending.current) return;
    deletePending.current = true;
    const focusFallback = menuTrigger.current
      ?.closest("section")
      ?.querySelector<HTMLElement>(".section-link, .projects-search input");
    try {
      await removeProject.mutateAsync(doc.id);
      setDialog(null);
      toast.success("Design deleted");
      if (focusFallback) {
        requestAnimationFrame(() => {
          if (!menuTrigger.current?.isConnected) focusFallback.focus();
        });
      }
    } catch (error) {
      reportStorageError(error, "remove-project");
    } finally {
      deletePending.current = false;
    }
  };

  const renderOpenLink = (linkProps: PreviewCardLinkProps) => (
    <Link
      to="/design/$projectId"
      params={{ projectId: doc.id }}
      {...linkProps}
    />
  );
  const menuItems: PreviewCardMenuItem[] = [
    {
      id: "open",
      label: "Open",
      icon: <ExternalLink aria-hidden="true" />,
      ariaLabel: `Open ${doc.name}`,
      renderLink: renderOpenLink,
    },
    {
      id: "duplicate",
      label: "Duplicate design",
      icon: <Copy aria-hidden="true" />,
      onSelect: duplicateDesign,
      disabled: duplicating,
    },
    {
      id: "copy-design",
      label: "Copy DESIGN.md",
      icon: <FileText aria-hidden="true" />,
      onSelect: copyDesignMarkdown,
      disabled: copyingText,
    },
    ...(doc.promptMode === "visual_prompt"
      ? [
          {
            id: "copy-prompt",
            label: "Copy prompt",
            icon: <FileText aria-hidden="true" />,
            onSelect: copyPrompt,
            disabled: copyingText,
          },
        ]
      : []),
    {
      id: "rename",
      label: "Rename",
      icon: <Pencil aria-hidden="true" />,
      onSelect: () => openDialog("rename"),
    },
    {
      id: "delete",
      label: "Delete",
      icon: <Trash2 aria-hidden="true" />,
      onSelect: () => openDialog("delete"),
      disabled: removeProject.isPending,
      destructive: true,
      separatorBefore: true,
    },
  ];

  return (
    <>
      <DesignCard
        className="card-hover-scale"
        title={doc.name}
        category={doc.format.label}
        dimensions={`${doc.format.width} × ${doc.format.height}`}
        aspectRatio={`${doc.format.width} / ${doc.format.height}`}
        media={<DocumentPreview doc={doc} />}
        previewLabel={`Open ${doc.name}`}
        renderLink={renderOpenLink}
        modifiedBadge={
          <RecentDesignEditedTime updatedAt={doc.updatedAt} now={now} />
        }
        copyAction={{
          ariaLabel: `Copy DESIGN.md: ${doc.name}`,
          tooltip: "Copy DESIGN.md",
          onSelect: copyDesignMarkdown,
          busy: copyingText,
          copied,
        }}
        menuItems={menuItems}
        menuTriggerRef={menuTrigger}
        onMenuCloseAutoFocus={(event) => {
          if (dialogPending.current) event.preventDefault();
        }}
        onWarm={warmEditor}
      />
      <Dialog
        open={dialog === "rename"}
        onOpenChange={(open) => {
          if (!open && !renamePending.current) setDialog(null);
        }}
      >
        <DialogContent onCloseAutoFocus={restoreMenuFocus}>
          <DialogHeader>
            <DialogTitle>Rename design</DialogTitle>
            <DialogDescription>
              Choose a name for this design.
            </DialogDescription>
          </DialogHeader>
          <form
            onSubmit={(event) => {
              event.preventDefault();
              void rename();
            }}
          >
            <label htmlFor={nameId} className="text-sm font-medium">
              Design name
            </label>
            <Input
              id={nameId}
              value={name}
              onChange={(event) => setName(event.target.value)}
              autoFocus
              disabled={renaming}
              className="mt-2"
            />
            <DialogFooter className="mt-4 gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setDialog(null)}
                disabled={renaming}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={renaming || !name.trim()}>
                {renaming ? "Saving…" : "Save name"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      <AlertDialog
        open={dialog === "delete"}
        onOpenChange={(open) => {
          if (!open && !deletePending.current) setDialog(null);
        }}
      >
        <AlertDialogContent onCloseAutoFocus={restoreMenuFocus}>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete “{doc.name}”?</AlertDialogTitle>
            <AlertDialogDescription>
              This design is stored only in this browser. Deleting it cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={removeProject.isPending}>
              Keep design
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={removeProject.isPending}
              onClick={(event) => {
                event.preventDefault();
                void deleteDesign();
              }}
            >
              {removeProject.isPending ? "Deleting…" : "Delete design"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
