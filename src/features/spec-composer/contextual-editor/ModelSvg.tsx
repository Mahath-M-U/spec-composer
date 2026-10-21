import type { SpecElement } from "../types";
import { modelGeometry, modelValue, PORTRAIT_SHOTS, type Point } from "./model-preview";
import { ModelHeadArtwork } from "./ModelArtwork";

// Curved tapered contours follow the existing rig without changing stored geometry.
function taperedPath(a: Point, b: Point, startWidth: number, endWidth: number) {
  const length = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
  const nx = (b[1] - a[1]) / length, ny = (a[0] - b[0]) / length;
  const p = (point: Point, amount: number) => `${point[0] + nx * amount},${point[1] + ny * amount}`;
  const mid: Point = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
  return `M${p(a,startWidth/2)}Q${p(mid,(startWidth+endWidth)*.31)} ${p(b,endWidth/2)}Q${b[0]},${b[1]+2} ${p(b,-endWidth/2)}Q${p(mid,-(startWidth+endWidth)*.28)} ${p(a,-startWidth/2)}Q${a[0]},${a[1]-2} ${p(a,startWidth/2)}Z`;
}
const midpoint = (a: Point, b: Point, amount: number): Point => [a[0] + (b[0] - a[0]) * amount, a[1] + (b[1] - a[1]) * amount];

export function ModelSvg({ element, thumbnail = false }: { element: SpecElement; thumbnail?: boolean }) {
  const model = modelGeometry(element), j = model.joints;
  const back = model.view.includes("back"), profile = model.view.includes("profile"), faceBack = back && !model.headDirection.includes("shoulder") && model.headDirection !== "toward_camera";
  const direction = model.view.includes("left") ? -1 : 1;
  const headX = j.head[0] + (model.headDirection.includes("left") ? -5 : model.headDirection.includes("right") ? 5 : 0), headY = j.head[1] + (model.headDirection === "down" ? 7 : model.headDirection === "up" ? -7 : 0);
  if (model.supported === false) return <svg xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Model preview unavailable" viewBox="0 0 240 410" width="100%" height="100%"><rect x="8" y="8" width="224" height="394" rx="12" fill="none" stroke="currentColor" strokeDasharray="5 5"/><text x="120" y="190" textAnchor="middle" fill="currentColor" fontSize="13">Preview unavailable</text><text x="120" y="212" textAnchor="middle" fill="currentColor" fontSize="9">Choose a supported pose combination</text></svg>;
  const limb = (name: string, start: Point, bend: Point, end: Point, color: string, width: number) => <g key={name} data-part={name} fill={color} stroke="#242126" strokeWidth="1.25">
    <path d={taperedPath(start,bend,width,width*.84)}/><path d={taperedPath(bend,end,width*.84,width*.58)}/>
    <path d={`M${bend[0]+width*.2},${bend[1]+3}Q${(bend[0]+end[0])/2+width*.2},${(bend[1]+end[1])/2} ${end[0]+width*.18},${end[1]-3}`} fill="none" stroke="#242126" strokeOpacity=".13" strokeWidth={width*.2}/>
  </g>;
  const shoulderMid = midpoint(j.leftShoulder,j.rightShoulder,.5), hipMid = midpoint(j.leftHip,j.rightHip,.5);
  // Include the full sourced hair/neck containers when head offsets extend past
  // the rig's joint padding (for example, a bun with the head tilted upward).
  const sourceHead = !profile && !faceBack;
  const bounds = {
    x: Math.min(model.bounds.x, sourceHead ? headX-model.headRadius[0]*200/115 : model.bounds.x),
    y: Math.min(model.bounds.y, sourceHead ? headY-model.headRadius[1]*205/140 : model.bounds.y),
    right: Math.max(model.bounds.x+model.bounds.width, sourceHead ? headX+model.headRadius[0]*180/115 : model.bounds.x+model.bounds.width),
    bottom: Math.max(model.bounds.y+model.bounds.height, sourceHead ? headY+model.headRadius[1]*190/140 : model.bounds.y+model.bounds.height),
  };
  if(thumbnail){
    const points=Object.values(j), padding=6;
    bounds.x=Math.min(...points.map(point=>point[0]-18),headX-(sourceHead?model.headRadius[0]*200/115:28))-padding;
    bounds.y=Math.min(...points.map(point=>point[1]-18),headY-(sourceHead?model.headRadius[1]*205/140:34))-padding;
    bounds.right=Math.max(...points.map(point=>point[0]+23),headX+(sourceHead?model.headRadius[0]*180/115:28))+padding;
    bounds.bottom=Math.max(...points.map(point=>point[1]+18),headY+(sourceHead?model.headRadius[1]*190/140:34))+padding;
  }
  if(!thumbnail && PORTRAIT_SHOTS.includes(String(modelValue(element,"model.framing.shot")))){
    const padding=6;
    bounds.x=Math.min(headX-(sourceHead?model.headRadius[0]*200/115:28),j.leftShoulder[0]-18)-padding;
    bounds.y=headY-(sourceHead?model.headRadius[1]*205/140:34)-padding;
    bounds.right=Math.max(headX+(sourceHead?model.headRadius[0]*180/115:28),j.rightShoulder[0]+18)+padding;
    bounds.bottom=Math.max(j.leftShoulder[1],j.rightShoulder[1])+(hipMid[1]-shoulderMid[1])*0.45+padding;
  }
  const torso = `M${j.leftShoulder[0]},${j.leftShoulder[1]-2}Q${shoulderMid[0]-12},${j.neck[1]+5} ${shoulderMid[0]},${j.neck[1]+8}Q${shoulderMid[0]+12},${j.neck[1]+5} ${j.rightShoulder[0]},${j.rightShoulder[1]-2}C${j.rightShoulder[0]+6},${j.rightShoulder[1]+35} ${j.rightHip[0]+2},${j.rightHip[1]-20} ${j.rightHip[0]+8},${j.rightHip[1]+6}Q${hipMid[0]},${hipMid[1]+14} ${j.leftHip[0]-8},${j.leftHip[1]+6}C${j.leftHip[0]-2},${j.leftHip[1]-20} ${j.leftShoulder[0]-6},${j.leftShoulder[1]+35} ${j.leftShoulder[0]},${j.leftShoulder[1]-2}Z`;
  return <svg xmlns="http://www.w3.org/2000/svg" role="img" aria-label={`Editable vector model, ${model.action}`} viewBox={`${bounds.x} ${bounds.y} ${bounds.right-bounds.x} ${bounds.bottom-bounds.y}`} preserveAspectRatio="xMidYMax meet" width="100%" height="100%" style={{opacity:element.style.opacity,overflow:"hidden"}}>
    <g strokeLinejoin="round" strokeLinecap="round">
      {limb("left-leg",j.leftHip,j.leftKnee,j.leftFoot,model.secondary,27)}
      {limb("right-leg",j.rightHip,j.rightKnee,j.rightFoot,model.secondary,27)}
      <path data-part="pelvis" d={`M${j.leftHip[0]-10},${j.leftHip[1]-12}Q${hipMid[0]},${hipMid[1]-17} ${j.rightHip[0]+10},${j.rightHip[1]-12}L${j.rightHip[0]+11},${j.rightHip[1]+17}Q${hipMid[0]},${hipMid[1]+10} ${j.leftHip[0]-11},${j.leftHip[1]+17}Z`} fill={model.secondary} stroke="#242126" strokeWidth="1.25"/>
      <path d={`M${hipMid[0]},${hipMid[1]+5}L${hipMid[0]+1},${hipMid[1]+22}`} fill="none" stroke="#242126" strokeWidth="1.1"/>
      <path data-part="neck" d={taperedPath([headX,headY+20],[j.neck[0],j.neck[1]+14],16,19)} fill={model.skin} stroke="#242126" strokeWidth="1.1"/>
      <path data-part="upper-garment" d={torso} fill={model.primary} stroke="#242126" strokeWidth="1.4"/>
      <path d={`M${j.leftShoulder[0]+9},${j.leftShoulder[1]+20}Q${j.leftHip[0]+7},${j.leftHip[1]-22} ${j.leftHip[0]+2},${j.leftHip[1]+3}`} stroke="#242126" strokeOpacity=".14" strokeWidth="7" fill="none"/>
      <path d={`M${j.leftHip[0]-4},${j.leftHip[1]+2}Q${hipMid[0]},${hipMid[1]+9} ${j.rightHip[0]+4},${j.rightHip[1]+2}`} stroke="#242126" strokeOpacity=".4" strokeWidth="1.2" fill="none"/>
      {back && <path d={`M${shoulderMid[0]},${j.neck[1]+17}Q${hipMid[0]-3},${hipMid[1]-40} ${hipMid[0]},${hipMid[1]-8}`} stroke="#242126" strokeOpacity=".5" strokeWidth="1.2" fill="none"/>}
      {limb("left-arm",j.leftShoulder,j.leftElbow,j.leftHand,model.skin,17)}
      {limb("right-arm",j.rightShoulder,j.rightElbow,j.rightHand,model.skin,17)}
      {[j.leftShoulder,j.rightShoulder].map((point,index)=><path key={index} data-part="sleeve" d={taperedPath(point,midpoint(point,index===0?j.leftElbow:j.rightElbow,.42),25,22)} fill={model.primary} stroke="#242126" strokeWidth="1.3"/>)}
      {[j.leftHand,j.rightHand].map((point,index)=>{const elbow=index===0?j.leftElbow:j.rightElbow,angle=Math.atan2(point[1]-elbow[1],point[0]-elbow[0])*180/Math.PI-90;return <g key={index} data-part="hand" transform={`translate(${point[0]} ${point[1]}) rotate(${angle})`}><path d="M-4,-4C-7,-1 -6,4 -5,9Q-4,13 -1,12L4,10Q7,8 6,4L5,0Q9,4 10,1Q10,-1 6,-5Z" fill={model.skin} stroke="#242126" strokeWidth="1.05"/><path d="M-2,6L-1,10M1,5L2,9" fill="none" stroke="#242126" strokeOpacity=".4" strokeWidth=".7"/></g>;})}
      {[j.leftFoot,j.rightFoot].map((point,index)=><g key={index} data-part="footwear" transform={`translate(${point[0]} ${point[1]})`}><path d="M-8,-7Q-2,-9 5,-5L9,0Q20,2 20,7Q11,11 -10,8L-10,1Z" fill="#34323b" stroke="#242126" strokeWidth="1.3"/><path d="M-9,6Q7,9 18,6" fill="none" stroke="#e8e2dc" strokeWidth="2.2"/><path d="M3,-2L8,0M0,1L5,3" stroke="#e8e2dc" strokeWidth=".8"/></g>)}
      {profile || faceBack ? <g transform={`translate(${headX} ${headY})`}>
        {profile ? <path data-part="head-profile" d={`M${-direction*15},-24Q${direction*19},-28 ${direction*16},-5L${direction*25},4Q${direction*27},8 ${direction*16},10Q${direction*13},30 ${-direction*12},24L${-direction*17},9Z`} fill={model.skin} stroke="#242126" strokeWidth="1.3"/> : <path data-part="back-of-head" d="M-22,5C-29,-31 22,-34 24,-3Q27,25 10,29L-13,25Z" fill={model.hair} stroke="#242126" strokeWidth="1.3"/>}
        <path data-part="hair" d="M-22,3Q-30,-29 -4,-31Q23,-35 23,-7Q10,-23 -9,-16L-14,5Z" fill={model.hair} stroke="#242126" strokeWidth="1.2"/>
        {!faceBack && <g data-part="profile-face"><path d={`M${direction*10},-1L${direction*12},-1M${direction*12},15L${direction*17},14`} stroke="#242126" strokeWidth="1.4"/><path d={`M${-direction*9},3Q${-direction*17},-1 ${-direction*13},9`} fill="none" stroke="#242126" strokeWidth="1.1"/></g>}
      </g> : <g data-part="illustrated-head" transform={`translate(${headX} ${headY}) scale(${model.headRadius[0]/115} ${model.headRadius[1]/140}) translate(-306 -245)`}><ModelHeadArtwork element={element} skin={model.skin} hair={model.hair}/></g>}
    </g>
  </svg>;
}
