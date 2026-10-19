export const PRIMARY_COLORS = [
  { id: "red", label: "Red" },
  { id: "amber", label: "Amber" },
  { id: "green", label: "Green" },
  { id: "blue", label: "Blue" },
  { id: "violet", label: "Violet" },
] as const;

export type PrimaryColor = (typeof PRIMARY_COLORS)[number]["id"];

export const DEFAULT_PRIMARY_COLOR: PrimaryColor = "red";
export const PRIMARY_COLOR_STORAGE_KEY = "spec-composer-primary-color";

export function isPrimaryColor(value: unknown): value is PrimaryColor {
  return PRIMARY_COLORS.some((color) => color.id === value);
}
