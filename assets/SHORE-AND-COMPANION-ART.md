# Shore and companion art — 2026-09-06

Generated with the built-in imagegen tool (no CLI/API fallback). Original project art supplied identity/style references; no third-party game assets were extracted. The outputs below are copied into this project and consumed locally. Existing character atlases remain unchanged.

## Seated traveller

Saved asset: `assets/traveller-seated.png`.
Selected built-in output: `exec-396f76ce-7234-419f-b0c6-6817960ff22e.png` in the Codex generated-images directory for task 01a06c6a-bd4b-7602-8658-c866fd8c7669.

Generation prompt:

Use case: stylized-concept. Asset: single transparent 2D game character sprite. Reference image shows the SAME traveller whose identity/clothing/pixel-painted realistic style must be preserved. Draw ONE full-body seated pose, strict SIDE PROFILE FACING RIGHT. Rust wool beanie, dark beard, ochre outdoor jacket, teal trousers, brown boots, leather backpack. Seated naturally on an INVISIBLE ordinary chair: torso upright, hips supported, thighs nearly horizontal extending right, knees at right angles, lower legs vertical, boots resting flat at a common ground line. Hands resting loosely on thighs. NOT crouching, NOT squatting, NOT perched on feet. No chair, no stool, no ground, no dog, no tools. Entire body with generous transparent padding. Fine detailed pixel-art realism matching original. True transparent RGBA background, no checkerboard, no glow, no scene, no text.

## Petting traveller

Saved asset: `assets/traveller-pet.png`.
Selected built-in output: `exec-fdfd1393-725f-49c4-82b8-7d24533eaaaf.png` in the Codex generated-images directory for task 01a06c6a-bd4b-7602-8658-c866fd8c7669.

Generation prompt:

Use case: stylized-concept. Asset: one transparent side-view pixel-painted traveller sprite for petting a dog in a 2D game. Reference is identity/style ONLY. Same bearded man, rusty wool beanie, ochre jacket, teal trousers, brown boots, leather backpack. Full body, strict side profile FACING RIGHT. Kneeling naturally on ONE knee, other boot flat, leaning gently forward; one arm extended forward/down, palm relaxed facing down at the height of a medium dog's head (about 23 units above ground when adult standing height is 62). Other hand rests on bent knee. No dog in image: dog rendered separately. Only ONE still pose, no duplicate limbs, no tools, no text, no ground or shadow or glow. Preserve proportions/outfit. Genuinely transparent RGBA background including all gaps, no black backdrop, no checkerboard painted in. Detailed restrained pixel-art realism, not vector, no caricature.

## Short pier

Saved asset: `assets/sienilampi-pier.png`.
Selected built-in output: `exec-5bf24b03-c921-410b-a8ab-93e632a2738f.png` in the Codex generated-images directory for task 01a06c6a-bd4b-7602-8658-c866fd8c7669.

Generation prompt:

Use case: stylized-concept. Asset: ONE isolated short lakeside wooden pier for a side-scrolling realistic pixel-art Finnish forest game. Reference image is the forest style and palette only. Strict side elevation, pier extends horizontally LEFT into the lake and attaches to bank at RIGHT. Deck exactly level, top surface very slightly visible. Weathered silvery brown planks, rich fine wood grain, visible nails, moss only at right bank end, several stout timber posts and diagonal under-deck braces. No railings, no chair, no boat, no ropes above deck, no people, no landscape, no water (added dynamically by game). Length about 5 times its support height. Full silhouette with transparent margins, horizontal composition. Quiet natural woodland lighting, muted olive/gray/oak, fine crisp pixel-painted details matching reference. Real transparent RGBA alpha, absolutely no checkerboard painted in, no backdrop, no labels or text.

## Finishing and integration

The built-in tool was also asked to extract backgrounds into real RGBA transparency while preserving the subjects. Some iterations returned opaque checkerboards and were rejected; the selected files have actual transparent pixels. The seated image retains a slight soft colored edge. A later halo-removal attempt returned an opaque checkerboard and was not integrated.

Final extraction intent: Remove the background completely, retain the entire illustrated subject and transparent gaps, preserve pose and clothing, no replacement scene or painted checkerboard.

Runtime code uses nearest-neighbour rendering at game scale. The pet palm anchors to Kajo's head without animated replacement arms. The seated image mirrors toward the pond; its boots align with the pier. The pier's submerged posts are composited with reduced opacity and clipped against the pond bed. Native Canvas renders of the short pier, sitting, petting/heart and setback cabin were inspected. This is not a browser-layout or sound-quality test.
