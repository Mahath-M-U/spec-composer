import {
  createElement,
  isValidElement,
  type ReactElement,
  type ReactNode,
} from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { Link } from "@tanstack/react-router";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { RecentDesignCard, RecentDesignEditedTime } from "./recent-design-card";
import { createDocument } from "./templates";
import type { SpecDocument } from "./types";

const mocks = vi.hoisted(() => ({
  duplicate: vi.fn(),
  rename: vi.fn(),
  remove: vi.fn(),
  invalidate: vi.fn(),
  reportError: vi.fn(),
  success: vi.fn(),
  error: vi.fn(),
  compilePrompt: vi.fn(),
  compileDesign: vi.fn(),
  validate: vi.fn(),
  loadRouteChunk: vi.fn(),
}));

vi.mock("@tanstack/react-router", async () => {
  const { createElement } = await import("react");
  return {
    Link: ({
      to,
      params,
      children,
      ...props
    }: {
      to: string;
      params: { projectId: string };
      children: ReactNode;
    }) =>
      createElement(
        "a",
        { ...props, href: to.replace("$projectId", params.projectId) },
        children,
      ),
    useRouter: () => ({
      loadRouteChunk: mocks.loadRouteChunk,
      routesById: { "/design/$projectId": "editor-route" },
    }),
  };
});
vi.mock("@tanstack/react-query", () => ({
  useQueryClient: () => ({ invalidateQueries: mocks.invalidate }),
}));
vi.mock("./queries", () => ({
  projectKeys: { all: ["projects"] },
  useRemoveProject: () => ({ mutateAsync: mocks.remove, isPending: false }),
}));
vi.mock("./recent-design-actions", () => ({
  duplicateRecentDesign: mocks.duplicate,
  renameRecentDesign: mocks.rename,
}));
vi.mock("./storage/errors", () => ({ reportStorageError: mocks.reportError }));
vi.mock("sonner", () => ({
  toast: { success: mocks.success, error: mocks.error },
}));
vi.mock("./compiler", () => ({
  compilePromptEditorOutput: mocks.compilePrompt,
  validateExternalToolRequirement: mocks.validate,
}));
vi.mock("./design-md", () => ({ compileDesignSkill: mocks.compileDesign }));
vi.mock("./store", () => ({
  useEditorStore: { getState: () => ({ brandKits: [] }) },
}));
vi.mock("./static-render", async () => {
  const { createElement } = await import("react");
  return {
    DocumentPreview: () => createElement("span", { "data-full-preview": true }),
  };
});

type ElementProps = { children?: ReactNode; [key: string]: unknown };
let tree: ReactElement;
function renderCard(doc: SpecDocument) {
  function Capture() {
    tree = RecentDesignCard({ doc });
    return tree;
  }
  return renderToStaticMarkup(createElement(Capture));
}
function elements(node: ReactNode): ReactElement<ElementProps>[] {
  if (Array.isArray(node)) return node.flatMap((child) => elements(child));
  if (!isValidElement<ElementProps>(node)) return [];
  return [node, ...elements(node.props.children)];
}
function find(predicate: (element: ReactElement<ElementProps>) => boolean) {
  const element = elements(tree).find(predicate);
  expect(element).toBeDefined();
  return element!;
}
function byText(text: string) {
  return find((element) => {
    const children = element.props.children;
    return (
      Array.isArray(children) &&
      children.some(
        (child) => typeof child === "string" && child.trim() === text,
      )
    );
  });
}
function callback(element: ReactElement<ElementProps>, prop: string) {
  return element.props[prop] as (event?: {
    preventDefault: () => void;
  }) => Promise<void> | void;
}

beforeEach(() => {
  vi.resetAllMocks();
  mocks.duplicate.mockResolvedValue({});
  mocks.rename.mockResolvedValue({});
  mocks.remove.mockResolvedValue(undefined);
  mocks.invalidate.mockResolvedValue(undefined);
  mocks.compilePrompt.mockReturnValue("Compiled prompt");
  mocks.compileDesign.mockReturnValue("Compiled DESIGN.md");
});

describe("recent design card", () => {
  it("renders mounted, separate Open and Copy controls with full preview and safe metadata", () => {
    const doc = {
      ...createDocument(),
      id: "recent-design",
      name: '<Long title & "quotes">',
      updatedAt: "2026-10-19T08:30:00.000Z",
    };
    const html = renderCard(doc);
    expect(html).toContain('href="/design/recent-design"');
    expect(html).toContain('class="recent-design-action recent-design-open"');
    expect(html).toContain('class="recent-design-action recent-design-copy"');
    expect(html).toContain('data-full-preview="true"');
    expect(html).toContain("&lt;Long title &amp; &quot;quotes&quot;&gt;");
    expect(html).toContain(doc.format.label);
    expect(html).toContain(`${doc.format.width} × ${doc.format.height}`);
    expect(html).not.toContain("<time");
    expect(html).not.toContain("Edited Oct 19, 2026");
    expect(html).toContain('aria-label="More actions for');
    const card = find((element) => element.type === "article");
    expect(card.props["onClick"]).toBeUndefined();
    expect(card.props["onKeyDown"]).toBeUndefined();
    const preview = find(
      (element) => element.props["className"] === "recent-design-preview",
    );
    const chip = elements(preview.props.children).find(
      (element) => element.type === RecentDesignEditedTime,
    );
    expect(chip?.props).toEqual({ updatedAt: doc.updatedAt, now: null });
    const metadata = find(
      (element) => element.props["className"] === "recent-design-metadata",
    );
    expect(
      elements(metadata.props.children).some(
        (element) =>
          element.type === RecentDesignEditedTime || element.type === "time",
      ),
    ).toBe(false);
  });

  it("offers an overflow Open link to the selected design", () => {
    const doc = { ...createDocument(), id: "selected-recent-design" };
    renderCard(doc);
    const item = find(
      (element) =>
        element.type === DropdownMenuItem && element.props["asChild"] === true,
    );
    expect(item.props.children).toMatchObject({
      type: Link,
      props: {
        to: "/design/$projectId",
        params: { projectId: doc.id },
        "aria-label": `Open ${doc.name}`,
      },
    });
  });

  it("omits invalid last-edited data", () => {
    expect(
      renderCard({ ...createDocument(), updatedAt: "invalid" }),
    ).not.toContain("<time");
  });

  it("shares one guarded duplicate handler between the visible button and menu", async () => {
    const doc = createDocument();
    renderCard(doc);
    const visible = find(
      (element) =>
        element.type === "button" &&
        element.props["className"] ===
          "recent-design-action recent-design-copy",
    );
    const menu = byText("Copy design");
    expect(visible.props["onClick"]).toBe(menu.props["onSelect"]);
    let resolve!: () => void;
    mocks.duplicate.mockImplementationOnce(
      () =>
        new Promise<void>((done) => {
          resolve = done;
        }),
    );
    const pending = callback(visible, "onClick")();
    await callback(menu, "onSelect")();
    expect(mocks.duplicate).toHaveBeenCalledExactlyOnceWith(doc.id);
    resolve();
    await pending;
    expect(mocks.invalidate).toHaveBeenCalledExactlyOnceWith({
      queryKey: ["projects"],
    });
    expect(mocks.success).toHaveBeenCalledWith("Design duplicated");
  });

  it("reports duplication failures and releases the guard for retry", async () => {
    renderCard(createDocument());
    const copy = callback(byText("Copy design"), "onSelect");
    const error = new Error("Storage unavailable");
    mocks.duplicate.mockRejectedValueOnce(error);
    await copy();
    expect(mocks.reportError).toHaveBeenCalledWith(error, "duplicate-project");
    expect(mocks.success).not.toHaveBeenCalled();
    await copy();
    expect(mocks.duplicate).toHaveBeenCalledTimes(2);
    expect(mocks.success).toHaveBeenCalledWith("Design duplicated");
  });

  it("only removes a design after the confirmation action, with pending protection", async () => {
    const doc = createDocument();
    renderCard(doc);
    await callback(byText("Delete"), "onSelect")();
    expect(mocks.remove).not.toHaveBeenCalled();
    const cancel = find((element) => element.props.children === "Keep design");
    expect(cancel.props["onClick"]).toBeUndefined();
    const confirm = find(
      (element) => element.props.children === "Delete design",
    );
    let resolve!: () => void;
    mocks.remove.mockImplementationOnce(
      () =>
        new Promise<void>((done) => {
          resolve = done;
        }),
    );
    const event = { preventDefault: vi.fn() };
    callback(confirm, "onClick")(event);
    callback(confirm, "onClick")(event);
    expect(event.preventDefault).toHaveBeenCalledTimes(2);
    expect(mocks.remove).toHaveBeenCalledExactlyOnceWith(doc.id);
    resolve();
    await vi.waitFor(() =>
      expect(mocks.success).toHaveBeenCalledWith("Design deleted"),
    );
  });

  it("preserves clipboard prompt compilation and external-tool validation", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal("navigator", { clipboard: { writeText } });
    const doc = { ...createDocument(), promptMode: "visual_prompt" as const };
    renderCard(doc);
    const copyText = callback(byText("Copy prompt"), "onSelect");
    mocks.validate.mockReturnValueOnce({ message: "Select a tool" });
    await copyText();
    expect(writeText).not.toHaveBeenCalled();
    expect(mocks.error).toHaveBeenCalledWith(
      "Select a tool",
      expect.any(Object),
    );
    await copyText();
    expect(mocks.compilePrompt).toHaveBeenCalledWith(doc);
    expect(writeText).toHaveBeenCalledWith("Compiled prompt");
    vi.unstubAllGlobals();
  });

  it("preserves hand-edited DESIGN.md clipboard output", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal("navigator", { clipboard: { writeText } });
    renderCard({
      ...createDocument(),
      promptMode: "design_skill",
      designEdit: "My edited DESIGN.md",
    });
    await callback(byText("Copy DESIGN.md"), "onSelect")();
    expect(writeText).toHaveBeenCalledWith("My edited DESIGN.md");
    expect(mocks.compileDesign).not.toHaveBeenCalled();
    vi.unstubAllGlobals();
  });
});

describe("recent design edited chip", () => {
  const updatedAt = "2026-10-01T08:30:00.000Z";
  const editedAt = Date.parse(updatedAt);
  const renderChip = (now: number | null, date = updatedAt) =>
    renderToStaticMarkup(
      createElement(RecentDesignEditedTime, { updatedAt: date, now }),
    );

  it.each([
    [0, "Just now"],
    [59_999, "Just now"],
    [60_000, "1m ago"],
    [15 * 60_000, "15m ago"],
    [3_599_999, "59m ago"],
    [3_600_000, "1h ago"],
    [2 * 3_600_000, "2h ago"],
    [86_399_999, "23h ago"],
    [86_400_000, "1d ago"],
    [23.5 * 86_400_000, "23d ago"],
  ])("uses whole elapsed units after %i milliseconds", (elapsed, label) => {
    expect(renderChip(editedAt + elapsed)).toContain(`>${label}</time>`);
  });

  it("retains the precise accessible timestamp", () => {
    const html = renderChip(editedAt + 3_600_000);
    expect(html).toContain(`dateTime="${updatedAt}"`);
    expect(html).toContain(`title="${updatedAt}"`);
    expect(html).toContain(`aria-label="Last edited ${updatedAt}"`);
  });

  it("omits invalid timestamps and uninitialized clocks", () => {
    expect(renderChip(null)).toBe("");
    expect(renderChip(editedAt, "invalid")).toBe("");
    expect(renderChip(Number.NaN)).toBe("");
  });

  it("clamps future edits to Just now", () => {
    expect(renderChip(editedAt - 86_400_000)).toContain(">Just now</time>");
  });
});
