# User-supplied fish and fillet icons — 0.7.2

Five original source files were supplied by the user on 2026-09-06. They are PNGs despite having no filename extensions. Copies below are byte-for-byte unchanged, 1254 × 1254 pixels, with actual transparent alpha. No image generation, background removal, recolouring or resampling was used.

| Supplied filename | Project asset | Use |
| --- | --- | --- |
| filee_raaka | icon-rawFish.png | Existing raw fish inventory/recipe ID |
| filee_kypsä | icon-cookedFish.png | Existing cooked fish inventory/recipe ID |
| hauki | icon-pike.png | Pike species illustration |
| kuha | icon-zander.png | Zander species illustration |
| ahven | icon-perch.png | Perch illustration, reserved for future gameplay |

`item-icons.js` records tight source rectangles and centers each image with its original aspect ratio. The same renderer supplies backpack, chest, crafting/cooking, ground-item and quick-food icons. All five assets preload before play. Species illustration IDs do not become inventory items or alter species spawning. Existing `rawFish` and `cookedFish` save keys are unchanged.

The in-progress spinning-fishing catch card references the pike and zander files directly with CSS `contain`; that unfinished fishing feature is separate from the 0.7.2 icon-only publication.

## Original-file SHA-256

- icon-rawFish.png: `0063fab38bddf95f3e29de57281e7d901ecc5861360307af236c08433645bd84`
- icon-cookedFish.png: `850105e9cadcf3436250f3e7e146cb33d868cad155e5bba0e61a749960ee2216`
- icon-pike.png: `2f52633f4c6aed1518382fbbbff5de08111618bc41ca7ea6cc0f154bcca162be`
- icon-zander.png: `393e75029a101a1a1774cd2ae1f4544cbdfcf3ec0145dc20fda79a3f9fb2e2fa`
- icon-perch.png: `75cf4b6794c61823aba5b5f3cfe1cbc02bb6e0721c1aab6893e642cdd71bf854`

Native Canvas review checks transparent edges and legibility at 24/48/96/160 pixels. Automated tests check preloading, distinct image mapping, bounded crops and aspect ratio. Neither check is an in-browser CSS playtest.
