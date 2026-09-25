import { curatedGalleryPrompts } from "./curated-prompts";

export type GalleryPrompt = {
  id: string;
  title: string;
  category: string;
  summary: string;
  refinedPrompt: string;
  beforeImage: string;
  afterImage: string;
  beforeAlt: string;
  afterAlt: string;
  exampleTool: string;
};

export const galleryPrompts: GalleryPrompt[] = [
  {
    id: "warm-editorial-portrait",
    title: "Warm editorial portrait",
    category: "Portrait · Editorial",
    summary: "Turn a natural portrait into a softly lit fashion editorial.",
    refinedPrompt:
      "Edit the uploaded photograph into a warm fashion editorial. Preserve the person's identity, facial features, expression, pose, body proportions, clothing, and original scene composition. Use soft directional window light, natural skin texture, gently lifted shadows, and restrained film grain. Grade the image with warm neutral highlights, rich but realistic reds, and muted mustard tones where those colors already appear. Keep fabric texture and facial detail clear, with smooth highlight roll-off and believable shadows. Maintain the original framing. Do not add people, objects, text, logos, or watermarks; avoid plastic skin, distorted anatomy, and excessive saturation.",
    beforeImage: "/prompt-gallery/portrait-before.webp",
    afterImage: "/prompt-gallery/portrait-after.webp",
    beforeAlt:
      "Woman in a red dress reclining on a mustard sofa in neutral daylight",
    afterAlt:
      "The same portrait with warm window light and editorial color grading",
    exampleTool: "OpenAI image generation",
  },
  {
    id: "cinematic-automotive-dusk",
    title: "Cinematic automotive dusk",
    category: "Automotive · Cinematic",
    summary: "Shift a daylight car photograph into believable blue hour.",
    refinedPrompt:
      "Edit the uploaded car photograph into a cinematic automotive image at blue hour. Preserve the vehicle's make, model, body geometry, paint color, wheels, badges, proportions, and camera angle. Retain the original framing and place the car naturally within the existing scene at dusk. Use a deep blue ambient sky, subtle warm light along the body contours, realistic paint reflections, and soft headlight illumination where visible. Add controlled contrast and crisp vehicle detail while keeping the background subdued. Ensure reflections, contact shadows, and light direction agree with the environment. Do not add branding, text, watermarks, extra vehicles, or body modifications; avoid warped wheels, duplicated lights, and exaggerated glow.",
    beforeImage: "/prompt-gallery/car-before.webp",
    afterImage: "/prompt-gallery/car-after.webp",
    beforeAlt: "Red classic coupe outside a concrete building in daylight",
    afterAlt:
      "The same red coupe at blue hour with warm lights and reflections",
    exampleTool: "OpenAI image generation",
  },
  ...curatedGalleryPrompts,
];
