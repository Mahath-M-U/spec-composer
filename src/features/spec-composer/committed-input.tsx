import {
  useEffect,
  useId,
  useState,
  type ChangeEvent,
  type KeyboardEvent,
} from "react";

/** Keep transient typing out of document history; commit once on blur or Enter. */
export function CommitInput({
  value,
  onCommit,
  label,
  numeric,
  min = 0,
  max,
  step,
  maxLength,
  placeholder,
  required = false,
  multiline = false,
}: {
  value: string;
  onCommit: (value: string) => void;
  label: string;
  numeric?: boolean;
  min?: number;
  max?: number;
  step?: number;
  maxLength?: number;
  placeholder?: string;
  required?: boolean;
  multiline?: boolean;
}) {
  const [draft, setDraft] = useState(value);
  const [error, setError] = useState("");
  const errorId = useId();
  useEffect(() => {
    setDraft(value);
    setError("");
  }, [value]);
  const commit = () => {
    let next = draft.trim();
    if (
      (required && !next) ||
      (numeric && next && !Number.isFinite(Number(next)))
    ) {
      setDraft(value);
      setError(
        required && !next
          ? "A value is required. Previous value restored."
          : "Enter a valid number. Previous value restored.",
      );
      return;
    }
    if (numeric && next)
      next = String(Math.max(min, Math.min(max ?? Infinity, Number(next))));
    setDraft(next);
    setError("");
    if (next !== value) onCommit(next);
  };
  const fieldProps = {
    className: "se-input",
    maxLength,
    value: draft,
    placeholder,
    "aria-invalid": error ? true : undefined,
    "aria-describedby": error ? errorId : undefined,
    onChange: (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setDraft(event.target.value);
      setError("");
    },
    onBlur: commit,
    onKeyDown: (
      event: KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>,
    ) => {
      if (event.key === "Enter" && !(multiline && event.shiftKey)) {
        event.preventDefault();
        event.currentTarget.blur();
      }
      if (event.key === "Escape") {
        setDraft(value);
        setError("");
        event.preventDefault();
        event.stopPropagation();
      }
    },
  };
  return (
    <label className="se-field">
      <span>{label}</span>
      {multiline ? (
        <textarea {...fieldProps} rows={3} />
      ) : (
        <input
          {...fieldProps}
          type={numeric ? "number" : "text"}
          min={numeric ? min : undefined}
          max={max}
          step={step}
        />
      )}
      {error && (
        <small id={errorId} className="workflow-input-error" role="status">
          {error}
        </small>
      )}
    </label>
  );
}
