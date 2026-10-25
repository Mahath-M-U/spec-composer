import { createHash } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { createServer } from "vite";
import { format, resolveConfig } from "prettier";

// Reuse Vite's TypeScript/TSX loader without starting the application or adding a runner dependency.
const root = fileURLToPath(new URL("../", import.meta.url));
const server = await createServer({
  root,
  configFile: false,
  resolve: {
    alias: { "@": fileURLToPath(new URL("../src", import.meta.url)) },
  },
  server: { middlewareMode: true },
  appType: "custom",
});

try {
  const { starterTemplates } = await server.ssrLoadModule(
    "/src/features/spec-composer/templates.ts",
  );
  const { compileDesignSkill } = await server.ssrLoadModule(
    "/src/features/spec-composer/design-md.ts",
  );
  const { compilePromptEditorOutput } = await server.ssrLoadModule(
    "/src/features/spec-composer/compiler.ts",
  );
  const { templateSlug, TEMPLATE_ARTWORK_REVISION, templateImageFor } =
    await server.ssrLoadModule(
      "/src/features/spec-composer/template-images.ts",
    );
  const records = starterTemplates.map(({ name, document: doc }) => {
    const slug = templateSlug(name);
    const imageGenerationPrompt = compilePromptEditorOutput(doc);
    const promptHash = createHash("sha256")
      .update(imageGenerationPrompt)
      .digest("hex");
    const image = templateImageFor(name, doc.format);
    return {
      slug,
      name,
      format: {
        id: doc.format.id,
        label: doc.format.label,
        width: doc.format.width,
        height: doc.format.height,
      },
      imageStyle: doc.imageStyle,
      libraryAssetIds: [
        ...new Set(
          doc.elements.flatMap((element) =>
            element.assetId ? [element.assetId] : [],
          ),
        ),
      ].sort(),
      artworkRevision: TEMPLATE_ARTWORK_REVISION,
      targetBitmapPath: `/template-cards/${slug}.webp`,
      status:
        image?.promptHash === promptHash ? "generated" : "pending-regeneration",
      designMarkdown: compileDesignSkill(doc),
      imageGenerationPrompt,
      promptHash,
    };
  });
  const output = new URL(
    "../public/template-cards/prompts.json",
    import.meta.url,
  );
  await mkdir(new URL("./", output), { recursive: true });
  await writeFile(
    output,
    await format(JSON.stringify(records), {
      ...(await resolveConfig(fileURLToPath(output))),
      parser: "json",
    }),
  );
  console.log(
    `Exported ${records.length} template prompts (${records.filter((record) => record.status === "generated").length} generated) to public/template-cards/prompts.json`,
  );
} finally {
  await server.close();
}
