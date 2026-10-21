import type { ModelGeometry, Point } from "./model-preview";

export const POSE_PRESETS: Record<string, { value: string; label: string }[]> = {
 standing: ["neutral","relaxed","fashion","weight_shift","hands_on_hips","arms_crossed","looking_back","turning_around","leaning"].map(value=>({value,label:value.replace(/_/g," ")})),
 sitting: ["upright","relaxed","cross_legged","sideways","leaning_forward","legs_extended"].map(value=>({value,label:value.replace(/_/g," ")})),
 walking: ["starting","mid_stride","stopping"].map(value=>({value,label:value.replace(/_/g," ")})),
 running: ["jogging","running","sprinting","dynamic"].map(value=>({value,label:value})),
 kneeling:[{value:"one_knee",label:"One knee"},{value:"both_knees",label:"Both knees"}],
 crouching:[{value:"low",label:"Low"},{value:"sports_ready",label:"Sports ready"}],
 squatting:[{value:"both_feet",label:"Both feet"}],
 reclining:[{value:"propped_on_elbow",label:"Propped on elbow"}],
 reaching:[{value:"default",label:"Reaching"}],pointing:[{value:"default",label:"Pointing"}],holding:[{value:"default",label:"Holding"}],leaning:[{value:"default",label:"Leaning"}],
};
export const POSE_VARIATION_KEYS: Record<string,string> = {standing:"standingVariation",sitting:"sittingVariation",walking:"stride",running:"runningVariation",kneeling:"kneelingVariation",crouching:"crouchVariation",squatting:"crouchVariation",reclining:"lyingVariation"};
export function poseVariationKey(action:string){return `model.pose_action.${POSE_VARIATION_KEYS[action]??"actionMoment"}`;}
export function applyPose(model:ModelGeometry, read:(key:string)=>string): { supported:boolean; reason?:string } {
 const j=model.joints, action=model.action, variation=model.variation;
 const set=(key:keyof typeof j,point:Point)=>{j[key]=point;};
 const shiftTorso=(dx:number,dy=0)=>{for(const key of ["head","neck","leftShoulder","rightShoulder","leftElbow","rightElbow","leftHand","rightHand"] as const){j[key]=[j[key][0]+dx,j[key][1]+dy];}};
 if(!POSE_PRESETS[action])return {supported:false,reason:`No local geometry for ${action}.`};
 if(variation && !["default","confident","power","contrapposto","one_foot_forward","turned_toward_camera","looking_back","perched","reclined"].includes(variation) && !POSE_PRESETS[action]!.some(p=>p.value===variation))return {supported:false,reason:`No exact local ${action} / ${variation} preset.`};
 if(action==="standing"){
  if(["relaxed","fashion","weight_shift","contrapposto","one_foot_forward"].includes(variation)){shiftTorso(variation==="fashion"?14:8);set("leftKnee",[109,296]);set("leftFoot",[125,378]);set("rightKnee",[151,298]);}
  if(variation==="arms_crossed") {set("leftElbow",[65,160]);set("leftHand",[150,153]);set("rightElbow",[177,171]);set("rightHand",[90,158]);}
  if(variation==="hands_on_hips"){set("leftElbow",[57,157]);set("leftHand",[93,202]);set("rightElbow",[183,157]);set("rightHand",[147,202]);}
  if(variation==="looking_back"){model.view="three_quarter_back_right";model.headDirection="over_right_shoulder";}
  if(["turning_around","pivoting"].includes(variation)){
   const phase=read("model.pose_action.turningPhase")||"mid_turn", left=["left","counterclockwise"].includes(read("model.pose_action.turningDirection"));
   model.view=phase==="preparing"||phase==="starting"?"three_quarter_front_right":phase==="finished"?"back":`three_quarter_back_${left?"left":"right"}`;
   set("leftKnee",[116,295]);set("leftFoot",[136,378]);set("rightFoot",[156,372]);
  }
 }
 if(action==="sitting"){
  set("leftHand",[132,246]);set("rightHand",[168,246]);
  if(variation==="cross_legged"){set("leftKnee",[195,262]);set("leftFoot",[134,312]);set("rightKnee",[132,275]);set("rightFoot",[207,324]);}
  if(variation==="relaxed"||variation==="reclined")shiftTorso(-18,7);
  if(variation==="leaning_forward")shiftTorso(27,18);
  if(variation==="sideways")model.view="right_profile";
  if(variation==="legs_extended"){set("leftFoot",[211,332]);set("rightFoot",[228,328]);}
  if(read("model.pose_action.sittingSurface")==="floor"){for(const key of Object.keys(j) as (keyof typeof j)[]) j[key]=[j[key][0],j[key][1]+65];set("leftKnee",[70,330]);set("rightKnee",[194,333]);set("leftFoot",[153,380]);set("rightFoot",[100,380]);}
 }
 if(action==="walking"||action==="running"){
  const run=action==="running", strength=variation==="sprinting"?1.3:variation==="dynamic"?1.5:variation==="jogging"?.8:1;
  shiftTorso(run?18:0,run?10:0);set("leftKnee",[120-45*strength,292]);set("leftFoot",[120-72*strength,run?348:378]);set("rightKnee",[120+40*strength,run?253:287]);set("rightFoot",[120+67*strength,run?294:378]);set("leftElbow",[72,172]);set("leftHand",[54,run?142:210]);set("rightElbow",[173,148]);set("rightHand",[199,run?107:190]);
  if(!run&&variation==="starting"){
   shiftTorso(5,-2);set("leftKnee",[107,297]);set("leftFoot",[98,378]);set("rightKnee",[140,301]);set("rightFoot",[153,371]);set("leftElbow",[79,158]);set("leftHand",[89,218]);set("rightElbow",[168,153]);set("rightHand",[177,208]);
  }
  if(!run&&variation==="stopping"){
   shiftTorso(-12,3);set("leftKnee",[110,307]);set("leftFoot",[88,366]);set("rightKnee",[169,292]);set("rightFoot",[188,378]);set("leftElbow",[70,170]);set("leftHand",[81,230]);set("rightElbow",[157,161]);set("rightHand",[168,219]);
  }
  const direction=read("model.pose_action.walkingDirection");if(direction==="away_camera")model.view="back";else if(direction==="left"||direction==="right")model.view=`${direction}_profile`;
 }
 if(["kneeling","crouching","squatting"].includes(action)){
  shiftTorso(action==="kneeling"?0:17,action==="kneeling"?55:90);set("leftHip",[102,action==="kneeling"?275:307]);set("rightHip",[137,action==="kneeling"?275:307]);set("leftKnee",[72,359]);set("rightKnee",[179,315]);set("leftFoot",[120,381]);set("rightFoot",[172,381]);
  if(action==="kneeling"&&variation==="both_knees"){set("rightKnee",[141,359]);set("rightFoot",[180,381]);}
 }
 if(action==="reclining"){
  for(const key of Object.keys(j) as (keyof typeof j)[]){const p=j[key];j[key]=[35+(p[1]-40)*.49,332-(p[0]-120)*.75];}
  set("leftElbow",[55,371]);set("leftHand",[25,379]);set("rightKnee",[177,310]);set("rightFoot",[219,370]);model.view="right_profile";
 }
 if(action==="leaning"||variation==="leaning"){shiftTorso(-26,7);set("leftHand",[48,216]);set("rightKnee",[156,294]);}
 if(action==="reaching"){set("rightElbow",[179,74]);set("rightHand",[203,22]);}
 if(action==="pointing"){set("rightElbow",[183,117]);set("rightHand",[220,110]);}
 if(action==="holding"){set("leftElbow",[66,155]);set("leftHand",[107,163]);set("rightElbow",[175,155]);set("rightHand",[138,163]);}
 // Preset first, then explicit compatible body-part overrides.
 const arms=read("model.pose_action.arms"), hands=read("model.pose_action.hands"), legs=read("model.pose_action.legs")||read("model.pose_action.legStance");
 if([arms,hands,legs,read("model.pose_action.bodyDirection"),read("model.pose_action.headDirection")].includes("custom"))return {supported:false,reason:"Custom anatomy requires an authored rig or generation."};
 if(arms==="relaxed"){set("leftElbow",[j.leftShoulder[0]-8,j.leftShoulder[1]+59]);set("leftHand",[j.leftShoulder[0]-10,j.leftShoulder[1]+118]);set("rightElbow",[j.rightShoulder[0]+8,j.rightShoulder[1]+59]);set("rightHand",[j.rightShoulder[0]+10,j.rightShoulder[1]+118]);}
 if(arms==="hands_on_hips"){set("leftElbow",[56,j.leftShoulder[1]+60]);set("leftHand",[j.leftHip[0]-8,j.leftHip[1]-18]);set("rightElbow",[184,j.rightShoulder[1]+60]);set("rightHand",[j.rightHip[0]+8,j.rightHip[1]-18]);}
 if(arms==="crossed"){set("leftElbow",[68,j.neck[1]+65]);set("leftHand",[150,j.neck[1]+59]);set("rightElbow",[173,j.neck[1]+72]);set("rightHand",[92,j.neck[1]+62]);}
 if(["raised","one_arm_raised","outstretched"].includes(arms)){set("rightElbow",[186,j.neck[1]-25]);set("rightHand",[211,arms==="outstretched"?j.neck[1]+4:j.head[1]-18]);if(arms!=="one_arm_raised"){set("leftElbow",[54,j.neck[1]-25]);set("leftHand",[27,arms==="outstretched"?j.neck[1]+4:j.head[1]-18]);}}
 if(arms==="behind_back"){set("leftHand",[112,j.leftHip[1]-8]);set("rightHand",[129,j.rightHip[1]-8]);}
 if(hands==="on_lap"||hands==="folded"||hands==="clasped"){if(action!=="sitting"&&hands==="on_lap")return{supported:false,reason:"Hands on lap requires Sitting."};set("leftHand",[124,j.leftHip[1]+3]);set("rightHand",[145,j.rightHip[1]+3]);}
 if(hands==="in_pockets"){set("leftHand",[104,j.leftHip[1]+12]);set("rightHand",[136,j.rightHip[1]+12]);}
 if(hands==="holding"){set("leftHand",[106,j.neck[1]+85]);set("rightHand",[139,j.neck[1]+85]);}
 if(legs==="crossed"&&action!=="sitting"){set("leftKnee",[134,296]);set("leftFoot",[147,378]);set("rightFoot",[105,378]);}
 if(legs==="wide_stance"||legs==="wide"){set("leftKnee",[84,294]);set("rightKnee",[160,294]);set("leftFoot",[64,378]);set("rightFoot",[182,378]);}
 if(legs==="one_bent"){set("leftKnee",[76,293]);set("leftFoot",[117,337]);}
 const weight=read("model.pose_action.weightDistribution");if(weight==="left_leg")shiftTorso(-9);if(weight==="right_leg")shiftTorso(9);
 const twist=read("model.pose_action.torsoTwist");if(twist.includes("left")){j.leftShoulder[0]+=9;j.rightShoulder[0]-=5;}if(twist.includes("right")){j.rightShoulder[0]-=9;j.leftShoulder[0]+=5;}
 const explicitView=read("model.pose_action.bodyDirection")||read("model.pose_action.bodyOrientation");if(explicitView)model.view=explicitView;
 const explicitHead=read("model.pose_action.headDirection")||read("model.pose_action.headOrientation");if(explicitHead)model.headDirection=explicitHead;
 if(model.view.includes("profile")){for(const key of Object.keys(j) as (keyof typeof j)[])j[key]=[120+(j[key][0]-120)*.65,j[key][1]];}
 else if(model.view.includes("three_quarter")){for(const key of ["leftShoulder","leftHip"] as const)j[key][0]+=10;}
 return {supported:true};
}
