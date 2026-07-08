# World Cup Calendar Project

## Project Facts

- Purpose: generate static subscribable ICS feeds for the FIFA World Cup 2026 schedule and upcoming Fescinal 2026 sessions.
- Main generated calendar: `docs/worldcup-2026.ics`.
- Fescinal generated calendar: `docs/fescinal-2026.ics`.
- Live calendar URL: `https://rudoes.github.io/worldcup_calendar/worldcup-2026.ics`.
- Live Fescinal calendar URL: `https://rudoes.github.io/worldcup_calendar/fescinal-2026.ics`.
- Live subscribe page: `https://rudoes.github.io/worldcup_calendar/`.
- Normalized fixture cache: `data/fifa-2026-matches.json`.
- Normalized Fescinal cache: `data/fescinal-2026-sessions.json`.
- Generator entrypoint: `src/generate.ts`.
- Fescinal generator entrypoint: `src/generate-fescinal.ts`.
- Validator entrypoint: `src/validate.ts`.
- Fescinal validator entrypoint: `src/validate-fescinal.ts`.
- Build command: `npm run build`.
- Automatic refresh workflow: `.github/workflows/refresh-calendar.yml`.
- Runtime requirement: Node.js 22.6 or newer.

## Data Source

- FIFA public API: `https://api.fifa.com/api/v3/calendar/matches?idCompetition=17&idSeason=285023&count=200`.
- Competition ID: `17`.
- Season ID: `285023`.
- Expected match count: `104`.
- Timezone resolution should prefer FIFA stadium/city IDs over mutable city labels.
- FIFA currently returns `New York/New Jersey Stadium` with city `New Jersey`; map that venue to `America/New_York`.
- Do not use Unicode flag emoji in event titles; Google Calendar may render them as country-code letters on some clients.

## Fescinal Data Source

- Fescinal site: `https://www.fescinal.es/`.
- Source pages: `/programacion/6/2026/`, `/programacion/7/2026/`, `/programacion/8/2026/`, and `/programacion/9/2026/`.
- Sessions are filtered to upcoming events only at generation time.
- Times are interpreted as `Europe/Madrid` local time and emitted as UTC in the ICS.
- Early-morning sessions before 06:00 are treated as belonging to the next local calendar day.
- Poster/image metadata is intentionally omitted.

## Workflow

- Run `npm run build` after fixture changes or before publishing.
- Publish the `docs/` directory to an HTTPS static host.
- Google Calendar subscription URL is `https://rudoes.github.io/worldcup_calendar/worldcup-2026.ics`.
- Fescinal Google Calendar subscription URL is `https://rudoes.github.io/worldcup_calendar/fescinal-2026.ics`.
- GitHub Actions refreshes the feeds every 12 hours from June 11 through September 6, 2026, UTC, and commits changed generated files.
- Generators preserve `generatedAt` when calendar payloads are unchanged to avoid timestamp-only scheduled commits.

## Memory

Read `PROJECT_MEMORY.md` at session start for stable project context.
