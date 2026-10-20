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
