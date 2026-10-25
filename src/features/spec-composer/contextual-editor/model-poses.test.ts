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
it.each(['walking','running'])('keeps %s upper arms on their shoulder sides before explicit overrides',action=>{
 edit('model.pose_action.action',action);const joints=modelGeometry(el()).joints;
 const center=(joints.leftShoulder[0]+joints.rightShoulder[0])/2;expect(joints.leftElbow[0]).toBeLessThan(center);expect(joints.rightElbow[0]).toBeGreaterThan(center);
 const overridden={...el(),contextualProperties:{...el().contextualProperties,'model.pose_action.arms':'crossed'}};const crossed=modelGeometry(overridden).joints;
 expect(crossed.leftHand[0]).toBeGreaterThan(crossed.rightHand[0]);expect(crossed.leftElbow).not.toEqual(joints.leftElbow);
});
it('makes starting, mid-stride and stopping readable distinct walking phases before fine overrides',()=>{
 edit('model.pose_action.action','walking');const phases=['starting','mid_stride','stopping'].map(value=>{edit('model.pose_action.stride',value);return modelGeometry(el()).joints;});
 const [start,mid,stop]=phases as [typeof phases[number],typeof phases[number],typeof phases[number]];
 const separation=(j:typeof start)=>Math.abs(j.rightFoot[0]-j.leftFoot[0]);expect(separation(start)).toBeCloseTo(55);expect(separation(mid)).toBeCloseTo(139);expect(separation(stop)).toBeCloseTo(100);
 expect(start.rightFoot[1]).toBeLessThan(start.leftFoot[1]);expect(stop.leftFoot[1]).toBeLessThan(stop.rightFoot[1]);expect(stop.head[0]).toBeLessThan(start.head[0]);
 expect(new Set(phases.map(j=>JSON.stringify([j.leftElbow,j.rightElbow,j.leftHand,j.rightHand]))).size).toBe(3);
 const crossed={...el(),contextualProperties:{...el().contextualProperties,'model.pose_action.arms':'crossed'}};expect(modelGeometry(crossed).joints.leftHand[0]).toBeGreaterThan(modelGeometry(crossed).joints.rightHand[0]);
});
it.each(Object.keys(POSE_PRESETS))('scales the complete %s child pose after composing adult joints',action=>{
 const properties={'model.pose_action.action':action,'model.identity.modelPreset':'woman','model.identity.ageGroup':'adult'};
 const adult=modelGeometry({...el(),contextualProperties:properties}),child=modelGeometry({...el(),contextualProperties:{...properties,'model.identity.modelPreset':'girl','model.identity.ageGroup':'child'}});
 expect(child.supported).toBe(adult.supported);for(const key of Object.keys(adult.joints) as (keyof typeof adult.joints)[]){expect(child.joints[key][0]).toBeCloseTo(120+(adult.joints[key][0]-120)*.74);expect(child.joints[key][1]).toBeCloseTo(390+(adult.joints[key][1]-390)*.74);}
 expect(child.shoulderWidth).toBeCloseTo(adult.shoulderWidth*.74);expect(child.hipWidth).toBeCloseTo(adult.hipWidth*.74);expect(child.headRadius[1]).toBeGreaterThan(adult.headRadius[1]);
});
