# Timbertrail — original art production

Generated with the built-in imagegen tool on 2026-09-05. Original PNGs copied without raster editing; alpha and dimensions preserved. Sprite framing is performed by Canvas source rectangles in render.js.

## Reference and ownership

The Wild n Chill official press kit was consulted for design context: https://www.wombatbrawler.com/wnc-press-kit . Its linked logo image could not be retrieved in the research tool, so no exact visual-logo comparison is claimed. No Steam game files, extracted textures, or original Wild n Chill assets are included. The Timbertrail logo is an original rustic woodland wordmark, not a traced logo.

## interior

Asset: `timber-interior.png`

Use case: stylized-concept. Original premium pixel-art game dialogue background, widescreen 16:9. Interior of a modest old Finnish log cabin kitchen. Elderly man Aarni, grey beard, lined kind face, faded wool shirt and olive cardigan, seated at a worn wooden kitchen table carving a traditional wooden kuksa cup with a Finnish puukko knife, wood shavings beneath his hands. A ceramic coffee cup and old enamel coffee pot beside him. Show him from waist up at the right half, facing slightly toward viewer as if talking to a visitor. Timber log walls, small blue daylight window, cast iron stove, hanging herbs, shelves and hand tools, very warm amber firelight contrasting cool window light. Lower quarter is shadowy quiet table front and floor so game dialogue overlays will be readable. Beautiful naturalistic hand-crafted pixel clusters, textured wood, soft human features, cinematic calm, sophisticated restrained colors. No interface, no speech bubbles, no labels, no text, no logo. Actual game illustration, not a mockup.

## props

Asset: `timber-props.png`

Use case: stylized-concept. Original production 2D side-view pixel-art forest prop atlas with genuine TRANSPARENT alpha background. Four isolated props in exactly 2 columns and 2 rows, generous empty margins no overlap. Top left: a weathered Finnish LOG CABIN, front visible with a prominent wooden DOOR in center, two amber-lit windows, mossy pitched shingle roof, stone chimney, small porch, believable horizontal logs and corner joints. Top right: a beautiful handmade wilderness LEAN-TO SHELTER, three-quarter side view with open front, bark-shingle sloped roof, stout wooden poles, moss edging, bed of spruce branches inside. Bottom left: one full tall slender SPRUCE TREE including intact top and roots, irregular branches rich dark green needles and weathered trunk, not a stump. Bottom right: one low broad irregular dark FOREGROUND ROCK AND MOSS MOUND with ferns and twisted roots. Detailed naturalistic pixel art matching sophisticated wilderness game aesthetics, muted moss greens and chestnut wood, warm light on left faces, deep soft shadows, readable silhouettes. No people, no animals, no scenery, no ground planes, no text, no labels, no grid. Preserve transparent outside all props.

## logo

Asset: `timber-logo.png`

Use case: logo-brand. Create an original illustrated title logo for a cozy woodland survival pixel-art game. Exact text once: "TIMBERTRAIL" (T I M B E R T R A I L). Wide single-line compact wordmark in bold irregular hand-cut cream-colored block serif letters, subtle woody notches and softly worn edges, dark pine-green dimensional backing and small warm amber edge highlights. A modest integrated spruce silhouette and winding trail underline, rustic outdoorsy spirit of Wild n Chill's title treatment but original design and different lettering. Make it sophisticated, calm and readable at 300px wide, not childish. Transparent alpha background, no rectangle, no scenery, no extra words, no subtitle, no watermark. Centered with generous clear margins.

## poses

Asset: `timber-poses.png`

Use case: stylized-concept. Image 1 is a character identity and pixel-art STYLE REFERENCE only. Create a NEW transparent-alpha game sprite atlas of this same adult bearded wanderer, rust wool beanie, tan jacket, dark teal trousers, leather boots and brown backpack. EXACT layout 4 equal columns × 3 equal rows =12 distinct fully isolated full-body sprites. All face RIGHT, strict side view. Row1: FOUR sequential natural WALK CYCLE frames: left contact, down/passing, right contact, up/passing, relaxed alternating arms, correct weight shift. Row2: col1 bending to pick a plant with hand near ground; col2 kneeling reaching and lifting a small branch; col3 gripping a wooden-handled steel hatchet with BOTH HANDS raised in backswing; col4 driving that hatchet down and forward at waist-height, natural shoulders and bent elbows. Row3: col1 axe follow-through with weight forward; col2 holding a wooden longbow in left hand at rest; col3 aiming bow horizontally RIGHT at full draw, left arm straight and right hand at cheek, proper archery grip, one nocked arrow; col4 release/follow-through after shooting, bow still facing right. Same character size across all 12 cells, feet on same baseline within each row, generous transparent margin, all weapons remain inside own cell. High quality naturalistic crisp pixel clusters and garment texture, muted forest palette. No labels, no grid lines, no text, no scene, no background, no shadows outside silhouettes. Genuine transparency. Keep identity/outfit matching reference, do not include dog.

## Integration notes

- Interior: illustrated still background for the dialogue and trade panels, with HTML speech and choices.
- Props: transparent cabin, lean-to, spruce and mossy rock mound atlas; source crop rectangles live in Renderer.prop.
- Poses: twelve traveller key poses: four walking, two gathering, three chopping and three bow poses. Atlas padding is excluded in source rectangles. Existing crouch/idle and dog/wildlife sprites are retained.
- Logo: transparent Timbertrail wordmark used on the start screen.
- Native Canvas contact sheets and game scenes were inspected. This does not verify browser CSS or animation feel.

