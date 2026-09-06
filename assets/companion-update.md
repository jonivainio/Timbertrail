# Companion update — art provenance

## Supplied icons

These are the user's original transparent PNGs, copied without modifying their pixels. The extensionless source names below refer to the supplied Downloads files. Cropping only transparent padding at draw time is defined in `item-icons.js`; original images remain intact.

| Supplied name | Project asset |
| --- | --- |
| Lean-to | icon-shelter.png |
| fire ring | icon-campfire.png |
| kindling | icon-kindling.png |
| fibre cord | icon-cord.png |
| large stick | icon-firewood.png |
| bow | icon-bow.png |
| arrow | icon-arrows.png |
| dry branch | icon-wood.png |
| river stone | icon-stone.png |
| plant fibre | icon-fiber.png |
| raw game | icon-rawMeat.png |
| cooked game | icon-cookedMeat.png |
| edible mushroom | icon-mushroom.png |
| crowberries | icon-berries.png |
| snare | icon-trap.png |
| hide | icon-hide.png |

## Running sprite

Final asset: `traveller-run.png`, 2172 × 724 RGBA. Generated and background-extracted using the built-in imagegen tool, not the API/CLI. The existing original `timber-poses.png` supplied character/style reference. The six full-body right-facing poses have separate contact, compression and airborne phases. Frame bounds, foot baselines and hand grips are calibrated in `equipment.js`.

Generation brief: the same bearded traveller, rust beanie, ochre jacket, teal trousers, boots and backpack; six full-body running poses, forward torso lean, bent elbows, alternating contact/compression/flight, hands empty, consistent scale, no tools or text, transparent background. The first result contained an opaque checkerboard and was not used in the game.

Final background-extraction prompt (verbatim):

> Use case: background-extraction. Image 1 is the edit target: six full-body running poses. Remove ONLY the entire white/grey checkerboard background, including between legs and fingers, into genuine transparent RGBA alpha=0. The checkerboard in input is baked in: do NOT redraw a checkerboard, white, grey or black backdrop. Preserve the six characters, colors, poses, scale, their exact positions, dimensions and spacing. Output a transparent PNG sprite sheet suitable for drawing on a dark forest. No floor, no shadows, no extra elements.

Native Canvas verification found 78.95% transparent pixels. The six poses were rendered at gameplay scale, with and without the held axe, on a solid backdrop. Petting and fire day/night views were also inspected with the actual game renderer. This does not constitute live browser layout or audio quality testing.
