# Audio review status

Sound effects and title recording remain unchanged. World oscillator melody is removed in the experimental copy. Listening status: **not_reviewed**. Technical tests do not establish the requested new mix's quality.

Sample playback lifecycle now differs from baseline: region variants use a shuffle bag with no immediate repetition, including bag boundaries. Sample contacts cap at24; sampled loops cap at six INCLUDING release tails, so rapid stop/restart cannot accumulate unbounded fading loops. Ended sources reclaim slots; context replacement stops/disconnects old sources, clears decoded banks, and generation-checks late decode results. Overload currently drops new sampled contacts (returning handled, without adding synthesis). This is a sample-player limit, NOT yet a global budget for all procedural fallback voices or salience-based prioritization. Those remain open. Four-take/80-contact tests,80 rapid loop toggles and stale old-context completion tests pass. No new source processing or listening review implied.

## Recorded music — provisional playtest bank, 2026-09-11

Three locally hosted 90-second closing excerpts are now registered: Permafrost (forest/shore), Hiraeth (shore/cabin), Solace (cabin). These are provisional selections, **not_reviewed**, not final perceptual acceptance. Permafrost's source describes solo violin; Hiraeth describes cello, not violin. Solace may be too bright. Musical suitability and opening cut points still need a listener. No claim that these match the reference composition.

Original MP3s and downloaded official track/usage pages are archived only in work/audio/world-music. assets/audio/world-music.json contains source/download URLs, source and derived SHA256, author/license, exact edit ranges and measured loudness. work/prepare-world-music.cjs reproduces the preparation: closing90s,3s opening fade,0.4s final safety fade within the existing tail, static gain only. No EQ/compression/time stretch. File true peaks after MP3 encoding: Permafrost−2.40, Hiraeth−4.20, Solace−2.77dBTP; integrated file levels−16.56/−16.45/−16.44LUFS. These are standalone-file diagnostics, NOT the full game mix's loudness or hearing evidence.

CC BY4 attribution and adaptation notice are in music-credits.html, linked from both language versions of Settings. Local build includes exactly the three excerpt files, manifest and credits; source recordings/HTML archive remain outside the build. Title recording untouched.

Streaming envelopes now follow media.currentTime, not time spent loading.30 seconds of active stalled transport fails safely to nature and frees the element; pause and suspended contexts do not age it. Muting while paused cancels cleanly. A late play promise cannot resume a paused game. Real-role20-minute timing simulations retain65–80% nature-only time; source and duration/hash checks pass. Full package tests/secrets/build/production assets pass, cache78693a94c1df. Browser transport review in progress at the separate no-save diagnostic origin57298; this is not the gameplay mix review.

Actual browser transport now verified for all3 files through visible test-page buttons/status: readyState4 and advancing media time; Permafrost pause at9.822s stayed unchanged, resumed at9.972s; context suspend/resume20.332→20.462s; mute freed media. Hiraeth progressed to8.583s. Solace progressed through66.830s and later reached cooldown with no media/errors. Diagnostic source was then released and tab closed. Evidence: work/audio/world-music/browser-transport-review.json. This bypassed initial waiting only in the diagnostic page; it is not full gameplay, device-matrix or listening acceptance.20-minute timing simulations show70% nature-only time for each real role.

Next: actual listener A/B/mono/full-game mix, musical cut-point approval, foley/source and sound-bus work. The source bank is not a reason to stop independent graphics work.

## Historical foundation notes (superseded by the bank above)

`world-music.js` now supplies an active-time director and a streaming-media transport. It is loaded by the game and included in the local build. The actual cue bank is intentionally EMPTY until source preparation: world playback therefore currently uses nature without music. This is NOT a completed recorded music replacement or an accepted silent-only soundtrack. No downloaded candidate is being mislabeled as violin music. Title music is untouched.

Director tests use synthetic metadata/fake media, not audible musical excerpts. A20-minute timing simulation at30/60/144Hz verifies65–80% silence with80-second test cues, initial45-second nature,30-second role dwell, nonrepeating selection and long cooldowns. Pause and sleep jumps do not advance phrases; region changes select the next phrase rather than cutting the present one. Transport tests cover single source ownership, asynchronous stale-play cleanup, errors and failure cooldown. These tests DO NOT prove musical phrase endpoints, actual playback duration, browser autoplay or perceptual quality. Real cue durations/phrases, decoded file QA and actual browser transport still pending.

Next: prepare locally hosted licensed recordings and complete attribution/hashes, register real phrase metadata, browser playback/autoplay/mute tests, and export level-matched A/B for an actual listener. All foley/bus/variant updates still pending. The source bank is not a reason to stop independent graphics work.

Three candidates from the supplied package checked on official source pages on 2026-09-10:

| Candidate | Source description (not a listening claim) | Status |
|---|---|---|
| [Hiraeth](https://www.scottbuckley.com.au/library/hiraeth/) | Strings, synth pads, solo cello | Candidate, not downloaded / not auditioned |
| [Solace](https://www.scottbuckley.com.au/library/solace/) | Strings, synth, piano, glass marimba | Candidate, not downloaded / not auditioned |
| [Reverie](https://www.scottbuckley.com.au/library/reverie/) | Piano, synth, strings | Candidate, not downloaded / not auditioned |

Each track page states CC BY 4.0 and requires Scott Buckley attribution. [Official usage terms](https://www.scottbuckley.com.au/library/using-this-music/) permit adaptation/use with attribution and warn against isolated resale / streaming redistribution and Content ID submission. Verify the chosen asset's hash and supply credits before integration. Source description cannot prove a natural solo-violin timbre or suitability of a particular excerpt.

Needed next: complete event-to-bus inventory, source/variant selection, organic sample preparation, active-time phrase scheduler, no-title overlap, silence on failed music load, 20-minute quiet-share audit, final listener A/B review. Existing title music is protected by default.
