import type { GalleryPrompt } from "./catalog";

const sourceImages = {
  portrait: {
    image: "/prompt-gallery/portrait-before.webp",
    alt: "Woman in a red dress reclining on a mustard sofa in neutral light",
  },
  selfie: {
    image: "/prompt-gallery/source-selfie.webp",
    alt: "Woman taking a natural selfie on a city street",
  },
  standing: {
    image: "/prompt-gallery/source-standing.webp",
    alt: "Woman standing in a beige shirt and dark trousers on a plaza",
  },
  smile: {
    image: "/prompt-gallery/source-smile.webp",
    alt: "Smiling man in a naturally lit portrait",
  },
  street: {
    image: "/prompt-gallery/source-street.webp",
    alt: "Woman on a street with a bystander and parked cars",
  },
  desk: {
    image: "/prompt-gallery/source-desk.webp",
    alt: "Desk with a laptop, lamp, coffee mug, papers, and cables",
  },
  archival: {
    image: "/prompt-gallery/source-archival.webp",
    alt: "Damaged black-and-white family photograph from the 1940s",
  },
  faded: {
    image: "/prompt-gallery/source-faded.webp",
    alt: "Faded 1970s color photograph of two adults and a bicycle",
  },
  product: {
    image: "/prompt-gallery/source-product.webp",
    alt: "Amber dropper bottle standing on a gray tabletop",
  },
  flatlay: {
    image: "/prompt-gallery/source-flatlay.webp",
    alt: "Amber dropper bottle lying on a pale tabletop",
  },
  sunny: {
    image: "/prompt-gallery/source-sunny.webp",
    alt: "Woman in a green coat on a sunny city street",
  },
} as const;

type SourceKey = keyof typeof sourceImages;
type PromptDraft = Pick<
  GalleryPrompt,
  "id" | "title" | "summary" | "refinedPrompt"
> & { source?: SourceKey; afterImage?: string };

function group(
  category: string,
  defaultSource: SourceKey,
  prompts: PromptDraft[],
): GalleryPrompt[] {
  return prompts.map(({ source = defaultSource, afterImage, ...prompt }) => {
    const before = sourceImages[source];
    return {
      ...prompt,
      category,
      beforeImage: before.image,
      afterImage: afterImage ?? `/prompt-gallery/${prompt.id}-after.webp`,
      beforeAlt: before.alt,
      afterAlt: `${prompt.title} result using the same source photograph`,
      exampleTool: "OpenAI image generation",
    };
  });
}

// Original, tool-agnostic rewrites inspired by the user's category list.
// Each after image was generated as a distinct edit of its assigned source.
export const curatedGalleryPrompts: GalleryPrompt[] = [
  ...group("Trending", "portrait", [
    {
      id: "digital-flash-2000s",
      title: "Digital flash throwback",
      summary: "A candid early-digital flash finish with real texture.",
      refinedPrompt:
        "Give the uploaded photo the energy of a candid early-2000s snapshot. Light the subject as though a small on-camera flash fired close to the lens, with crisp highlights, a defined shadow on the surface behind them, and a little fine digital noise. Keep the person’s identity, expression, pose, styling, and framing intact. Let skin remain believable; avoid glossy retouching, fake date stamps, and added objects.",
    },
    {
      id: "cinematic-luxury-portrait",
      title: "Cinematic luxury portrait",
      summary: "Sculpt the light for a restrained, polished portrait.",
      refinedPrompt:
        "Regrade the uploaded portrait as a refined cinematic campaign image. Shape the existing light into a gentle directional key with deep but readable shadows and restrained specular highlights. Use a rich, cohesive palette without changing the subject’s skin tone. Preserve facial identity, hair, wardrobe, camera angle, and composition. Keep texture in skin and fabric; avoid artificial sharpening, dramatic lens flares, text, or new accessories.",
    },
    {
      id: "pastel-dream-portrait",
      title: "Pastel dream portrait",
      summary: "A soft color wash with luminous, natural detail.",
      refinedPrompt:
        "Transform the photo’s atmosphere with a delicate mix of lavender shadows, peach highlights, and hints of cool mint in the surroundings. Add a light diffusion to bright areas while leaving eyes, hair, and natural skin texture clear. Preserve the face, expression, pose, outfit, and original crop. Keep the result photographic and nuanced, without changing anatomy, replacing the setting, or covering the subject in a heavy haze.",
    },
    {
      id: "milestone-editorial-post",
      title: "Milestone editorial post",
      summary: "A polished celebration image with room for your message.",
      refinedPrompt:
        "Prepare the uploaded portrait as the image for a celebratory social post. Apply a clean editorial grade, soft highlight bloom, and balanced contrast. Preserve the person’s face, pose, clothing, and the recognizable location. If the existing framing permits, make the upper background calmer so a designer can add a message later. Do not generate words, numbers, logos, confetti, or new props inside the image.",
    },
    {
      id: "nostalgic-film-flash",
      title: "Nostalgic film flash",
      summary: "Warm analog character without losing the original scene.",
      refinedPrompt:
        "Treat this photo like a carefully scanned film frame shot with direct flash. Add fine organic grain, softly blooming bright points, warm midtones, and gently compressed blacks. Keep the original subject, composition, clothing colors, and setting recognizable. Let edges remain detailed enough for a modern editorial image. Avoid heavy scratches, fake film borders, orange casts on skin, or changes to facial features.",
    },
    {
      id: "clean-social-portrait",
      title: "Clean social portrait",
      summary: "Bright, effortless polish for a profile-ready image.",
      refinedPrompt:
        "Refine the uploaded portrait for a crisp, natural social profile image. Balance exposure across the face, simplify distracting color casts in the background, and use a soft neutral grade with clear eyes and realistic skin. Preserve the person’s facial features, expression, hairstyle, outfit, and crop. Retain natural pores and small details; avoid face reshaping, porcelain skin, added blur, or a synthetic studio look.",
    },
  ]),
  ...group("Cinematic selfie", "selfie", [
    {
      id: "cinematic-selfie",
      title: "Cinematic selfie",
      summary: "Film-like depth and light for an everyday selfie.",
      refinedPrompt:
        "Edit this selfie into a cinematic close portrait. Give the existing light a clear direction, separate the subject gently from the background, and grade shadows and highlights with film-like depth. Keep facial identity and proportions exactly as photographed, along with skin tone, expression, hair, outfit, and camera framing. Blur only the background where optically plausible; do not retouch away skin texture or invent a different setting.",
    },
    {
      id: "single-source-low-key",
      title: "Single-source low key",
      summary: "One warm side light, quiet shadows, intimate mood.",
      refinedPrompt:
        "Relight the selfie as if one warm practical light sits to the side of the face. Let the opposite side fall into a soft, detailed shadow and introduce a trace of natural photographic grain. Match highlights and shadows to the original facial planes. Preserve identity, expression, hairstyle, clothing, and framing. Avoid crushed blacks, extra lamps in the frame, altered features, or an exaggerated orange glow.",
    },
    {
      id: "bright-profile-selfie",
      title: "Bright profile selfie",
      summary: "An even, honest portrait for a clean profile picture.",
      refinedPrompt:
        "Make this selfie feel open, bright, and professional without losing its character. Lift uneven shadows on the face, neutralize distracting color casts, and gently simplify the background while retaining its natural depth. Keep the exact facial features, expression, hair, clothing, and crop. Preserve realistic skin texture and believable light direction. Do not change the person’s age, shape, or identity.",
    },
  ]),
  ...group("Backgrounds", "standing", [
    {
      id: "warm-gray-studio",
      title: "Warm gray studio",
      summary: "Move a portrait into a quiet, seamless studio scene.",
      refinedPrompt:
        "Replace only the background with a seamless warm-gray studio wall and floor. Rebuild natural contact shadows around the subject and use soft frontal illumination with a restrained edge light so the person belongs in the new space. Keep the person’s identity, pose, body proportions, clothing, hair, and camera perspective unchanged. Ensure the outline is clean around hair and fabric; add no furniture, text, or props.",
    },
    {
      id: "golden-coast-backdrop",
      title: "Golden coast backdrop",
      summary: "A believable beach setting at the last light of day.",
      refinedPrompt:
        "Place the existing subject on a quiet shoreline just before sunset. Show a natural horizon, warm low-angle light, subtle atmospheric depth, and a shadow that follows the new light direction. Match the subject’s edge lighting, contrast, and color temperature to the beach. Preserve their face, body, pose, hairstyle, outfit, and scale in frame. Avoid floating feet, tropical clichés, extra people, or a pasted-on silhouette.",
    },
    {
      id: "pastel-editorial-backdrop",
      title: "Pastel editorial backdrop",
      summary: "A spare peach-to-lavender background for visual copy.",
      refinedPrompt:
        "Replace the background behind the subject with a smooth, understated editorial field that moves from pale peach to soft lavender. Keep lighting on the person coherent with the original photograph and leave calm negative space on the right for later design work. Preserve facial features, skin tone, pose, wardrobe, and camera crop. Do not generate words, logos, hard graphic shapes, halos, or an artificial cutout edge.",
    },
    {
      id: "background-amber-halo",
      title: "Background amber halo",
      summary:
        "A subtle glow behind the subject, with natural foreground light.",
      refinedPrompt:
        "Introduce a soft amber pool of light on the background behind the person, fading gradually into the existing environment. Let it add depth without turning into a visible graphic circle. Keep foreground exposure, facial identity, pose, clothing, and scene composition as they are. Respect the surface texture and existing shadows. Avoid lens flares, blown highlights, colored outlines, or changes to the subject.",
    },
  ]),
  ...group("Portrait retouch", "smile", [
    {
      id: "natural-skin-refinement",
      title: "Natural skin refinement",
      summary: "A light retouch that keeps the person recognizable.",
      refinedPrompt:
        "Gently refine the skin in the uploaded portrait. Reduce a few temporary blemishes and soften harsh under-eye shadows while keeping pores, freckles, fine lines, and the subject’s natural skin tone visible. Preserve facial shape, expression, makeup, hair, light direction, and framing. Retouch only what looks temporary; do not slim features, erase defining marks, smooth everything flat, or brighten the face unnaturally.",
    },
    {
      id: "natural-smile-brightening",
      title: "Natural smile brightening",
      summary: "Correct a color cast in the smile without over-whitening.",
      refinedPrompt:
        "Make a restrained adjustment to the teeth visible in this portrait. Remove the strongest yellow cast while retaining natural ivory variation, tooth shape, surface detail, and the original smile. Match the result to the scene’s color temperature and keep lips, skin, facial features, expression, and lighting unchanged. Avoid pure-white teeth, enlarged smiles, new teeth, or changes elsewhere in the image.",
    },
    {
      id: "subtle-editorial-retouch",
      title: "Subtle editorial retouch",
      summary: "Even tone and refined highlights without a beauty filter.",
      refinedPrompt:
        "Give the portrait a restrained editorial finish. Balance uneven skin tone, reduce distracting shine, and add a gentle warmth to existing highlights while keeping the original makeup and lip color plausible. Maintain visible pores and natural transitions around eyes and hair. Preserve the person’s facial geometry, identity, expression, lighting direction, hairstyle, and crop. Avoid contouring that changes features or an airbrushed result.",
    },
    {
      id: "detail-recovery",
      title: "Fine detail recovery",
      summary: "Clean up a compressed image while respecting real detail.",
      refinedPrompt:
        "Improve the technical clarity of this photograph. Reduce compression blocks and color noise, recover edges that are already present, and apply subtle sharpening to important details without creating halos. Preserve the face, true skin texture, colors, framing, and original lighting. Where detail is genuinely missing, keep the result natural rather than inventing features, jewelry, text, or fabric patterns.",
    },
  ]),
  ...group("Style transfer", "portrait", [
    {
      id: "warm-portrait-film",
      title: "Warm portrait film",
      summary: "Gentle grain, soft contrast, and warm skin tones.",
      refinedPrompt:
        "Grade the uploaded image like a warm color-negative portrait scan. Keep skin tones natural, lower saturation slightly in the surroundings, lift deep blacks a touch, and add fine, even grain. Let highlights roll off softly without flattening the image. Preserve the subject’s identity, pose, outfit, background layout, and camera crop. Avoid fake film borders, color banding, heavy orange skin, or lost facial detail.",
    },
    {
      id: "impressionist-canvas",
      title: "Impressionist canvas",
      summary: "Visible paint texture with the original scene still legible.",
      refinedPrompt:
        "Interpret the uploaded photograph as an impressionist oil painting. Build the scene from expressive, visible brush marks, softened contours, and layered color rather than a photographic filter. Keep the subject recognizable, preserve their pose and the overall arrangement of objects, and retain the original crop. Give faces and hands careful structure. Avoid extra figures, warped anatomy, text, or a uniform digital smear.",
    },
    {
      id: "symmetrical-retro-editorial",
      title: "Symmetrical retro editorial",
      summary: "Orderly framing and muted color blocks with period charm.",
      refinedPrompt:
        "Restyle the photograph as a carefully art-directed retro editorial frame. Use balanced visual geometry, softly flattened frontal light, and a limited palette of dusty pink, muted green, and ochre where compatible with the scene. Preserve the subject’s face, pose, wardrobe silhouette, and recognizable setting. Refine color and framing gently; do not move people unnaturally, introduce props, or imitate a specific living artist’s signature.",
    },
  ]),
  ...group("Outfit edits", "standing", [
    {
      id: "charcoal-tailored-look",
      title: "Charcoal tailored look",
      summary: "A sharp formal outfit with believable fit and folds.",
      refinedPrompt:
        "Replace the visible outfit with a well-fitted charcoal wool suit, clean white shirt, understated belt, and polished dark shoes where feet are visible. Follow the subject’s pose, body proportions, and existing light so seams, folds, and contact shadows look real. Preserve facial identity, hairstyle, hands, background, and crop. Do not alter body shape, add jewelry, create extra limbs, or place shoes outside the frame.",
    },
    {
      id: "relaxed-streetwear",
      title: "Relaxed streetwear",
      summary: "Comfortable layers with realistic fabric weight.",
      refinedPrompt:
        "Change the subject’s clothing to an oversized cream hoodie, relaxed dark denim, and simple white sneakers where visible. Make the fabric drape naturally over the existing pose, with accurate cuffs, seams, and shadows. Keep face, hair, expression, body proportions, hands, location, and camera angle unchanged. Avoid floating clothing, distorted fingers, copied logos, or changing parts of the scene beyond the outfit.",
    },
    {
      id: "emerald-evening-gown",
      title: "Emerald evening gown",
      summary: "A flowing formal silhouette in deep green silk.",
      refinedPrompt:
        "Replace the outfit with a floor-length emerald silk evening gown suited to the subject’s existing stance. Render subtle fabric sheen, natural folds, and a graceful hem that interacts with the floor. Keep facial features, hair, body proportions, pose, hands, original surroundings, and camera crop intact. Match the garment’s shadows to the scene. Avoid reshaping the person, adding jewelry or a red carpet, or inventing visible legs.",
    },
  ]),
  ...group("Color grading", "portrait", [
    {
      id: "amber-cinema-grade",
      title: "Amber cinema grade",
      summary: "Warm highlights and dense shadows with a filmic roll-off.",
      refinedPrompt:
        "Color-grade the existing photograph with restrained amber highlights, deep but detailed shadows, and slightly softened blacks. Maintain neutral skin where appropriate and let the warmth follow the actual light sources. Preserve every subject, expression, object position, and the original composition. Apply color and tonal changes only; avoid new light fixtures, heavy orange overlays, crushed shadow detail, or altered clothing colors.",
    },
    {
      id: "teal-amber-cinema",
      title: "Teal and amber cinema",
      summary: "Cool environmental shade against warm human highlights.",
      refinedPrompt:
        "Create a controlled cinematic contrast between cool blue-green shadows in the environment and warm amber highlights on the subject. Keep skin believable, maintain detail in the darkest areas, and let the color separation arise from the existing lighting. Preserve identity, pose, wardrobe, setting, and crop. Do not recolor everything uniformly, add artificial rim lights, or change objects in the scene.",
    },
    {
      id: "muted-pastel-fade",
      title: "Muted pastel fade",
      summary: "Lifted blacks and soft color for a calm editorial finish.",
      refinedPrompt:
        "Give the uploaded photo a quiet pastel print finish. Lower contrast slightly, lift the deepest blacks, and soften strong colors into a cohesive range while retaining separation between skin, clothing, and background. Keep all subjects, facial features, expressions, framing, and objects unchanged. Preserve local detail so the result remains photographic; avoid flat gray haze, posterization, or a candy-colored overlay.",
    },
  ]),
  ...group("Object removal", "street", [
    {
      id: "remove-edge-bystander",
      title: "Remove edge bystander",
      summary: "Rebuild the scene naturally after clearing a distraction.",
      refinedPrompt:
        "Remove the incidental person at the right edge of the uploaded photo. Reconstruct the wall, paving, and shadow that should continue behind them, matching perspective, texture, and light. Leave the main subject, their outline, and all other scene details untouched. Do not crop the frame or replace the location. Avoid repeated bricks, broken lines, blurred patches, or ghosted silhouettes.",
    },
    {
      id: "clear-desk-clutter",
      source: "desk",
      title: "Clear desk clutter",
      summary: "Remove loose papers and cables, keeping the work setup intact.",
      refinedPrompt:
        "Clear scattered papers and loose cables from the desk in this photograph. Reconstruct the tabletop beneath them with continuous grain, accurate reflections, and shadows consistent with the room. Leave the laptop, lamp, mug, furniture, and camera angle exactly where they are. Remove only the named clutter; do not create a perfectly sterile desk, new objects, or smeared wood texture.",
    },
    {
      id: "clear-background-cars",
      title: "Clear background cars",
      summary: "Restore a continuous street scene behind the subject.",
      refinedPrompt:
        "Remove the parked vehicles in the background of this street photograph. Continue the curb, pavement, storefronts, and distant shadows through the cleared areas with consistent perspective and scale. Keep the main subject, foreground, buildings, and original framing untouched. Avoid repeated windows, warped road markings, sudden changes in weather, or new vehicles.",
    },
  ]),
  ...group("Photo restoration", "archival", [
    {
      id: "repair-archival-damage",
      title: "Repair archival damage",
      summary: "Mend physical marks while preserving the photograph’s age.",
      refinedPrompt:
        "Restore this scanned photograph by removing physical scratches, creases, dust spots, and small tears. Rebuild missing areas from nearby visual evidence, preserving the people, clothing, setting, and original tonal range. Keep authentic film grain, period softness, and the direction of the original light. Do not modernize faces, invent fine details, colorize a monochrome image, or remove intentional texture.",
    },
    {
      id: "period-aware-colorization",
      title: "Period-aware colorization",
      summary: "Add restrained, plausible color to a monochrome memory.",
      refinedPrompt:
        "Colorize this black-and-white photograph with subdued hues appropriate to the era and visible materials. Give skin, fabric, foliage, and architecture believable variation while retaining the source image’s contrast, grain, and lighting. Keep faces, clothing shapes, objects, and composition unchanged. Where a color cannot be inferred, choose a neutral plausible tone instead of a bright guess. Avoid modern saturation and smooth plastic textures.",
    },
    {
      id: "recover-faded-print",
      source: "faded",
      title: "Recover faded print",
      summary: "Bring back color and contrast without erasing the era.",
      refinedPrompt:
        "Refresh this faded color print by gently recovering shadow depth, highlight separation, and believable color balance. Use remaining color cues in the image to guide the restoration; keep its period character and slight softness. Preserve every face, object, frame edge, and original light source. Avoid modern high-contrast grading, invented detail, over-sharpening, or changing the photograph’s subject.",
    },
  ]),
  ...group("Product photography", "product", [
    {
      id: "clean-commerce-cutout",
      afterImage: "/prompt-gallery/clean-commerce-cutout-after-v2.webp",
      title: "Clean commerce cutout",
      summary: "A precise product image on seamless white.",
      refinedPrompt:
        "Present the product from the uploaded photo against a clean white studio background. Keep its exact shape, materials, color, proportions, markings, and camera angle. Add a soft, physically plausible contact shadow below it and even light that reveals surface detail without blowing out white areas. Remove only the original surroundings. Avoid changing packaging text, inventing logos, stretching edges, or making the product float.",
    },
    {
      id: "morning-lifestyle-product",
      title: "Morning lifestyle product",
      summary: "Place the product in a quiet, naturally lit setting.",
      refinedPrompt:
        "Stage the existing product in a calm lifestyle scene with morning window light, a neutral linen surface, and only a few supporting objects that do not obscure it. Match reflections, scale, perspective, and contact shadow to the new setting. Preserve the product’s form, color, materials, labels, and visible details exactly. Avoid extra products, new branding, busy decoration, or unrealistic shine.",
    },
    {
      id: "walnut-flat-lay",
      source: "flatlay",
      title: "Walnut flat lay",
      summary: "A composed overhead product story with tactile props.",
      refinedPrompt:
        "Create an editorial overhead arrangement centered on the uploaded product. Set it on a warm walnut surface with restrained supporting props such as folded linen and a small ceramic piece, leaving breathing room around the item. Preserve the product’s actual shape, color, markings, and material texture. Keep shadows consistent with one soft light source. Avoid duplicated items, unreadable labels, crowded styling, or a changed product design.",
    },
  ]),
  ...group("Creative effects", "portrait", [
    {
      id: "forest-double-exposure",
      title: "Forest double exposure",
      summary: "Misty pines appear within a recognizable silhouette.",
      refinedPrompt:
        "Blend a misty evergreen forest into the subject’s silhouette as a photographic double exposure. Let tree forms and atmospheric depth show most clearly through clothing and hair while keeping the face legible and the pose unchanged. Use a cool, muted palette and soft transitions that feel like layered film. Preserve the original composition. Avoid extra faces, hard cutout edges, unreadable features, or text.",
    },
    {
      id: "rainy-city-atmosphere",
      source: "sunny",
      title: "Rainy city atmosphere",
      summary: "Add believable rainfall, wet surfaces, and quiet haze.",
      refinedPrompt:
        "Change the scene to a light rain. Add fine diagonal rain where it would be visible, soft reflections on existing pavement, and a little atmospheric haze in the distance. Match wet highlights and shadows to the scene’s original lighting. Keep the subject, pose, clothing, architecture, and framing unchanged. Avoid heavy storm effects, flooded streets, duplicated reflections, or rain passing unrealistically through sheltered areas.",
    },
    {
      id: "analog-light-leak",
      title: "Analog light leak",
      summary: "A restrained amber flare across one edge of the frame.",
      refinedPrompt:
        "Add a subtle analog light leak entering from the upper-right edge of the photograph. Let warm amber and soft red bleed gently into nearby highlights, with a faint film-like softness that does not cover the main subject. Preserve face, expression, pose, scene geometry, and crop. Keep the effect localized and imperfect rather than a smooth digital gradient. Avoid blown faces, extra objects, or simulated text.",
    },
  ]),
  ...group("Lighting", "sunny", [
    {
      id: "late-afternoon-glow",
      title: "Late-afternoon glow",
      summary: "Warm side light with shadows that follow the scene.",
      refinedPrompt:
        "Relight the photograph as if low late-afternoon sunlight enters from the left. Add a soft warm edge to the subject and let shadows extend naturally in the opposite direction. Preserve facial identity, pose, wardrobe, existing objects, and camera position. Keep highlights controlled and skin tones realistic; avoid a generic orange wash, fake lens flare, or light that contradicts the setting.",
    },
    {
      id: "gentle-midday-fill",
      title: "Gentle midday fill",
      summary: "Soften hard facial shadows while keeping daylight honest.",
      refinedPrompt:
        "Reduce the harshness of direct midday shadows on the subject’s face. Recover readable detail in shaded areas as though a subtle reflector provided fill, while maintaining the sun’s direction and the scene’s natural brightness. Preserve skin tone, facial features, expression, clothing, and composition. Do not flatten all shadows, redraw features, or turn the scene into overcast light.",
    },
    {
      id: "highlight-recovery",
      title: "Highlight recovery",
      summary: "Restore a balanced sky and bright surfaces naturally.",
      refinedPrompt:
        "Balance the exposure of this photograph by recovering plausible detail in over-bright sky and reflective surfaces. Roll highlights off gently and keep the original light direction, color, subject, and framing. Maintain contrast and texture in unaffected regions. If an area contains no recoverable detail, use a natural tonal transition rather than inventing clouds, structures, or patterns. Avoid HDR halos and muddy shadows.",
    },
  ]),
];
