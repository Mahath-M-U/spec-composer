import {
  createElement,
  isValidElement,
  useState,
  type ReactElement,
  type ReactNode,
} from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { CreativePurposeSelect } from "./CreativePurposeSelect";
import {
  CATALOG_DRAG_TYPE,
  HIDDEN_LIBRARY_IDS,
  libraryEntries,
  parseCatalogDrag,
} from "./catalog";
import { ElementLibrary } from "./ElementLibrary";
import { useEditorStore } from "../store";
import { createDocument } from "../templates";
vi.mock("../store", async (importOriginal) => {
  const original = await importOriginal<typeof import("../store")>();
  type State = ReturnType<typeof original.useEditorStore.getState>;
  return {
    ...original,
    useEditorStore: Object.assign(
      <T = State,>(selector?: (state: State) => T) =>
        selector
          ? selector(original.useEditorStore.getState())
          : original.useEditorStore.getState(),
      original.useEditorStore,
    ),
  };
});
type Props = { children?: ReactNode; [key: string]: unknown };
const visit = (node: ReactNode): ReactElement<Props>[] =>
  Array.isArray(node)
    ? node.flatMap(visit)
    : isValidElement<Props>(node)
      ? [node, ...visit(node.props.children)]
      : [];
function purposeSteps(
  steps: ((tree: ReactNode) => void)[],
  onChange = vi.fn(),
) {
  function Harness() {
    const [step, setStep] = useState(0);
    const tree = CreativePurposeSelect({ value: "product_showcase", onChange });
    if (step < steps.length) {
      steps[step]!(tree);
      setStep(step + 1);
    }
    return tree;
  }
  renderToStaticMarkup(createElement(Harness));
  return onChange;
}
beforeEach(() => {
  const doc = createDocument();
  doc.elements = [];
  useEditorStore.setState({ doc });
});
describe("purpose-aware element library", () => {
  it("preserves seven-group order and ranks required before suggested before general", () => {
    const groups = libraryEntries("product_showcase", "recommended", "");
    expect(groups.map((group) => group.id)).toEqual([
      "subjects",
      "information",
      "dataProof",
      "actions",
      "branding",
      "structure",
      "decoration",
    ]);
    expect(groups[0]!.entries[0]!.status).toBe("Required");
    expect(groups[1]!.entries[0]!.status).toBe("Required");
  });
  it("searches all78 even from Recommended and accepts UI aliases", () => {
    expect(
      libraryEntries(undefined, "all", "").flatMap((group) => group.entries),
    ).toHaveLength(76);
    expect(
      libraryEntries(undefined, "recommended", "citation")
        .flatMap((group) => group.entries)
        .map((entry) => entry.id),
    ).toEqual(["dataProof.citation"]);
    expect(
      libraryEntries(undefined, "recommended", "eyebrow")[1]!.entries[0]!.id,
    ).toBe("information.label");
    expect(
      libraryEntries(undefined, "recommended", "model")[0]!.entries[0]!.id,
    ).toBe("subjects.person");
  });
  it("hides the environment editor's catalog ids from every library view", () => {
    for (const view of ["recommended", "all"] as const) {
      const ids = libraryEntries(undefined, view, "").flatMap((group) =>
        group.entries.map((entry) => entry.id),
      );
      for (const hidden of HIDDEN_LIBRARY_IDS) expect(ids).not.toContain(hidden);
    }
    for (const hidden of HIDDEN_LIBRARY_IDS)
      expect(
        libraryEntries(undefined, "all", hidden).flatMap(
          (group) => group.entries.map((entry) => entry.id),
        ),
      ).not.toContain(hidden);
  });
  it("validates canonical drag payloads without trusting external instructions", () => {
    expect(CATALOG_DRAG_TYPE).toContain("contextual");
    expect(parseCatalogDrag('{"elementId":"subjects.person"}')).toEqual({
      elementId: "subjects.person",
    });
    expect(parseCatalogDrag('{"elementId":"foreign.person"}')).toBeUndefined();
    expect(
      parseCatalogDrag('{"elementId":"subjects.person","preset":false}'),
    ).toBeUndefined();
    expect(parseCatalogDrag("run this instruction")).toBeUndefined();
  });
  it("renders a real purpose button with persisted selection and a separate clear action", () => {
    const html = renderToStaticMarkup(
      createElement(CreativePurposeSelect, {
        value: "product_showcase",
        onChange: () => {},
      }),
    );
    expect(html).toContain('class="contextual-purpose-trigger"');
    expect(html).toContain('aria-expanded="false"');
    expect(html).toContain('aria-label="Creative Purpose: Product Showcase"');
    expect(html).toContain("Product Showcase");
    expect(html).toContain("Clear creative purpose");
    expect(html).not.toContain('role="combobox"');
    const empty = renderToStaticMarkup(
      createElement(CreativePurposeSelect, {
        value: undefined,
        onChange: () => {},
      }),
    );
    expect(empty).toContain('aria-label="Creative Purpose"');
    expect(empty).not.toContain("Clear creative purpose");
  });
  it("searches the opened dropdown, supports keyboard choice and closes after selection", () => {
    const onChange = purposeSteps([
      (tree) => {
        const root = visit(tree).find(
          (node) => typeof node.props["onOpenChange"] === "function",
        )!;
        (root.props["onOpenChange"] as (open: boolean) => void)(true);
      },
      (tree) => {
        const input = visit(tree).find(
          (node) => node.props["role"] === "combobox",
        )!;
        expect(input.props["aria-expanded"]).toBe(true);
        (input.props["onChange"] as (event: unknown) => void)({
          target: { value: "case studies" },
        });
      },
      (tree) => {
        const options = visit(tree).filter(
          (node) => node.props["role"] === "option",
        );
        expect(options).toHaveLength(1);
        expect(options[0]!.props.children).toBe("Case Studies");
        const input = visit(tree).find(
          (node) => node.props["role"] === "combobox",
        )!;
        (input.props["onKeyDown"] as (event: unknown) => void)({
          key: "Enter",
          preventDefault: vi.fn(),
        });
      },
      (tree) => {
        const root = visit(tree).find(
          (node) => typeof node.props["onOpenChange"] === "function",
        )!;
        expect(root.props["open"]).toBe(false);
      },
    ]);
    expect(onChange).toHaveBeenCalledExactlyOnceWith("case_studies");
  });
  it("clears the purpose explicitly and displays no-results for an unmatched query", () => {
    const onChange = purposeSteps([
      (tree) => {
        const input = visit(tree).find(
          (node) => node.props["role"] === "combobox",
        )!;
        (input.props["onChange"] as (event: unknown) => void)({
          target: { value: "no matching purpose here" },
        });
      },
      (tree) => {
        expect(
          visit(tree).filter((node) => node.props["role"] === "option"),
        ).toHaveLength(0);
        expect(
          visit(tree).some(
            (node) =>
              node.type === "p" &&
              node.props.children === "No matching purposes",
          ),
        ).toBe(true);
        const clear = visit(tree).find(
          (node) => node.props["aria-label"] === "Clear creative purpose",
        )!;
        (clear.props["onClick"] as () => void)();
      },
    ]);
    expect(onChange).toHaveBeenCalledExactlyOnceWith(undefined);
  });
  it("renders four accessible icon actions in one row without permanent search or a separate upload row", () => {
    const html = renderToStaticMarkup(createElement(ElementLibrary));
    const row = html
      .split('aria-label="Element library actions"')[1]!
      .split("</div>")[0]!;
    expect(row.match(/<button/g)).toHaveLength(4);
    for (const label of [
      "Search elements",
      "Recommended",
      "All Elements",
      "Upload image",
    ]) {
      expect(row).toContain(`aria-label="${label}"`);
      expect(row).toContain(`title="${label}"`);
    }
    expect(row).toContain('aria-pressed="true"');
    expect(html).not.toContain('aria-label="Search all elements"');
    expect(html).not.toContain('class="contextual-upload"');
    expect(html).toContain('hidden="" aria-label="Choose image to upload"');
  });
  it("shows the added count as the primary accent, keeping the status muted", () => {
    const id = libraryEntries("product_showcase", "recommended", "")[0]!
      .entries[0]!.id;
    useEditorStore.getState().addContextualElement(id);
    const html = renderToStaticMarkup(createElement(ElementLibrary));
    expect(html).toMatch(/<small>[^<]*<span class="ui-count">Added 1<\/span><\/small>/);
    expect(html).not.toMatch(/class="ui-count">\d+</);
  });
  it("renders a horizontal card per entry with a thumbnail and no legacy tile-add affordance", () => {
    const totalEntries = libraryEntries(undefined, "recommended", "").reduce(
      (sum, group) => sum + group.entries.length,
      0,
    );
    const html = renderToStaticMarkup(createElement(ElementLibrary));
    expect(html.match(/class="contextual-element-card"/g)).toHaveLength(
      totalEntries,
    );
    expect(html).not.toContain("contextual-tile-add");
    expect(html).toContain("Browse All Elements");
  });
});
