import { CommitInput } from "./committed-input";
import {
  DESCRIPTION_TEMPLATES,
  findDescriptionTemplate,
  resolveElementDetail,
} from "./description-templates";
import { shapeRoleLabel } from "./shape-workflow";
import { useEditorStore } from "./store";
import type { ShapeRole, SpecElement } from "./types";

/** Compatible templates lead the menu; choosing another role is explicit. */
export function DescriptionTemplateOptions({ role }: { role: ShapeRole }) {
  const compatible = DESCRIPTION_TEMPLATES.filter(
    (template) => template.role === role,
  );
  const other = DESCRIPTION_TEMPLATES.filter(
    (template) => template.role !== role,
  );
  return (
    <>
      {compatible.length > 0 && (
        <optgroup label={`For ${shapeRoleLabel(role).toLowerCase()}`}>
          {compatible.map((template) => (
            <option key={template.id} value={template.id}>
              {template.label}
            </option>
          ))}
        </optgroup>
      )}
      {other.length > 0 && (
        <optgroup label="Other templates">
          {other.map((template) => (
            <option key={template.id} value={template.id}>
              {template.label} · {shapeRoleLabel(template.role)}
            </option>
          ))}
        </optgroup>
      )}
    </>
  );
}

export function DescriptionTemplateControls({
  element,
}: {
  element: SpecElement;
}) {
  const s = useEditorStore();
  const selection = element.descriptionTemplate;
  const template = selection
    ? findDescriptionTemplate(selection.id)
    : undefined;
  const detail = resolveElementDetail(element);
  return (
    <fieldset
      className="description-template-controls"
      disabled={element.locked}
    >
      <label className="se-field">
        <span>Description template</span>
        <select
          className="se-input"
          value={selection?.id ?? "custom"}
          onChange={(event) => {
            if (event.target.value === "custom") {
              s.detachDescriptionTemplate(element.id);
              return;
            }
            const next = findDescriptionTemplate(event.target.value);
            if (next) s.setDescriptionTemplate(element.id, next.id);
          }}
        >
          <option value="custom">Custom text</option>
          {selection && !template && (
            <option value={selection.id} disabled>
              Unavailable template · saved description
            </option>
          )}
          <DescriptionTemplateOptions
            role={element.semanticRole ?? "decorative"}
          />
        </select>
      </label>
      {template && selection ? (
        <>
          <p className="workflow-hint">
            Edit the fields below. Template framing stays fixed. Blank fields
            use the suggested defaults. Choosing another template may change
            this shape’s role.
          </p>
          <div className="description-template-fields">
            {template.fields.map((field) => (
              <CommitInput
                key={`${template.id}-${field.id}`}
                label={field.label}
                value={selection.values[field.id] ?? field.defaultValue}
                placeholder={field.placeholder ?? field.defaultValue}
                maxLength={200}
                onCommit={(value) =>
                  s.updateDescriptionField(element.id, field.id, value)
                }
              />
            ))}
          </div>
          <label className="se-field">
            <span>Generated description · protected framing</span>
            <textarea
              className="se-input description-preview"
              readOnly
              value={detail}
              rows={4}
            />
          </label>
        </>
      ) : selection ? (
        <>
          <p className="workflow-hint">
            This saved template is unavailable. Its description is preserved.
            Choose Custom text to edit it, or select another template.
          </p>
          <label className="se-field">
            <span>Saved description</span>
            <textarea
              className="se-input description-preview"
              readOnly
              value={detail}
              rows={4}
            />
          </label>
        </>
      ) : (
        <>
          <CommitInput
            label="Custom description"
            value={detail}
            maxLength={20000}
            multiline
            placeholder="Describe what belongs in this region"
            onCommit={(value) => s.setElementDetail(element.id, value)}
          />
          <p className="workflow-hint">
            Enter to apply · Shift+Enter for a new line.
          </p>
        </>
      )}
      {element.descriptionDrafts?.custom !== undefined && (
        <button
          type="button"
          className="description-restore"
          onClick={() => s.restoreCustomDescription(element.id)}
        >
          Restore previous custom description
        </button>
      )}
    </fieldset>
  );
}
