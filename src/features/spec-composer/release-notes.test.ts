import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { LATEST_RELEASE, PREVIOUS_RELEASES, RELEASES } from "./release-notes";

const pkg = JSON.parse(
  readFileSync(
    fileURLToPath(new URL("../../../package.json", import.meta.url)),
    "utf8",
  ),
) as { version: string };

describe("release notes", () => {
  it("keeps the latest release in sync with package.json", () => {
    expect(LATEST_RELEASE.version).toBe(pkg.version);
  });

  it("lists the latest release first", () => {
    expect(RELEASES[0]).toBe(LATEST_RELEASE);
  });

  it("gives every entry well-formed items and a valid date", () => {
    for (const release of RELEASES) {
      expect(
        release.features.length + release.improvements.length,
      ).toBeGreaterThan(0);
      for (const item of [...release.features, ...release.improvements]) {
        expect(item.emoji.trim().length).toBeGreaterThan(0);
        expect(item.text.trim().length).toBeGreaterThan(0);
      }
      if (release.notes !== undefined) {
        expect(release.notes.trim().length).toBeGreaterThan(0);
      }
      expect(release.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
  });

  it("has unique versions", () => {
    const versions = RELEASES.map((release) => release.version);
    expect(new Set(versions).size).toBe(versions.length);
  });

  it("gives the latest release at least one feature", () => {
    expect(LATEST_RELEASE.features.length).toBeGreaterThan(0);
  });

  it("excludes the latest release from the previous-releases list", () => {
    expect(PREVIOUS_RELEASES).toEqual(RELEASES.slice(1));
    expect(PREVIOUS_RELEASES).not.toContain(LATEST_RELEASE);
  });
});
