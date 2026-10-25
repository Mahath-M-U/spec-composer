import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, afterEach, expect, it, vi } from "vitest";
import { useEditorStore } from "../store";
import { createDocument } from "../templates";
import { inspectorContext } from "../inspector-properties";
import { ElementContent } from "../static-render";
import { parseSpecDocument } from "../types";
import { commitContextualEdit } from "./store";
import { modelSource, modelGeometry } from "./model-preview";
import { ModelSvg } from "./ModelSvg";
const state=()=>useEditorStore.getState();
const selected=()=>state().doc!.elements[0]!;
const paths=()=>renderToStaticMarkup(createElement(ElementContent,{el:selected()})).match(/\bd="[^"]+"/g);
beforeEach(()=>{vi.useFakeTimers();const doc=createDocument();doc.elements=[];useEditorStore.setState({doc,selectedIds:[],selectedGroupIds:[],backgroundSelected:false,past:[],future:[]});});
afterEach(()=>{vi.clearAllTimers();vi.useRealTimers();});
it("phase1 gate: insert, Man to Woman and standing to sitting change real paths on one stable layer",()=>{
 state().addContextualElement('subjects.person',{x:80,y:90});
 state().mutate(doc=>{const el=doc.elements[0]!;el.rotation=17;el.contextualProperties!['relation.targets']=[];});
 const geometry=({id,x,y,width,height,rotation,zIndex}:ReturnType<typeof selected>)=>({id,x,y,width,height,rotation,zIndex});
 const original=geometry(selected()),standing=paths();
 expect(modelSource(selected())).toBe('editable_vector');
 expect(commitContextualEdit(inspectorContext(),'model.identity.modelPreset','woman')).toBe(true);
 expect(paths()).not.toEqual(standing);const woman=paths();
 expect(commitContextualEdit(inspectorContext(),'model.pose_action.action','sitting')).toBe(true);
 expect(paths()).not.toEqual(woman);expect(modelGeometry(selected()).joints.leftKnee[0]).toBeGreaterThan(modelGeometry(selected()).joints.leftHip[0]+30);
 expect(geometry(selected())).toEqual(original);expect(state().doc!.elements).toHaveLength(1);expect(selected().contextualProperties!['relation.targets']).toEqual([]);
 const seated=paths();state().undo();expect(paths()).toEqual(woman);state().redo();expect(paths()).toEqual(seated);
 const loaded=parseSpecDocument(JSON.parse(JSON.stringify(state().doc)))!;expect(loaded.elements[0]!.contextualProperties).toEqual(selected().contextualProperties);
});
it("preserves every externally supplied source and never assumes uploaded SVG has a rig",()=>{
 state().addContextualElement('subjects.person');
 for(const src of ['data:image/png;base64,provided','data:image/svg+xml;base64,provided']){
 state().mutate(doc=>{doc.elements[0]!.src=src;});
 const html=renderToStaticMarkup(createElement(ElementContent,{el:selected()}));expect(html).toContain(src);expect(html).not.toContain('Editable vector model');expect(modelSource(selected())).not.toBe('editable_vector');
 }
});
it("updates sourced identity, fine poses and palette without mutating layer geometry",()=>{
 state().addContextualElement('subjects.person');
 const render=()=>renderToStaticMarkup(createElement(ModelSvg,{element:selected()}));
 const original={x:selected().x,y:selected().y,width:selected().width,height:selected().height};
 const standing=render();expect(standing).toContain('data-artwork="croods"');
 commitContextualEdit(inspectorContext(),'model.identity.modelPreset','woman');const woman=render();expect(woman).toContain('data-hairstyle="long"');expect(woman).not.toEqual(standing);
 commitContextualEdit(inspectorContext(),'model.pose_action.standingVariation','arms_crossed');expect(render()).not.toEqual(woman);
 commitContextualEdit(inspectorContext(),'model.outfit.palette',['#ea6845','#24334a']);expect(render()).toContain('fill="#ea6845"');expect(render()).toContain('fill="#24334a"');
 expect({x:selected().x,y:selected().y,width:selected().width,height:selected().height}).toEqual(original);
 for(const action of ['standing','sitting','running']){commitContextualEdit(inspectorContext(),'model.pose_action.action',action);expect(render()).not.toMatch(/NaN|Infinity/);expect(render()).toContain(`Editable vector model, ${action}`);}
 commitContextualEdit(inspectorContext(),'model.pose_action.action','standing');
 commitContextualEdit(inspectorContext(),'model.pose_action.bodyDirection','right_profile');expect(render()).toContain('data-part="head-profile"');expect(render()).not.toContain('data-artwork-part="face"');
 commitContextualEdit(inspectorContext(),'model.pose_action.bodyDirection','back');expect(render()).toContain('data-part="back-of-head"');expect(render()).not.toContain('data-artwork-part="face"');
});
it("fits the sourced hair container when looking upward without changing stored bounds",()=>{
 state().addContextualElement('subjects.person');const element={...selected(),contextualProperties:{...selected().contextualProperties,'model.appearance.hairStyle':'bun','model.pose_action.headDirection':'up'}};
 const html=renderToStaticMarkup(createElement(ModelSvg,{element}));const viewBox=html.match(/viewBox="([^"]+)"/)![1]!.split(' ').map(Number);
 expect(viewBox.every(Number.isFinite)).toBe(true);expect(viewBox[1]).toBeLessThan(0);expect(modelGeometry(element).bounds.y).toBe(0);
});
it("restores adult proportions on Girl to Woman while preserving the layer and respecting an age lock",()=>{
 state().addContextualElement('subjects.person');const context=()=>inspectorContext();
 commitContextualEdit(context(),'model.identity.modelPreset','girl');const child=modelGeometry(selected());
 const layer=({id,x,y,width,height,rotation,zIndex}:ReturnType<typeof selected>)=>({id,x,y,width,height,rotation,zIndex}),before=layer(selected());
 commitContextualEdit(context(),'model.identity.modelPreset','woman');const adult=modelGeometry(selected());
 expect(selected().contextualProperties!['model.identity.ageGroup']).toBe('adult');expect(layer(selected())).toEqual(before);
 expect(adult.joints.leftFoot[1]-adult.joints.head[1]).toBeGreaterThan((child.joints.leftFoot[1]-child.joints.head[1])*1.3);
 expect(child.headRadius[1]).toBeGreaterThan(adult.headRadius[1]);
 commitContextualEdit(context(),'model.identity.modelPreset','girl');commitContextualEdit(context(),'model.references.lockFields',['model.identity.ageGroup']);
 expect(commitContextualEdit(context(),'model.identity.modelPreset','woman')).toBe(false);expect(selected().contextualProperties!['model.identity.modelPreset']).toBe('girl');expect(selected().contextualProperties!['model.identity.ageGroup']).toBe('child');
});
it.each([['woman','long'],['girl','bun']])('renders an existing saved %s with default side-part styling correctly before any edit',(identity,hairstyle)=>{
 state().addContextualElement('subjects.person');state().mutate(doc=>{doc.elements[0]!.contextualProperties!['model.identity.modelPreset']=identity!;});
 expect(selected().contextualProperties!['model.appearance.hairStyle']).toBe('side_part');
 const before=JSON.stringify({doc:state().doc,past:state().past,future:state().future});
 expect(renderToStaticMarkup(createElement(ElementContent,{el:selected()}))).toContain(`data-hairstyle="${hairstyle}"`);
 expect(JSON.stringify({doc:state().doc,past:state().past,future:state().future})).toBe(before);
 expect(commitContextualEdit(inspectorContext(),'model.appearance.hairStyle','pixie')).toBe(true);
 expect(renderToStaticMarkup(createElement(ElementContent,{el:selected()}))).toContain('data-hairstyle="pixie"');
});
it.each([
 {},
 {'model.pose_action.action':'sitting'},
 {'model.identity.modelPreset':'girl','model.identity.ageGroup':'child'},
])('crops to a head-and-shoulders viewBox for headshot framing without changing stored geometry (%#)',properties=>{
 state().addContextualElement('subjects.person');state().mutate(doc=>{const el=doc.elements[0]!;el.contextualProperties={...el.contextualProperties,...properties};el.x=12;el.y=18;el.width=150;el.height=260;el.rotation=5;});
 const layer=({id,x,y,width,height,rotation}:ReturnType<typeof selected>)=>({id,x,y,width,height,rotation}),before=layer(selected());
 const render=()=>renderToStaticMarkup(createElement(ModelSvg,{element:selected()}));
 const original=render().match(/viewBox="([^"]+)"/)![1]!.split(' ').map(Number);
 expect(commitContextualEdit(inspectorContext(),'model.framing.shot','headshot')).toBe(true);
 const html=render();expect(html).not.toMatch(/NaN|Infinity/);
 const [x,y,width,height]=html.match(/viewBox="([^"]+)"/)![1]!.split(' ').map(Number) as [number,number,number,number];
 expect(height).toBeLessThan(original[3]!);
 const geometry=modelGeometry(selected());
 expect(y+height).toBeLessThan(geometry.joints.leftHip[1]);
 expect(y).toBeLessThanOrEqual(geometry.joints.head[1]-geometry.headRadius[1]);
 expect(layer(selected())).toEqual(before);
 state().undo();expect(render().match(/viewBox="([^"]+)"/)![1]).toBe(original.join(' '));
});
it.each(['standing','sitting','running','reaching'])('fits the full %s thumbnail silhouette including hair, hands and shoes',action=>{
 state().addContextualElement('subjects.person');const subject={...selected(),contextualProperties:{'model.identity.modelPreset':'girl','model.identity.ageGroup':'child','model.pose_action.action':action,'model.appearance.hairStyle':'bun','model.pose_action.headDirection':'up'}};
 const html=renderToStaticMarkup(createElement(ModelSvg,{element:subject,thumbnail:true}));expect(html).not.toMatch(/NaN|Infinity/);
 const [x,y,width,height]=html.match(/viewBox="([^"]+)"/)![1]!.split(' ').map(Number) as [number,number,number,number];
 const model=modelGeometry(subject);for(const point of Object.values(model.joints)){expect(point[0]-14).toBeGreaterThanOrEqual(x);expect(point[0]+20).toBeLessThanOrEqual(x+width);expect(point[1]+14).toBeLessThanOrEqual(y+height);}
 expect(model.joints.head[1]-7-model.headRadius[1]*205/140).toBeGreaterThanOrEqual(y);
});
