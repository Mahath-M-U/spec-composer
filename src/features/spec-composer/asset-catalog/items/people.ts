import type { AssetItem } from "../types.ts";

const BUST_SIZE = { w: 0.4, aspect: 400 / 500 };

/** People presets: the original 17 human-model slots, with their
 * descriptions rewritten to at least 60 characters, plus 5 silhouette
 * variants of the most commonly used poses. */
export const peopleItems: AssetItem[] = [
  {
    id: "people-woman",
    label: "Woman",
    category: "people",
    kind: "humanModelImage",
    tags: ["people", "woman", "portrait", "model"],
    prompt:
      "Full-length editorial portrait of a confident woman in a tailored camel coat standing against a seamless neutral backdrop, soft directional studio light",
    art: "person-standing",
    popularRank: 10,
  },
  {
    id: "people-man",
    label: "Man",
    category: "people",
    kind: "humanModelImage",
    tags: ["people", "man", "portrait", "model"],
    prompt:
      "Full-length portrait of a man in a sharply tailored blazer and trousers, standing relaxed against a seamless neutral backdrop, soft even studio light",
    art: "person-man",
  },
  {
    id: "people-child",
    label: "Child",
    category: "people",
    kind: "humanModelImage",
    tags: ["people", "child", "kid", "portrait"],
    prompt:
      "Candid full-length shot of a joyful child in a striped t-shirt and shorts, mid-laugh while holding a single balloon, bright natural daylight",
    art: "person-child",
  },
  {
    id: "people-elder",
    label: "Older adult",
    category: "people",
    kind: "humanModelImage",
    tags: ["people", "elder", "senior", "portrait"],
    prompt:
      "Warm full-length portrait of a smiling older man with a neatly trimmed grey beard, leaning lightly on a wooden walking cane, soft natural light",
    art: "person-elder",
  },
  {
    id: "people-family",
    label: "Family",
    category: "people",
    kind: "humanModelImage",
    tags: ["people", "family", "group", "portrait"],
    prompt:
      "Relaxed full-length portrait of a family of three standing close together outdoors, warm candid smiles, soft golden-hour natural light",
    art: "family",
  },
  {
    id: "people-active-woman",
    label: "Woman, active",
    category: "people",
    kind: "humanModelImage",
    tags: ["people", "woman", "active", "fitness"],
    prompt:
      "Dynamic action shot of a woman mid-jump in bright activewear, arms raised with energy, captured against a clean studio backdrop with crisp light",
    art: "person-active",
  },
  {
    id: "people-active-man",
    label: "Man, active",
    category: "people",
    kind: "humanModelImage",
    tags: ["people", "man", "active", "fitness"],
    prompt:
      "Dynamic action shot of a man mid-jump in bright activewear, arms raised with energy, captured against a clean studio backdrop with crisp light",
    art: "person-active-man",
  },
  {
    id: "people-seated",
    label: "Seated",
    category: "people",
    kind: "humanModelImage",
    tags: ["people", "seated", "meditate", "calm"],
    prompt:
      "Calm full-length shot of a person seated cross-legged in a relaxed meditative pose, eyes closed, soft diffused natural window light",
    art: "person-meditate",
  },
  {
    id: "people-wheelchair",
    label: "Wheelchair user",
    category: "people",
    kind: "humanModelImage",
    tags: ["people", "wheelchair", "accessibility", "portrait"],
    prompt:
      "Confident full-length portrait of a person using a wheelchair, warm genuine smile, captured outdoors in bright natural daylight",
    art: "person-wheelchair",
  },
  {
    id: "people-half-body-woman",
    label: "Half-body, woman",
    category: "people",
    kind: "humanModelImage",
    tags: ["people", "woman", "half-body", "bust"],
    prompt:
      "Half-body editorial portrait of a woman with long flowing hair, relaxed confident posture, soft editorial studio lighting on a neutral backdrop",
    art: "bust-woman",
    size: BUST_SIZE,
    style: { objectFit: "cover" },
  },
  {
    id: "people-half-body-man",
    label: "Half-body, man",
    category: "people",
    kind: "humanModelImage",
    tags: ["people", "man", "half-body", "bust"],
    prompt:
      "Half-body editorial portrait of a bearded man in a tailored blazer, relaxed confident posture, soft editorial studio lighting on a neutral backdrop",
    art: "bust-man",
    size: BUST_SIZE,
    style: { objectFit: "cover" },
  },
  {
    id: "people-half-body-glasses",
    label: "Half-body, glasses",
    category: "people",
    kind: "humanModelImage",
    tags: ["people", "glasses", "half-body", "bust"],
    prompt:
      "Half-body portrait of a woman wearing round glasses with her hair pulled into a soft bun, warm natural window light and a neutral backdrop",
    art: "bust-woman-2",
    size: BUST_SIZE,
    style: { objectFit: "cover" },
  },
  {
    id: "people-half-body-curly",
    label: "Half-body, curly hair",
    category: "people",
    kind: "humanModelImage",
    tags: ["people", "curly hair", "half-body", "bust"],
    prompt:
      "Half-body portrait of a person with voluminous curly hair and a relaxed warm expression, soft natural light against a neutral backdrop",
    art: "bust-curly",
    size: BUST_SIZE,
    style: { objectFit: "cover" },
  },
  {
    id: "people-profile-silhouette",
    label: "Profile silhouette",
    category: "people",
    kind: "humanModelImage",
    tags: ["people", "profile", "silhouette", "face"],
    prompt:
      "Dramatic side-profile silhouette of a face against a bold solid-color backdrop, strong rim light tracing the jaw and hairline",
    art: "profile",
  },
  {
    id: "people-portrait-woman",
    label: "Portrait, woman",
    category: "people",
    kind: "humanModelImage",
    tags: ["people", "woman", "portrait", "headshot"],
    prompt:
      "Warm head-and-shoulders portrait of a woman with a gentle genuine smile, soft even studio light against a neutral backdrop",
    art: "person-portrait",
  },
  {
    id: "people-portrait-man",
    label: "Portrait, man",
    category: "people",
    kind: "humanModelImage",
    tags: ["people", "man", "portrait", "headshot"],
    prompt:
      "Warm head-and-shoulders portrait of a bearded man with a gentle genuine smile, soft even studio light against a neutral backdrop",
    art: "portrait-man",
  },
  {
    id: "people-team",
    label: "Team",
    category: "people",
    kind: "humanModelImage",
    tags: ["people", "team", "group", "colleagues"],
    prompt:
      "Candid group portrait of three diverse teammates smiling together in smart-casual clothing, bright natural office light",
    art: "team",
  },

  // Silhouette variants of the most commonly used poses.
  {
    id: "people-woman-silhouette",
    label: "Woman, silhouette",
    category: "people",
    kind: "humanModelImage",
    tags: ["people", "woman", "silhouette", "graphic"],
    prompt:
      "Bold flat silhouette of a standing woman in a confident pose, solid single-tone fill against a bright contrasting background, graphic and high-impact",
    art: "person-standing:silhouette",
  },
  {
    id: "people-man-silhouette",
    label: "Man, silhouette",
    category: "people",
    kind: "humanModelImage",
    tags: ["people", "man", "silhouette", "graphic"],
    prompt:
      "Bold flat silhouette of a standing man in a confident pose, solid single-tone fill against a bright contrasting background, graphic and high-impact",
    art: "person-man:silhouette",
  },
  {
    id: "people-active-man-silhouette",
    label: "Man active, silhouette",
    category: "people",
    kind: "humanModelImage",
    tags: ["people", "man", "active", "silhouette"],
    prompt:
      "Bold flat silhouette of a man mid-jump with arms raised, solid single-tone fill against a bright contrasting background, energetic and high-impact",
    art: "person-active-man:silhouette",
  },
  {
    id: "people-half-body-woman-silhouette",
    label: "Half-body woman, silhouette",
    category: "people",
    kind: "humanModelImage",
    tags: ["people", "woman", "half-body", "silhouette"],
    prompt:
      "Bold flat half-body silhouette of a woman with long flowing hair, solid single-tone fill against a bright contrasting background, graphic and clean",
    art: "bust-woman:silhouette",
    size: BUST_SIZE,
    style: { objectFit: "cover" },
  },
  {
    id: "people-half-body-man-silhouette",
    label: "Half-body man, silhouette",
    category: "people",
    kind: "humanModelImage",
    tags: ["people", "man", "half-body", "silhouette"],
    prompt:
      "Bold flat half-body silhouette of a bearded man, solid single-tone fill against a bright contrasting background, graphic and clean",
    art: "bust-man:silhouette",
    size: BUST_SIZE,
    style: { objectFit: "cover" },
  },
  {
    id: "people-woman-walking",
    label: "Woman, walking",
    category: "people",
    kind: "humanModelImage",
    tags: ["people", "woman", "walking", "street style", "fashion", "flat"],
    prompt:
      "Flat vector illustration of a woman mid-stride in an open blazer over a tee and wide-leg trousers, a shoulder bag on one side, warm rim light on her lit side",
    art: "person-walking",
    size: { h: 0.76 },
  },

  // Scene figures (motifs/*.tsx): half-body and full-body flat figures for the model-feed scenes.
  {
    id: "people-skincare-woman",
    label: "Half-body, skincare",
    category: "people",
    kind: "humanModelImage",
    tags: ["people", "woman", "skincare", "half-body", "beauty", "flat"],
    prompt:
      "Flat vector half-body illustration of a woman with curly brown hair in a white towel wrap, one hand raised to her cheek with a dab of moisturizer",
    art: "bust-skincare",
    size: { w: 0.4, aspect: 870 / 1000 },
    style: { objectFit: "contain" },
  },

  {
    id: "people-cafe-man",
    label: "Man in rust knit",
    category: "people",
    kind: "humanModelImage",
    tags: ["people", "man", "cafe", "half-body", "knit", "flat"],
    prompt:
      "Flat vector half-body illustration of a bearded man in a rust knit sweater, one hand raised to hold a mug and the other forearm resting on a table",
    art: "person-cafe",
    size: { w: 0.5, aspect: 1000 / 942 },
    style: { objectFit: "contain" },
  },

  {
    id: "people-stretching-athlete",
    label: "Athlete, stretching",
    category: "people",
    kind: "humanModelImage",
    tags: ["people", "woman", "athlete", "stretch", "fitness", "flat"],
    prompt:
      "Flat vector full-body illustration of a woman in sage activewear standing on one leg in a quad stretch, ponytail swinging, one foot held behind her",
    art: "person-stretch",
    size: { h: 0.7, aspect: 380 / 1010 },
    style: { objectFit: "contain" },
  },
  {
    id: "people-athlete-close",
    label: "Athlete, half-body",
    category: "people",
    kind: "humanModelImage",
    tags: ["people", "woman", "athlete", "half-body", "smile", "flat"],
    prompt:
      "Flat vector half-body illustration of a smiling woman in sage activewear bent forward at the hips with both hands on her knees, loose ponytail",
    art: "bust-athlete",
    size: { w: 0.4, aspect: 380 / 900 },
    style: { objectFit: "contain" },
  },

  {
    id: "people-linen-dress-woman",
    label: "Woman, linen dress",
    category: "people",
    kind: "humanModelImage",
    tags: ["people", "woman", "dress", "travel", "summer", "flat"],
    prompt:
      "Flat vector full-length illustration of a Black woman with dark curls in a cream linen dress, one hand at her ear and a straw bag on her shoulder",
    art: "person-linen-dress",
    size: { h: 0.75, aspect: 500 / 1300 },
    style: { objectFit: "contain" },
  },
];
