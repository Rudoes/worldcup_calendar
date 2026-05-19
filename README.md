# FIFA World Cup 2026 Calendar Feed

This project generates a static `.ics` calendar feed for all 104 FIFA World Cup 2026 matches.

The generated feed is:

- `docs/worldcup-2026.ics`
- UTC-based for correct Google Calendar time conversion
- sourced from FIFA public fixture data for competition `17`, season `285023`
- enriched with teams, placeholders, venues, city, local kickoff display, and FIFA-hosted team image references

Live feed URL:

```text
https://rudoes.github.io/worldcup_calendar/worldcup-2026.ics
```

Google Calendar subscribe link:

```text
https://calendar.google.com/calendar/render?cid=https%3A%2F%2Frudoes.github.io%2Fworldcup_calendar%2Fworldcup-2026.ics
```

## Subscribe From Google Calendar

Google Calendar can subscribe only to a URL it can reach publicly over the web. The published subscription URL is:

```text
https://rudoes.github.io/worldcup_calendar/worldcup-2026.ics
```

In Google Calendar:

1. Open Google Calendar.
2. Go to `Other calendars` -> `From URL`.
3. Paste the published `.ics` URL.
4. Add the calendar.

The included `docs/index.html` page also builds a Google Calendar subscribe link automatically from the current host.

For GitHub Pages, this repository is served from the `main` branch and `/docs` directory:

```text
https://rudoes.github.io/worldcup_calendar/
```

## Regenerate

Requires Node.js 22.6 or newer.

```bash
npm run build
```

The build does two things:

- `npm run generate`: fetches current FIFA fixture data and writes `data/fifa-2026-matches.json` plus `docs/worldcup-2026.ics`
- `npm run validate`: verifies 104 events, unique UIDs, required event fields, timezone-aware UTC start/end values, match numbers, and team logo attachments where both teams are known

## Automatic Updates

GitHub Actions runs `.github/workflows/refresh-calendar.yml` every 12 hours from June 11 through July 19, UTC, and can also be triggered manually. It runs `npm run build`, commits changed `data/fifa-2026-matches.json` and `docs/worldcup-2026.ics`, and pushes them back to `main`. If FIFA data has not changed, the generator preserves the previous timestamp so the workflow exits without a commit.

The generator includes scores and winners when FIFA starts returning result data. Google Calendar then picks up the changed feed on its normal subscription refresh cycle.

## Data Sources

- FIFA public API: `https://api.fifa.com/api/v3/calendar/matches?idCompetition=17&idSeason=285023&count=200`
- FIFA schedule page: `https://www.fifa.com/en/tournaments/mens/worldcup/canadamexicousa2026/articles/match-schedule-fixtures-results-teams-stadiums`
- FIFA schedule PDF: `https://digitalhub.fifa.com/m/1be9ce37eb98fcc5/original/FWC26-Match-Schedule_English.pdf`

FIFA image references are emitted as ICS `ATTACH` properties and in event descriptions. Google Calendar may ignore event images from ICS feeds, but the URLs are present in the feed for compatible clients.

## Notes

- Group-stage matches use a 2-hour event duration.
- Knockout matches use a 3-hour event duration.
- The feed URL is stable. GitHub Actions refreshes the generated file every 12 hours from June 11 through July 19, UTC; manual refresh is still possible with `npm run build`.
