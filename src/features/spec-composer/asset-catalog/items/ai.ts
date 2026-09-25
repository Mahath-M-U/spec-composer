import type { AssetItem } from "../types.ts";

/** AI-agent and AI-feature presets: chat surfaces, an agent glyph, node
 * graphs and small UI chrome, plus two text-based AI chips. */
export const aiItems: AssetItem[] = [
  {
    id: "ai-chat-window",
    label: "Chat window",
    category: "ai",
    kind: "supportingImage",
    tags: ["ai", "chat", "assistant", "window", "conversation"],
    prompt:
      "AI chat assistant window mockup with a rounded panel, a small sparkle mark beside the title, alternating message bubbles and a rounded input bar at the bottom, clean flat interface, primary brand color for outgoing bubbles",
    art: "ai-chat-window",
    size: { w: 0.6, aspect: 320 / 300 },
    popularRank: 5,
  },
  {
    id: "ai-robot",
    label: "Robot",
    category: "ai",
    kind: "supportingImage",
    tags: ["ai", "robot", "bot", "assistant", "character"],
    prompt:
      "Friendly AI robot glyph with a rounded head, two round eyes, a small antenna and a square torso panel, flat vector illustration style, primary and secondary brand color accents on the eyes and chest panel",
    art: "ai-robot",
    size: { w: 0.4, aspect: 240 / 300 },
  },
  {
    id: "ai-sparkle",
    label: "Sparkle burst",
    category: "ai",
    kind: "supportingImage",
    tags: ["ai", "sparkle", "magic", "generate", "glyph"],
    prompt:
      "Cluster of four-point sparkle glyphs of varying sizes radiating from a central burst, flat vector illustration style, primary brand color for the largest sparkle and neutral ink for the smaller ones",
    art: "ai-sparkle",
    size: { w: 0.35, aspect: 1 },
  },
  {
    id: "ai-prompt-bar",
    label: "Prompt bar",
    category: "ai",
    kind: "supportingImage",
    tags: ["ai", "prompt", "input", "search", "bar"],
    prompt:
      "AI prompt input bar mockup with a small sparkle glyph on the left, a placeholder text line in the middle and a round submit button on the right, clean flat interface, primary brand color submit button",
    art: "ai-prompt-bar",
    size: { w: 0.6, aspect: 320 / 120 },
  },
  {
    id: "ai-copilot",
    label: "Assistant sidebar",
    category: "ai",
    kind: "supportingImage",
    tags: ["ai", "assistant", "sidebar", "panel", "helper"],
    prompt:
      "Docked assistant sidebar mockup beside a muted content area, small sparkle mark near the top, two light message lines and a rounded action button near the bottom, clean flat interface, primary brand color action button",
    art: "ai-copilot",
    size: { w: 0.6, aspect: 320 / 300 },
  },
  {
    id: "ai-agent-workflow",
    label: "Agent workflow",
    category: "ai",
    kind: "supportingImage",
    tags: ["ai", "agent", "workflow", "automation", "diagram"],
    prompt:
      "Flat vector diagram of an AI agent workflow, rounded node cards joined by smooth curved connectors flowing left to right, a central agent node marked with a four-point sparkle, tool and data nodes branching off, calm spacious layout with subtle shadows, nodes outlined in the secondary brand color and the active path in the primary brand color",
    art: "ai-node-graph",
    size: { w: 0.62, aspect: 340 / 220 },
  },
  {
    id: "ai-voice-wave",
    label: "Voice wave",
    category: "ai",
    kind: "supportingImage",
    tags: ["ai", "voice", "audio", "waveform", "assistant"],
    prompt:
      "AI voice waveform mockup with eight vertical bars of alternating height representing sound amplitude, flat vector illustration style, alternating primary and secondary brand color bars",
    art: "ai-voice-wave",
    size: { w: 0.6, aspect: 320 / 160 },
  },
  {
    id: "ai-chat-bubbles",
    label: "Chat bubbles",
    category: "ai",
    kind: "supportingImage",
    tags: ["ai", "chat", "bubbles", "conversation", "assistant"],
    prompt:
      "Overlapping AI chat bubble shapes of two sizes with a small sparkle mark near the larger bubble, flat vector illustration style, primary brand color for the front bubble and neutral tint for the back one",
    art: "ai-chat-bubbles",
    size: { w: 0.5, aspect: 300 / 220 },
  },
  {
    id: "ai-chip",
    label: "AI chip",
    category: "ai",
    kind: "supportingImage",
    tags: ["ai", "chip", "processor", "hardware", "compute"],
    prompt:
      "AI processor chip glyph with a square core, a small sparkle mark at the center and short connector pins on all four sides, flat vector illustration style, primary brand color core with neutral ink pins",
    art: "ai-chip",
    size: { w: 0.4, aspect: 1 },
  },
  {
    id: "ai-image-grid",
    label: "Image grid",
    category: "ai",
    kind: "supportingImage",
    tags: ["ai", "image", "grid", "generate", "gallery"],
    prompt:
      "AI-generated image grid mockup with nine small tinted tiles and a small sparkle badge in the top corner, flat vector illustration style, alternating primary and secondary brand color tiles",
    art: "ai-image-grid",
    size: { w: 0.5, aspect: 1 },
  },
  {
    id: "ai-task-list",
    label: "Task list",
    category: "ai",
    kind: "supportingImage",
    tags: ["ai", "task", "checklist", "agent", "list"],
    prompt:
      "AI task checklist mockup with four rows, two already checked off with a small round checkmark and two still pending, flat vector illustration style, primary brand color checkmarks",
    art: "ai-task-list",
    size: { w: 0.55, aspect: 300 / 260 },
  },
  {
    id: "ai-agents-network",
    label: "Agents network",
    category: "ai",
    kind: "supportingImage",
    tags: ["ai", "agents", "network", "nodes", "automation"],
    prompt:
      "Network of small AI agent nodes connected by dashed lines around a larger central sparkle-marked hub, flat vector illustration style, primary brand color hub with neutral tint satellite nodes",
    art: "ai-agents-network",
    size: { w: 0.6, aspect: 320 / 260 },
  },
  {
    id: "ai-powered-badge",
    label: "Powered by AI",
    category: "ai",
    kind: "badge",
    tags: ["ai", "badge", "powered", "chip", "label"],
    prompt:
      "Small pill badge with a four-point sparkle glyph before the label, medium-weight sans-serif in sentence case, soft gradient from the primary to the secondary brand color, crisp and legible at small sizes",
    content: "✦ Powered by AI",
    style: {
      fontFamily: "Inter",
      fontSize: 20,
      fontWeight: 600,
      background: "linear-gradient(120deg,$primary,$secondary)",
      color: "#FFFFFF",
      borderRadius: 999,
    },
    popularRank: 9,
  },
  {
    id: "ai-ask-cta",
    label: "Ask AI",
    category: "ai",
    kind: "cta",
    tags: ["ai", "cta", "ask", "assistant", "button"],
    prompt:
      "Ask-AI call-to-action chip with a small four-point sparkle glyph before the label, medium-weight Inter in sentence case, sits inside a fully rounded capsule, primary brand color fill with light high-contrast type, inviting and legible",
    content: "✦ Ask AI",
    style: {
      fontFamily: "Inter",
      fontSize: 26,
      fontWeight: 600,
      background: "$primary",
      color: "#FFFFFF",
      borderRadius: 999,
    },
  },
];
