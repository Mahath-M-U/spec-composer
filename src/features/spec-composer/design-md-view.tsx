import { Fragment, type ReactNode } from "react";

/** A small renderer for the DESIGN.md subset the design compiler writes:
 * headings, quotes, lists, tables, code fences, `code` and **bold**. Hex
 * codes get a swatch, the color table becomes a palette and the type scale
 * becomes a specimen, so the panel reads as a style guide, not source. */

type Block =
  | { type: "heading"; level: number; text: string }
  | { type: "quote"; text: string }
  | { type: "list"; ordered: boolean; start: number; items: string[] }
  | { type: "table"; head: string[]; rows: string[][] }
  | { type: "code"; text: string }
  | { type: "para"; text: string };

const HEX = /(#(?:[0-9a-fA-F]{6}|[0-9a-fA-F]{3})\b)/;
const LIST = /^\s*(?:[-*]|(\d+)\.)\s+(.*)/;
const BLOCK_START = /^(#{1,6}\s|```|\||>|\s*(?:[-*]|\d+\.)\s)/;
const unquote = (s: string) => s.replace(/^`|`$/g, "");
const cells = (row: string) =>
  row
    .trim()
    .replace(/^\||\|$/g, "")
    .split("|")
    .map((c) => c.trim());

function parse(md: string): Block[] {
  const lines = md.split("\n");
  const blocks: Block[] = [];
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

const swatch = (hex: string, key: number) => (
  <span key={key} className="md-color">
    <span
      className="md-swatch"
      style={{ background: hex }}
      aria-hidden="true"
    />
    {hex}
  </span>
);

/** Hex codes get a swatch in front, so colors read at a glance. */
function withSwatches(text: string): ReactNode[] {
  return text.split(HEX).map((part, i) => (i % 2 ? swatch(part, i) : part));
}

const PROSE_TOKEN =
  /(#(?:[0-9a-fA-F]{6}|[0-9a-fA-F]{3})\b|\d+(?:\.\d+)? × \d+(?:\.\d+)?|\b\d+:\d+\b|\d+(?:\.\d+)?(?:px|°|%))/;

/** Prompt prose: hex codes get a swatch and measurements a chip, so the
 * numbers stand out from the sentence around them. */
export function ProseText({ text }: { text: string }) {
  return (
    <>
      {text.split(PROSE_TOKEN).map((part, i) =>
        i % 2 === 0 ? (
          part
        ) : part.startsWith("#") ? (
          swatch(part, i)
        ) : (
          <span key={i} className="md-measure">
            {part}
          </span>
        ),
      )}
    </>
  );
}

/** A hand-edited prompt: its blank-line paragraphs, as prose. */
export function PromptProse({ text }: { text: string }) {
  return (
    <div className="md">
      {text
        .split(/\n{2,}/)
        .filter((p) => p.trim())
        .map((p, i) => (
          <p key={i} className="md-prose">
            <ProseText text={p} />
          </p>
        ))}
    </div>
  );
}

function Inline({ text }: { text: string }) {
  return (
    <>
      {text
        .split(/(`[^`]+`|\*\*[^*]+\*\*)/)
        .map((part, i) =>
          i % 2 === 0 ? (
            <Fragment key={i}>{withSwatches(part)}</Fragment>
          ) : part.startsWith("`") ? (
            <code key={i}>{withSwatches(part.slice(1, -1))}</code>
          ) : (
            <strong key={i}>{withSwatches(part.slice(2, -2))}</strong>
          ),
        )}
    </>
  );
}

function Palette({ head, rows }: { head: string[]; rows: string[][] }) {
  const col = (name: string) => head.indexOf(name);
  // Colors describe a role; surfaces describe a purpose.
  const note = col("Role") >= 0 ? col("Role") : col("Purpose");
  return (
    <div className="md-palette">
      {rows.map((r, i) => {
        const hex = unquote(r[col("Value")] ?? "");
        return (
          <div key={i} className="md-palette-card">
            <span className="md-palette-chip" style={{ background: hex }} />
            <span className="md-palette-meta">
              <b>{r[col("Name")]}</b>
              <code>{hex}</code>
              {note >= 0 && <small>{r[note]}</small>}
            </span>
          </div>
        );
      })}
    </div>
  );
}

function TypeSpecimen({ head, rows }: { head: string[]; rows: string[][] }) {
  const col = (name: string) => head.indexOf(name);
  return (
    <div className="md-type">
      {[...rows].reverse().map((r, i) => {
        const size = parseFloat(r[col("Size")] ?? "") || 16;
        const family = r[col("Family")] ?? "";
        const weight = Number(r[col("Weight")]) || 400;
        return (
          <div key={i} className="md-type-row">
            <span
              className="md-type-sample"
              style={{
                fontFamily: `"${family}", ui-sans-serif, system-ui, sans-serif`,
                fontWeight: weight,
                fontSize: Math.min(38, Math.max(13, size * 0.45)),
              }}
            >
              Aa
            </span>
            <span>
              <b>{r[col("Role")]}</b>
              <small>
                {family} · {size}px · {weight}
                {r[col("Line Height")] ? ` · ${r[col("Line Height")]}` : ""}
              </small>
            </span>
          </div>
        );
      })}
    </div>
  );
}

function SpacingScale({ rows }: { rows: string[][] }) {
  const values = rows.map((r) => parseFloat(r[1] ?? "") || 0);
  const max = Math.max(...values, 1);
  return (
    <div className="md-scale">
      {rows.map((r, i) => (
        <div key={i} className="md-scale-row">
          <span className="md-scale-label">{r[1]}</span>
          <span
            className="md-scale-bar"
            style={{ width: `${Math.max(4, ((values[i] ?? 0) / max) * 100)}%` }}
          />
        </div>
      ))}
    </div>
  );
}

function RadiusPreview({ rows }: { rows: string[][] }) {
  return (
    <div className="md-radii">
      {rows.map((r, i) => (
        <div key={i} className="md-radius">
          <span
            className="md-radius-box"
            style={{ borderTopLeftRadius: parseFloat(r[1] ?? "") || 0 }}
          />
          <b>{r[1]}</b>
          <small>{r[0]}</small>
        </div>
      ))}
    </div>
  );
}

const column = (head: string[], rows: string[][], name: string) =>
  rows.map((r) => unquote(r[head.indexOf(name)] ?? ""));

function Table({ head, rows }: { head: string[]; rows: string[][] }) {
  const values = head.includes("Value") ? column(head, rows, "Value") : [];
  if (values.length && values.every((v) => /^#[0-9a-f]{3,6}$/i.test(v)))
    return <Palette head={head} rows={rows} />;
  if (values.length && values.every((v) => /^\d+px$/.test(v)))
    return head[0] === "Element" ? (
      <RadiusPreview rows={rows} />
    ) : (
      <SpacingScale rows={rows} />
    );
  if (head.includes("Family") && head.includes("Size"))
    return <TypeSpecimen head={head} rows={rows} />;
  return (
    <div className="md-table-wrap">
      <table className="md-table">
        <thead>
          <tr>
            {head.map((h, i) => (
              <th key={i}>
                <Inline text={h} />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i}>
              {r.map((c, j) => (
                <td key={j}>
                  <Inline text={c} />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function DesignMarkdown({ text }: { text: string }) {
  return (
    <div className="md">
      {parse(text).map((b, i) => {
        switch (b.type) {
          case "heading": {
            const Tag = b.level === 1 ? "h3" : b.level === 2 ? "h4" : "h5";
            return (
              <Tag key={i} className={`md-h${Math.min(b.level, 3)}`}>
                <Inline text={b.text} />
              </Tag>
            );
          }
          case "quote":
            return (
              <blockquote key={i} className="md-quote">
                <Inline text={b.text} />
              </blockquote>
            );
          case "list": {
            const Tag = b.ordered ? "ol" : "ul";
            return (
              <Tag key={i} className="md-list" start={b.start}>
                {b.items.map((item, j) => (
                  <li key={j}>
                    <Inline text={item} />
                  </li>
                ))}
              </Tag>
            );
          }
          case "table":
            return <Table key={i} head={b.head} rows={b.rows} />;
          case "code":
            return (
              <pre key={i} className="md-code">
                <code>
                  {b.text.split("\n").map((l, j) => (
                    <Fragment key={j}>
                      {withSwatches(l)}
                      {"\n"}
                    </Fragment>
                  ))}
                </code>
              </pre>
            );
          default:
            return (
              <p key={i}>
                <Inline text={b.text} />
              </p>
            );
        }
      })}
    </div>
  );
}
