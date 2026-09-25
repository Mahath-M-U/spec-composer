import { visual, type SceneLayer } from "./template-layouts.ts";

/**
 * The Street Style Fit Check scene: a quiet city street built from separate
 * flat vector layers (motifs/street.tsx), back to front, plus the woman and
 * her cast shadow. Boxes are fractions of the 1080 × 1350 base format,
 * measured from the source photo (docs/template-vectors/sources/
 * street-style-fit-check.webp, 864 × 1080) scaled by 1.25. This file uses
 * the ".ts" extension on its own import so plain Node (the test runner) can
 * load it without Vite.
 */

/**
 * The only motifs allowed to be see-through (gradients and low-opacity
 * paint): sunlight and long shadows. A scene may use at most two of them at
 * more than 10% of its frame; everything else is opaque. See the "Scene style
 * guide" in docs/template-vectors/README.md.
 */
export const SEE_THROUGH_ART = ["street-sunbeams", "street-shadows"];

export const STREET_STYLE_MODEL = visual(
  "humanModelImage",
  "person-walking",
  "Candid full-body street-style photo of a fictional adult woman with a short bob in a relaxed cream blazer, white tee, and wide-leg jeans, walking across a quiet city street in late afternoon light; natural unposed movement, no logos",
);

export const STREET_STYLE_SCENE: SceneLayer[] = [
  {
    name: "Street scene",
    box: [0, 0, 1, 1],
    visual: visual(
      "heroImage",
      "street-crossing",
      "Quiet European city street in warm late-afternoon light, pale stone pavement and kerb in the middle distance, dark asphalt road with a white crossing stripe in the foreground",
      { fit: "cover", focal: [0.5, 1] },
    ),
  },
  {
    name: "Tree shadows",
    box: [0, 700 / 1350, 1, 650 / 1350],
    visual: visual(
      "supportingImage",
      "street-shadows",
      "Long soft diagonal shadows of trees and lamp posts falling across the road",
      { fit: "cover", focal: [0.5, 1] },
    ),
  },
  {
    name: "Back street",
    box: [560 / 1080, 0, 520 / 1080, 560 / 1350],
    visual: visual(
      "supportingImage",
      "street-shopfront",
      "Receding row of cream stone buildings with a dark-glazed corner cafe front and small potted shrubs, softly out of focus",
      { fit: "cover", focal: [1, 1] },
    ),
  },
  {
    name: "Stone facade",
    box: [0, 0, 600 / 1080, 600 / 1350],
    visual: visual(
      "supportingImage",
      "street-facade",
      "Pale limestone building facade with tall black-barred windows and a heavy stone plinth, lit by low warm sun",
      { fit: "cover", focal: [0, 1] },
    ),
  },
  {
    name: "Sunlight",
    box: [0, 0, 1, 1080 / 1350],
    visual: visual(
      "supportingImage",
      "street-sunbeams",
      "Low golden sunlight streaming in from the upper right as soft translucent beams and a warm glow",
      { fit: "cover", focal: [1, 0] },
    ),
  },
  {
    name: "Street lamp, far",
    box: [735 / 1080, 50 / 1350, 64 / 1080, 333 / 1350],
    visual: visual(
      "supportingImage",
      "street-lamp",
      "Slim black cast-iron street lamp post in the middle distance",
      { fit: "contain", focal: [0.5, 1] },
    ),
  },
  {
    name: "Plane tree",
    box: [590 / 1080, 0, 490 / 1080, 560 / 1350],
    visual: visual(
      "supportingImage",
      "street-tree",
      "Plane tree with a mottled trunk and an autumn canopy of yellow-green leaves",
      { fit: "contain", focal: [0.5, 1] },
    ),
  },
  {
    name: "Street lamp",
    box: [870 / 1080, 60 / 1350, 100 / 1080, 520 / 1350],
    visual: visual(
      "supportingImage",
      "street-lamp",
      "Tall black cast-iron street lamp post with a lantern head at the kerb",
      { fit: "contain", focal: [0.5, 1] },
    ),
  },
  {
    name: "Iron railing",
    box: [310 / 1080, 420 / 1350, 110 / 1080, 170 / 1350],
    visual: visual(
      "supportingImage",
      "street-railing",
      "Short black wrought-iron railing section along the pavement",
      { fit: "contain", focal: [0.5, 1] },
    ),
  },
  {
    name: "Planter",
    box: [630 / 1080, 365 / 1350, 150 / 1080, 240 / 1350],
    visual: visual(
      "supportingImage",
      "street-planter",
      "Dark rectangular street planter holding a rounded green shrub",
      { fit: "contain", focal: [0.5, 1] },
    ),
  },
  {
    name: "Cast shadow",
    box: [60 / 1080, 990 / 1350, 560 / 1080, 150 / 1350],
    visual: visual(
      "supportingImage",
      "street-cast-shadow",
      "Soft elongated shadow of the walking woman stretching toward the lower left",
      { fit: "contain", focal: [0.5, 0.5] },
    ),
    group: "model",
  },
  {
    name: "Street style woman",
    box: [340 / 1080, 30 / 1350, 360 / 1080, 1030 / 1350],
    visual: { ...STREET_STYLE_MODEL, fit: "contain", focal: [0.5, 1] },
    group: "model",
  },
];

/**
 * Everyday Skincare: a bright bathroom, frame-relative boxes measured from
 * docs/template-vectors/sources/everyday-skincare.webp (864 x 1080) through
 * the caption frame's crop (cover, focal y 0.35).
 */
export const EVERYDAY_SKINCARE_MODEL = visual(
  "humanModelImage",
  "bust-skincare",
  "Natural candid portrait of a fictional adult woman with freckles and curly hair applying moisturizer to her cheek by a sunlit bathroom window, bare shoulders, gentle expression, unbranded skincare routine",
);

export const EVERYDAY_SKINCARE_SCENE: SceneLayer[] = [
  {
    name: "Bathroom",
    box: [0, 0, 1, 1],
    visual: visual(
      "heroImage",
      "bathroom-wall",
      "Bright bathroom with a near-white wall, a shower recess on the left, a black-framed window with a green view at the top right and a wooden vanity counter at the bottom right",
      { fit: "cover", focal: [0.5, 0.5] },
    ),
  },
  {
    name: "Towel hook",
    box: [0.01, 0.18, 0.13, 0.48],
    visual: visual(
      "supportingImage",
      "bathroom-towel",
      "White bath towel hanging from a small hook on the left wall",
      { fit: "contain", focal: [0.5, 0] },
    ),
  },
  {
    name: "Eucalyptus vase",
    box: [0.79, 0.19, 0.21, 0.47],
    visual: visual(
      "supportingImage",
      "plant-vase",
      "Eucalyptus stems in a pale speckled ceramic vase in front of the window",
      { fit: "contain", focal: [0.5, 1] },
    ),
  },
  {
    name: "Pump bottle",
    box: [0.95, 0.56, 0.05, 0.18],
    visual: visual(
      "productImage",
      "skincare-pump",
      "Unbranded skincare pump bottle with a blank label on the vanity",
      { fit: "contain", focal: [0.5, 1] },
    ),
  },
  {
    name: "Window light",
    box: [0.35, 0, 0.65, 0.7],
    visual: visual(
      "supportingImage",
      "street-sunbeams",
      "Soft morning sunlight streaming in from the window at the top right as a warm glow and a single beam",
      { fit: "cover", focal: [1, 0] },
    ),
  },
  {
    name: "Skincare woman",
    box: [0.07, 0, 0.81, 1],
    visual: { ...EVERYDAY_SKINCARE_MODEL, fit: "contain", focal: [0.5, 1] },
  },
];

/**
 * Cafe Morning: a sunlit window seat. Boxes are frame-relative, measured from
 * docs/template-vectors/sources/cafe-morning.webp through the framed variant's
 * crop (cover, focal y 0.36).
 */
export const CAFE_MORNING_MODEL = visual(
  "humanModelImage",
  "person-cafe",
  "Candid lifestyle photo of a fictional adult man in a soft rust knit seated by a cafe window with a ceramic coffee mug, looking outside, natural morning light, cozy lived-in interior, no visible logos",
);

export const CAFE_MORNING_SCENE: SceneLayer[] = [
  {
    name: "Cafe interior",
    box: [0, 0, 1, 1],
    visual: visual(
      "heroImage",
      "cafe-interior",
      "Cozy cafe window seat with a dark back wall on the left, a pale wall panel, a blank chalkboard, a bright black-framed window at the top right and a wooden table along the bottom",
      { fit: "cover", focal: [0.5, 0.4] },
    ),
  },
  {
    name: "Hanging plant",
    box: [0.2, 0, 0.2, 0.38],
    visual: visual(
      "supportingImage",
      "hanging-plant",
      "Green trailing plant hanging from the ceiling beside the window",
      { fit: "contain", focal: [0.5, 0] },
    ),
  },
  {
    name: "Window light",
    box: [0.25, 0, 0.75, 1],
    visual: visual(
      "supportingImage",
      "street-sunbeams",
      "Warm morning sunlight coming through the window from the upper right as a soft glow and a single beam",
      { fit: "cover", focal: [1, 0] },
    ),
  },
  {
    name: "Coffee drinker",
    box: [0.03, 0.04, 0.83, 0.87],
    visual: { ...CAFE_MORNING_MODEL, fit: "contain", focal: [0.5, 1] },
    group: "model",
  },
  {
    name: "Coffee mug",
    box: [0.53, 0.44, 0.15, 0.15],
    visual: visual(
      "supportingImage",
      "mug-ceramic",
      "Speckled cream ceramic coffee mug held in one hand",
      { fit: "contain", focal: [0.5, 0.5] },
    ),
    group: "model",
  },
  {
    name: "Table flowers",
    box: [0.83, 0.64, 0.13, 0.3],
    visual: visual(
      "supportingImage",
      "plant-vase",
      "Small vase of greenery on the table by the window",
      { fit: "contain", focal: [0.5, 1] },
    ),
  },
];

/**
 * Movement Club: a lakeside park at sunrise, in the split variant's two
 * frames. Boxes are frame-relative, measured from
 * docs/template-vectors/sources/movement-club-main.webp and
 * movement-club-detail.webp through each frame's crop (cover, focal 0.5).
 */
export const MOVEMENT_CLUB_MODEL = visual(
  "humanModelImage",
  "person-stretch",
  "Candid full-body photo of a fictional adult woman in simple sage activewear stretching in a city park at dawn, natural athletic build and relaxed posture, soft green background, no logos",
);

export const MOVEMENT_CLUB_DETAIL = visual(
  "humanModelImage",
  "bust-athlete",
  "Closer candid crop of the same fictional adult athlete smiling between stretches in the park, matching sage activewear and morning light",
);

export const MOVEMENT_CLUB_SCENE: SceneLayer[] = [
  {
    name: "Park backdrop",
    box: [0, 0, 1, 1],
    visual: visual(
      "heroImage",
      "park-lakeside",
      "Lakeside city park at sunrise with a pale skyline, a far tree line, a lake with a sun glint, a pale lawn, a gravel path and leaves overhead in both top corners",
      { fit: "cover", focal: [0.5, 0.5] },
    ),
  },
  {
    name: "Sunlight",
    box: [0.2, 0, 0.8, 0.55],
    visual: visual(
      "supportingImage",
      "street-sunbeams",
      "Low warm sunrise light from the upper right as a soft glow and a single beam",
      { fit: "cover", focal: [1, 0] },
    ),
  },
  {
    name: "Park tree",
    box: [0.07, 0.33, 0.27, 0.24],
    visual: visual(
      "supportingImage",
      "street-tree",
      "Rounded park tree with a sage canopy beside the lake",
      { fit: "contain", focal: [0.5, 1] },
    ),
  },
  {
    name: "Lamp post",
    box: [0.85, 0.47, 0.035, 0.12],
    visual: visual(
      "supportingImage",
      "street-lamp",
      "Slim black park lamp post by the water",
      { fit: "contain", focal: [0.5, 1] },
    ),
  },
  {
    name: "Stone wall",
    box: [0, 0.57, 1, 0.28],
    visual: visual(
      "supportingImage",
      "park-stone-wall",
      "Dark hedge above a low stone wall along the path",
      { fit: "cover", focal: [0.5, 1] },
    ),
  },
  {
    name: "Cast shadow",
    box: [0.33, 0.85, 0.4, 0.07],
    visual: visual(
      "supportingImage",
      "street-cast-shadow",
      "Soft ground shadow under the athlete",
      { fit: "contain" },
    ),
    group: "model",
  },
  {
    name: "Stretching athlete",
    box: [0.28, 0.12, 0.4, 0.76],
    visual: { ...MOVEMENT_CLUB_MODEL, fit: "contain", focal: [0.5, 1] },
    group: "model",
  },
];

export const MOVEMENT_CLUB_DETAIL_SCENE: SceneLayer[] = [
  {
    name: "Park backdrop, detail",
    box: [0, 0, 1, 1],
    visual: visual(
      "heroImage",
      "park-lakeside",
      "Lakeside city park at sunrise seen closer, with the lake glint and leaves overhead",
      { fit: "cover", focal: [0.75, 0.5] },
    ),
  },
  {
    name: "Sunlight, detail",
    box: [0.3, 0, 0.7, 0.45],
    visual: visual(
      "supportingImage",
      "street-sunbeams",
      "Low warm sunrise light from the upper right as a soft glow and a single beam",
      { fit: "cover", focal: [1, 0] },
    ),
  },
  {
    name: "Park tree, detail",
    box: [0, 0.23, 0.3, 0.32],
    visual: visual(
      "supportingImage",
      "street-tree",
      "Rounded park tree with a sage canopy at the left edge",
      { fit: "cover", focal: [1, 1] },
    ),
  },
  {
    name: "Stone wall, detail",
    box: [0, 0.68, 1, 0.26],
    visual: visual(
      "supportingImage",
      "park-stone-wall",
      "Dark hedge above a low stone wall behind the athlete",
      { fit: "cover", focal: [0.3, 1] },
    ),
  },
  {
    name: "Athlete, close",
    box: [0.07, 0.06, 0.86, 0.94],
    visual: { ...MOVEMENT_CLUB_DETAIL, fit: "contain", focal: [0.5, 1] },
  },
];

/**
 * Coastal Weekend: a seaside promenade at golden hour. Boxes are
 * frame-relative, measured from docs/template-vectors/sources/
 * coastal-weekend.webp through the diary frame's crop (cover, focal y 0.4).
 * The woman is drawn full length; the frame crops her at the shin.
 */
export const COASTAL_WEEKEND_MODEL = visual(
  "humanModelImage",
  "person-linen-dress",
  "Unposed travel photograph of a fictional adult Black woman in a breezy linen dress walking along a quiet seaside promenade at golden hour, ocean and pale stone in the background, natural wind in her hair, no logos",
);

export const COASTAL_WEEKEND_SCENE: SceneLayer[] = [
  {
    name: "Coast backdrop",
    box: [0, 0, 1, 1],
    visual: visual(
      "heroImage",
      "coast-promenade",
      "Quiet seaside promenade at golden hour with a peach sky, a headland on the right, a dark sea with three rocks, warm stone paving and a pale stone parapet",
      { fit: "cover", focal: [0.5, 0.4] },
    ),
  },
  {
    name: "Hillside town",
    box: [0.08, 0, 0.66, 0.27],
    visual: visual(
      "supportingImage",
      "coast-town",
      "Cream hillside seaside town with terracotta roofs and a bell tower",
      { fit: "cover", focal: [0.5, 1] },
    ),
  },
  {
    name: "Sunset glow",
    box: [0.3, 0, 0.7, 0.55],
    visual: visual(
      "supportingImage",
      "street-sunbeams",
      "Golden sunset light from the upper right as a warm glow and a single beam",
      { fit: "cover", focal: [1, 0] },
    ),
  },
  {
    name: "Stone terrace",
    box: [0, 0.03, 0.19, 0.65],
    visual: visual(
      "supportingImage",
      "coast-terrace",
      "Limestone terrace wall on the left with green shrubs and a few pink flowers",
      { fit: "cover", focal: [0, 0.5] },
    ),
  },
  {
    name: "Street lamp",
    box: [0.11, 0.03, 0.05, 0.22],
    visual: visual(
      "supportingImage",
      "street-lamp",
      "Slim black street lamp on the terrace",
      { fit: "contain", focal: [0.5, 1] },
    ),
  },
  {
    name: "Coastal woman",
    box: [0.19, 0, 0.53, 1],
    visual: { ...COASTAL_WEEKEND_MODEL, fit: "cover", focal: [0.5, 0] },
  },
];
