# World Cup Calendar Project

## Project Facts

- Purpose: generate a static subscribable ICS feed for the FIFA World Cup 2026 schedule.
- Main generated calendar: `docs/worldcup-2026.ics`.
- Normalized fixture cache: `data/fifa-2026-matches.json`.
- Generator entrypoint: `src/generate.ts`.
- Validator entrypoint: `src/validate.ts`.
- Build command: `npm run build`.
- Runtime requirement: Node.js 22.6 or newer.

## Data Source

- FIFA public API: `https://api.fifa.com/api/v3/calendar/matches?idCompetition=17&idSeason=285023&count=200`.
- Competition ID: `17`.
- Season ID: `285023`.
- Expected match count: `104`.

## Workflow

- Run `npm run build` after fixture changes or before publishing.
- Publish the `docs/` directory to an HTTPS static host.
- Google Calendar subscription URL is the published `worldcup-2026.ics` URL.

## Memory

Read `PROJECT_MEMORY.md` at session start for stable project context.
