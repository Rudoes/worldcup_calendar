# World Cup Calendar Project

## Project Facts

- Purpose: generate a static subscribable ICS feed for the FIFA World Cup 2026 schedule.
- Main generated calendar: `docs/worldcup-2026.ics`.
- Live calendar URL: `https://rudoes.github.io/worldcup_calendar/worldcup-2026.ics`.
- Live subscribe page: `https://rudoes.github.io/worldcup_calendar/`.
- Normalized fixture cache: `data/fifa-2026-matches.json`.
- Generator entrypoint: `src/generate.ts`.
- Validator entrypoint: `src/validate.ts`.
- Build command: `npm run build`.
- Automatic refresh workflow: `.github/workflows/refresh-calendar.yml`.
- Runtime requirement: Node.js 22.6 or newer.

## Data Source

- FIFA public API: `https://api.fifa.com/api/v3/calendar/matches?idCompetition=17&idSeason=285023&count=200`.
- Competition ID: `17`.
- Season ID: `285023`.
- Expected match count: `104`.

## Workflow

- Run `npm run build` after fixture changes or before publishing.
- Publish the `docs/` directory to an HTTPS static host.
- Google Calendar subscription URL is `https://rudoes.github.io/worldcup_calendar/worldcup-2026.ics`.
- GitHub Actions refreshes the feed every 12 hours from June 11 through July 19, UTC, and commits changed generated files.

## Memory

Read `PROJECT_MEMORY.md` at session start for stable project context.
