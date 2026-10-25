import type { SpecElement } from "../types";
import { getElementSchema } from "./schema";
import { applyPose, poseVariationKey } from "./model-poses";

export type Point = [number, number];
export type ModelSource = "editable_vector" | "uploaded_svg" | "photograph" | "generated_image" | "reference_only";
export const PORTRAIT_SHOTS = ["headshot"];
export function modelValue(element: SpecElement, key: string): unknown {
  const aliases:Record<string,string>={"model.pose_action.bodyDirection":"model.pose_action.bodyOrientation","model.pose_action.headDirection":"model.pose_action.headOrientation","model.pose_action.standingVariation":"model.pose_action.standingPose","model.pose_action.sittingVariation":"model.pose_action.sittingPose"};
  if(element.contextualProperties?.[key]===undefined && aliases[key] && element.contextualProperties?.[aliases[key]!])return element.contextualProperties[aliases[key]!] ;
  return element.contextualProperties?.[key] ?? getElementSchema("subjects.person")?.creationDefaults?.[key];
}
export function modelSource(element: SpecElement): ModelSource {
  if (element.src) {
    if (element.contextualProperties?.["asset.origin"] === "generated" || modelValue(element,"item.personMode")==="generated_image") return "generated_image";
    return /^(data:image\/svg\+xml|.*\.svg(?:[?#]|$))/i.test(element.src) ? "uploaded_svg" : "photograph";
  }
  return ["reference_only","uploaded_photo","uploaded_svg","generated_image"].includes(String(modelValue(element, "item.personMode"))) ? "reference_only" : "editable_vector";
}
export function isEditableModel(element: SpecElement) {
  return (element.catalogElementId ? element.catalogElementId === "subjects.person" : element.kind === "humanModelImage") && modelSource(element) === "editable_vector";
}
export interface ModelGeometry {
  joints: Record<"head" | "neck" | "leftShoulder" | "rightShoulder" | "leftElbow" | "rightElbow" | "leftHand" | "rightHand" | "leftHip" | "rightHip" | "leftKnee" | "rightKnee" | "leftFoot" | "rightFoot", Point>;
  headRadius: Point; shoulderWidth: number; hipWidth: number;
  view: string; headDirection: string; action: string; variation: string;
  bounds: { x: number; y: number; width: number; height: number };
  skin: string; hair: string; primary: string; secondary: string;
  supported?: boolean; reason?: string;
}
export function segmentPath(a: Point, b: Point, width: number) {
  const length = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
  const dx = (b[1] - a[1]) / length * width / 2, dy = (a[0] - b[0]) / length * width / 2;
  return `M${a[0] + dx},${a[1] + dy}L${b[0] + dx},${b[1] + dy}L${b[0] - dx},${b[1] - dy}L${a[0] - dx},${a[1] - dy}Z`;
}
export function modelGeometry(element: SpecElement): ModelGeometry {
  const read = (key: string) => String(modelValue(element, key) ?? "");
  const identity = read("model.identity.modelPreset");
  const child = ["boy", "girl"].includes(identity) || ["child", "teen"].includes(read("model.identity.ageGroup"));
  const shoulderWidth = ["woman", "girl"].includes(identity) ? 34 : 40;
  const hipWidth = ["woman", "girl"].includes(identity) ? 39 : 32;
  const action = read("model.pose_action.action") || "standing";
  const sitting = action === "sitting";
  const headY = 46, shoulderY = 94, hipY = sitting ? 245 : 216;
  const joints: ModelGeometry["joints"] = {
    head: [120, sitting ? headY + 26 : headY], neck: [120, sitting ? shoulderY + 12 : shoulderY - 12],
    leftShoulder: [120 - shoulderWidth, sitting ? shoulderY + 26 : shoulderY], rightShoulder: [120 + shoulderWidth, sitting ? shoulderY + 26 : shoulderY],
    leftElbow: [120 - shoulderWidth - 7, sitting ? 192 : 157], rightElbow: [120 + shoulderWidth + 7, sitting ? 192 : 157],
    leftHand: [120 - shoulderWidth - 8, sitting ? 238 : 220], rightHand: [120 + shoulderWidth + 8, sitting ? 238 : 220],
    leftHip: [120 - hipWidth / 2, hipY], rightHip: [120 + hipWidth / 2, hipY],
    leftKnee: sitting ? [162, 269] : [103, 294], rightKnee: sitting ? [203, 264] : [137, 294],
    leftFoot: sitting ? [164, 378] : [99, 378], rightFoot: sitting ? [205, 378] : [142, 378],
  };
  const palette = modelValue(element, "model.outfit.palette");
  const model:ModelGeometry = { joints, shoulderWidth, hipWidth, headRadius: child ? [27, 32] : identity === "woman" ? [21, 27] : [23, 28], view: "front", headDirection: "forward", action, variation: read(poseVariationKey(action)) || (sitting ? "upright" : action==="standing"?"neutral":""), bounds: { x: 0, y: 0, width: 240, height: 410 }, skin: ({ very_light: "#f5d7c0", light: "#e9b998", medium: "#c88d67", tan: "#ae7250", deep: "#815236", very_deep: "#503426" } as Record<string,string>)[read("model.appearance.skinTone")] ?? "#c88d67", hair: read("model.appearance.hairColor") || "#323034", primary: Array.isArray(palette) && typeof palette[0] === "string" ? palette[0] : "#63818e", secondary: Array.isArray(palette) && typeof palette[1] === "string" ? palette[1] : "#354754" };
  const status=applyPose(model,read);model.supported=status.supported;if(status.reason)model.reason=status.reason;
  if(child){
    for(const key of Object.keys(joints) as (keyof typeof joints)[])joints[key]=[120+(joints[key][0]-120)*.74,390+(joints[key][1]-390)*.74];
    model.shoulderWidth*=.74;model.hipWidth*=.74;
  }
  if(identity==="custom"){model.supported=false;model.reason="Custom identity needs an authored vector.";}
  const points=Object.values(model.joints); const minX=Math.min(0,...points.map(p=>p[0]-30)), maxX=Math.max(240,...points.map(p=>p[0]+30)), minY=Math.min(0,...points.map(p=>p[1]-40)), maxY=Math.max(410,...points.map(p=>p[1]+20));
  model.bounds={x:minX,y:minY,width:maxX-minX,height:maxY-minY};return model;
}

/** Indirect pose/identity changes are part of the same guarded edit. */
export function normalizedModelEdit(element:SpecElement,key:string,value:import("../types").ContextualValue|undefined){
 const next={...element.contextualProperties};if(value===undefined||value===null)delete next[key];else next[key]=value;
 if(element.contextualProperties?.[key]===value)return next;
 const pose="model.pose_action.", fine=["bodyDirection","bodyOrientation","headDirection","headOrientation","torsoTwist","arms","hands","legs","legStance","weightDistribution"];
 if(key===pose+"action"){
  for(const existing of Object.keys(next))if(existing.startsWith(pose)&&!["action","interactingWith","interaction"].includes(existing.slice(pose.length)))delete next[existing];
 }
 if(key.startsWith(pose)&&["standingVariation","sittingVariation","runningVariation","stride","kneelingVariation","crouchVariation","lyingVariation"].includes(key.slice(pose.length)))for(const field of fine)delete next[pose+field];
 const aliases:Record<string,string>={bodyDirection:"bodyOrientation",headDirection:"headOrientation",bodyOrientation:"bodyDirection",headOrientation:"headDirection"};
 if(key.startsWith(pose)&&aliases[key.slice(pose.length)])delete next[pose+aliases[key.slice(pose.length)]];
 if(key==="model.identity.modelPreset"&&["boy","girl"].includes(String(value))&&!["child","teen"].includes(String(next["model.identity.ageGroup"])))next["model.identity.ageGroup"]="child";
 if(key==="model.identity.modelPreset"&&["man","woman"].includes(String(value))&&["child","teen"].includes(String(next["model.identity.ageGroup"])))next["model.identity.ageGroup"]="adult";
 const locked=element.contextualProperties?.["model.references.lockFields"];
 if(Array.isArray(locked)&&locked.some(field=>typeof field==="string"&&field!==key&&JSON.stringify(next[field])!==JSON.stringify(element.contextualProperties?.[field])))return undefined;
 return next;
}
