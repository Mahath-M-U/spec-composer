import { ModelFields, PreviewStatus, type ModelControlProps } from "./ModelPopover";
import { modelValue } from "./model-preview";
import { commitContextualEdit } from "./store";
export function OutfitPopover(props:ModelControlProps){const palette=modelValue(props.elements[0]!,"model.outfit.palette");const colors=Array.isArray(palette)?palette:["#63818e","#354754"];
 const primary=["model.outfit.category","model.outfit.garmentPreset","model.outfit.top","model.outfit.bottom","model.outfit.onePiece","model.outfit.outerwear"];
 return <><PreviewStatus elements={props.elements}/><ModelFields {...props} fields={props.fields.filter(field=>primary.includes(field.key))}/><div className="model-garment-colors">{[0,1].map(index=><label key={index}>{index===0?"Primary garment":"Secondary garment"}<input type="color" aria-label={index===0?"Primary garment color":"Secondary garment color"} value={String(colors[index]??"#354754")} onChange={event=>commitContextualEdit(props.context,"model.outfit.palette",[index===0?event.target.value:String(colors[0]??"#63818e"),index===1?event.target.value:String(colors[1]??"#354754")])}/></label>)}</div><details><summary>Styling, materials & references</summary><ModelFields {...props} fields={props.fields.filter(field=>!primary.includes(field.key)&&field.key!=="model.outfit.palette")}/></details></>;
}
