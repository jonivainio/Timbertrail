# User-supplied parchment banners

`menu_banner.png` and `pick_banner1.png`–`pick_banner3.png` are unchanged copies of the files provided by the user from Downloads. Transparency/canvas margins are accommodated only in CSS; no source pixels were altered.

`parchment.css` replaces the procedural button/field-scroll skins. The 180 ms discrete sequence holds each supplied pick frame for about 60 ms; text appears with frame 3 at 120 ms and remains visible. Changing target or wheel choice creates a fresh field scroll. Reduced-motion mode shows the final frame immediately. Preload all frames before enabling play. Preserve native button semantics and hover/focus lift.

