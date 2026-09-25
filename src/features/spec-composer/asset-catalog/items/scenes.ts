import type { AssetItem } from "../types.ts";

/**
 * Street-scene pieces: flat vector layers that together form a city street
 * (see motifs/street.tsx). Each is its own catalog item so it can be added,
 * moved, recoloured or dropped on its own, the same as any other asset.
 */
export const scenesItems: AssetItem[] = [
  {
    id: "scenes-city-street",
    label: "City street",
    category: "scenes",
    kind: "heroImage",
    tags: ["scene", "street", "city", "road", "crossing", "backdrop"],
    prompt:
      "Flat vector city street backdrop with pale pavement, a dark road and a single pedestrian crossing marking",
    art: "street-crossing",
    style: { objectFit: "cover", focalY: 1 },
    size: { w: 0.95, h: 0.95 },
  },
  {
    id: "scenes-tree-shadows",
    label: "Tree shadows",
    category: "scenes",
    kind: "supportingImage",
    tags: ["scene", "street", "shadow", "trees", "light", "overlay"],
    prompt:
      "Long soft diagonal tree and lamp-post shadows fading across flat pavement, a gentle overlay for a street scene",
    art: "street-shadows",
    style: { objectFit: "cover", focalY: 1 },
    size: { w: 0.9, h: 0.55 },
  },
  {
    id: "scenes-cafe-street",
    label: "Cafe street",
    category: "scenes",
    kind: "supportingImage",
    tags: ["scene", "street", "cafe", "shopfront", "building", "flat"],
    prompt:
      "Flat vector row of cream buildings with a dark-glazed corner cafe front, an awning and two round shrubs",
    art: "street-shopfront",
    style: { objectFit: "cover" },
    size: { w: 0.55 },
  },
  {
    id: "scenes-stone-facade",
    label: "Stone facade",
    category: "scenes",
    kind: "supportingImage",
    tags: ["scene", "street", "building", "facade", "windows", "flat"],
    prompt:
      "Flat vector limestone building facade with pilasters, a plinth and three tall dark windows",
    art: "street-facade",
    style: { objectFit: "cover" },
    size: { w: 0.6 },
  },
  {
    id: "scenes-sunbeams",
    label: "Sunbeams",
    category: "scenes",
    kind: "supportingImage",
    tags: ["scene", "light", "sun", "glow", "beams", "gradient"],
    prompt:
      "Soft golden sunlight glow with a single translucent beam streaming in from a top corner",
    art: "street-sunbeams",
    style: { objectFit: "cover" },
    size: { w: 0.8, aspect: 1 },
  },
  {
    id: "scenes-street-lamp",
    label: "Street lamp",
    category: "scenes",
    kind: "supportingImage",
    tags: ["scene", "street", "lamp", "post", "urban", "flat"],
    prompt:
      "Flat vector cast-iron street lamp post with a lantern head and a warm tinted glass pane",
    art: "street-lamp",
    style: { objectFit: "contain" },
    size: { w: 0.14, aspect: 100 / 520 },
  },
  {
    id: "scenes-plane-tree",
    label: "Plane tree",
    category: "scenes",
    kind: "supportingImage",
    tags: ["scene", "street", "tree", "canopy", "nature", "flat"],
    prompt:
      "Flat vector plane tree with a mottled trunk and an overlapping autumn canopy, lit on one side",
    art: "street-tree",
    style: { objectFit: "contain" },
    size: { w: 0.42, aspect: 490 / 560 },
  },
  {
    id: "scenes-iron-railing",
    label: "Iron railing",
    category: "scenes",
    kind: "supportingImage",
    tags: ["scene", "street", "railing", "fence", "iron", "flat"],
    prompt:
      "Short flat vector wrought-iron railing section with vertical bars between two rails",
    art: "street-railing",
    style: { objectFit: "contain" },
    size: { w: 0.12, aspect: 110 / 170 },
  },
  {
    id: "scenes-planter",
    label: "Street planter",
    category: "scenes",
    kind: "supportingImage",
    tags: ["scene", "street", "planter", "shrub", "urban", "flat"],
    prompt:
      "Flat vector rectangular street planter box holding a cluster of rounded shrubs",
    art: "street-planter",
    style: { objectFit: "contain" },
    size: { w: 0.16, aspect: 150 / 240 },
  },
  {
    id: "scenes-cast-shadow",
    label: "Cast shadow",
    category: "scenes",
    kind: "supportingImage",
    tags: ["scene", "shadow", "ground", "gradient", "soft", "flat"],
    prompt:
      "Soft elongated ground shadow fading outward from a radial gradient, for a figure standing in low sun",
    art: "street-cast-shadow",
    style: { objectFit: "contain" },
    size: { w: 0.55, aspect: 560 / 150 },
  },

  // Bathroom scene (motifs/bathroom.tsx): the Everyday Skincare pieces.
  {
    id: "scenes-bathroom",
    label: "Bathroom wall",
    category: "scenes",
    kind: "heroImage",
    tags: ["scene", "bathroom", "wall", "window", "vanity", "backdrop"],
    prompt:
      "Flat vector bright bathroom backdrop with a near-white wall, a shower recess, a black-framed window with a green view and a wooden vanity",
    art: "bathroom-wall",
    style: { objectFit: "cover" },
    size: { w: 0.95, h: 0.95 },
  },
  {
    id: "scenes-towel-hook",
    label: "Towel on hook",
    category: "scenes",
    kind: "supportingImage",
    tags: ["scene", "bathroom", "towel", "hook", "spa", "flat"],
    prompt:
      "Flat vector white bath towel hanging from a small hook, softly shaded folds on a bright wall",
    art: "bathroom-towel",
    style: { objectFit: "contain" },
    size: { w: 0.16, aspect: 130 / 450 },
  },
  {
    id: "scenes-plant-vase",
    label: "Plant in vase",
    category: "scenes",
    kind: "supportingImage",
    tags: ["scene", "plant", "vase", "eucalyptus", "decor", "flat"],
    prompt:
      "Flat vector eucalyptus stems with rounded leaves in two greens, standing in a pale speckled ceramic vase",
    art: "plant-vase",
    style: { objectFit: "contain" },
    size: { w: 0.22, aspect: 200 / 470 },
  },

  // Cafe scene (motifs/cafe.tsx): the Cafe Morning pieces.
  {
    id: "scenes-cafe-interior",
    label: "Cafe interior",
    category: "scenes",
    kind: "heroImage",
    tags: ["scene", "cafe", "interior", "window", "table", "backdrop"],
    prompt:
      "Flat vector cafe window seat backdrop with a dark back wall, a pale wall panel, a blank chalkboard, a bright black-framed window and a wooden table",
    art: "cafe-interior",
    style: { objectFit: "cover" },
    size: { w: 0.95, h: 0.95 },
  },
  {
    id: "scenes-hanging-plant",
    label: "Hanging plant",
    category: "scenes",
    kind: "supportingImage",
    tags: ["scene", "cafe", "plant", "hanging", "greenery", "flat"],
    prompt:
      "Flat vector hanging plant with trailing green stems and rounded leaves in two greens, falling from the top edge",
    art: "hanging-plant",
    style: { objectFit: "contain" },
    size: { w: 0.2, aspect: 200 / 340 },
  },

  // Park scene (motifs/park.tsx): the Movement Club pieces.
  {
    id: "scenes-park-lakeside",
    label: "Lakeside park",
    category: "scenes",
    kind: "heroImage",
    tags: ["scene", "park", "lake", "sunrise", "skyline", "backdrop"],
    prompt:
      "Flat vector lakeside park backdrop at sunrise with a pale skyline, a far tree line, a lake with a sun glint, a pale lawn, a gravel path and leaf masses in the top corners",
    art: "park-lakeside",
    style: { objectFit: "cover" },
    size: { w: 0.95, h: 0.95 },
  },
  {
    id: "scenes-hedge-wall",
    label: "Hedge and stone wall",
    category: "scenes",
    kind: "supportingImage",
    tags: ["scene", "park", "wall", "hedge", "stone", "flat"],
    prompt:
      "Flat vector dark scalloped hedge above a low stone wall made of lighter blocks with dark joints",
    art: "park-stone-wall",
    style: { objectFit: "cover", focalY: 1 },
    size: { w: 0.9, aspect: 720 / 281 },
  },

  // Coast scene (motifs/coast.tsx): the Coastal Weekend pieces.
  {
    id: "scenes-coast-promenade",
    label: "Seaside promenade",
    category: "scenes",
    kind: "heroImage",
    tags: ["scene", "coast", "sea", "promenade", "sunset", "backdrop"],
    prompt:
      "Flat vector seaside backdrop at golden hour with a peach sky, a headland, a dark sea with three rocks, warm paving and a stone parapet",
    art: "coast-promenade",
    style: { objectFit: "cover" },
    size: { w: 0.95, h: 0.95 },
  },
  {
    id: "scenes-stone-terrace",
    label: "Stone terrace",
    category: "scenes",
    kind: "supportingImage",
    tags: ["scene", "coast", "terrace", "stone", "shrubs", "flat"],
    prompt:
      "Flat vector limestone terrace wall with stone joints and a step, topped by green shrubs with a few pink blossoms and a potted plant",
    art: "coast-terrace",
    style: { objectFit: "cover" },
    size: { w: 0.22, aspect: 300 / 1100 },
  },
];
