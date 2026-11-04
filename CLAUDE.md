# Timbertrail — Claude guide

Quiet pixel-art wilderness survival game. Vanilla JS + Canvas 2D, no runtime dependencies, Node 22+.

## Branches
- `main` = stable 0.8.4, deployed to GitHub Pages by `.github/workflows/pages.yml`. Do not push or merge to `main` without an explicit request from Joni.
- `overhaul` = audiovisual overhaul (imported from the Codex handoff, Nov 2026). Work in small PRs targeting `overhaul`.

## Commands
- `npm test` — full unit/contract suite (must pass before every PR)
- `npm run build` — writes `dist/` (gitignored); serve `dist/` with any static server to play
- `npm run check:secrets`, `node scripts/check-assets.cjs --production`
- New JS/CSS files must be added to `scripts/build.cjs` and `index.html`.

## Architecture (short)
- `engine.js` owns game state, saves, interaction. `regions.js` anchors. Rendering must never mutate simulation or saves.
- `render.js` main renderer; `visual-core.js` camera/surfaces; `visual-world.js` sky, terrain, water, light; `terrain-surface.js` shared geometry.
- Art/animation: `cabin-*.js`, `traveller-art.js`, `equipment.js`, `kajo-art.js`, `fishing-art.js`, `assets/art-v2/*.json` metadata.
- UI: `panels.js`, `storage-ui.js`, `i18n.js` (FI/EN), `visual-ui.css`, `visual-title.css`.
- Audio: `audio.js` (when), `audio-samples.js` (samples), `title-music.js`, `world-music.js`; licences in `assets/audio/*.json`.
- Save key `timbertrail-save-v3`; keep migrations from older keys.

## Direction (from Joni)
- Goal: a genuinely stylish game — visuals, UI, motion and audio. References: Kingdom Two Crowns (silhouettes, parallax, reflective water, minimal HUD, light at night) and Wild n Chill (cozy survival, dog companion, natural terrain).
- Codex output may be redone where it can be better. Keep gameplay mechanics and save compatibility.
- Minimal UI text: no filler taglines, footers or explanatory captions. Every visible string must earn its place.
- Verify visual changes with before/after browser screenshots (Playwright), not only unit tests. Audio balance needs Joni's listening approval.
- User-facing communication in Finnish.
