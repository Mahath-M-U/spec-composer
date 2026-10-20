import { ModelFields, PreviewStatus, type ModelControlProps } from "./ModelPopover";
export function VariationPopover(props:ModelControlProps){return <><PreviewStatus elements={props.elements}/><ModelFields {...props}/></>;}
