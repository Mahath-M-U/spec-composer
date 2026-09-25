# Attributions

This file lists where Spec Composer's images, logos, fonts and other
third-party material come from. The code is released under the
[MIT License](LICENSE).

## AI-generated images

The following images were created by the project author with generative AI
tools:

- `public/prompt-gallery/*.webp`: before-and-after examples in the prompt
  gallery.
- `public/template-cards/*.webp`: template preview images.
- `public/favicon.svg`, `public/light-team.svg`, `public/dark-team.svg`: the
  app icon. These files carry embedded Content Credentials (C2PA) metadata
  that marks them as AI-generated.

They are illustrations, not photographs. The people, places and products they
show are not real, and any resemblance to real people, brands or existing works
is unintentional. To the extent the author holds any rights in them, they are
provided under the project's MIT License.

This section does not cover the third-party logos listed below.

## Code-drawn illustrations

The vector motifs in `src/features/spec-composer/motifs/` and
`src/features/spec-composer/illustrations.tsx` are drawn in code as part of the
source and are covered by the MIT License.

## Third-party logos and trademarks

`src/assets/tool-logos/` contains the marks of Figma, Google Drive, GitHub,
Slack and Notion (via Wikimedia Commons), Lovable and Gamma (from their official
sites). The exact source of each file is recorded in
`src/features/spec-composer/tool-logos.ts`.

The Miro glyph is from [Simple Icons](https://simpleicons.org) v16.32.0. Simple
Icons releases its icon data under CC0-1.0; the mark itself remains a trademark
of its owner.

These names and logos are trademarks of their respective owners and are not
covered by the MIT License. They are shown only to identify each tool. Spec
Composer is not affiliated with or endorsed by any of them.

## Fonts

Typefaces are loaded at runtime from [Google Fonts](https://fonts.google.com)
and are not bundled. The families used are listed in `src/routes/__root.tsx`.
Each is distributed under its own open license (SIL Open Font License 1.1 or
Apache License 2.0); see the family's page on Google Fonts.

## Software

- Scaffolded with [Lovable](https://lovable.dev).
- UI primitives from [shadcn/ui](https://ui.shadcn.com) (MIT) in
  `src/components/ui`, built on [Radix UI](https://www.radix-ui.com) (MIT).
- All npm dependencies are distributed under their own licenses; see
  `package.json` and each package's license file.
