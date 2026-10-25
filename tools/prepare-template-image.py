"""Encode a visually approved image without resizing, and register its generation evidence.

Example: python tools/prepare-template-image.py flash-sale C:/path/source.png --alt "..." --generated-at 2026-10-24 --approved
The source PNG is retained unchanged. Uses the already-installed Pillow package.
"""

import argparse
from datetime import date
import hashlib
import json
from pathlib import Path
import re

from PIL import Image


ROOT = Path(__file__).resolve().parents[1]
COMMON_WRAPPER = '''Use case: ads-marketing
Asset type: finished social template preview. Required canvas aspect ratio ${p.format.width}:${p.format.height}; target ${p.format.width} x ${p.format.height} pixels.
Generate ONE polished full-bleed design for "${p.name}". Render every current text string exactly; do not swap copy, add text or editor UI. No image is attached; the authoritative layout specification below replaces the attached mockup mentioned in the source brief. Preserve the required native aspect ratio and safe margins. Output only the finished artwork.

SOURCE IMAGE PROMPT:
${p.imageGenerationPrompt}

AUTHORITATIVE STYLE AND LAYOUT (use exact current content; ignore general suggestions to swap copy):
${p.designMarkdown}'''
PRODUCT_WRAPPER = '''Use case: ads-marketing
Asset type: finished social template preview, ${p.format.width} x ${p.format.height} pixels, exact ${p.format.width}:${p.format.height} aspect ratio.
Generate one polished finished design for "${p.name}". Use the exact current copy shown in the specification. Do not swap copy, add content, draw editor controls, or show a mockup border. No reference image is attached; reconstruct the layout from the textual specification below. The mention of an attached mockup in the source brief is workflow context only. The final output is a standalone, full-bleed social graphic.

SOURCE IMAGE PROMPT:
${p.imageGenerationPrompt}

AUTHORITATIVE STYLE AND LAYOUT SPECIFICATION (current content and positions are required, regardless of general suggestions to swap copy):
${p.designMarkdown}'''


def sha256(value):
    return hashlib.sha256(value.encode("utf-8")).hexdigest()


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("slug")
    parser.add_argument("source", type=Path)
    parser.add_argument("--alt", required=True)
    parser.add_argument("--approved", action="store_true", required=True)
    parser.add_argument("--generated-at", type=date.fromisoformat, required=True)
    parser.add_argument("--wrapper", choices=["social-native-v1", "product-launch-v1"], default="social-native-v1")
    parser.add_argument("--submitted-prompt-file", type=Path, help="Exact prompt text for a separately approved retry")
    args = parser.parse_args()

    records = json.loads((ROOT / "public/template-cards/prompts.json").read_text(encoding="utf-8"))
    record = next((item for item in records if item["slug"] == args.slug), None)
    if record is None:
        parser.error("Unknown template slug")
    if record["promptHash"] != sha256(record["imageGenerationPrompt"]):
        parser.error("Source prompt hash is stale; run export-template-prompts.mjs first")
    wrapper = PRODUCT_WRAPPER if args.wrapper == "product-launch-v1" else COMMON_WRAPPER
    submitted = wrapper
    for key, value in {
        "format.width": record["format"]["width"], "format.height": record["format"]["height"],
        "name": record["name"], "imageGenerationPrompt": record["imageGenerationPrompt"],
        "designMarkdown": record["designMarkdown"],
    }.items():
        submitted = submitted.replace("${p." + key + "}", str(value))
    if args.submitted_prompt_file:
        submitted = args.submitted_prompt_file.read_text(encoding="utf-8")

    source = args.source.resolve(strict=True)
    target = ROOT / "public" / record["targetBitmapPath"].lstrip("/")
    with Image.open(source) as image:
        image.load()
        width, height = image.size
        target_ratio = record["format"]["width"] / record["format"]["height"]
        actual_ratio = width / height
        near_square = abs(target_ratio - 1) <= 0.08
        if abs(actual_ratio / target_ratio - 1) > 0.08 + 1e-12 or (
            not near_square and (actual_ratio >= 1) != (target_ratio >= 1)
        ):
            parser.error(f"Source aspect {width}x{height} is outside the approved native tolerance")
        image.save(target, "WEBP", quality=90, method=6)
    with Image.open(target) as encoded:
        encoded.load()
        if encoded.size != (width, height):
            raise RuntimeError("Encoding changed the source dimensions")

    registry = ROOT / "src/features/spec-composer/template-images.ts"
    text = registry.read_text(encoding="utf-8")
    entry = {
        "src": record["targetBitmapPath"], "alt": args.alt, "width": width, "height": height,
        "promptHash": record["promptHash"], "imageStyle": record["imageStyle"],
        "model": "OpenAI built-in image_gen", "generatedAt": args.generated_at.isoformat(), "status": "approved",
        "artworkRevision": record["artworkRevision"], "sourceFormatId": record["format"]["id"],
    }
    body = json.dumps(entry, ensure_ascii=False, indent=2)
    replacement = f'  "{args.slug}": ' + body.replace("\n", "\n  ") + ","
    pattern = r'^  "' + re.escape(args.slug) + r'": \{.*?^  \},'
    updated, count = re.subn(pattern, lambda _: replacement, text, count=1, flags=re.M | re.S)
    if count != 1:
        raise RuntimeError("Template registry entry was not found exactly once")
    registry.write_text(updated, encoding="utf-8")

    manifest_path = ROOT / "public/template-cards/generation-manifest.json"
    manifest = json.loads(manifest_path.read_text(encoding="utf-8")) if manifest_path.exists() else {
        "model": "OpenAI built-in image_gen", "wrappers": {}, "images": {}
    }
    manifest["wrappers"][args.wrapper] = wrapper
    evidence = {
        "sourcePath": str(source), "sourcePromptHash": record["promptHash"],
        "submittedPromptHash": sha256(submitted), "wrapperId": args.wrapper,
        "targetBitmapPath": record["targetBitmapPath"], "width": width, "height": height,
        "review": "approved",
        "generatedAt": args.generated_at.isoformat(),
    }
    if args.submitted_prompt_file:
        evidence["submittedPrompt"] = submitted
    manifest["images"][args.slug] = evidence
    manifest_path.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"Registered {args.slug}: {width}x{height}, {target.stat().st_size} bytes; original retained")


if __name__ == "__main__":
    main()
