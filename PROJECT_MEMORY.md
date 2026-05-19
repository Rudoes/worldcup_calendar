# Project Memory

## Purpose

- Generates a static subscribable ICS feed for the FIFA World Cup 2026 schedule.

## Key Paths

- Calendar feed: `docs/worldcup-2026.ics`.
- Static landing page: `docs/index.html`.
- Normalized fixture cache: `data/fifa-2026-matches.json`.
- Generator: `src/generate.ts`.
- Validator: `src/validate.ts`.
- GitHub Pages publishing path: `main` branch, `/docs` directory.

## FIFA Data

- FIFA competition ID: `17`.
- FIFA season ID: `285023`.
- Expected match count: `104`.
- FIFA API URL: `https://api.fifa.com/api/v3/calendar/matches?idCompetition=17&idSeason=285023&count=200`.
- Official schedule page: `https://www.fifa.com/en/tournaments/mens/worldcup/canadamexicousa2026/articles/match-schedule-fixtures-results-teams-stadiums`.
- Official schedule PDF: `https://digitalhub.fifa.com/m/1be9ce37eb98fcc5/original/FWC26-Match-Schedule_English.pdf`.

## Workflow

- Build and validate with `npm run build`.
- Publish `docs/` to HTTPS static hosting.
- Google Calendar subscription URL is the published `worldcup-2026.ics` URL.

## Calendar Notes

- ICS times are emitted in UTC with `Z` suffix so Google Calendar converts them correctly for the subscriber.
- Venue-local kickoff time and IANA timezone are included in each event description.
- FIFA-hosted team image URLs are included as ICS `ATTACH` properties and in event descriptions.
- Google Calendar may ignore image attachments from subscribed ICS feeds.
