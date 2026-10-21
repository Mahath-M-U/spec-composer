import { ModelFields, ModelLivePreview, PreviewStatus, type ModelControlProps } from "./ModelPopover";
export function VariationPopover(props:ModelControlProps){return <><PreviewStatus elements={props.elements}/><ModelLivePreview element={props.elements[0]!} label="Current pose and variation"/><ModelFields {...props}/></>;}
