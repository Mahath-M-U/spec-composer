import type { SpecElement } from "../types";
import { inferCatalogId } from "./catalog";
import { modelSource, modelValue, PORTRAIT_SHOTS } from "./model-preview";
import { supportedExpressions, supportedHairStyles } from "./ModelArtwork";

export type PreviewMode="live"|"simplified"|"spec_only"|"generation";
export interface PreviewCapability{mode:PreviewMode;label:string;description:string}
const status=(mode:PreviewMode,description:string):PreviewCapability=>({mode,label:({live:"Live preview",simplified:"Simplified vector",spec_only:"Specification only",generation:"Pending generation"})[mode],description});
export function previewCapability(element:SpecElement,key:string):PreviewCapability{
 const id=inferCatalogId(element)??"",value=String(modelValue(element,key)??"");
 if(key.startsWith("transform.")&&["x","y","width","height","rotation","opacity"].includes(key.slice(10)))return status("live","Updates the existing layer transform.");
 if(id==="subjects.person"){
  if(key.startsWith("model.")&&modelSource(element)!=="editable_vector")return status("spec_only","The supplied image is preserved. Pose and wardrobe need an explicit image edit.");
  if(key==="model.framing.shot")return status(value==="full_body"||PORTRAIT_SHOTS.includes(value)?"simplified":"spec_only","Crops the illustrated vector to full body or head-and-shoulders; layer bounds are unchanged.");
  if(key==="model.visual_treatment.renderStyle"&&!["vector","illustration","cartoon","inherit","silhouette"].includes(value))return status("generation","This treatment needs explicit image generation; the vector remains a simplified preview.");
  if(key.startsWith("model.pose_action.")&&!key.includes("interact")&&key!=="model.pose_action.actionDetails")return status(value==="custom"?"spec_only":"simplified",value==="custom"?"No authored geometry exists for this custom pose.":"Uses composable local SVG joints; unsupported combinations show an unavailable state.");
  if(key==="model.appearance.hairStyle")return status(supportedHairStyles.includes(value)?"simplified":"spec_only",supportedHairStyles.includes(value)?"Mapped Croods hairstyle updates the illustrated front view.":"This hairstyle has no matching bundled artwork; saved as a specification.");
  if(key==="model.expression.expression")return status(supportedExpressions.includes(value)?"simplified":"spec_only",supportedExpressions.includes(value)?"Mapped illustrated expression updates the front view; some labels share a simplified face.":"This expression needs an authored face or generation.");
  if(["model.identity.modelPreset","model.identity.ageGroup","model.appearance.skinTone","model.appearance.hairColor","model.outfit.palette"].includes(key))return status(value==="custom"?"spec_only":"simplified","Identity proportions and illustrated skin, hair and garment colors update locally.");
 }
 if(key.startsWith("type.")&&["content","family","size","weight","align","color","lineHeight","letterSpacing","case","wrap"].includes(key.slice(5)))return status("live","Uses the shared native text renderer and Inspector state.");
 if(["surface.fill","surface.strokeColor","surface.strokeWidth","surface.strokeStyle","surface.cornerRadius","surface.shape","fx.shadow","asset.fit","asset.source","action.label"].includes(key))return status(["polygon","custom_path","custom"].includes(value)?"spec_only":"live","Supported local geometry/style updates immediately; custom geometry needs an authored asset.");
 return status("spec_only","Saved and exported; this setting has no local renderer.");
}
