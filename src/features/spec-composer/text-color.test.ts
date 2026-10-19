import { describe, expect, it } from "vitest";
import { opaqueColor } from "./text-color";
import {
  applyTextColorIntent,
  hsvToRgb,
  parseColor,
  planePosition,
  rgbToHsv,
  serializeColor,
  textColorPresets,
  textColorState,
} from "./text-color";

describe("text color model", () => {
  it("accepts only opaque supported colors and always emits six HEX digits", () => {
    expect(opaqueColor("#ABC")).toBe("#aabbcc");
    expect(opaqueColor("#aabbccff")).toBe("#aabbcc");
    expect(opaqueColor("rgb(12 34 56)")).toBe("#0c2238");
    for (const value of ["#abc8", "#12345680", "rgba(1,2,3,.5)", "transparent", "var(--brand)"]) expect(opaqueColor(value)).toBeUndefined();
  });
  it.each([
    ["#abc", "#aabbcc"],
    ["#abc8", "#aabbcc88"],
    ["#ABCDEF", "#abcdef"],
    ["#11223380", "#11223380"],
    ["rgb(255, 0, 128)", "#ff0080"],
    ["rgba(10, 20, 30, 0.5)", "#0a141e80"],
    ["rgb(100% 0% 0% / 50%)", "#ff000080"],
    ["transparent", "#00000000"],
  ])("parses %s without losing alpha", (value, expected) => {
    expect(serializeColor(parseColor(value)!)).toBe(expected);
  });
  it.each([
    "rgb(1,,2,3)",
    "rgb(1/2/3)",
    "rgb(1 2,3)",
    "rgb(1 2 3 /)",
    "#12",
    "hsl(10 20% 30%)",
    "var(--brand)",
    "linear-gradient(red, blue)",
  ])("preserves unsupported or invalid imported CSS %s", (value) => {
    expect(parseColor(value)).toBeUndefined();
    expect(
      applyTextColorIntent(value, "background", { type: "alpha", alpha: 0.5 }),
    ).toBe(value);
    expect(
      applyTextColorIntent(value, "color", { type: "color", value: "invalid" }),
    ).toBe(value);
  });
  it("normalizes equivalent spellings and distinguishes None, Mixed, and unsupported values", () => {
    expect(textColorState(["#fff", "rgb(255 255 255)"], "color")).toMatchObject(
      { kind: "solid", css: "#ffffff" },
    );
    expect(
      textColorState([undefined, "transparent", "#12345600"], "background"),
    ).toEqual({ kind: "none" });
    expect(textColorState([undefined, "#18181B"], "color")).toMatchObject({
      kind: "solid",
      css: "#18181b",
    });
    expect(textColorState(["#ffffff80", "#ffffff"], "color")).toEqual({
      kind: "mixed",
    });
    expect(textColorState(["var(--ink)"], "color")).toEqual({
      kind: "unsupported",
      css: "var(--ink)",
    });
  });
  it("preserves each member alpha for RGB edits, and each member RGB for alpha edits", () => {
    const rgb = { type: "rgb" as const, color: { r: 20, g: 40, b: 60 } };
    expect(
      ["#ff000080", "#00ff0040"].map((value) =>
        applyTextColorIntent(value, "color", rgb),
      ),
    ).toEqual(["#14283c80", "#14283c40"]);
    expect(
      ["#ff000080", "#00ff0040"].map((value) =>
        applyTextColorIntent(value, "color", { type: "alpha", alpha: 0.25 }),
      ),
    ).toEqual(["#ff000040", "#00ff0040"]);
    expect(applyTextColorIntent("#abcdef00", "background", rgb)).toBe(
      "#14283c00",
    );
    expect(applyTextColorIntent(undefined, "background", rgb)).toBe(
      "#14283c00",
    );
    expect(applyTextColorIntent("var(--ink)", "color", rgb)).toBe("#14283c");
  });
  it("replaces complete colors, removes only backgrounds and skips semantic no-ops", () => {
    expect(
      applyTextColorIntent("#fff8", "color", {
        type: "color",
        value: "#112233",
      }),
    ).toBe("#112233");
    expect(
      applyTextColorIntent("#fff", "color", {
        type: "rgb",
        color: { r: 255, g: 255, b: 255 },
      }),
    ).toBe("#fff");
    expect(
      applyTextColorIntent(undefined, "color", {
        type: "color",
        value: "#18181b",
      }),
    ).toBeUndefined();
    expect(
      applyTextColorIntent("transparent", "background", { type: "remove" }),
    ).toBeUndefined();
    expect(applyTextColorIntent("#fff", "color", { type: "remove" })).toBe(
      "#fff",
    );
    expect(
      applyTextColorIntent("#fff", "color", { type: "alpha", alpha: NaN }),
    ).toBe("#fff");
  });
  it("converts hue and grayscale with bounded byte-rounding error", () => {
    for (const color of [
      { r: 255, g: 0, b: 0 },
      { r: 12, g: 100, b: 220 },
      { r: 80, g: 80, b: 80 },
      { r: 0, g: 0, b: 0 },
    ]) {
      expect(hsvToRgb(rgbToHsv(color))).toEqual(color);
    }
    expect(hsvToRgb({ h: 360, s: 1, v: 1 })).toEqual({ r: 255, g: 0, b: 0 });
    expect(hsvToRgb({ h: -120, s: 1, v: 1 })).toEqual({ r: 0, g: 0, b: 255 });
  });
  it("clamps plane coordinates and deduplicates solid presets", () => {
    expect(
      planePosition(-50, 200, { left: 10, top: 20, width: 100, height: 100 }),
    ).toEqual({ s: 0, v: 0 });
    expect(
      planePosition(200, -50, { left: 10, top: 20, width: 100, height: 100 }),
    ).toEqual({ s: 1, v: 1 });
    expect(
      textColorPresets([
        "#fff",
        "#FFFFFF",
        "#12345680",
        "gradient(red, blue)",
        "#c55454",
      ]),
    ).toEqual(["#ffffff", "#c55454"]);
  });
});
