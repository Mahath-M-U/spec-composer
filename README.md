# Spec Composer

[![Version](https://img.shields.io/badge/version-0.5.1-orange.svg)](../../releases)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Node](https://img.shields.io/badge/node-%E2%89%A522.12-339933.svg)](#requirements)
[![PRs welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)

**Compose a poster visually. Export it as a precise, structured specification.**

Spec Composer is a local-first design tool for social-media posters and other
creative formats. Every headline, offer, CTA, logo and image on the canvas is a
typed, semantic element with an exact position, size and style, so a layout can
leave the app as a DESIGN.md spec, an image-model prompt, structured JSON or a
PNG instead of pixels only.

There is no backend, no account, no API key and no AI call. Your work stays in
your browser.

**Current release: v0.5.1.** Spec Composer is in early development: the UI and
document format may change between 0.x releases.

<!-- Screenshot placeholder: add an image committed to the repo and reference it here. -->

## Features

- **Semantic elements**: titles, subheadings, body copy, eyebrows, offers,
  prices, badges, CTAs, hero / product / model / supporting images, logos,
  brand marks, shapes and dividers.
- **Ready-made formats** for Instagram, Facebook, LinkedIn, WhatsApp, YouTube,
  X, TikTok and Pinterest, plus generic and custom sizes.
- **Starter templates** that clone into editable designs.
- **Canvas editing**: multi-select, drag, resize, snapping guides, zoom, pan,
  layers, grouping and one-click layouts.
- **Design kits**: reusable colours, typeface, style and mood, including a kit
  generated from a single seed colour.
- **Live output**: a DESIGN.md spec and a natural-language image prompt that
  regenerate as you edit, with toggles for what to include.
- **Export** to DESIGN.md, JSON, or PNG at the target resolution.
- **Prompt gallery** of example image prompts you can copy.
- **Quick tour**: a guided walkthrough of the home screen, editor and design
  kits.
- **Undo / redo** and automatic saving in your browser.

## Quick start

### Requirements

- [Node.js](https://nodejs.org) **22.12 or newer**
- npm (included with Node.js); use the committed `package-lock.json`

### Install and run

Clone this repository using its GitHub URL, then run from the project directory:

```sh
npm ci
npm run dev
```

Open the URL printed in the terminal.

## Scripts

| Command                | What it does                             |
| ---------------------- | ---------------------------------------- |
| `npm run dev`          | Start the development server             |
| `npm run build`        | Create a production build in `.output/`  |
| `npm run build:dev`    | Build in development mode                |
| `npm run preview`      | Preview the production build locally     |
| `npm run typecheck`    | Type-check the project with TypeScript   |
| `npm run lint`         | Lint the project with ESLint             |
| `npm run format`       | Format the project with Prettier         |
| `npm run format:check` | Check formatting without rewriting files |

There is no automated test suite yet; `typecheck`, `lint` and `build` are the
current checks.

## Usage

1. **Pick a format** on the home screen, then start blank or from a template.
2. **Compose** in the editor: add elements, arrange them on the artboard and
   apply a design kit.
3. **Review the output** in the output panel. It regenerates as you edit; text
   you edit by hand is kept and flagged as out of sync until you reset it.
4. **Copy** the prompt, or **export** DESIGN.md, JSON or PNG.

Press **Tour** in the app for a guided walkthrough.

### Keyboard shortcuts

| Key                        | Action                          |
| -------------------------- | ------------------------------- |
| `V` / `H`                  | Select tool / Hand tool         |
| `P`                        | Preview                         |
| `Ctrl/Cmd` + `Z`           | Undo                            |
| `Ctrl/Cmd` + `Shift` + `Z` | Redo                            |
| `Ctrl/Cmd` + `D`           | Duplicate                       |
| `Ctrl/Cmd` + `G`           | Group                           |
| `Ctrl/Cmd` + `Shift` + `G` | Ungroup                         |
| `Delete` / `Backspace`     | Delete selection                |
| Arrow keys                 | Nudge selection (`Shift`: 8 px) |
| `Esc`                      | Clear selection                 |

## Data and privacy

- Projects and kits are stored in your browser's IndexedDB, encrypted at rest
  with AES-GCM using a non-extractable key generated on your device. This does
  not protect against scripts running on the app's own origin.
- Small preferences (theme, layout, default kit) are kept in `localStorage`.
- If IndexedDB or WebCrypto is unavailable (for example in some private
  windows), the app falls back to unencrypted `localStorage` and tells you.
- Images you place in an image element are read locally, saved with the project
  in your browser and never sent to a server. They are also embedded in JSON
  exports.
- Typefaces load from Google Fonts (`fonts.googleapis.com`,
  `fonts.gstatic.com`). Self-host them if you need to avoid those requests.

## Deployment

`npm run build` writes a Nitro server bundle to `.output/`. The Lovable Vite
preset used by this project targets Cloudflare by default; see the
[TanStack Start hosting guide](https://tanstack.com/start/latest/docs/framework/react/guide/hosting)
for other platforms.

## Tech stack

[TanStack Start](https://tanstack.com/start) and Router on
[Vite](https://vite.dev) and [Nitro](https://nitro.build),
[React 19](https://react.dev), [TypeScript](https://www.typescriptlang.org),
[Tailwind CSS v4](https://tailwindcss.com), [shadcn/ui](https://ui.shadcn.com)
on [Radix UI](https://www.radix-ui.com) with some [MUI](https://mui.com),
[Zustand](https://zustand.docs.pmnd.rs),
[TanStack Query](https://tanstack.com/query), [Zod](https://zod.dev),
[dnd-kit](https://dndkit.com), [react-rnd](https://github.com/bokuweb/react-rnd)
and [html-to-image](https://github.com/bubkoo/html-to-image).

## Project structure

```text
src/
  components/         Shared UI (shadcn/ui primitives in components/ui)
  features/
    spec-composer/    Document schema, store, compiler, formats, templates,
                      design kits, editor and discovery UI
  hooks/              Reusable React hooks
  lib/                Utilities and browser storage
  routes/             File-based routes
public/               Static assets
```

The document schema in `src/features/spec-composer/types.ts` (Zod) is the
single source of truth for the canvas, output and exports.

## Contributing

Contributions are welcome. Read [CONTRIBUTING.md](CONTRIBUTING.md) before
opening a pull request, and open a GitHub issue for bugs or feature ideas. To
report a security problem, follow [SECURITY.md](SECURITY.md) instead of opening
a public issue.

## License

Released under the [MIT License](LICENSE). Copyright (c) 2026 MAHATH M U.

The images in `public/prompt-gallery/` and `public/template-cards/` and the app
icon were generated with AI tools. They are illustrations, not photographs of
real people, places or products. Third-party logos shown in the app are not
AI-generated. See [ATTRIBUTIONS.md](ATTRIBUTIONS.md) for the source and license
of every image, logo and font.

Third-party dependencies are distributed under their own licenses. Google Fonts
loaded at runtime are open-licensed, mostly under the SIL Open Font License.

**Trademarks:** tool names and logos shown in the app are trademarks of their
respective owners, used only to identify the tool. No integration or
endorsement is implied.

## Notices

- **No warranty**: Spec Composer is provided "as is", without warranty of any
  kind. The [MIT License](LICENSE) is the authoritative text.
- **AI-generated images**: they can contain mistakes or unintended
  similarities to existing works. Review them before reusing them.
- **Your content**: you are responsible for having the rights to the images,
  logos, fonts and brand assets you add, and for what you publish.
- **Third-party AI tools**: Spec Composer does not connect to any AI service
  and never asks for an API key. Prompts and specs you paste into tools such as
  ChatGPT, Gemini or Midjourney are subject to those tools' terms, and their
  output may be inaccurate. Check it before publishing or commercial use.
  Spec Composer is not affiliated with these tools.
- **Demo content**: names, companies, contact details, prices and products in
  templates and examples are fictional.

A short version of these notices is available in the app at `/legal`.

## Acknowledgements

The idea for Spec Composer was inspired by the canvas-to-prompt workflow of
[m3e-canvas](https://github.com/lnkiai/m3e-canvas), adapted here for graphic
design.

Scaffolded with [Lovable](https://lovable.dev). UI primitives from
[shadcn/ui](https://ui.shadcn.com) and [Radix UI](https://www.radix-ui.com);
some tool glyphs from [Simple Icons](https://simpleicons.org). The full list of
third-party assets is in [ATTRIBUTIONS.md](ATTRIBUTIONS.md).
