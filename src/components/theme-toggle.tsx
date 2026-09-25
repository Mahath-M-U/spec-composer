import { Moon, Sun } from "lucide-react";
import { Button, type ButtonProps } from "@/components/ui/button";
import { Hint } from "@/components/ui/tooltip";
import { useTheme } from "@/hooks/use-theme";

export function ThemeToggle({
  size = "icon",
  variant = "ghost",
  className,
}: Pick<ButtonProps, "size" | "variant" | "className">) {
  const { theme, toggleTheme, mounted } = useTheme();
  const isDark = theme === "dark";
  const label = isDark ? "Switch to light theme" : "Switch to dark theme";

  return (
    <Hint label={label}>
      <Button
        type="button"
        size={size}
        variant={variant}
        className={className}
        aria-label={label}
        onClick={toggleTheme}
      >
        {/* Avoid rendering a guessed icon before the client has synced
          `theme` to the real (blocking-script-applied) DOM state. */}
        {mounted ? isDark ? <Sun size={16} /> : <Moon size={16} /> : null}
      </Button>
    </Hint>
  );
}
