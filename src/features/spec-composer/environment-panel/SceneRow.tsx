import { Copy, Eye, EyeOff, MoreHorizontal, Power, Trash2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { CommitInput } from "../committed-input";
import { useEditorStore } from "../store";
import { canAddLight, type SceneObjectSummary } from "../scene-objects";
import { CircularAction } from "./CircularAction";
import { SceneIcon } from "./scene-icons";

export function SceneObjectActions({ row }: { row: SceneObjectSummary }) {
  const atCap = useEditorStore((s) => !s.doc || !canAddLight(s.doc));
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <CircularAction label={`Actions for ${row.label}`}>
          <MoreHorizontal aria-hidden="true" />
        </CircularAction>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {row.type === "light" && (
          <DropdownMenuItem
            disabled={atCap}
            onSelect={() =>
              useEditorStore.getState().duplicateSceneLight(row.id)
            }
          >
            <Copy aria-hidden="true" /> Duplicate
            {atCap ? " (limit reached)" : ""}
          </DropdownMenuItem>
        )}
        <DropdownMenuItem
          onSelect={() => useEditorStore.getState().removeSceneObject(row.id)}
        >
          <Trash2 aria-hidden="true" /> Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function SceneRow({ row }: { row: SceneObjectSummary }) {
  const selected = useEditorStore((s) => s.selectedSceneId === row.id);
  const select = () => useEditorStore.getState().selectScene(row.id);
  return (
    <li className="scene-list-row" data-selected={selected} onClick={select}>
      <button
        type="button"
        className="scene-list-select"
        aria-pressed={selected}
        aria-label={`Select ${row.label}`}
        onClick={select}
      >
        <SceneIcon id={row.iconId} />
      </button>
      <div className="scene-list-name" onFocus={select}>
        <CommitInput
          label={`Rename ${row.label}`}
          value={row.label}
          required
          maxLength={60}
          onCommit={(value) =>
            useEditorStore.getState().renameSceneObject(row.id, value)
          }
        />
      </div>
      <div
        className="scene-list-actions"
        onClick={(event) => event.stopPropagation()}
      >
        <CircularAction
          label={`${row.guideHidden ? "Show" : "Hide"} ${row.label} guide`}
          onClick={() => useEditorStore.getState().toggleSceneGuide(row.id)}
        >
          {row.guideHidden ? (
            <EyeOff aria-hidden="true" />
          ) : (
            <Eye aria-hidden="true" />
          )}
        </CircularAction>
        <CircularAction
          label={`${row.enabled ? "Disable" : "Enable"} ${row.label}`}
          aria-pressed={row.enabled}
          onClick={() => {
            const s = useEditorStore.getState();
            if (row.type === "camera")
              s.updateSceneCamera({ enabled: !row.enabled });
            else s.updateSceneLight(row.id, { enabled: !row.enabled });
          }}
        >
          <Power aria-hidden="true" />
        </CircularAction>
        <SceneObjectActions row={row} />
      </div>
    </li>
  );
}
