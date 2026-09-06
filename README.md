# Timbertrail

A quiet, original pixel-art wilderness survival prototype. Static HTML/CSS and vanilla JavaScript; Canvas 2D rendering and procedural Web Audio. No runtime dependencies or backend.

## Play

Open `index.html` with the `assets/` directory beside it, or serve this directory with a static web server. Move with A/D or arrows, crouch with S/down, stand with W/up; Shift runs. Click objects to approach and gather. The top hover rail equips tools/food and opens Journal: Backpack, Crafting, Field Notes and Map. Drag compatible items from Backpack to the typed top slots. Settings and reset are in the upper-left menu.

Start with berries, no tools. Craft a flint knife, cord and flint axe. Trade hides with Aarni for a longer-lasting puukko or steel axe. Fell trees, split fallen logs, collect billets, fuel your campfire and skin hunted game. A single forest chapter is playable; further regions are planned.

## Development and checks

Node.js 22 or later; no npm install required.

```sh
npm test
npm run check:secrets
npm run build
node scripts/check-assets.cjs --production
```

Build output: `dist/` (ignored by Git). Tests cover core mechanics and DOM/event integration, not browser layout or perceived sound quality. Inspect animation, page boundaries and audio in a real play session.

Modules: engine.js (simulation/save), render.js/world-art.js/equipment.js (art), game.js (input/UI), panels.js (panels), i18n.js (English/Finnish), audio.js (sound).

## Save data

Browser localStorage, key `timbertrail-save-v3`; legacy saves are migrated without deletion. Save data is specific to browser and site origin: the local file and GitHub Pages do not share saves. Reset asks for confirmation. The existing local project folder is retained unchanged in location.

## GitHub Pages

The workflow tests and builds on main, then deploys the static output. GitHub Pages is configured with **GitHub Actions** as its source. Public test URL: https://jonivainio.github.io/Timbertrail/ . Relative asset paths support this subdirectory. Each update is live only once its deployment succeeds.

## Woodland polish — September 2026

- Journal opens with Tab from gameplay (Tab navigates controls inside it); vertical tabs and independent page scrolling. One knife, axe and food slot with typed drag/drop.
- User-supplied map and main-menu illustration. Forest and neighboring Riverbank have pastel-red markers. Riverbank is a preview of the next chapter, not a second playable map; three further biomes are grey.
- Lean-to requires 8 large sticks, 4 branches, 6 fibre and 2 cord, plus a usable axe.
- Bark-covered logs and irregularly scattered billets; positions, rotation and visual variants survive saving.
- Independent sound/music switches and volume sliders, saved locally. Music plays for roughly 42 seconds per four-minute cycle, leaving long natural ambience intervals. Quiet birds in sunny woodland, occasional wind and three rain levels. Rain occurs on roughly 13% of generated days; sleeping also advances weather.
- Swaying canopy light with sprite-alpha occlusion, terrain-following pools/contact shadows and occasional local morning mist around hollows and streams. These are 2D effects, not physical 3D lighting.

## Continue work in ChatGPT / Codex

For desktop work, attach this actual repository directory as the local project's primary folder. For cloud coding, connect the GitHub repository to a Codex cloud environment. A regular ChatGPT Project organizes conversations and sources but does not itself synchronize this local folder or push commits. Review and commit/push completed changes (or merge a reviewed cloud PR) to main; Pages updates automatically after successful tests. Durable instructions are in AGENTS.md. Official guidance: https://learn.chatgpt.com/docs/projects and https://learn.chatgpt.com/docs/cloud .

## Art and scope

Original generated art and user-supplied props; no Wild n Chill assets are included. Prompt/source notes live in assets/*.md. Lighting is stylized 2D, not ray tracing. Full wilderness chapters, cabin restoration and a Steam build are future work.
