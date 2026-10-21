import type { SpecElement } from "../types";
import type { Field } from "./schema";
import { ContextualField } from "./ContextualField";
import { ModelSvg } from "./ModelSvg";
import { modelSource, modelValue, normalizedModelEdit } from "./model-preview";
import { commitContextualEdit } from "./store";

export interface ModelControlProps { elements:SpecElement[]; fields:Field[]; context:string }
export function ModelFields({elements,fields,context}:ModelControlProps){return <>{fields.map(field=><ContextualField key={field.key} field={field} elements={elements} context={context}/>)}</>;}
export function PreviewStatus({elements}:Pick<ModelControlProps,"elements">){
 const sources=[...new Set(elements.map(modelSource))], treatment=String(modelValue(elements[0]!,"model.visual_treatment.renderStyle"));
 const external=sources.some(source=>source!=="editable_vector"),pending=["photorealistic","fashion_editorial","studio_catalog","cinematic","3d_render"].includes(treatment);
 return <p className="model-preview-status" role="status">{external?`Source: ${sources.join(", ").replace(/_/g," ")}. Supplied pixels stay unchanged; pose edits are specification only.`:pending?"Live pose and color preview · final treatment pending explicit generation":"Live illustrated SVG · pose and colors update locally; detailed styling is specification only."}</p>;
}
export function ModelLivePreview({element,label="Current model"}:{element:SpecElement;label?:string}){return <figure className="model-live-preview">{element.src?<img src={element.src} alt="Current supplied model"/>:<ModelSvg element={element}/>}<figcaption>{label}</figcaption></figure>;}
export function ModelTileGrid({children,label}:{children:React.ReactNode;label:string}){return <div className="model-visual-grid" role="group" aria-label={label} onKeyDown={event=>{
 const offset=event.key==="ArrowRight"?1:event.key==="ArrowLeft"?-1:event.key==="ArrowDown"?2:event.key==="ArrowUp"?-2:0;if(!offset)return;
 const buttons=[...event.currentTarget.querySelectorAll<HTMLButtonElement>("button:not([disabled])")];const index=buttons.indexOf(event.target as HTMLButtonElement);if(index<0)return;event.preventDefault();buttons[(index+offset+buttons.length)%buttons.length]?.focus();
 }}>{children}</div>;}
export function ModelPopover(props:ModelControlProps){
 const element=props.elements[0]!;
 return <><PreviewStatus elements={props.elements}/><ModelTileGrid label="Model type">{(["man","woman","boy","girl"] as const).map(value=>{
 const properties=props.elements.map(el=>normalizedModelEdit(el,"model.identity.modelPreset",value)),candidate=properties[0]?{...element,contextualProperties:properties[0]}:element;
 const unavailable=properties.some(next=>!next)||props.elements.some(el=>el.locked||!el.visible||(Array.isArray(el.contextualProperties?.["model.references.lockFields"])&&el.contextualProperties["model.references.lockFields"].includes("model.identity.modelPreset")));
 return <button type="button" key={value} aria-label={`Model ${value}`} aria-pressed={props.elements.every(el=>modelValue(el,"model.identity.modelPreset")===value)} disabled={unavailable} onClick={()=>commitContextualEdit(props.context,"model.identity.modelPreset",value)}><span className="model-tile-preview" aria-hidden="true">{candidate.src?<img src={candidate.src} alt="" style={{width:"100%",height:"100%",objectFit:"contain"}}/>:<ModelSvg thumbnail element={candidate}/>}</span><span>{value}</span></button>;})}</ModelTileGrid>
 <details><summary>Appearance & source</summary><ModelFields {...props} fields={props.fields.filter(field=>field.key!=="model.identity.modelPreset")}/></details></>;
}
