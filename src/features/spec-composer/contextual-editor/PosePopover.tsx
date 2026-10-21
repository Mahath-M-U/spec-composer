import { ModelTileGrid, PreviewStatus, type ModelControlProps } from "./ModelPopover";
import { ModelSvg } from "./ModelSvg";
import { modelValue, normalizedModelEdit } from "./model-preview";
import type { SpecElement } from "../types";
import type { ContextualValue } from "../types";
import { POSE_PRESETS, poseVariationKey } from "./model-poses";
import { commitContextualEdit } from "./store";
function posePreview(element:SpecElement,key:string,value:ContextualValue){const clone={...element,contextualProperties:{...element.contextualProperties}};delete clone.contextualProperties["model.references.lockFields"];clone.contextualProperties=normalizedModelEdit(clone,key,value)??clone.contextualProperties;return clone;}
export function PosePopover(props:ModelControlProps){
 const element=props.elements[0]!,action=String(modelValue(element,"model.pose_action.action")), presets=POSE_PRESETS[action]??[];
 return <><PreviewStatus elements={props.elements}/><div className="model-pose-segments" role="group" aria-label="Base pose">{(["standing","sitting","walking","running"] as const).map(value=><button type="button" key={value} aria-pressed={props.elements.every(el=>modelValue(el,"model.pose_action.action")===value)} onClick={()=>commitContextualEdit(props.context,"model.pose_action.action",value)}><span className="model-tile-preview" aria-hidden="true"><ModelSvg thumbnail element={posePreview(element,"model.pose_action.action",value)}/></span><span>{value}</span></button>)}<select aria-label="More poses" value={["standing","sitting","walking","running"].includes(action)?"":action} onChange={event=>commitContextualEdit(props.context,"model.pose_action.action",event.target.value)}><option value="">More</option>{Object.keys(POSE_PRESETS).filter(value=>!["standing","sitting","walking","running"].includes(value)).map(value=><option key={value} value={value}>{value}</option>)}</select></div>
 <ModelTileGrid label={`${action} presets`}>{presets.map(preset=>{const key=poseVariationKey(action);
 return <button type="button" key={preset.value} aria-label={`${action} ${preset.label}`} aria-pressed={props.elements.every(el=>(modelValue(el,key)??(action==="sitting"?"upright":action==="standing"?"neutral":"default"))===preset.value)} onClick={()=>commitContextualEdit(props.context,key,preset.value)}><span className="model-tile-preview" aria-hidden="true"><ModelSvg thumbnail element={posePreview(element,key,preset.value)}/></span><span>{preset.label}</span></button>;})}</ModelTileGrid>
 {!presets.length&&<p>Preview unavailable for this action. Choose a supported pose.</p>}</>;
}
