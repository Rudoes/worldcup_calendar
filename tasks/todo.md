# World Cup 2026 Calendar Feed

## Active Fix Plan: Refresh Workflow Failure

- [x] Capture the failing GitHub Actions log and identify the exact failing step.
- [x] Reproduce the failure locally with the current FIFA data.
- [x] Inspect venue/city values returned by FIFA for unmapped timezone cases.
- [x] Fix the timezone mapping with the smallest deterministic code/data change.
- [x] Run `npm run build` and inspect generated file changes.
- [x] Record root cause, fix, and verification in this file.

## Refresh Workflow Failure Review

- Failing run: GitHub Actions run `27395750209` failed in `npm run validate`.
- Symptom: validator rejected `Missing venue timezone mapping for New Jersey.`
- Root cause: FIFA changed the `New York/New Jersey Stadium` city label from `New York` to `New Jersey`; `CITY_TIME_ZONES` only mapped the old `New York` label, so New Jersey events fell back to `UTC`.
- Fix: added `New Jersey -> America/New_York` to the venue timezone map and added a no-dependency regression test for known FIFA host city labels.
- Generated output: refreshed `data/fifa-2026-matches.json` and `docs/worldcup-2026.ics` from current FIFA data; all 8 New Jersey matches now use `America/New_York`.
- Verification: `npm run build` passed, including the timezone mapping test, generation of 104 matches, and validation of 104 calendar events.

## Goal

Build a subscribable calendar URL for Google Calendar containing all 2026 FIFA World Cup matches, including kickoff times, teams, venues, and team logo references where technically supported by calendar clients.

## Requirements

- [x] Produce a standards-compliant `.ics` calendar feed that Google Calendar can subscribe to by URL.
- [x] Include every 2026 FIFA World Cup match in the feed.
- [x] Use current authoritative fixture data, not stale hardcoded assumptions.
- [x] Include kickoff times with correct time zones.
- [x] Include team names where known, and placeholders where knockout-stage participants are unresolved.
- [x] Include venue and city for each match.
- [x] Include team logo references in a calendar-compatible way where possible.
- [x] Provide a practical subscription URL strategy, such as a static hosted `.ics` file.
- [x] Add validation that detects missing matches, invalid dates, malformed ICS, duplicate UIDs, and missing required fields.
- [x] Document how to regenerate and publish the calendar when fixtures or teams change.

## Implementation Plan

- [x] Confirm plan with user before implementation.
- [x] Research and record the fixture data source and its limitations.
- [x] Create a small TypeScript project for deterministic ICS generation.
- [x] Store fixture data in a structured format that can be audited and updated.
- [x] Implement ICS generation with stable UIDs, `VEVENT` metadata, descriptions, venues, source links, and image/logo references.
- [x] Implement validation scripts for count, schema, dates, UIDs, and required event fields.
- [x] Generate the final calendar file under a public/static output path.
- [x] Add README instructions for Google Calendar subscription and publishing.
- [x] Run validation and build commands.

## Publication Plan

- [x] Re-run `npm run build` against current FIFA data.
- [x] Initialize a Git repository for this project.
- [x] Commit the calendar generator, generated feed, docs, and Pages-ready `/docs` directory.
- [x] Create/push a public GitHub repository under the authenticated `Rudoes` account.
- [x] Enable GitHub Pages from the `main` branch `/docs` directory.
- [x] Verify the live `.ics` URL returns the generated calendar.
- [x] Verify the live subscribe page creates a Google Calendar subscription link.
- [x] Record the final subscription URL in this file and README.

## Automatic Update Plan

- [x] Add GitHub Actions `workflow` scope to the authenticated GitHub CLI token.
- [x] Add a scheduled GitHub Actions workflow that regenerates and validates the feed every 12 hours from June 11 through July 19, 2026, UTC.
- [x] Add a 2026 date guard because GitHub cron has no year field.
- [x] Make the generator include scores and winners when FIFA returns result data.
- [x] Prevent scheduled runs from committing timestamp-only changes when FIFA data is unchanged.
- [x] Push the workflow to GitHub.
- [x] Verify GitHub accepts and lists the workflow.

## Verification Gates

- [x] Fixture count matches the official tournament match count.
- [x] Generated ICS parses successfully.
- [x] Every event has UID, DTSTART, DTEND, SUMMARY, LOCATION, DESCRIPTION, and source metadata.
- [x] Kickoff times are explicitly timezone-aware.
- [x] No duplicate matches or duplicate UIDs exist.
- [x] Google Calendar subscription path is documented and feasible.

## Review

- Built a dependency-free Node 22 TypeScript generator and validator.
- Generated `docs/worldcup-2026.ics` from FIFA competition `17`, season `285023`.
- Validated 104 events, required ICS fields, unique UIDs, UTC start/end values, match-number coverage, venue timezone mappings, and team logo attachments for known team matchups.
- Added `docs/index.html` so GitHub Pages can serve the feed from the `main` branch `/docs` directory.
- Published public repository: `https://github.com/Rudoes/worldcup_calendar`.
- Published subscribe page: `https://rudoes.github.io/worldcup_calendar/`.
- Final calendar URL: `https://rudoes.github.io/worldcup_calendar/worldcup-2026.ics`.
- Google Calendar subscribe link: `https://calendar.google.com/calendar/render?cid=https%3A%2F%2Frudoes.github.io%2Fworldcup_calendar%2Fworldcup-2026.ics`.
- Live verification: GitHub Pages status is `built`, HTTPS is enforced, the ICS URL returns `200 OK` with `Content-Type: text/calendar`, and the live feed contains 104 `VEVENT` entries, 104 UTC start times, 104 UTC end times, 144 image attachments, and Match 104.
- Added automatic refresh workflow to regenerate the feed every 12 hours from June 11 through July 19, 2026, UTC, and commit changes when FIFA data changes.
- Result support: generated event summaries/descriptions now include scores and winners when FIFA returns them.
- Manual workflow verification run `26115119602` succeeded, generated and validated 104 events, and exited with `No calendar changes detected.`
