/** The DESIGN.md subset the design compiler writes, parsed into blocks:
 * headings, quotes, lists, tables, code fences and paragraphs. Shared by the
 * markdown renderer (design-md-view.tsx) and the Design Editor's cards
 * (design-editor-cards.tsx), so both read the same structure from the same
 * source text instead of scanning it separately. */

export type MdBlock =
  | { type: "heading"; level: number; text: string }
  | { type: "quote"; text: string }
  | { type: "list"; ordered: boolean; start: number; items: string[] }
  | { type: "table"; head: string[]; rows: string[][] }
  | { type: "code"; text: string }
  | { type: "para"; text: string };

/** A full hex color value on its own, e.g. a table cell after `unquote`. */
export const HEX_RE = /^#[0-9a-f]{3,6}$/i;
export const LIST = /^\s*(?:[-*]|(\d+)\.)\s+(.*)/;
export const BLOCK_START = /^(#{1,6}\s|```|\||>|\s*(?:[-*]|\d+\.)\s)/;
export const unquote = (s: string) => s.replace(/^`|`$/g, "");
export const cells = (row: string) =>
  row
    .trim()
    .replace(/^\||\|$/g, "")
    .split("|")
    .map((c) => c.trim());

export function parseDesignMarkdown(md: string): MdBlock[] {
  const lines = md.split("\n");
  const blocks: MdBlock[] = [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i] ?? "";
    if (!line.trim()) continue;
    if (line.startsWith("```")) {
      const body: string[] = [];
      while (++i < lines.length && !lines[i]?.startsWith("```"))
        body.push(lines[i] ?? "");
      blocks.push({ type: "code", text: body.join("\n") });
      continue;
    }
    const heading = /^(#{1,6})\s+(.*)/.exec(line);
    if (heading) {
      blocks.push({
        type: "heading",
        level: heading[1]?.length ?? 1,
        text: heading[2] ?? "",
      });
      continue;
    }
    if (line.startsWith("|")) {
      const rows: string[][] = [];
      for (; i < lines.length && lines[i]?.startsWith("|"); i++)
        rows.push(cells(lines[i] ?? ""));
      i--;
      const [head = [], ...rest] = rows;
      // The |---|---| row only separates the header in source.
      const body = rest.filter((r) => !r.every((c) => /^:?-+:?$/.test(c)));
      blocks.push({ type: "table", head, rows: body });
      continue;
    }
    if (line.startsWith(">")) {
      const quote: string[] = [];
      for (; i < lines.length && lines[i]?.startsWith(">"); i++)
        quote.push((lines[i] ?? "").replace(/^>\s?/, ""));
      i--;
      blocks.push({ type: "quote", text: quote.join(" ") });
      continue;
    }
    const item = LIST.exec(line);
    if (item) {
      const ordered = item[1] != null;
      const items: string[] = [];
      for (; i < lines.length; i++) {
        const next = LIST.exec(lines[i] ?? "");
        if (!next || (next[1] != null) !== ordered) break;
        items.push(next[2] ?? "");
      }
      i--;
      blocks.push({
        type: "list",
        ordered,
        start: Number(item[1] ?? 1),
        items,
      });
      continue;
    }
    const para = [line];
    while (lines[i + 1]?.trim() && !BLOCK_START.test(lines[i + 1] ?? ""))
      para.push(lines[++i] ?? "");
    blocks.push({ type: "para", text: para.join(" ") });
  }
  return blocks;
}

/** Groups blocks by the level-3 heading they follow, so a section's body
 * (e.g. Typography, Spacing) reads as a list of named sub-sections. Blocks
 * before the first heading come back under a `null` title. */
export function sectionsByH3(
  blocks: MdBlock[],
): { title: string | null; blocks: MdBlock[] }[] {
  const groups: { title: string | null; blocks: MdBlock[] }[] = [];
  for (const b of blocks) {
    if (b.type === "heading" && b.level === 3) {
      groups.push({ title: b.text, blocks: [] });
      continue;
    }
    if (!groups.length) groups.push({ title: null, blocks: [] });
    groups[groups.length - 1]!.blocks.push(b);
  }
  return groups;
}

/** A `**Label:** value` line, as compiled by design-md.ts's bullet fields. */
export function boldField(
  text: string,
): { label: string; value: string } | null {
  const m = /^\*\*(.+?):\*\*\s*(.*)$/.exec(text.trim());
  return m ? { label: m[1] ?? "", value: m[2] ?? "" } : null;
}
