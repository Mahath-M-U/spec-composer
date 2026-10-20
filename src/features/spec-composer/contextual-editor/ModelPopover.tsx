import type { SpecElement } from "../types";
import type { Field } from "./schema";
import { ContextualField } from "./ContextualField";
import { ModelSvg } from "./ModelSvg";
import { modelSource, modelValue } from "./model-preview";
import { commitContextualEdit } from "./store";

export interface ModelControlProps { elements:SpecElement[]; fields:Field[]; context:string }
export function ModelFields({elements,fields,context}:ModelControlProps){return <>{fields.map(field=><ContextualField key={field.key} field={field} elements={elements} context={context}/>)}</>;}
export function PreviewStatus({elements}:Pick<ModelControlProps,"elements">){
 const sources=[...new Set(elements.map(modelSource))], treatment=String(modelValue(elements[0]!,"model.visual_treatment.renderStyle"));
 const external=sources.some(source=>source!=="editable_vector"),pending=["photorealistic","fashion_editorial","studio_catalog","cinematic","3d_render"].includes(treatment);
 return <p className="model-preview-status" role="status">{external?`Source: ${sources.join(", ").replace(/_/g," ")}. Supplied pixels stay unchanged; pose edits are specification only.`:pending?"Simplified vector · final treatment pending explicit generation":"Editable SVG · supported changes update locally"}</p>;
}
export function ModelTileGrid({children,label}:{children:React.ReactNode;label:string}){return <div className="model-visual-grid" role="group" aria-label={label} onKeyDown={event=>{
 const offset=event.key==="ArrowRight"?1:event.key==="ArrowLeft"?-1:event.key==="ArrowDown"?2:event.key==="ArrowUp"?-2:0;if(!offset)return;
 const buttons=[...event.currentTarget.querySelectorAll<HTMLButtonElement>("button")];const index=buttons.indexOf(event.target as HTMLButtonElement);if(index<0)return;event.preventDefault();buttons[(index+offset+buttons.length)%buttons.length]?.focus();
 }}>{children}</div>;}
export function ModelPopover(props:ModelControlProps){
 const element=props.elements[0]!,selected=modelValue(element,"model.identity.modelPreset");
 return <><PreviewStatus elements={props.elements}/><ModelTileGrid label="Model type">{["man","woman","boy","girl"].map(value=><button type="button" key={value} aria-label={`Model ${value}`} aria-pressed={props.elements.every(el=>modelValue(el,"model.identity.modelPreset")===value)} onClick={()=>commitContextualEdit(props.context,"model.identity.modelPreset",value)}><ModelSvg element={{...element,src:undefined,contextualProperties:{...element.contextualProperties,"model.identity.modelPreset":value,"model.identity.ageGroup":["boy","girl"].includes(value)?"child":"adult","model.pose_action.action":"standing","model.pose_action.standingVariation":"neutral"}}}/><span>{value}</span></button>)}</ModelTileGrid>
 <details><summary>Appearance & source</summary><ModelFields {...props} fields={props.fields.filter(field=>field.key!=="model.identity.modelPreset")}/></details></>;
}
