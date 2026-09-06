# Timbertrail project guidance

Use README.md and DEVELOPMENT.md for the current architecture and product direction.
Use Astra as requested by the user; do not spawn other agents unless asked.
Preserve existing local files and saves. Never force-push or discard unrelated work.
Run npm test, npm run check:secrets, npm run build and the production asset check before publication.
The user requested ongoing GitHub updates: commit completed, verified requested changes and push main to origin. Check the remote first; stop if concurrent changes cannot be safely integrated. GitHub Actions deploys main to Pages.
Do not commit credentials, caches, dist or local diagnostics. No third-party extracted game assets.
DOM tests are not browser layout or sound-quality verification. State remaining playtest limitations honestly.
