# Timbertrail

## Test release 0.8.4 — a letter at home

After restoring the Sienilampi cabin, look right inside: a loose letter lies beside the mug on the coffee table. Click to read the previous resident's story in English or Finnish on the supplied paper, with bundled Kalam handwriting. Escape or × puts it down; it stays available to reread. Reading pauses the game and does not change inventory or saves. Existing restored cabins receive it too.

## Test release 0.8.3 — startup, terrain and quiet footsteps

The first world frame waits for all required images. Landscape caches also invalidate when a late ground material or panorama arrives, fixing the floating Aarni cabin caused by network load order. Production scripts/styles and the audio registry now share a release cache key.

Fixed a non-finite outdoor-fire volume that could throw in Web Audio and stop the animation loop while existing sound continued. Optional audio failures are isolated from gameplay; core frame errors pause visibly with a retry button that preserves the journey. Four recut, leveled and deliberately quiet forest footfalls replace the uneven clips, load first, and follow the character's stride with small pitch/level variation. New journeys reset audio timing. Pending/blocked samples use non-tonal soil/needle foley.

Verified with delayed-image/cache regression tests, finite AudioParam and lifecycle tests, and an isolated real-browser production build: walking from spawn, immediate sampled steps, restarting after a long clock, Aarni's yard, injected audio failure, and render-fault retry. Tester-specific freezes without their error logs remain unconfirmed; final perceived footstep balance still needs a listening playtest. Existing saves are unchanged.

## Pixabay sound update

53 sound events now use 27 locally hosted Pixabay recordings: fishing, footsteps, gathering/tools, cabin interactions, Journal/UI, Kajo, and birds/water/wind/rain. Reel and brake loops follow the existing fishing load model and stop on release/cancel/pause/mute. Clips now use source-specific spectral noise attenuation, softer frequency balance, longer raised-cosine fades, active-window leveling and varied footsteps/crackles. Stream ambience is continuous with an overlapped seam; the full bank is about 3.0 MB. Music and night insect synthesis remain unchanged. All files decoded successfully in an actual browser; perceived quality and balance still need a listening playtest. Sources, edits and explicit listening-review status are in `assets/audio/library.json`; see `assets/PIXABAY-AUDIO.md`.

## Test release 0.8.2 — smoother fish movement

Six fish instead of eight. Turns now pass smoothly through a modeled end-on view, avoiding sudden mirrored-body jumps. Body waves, tail beats, pitch and visibility ease between states; fish keep swimming during charging and casting too. Hooks meet the fish's mouth without teleporting the fish. Released jumps finish their arc; shared swim/fight bounds and gradual respawn visibility remove other position/opacity jumps. Tails are smaller relative to the body and scale proportionally with every fish's size, not at a fixed pixel size. Regression coverage includes 96 natural casts at 30/60/144 Hz and a native Canvas review of 1,446 turning frames. Browser access to the isolated local animation preview was blocked; actual browser animation feel still needs playtesting.

Pike and zander now swim with articulated bodies, sweeping tails, moving fins and opening jaws, rather than sliding fish illustrations. They follow, inspect and dash at the lure, sometimes rejecting it. Hooked fish alternate between away-runs, dives, circling and short rests; occasional surface jumps keep the line attached to the mouth and splash on reentry. Tension builds gradually according to species, size and remaining strength, with time to react before a break. The reel brake gives a clearer ratchet under high load, even while reeling. The fishing meter sits at the bottom beneath the player/pier; ordinary movement hints temporarily hide there.

Sienilampi's pier now has playable casting, sinking/retrieval, living pike and zander, nibble/rejection behavior and tension-controlled fish fights. Eight dedicated seated poses hold a separately rendered bending rod; the line shares its tip anchor. Lure splashes, quiet reel/brake sounds and tension-driven bubbles give feedback. A landed fish opens a species/weight card using the supplied illustrations, with a gold trophy for the upper 20% of that species' possible weight range. Very large fish are rare, not one in five catches. Personal bests survive saves; existing journeys are preserved.

1. Craft/equip the **Spinning rod** (3 branches + 2 cords, knife required), travel to Sienilampi, and click the pier chair.
2. Point over water ahead: the cursor becomes a fish. Hold the left mouse button to charge; release to cast. Longer charge means greater distance.
3. Hold to reel; release to let the lure sink. Reeling first takes up slack. Try a short sinking pause for pike, or about 25–30 seconds for deeper zander.
4. With a fish hooked, reel while watching tension and listening for the brake. Release when tension rises toward red, then resume as it drops. Strong runs can pay line out; sustained excess tension breaks the line, and prolonged slack loses the hook. Escape, Stop fishing or moving cancels.
5. Landing adds 1–8 raw fillet portions, scaled to weight, for the existing campfire/kitchen recipes. The catch card pauses time. Closing it lets you cast again.

The v1 simulation uses a fixed 120 Hz step and a stylized 2D underwater cutaway, not full hydrodynamics. Forest/river keep their earlier bobber interaction; the cabin spring is drinking-only. Perch remains reserved for a later update. Physics, input/cancel paths, save compatibility, rendering anchors and audio scheduling are automated-tested, with native Canvas visual review. Actual browser animation feel and subjective sound quality still need the user's playtest.

Design, species sources and tuning: `DEVELOPMENT.md`. Generated pose art/prompts and authorized background extraction: `assets/FISHING-ART.md`.

## Fish illustrations (0.7.2)

User-supplied raw/cooked fillet illustrations replace the old fish icons in backpack, storage, cooking and quick food slots. Pike, zander and perch illustrations are registered separately for species displays; the 0.7.2 art update did not add perch spawning or change inventory/save IDs. Source notes: `assets/FISH-ICONS.md`.

## Cabin polish (0.7.1)

Cabin polish: separate fireplace and kitchen menus, quiet short fire crackles without the whooshing noise bed, drag/drop chest storage with half/exact stack transfers, linen curtains, and original decorative yard props. Sleeping restores one third of maximum health, capped at 100. Existing saves are retained.

## Sienilampi home (local test update)

Restore roof, facade and yard, then click the door. Inside, A/D pans a 1.5× close-up view; no player avatar is shown. Click visible furniture to use it immediately. The needs/health HUD and Journal remain available. Click the door to leave.

- Fireplace: add dry branches (+45 s) or large sticks (+150 s), extinguish or relight. Kitchen: cook meat/fish only while the fireplace is lit and has fuel. Fire warms the room, burns fuel outdoors too, and produces chimney smoke.
- Bed: confirm sleeping until next morning. Energy and health recover; food, water and fuel are consumed overnight.
- Chest: drag stacks between backpack and 200-unit storage. Shift-drag transfers half; selecting a stack exposes 1 / Split half / All and an exact amount field. Transfers have a keyboard/button alternative. Tool condition and stored items survive travel/reload.
- Mug clears thirst once; refill at the canister beside the table. Curtains, lantern, armchair and Kajo are interactive. Furniture is already repaired for testing.
- Aarni's canteen costs 2 hides, replacing the compass. Fill at drinking spots, use from Backpack for one full-thirst drink, then refill the reusable bottle. With a rod held, an empty carried bottle fills before fishing. Old compasses migrate to one empty bottle for free. Fill state survives chest transfers/saves.
- Cold has a light edge frost below 18 warmth, strongest at zero. Thirst damages health faster than hunger; cold damage is very slow.

Completed, verified requested changes are committed and pushed to main under the user’s ongoing GitHub-update instruction. Canvas snapshots and automated tests do not replace an in-browser layout/listening playtest.

A quiet pixel-art wilderness survival prototype. Static HTML/CSS and vanilla JavaScript; Canvas 2D rendering and Web Audio with locally hosted Pixabay samples and procedural fallback. No runtime dependencies or backend.

## Play

Open `index.html` with the `assets/` directory beside it, or serve this directory with a static web server. Move with A/D or arrows, crouch with S/down, stand with W/up; Shift runs. Click objects to approach and gather. The top hover rail equips tools/food and opens Journal: Backpack, Crafting, Field Notes and Map. Drag compatible items from Backpack to the typed top slots. Settings and reset are in the upper-left menu.

Start with berries, no tools. Craft a flint knife, cord and flint axe. Trade hides with Aarni for a longer-lasting puukko or steel axe. Fell trees, split fallen logs, collect billets, fuel your campfire and skin hunted game. Three connected areas are playable: Forest, Aarni River Trail, and Sienilampi.

## Development and checks

Pixabay sound workflow: [Finnish instructions, search candidates and import steps](assets/PIXABAY-AUDIO.md). Run `npm run sounds -- search` for action-specific searches. Reviewed local clips can replace procedural effects through `assets/audio/library.json`; the library now contains 53 prepared events from 27 Pixabay recordings (about 3.0 MB). Pixabay's documented public API does not include sounds. Sample loading requires HTTP/Pages; blocked or missing samples retain procedural audio.

Node.js 22 or later; no npm install required.

```sh
npm test
npm run check:secrets
npm run build
node scripts/check-assets.cjs --production
```

Build output: `dist/` (ignored by Git). Tests cover core mechanics and DOM/event integration, not browser layout or perceived sound quality. Inspect animation, page boundaries and audio in a real play session.

Modules: cabin-interior.js (room state, storage and actions), cabin-art.js (room rendering/chimney smoke), engine.js (simulation/save), regions.js (region graph/cabin costs), render.js/world-art.js/region-art.js/equipment.js (art), game.js (input/UI), panels.js (panels), i18n.js (English/Finnish), audio.js (sound).

## Save data

Browser localStorage, key `timbertrail-save-v3`; legacy saves are migrated without deletion. Save data is specific to browser and site origin: the local file and GitHub Pages do not share saves. Reset asks for confirmation. The existing local project folder is retained unchanged in location.

## GitHub Pages

The workflow tests and builds on main, then deploys the static output. GitHub Pages is configured with **GitHub Actions** as its source. Public test URL: https://jonivainio.github.io/Timbertrail/ . Relative asset paths support this subdirectory. Each update is live only once its deployment succeeds.

## Woodland polish — September 2026

- Tab opens and closes Journal; vertical tabs and independent page scrolling. One knife, axe and food slot with typed drag/drop. Shift+Tab navigates controls backwards; the panels remain fully mouse-operated.
- User-supplied map and main-menu illustration. Playable/adjacent trails have pastel-red markers. Forest, Aarni River Trail and Sienilampi are connected; three future biomes remain grey.
- Lean-to requires 8 large sticks, 4 branches, 6 fibre and 2 cord, plus a usable axe.
- Bark-covered logs and irregularly scattered billets; positions, rotation and visual variants survive saving.
- Independent sound/music switches and volume sliders, saved locally. Music plays for roughly 42 seconds per four-minute cycle, leaving long natural ambience intervals. Quiet birds in sunny woodland, occasional wind and three rain levels. Rain occurs on roughly 13% of generated days; sleeping also advances weather.
- Swaying canopy light with sprite-alpha occlusion, terrain-following pools/contact shadows and occasional local morning mist around hollows and streams. These are 2D effects, not physical 3D lighting.

## Continue work in ChatGPT / Codex

For desktop work, attach this actual repository directory as the local project's primary folder. For cloud coding, connect the GitHub repository to a Codex cloud environment. A regular ChatGPT Project organizes conversations and sources but does not itself synchronize this local folder or push commits. Review and commit/push completed changes (or merge a reviewed cloud PR) to main; Pages updates automatically after successful tests. Durable instructions are in AGENTS.md. Official guidance: https://learn.chatgpt.com/docs/projects and https://learn.chatgpt.com/docs/cloud .

## Art and scope

Original generated art and user-supplied props. Prompt/source notes live in assets/*.md. Lighting is stylized 2D, not ray tracing. Additional biomes and a Steam build remain future work. Sienilampi now has a playable cabin interior.

## Shared ground depth

Cabin yards, the Sienilampi trail entrance and spring bank now join the walking terrain through one cached, world-anchored ground sheet. Upright props use slope-aware soil contact instead of floating bases or whole-object fades. Gameplay movement remains side-on. New areas and prop footprints can reuse `terrain-surface.js`; see DEVELOPMENT.md for authoring rules. The menu uses the supplied plain Timbertrail wordmark with a transparent background.

## Companion and campfire update

- S/down toggles crouching; W/up stands. Shift runs with six dedicated illustrated poses, separate from walking.
- Hover Kajo and scroll to choose petting, stick throwing, or retrieval when a downed grouse is nearby. Click to approach/confirm. Retrieved birds stay on the ground and still require a knife for skinning. No live animals are retrieved.
- Journal's loose map occupies nearly the full spread. Region descriptions appear at their markers; Forest, Aarni River Trail and Sienilampi are playable.
- Sixteen supplied item images replace placeholders. Kindling is the shaving recipe's icon; its output remains dry branches, preserving existing saves and recipes.
- Layered campfire tongues, drifting sparks, embers, light on nearby textures and a terrain-following warm pool. This is artistic 2D compositing, not physically simulated illumination.
- Slightly more audible daytime birds and occasional wind. Menu rays, dust and localized mist animate subtly; reduced-motion preferences are respected.
- Forest nights approach a warmth floor of 8 (5 in rain), without cold damage from night cooling alone. Fires and shelter remain useful. Hunger/thirst are separate risks.

## Connected trails and cabin restoration

- Completed cabin sections no longer have repair hover labels or highlights. Once roof, facade and yard are all restored, the door becomes clickable and uses a parchment action label. It opens the full-screen Sienilampi interior; its furniture is already restored for testing. Completion is derived from the existing three saved repair flags.
- Hover a campfire (including the old fire ring), lean-to or snare and scroll to select **Dismantle**, then click. A confirmation shows the recovered materials and defaults focus to Cancel. Confirming removes only that structure and scatters collectible material stacks in its place: 50% per ingredient, rounded down. Added fuel is lost. New structures remember their construction costs; older saves use the matching recipe. Removed structures and uncollected salvage persist through saving and regional travel.
- Walk off the right edge of Forest to enter the 6,400-unit Aarni River Trail through a black fade. Its first section is woodland; the route continues along riverbanks and through two shallow stepping-stone crossings. Walk back off its left edge to return.
- Click the Sienilampi signposted branch before the river. Its pale dashed hover frame has no entry cost. Sienilampi starts at the right edge; walk left to the derelict cabin, then to the pond and pier. Leave through the right edge to return to the branch.
- Click the cabin's roof, complete facade (walls, door and windows), or yard to approach and restore that section. Hover shows required/owned materials. The three sections are independent, in any order. Materials are charged only when repair finishes; moving cancels without charging.
- The pond has a visible sloping bed, submerged stones/plants and wind-driven surface motion. Click the chair to sit; move to stand. A short timber pier extends over the steep drop, with its supports visible underwater. Spinning fishing is available from the chair; swimming is not. Rabbits inhabit the bank, alongside companion Kajo; pike and zander inhabit the pond cutaway.
- Journal map is slightly inset/centered. Use red markers to travel to connected or previously visited areas. Gathered resources, fallen trees, camps, wildlife and repairs are stored separately per area; inventory, time and survival stats travel with you. Existing saves load as Forest and are preserved.
- Native Canvas snapshots checked regional vistas and eight cabin repair combinations. Automated simulation/DOM checks cover travel, save migration, repair costs/cancel, hotspot priority, pier boundaries and fords. These do not replace browser layout, perceived sound, or prolonged playtesting.

## Field labels and material sounds

Gatherables, standing trees, fallen trunks and downed game use curled parchment labels with a 220 ms reveal on hover entry/target change. Labels keep a separate readable action hint; reduced-motion disables the reveal. Sitting and Kajo's actions share the parchment style; a mouse-wheel glyph and option counter identify companion choices. Scrolling unfolds a new label. Repair costs retain their separate material panels.

Gathering uses non-tonal, layered material textures for wood, stones, grass/fibre, berries and mushrooms; skinning has a separate restrained friction sound. These are procedural foley, not field recordings. Material actions no longer play the rising pickup tone. Map markers distinguish red current location, pale-pink visited trails, muted rose open/unvisited trails and grey future regions. Playtesting is still needed for perceived sound and browser presentation.

## Shore, companion and title-menu polish

- Hiljalampi is now displayed as Sienilampi. Existing `pond` saves retain their IDs and resources; legacy positions on the old long pier are clamped to the new reachable deck without resetting the journey.
- A signposted branch follows the river panorama's actual projection. Its taller hover frame leads to Sienilampi. The pond shore is raised on screen, transitioning smoothly to the cabin clearing; the visible bed drops steeply beside a shorter illustrated pier.
- The cabin sits farther right at x=5520, 100 logical pixels behind the walking line at 84% scale. An extended clearing with a gradual right-hand approach connects its foundation to the near trail; yard repair clears its debris independently. Repair hotspots and light masks follow the cabin transform. The facade is one coherent painting; roof and yard remain independent. Prior door/window/wall repairs grant the merged facade without charging materials again.
- Sitting and petting use dedicated complete character illustrations. Petting no longer draws articulated replacement arms; one small heart rises above Kajo and fades. The water remains a stylized 2D cutaway, not a physical volume.
- Title-menu journey buttons use curled parchment with subtle hover/focus lift. The small top/bottom taglines are removed; loading errors retain a status area. Reduced-motion disables the button movement.
- The English tutorial explicitly says “Craft a flint axe”; all nine task translations are regression-tested.
- The loose map is inset further and raised within the book. Clicking another available region opens a named travel confirmation; Cancel/Escape returns to the map. Travel starts only after confirmation. Clicking the current region does not reset your position.
- A new painted mossy spring beside the cabin blends into the ground, with restrained animated water highlights. Click its parchment label to approach and drink, even with a fishing rod equipped. No fishing is available in this tiny spring.
- The title logo is raised and shifted toward the centre, at 90% of its former visual size, leaving the right-side wildlife and more of the mountain panorama exposed. Journey buttons retain their position. Narrow screens use a smaller upward offset to keep the logo inside the game frame.

Art provenance and generation prompts: `assets/SHORE-AND-COMPANION-ART.md`. Canvas snapshots and automated logic/DOM checks were reviewed; real-browser CSS layout and perceived sound still need a playtest.

## Health and collapse

Exhausting energy forces walking. Sprint stays locked until energy has recovered to 15 and Shift has been released, avoiding rapid animation toggling while the key is held. Empty needs produce a short, bilingual parchment speech bubble above the traveller (4.5 seconds). Concurrent warnings share the bubble; the same need only rearms after replenishing above 10. These notifications are transient and never change saves.

Health has its own full-width red meter below Food, Water, Energy and Warmth. Zero needs use distinct per-simulation-second damage: warmth 0.025, hunger 0.12, thirst 0.35, energy 0.04. Simultaneous shortages add together. Positive needs do not cause shortage damage; restoring a need stops its contribution. Existing energy recovery and forest night-temperature limits remain unchanged. Menus pause simulation as before.

At zero health the traveller collapses; Kajo brings them to the nearest lean-to in the current area, or the cabin at Sienilampi / that area's entrance when no shelter exists. Health and needs recover partially, ongoing actions stop, and inventory, gathered resources and cabin work are retained. The notification explicitly explains collapse. Empty needs remain empty when a save is reloaded.

## Repository workflow

This repository is the local Timbertrail game project's working folder. The earlier pine-and-ember folder remains untouched; do not edit both copies. New topical tasks should read AGENTS.md, README.md and DEVELOPMENT.md and work on this repository. Finish one shared-folder code change before starting another, or use separate Git worktrees and integrate deliberately. The user has requested ongoing GitHub updates: verify completed changes, check the remote, then commit and push main without force. There is no background synchronization service.

Title music: the user-supplied “RPG - The Enchanted Forest of Min” plays on the title screen, follows music preferences and fades out on game entry. Browsers may require a first click/key before playback. See `assets/TITLE-MUSIC.md`.
