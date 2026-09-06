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

The workflow tests and builds on main, then deploys the static output. Repository Settings → Pages → Source must be **GitHub Actions**. Expected project URL: https://jonivainio.github.io/Timbertrail/ . Relative asset paths support this subdirectory. Publishing is only complete once the deployment succeeds.

## Art and scope

Original generated art and user-supplied props; no Wild n Chill assets are included. Prompt/source notes live in assets/*.md. Lighting is stylized 2D, not ray tracing. Full wilderness chapters, cabin restoration and a Steam build are future work.
