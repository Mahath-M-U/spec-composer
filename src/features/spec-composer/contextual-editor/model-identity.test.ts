import { describe, expect, it } from "vitest";
import { assetPresetPatch } from "../asset-presets";
import { createElement } from "../registry";
import { createDocument } from "../templates";
import { isEditableModel } from "./model-preview";

const format = createDocument().format;
const person = () => ({
  ...createElement("humanModelImage", format, 0),
  catalogElementId: "subjects.person",
});

describe("editable model identity", () => {
  it("recognizes an explicit person catalog entry", () => {
    expect(isEditableModel(person())).toBe(true);
  });

  it("recognizes a legacy human model without a catalog entry", () => {
    expect(isEditableModel(createElement("humanModelImage", format, 0))).toBe(
      true,
    );
  });

  it("keeps a generic subject rectangle as a shape", () => {
    expect(
      isEditableModel({
        ...createElement("shape", format, 0),
        semanticRole: "subject",
      }),
    ).toBe(false);
  });

  it("keeps model scene-starter artwork as a shape", () => {
    expect(
      isEditableModel({
        ...createElement("shape", format, 0),
        ...assetPresetPatch("model"),
      }),
    ).toBe(false);
  });

  it("honors an explicit nonperson catalog entry over the legacy kind", () => {
    expect(
      isEditableModel({ ...person(), catalogElementId: "products.bottle" }),
    ).toBe(false);
  });

  it.each([
    "data:image/png;base64,uploaded_image",
    "data:image/svg+xml;base64,uploaded_image",
  ])("keeps an uploaded source outside the editable model: %s", (src) => {
    expect(isEditableModel({ ...person(), src })).toBe(false);
  });
});
