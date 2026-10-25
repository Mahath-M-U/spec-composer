import {
  createElement,
  isValidElement,
  useState,
  type ReactElement,
  type ReactNode,
} from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Hint, TooltipProvider } from "@/components/ui/tooltip";
import { BeforeAfter } from "./before-after";
import { PromptCard } from "./prompt-card";
import { galleryPrompts } from "./catalog";

const mocks = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn() }));
vi.mock("sonner", () => ({ toast: mocks }));
vi.mock("./before-after", () => ({
  BeforeAfter: () => createElement("span", { "data-before-after": true }),
}));
const prompt = galleryPrompts[0]!;
type Props = { children?: ReactNode; [key: string]: unknown };
function inspect(tree: ReactNode) {
  const visit = (node: ReactNode): ReactElement<Props>[] =>
    Array.isArray(node)
      ? node.flatMap(visit)
      : isValidElement<Props>(node)
        ? [node, ...visit(node.props["children"])]
        : [];
  const nodes = visit(tree);
  return {
    nodes,
    find: (predicate: (node: ReactElement<Props>) => boolean) => {
      const node = nodes.find(predicate);
      expect(node).toBeDefined();
      return node!;
    },
  };
}
type View = ReturnType<typeof inspect>;
const call = (node: ReactElement<Props>, handler: string, ...args: unknown[]) =>
  (node.props[handler] as (...values: unknown[]) => unknown)(...args);
function capture(actions: Array<(view: View) => void> = []) {
  let view: View;
  function Capture() {
    const [step, setStep] = useState(0);
    const tree = PromptCard({ prompt });
    view = inspect(tree);
    if (step < actions.length) {
      actions[step]!(view);
      setStep(step + 1);
    }
    return tree;
  }
  const html = renderToStaticMarkup(
    createElement(TooltipProvider, null, createElement(Capture)),
  );
  return { html, ...view! };
}
const copyButton = (view: View) =>
  view.find((node) => node.props["className"] === "prompt-gallery-card-copy");
const click = () => ({ stopPropagation: vi.fn() });
beforeEach(() => {
  vi.clearAllMocks();
  vi.useFakeTimers();
});
afterEach(() => {
  vi.clearAllTimers();
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe("prompt card", () => {
  it("keeps a compact title/category footer with an accessible icon copy action", () => {
    const view = capture();
    const article = view.find((node) => node.type === "article");
    const title = view.find((node) => node.type === "h2");
    expect(article.props["aria-labelledby"]).toBe(title.props["id"]);
    expect(view.html).toContain(
      'class="preview-card prompt-gallery-card card-hover-scale"',
    );
    expect(view.html).toContain(prompt.title);
    expect(view.html).toContain(prompt.category);
    expect(view.html).not.toContain(prompt.summary);
    expect(view.html).not.toContain("preview-card-primary");
    expect(copyButton(view).props["aria-label"]).toBe(
      `Copy prompt: ${prompt.title}`,
    );
    const tooltip = view.find(
      (node) => node.type === Hint && node.props["label"] === "Copy prompt",
    );
    expect(inspect(tooltip.props["children"]).nodes).toContain(
      copyButton(view),
    );
    expect(
      inspect(copyButton(view).props["children"]).nodes.some(
        (node) => node.props["className"] === "sr-only",
      ),
    ).toBe(true);
  });

  it("places an isolated Radix expansion trigger in the image preview", () => {
    const view = capture();
    const media = view.find(
      (node) => node.props["className"] === "prompt-gallery-card-media",
    );
    const trigger = inspect(media.props["children"]).find(
      (node) => node.type === DialogTrigger,
    );
    expect(trigger.props["asChild"]).toBe(true);
    const button = inspect(trigger.props["children"]).find(
      (node) => node.type === "button",
    );
    expect(button.props["aria-label"]).toBe(
      `View full prompt: ${prompt.title}`,
    );
    const event = click();
    call(button, "onClick", event);
    expect(event.stopPropagation).toHaveBeenCalledOnce();
    expect(view.html).toContain('aria-haspopup="dialog"');
  });

  it("opens details with comparison, description, full prompt and tool note", () => {
    const view = capture([
      (step) =>
        call(
          step.find((node) => node.type === Dialog),
          "onOpenChange",
          true,
        ),
    ]);
    expect(view.find((node) => node.type === Dialog).props["open"]).toBe(true);
    const content = view.find((node) => node.type === DialogContent);
    const details = inspect(content.props["children"]);
    expect(
      details.nodes.some(
        (node) => node.type === BeforeAfter && node.props["prompt"] === prompt,
      ),
    ).toBe(true);
    const html = renderToStaticMarkup(
      createElement(
        TooltipProvider,
        null,
        createElement(Dialog, null, content.props["children"]),
      ),
    );
    expect(html).toContain(prompt.summary);
    expect(html).toContain(prompt.refinedPrompt.replaceAll("'", "&#x27;"));
    expect(html).toContain(prompt.exampleTool);
    expect(html).toContain("Close");
    expect(html).toContain("Copy prompt");
    const section = details.find((node) => node.type === "section");
    expect(section.props["aria-labelledby"]).toBe(
      details.find((node) => node.type === "h3").props["id"],
    );
  });

  it("copies the full prompt, isolates the click, disables pending copies and shows success feedback", async () => {
    let resolve!: () => void;
    const writeText = vi.fn(
      () =>
        new Promise<void>((done) => {
          resolve = done;
        }),
    );
    vi.stubGlobal("navigator", { clipboard: { writeText } });
    const event = click();
    let pending: unknown;
    const view = capture([
      (step) => {
        pending = call(copyButton(step), "onClick", event);
      },
    ]);
    expect(copyButton(view).props["disabled"]).toBe(true);
    expect(copyButton(view).props["aria-label"]).toBe(
      `Copying prompt: ${prompt.title}`,
    );
    await call(copyButton(view), "onClick", click());
    expect(writeText).toHaveBeenCalledExactlyOnceWith(prompt.refinedPrompt);
    expect(event.stopPropagation).toHaveBeenCalledOnce();
    resolve();
    await pending;
    expect(mocks.success).toHaveBeenCalledExactlyOnceWith("Prompt copied");
    expect(mocks.error).not.toHaveBeenCalled();
    expect(vi.getTimerCount()).toBe(1);
  });

  it("shows the manual-copy fallback when clipboard access fails", async () => {
    vi.stubGlobal("navigator", {
      clipboard: { writeText: vi.fn().mockRejectedValue(new Error("denied")) },
    });
    await call(copyButton(capture()), "onClick", click());
    expect(mocks.error).toHaveBeenCalledExactlyOnceWith(
      "Couldn't copy prompt",
      { description: "Open the full prompt to select and copy it manually." },
    );
    expect(mocks.success).not.toHaveBeenCalled();
    expect(vi.getTimerCount()).toBe(0);
  });
});
