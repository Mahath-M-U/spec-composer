import {
  useEffect,
  useRef,
  useState,
  cloneElement,
  type ReactElement,
  type CSSProperties,
} from "react";
import { ChevronDown, X } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  opaqueColor,
  hsvToRgb,
  parseColor,
  planePosition,
  rgbToHsv,
  serializeColor,
  textColorState,
  type Hsv,
  type TextColorIntent,
  type TextColorProperty,
} from "./text-color";

export interface ColorControlProps {
  label: string;
  property: TextColorProperty;
  values: Array<string | undefined>;
  presets: string[];
  disabled?: boolean;
  onChange: (intent: TextColorIntent, gesture?: boolean) => void;
  onGestureStart?: () => void;
  onGestureEnd?: () => void;
  allowAlpha?: boolean;
  allowRemove?: boolean;
  removalLabel?: string;
  trigger?:
    | ReactElement<{
        type?: "button";
        disabled?: boolean;
        "aria-label"?: string;
      }>
    | undefined;
}

function PercentField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number | undefined;
  onChange: (value: number) => void;
}) {
  const [draft, setDraft] = useState<string | null>(null);
  const commit = (text: string) => {
    if (!text.trim()) return;
    const next = Number(text);
    if (Number.isFinite(next) && next >= 0 && next <= 100) onChange(next);
  };
  return (
    <label className="text-color-number">
      <span>{label}</span>
      <span>
        <input
          aria-label={label}
          type="number"
          min={0}
          max={100}
          step="any"
          value={
            draft ?? (value === undefined ? "" : Math.round(value * 100) / 100)
          }
          placeholder="Mixed"
          onChange={(event) => {
            setDraft(event.target.value);
            commit(event.target.value);
          }}
          onBlur={() => setDraft(null)}
          onKeyDown={(event) => {
            if (event.key === "Escape") {
              setDraft(null);
            }
            if (event.key === "Enter") {
              event.preventDefault();
              if (draft !== null) commit(draft);
              setDraft(null);
            }
          }}
        />
        <em>%</em>
      </span>
    </label>
  );
}

/** Inline picker body is separate so keyboard and pointer behavior can be checked without a portal. */
export function ColorPicker(props: ColorControlProps) {
  const {
    label,
    property,
    values,
    presets,
    onChange,
    onGestureStart,
    onGestureEnd,
  } = props;
  const allowAlpha = props.allowAlpha !== false;
  const allowRemove = props.allowRemove ?? property === "background";
  const state = textColorState(values, property);
  const color =
    state.kind === "solid" ? state.color : { r: 197, g: 84, b: 84, a: 1 };
  const [hsv, setHsv] = useState(() => rgbToHsv(color));
  const [hexDraft, setHexDraft] = useState<string | null>(null);
  const cancelHexBlur = useRef(false);
  const gesture = useRef(false);
  const activePointer = useRef<{ id: number; target: HTMLElement } | null>(
    null,
  );
  const endRef = useRef(onGestureEnd);
  endRef.current = onGestureEnd;
  const solid = state.kind === "solid";
  const {
    h: sourceHue,
    s: sourceSaturation,
    v: sourceBrightness,
  } = rgbToHsv(color);
  useEffect(() => {
    if (solid)
      setHsv((previous) => ({
        h: sourceSaturation === 0 ? previous.h : sourceHue,
        s: sourceBrightness === 0 ? previous.s : sourceSaturation,
        v: sourceBrightness,
      }));
  }, [solid, sourceHue, sourceSaturation, sourceBrightness]);
  useEffect(
    () => () => {
      if (gesture.current) endRef.current?.();
    },
    [],
  );
  const start = (pointer: {
    pointerId: number;
    button: number;
    isPrimary?: boolean;
    currentTarget: HTMLElement;
  }) => {
    if (
      props.disabled ||
      gesture.current ||
      pointer.button !== 0 ||
      pointer.isPrimary === false
    )
      return false;
    gesture.current = true;
    activePointer.current = {
      id: pointer.pointerId,
      target: pointer.currentTarget,
    };
    pointer.currentTarget.setPointerCapture(pointer.pointerId);
    onGestureStart?.();
    return true;
  };
  const end = () => {
    const pointer = activePointer.current;
    activePointer.current = null;
    const wasActive = gesture.current;
    gesture.current = false;
    if (pointer?.target.hasPointerCapture(pointer.id))
      pointer.target.releasePointerCapture(pointer.id);
    if (wasActive) onGestureEnd?.();
  };
  const finishPointer = (event: { pointerId: number }) => {
    if (activePointer.current?.id === event.pointerId) end();
  };
  const emit = (intent: TextColorIntent, grouped = false) => {
    if (props.disabled) return;
    if (intent.type === "remove") {
      if (allowRemove) onChange(intent, grouped);
      return;
    }
    if (!allowAlpha) {
      if (intent.type === "alpha") return;
      const value =
        intent.type === "color"
          ? opaqueColor(intent.value)
          : opaqueColor(serializeColor({ ...intent.color, a: 1 }));
      if (value) onChange({ type: "color", value }, grouped);
      return;
    }
    onChange(intent, grouped);
  };
  const changeHsv = (patch: Partial<Hsv>, grouped = false) => {
    const next = { ...hsv, ...patch };
    setHsv(next);
    emit(
      state.kind === "none"
        ? { type: "color", value: serializeColor({ ...hsvToRgb(next), a: 1 }) }
        : { type: "rgb", color: hsvToRgb(next) },
      grouped,
    );
  };
  const parsed = values.map((value) =>
    parseColor(value ?? (property === "color" ? "#18181b" : "transparent")),
  );
  const common = (numbers: Array<number | undefined>) =>
    numbers.every(
      (number) =>
        number !== undefined && Math.abs(number - numbers[0]!) < 0.0001,
    )
      ? numbers[0]
      : undefined;
  const alpha = common(parsed.map((value) => value?.a));
  const saturation = common(parsed.map((value) => value && rgbToHsv(value).s));
  const brightness = common(parsed.map((value) => value && rgbToHsv(value).v));
  const unsupported = parsed.some((value) => !value);
  const hexValue = state.kind === "solid" ? state.css.toUpperCase() : "";
  const commitHex = (text: string) => {
    const normalized = text.startsWith("#") ? text : `#${text}`;
    if (!/^#(?:[\da-f]{3,4}|[\da-f]{6}|[\da-f]{8})$/i.test(normalized)) return;
    const next = parseColor(normalized)!;
    emit(
      normalized.length === 5 ||
        normalized.length === 9 ||
        state.kind === "none"
        ? { type: "color", value: normalized }
        : { type: "rgb", color: next },
    );
  };
  const planeStyle = {
    "--text-color-hue": `hsl(${hsv.h} 100% 50%)`,
  } as CSSProperties;
  const rangeGesture = {
    onPointerDown: start,
    onPointerUp: finishPointer,
    onPointerCancel: finishPointer,
    onLostPointerCapture: finishPointer,
    onBlur: end,
  };
  return (
    <fieldset className="text-color-picker-body" disabled={props.disabled}>
      <div className="text-color-picker-heading">
        <strong>{label}</strong>
        <span>
          {state.kind === "mixed"
            ? "Mixed colors"
            : state.kind === "none"
              ? allowRemove
                ? "No fill"
                : "Choose a color"
              : state.kind === "unsupported"
                ? "Custom CSS color"
                : "Solid color"}
        </span>
      </div>
      <div
        className="text-color-plane"
        role="group"
        aria-label="Saturation and brightness"
        style={planeStyle}
        onPointerDown={(event) => {
          if (!start(event)) return;
          event.preventDefault();
          changeHsv(
            planePosition(
              event.clientX,
              event.clientY,
              event.currentTarget.getBoundingClientRect(),
            ),
            true,
          );
        }}
        onPointerMove={(event) => {
          if (
            activePointer.current?.id !== event.pointerId ||
            activePointer.current.target !== event.currentTarget
          )
            return;
          changeHsv(
            planePosition(
              event.clientX,
              event.clientY,
              event.currentTarget.getBoundingClientRect(),
            ),
            true,
          );
        }}
        onPointerUp={finishPointer}
        onPointerCancel={finishPointer}
        onLostPointerCapture={finishPointer}
      >
        <span
          className="text-color-plane-marker"
          style={{ left: `${hsv.s * 100}%`, top: `${(1 - hsv.v) * 100}%` }}
        />
      </div>
      <label className="text-color-range-label">
        <span>Hue</span>
        <input
          className="text-color-hue"
          aria-label="Hue"
          type="range"
          min={0}
          max={360}
          step={1}
          value={hsv.h}
          {...rangeGesture}
          onChange={(event) =>
            changeHsv({ h: Number(event.target.value) }, gesture.current)
          }
        />
      </label>
      <div className="text-color-number-grid">
        <PercentField
          label="Saturation"
          value={saturation === undefined ? undefined : saturation * 100}
          onChange={(value) => changeHsv({ s: value / 100 })}
        />
        <PercentField
          label="Brightness"
          value={brightness === undefined ? undefined : brightness * 100}
          onChange={(value) => changeHsv({ v: value / 100 })}
        />
      </div>
      <label className="text-color-hex">
        <span>HEX</span>
        <input
          aria-label={`${label} HEX`}
          title={
            allowAlpha
              ? "RGB HEX preserves each layer's alpha; 4- or 8-digit HEX also sets alpha."
              : "Opaque HEX color"
          }
          spellCheck={false}
          autoComplete="off"
          value={hexDraft ?? hexValue}
          placeholder={
            state.kind === "mixed"
              ? "Mixed"
              : state.kind === "none"
                ? "Choose a color"
                : "Custom color"
          }
          onChange={(event) => {
            const text = event.target.value;
            cancelHexBlur.current = false;
            setHexDraft(text);
            if (/^#?(?:[\da-f]{6}|[\da-f]{8})$/i.test(text)) commitHex(text);
          }}
          onBlur={(event) => {
            if (!cancelHexBlur.current && hexDraft !== null)
              commitHex(event.target.value);
            cancelHexBlur.current = false;
            setHexDraft(null);
          }}
          onKeyDown={(event) => {
            if (event.key === "Escape") {
              cancelHexBlur.current = true;
              setHexDraft(null);
            }
            if (event.key === "Enter") {
              event.preventDefault();
              if (hexDraft !== null) commitHex(hexDraft);
              cancelHexBlur.current = true;
              setHexDraft(null);
            }
          }}
        />
      </label>
      {allowAlpha && (
        <div className="text-color-alpha">
          <label className="text-color-range-label">
            <span>Alpha</span>
            <input
              aria-label="Color alpha"
              type="range"
              min={0}
              max={100}
              step={1}
              value={(alpha ?? 1) * 100}
              aria-valuetext={
                alpha === undefined
                  ? "Mixed; choose alpha for supported colors"
                  : `${Math.round(alpha * 100)}%`
              }
              {...rangeGesture}
              onChange={(event) =>
                emit(
                  { type: "alpha", alpha: Number(event.target.value) / 100 },
                  gesture.current,
                )
              }
            />
          </label>
          <PercentField
            label="Alpha percentage"
            value={alpha === undefined ? undefined : alpha * 100}
            onChange={(value) => emit({ type: "alpha", alpha: value / 100 })}
          />
        </div>
      )}
      {unsupported && (
        <p className="text-color-note">
          Choose a HEX color or preset to replace custom CSS.
          {allowAlpha && " Alpha edits preserve unsupported colors."}
        </p>
      )}
      <div
        className="text-color-presets"
        role="group"
        aria-label={`${label} presets`}
      >
        {presets
          .filter((preset) => allowAlpha || !!opaqueColor(preset))
          .map((preset) => {
            const parsedPreset = parseColor(preset);
            return (
              <button
                key={preset}
                type="button"
                aria-label={`Use ${preset.toUpperCase()}`}
                title={preset.toUpperCase()}
                aria-pressed={
                  state.kind === "solid" &&
                  !!parsedPreset &&
                  state.css === serializeColor(parsedPreset)
                }
                style={{ background: preset }}
                onClick={() => emit({ type: "color", value: preset })}
              />
            );
          })}
      </div>
      {allowRemove && (
        <button
          className="text-color-remove"
          type="button"
          onClick={() => emit({ type: "remove" })}
        >
          <X size={13} aria-hidden="true" />
          {props.removalLabel ?? "Remove background"}
        </button>
      )}
    </fieldset>
  );
}

export function ColorControl(props: ColorControlProps) {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    if (props.disabled) setOpen(false);
  }, [props.disabled]);
  const state = textColorState(props.values, props.property);
  const value =
    state.kind === "solid"
      ? state.css.toUpperCase()
      : state.kind === "none"
        ? props.allowRemove === false
          ? "Not set"
          : "None"
        : state.kind === "mixed"
          ? "Mixed"
          : state.css;
  const popup = (
    <Popover
      open={open && !props.disabled}
      onOpenChange={(next) => {
        if (!props.disabled) setOpen(next);
      }}
    >
      <PopoverTrigger asChild>
        {props.trigger ? (
          cloneElement(props.trigger, {
            type: "button",
            disabled: !!(props.disabled || props.trigger.props.disabled),
            "aria-label":
              props.trigger.props["aria-label"] ?? `${props.label}: ${value}`,
          })
        ) : (
          <button
            className="text-color-trigger"
            type="button"
            aria-label={`${props.label}: ${value}`}
            disabled={props.disabled}
          >
            <span className="text-color-value">{value}</span>
            <span className="text-color-swatch" data-kind={state.kind}>
              <i
                style={{
                  background:
                    state.kind === "solid" || state.kind === "unsupported"
                      ? state.css
                      : "transparent",
                }}
              />
            </span>
            <ChevronDown size={13} aria-hidden="true" />
          </button>
        )}
      </PopoverTrigger>
      <PopoverContent
        className="text-color-popover"
        align="end"
        sideOffset={6}
        collisionPadding={12}
        aria-label={`${props.label} picker`}
      >
        {open && !props.disabled && <ColorPicker {...props} />}
      </PopoverContent>
    </Popover>
  );
  return props.trigger ? (
    popup
  ) : (
    <div className="text-color-row">
      <span>{props.label}</span>
      {popup}
    </div>
  );
}

export interface OpaqueColorControlProps {
  label: string;
  value?: string | undefined;
  values?: Array<string | undefined>;
  presets?: string[];
  disabled?: boolean;
  onChange: (color: string) => void;
  onRemove?: () => void;
  removalLabel?: string;
  trigger?: ColorControlProps["trigger"];
}
export function OpaqueColorControl({
  value,
  values,
  presets = ["#18181b", "#ffffff", "#c55454"],
  onChange,
  onRemove,
  ...props
}: OpaqueColorControlProps) {
  return (
    <ColorControl
      {...props}
      property="background"
      values={values ?? [value]}
      presets={presets}
      allowAlpha={false}
      allowRemove={!!onRemove}
      onChange={(intent) => {
        if (props.disabled) return;
        if (intent.type === "remove") {
          onRemove?.();
          return;
        }
        const next =
          intent.type === "color"
            ? opaqueColor(intent.value)
            : intent.type === "rgb"
              ? opaqueColor(serializeColor({ ...intent.color, a: 1 }))
              : undefined;
        const current = values ?? [value];
        if (
          next &&
          !current.every(
            (color) => color !== undefined && opaqueColor(color) === next,
          )
        )
          onChange(next);
      }}
    />
  );
}
