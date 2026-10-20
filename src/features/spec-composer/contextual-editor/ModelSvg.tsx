import type { SpecElement } from "../types";
import { modelGeometry, segmentPath, type Point } from "./model-preview";

export function ModelSvg({ element }: { element: SpecElement }) {
  const model = modelGeometry(element), j = model.joints;
  const back=model.view.includes("back"), profile=model.view.includes("profile"), faceBack=back&&!model.headDirection.includes("shoulder")&&model.headDirection!=="toward_camera";
  const direction=model.view.includes("left")?-1:1, headX=j.head[0]+(model.headDirection.includes("left")?-5:model.headDirection.includes("right")?5:0), headY=j.head[1]+(model.headDirection==="down"?7:model.headDirection==="up"?-7:0);
  if(model.supported===false)return <svg xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Model preview unavailable" viewBox="0 0 240 410" width="100%" height="100%"><rect x="8" y="8" width="224" height="394" rx="12" fill="none" stroke="currentColor" strokeDasharray="5 5"/><text x="120" y="190" textAnchor="middle" fill="currentColor" fontSize="13">Preview unavailable</text><text x="120" y="212" textAnchor="middle" fill="currentColor" fontSize="9">Choose a supported pose combination</text></svg>;
  const limb = (name: string, start: Point, bend: Point, end: Point, color: string, width: number) => <g key={name} data-part={name} fill={color}><path d={segmentPath(start,bend,width)} /><circle cx={bend[0]} cy={bend[1]} r={width / 2} /><path d={segmentPath(bend,end,width * .87)} /></g>;
  const torso = `M${j.leftShoulder[0]},${j.leftShoulder[1]}Q120,${j.neck[1]-5} ${j.rightShoulder[0]},${j.rightShoulder[1]}L${j.rightHip[0]+8},${j.rightHip[1]+8}Q120,${j.leftHip[1]+17} ${j.leftHip[0]-8},${j.leftHip[1]+8}Z`;
  return <svg xmlns="http://www.w3.org/2000/svg" role="img" aria-label={`Editable vector model, ${model.action}`} viewBox={`${model.bounds.x} ${model.bounds.y} ${model.bounds.width} ${model.bounds.height}`} preserveAspectRatio="xMidYMax meet" width="100%" height="100%" style={{opacity: element.style.opacity, overflow:"hidden"}}>
    <g strokeLinejoin="round" strokeLinecap="round">
      {limb("left-leg",j.leftHip,j.leftKnee,j.leftFoot,model.secondary,23)}
      {limb("right-leg",j.rightHip,j.rightKnee,j.rightFoot,model.secondary,23)}
      <path data-part="pelvis" d={`M${j.leftHip[0]-9},${j.leftHip[1]-13}L${j.rightHip[0]+9},${j.rightHip[1]-13}L${j.rightHip[0]+9},${j.rightHip[1]+15}L${j.leftHip[0]-9},${j.leftHip[1]+15}Z`} fill={model.secondary}/>
      <path data-part="neck" d={segmentPath(j.head,j.neck,15)} fill={model.skin}/>
      <path data-part="upper-garment" d={torso} fill={model.primary}/>
      {back&&<path d={`M120,${j.neck[1]+9}L120,${j.leftHip[1]-12}`} stroke={model.secondary} strokeWidth="1.5" fill="none"/>}
      {limb("left-arm",j.leftShoulder,j.leftElbow,j.leftHand,model.skin,15)}
      {limb("right-arm",j.rightShoulder,j.rightElbow,j.rightHand,model.skin,15)}
      {[j.leftShoulder,j.rightShoulder].map((point,index)=><path key={index} data-part="sleeve" d={segmentPath(point,index===0?j.leftElbow:j.rightElbow,20)} fill={model.primary}/>)}
      {[j.leftHand,j.rightHand].map((point,index)=><ellipse key={index} data-part="hand" cx={point[0]} cy={point[1]+3} rx="7" ry="10" fill={model.skin}/>)}
      {[j.leftFoot,j.rightFoot].map((point,index)=><path key={index} data-part="footwear" d={`M${point[0]-9},${point[1]-5}Q${point[0]+15},${point[1]-8} ${point[0]+20},${point[1]+8}L${point[0]-10},${point[1]+8}Z`} fill="#262c35"/>)}
      <g transform={`translate(${headX-j.head[0]} ${headY-j.head[1]})`}>
      {profile?<path data-part="head-profile" d={`M${j.head[0]-direction*16},${j.head[1]-24}Q${j.head[0]+direction*18},${j.head[1]-30} ${j.head[0]+direction*16},${j.head[1]-4}L${j.head[0]+direction*26},${j.head[1]+5}L${j.head[0]+direction*16},${j.head[1]+9}Q${j.head[0]+direction*14},${j.head[1]+33} ${j.head[0]-direction*12},${j.head[1]+23}Z`} fill={model.skin}/>:<ellipse data-part="head" cx={j.head[0]} cy={j.head[1]} rx={model.headRadius[0]} ry={model.headRadius[1]} fill={model.skin}/>}
      <path data-part="hair" d={`M${j.head[0]-model.headRadius[0]},${j.head[1]-3}Q${j.head[0]-30},${j.head[1]-38} ${j.head[0]},${j.head[1]-31}Q${j.head[0]+29},${j.head[1]-30} ${j.head[0]+model.headRadius[0]},${j.head[1]-3}Q${j.head[0]},${j.head[1]-21} ${j.head[0]-model.headRadius[0]},${j.head[1]-3}Z`} fill={model.hair}/>
      {faceBack?<ellipse data-part="back-of-head" cx={j.head[0]} cy={j.head[1]} rx={model.headRadius[0]} ry={model.headRadius[1]-2} fill={model.hair}/>:<g data-part="face" fill="#28272c">{!profile&&<circle cx={j.head[0]-7} cy={j.head[1]} r="1.8"/>}<circle cx={j.head[0]+(profile?direction*12:7)} cy={j.head[1]} r="1.8"/><path d={`M${j.head[0]-5},${j.head[1]+12}Q${j.head[0]},${j.head[1]+14} ${j.head[0]+5},${j.head[1]+12}`} fill="none" stroke="#784b3d" strokeWidth="1.5"/></g>}
      </g>
    </g>
  </svg>;
}
