import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import { describe, expect, it } from "vitest";
import {
  DEFAULT_PRIMARY_COLOR,
  PRIMARY_COLORS,
  PRIMARY_COLOR_STORAGE_KEY,
  isPrimaryColor,
} from "./primary-color";

const startupScript = readFileSync(
  new URL("../../public/theme-init.js", import.meta.url),
  "utf8",
);

function initialize(
  stored: Record<string, string> = {},
  {
    blockedKey,
    darkSystem = false,
  }: {
    blockedKey?: string;
    darkSystem?: boolean;
  } = {},
) {
  const attributes = new Map<string, string>();
  const classes = new Set<string>();
  runInNewContext(startupScript, {
    localStorage: {
      getItem(key: string) {
        if (blockedKey === "*" || blockedKey === key)
          throw new Error("Storage blocked");
        return stored[key] ?? null;
      },
    },
    matchMedia: () => ({ matches: darkSystem }),
    document: {
      documentElement: {
        setAttribute: (name: string, value: string) =>
          attributes.set(name, value),
        classList: {
          toggle: (name: string, enabled: boolean) => {
            if (enabled) classes.add(name);
            else classes.delete(name);
          },
        },
      },
    },
  });
  return {
    color: attributes.get("data-primary-color"),
    dark: classes.has("dark"),
  };
}

describe("primary color preferences", () => {
  it.each(PRIMARY_COLORS)("accepts $id", ({ id }) => {
    expect(isPrimaryColor(id)).toBe(true);
  });

  it.each([null, undefined, "", "Blue", "pink", "#638ed6", 1, {}])(
    "rejects an invalid preference: %j",
    (value) => {
      expect(isPrimaryColor(value)).toBe(false);
    },
  );
});

describe("theme startup", () => {
  it.each(PRIMARY_COLORS)("restores $id before mount", ({ id }) => {
    expect(initialize({ [PRIMARY_COLOR_STORAGE_KEY]: id }).color).toBe(id);
  });

  it("keeps the startup whitelist aligned with the settings presets", () => {
    const whitelist = startupScript.match(
      /(\[[^\]]+\])\.includes\(storedColor\)/,
    );
    expect(whitelist).not.toBeNull();
    expect(JSON.parse(whitelist![1]!)).toEqual(
      PRIMARY_COLORS.map(({ id }) => id),
    );
  });

  it.each([undefined, "", "pink", "BLUE", "#638ed6"])(
    "defaults to red for absent or invalid storage: %s",
    (value) => {
      const stored =
        value === undefined ? {} : { [PRIMARY_COLOR_STORAGE_KEY]: value };
      expect(initialize(stored).color).toBe(DEFAULT_PRIMARY_COLOR);
    },
  );

  it("defaults to red when storage is blocked", () => {
    expect(initialize({}, { blockedKey: "*" })).toEqual({
      color: "red",
      dark: false,
    });
  });

  it("restores the primary color even when reading the theme fails", () => {
    expect(
      initialize(
        { [PRIMARY_COLOR_STORAGE_KEY]: "blue" },
        { blockedKey: "spec-composer-theme" },
      ),
    ).toEqual({ color: "blue", dark: false });
  });

  it("preserves dark mode when reading the primary color fails", () => {
    expect(
      initialize(
        { "spec-composer-theme": "dark" },
        { blockedKey: PRIMARY_COLOR_STORAGE_KEY },
      ),
    ).toEqual({ color: "red", dark: true });
  });

  it.each(["light", "dark"])(
    "keeps saved %s mode independent of the color",
    (theme) => {
      expect(
        initialize({
          "spec-composer-theme": theme,
          [PRIMARY_COLOR_STORAGE_KEY]: "violet",
        }),
      ).toEqual({ color: "violet", dark: theme === "dark" });
    },
  );

  it("preserves system dark mode alongside the color preference", () => {
    expect(
      initialize(
        { [PRIMARY_COLOR_STORAGE_KEY]: "green" },
        { darkSystem: true },
      ),
    ).toEqual({ color: "green", dark: true });
  });
});
