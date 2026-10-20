import { beforeEach, afterEach, expect, it, vi } from "vitest";
import { useEditorStore } from "../store";
import { createDocument } from "../templates";
import { inspectorContext } from "../inspector-properties";
import { commitContextualEdit } from "./store";
import { modelGeometry } from "./model-preview";
import { POSE_PRESETS, poseVariationKey } from "./model-poses";
const state=()=>useEditorStore.getState(),el=()=>state().doc!.elements[0]!;
const edit=(key:string,value:string)=>commitContextualEdit(inspectorContext(),key,value);
beforeEach(()=>{vi.useFakeTimers();const doc=createDocument();doc.elements=[];useEditorStore.setState({doc,selectedIds:[],selectedGroupIds:[],backgroundSelected:false,past:[],future:[]});state().addContextualElement('subjects.person');});
afterEach(()=>{vi.clearAllTimers();vi.useRealTimers();});
it.each(Object.keys(POSE_PRESETS))("computes finite fitted geometry for the %s family",action=>{
 expect(edit('model.pose_action.action',action)).toBe(action!=='standing');
 for(const preset of POSE_PRESETS[action]!){const field=poseVariationKey(action);if(!['reaching','pointing','holding','leaning'].includes(action))edit(field,preset.value);const model=modelGeometry(el());expect(model.supported).toBe(true);expect(Object.values(model.joints).flat().every(Number.isFinite)).toBe(true);for(const p of Object.values(model.joints)){expect(p[0]).toBeGreaterThanOrEqual(model.bounds.x);expect(p[0]).toBeLessThanOrEqual(model.bounds.x+model.bounds.width);}}
});
it('looking back and turning retain derived views and explicit overrides compose',()=>{
 edit('model.pose_action.standingVariation','looking_back');expect(modelGeometry(el()).view).toContain('back');expect(modelGeometry(el()).headDirection).toContain('shoulder');
 edit('model.pose_action.standingVariation','turning_around');edit('model.pose_action.turningPhase','mid_turn');edit('model.pose_action.bodyDirection','three_quarter_back_left');expect(modelGeometry(el()).view).toBe('three_quarter_back_left');
 edit('model.pose_action.arms','hands_on_hips');const hips=modelGeometry(el()).joints;edit('model.pose_action.arms','crossed');expect(modelGeometry(el()).joints.leftHand).not.toEqual(hips.leftHand);
 edit('model.pose_action.action','sitting');expect(el().contextualProperties!['model.pose_action.turningPhase']).toBeUndefined();expect(el().contextualProperties!['model.outfit.palette']).toEqual(['#63818e','#354754']);
});
it('respects locked indirect pose changes and normalizes child identity',()=>{
 edit('model.pose_action.standingVariation','looking_back');commitContextualEdit(inspectorContext(),'model.references.lockFields',['model.pose_action.standingVariation']);expect(edit('model.pose_action.action','sitting')).toBe(false);expect(modelGeometry(el()).action).toBe('standing');
 edit('model.identity.ageGroup','adult');edit('model.identity.modelPreset','girl');expect(el().contextualProperties!['model.identity.ageGroup']).toBe('child');
});
it('reports exact unsupported custom combinations rather than neutral geometry',()=>{edit('model.pose_action.action','custom');expect(modelGeometry(el()).supported).toBe(false);expect(modelGeometry(el()).reason).toContain('local geometry');});
