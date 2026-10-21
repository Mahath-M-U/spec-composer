import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { Shapes, Sun } from "lucide-react";
import { SegmentedTab, SegmentedTabs } from "./segmented-tabs";

function renderTabs(selectedId: "add" | "environment" = "add") {
  return renderToStaticMarkup(
    <SegmentedTabs label="Composition settings" className="asset-workflow-tabs">
      <SegmentedTab
        id="add-tab"
        selected={selectedId === "add"}
        controls="add-panel"
        icon={Shapes}
      >
        Add
      </SegmentedTab>
      <SegmentedTab
        id="environment-tab"
        selected={selectedId === "environment"}
        controls="environment-panel"
        icon={Sun}
      >
        Environment
      </SegmentedTab>
    </SegmentedTabs>,
  );
}

describe("segmented tabs", () => {
  it("renders a tablist carrying the shared primitive and any extra class", () => {
    const html = renderTabs();
    expect(html).toContain('role="tablist"');
    expect(html).toContain('aria-label="Composition settings"');
    expect(html).toContain('class="ui-segmented asset-workflow-tabs"');
  });

  it("renders one tab per item with aria-controls passthrough", () => {
    const html = renderTabs();
    expect(html.match(/role="tab"/g)).toHaveLength(2);
    expect(html).toContain('id="add-tab"');
    expect(html).toContain('aria-controls="add-panel"');
    expect(html).toContain('id="environment-tab"');
    expect(html).toContain('aria-controls="environment-panel"');
  });

  it("marks the selected tab and leaves the rest unselected", () => {
    const html = renderTabs("environment");
    const tabs = [...html.matchAll(/<button[^>]*role="tab"[^>]*>/g)].map(
      (match) => match[0],
    );
    expect(tabs).toHaveLength(2);
    expect(tabs[0]).toContain('aria-selected="false"');
    expect(tabs[0]).toContain('tabindex="-1"');
    expect(tabs[1]).toContain('aria-selected="true"');
    expect(tabs[1]).toContain('tabindex="0"');
  });
});
