import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { LATEST_RELEASE, RELEASES } from "./release-notes";

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

  it("gives every entry a non-empty set of highlights and a valid date", () => {
    for (const release of RELEASES) {
      expect(release.highlights.length).toBeGreaterThan(0);
      for (const highlight of release.highlights) {
        expect(highlight.length).toBeGreaterThan(0);
      }
      expect(release.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
  });

  it("has unique versions", () => {
    const versions = RELEASES.map((release) => release.version);
    expect(new Set(versions).size).toBe(versions.length);
  });
});
