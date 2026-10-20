import type { SpecElement } from "../types";
import { inferCatalogId } from "./catalog";
import { modelSource, modelValue } from "./model-preview";

export type PreviewMode="live"|"simplified"|"spec_only"|"generation";
export interface PreviewCapability{mode:PreviewMode;label:string;description:string}
const status=(mode:PreviewMode,description:string):PreviewCapability=>({mode,label:({live:"Live preview",simplified:"Simplified vector",spec_only:"Specification only",generation:"Pending generation"})[mode],description});
export function previewCapability(element:SpecElement,key:string):PreviewCapability{
 const id=inferCatalogId(element)??"",value=String(modelValue(element,key)??"");
 if(key.startsWith("transform.")&&["x","y","width","height","rotation","opacity"].includes(key.slice(10)))return status("live","Updates the existing layer transform.");
 if(id==="subjects.person"){
  if(key.startsWith("model.")&&modelSource(element)!=="editable_vector")return status("spec_only","The supplied image is preserved. Pose and wardrobe need an explicit image edit.");
  if(key==="model.visual_treatment.renderStyle"&&!["vector","illustration","cartoon","inherit","silhouette"].includes(value))return status("generation","This treatment needs explicit image generation; the vector remains a simplified preview.");
  if(key.startsWith("model.pose_action.")&&!key.includes("interact")&&key!=="model.pose_action.actionDetails")return status(value==="custom"?"spec_only":"simplified",value==="custom"?"No authored geometry exists for this custom pose.":"Uses composable local SVG joints; unsupported combinations show an unavailable state.");
  if(["model.identity.modelPreset","model.identity.ageGroup","model.appearance.skinTone","model.appearance.hairColor","model.appearance.hairStyle","model.appearance.build","model.expression.expression","model.framing.shot","model.outfit.palette","model.outfit.category","model.outfit.garmentPreset","model.outfit.top","model.outfit.bottom","model.outfit.onePiece","model.outfit.outerwear","model.outfit.fit","model.outfit.sleeves","model.outfit.footwear"].includes(key))return status(value==="custom"?"spec_only":"simplified","Available vector geometry updates locally; detailed realism is not simulated.");
 }
 if(key.startsWith("type.")&&["content","family","size","weight","align","color","lineHeight","letterSpacing","case","wrap"].includes(key.slice(5)))return status("live","Uses the shared native text renderer and Inspector state.");
 if(["surface.fill","surface.strokeColor","surface.strokeWidth","surface.strokeStyle","surface.cornerRadius","surface.shape","fx.shadow","asset.fit","asset.source","action.label"].includes(key))return status(["polygon","custom_path","custom"].includes(value)?"spec_only":"live","Supported local geometry/style updates immediately; custom geometry needs an authored asset.");
 return status("spec_only","Saved and exported; this setting has no local renderer.");
}
