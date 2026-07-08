# Project Memory

## Purpose

- Generates static subscribable ICS feeds for the FIFA World Cup 2026 schedule and upcoming Fescinal 2026 sessions.

## Key Paths

- Calendar feed: `docs/worldcup-2026.ics`.
- Fescinal calendar feed: `docs/fescinal-2026.ics`.
- Static landing page: `docs/index.html`.
- Live calendar URL: `https://rudoes.github.io/worldcup_calendar/worldcup-2026.ics`.
- Live Fescinal calendar URL: `https://rudoes.github.io/worldcup_calendar/fescinal-2026.ics`.
- Live subscribe page: `https://rudoes.github.io/worldcup_calendar/`.
- Google Calendar subscribe link: `https://calendar.google.com/calendar/render?cid=https%3A%2F%2Frudoes.github.io%2Fworldcup_calendar%2Fworldcup-2026.ics`.
- Fescinal Google Calendar subscribe link: `https://calendar.google.com/calendar/render?cid=https%3A%2F%2Frudoes.github.io%2Fworldcup_calendar%2Ffescinal-2026.ics`.
- Normalized fixture cache: `data/fifa-2026-matches.json`.
- Normalized Fescinal cache: `data/fescinal-2026-sessions.json`.
- Generator: `src/generate.ts`.
- Fescinal generator: `src/generate-fescinal.ts`.
- Validator: `src/validate.ts`.
- Fescinal validator: `src/validate-fescinal.ts`.
- GitHub Pages publishing path: `main` branch, `/docs` directory.
- Automatic refresh workflow: `.github/workflows/refresh-calendar.yml`.

## FIFA Data

- FIFA competition ID: `17`.
- FIFA season ID: `285023`.
- Expected match count: `104`.
- FIFA API URL: `https://api.fifa.com/api/v3/calendar/matches?idCompetition=17&idSeason=285023&count=200`.
- Official schedule page: `https://www.fifa.com/en/tournaments/mens/worldcup/canadamexicousa2026/articles/match-schedule-fixtures-results-teams-stadiums`.
- Official schedule PDF: `https://digitalhub.fifa.com/m/1be9ce37eb98fcc5/original/FWC26-Match-Schedule_English.pdf`.
- Timezone resolution should prefer FIFA stadium/city IDs over mutable city labels.
- FIFA currently returns `New York/New Jersey Stadium` with city `New Jersey`; map that venue to `America/New_York`.
- Do not use Unicode flag emoji in event titles; Google Calendar may render them as country-code letters on some clients.

## Fescinal Data

- Fescinal site: `https://www.fescinal.es/`.
- Fescinal feed URL: `https://rudoes.github.io/worldcup_calendar/fescinal-2026.ics`.
- Fescinal source pages: `https://www.fescinal.es/programacion/6/2026/`, `https://www.fescinal.es/programacion/7/2026/`, `https://www.fescinal.es/programacion/8/2026/`, and `https://www.fescinal.es/programacion/9/2026/`.
- Fescinal sessions are filtered to upcoming events only at generation time.
- Fescinal times are interpreted as `Europe/Madrid` local time and emitted as UTC in the ICS.
- Early-morning Fescinal sessions before 06:00 are treated as belonging to the next local calendar day.
- Fescinal poster/image metadata is intentionally omitted.

## Workflow

- Build and validate with `npm run build`.
- Publish `docs/` to HTTPS static hosting.
- Google Calendar subscription URL is `https://rudoes.github.io/worldcup_calendar/worldcup-2026.ics`.
- Fescinal Google Calendar subscription URL is `https://rudoes.github.io/worldcup_calendar/fescinal-2026.ics`.
- GitHub Actions refreshes the feeds every 12 hours from June 11 through September 6, 2026, UTC, and commits changed generated files.
- Generators preserve previous timestamps when calendar payloads are unchanged, so scheduled runs do not create empty churn commits.

## Calendar Notes

- ICS times are emitted in UTC with `Z` suffix so Google Calendar converts them correctly for the subscriber.
- Venue-local kickoff time and IANA timezone are included in each event description.
- FIFA-hosted team image URLs are included as ICS `ATTACH` properties and in event descriptions.
- Scores and winners are included in generated events when FIFA returns result data.
- Google Calendar may ignore image attachments from subscribed ICS feeds.
