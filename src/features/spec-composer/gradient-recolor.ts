/** Splits a CSS argument list on top-level commas (ignores commas inside parentheses). */
function splitTopLevel(args: string) {
  const parts: string[] = [];
  let depth = 0;
  let start = 0;
  for (let i = 0; i < args.length; i++) {
    const ch = args[i];
    if (ch === "(") depth++;
    else if (ch === ")") depth--;
    else if (ch === "," && depth === 0) {
      parts.push(args.slice(start, i).trim());
      start = i + 1;
    }
  }
  parts.push(args.slice(start).trim());
  return parts;
}

const TRANSPARENT_STOP =
  /^(transparent|(?:rgba|hsla)\([^)]*,\s*0(?:\.0+)?\s*\))/i;

/**
 * Recolours the opaque stops of a linear-gradient that fades to or from
 * transparent (a scrim) and keeps its structure. Returns undefined when the
 * value is not such a gradient, so the caller falls back to a solid fill.
 */
export function recolorScrimGradient(
  background: string | undefined,
  hex: string,
) {
  const match = background?.trim().match(/^linear-gradient\((.*)\)$/is);
  if (!match) return undefined;
  const parts = splitTopLevel(match[1] ?? "");
  const stops = /^(to\s|-?[\d.]+(deg|turn|rad|grad))/i.test(parts[0] ?? "")
    ? parts.slice(1)
    : parts;
  if (!stops.some((stop) => TRANSPARENT_STOP.test(stop))) return undefined;
  const recolored = parts.map((part) => {
    if (!stops.includes(part) || TRANSPARENT_STOP.test(part)) return part;
    // Replace the colour token (hex, function or keyword), keep any position.
    const colour = part.match(/^(#[0-9a-f]{3,8}|[a-z-]+\([^)]*\)|[a-z]+)/i);
    return colour ? `${hex}${part.slice(colour[0].length)}` : part;
  });
  return `linear-gradient(${recolored.join(", ")})`;
}
