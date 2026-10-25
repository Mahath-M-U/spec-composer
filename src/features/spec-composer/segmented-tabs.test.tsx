import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
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

  it("merges custom classes and forwards list/item styles without replacing shared classes or ARIA", () => {
    const html = renderToStaticMarkup(
      <SegmentedTabs
        label="Custom tabs"
        className="custom-track"
        style={{ "--segmented-track-radius": "12px", marginTop: 8 }}
      >
        <SegmentedTab
          id="custom-tab"
          dataTour="custom-tour"
          controls="custom-panel"
          selected
          className="custom-item"
          style={{
            "--segmented-selected-background": "#222222",
            "--segmented-item-height": "36px",
          }}
        >
          Custom
        </SegmentedTab>
      </SegmentedTabs>,
    );
    expect(html).toContain('class="ui-segmented custom-track"');
    expect(html).toContain("--segmented-track-radius:12px;margin-top:8px");
    expect(html).toContain('class="ui-segmented-item custom-item"');
    expect(html).toContain('data-tour="custom-tour"');
    expect(html).toContain(
      "--segmented-selected-background:#222222;--segmented-item-height:36px",
    );
    expect(html).toContain('aria-controls="custom-panel" tabindex="0"');
  });

  it("forwards keyboard/click handlers and button refs while preserving disabled semantics", () => {
    const onClick = vi.fn(),
      onKeyDown = vi.fn(),
      buttonRef = vi.fn();
    const tab = SegmentedTab({
      id: "disabled-tab",
      controls: "panel",
      selected: false,
      disabled: true,
      children: "Disabled",
      onClick,
      onKeyDown,
      buttonRef,
    });
    expect(tab.props.onClick).toBe(onClick);
    expect(tab.props.onKeyDown).toBe(onKeyDown);
    expect(tab.props.ref).toBe(buttonRef);
    expect(tab.props.disabled).toBe(true);
    expect(tab.props.tabIndex).toBe(-1);
    const list = SegmentedTabs({
      label: "Keyboard tabs",
      onKeyDown,
      children: tab,
    });
    expect(list.props.onKeyDown).toBe(onKeyDown);
    expect(list.props.role).toBe("tablist");
  });
});
