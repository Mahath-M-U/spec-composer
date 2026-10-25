/** Presets preserve existing scene objects unless the user explicitly chooses Replace. */
import { useState } from "react";
import { toast } from "sonner";
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
import {
  ENVIRONMENT_PRESETS,
  findEnvironmentPreset,
} from "../environment-presets";
import { useEditorStore } from "../store";
import { PresetCard } from "./PresetCard";

export function PresetSection() {
  const doc = useEditorStore((s) => s.doc);
  const [pendingId, setPendingId] = useState<string | null>(null);
  if (!doc) return null;
  const settings = doc.generationSettings;
  const hasScene =
    !!settings?.camera ||
    !!settings?.studioLights?.length ||
    settings?.ambient !== undefined;

  const apply = (id: string, mode: "replace" | "merge") => {
    const label = findEnvironmentPreset(id)?.label ?? "Preset";
    const result = useEditorStore.getState().applyEnvironmentPreset(id, mode);
    setPendingId(null);
    if (!result.applied) return;
    toast.success(
      result.skipped > 0
        ? `${label} preset applied — ${result.skipped} light${result.skipped === 1 ? "" : "s"} skipped (six-light limit reached).`
        : `${label} preset applied.`,
    );
  };

  const pending = pendingId ? findEnvironmentPreset(pendingId) : undefined;

  return (
    <div className="environment-presets-section">
      <h3>Presets</h3>
      <div className="environment-preset-grid">
        {ENVIRONMENT_PRESETS.map((preset) => (
          <PresetCard
            key={preset.id}
            preset={preset}
            active={settings?.scenePreset === preset.id}
            onClick={() =>
              hasScene ? setPendingId(preset.id) : apply(preset.id, "replace")
            }
          />
        ))}
      </div>
      <AlertDialog
        open={!!pending}
        onOpenChange={(open) => !open && setPendingId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Apply the {pending?.label} preset?
            </AlertDialogTitle>
            <AlertDialogDescription>
              The scene already has objects or ambient settings. Replace clears
              the current camera, lights and ambient and sets them from the
              preset. Merge keeps your camera and adds the preset&apos;s lights
              alongside the existing ones, up to the six-light limit.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => pendingId && apply(pendingId, "merge")}
            >
              Merge
            </AlertDialogAction>
            <AlertDialogAction
              onClick={() => pendingId && apply(pendingId, "replace")}
            >
              Replace
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
