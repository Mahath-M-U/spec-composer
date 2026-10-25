import {
  createElement,
  isValidElement,
  type ReactElement,
  type ReactNode,
} from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { TooltipProvider } from "@/components/ui/tooltip";
import { DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { RightPanelReopen, TopBarCopyActions } from "./Editor";
import { useEditorStore } from "./store";
import { createDocument } from "./templates";
import { compileCopyText } from "./copy-output";
import { LS_KEYS } from "./storage";
import { RIGHT_REOPEN_ID } from "./use-sidebar-layout";

const mocks = vi.hoisted(() => ({
  error: vi.fn(),
  success: vi.fn(),
  readRaw: vi.fn(),
  writeRaw: vi.fn(),
}));

vi.mock("sonner", () => ({
  toast: { error: mocks.error, success: mocks.success },
}));
vi.mock("@/lib/storage/local", () => ({
  readRaw: mocks.readRaw,
  writeRaw: mocks.writeRaw,
}));

type Props = { children?: ReactNode; [key: string]: unknown };
function inspect(tree: ReactNode) {
  const visit = (node: ReactNode): ReactElement<Props>[] =>
    Array.isArray(node)
      ? node.flatMap(visit)
      : isValidElement<Props>(node)
        ? [node, ...visit(node.props.children)]
        : [];
  const nodes = visit(tree);
  return {
    find: (predicate: (node: ReactElement<Props>) => boolean) => {
      const node = nodes.find(predicate);
      expect(node).toBeDefined();
      return node!;
    },
    nodes,
  };
}
type View = ReturnType<typeof inspect>;
function capture(render: () => ReactElement | null) {
  let view: View;
  function Capture() {
    const tree = render();
    view = inspect(tree);
    return tree;
  }
  const html = renderToStaticMarkup(
    createElement(TooltipProvider, null, createElement(Capture)),
  );
  return { html, ...view! };
}

function setup() {
  const document = createDocument();
  useEditorStore.setState({ doc: document, brandKits: [] });
  return document;
}

beforeEach(() => {
  mocks.error.mockClear();
  mocks.success.mockClear();
  mocks.readRaw.mockReset().mockReturnValue(null);
  mocks.writeRaw.mockReset();
});
afterEach(() => vi.unstubAllGlobals());

describe("TopBarCopyActions", () => {
  it("copies the persisted default from the main button, which sits outside the chevron's menu trigger", async () => {
    const doc = setup();
    const writeText = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal("navigator", { clipboard: { writeText } });
    const { html, find } = capture(TopBarCopyActions);
    expect(html).toContain('aria-label="Copy design"');
    expect(html).toContain('aria-label="More copy options"');
    expect(html).toContain('aria-haspopup="menu"');

    const trigger = find((node) => node.type === DropdownMenuTrigger);
    const triggerNodes = inspect(trigger.props.children).nodes;
    expect(
      triggerNodes.some((node) => node.props["aria-label"] === "Copy design"),
    ).toBe(false);

    const main = find(
      (node) =>
        node.props["aria-label"] === "Copy design" &&
        typeof node.props["onClick"] === "function",
    );
    (main.props as { onClick: () => void }).onClick();
    await vi.waitFor(() =>
      expect(writeText).toHaveBeenCalledExactlyOnceWith(
        compileCopyText(doc, undefined, "design"),
      ),
    );
  });

  it("keeps the label and surfaces the existing error toast when the clipboard write fails", async () => {
    setup();
    const writeText = vi.fn().mockRejectedValueOnce(new Error("denied"));
    vi.stubGlobal("navigator", { clipboard: { writeText } });
    const { find } = capture(TopBarCopyActions);
    const main = find(
      (node) =>
        node.props["aria-label"] === "Copy design" &&
        typeof node.props["onClick"] === "function",
    );
    (main.props as { onClick: () => void }).onClick();
    await vi.waitFor(() =>
      expect(mocks.error).toHaveBeenCalledWith("Couldn't copy design", {
        description: "Allow clipboard access in your browser and try again.",
      }),
    );
    expect(mocks.success).not.toHaveBeenCalled();
  });

  it("lists plain menu items (no radio dot) with an icon, title and description for each copy kind", () => {
    setup();
    const { nodes } = capture(TopBarCopyActions);
    const items = nodes.filter((node) => node.type === DropdownMenuItem);
    expect(items).toHaveLength(2);
    expect(items.every((item) => item.props["value"] === undefined)).toBe(
      true,
    );
    const descriptions = items.map((item) => {
      const texts = inspect(item.props.children).nodes.filter(
        (node) => node.props["className"] === "editor-copy-menu-desc",
      );
      return texts[0]!.props.children;
    });
    expect(descriptions).toEqual([
      "Copy current design specification",
      "Copy optimized generation prompt",
    ]);
  });

  it("copies the prompt payload and persists the chosen default when the Copy prompt item is selected", async () => {
    const doc = setup();
    const writeText = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal("navigator", { clipboard: { writeText } });
    const { nodes } = capture(TopBarCopyActions);
    const promptItem = nodes
      .filter((node) => node.type === DropdownMenuItem)
      .find((node) =>
        inspect(node.props.children).nodes.some(
          (child) => child.props.children === "Copy prompt",
        ),
      )!;
    expect(promptItem).toBeDefined();
    (promptItem.props as { onSelect: () => void }).onSelect();
    await vi.waitFor(() =>
      expect(writeText).toHaveBeenCalledExactlyOnceWith(
        compileCopyText(doc, undefined, "prompt"),
      ),
    );
    expect(mocks.writeRaw).toHaveBeenCalledWith(LS_KEYS.topBarCopyMode, "prompt");
  });
});

describe("RightPanelReopen", () => {
  it("renders the three launcher buttons, with the first carrying the id used for focus restoration", () => {
    const sidebars = {
      overlay: false,
      leftOpen: false,
      rightOpen: false,
      setOpen: vi.fn(),
      toggle: vi.fn(),
      closeDrawers: vi.fn(),
    };
    const openChat = vi.fn();
    const tree = RightPanelReopen({ sidebars, openChat });
    const buttons = inspect(tree).nodes.filter((node) => node.type === "button");
    expect(buttons).toHaveLength(3);
    expect(buttons[0]!.props["id"]).toBe(RIGHT_REOPEN_ID);
    expect(buttons[0]!.props["aria-controls"]).toBe("editor-right-panel");
    expect(buttons.map((button) => button.props.children)).toEqual([
      "Design",
      "Prompt",
      "Chat",
    ]);
  });
});
