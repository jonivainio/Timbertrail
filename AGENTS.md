# Timbertrail project guidance

Use README.md and DEVELOPMENT.md for the current architecture and product direction.
Use Astra as requested by the user; do not spawn other agents unless asked.
Preserve existing local files and saves. Never force-push or discard unrelated work.
Run npm test, npm run check:secrets, npm run build and the production asset check before publication.
Work locally by default. Do not commit, push or publish to GitHub unless the user explicitly requests a GitHub update. At that time, check the remote first, integrate safely, run publication checks and push main without force. GitHub Actions deploys main to Pages.
Do not commit credentials, caches, dist or local diagnostics. No third-party extracted game assets.
DOM tests are not browser layout or sound-quality verification. State remaining playtest limitations honestly.
