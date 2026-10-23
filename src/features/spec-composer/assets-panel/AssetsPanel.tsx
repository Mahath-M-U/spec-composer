import { Image as ImageIcon } from "lucide-react";
import { ElementLibrary } from "../contextual-editor/ElementLibrary";
import { PanelHeader } from "../panel-header";

export function AssetsPanel() {
  return (
    <div className="assets-panel compose-panel">
      <PanelHeader icon={ImageIcon} eyebrow="Library" title="Assets" />
      <ElementLibrary />
    </div>
  );
}
