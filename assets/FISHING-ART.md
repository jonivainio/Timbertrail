# Seated spinning artwork — 0.8.0

Final runtime asset: `assets/fishing-poses-v2.png` (1536 × 1024, 4 × 2 frames, RGBA). SHA-256: `4322eed64c783c6ef6b8a3ca03bcb00427e54daaef71b4c35303d690ddd63040`.

Original artwork generated using the **built-in imagegen tool**, not the API/CLI fallback. The project's original traveller served as an identity/style reference, not a third-party game extraction. The eight poses contain the short cork grip and reel; the long rod, guides, bending and line are code-rendered so they share physical anchors. User-supplied fish illustrations are unchanged: see `FISH-ICONS.md`.

The generator returned a painted checkerboard despite repeated real-alpha requests. On 2026-09-06 the user explicitly approved programmatic background removal. A border-connected flood fill removed only bright neutral background pixels (RGB minimum > 207, maximum-minus-minimum < 23); retained foreground RGB was not recoloured or repainted. This produced 1,108,123 fully transparent pixels out of 1,572,864. The original generated files and opaque draft are preserved locally, not deployed. No credentials or machine-local source paths are required at runtime.

All eight crops, boot anchors and cork sockets were reviewed on a dark montage. Native Canvas views checked ordinary seated fishing, cast/wet line, loaded rod and a naturally hooked zander. These static reviews do not certify browser animation smoothness.

## Generation prompt

```text
Use case: stylized-concept. Create a transparent RGBA sprite atlas for an original side-view fishing game, 1536x1024, 4 equal columns and 2 equal rows. Image 1 is character identity/style reference only. Eight FULL BODY poses of the SAME seated traveller facing RIGHT: orange knitted beanie, dark beard, ochre weathered jacket, brown backpack, blue jeans, hiking boots. Same seated hip, knee and boot positions, identical scale in all 384x512 cells; entire person in each cell with transparent margins, no chair, no ground, no shadow, no text or grid. Painterly detailed pixel-art matching reference, crisp small clusters, not smooth vector. Both hands grip a SHORT cork spinning-rod handle and compact metal spinning reel. IMPORTANT omit the long rod blank, line and lure entirely: those are drawn by the game. Each cell contains just character and short handle/reel, no long poles. Top row left to right: relaxed retrieve with grip forward near waist; hands slightly raised; grip at chest; grip approaching shoulder. Bottom row left to right: grip near ear; full backswing grip behind shoulder beside head; forward cast release with arms extending forward; fighting fish with grip at chest and leaning back a little. Animate shoulder/elbow position coherently without changing lower-body placement. Real hands gripping reel, not extra limbs. The complete sprite grid must have a genuinely transparent background with alpha=0, not painted checkerboard.
```

## Final background-extraction request

```text
Use case: background-extraction. Image 1 is the EDIT TARGET. Extract the eight seated fishing characters into a REAL transparent PNG alpha channel. The white and grey checkerboard currently present is unwanted painted background: erase every square, including gaps around arms, legs and reel. Do NOT render a checkerboard, a white backdrop, a black backdrop, shadows, or any other background. All background pixels must have zero alpha. Keep the original 1536x1024 canvas and all eight character poses and their exact scale, positions, short cork rod grips and reels unchanged. Do not add the long rod; it is rendered separately by the game. Return actual transparent cutouts, not a visual representation of transparency.
```

The final extraction request still produced opaque output; the user-authorized flood-fill pass above was therefore applied to the earlier, layout-stable generated atlas. Frame/socket coordinates in `fishing.js` correspond to this selected atlas, not the discarded extraction variant.
