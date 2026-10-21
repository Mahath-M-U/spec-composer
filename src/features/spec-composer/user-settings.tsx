import { useId, useState } from "react";
import { Check, Code2, Moon, Settings, Settings2, Sun } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useTheme } from "@/hooks/use-theme";
import { PRIMARY_COLORS } from "@/lib/primary-color";

export function UserSettings() {
  const { theme, toggleTheme, mounted, primaryColor, setPrimaryColor } =
    useTheme();
  const [section, setSection] = useState<"general" | "api">("general");
  const contentId = useId();
  const themeLabelId = useId();
  const colorLabelId = useId();

  return (
    <Dialog>
      <DialogTrigger asChild>
        <button type="button" aria-label="User settings" className="user-settings-trigger">
          <Settings aria-hidden="true" />
          <span>Settings</span>
        </button>
      </DialogTrigger>
      <DialogContent className="user-settings-dialog">
        <div className="user-settings-sidebar">
          <DialogTitle className="user-settings-title">Settings</DialogTitle>
          <DialogDescription className="sr-only">
            Personalize your workspace. Appearance changes apply immediately and
            are saved on this browser.
          </DialogDescription>
          <nav className="user-settings-nav" aria-label="Settings sections">
            <button
              type="button"
              aria-pressed={section === "general"}
              aria-controls={contentId}
              onClick={() => setSection("general")}
            >
              <Settings2 aria-hidden="true" />
              General
            </button>
            <button
              type="button"
              aria-pressed={section === "api"}
              aria-controls={contentId}
              onClick={() => setSection("api")}
            >
              <Code2 aria-hidden="true" />
              API
              <span className="user-settings-badge">Coming soon</span>
            </button>
          </nav>
        </div>
        <section
          id={contentId}
          className="user-settings-content"
          aria-label={
            section === "general" ? "General settings" : "API settings"
          }
        >
          {section === "general" ? (
            <>
              <div className="user-settings-heading">
                <h2>Appearance</h2>
                <p>Make your workspace feel like yours.</p>
              </div>
              <div className="user-settings-row">
                <div className="user-settings-row-copy">
                  <h3 id={themeLabelId}>Theme</h3>
                  <p>Choose a light or dark workspace.</p>
                </div>
                <fieldset
                  className="user-settings-theme"
                  aria-labelledby={themeLabelId}
                  disabled={!mounted}
                >
                  {(
                    [
                      ["light", "Light", Sun],
                      ["dark", "Dark", Moon],
                    ] as const
                  ).map(([value, label, Icon]) => (
                    <label key={value}>
                      <input
                        type="radio"
                        name="user-settings-theme"
                        value={value}
                        checked={mounted && theme === value}
                        onChange={() => {
                          if (theme !== value) toggleTheme();
                        }}
                        className="sr-only"
                      />
                      <span>
                        <Icon aria-hidden="true" />
                        {label}
                      </span>
                    </label>
                  ))}
                </fieldset>
              </div>
              <div className="user-settings-row">
                <div className="user-settings-row-copy">
                  <h3 id={colorLabelId}>Primary color</h3>
                  <p>Pick the accent for buttons and highlights.</p>
                </div>
                <fieldset
                  className="user-settings-colors"
                  aria-labelledby={colorLabelId}
                >
                  {PRIMARY_COLORS.map(({ id, label }) => (
                    <label key={id} title={label}>
                      <input
                        type="radio"
                        name="primary-color"
                        value={id}
                        checked={primaryColor === id}
                        onChange={() => setPrimaryColor(id)}
                        className="sr-only"
                      />
                      <span className="user-settings-color-frame">
                        <span
                          data-primary-color={id}
                          className="user-settings-color-swatch"
                          aria-hidden="true"
                        >
                          {primaryColor === id && <Check />}
                        </span>
                      </span>
                      <span className="sr-only">{label}</span>
                    </label>
                  ))}
                </fieldset>
              </div>
            </>
          ) : (
            <div className="user-settings-heading">
              <h2>API</h2>
              <p>API settings are coming soon.</p>
            </div>
          )}
        </section>
      </DialogContent>
    </Dialog>
  );
}
