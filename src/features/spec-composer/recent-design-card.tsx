import { useEffect, useId, useRef, useState } from "react";
import { Link, useRouter } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import {
  Copy,
  ExternalLink,
  FileText,
  MoreHorizontal,
  Pencil,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
  const [menuOpen, setMenuOpen] = useState(false);
  const [dialog, setDialog] = useState<"rename" | "delete" | null>(null);
  const [name, setName] = useState(doc.name);
  const [duplicating, setDuplicating] = useState(false);
  const [renaming, setRenaming] = useState(false);
  const [copyingText, setCopyingText] = useState(false);
  const [now, setNow] = useState<number | null>(null);
  const duplicatePending = useRef(false);
  const renamePending = useRef(false);
  const textPending = useRef(false);
  const deletePending = useRef(false);
  const dialogPending = useRef(false);
  const menuTrigger = useRef<HTMLButtonElement>(null);
  const nameId = useId();
  useEffect(() => {
    const updateClock = () => setNow(Date.now());
    updateClock();
    const interval = setInterval(updateClock, 60_000);
    return () => clearInterval(interval);
  }, []);

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
      ?.querySelector<HTMLAnchorElement>(".section-link");
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

  return (
    <>
      <article
        className="recent-design-card"
        data-menu-open={menuOpen || undefined}
        onPointerEnter={warmEditor}
        onFocus={warmEditor}
      >
        <div className="recent-design-preview">
          <Link
            to="/design/$projectId"
            params={{ projectId: doc.id }}
            className="recent-design-preview-link"
            aria-label={`Preview ${doc.name}`}
            tabIndex={-1}
          >
            <DocumentPreview doc={doc} />
          </Link>
          <RecentDesignEditedTime updatedAt={doc.updatedAt} now={now} />
          <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
            <DropdownMenuTrigger asChild>
              <button
                ref={menuTrigger}
                type="button"
                className="recent-design-menu-trigger"
                aria-label={`More actions for ${doc.name}`}
              >
                <MoreHorizontal size={18} aria-hidden="true" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              className="recent-design-menu"
              align="end"
              sideOffset={6}
              onCloseAutoFocus={(event) => {
                if (dialogPending.current) event.preventDefault();
              }}
            >
              <DropdownMenuItem asChild>
                <Link
                  to="/design/$projectId"
                  params={{ projectId: doc.id }}
                  aria-label={`Open ${doc.name}`}
                >
                  <ExternalLink aria-hidden="true" /> Open
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem
                onSelect={duplicateDesign}
                disabled={duplicating}
              >
                <Copy aria-hidden="true" /> Duplicate design
              </DropdownMenuItem>
              <DropdownMenuItem
                onSelect={copyDesignMarkdown}
                disabled={copyingText}
              >
                <FileText aria-hidden="true" />
                Copy DESIGN.md
              </DropdownMenuItem>
              {doc.promptMode === "visual_prompt" && (
                <DropdownMenuItem onSelect={copyPrompt} disabled={copyingText}>
                  <FileText aria-hidden="true" /> Copy prompt
                </DropdownMenuItem>
              )}
              <DropdownMenuItem onSelect={() => openDialog("rename")}>
                <Pencil aria-hidden="true" /> Rename
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="recent-design-delete-item"
                onSelect={() => openDialog("delete")}
                disabled={removeProject.isPending}
              >
                <Trash2 aria-hidden="true" /> Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <div className="recent-design-actions">
            <Link
              to="/design/$projectId"
              params={{ projectId: doc.id }}
              className="recent-design-action recent-design-open"
              aria-label={`Open ${doc.name}`}
            >
              <ExternalLink size={14} aria-hidden="true" /> Open
            </Link>
            <button
              type="button"
              className="recent-design-action recent-design-copy"
              aria-label={`Copy DESIGN.md: ${doc.name}`}
              aria-busy={copyingText}
              disabled={copyingText}
              onClick={copyDesignMarkdown}
            >
              <Copy size={14} aria-hidden="true" /> Copy
            </button>
          </div>
        </div>
        <div className="recent-design-metadata">
          <h3 className="recent-design-title" title={doc.name}>
            {doc.name}
          </h3>
          <p className="recent-design-format" title={doc.format.label}>
            {doc.format.label} · {doc.format.width} × {doc.format.height}
          </p>
        </div>
      </article>
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
