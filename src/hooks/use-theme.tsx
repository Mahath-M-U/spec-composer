import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import {
  DEFAULT_PRIMARY_COLOR,
  PRIMARY_COLOR_STORAGE_KEY,
  isPrimaryColor,
  type PrimaryColor,
} from "@/lib/primary-color";

export type Theme = "light" | "dark";

const STORAGE_KEY = "spec-composer-theme";

function applyTheme(theme: Theme) {
  document.documentElement.classList.toggle("dark", theme === "dark");
}

function readStoredTheme(): Theme | undefined {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored === "light" || stored === "dark" ? stored : undefined;
  } catch {
    return undefined;
  }
}

function systemTheme(): Theme {
  return matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

const ThemeContext = createContext<{
  theme: Theme;
  toggleTheme: () => void;
  primaryColor: PrimaryColor;
  setPrimaryColor: (color: PrimaryColor) => void;
  /** False until the client has synced `theme` to the real DOM state. */
  mounted: boolean;
} | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  // Always starts at "light" so server and first client render match — the
  // blocking /theme-init.js script has already set the real class
  // on <html> before this ever mounts, so page colors are correct from the
  // first paint regardless of what this state says.
  const [theme, setTheme] = useState<Theme>("light");
  const [primaryColor, setPrimaryColorState] = useState<PrimaryColor>(
    DEFAULT_PRIMARY_COLOR,
  );
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setTheme(
      document.documentElement.classList.contains("dark") ? "dark" : "light",
    );
    const color = document.documentElement.getAttribute("data-primary-color");
    setPrimaryColorState(isPrimaryColor(color) ? color : DEFAULT_PRIMARY_COLOR);
    setMounted(true);
  }, []);

  useEffect(() => {
    if (readStoredTheme()) return;
    const media = matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => {
      const next = systemTheme();
      applyTheme(next);
      setTheme(next);
    };
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme((prev) => {
      const next: Theme = prev === "dark" ? "light" : "dark";
      try {
        localStorage.setItem(STORAGE_KEY, next);
      } catch {
        // Keep theme switching usable when storage is unavailable.
      }
      applyTheme(next);
      return next;
    });
  }, []);

  const setPrimaryColor = useCallback((color: PrimaryColor) => {
    if (!isPrimaryColor(color)) return;
    document.documentElement.setAttribute("data-primary-color", color);
    setPrimaryColorState(color);
    try {
      localStorage.setItem(PRIMARY_COLOR_STORAGE_KEY, color);
    } catch {
      // Keep the current selection usable when storage is unavailable.
    }
  }, []);

  return (
    <ThemeContext.Provider
      value={{ theme, toggleTheme, primaryColor, setPrimaryColor, mounted }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within a ThemeProvider");
  return ctx;
}
