# Timbertrail — working direction

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
