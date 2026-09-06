# Timbertrail — working direction

## Pixabay sound acquisition

See `assets/PIXABAY-AUDIO.md` for acquisition and import. The registry contains 53 prepared events from 27 Pixabay recordings (24 kHz mono PCM, about 2.3 MB). `audio-samples.js` preloads with four workers and keeps procedural fallback while pending or unavailable. Reel/brake and wind/rain use bounded looping buffer sources with circular seam overlap; state changes fade and stop them, never restart them every frame. Keep the 0.8.1 fishing loaded/quiet decision authoritative. Birds/stream use the ambience bus; actions use SFX; both retain master pause/mute/volume. Music and night insects remain procedural. No save changes. `reviewed` denotes source/technical validation; `listeningReviewed: false` explicitly records pending subjective QA. Tests cover actual PCM payload/range/headroom/seams and mock loop lifetime; an actual browser decoded all 53 files and verified reel/brake transition, cancel, pause and mute. These are not listening claims.

## Spinning fishing v1 (0.8.1)

`fishing.js` owns the dependency-free simulation. `PEFishing.ready/canCast` gates the Sienilampi chair, sitting state and equipped/owned rod. `press/release/cancel` own an explicit charge → flight → wet → fight → catch/cancel chain. Fixed 1/120-second substeps make lure and tension results independent of normal frame rates. The browser caps elapsed frame time; hidden tabs and open menus pause simulation instead of accumulating a catch-up burst. Casts/total catches/personal best weights are persistent in sanitized `state.fishery`; the shoal, line, lure, input, active fight and catch overlay are transient. Reload/travel never resumes a held button or active hook. Old inventory/tool IDs and saves are unchanged.

The 1.55-second charge changes casting distance (50–265 logical units after the rod tip). Gravity drives flight, water entry damps speed and creates a splash. Underwater gravity, drag and an elastic endpoint force sink/retrieve the lure; reeling reduces line length before a slack line can pull. Nineteen damped line samples visually sag/straighten between tip and lure. The cubic rod is a load-bending cantilever with its first tangent aligned to the painted cork handle. This is a readable 2D gameplay model, not a full rope-constraint solver, biomechanical animation or fluid simulation.

The eight-member shoal swims independently of casting. Pike patrol shallower water and have faster, stronger bursts; zander favor deeper presentation and commit less readily. Soft steering, depth changes and neighbor separation lead into follow → inspect → strike → hook/reject behavior. A strike opens the jaw and accelerates toward the lure; rejection causes a retreat and cooldown. Once hooked, timed away-runs, dives, circles, rests and surface pursuits pull against the reel. Surface pursuits can become ballistic jumps, with a cooldown, splash/spray at takeoff and reentry, and a mouth-anchored line throughout. Airborne fish cannot land as catches. These behaviors are gameplay tuning, not a biological simulation.

Holding retrieves; releasing lets the brake pay out under load. The clutch also slips during a loaded away-run while held. `strength()` combines species burst, square-root weight and remaining stamina. Authoritative tension (used for both bending and break risk) approaches the elastic-extension target at a limited rise rate of `0.055 + strength * 0.065 + 0.025 when running` per second; the first hooked second is limited further. Releasing allows tension to fall at up to 0.55/s. Strain accumulates only above 0.96, with several seconds of sustained overload needed to break; it recovers below that threshold. More than five seconds of >38 logical units of slack loses the hook. Land only when the fish is near, shallow, tired and being retrieved. Award fillet portions once, update best, save, then open the catch card. There is no rod destruction, separate lure inventory, fish-release screen or persistent fish population in v1.

### Species size basis and game tuning

- Pike range: 0.5–15 kg. [Vesi.fi](https://www.vesi.fi/vesistokunnostuksen-kuukauden-luku/hauella-on-liki-700-hammasta/) describes 0.5–15 kg fish and exceptional specimens around 20 kg. The v1 maximum deliberately excludes exceptional record extremes.
- Zander range: 0.5–10 kg. [Kalatalouden Keskusliitto](https://ahven.net/suomen-kalat/kuha-sander-lucioperca/) describes common fish around 1 kg with largest specimens exceeding 10 kg; [Luke's species description](https://www.luke.fi/fi/luonnonvaratieto/tiedetta-ja-tietoa/kalalajit/kaikki-kalalajit/kuha) describes habitat and growth. This bounded game range is not a claim about legal retention sizes or a particular pond population.
- Weights use rejection-sampled truncated normal distributions. Pre-truncation mean/SD: pike 2.8/2.7 kg, zander 1.8/1.9 kg. These are adjustable gameplay parameters, **not measured population statistics**. Weight rounds to 0.01 kg. Species depth, attack probability, speed and run strength are likewise gameplay interpretations rather than scientific constants.
- Trophy means weight ≥ min + 0.8 × (max − min): 12.10 kg pike or 8.10 kg zander. It marks the upper fifth of the possible interval, not the upper quintile of random catches. Forty-thousand-sample seeded checks per species verify bounded weights, predominantly ordinary sizes and rare-but-possible trophies.

`fishing-art.js` uses the shared `poseFrames` grip/boot anchors, keeping the physics tip and the visible rod attached across all eight frames. Do not add a second rod to the raster poses. In-world fish are original code-native articulated shapes: eleven spine points drive body waves, forked tails and fins, with species-specific silhouette/markings and a moving jaw. Beat, heading, effort and jaw state belong to the simulation; rendering never advances them. The mouth is the local origin and remains exactly at the hooked lure. Free fish are fainter below water; airborne fish draw above the water clip. Supplied static illustrations remain on catch cards and inventory only. `game.js` captures the primary pointer so release outside the canvas still casts/stops reeling. Blur, visibility, lost capture and modal opening cancel a charging throw or release a loaded reel; they never cause an accidental cast. Secondary pointers cannot release another pointer's charge. The canvas's actual CSS rectangle converts pointer positions to logical coordinates. The catch HUD remains semantic DOM/parchment, localized EN/FI, outside world projection. Its bottom position follows the player's screen-space x; the `spinning-ready` class hides overlapping movement hints without changing the user's dismissed-hint state.

Loaded reel audio starts above 0.62 tension or while paying out quickly, whether or not the mouse is held. Six paired short ratchet clicks repeat at 0.17-second cadence, with intensity following tension; low-load winding stays quieter at 0.28-second cadence. Jump splashes are separate transient effects. Existing pause, mute, sample fallback and repeat-clock gates remain authoritative.

Regression coverage: normal natural casts for both species and empty/nibble outcomes; 40 seeded controlled fights; strength-dependent loading and release relief, away-runs, both-species jumps/reentry and airborne line endpoints; over-tension break, slack escape, sinking/slack retrieval, both-species trophy/award/save flow, movement/equipment/travel cancellation, fixed-step equivalence, all eight grip/tip transforms, pointer release outside canvas, scaled hit coordinates, modal pause and catch-card rendering. Art tests verify changing body/tail geometry, fixed mouth origins, no fish-image blits and no render-side state mutation. Audio tests verify splash/nibble/hook/brake/retrieve/snap/catch events, loaded ratchets even while held, mute and no repeated-clock stacking. Native Canvas screenshots review the species' swimming phases, a naturally hooked fish and a natural surface jump. DOM tests are not actual browser layout/animation verification; Web Audio scheduling tests are not subjective listening tests.

## Fire and indoor companion rendering (0.7.0)

`fire-effects.js` is loaded before both cabin-art and render. `PEFire.draw` owns a 72×88 thermal raster sampled at 24 Hz, driven by simulation time, independent seeds and fuel strength. Its per-context cache is bounded to 12 fires. The native canvas factory is injected; no render path mutates simulation state. Hearth clipping prevents stray flames/sparks escaping the firebox. Existing world light pools/chimney smoke remain independent.

Audio now has no fire noise bed. Only one or two quiet 12–28 ms non-tonal crackles play at irregular 2.1–6.3 s intervals. Distance, fuel, sound preferences and indoor state gate scheduling.

`cabin-art.js` crops the original eight-pose `kajo-cabin-poses.png` atlas, uses a long 58-second rest cycle and anchors all poses to the same basket baseline. Small breathing transforms keep contact with the basket; panting/head turns and lying transitions use actual poses, not an avatar rig. Rendering is clock-based and does not add saved animation state. Generation prompt/provenance: `assets/KAJO-CABIN-ART.md`.

Verified with engine/DOM/audio scheduling tests and native Canvas scene snapshots. These checks are not browser animation smoothness or listening verification.

## Cabin room model

`storage-ui.js` owns only transient chest selection/drag state. `PECabin.transfer` is authoritative: explicit positive integer amounts transfer atomically or fail, legacy boolean 1/All calls still work, and tool durability is preserved. Reject stale source counts, foreign drops, same-side drops and closed-panel transfers. `storage.css` supplies the two-column grid and amount controls; split means moving part of a counted stack, not adding persistent slot layout. Capacity is 200 total items.

`home-hearth` contains fuel controls only; `home-kitchen` contains cooking controls only. Both the UI and `PECabin.action` require a lit, fueled hearth to cook. Sleep at the bed or lean-to heals `100/3` points, capped at 100.

Yard decorations are authored in `PERegionArt.yardProps`, with tight atlas crops, ground depth and contact radius. The shed and tractor render behind the cabin, while leaning equipment renders in front of the walls. They do not change saves or interaction targets. See `assets/CABIN-YARD-ART.md` for original-art provenance/prompts.

`cabin-interior.js` owns persistent `state.cabinHome`, outside regional snapshots. Indoor `cabinHome.x` is the camera focus (clamped to 320–640 in room coordinates); do not overwrite outdoor `player.x` or include home in `regionKeys`. Entry/exit/sleep use a one-second black fade. Fixtures use normalized 960x540 hit boxes; changing art requires reviewing all boxes. Three exterior repairs gate entry. Interior fixture flags start true for testing. `PECabin.view/toRoom/toScreen` define one 1.5× camera projection (640×360 visible room units, top=84) for painting, hit tests and tooltip anchors. A/D pans at 110 room units/s; camera movement never sets player.moving or produces footsteps. Visible fixtures activate immediately; no invisible click-to-walk. Cold/fade/HUD overlays stay screen-space. Legacy focus positions clamp safely on load.

Home storage uses material counts plus per-tool durability arrays, 200 total units. Inventory represents one worn tool plus pristine spares. Transfers preserve this convention, disallowing withdrawal of another matching tool over an existing one. Canteen is a unique reusable item; global `canteenFull` is preserved in chest storage. Legacy compasses migrate to one empty canteen. Unknown trade IDs are rejected.

Home fire advances each simulation tick in any region; menus pause time. Sleep advances fuel by the skipped night. The unlit room tends toward sheltered warmth; a lit fire actively warms it. `PE.healthDrain`/`PE.needDamage` are shared indoors/outdoors. `PEArt.drawCold` caches a sparse 24px edge effect driven by warmth; it never blocks input or covers the centre.

`cabin-art.js` composes original room art and Kajo (10.5% larger), with no standing or seated player sprite, canvas-drawn woven curtains, lantern, hearth effects and chimney smoke. The existing `shutters` save flag now means curtains open; old closed-window saves stay closed. The canister is painted into the room, not a mismatched vector prop. Audio attenuates rain/wind, suppresses outdoor fauna and uses wooden floor steps, door/shutter/chest, cloth, drink and pour events. Live listening/layout verification remains a separate playtest.

The user leads product decisions. The assistant acts as project lead: turn each request into bounded implementation stages, choose tools/agents/models and reasoning effort proportionately, use creativity where it improves the requested game, and review integration and visual quality before handing back.

Product ambition: a distinctive, attractive, playable and eventually commercially compelling 2D survival game for Steam. Commercial success is a target, not a promised outcome. The current build remains a local browser prototype; a future Steam release needs its own packaging, save/input/platform testing and release work.

## Resource-conscious workflow

- Keep art direction, ambiguous gameplay design, cross-system integration and critical visual review with the lead.
- Current user preference: use Astra for implementation and review. Do not delegate unless explicitly requested. Keep tests targeted to save usage without compromising acceptance criteria.
- Use explicit file ownership when agents share a workspace. Parent reviews each deliverable; a passed static test is not evidence of good animation or browser layout.
- Test critical changed chains and inspect a few representative real renders. Leave prolonged exploratory playtesting to the user when requested. Never label a DOM harness as browser CSS verification.
- Prefer original art; do not extract/copy third-party game assets. Keep prompts and consumed files in the project.

## Historical allocation (before the latest Astra-only request)

- Astra lead: world/parallax restructuring, unique-scene art direction, persistent discovery integration, demo boundary, integration review and targeted corrections.
- GPT-5.6 Sol / high: shared realistic tool geometry, grips, mirrored stance/action matrix, axe/arrow/rod alignment.
- GPT-5.6 Terra / high: leather-book UI, hidden discovery presentation, reset confirmation and focused event tests.
- Built-in imagegen: three original forest background sections, one pass per section.

Reasoning/model names record this execution choice, not an API pricing estimate or a promise about account usage-limit savings. No global app settings or subscription limits were changed.

## Regional expansion — local work

The user’s current standing instruction authorizes publication of completed, verified changes. Check origin/main before committing/pushing; never force-push or include diagnostics.

`regions.js` owns the region graph, entrance positions and component costs. `engine.js` saves per-area mutable state through an explicit field allowlist (`regionKeys`), preventing nested region snapshots. Old version-5 saves migrate to version 6. Fade transitions cancel transient actions, switch scenes at black, then restore input. Time pauses through the fade.

`region-art.js` owns river fords, pond cutaway, pier and independently composited cabin layers. The transparent two-state cabin atlas is normalized to common eaves/foundation coordinates; the facade is now rendered as one complete source painting, without separate door/window overlays. Roof, facade (including doors/windows) and yard each use their own state. Legacy door/window repairs grant the merged facade on load, including inactive regional snapshots. No extra materials are charged. Raster art is cached; water motion is procedural. `world-art.js` invalidates backdrop/terrain caches on area change and uses actual regional objects for light occlusion.

Pond spinning fishing is now included through `PEFishing`; forest/river retain the earlier bobber mechanic. Water rendering is stylized 2D cutaway, not a fluid simulation. Region content is finite; river's far end remains closed until another area exists.

`activeHotspots()` filters repaired cabin sections and gates the door on all three repair flags. Use that same filter for hit testing, hover rendering and target walking. Raw hotspot geometry remains available; it is not saved. The cabin door is separate from Aarni's trader door and starts a room fade once all three exterior repairs are complete.

Structure dismantling uses a transient, area-bound `pendingDismantle` request. Only the confirmation action removes the revalidated nearby structure. Cancel, Escape and closing the panel clear the request. `buildCost` snapshots protect new structures against future recipe changes; older structures fall back to their recipe. Salvage is normal collectible drops, not an immediate inventory credit. Empty saved structure arrays must remain empty, including Forest: do not respawn the old fire ring after dismantling it.

## Shore geometry and companion poses

`PERegions.pond` is the source of truth for water surface, near shore, pier end, chair, drinking spot and safe movement bound. Legacy pond save positions are clamped on load. The backdrop shifts up with the raised bank; the water continuation samples the same camera projection rather than scrolling an unrelated lake tile. The river branch has only a ground-level sign. PERegions.trailBox(camera) projects the distant cabin hotspot with the panorama's exact parallax; drawing and mouse hit tests share it. River has no extra depth-surface zone; extend must safely return for an empty zone list.

Cabin `scale`/`setback` apply to rendering, repair boxes and the light mask together. Its roof/facade/yard repair flags remain separate. Old door/window flags are migrated to facade completion; new saves need only the three sections. Sitting and petting use new RGBA assets in `equipment.js`; the pet palm is anchored to Kajo's head with no oscillating arm rig. The heart is a transient simulation effect emitted once as the action passes 0.4 seconds, not saved or looped. `tests/poses.cjs` protects the complete still-pose rendering route.

The main menu uses the user-supplied plain wordmark (`timber-wordmark.png`); its white background was removed with built-in imagegen. Original logo assets are preserved.

Title parchment buttons reuse the visual language in native CSS, not rasterized text. Keep `load-note` as an empty live status region for load errors. Native buttons, focus feedback, translations and reduced-motion behavior remain intact.

Map content uses book-relative insets of 8% top, 12% sides and 16% bottom; image, paths and markers share the same container. Pending map travel is UI-only state, not a simulation transition: a confirmation sheet traps Tab between its buttons, Escape cancels, and the destination is revalidated at confirmation. Only then does the existing fade run. Path/edge travel is unchanged.

The cabin spring position comes from `PERegions.pond.spring`. Its `drinkOnly` water target uses normal click-to-approach and thirst restoration, bypassing fishing even when the rod is held. Nearby gatherables are excluded so they cannot obscure the spring hit area. The transparent `cabin-spring-v2.png` cutout has no surrounding soil patch and uses subtle procedural pool highlights. Its ground anchor follows the terrain. The spring is at x=5810, clear of the existing shelter site; new structures cannot overlap its drinking area.

The shared visible ground model lives in `terrain-surface.js`. `PE.ground` remains the gameplay walking curve; `areas(map)` describes the extra visible depth, asymmetric width, plateau and worn-path width. `top(map,x)` combines overlapping footprints into one continuous ground silhouette. The cabin clearing preserves the western approach and extends to x=6370. Aarni has a smaller yard and a shared 28px setback in drawing, light occlusion and door hit testing.

`extend()` writes the shared ground material into the cached terrain BEFORE midground objects. Upper silhouette edges are narrow opaque material clusters; near transitions blend soil colours within an already opaque surface, not transparent scene objects. `forest-floor-material.png` is a dedicated texture without scene silhouettes, sampled in world coordinates. Do not reintroduce stretched backdrop crops or draw yard textures after trees. Repairs change debris only, never the ground sheet.

`socket()` provides a local footprint, supporting soil, contact shadow and front soil lip on slopes. `Renderer.groundedProp` applies it to upright midground trees, rocks, shelters and Aarni; harvest trees, smaller loose resources, other structures, cabin foundations and spring use the same helper. Keep foreground parallax props and falling trees outside this grounding route. New sprites still need an authored tight crop, ground anchor and footprint radius; this is not automatic semantic segmentation of arbitrary artwork. Prefer true RGBA cutouts with no large soil halo. Do not warp the whole trunk/building to follow a hill.

New areas should be declared with x/left/right/depth/plateau/path in `areas(map)`, then reviewed on both slopes and at several camera positions. Geometry is purely visual: it does not modify saves or enable movement into the background. Broader depth movement would need a separate navigation design. Native review snapshots should run one region per process (`node work/review-regions.cjs cabin-ruined yard`) to avoid accumulating large native image caches.
