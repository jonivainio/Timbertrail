# Visual decisions — calibration not yet accepted

## Preserved boundaries

### Silhouette receivers and lived-in window light (2026-09-20)

Capture the real object draw once, including its camera/slope/pose transform, into a reusable native-resolution surface. Composite its normal colour immediately in the original depth order; retain its alpha for directional, distance-limited received firelight after ambient grading. A later receiver replaces earlier received light at overlap, and object alpha excludes the ground-light pass. No image-wide CPU reads in this frame loop, no stand-in actor rectangles, no second simulation or action draw. Seven pooled surfaces cover terrain, receiver scratch/masks, reflection and water-front. Captured receiver state is transient and never saved. Final lit colour is sampled into reflection before UI/foreground. This is a stylized2D material receiver, not full3D ray-traced light transport; broad final occlusion/perceptual review remains open.

Window emission uses cached original pane interiors with dark bars/frames retained. The actual repaired-home, hearth fuel/lit, lantern and curtain state determines its brightness; no invented lights on an abandoned cabin. Daylight reduces artificial-light prominence. New window art is not baked over the original asset.

### Indoor Kajo anchored rest cycle (2026-09-11)

Indoor poses share the outdoor dog's twelve-color palette and a single measured basket anchor. Constant source scale preserves anatomy between seated and curled poses; breathing comes from authored cels rather than stretching the entire dog. The return cel copies the initial cel byte-for-byte to avoid a loop seam. Rendering before ambient/night tint and hearth light keeps fur inside the room's illumination. A58-second cycle leaves most time for quiet rest instead of incessant motion. Source look-up pose3 tail reaches the image edge, so final silhouette/markings and transition artistry remain explicitly unapproved. The old detailed interior is still pending redesign. Quota handoff at21% remaining prevents starting a large new batch near the20% stop target.

### Bow continuous aim rig (2026-09-11)

Bow aiming cannot be reduced to a few discrete full-body angle cels without visible angular snapping. The original generated body layers therefore deliberately omit arms, and matching raster cloth/hand pieces articulate using fixed-length two-link joints. Both stance bodies retain grounded boots and measured shoulders. A fixed elbow branch is tested through horizontal/near-vertical angles. Sleeve width is preserved while authored longitudinal size follows its bone; no body stretching or procedural substitute sleeves. The bow's actual riser now coincides with the hand origin, both when carried and when shooting. The existing physics grip and0.32s release remain authoritative, independent of image readiness. Rear-hand/string separation after release is intentional, and the string settles with a short damped vibration. Forty pose cells, day/night examples and sampled live browser views have been inspected; full transition/anatomy/motion approval is still part of the broad art gate.

### Fishing family shared socket (2026-09-11)

The generated seated family contains only a cork handle/reel, never a long painted rod. Its measured native socket is shared by the physical rod/line and body renderer, independent of asset readiness; hips stay on the same chair location at all8 phases. The old illustration can still render as a fallback aligned at this socket. New socket geometry shifts cast origins by a few world pixels, without changing casting-power rules, fish behavior or save schema; complete fishing regression tests rerun. The graphite rod tapers toward its flexible tip and is readable against forest masses. Eight-cell phase and native/browser tests do not establish final casting smoothness or listening acceptance; that remains part of the broad review.

### Traveller action contacts (2026-09-11)

Special actions use complete measured raster cels in the same palette as locomotion, not disconnected procedural sleeves. The existing0.9-second chop clock remains authoritative; the impact cel and sound event share their floating-point boundary tolerance. Petting adjusts the whole grounded crouch to the dog's forehead; sitting aligns pelvis with the chair, and cutting attaches a knife to the cel grip. Contact shadows follow the action body position. The new family is integrated, but four-phase chopping and two-phase gather/cutting still require final perceptual motion review. Fishing/bow remain separate pending their redesign. Native/state tests do not close the full animation gate.

- Simulation remains 960×540 / world width 6400. Save IDs, prices, state transitions and hit targets remain authoritative.
- Old main-menu artwork and presentation remain untouched. Art-buffer changes apply to the world, not menu or DOM UI.
- Test-only fixtures use new engines and never read browser saves.
- Production UI text must be composed after the low-resolution world, never reflected or night-graded.

## Reference observations (actual still-image viewing)

- Wild n Chill Grouse official screenshot: dry ochre/green ground forms a clear traversable corridor; large roots/rocks support layered vertical woodland. The world is not a permanent water strip.
- Kingdom Two Crowns Dead Lands night screenshot: limited cool masses; localized warm fire; broken but recognizable reflections. Not an all-screen orange glow.
- Cast n Chill Night2 official screenshot: separate far-bank reflection band, crisp water surface and readable submerged fish silhouettes. Still images do not prove motion quality.

## Proposed implementation, pending integrated comparison

One immutable frame snapshot feeds ordered scene/light/reflection passes. Coherent water displacement uses world/time coordinates rather than random frame noise. Reused bounded surfaces avoid per-frame allocation. `visual-core.js` contains the shared tested primitives.

Compared 480×270 and 640×360 in the same revision, camera setup and display size. Working choice: 640×360, retaining more readable hand/tool/fishing detail; CPU timing difference was small in the two completed 30-second browser runs. This is not complete performance or style acceptance. A smaller copy of the existing paintings is not a style solution.

## Asset iteration

Closer framing: user suggested a more intimate camera. Current development default is1.2 outdoors,1.08 throughout the pond. Only presentation is cropped; UI is independent, and every world interaction uses the inverse crop. Near/far comparison is available on the isolated QA toolbar. Fixed pond framing avoids pumping during a fight. This still needs long-cast/line-break visibility and continuous edge-traversal review.

Ground family: six original generated, tightly measured alpha cutouts; native grid112px wide per patch (packed at2x), max8 palette colors each. Conformed to the shared ground contour in the cached opaque terrain layer. Four-background alpha review and F01/F04 day/night stills viewed. The large flat fields and blank mid-ground are still NOT accepted; adding more tiny random texture is not the next solution.

Tree family generated with the built-in image tool: first pass rejected for excessive microtexture and oak-like pine. Second pass has calmer clusters but its checkerboard was baked into RGB. User authorized programmatic cleanup; source remains unchanged and cleaned atlas/provenance are in assets/art-v2. Three-background review inspected, but family remains calibration-only, not production-approved.

## Calibration findings and response

v3 read-only critic found five material issues: background cutout scale/repetition, stream rectangle/absent ground, post-light pond compositing and hover capture, unmasked fire glow, camera-relative water phase. They reviewed stills/code only, not audio or continuous motion.

The absent ground was a real cache bug: fractional 6400*(2/3) canvas size was compared to integer browser/native dimensions, causing eviction. SurfacePool now canonicalizes dimensions; repeated frozen frames and camera motion preserve the same terrain object and pixels at both resolutions.

Detailed tree sprites no longer form giant tinted background roots. In v8, newly generated rootless group artwork replaces the procedural group contours. Source/alpha review and limited-palette atlas checks are complete; composition still awaits final style acceptance. Ground, new small pier, curved banks and water bed use shared logical anchors.

Follow-up: v7 P05 and F04 stills were captured and inspected. Continuous soil now follows the pond bed, removing the straight empty shore strip; bank stones are less uniformly repeated. This does not approve the overall style or continuous animation.

Reflection uses the same-frame pre-water lit world. Hover brackets render afterwards in the readable UI surface. Upper pier is lit with the world; submerged supports/fish use an isolated ambient-graded water-front surface. Fire now has terrain and nearby trunk receiving masks, a short trunk shadow and a much weaker separate atmospheric halo. All are calibration implementations, not a complete occlusion/lighting solution for cabins and other objects yet.

Wave phase is anchored to a fixed water-body extent; highlights to a fixed world grid. A more expensive per-world-segment sampler increased pond native median to 114.98ms and was rejected; fixed body-anchored scanlines returned it to 11.52ms. No browser/continuous-motion acceptance follows from this native timing.
# Closer presentation camera — current refinement

Use approximately21% closer outdoor framing and8% at the pond, as requested for intimacy without crowding fishing. Requested factors1.2/1.08 snap to whole16:9 native crops (528×297 /592×333 at640). Screen input is the inverse of the exact crop; simulation/save coordinates remain unchanged. UI is a separate transparent logical layer; native world is enlarged directly into the display once. Edge offsets snap to native pixels to avoid fractional sampling phase changes. This cannot guarantee integer display scaling at every arbitrary viewport/DPR, and full temporal review remains pending. Indoor/menu framing unchanged.

Current browser evidence: forest, need bubble and mushroom approach/fully visible parchment label at537×302. Native F01/P05 camera-aligned stills viewed. Close framing is a working choice; ground cutouts/large flat color fields and remaining art families still need work.
# Cabin raster family checkpoint (2026-09-11)

Subsequent soil/yard checkpoint: edge-focused material texture replaces the rejected uniformly noisy passes. Quiet interiors remain deliberately broad; this is not approval of every terrain/foreground material. New shed, tractor and shallow spring share cabin palette/cluster language and preserve authored world locations. Their generated sources contained painted checkerboards, explicitly removed during non-destructive native preparation. Exact prompts, source hashes and cleanup method are retained. Four-background alpha review and day/night yard views were actually inspected. The spring's dynamic highlights are clipped by a cached mask of its water colors, not an arbitrary ellipse over rocks; reduced-motion freezes the phase. Actual narrow537×302 browser test demonstrated click-to-approach and WATER0→98, with no warning/errors. Full-tested build1ba9b3c59ace. Existing small wall props and ground clutter remain a style mismatch; actor, animal, interior and effects overhaul and listening acceptance remain open.

The first hand-drawn code cabin was rejected visually as too schematic. A new original generated cabin was prepared at a fixed pixel grid with a restrained16-color palette and binary transparency. Source and prompt are retained under work/overhaul/cabin-source; nothing from another game was extracted. Native loading via file path avoids a metadata-related Buffer decoder failure without changing original source bytes.

One repaired painting supplies the same geometry to every state. Authored broken-window/door and missing-shingle overlays change only their relevant layer. Shared foundation and clipping seam prevent the previous independent-image jumping. Aarni uses the same material language, old base/width and undistorted aspect ratio; distant river landmark keeps its travel target. Chimney smoke follows an explicit new art anchor. Texture on the prototype has improved, but flat terrain and old props remain an obvious unfinished contrast; this is a calibration checkpoint, not final art approval.

Evidence: all8 day/night repair-state checks,18 repeated native scene/resolution cases,5 landmark-camera checks, four-background alpha review, and1280×720 browser door entry/exit and Aarni dialogue. Latest full build55911a7e9599. No subjective sound approval or full viewport/performance acceptance.
