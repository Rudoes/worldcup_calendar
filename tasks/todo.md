# World Cup 2026 Calendar Feed

## Active Removal Plan: Retire GitHub Publication

- [ ] Confirm removal scope with user before any destructive or remote GitHub write action.
- [ ] Decide whether to delete the remote repository entirely or keep the repository while disabling Pages and Actions.
- [ ] If keeping the repository, remove or disable `.github/workflows/refresh-calendar.yml` and disable GitHub Pages for `main` `/docs`.
- [ ] If deleting the repository, delete `Rudoes/worldcup_calendar` through GitHub CLI after explicit confirmation.
- [ ] Verify the final GitHub state: repository removed or Pages/Actions disabled according to the confirmed scope.
- [ ] Record the retirement review and verification outcome.

## Active Plan: Fescinal Calendar Feed

- [x] Confirm scope with user before implementation: upcoming sessions only, no poster metadata.
- [x] Treat Fescinal programming sessions as the calendar events, not the RSS feed alone.
- [x] Scrape the 2026 programming month pages listed by the site: `/programacion/6/2026/`, `/programacion/7/2026/`, `/programacion/8/2026/`, and `/programacion/9/2026/`.
- [x] Extract each session deterministically from the HTML cards: title, date, start/end time, screen, film URL, and ticket URL when available.
- [x] Normalize times as Madrid local time and emit ICS `DTSTART`/`DTEND` in UTC.
- [x] Handle after-midnight sessions by rolling early-morning start times and later end times to the next calendar day.
- [x] Filter generated data to upcoming sessions only.
- [x] Generate `data/fescinal-2026-sessions.json` and `docs/fescinal-2026.ics` alongside the existing World Cup files.
- [x] Add Fescinal-specific tests and validation for event count, unique UIDs, required ICS fields, valid dates, no duplicate sessions, and valid Madrid timezone conversion.
- [x] Update the static landing page to expose both calendar feeds and Google Calendar subscribe links.
- [x] Update npm scripts so `npm run build` builds and validates both calendars without breaking the World Cup workflow.
- [x] Add or update GitHub Actions refresh so the Fescinal feed is refreshed automatically while the 2026 season is active.
- [x] Push generated changes, verify GitHub Pages serves the Fescinal feed, and record the review.

## Fescinal Calendar Feed Review

- Added `docs/fescinal-2026.ics` and `data/fescinal-2026-sessions.json`.
- Added a Fescinal parser/generator/validator that reads the official 2026 programming month pages, filters to upcoming sessions only, omits poster metadata, and emits UTC ICS times from `Europe/Madrid` local times.
- Added after-midnight handling for early-morning sessions listed under the prior programming date.
- Updated `npm run build` to test, generate, and validate both the World Cup and Fescinal feeds.
- Updated the subscribe page to expose both stable feed URLs.
- Updated the refresh workflow to cover June 11 through September 6, 2026, and commit both generated feeds when they change.
- Verification: `npm run build` passed with 16 tests, 104 validated World Cup events, and 53 validated Fescinal events.
- Live verification: `https://rudoes.github.io/worldcup_calendar/fescinal-2026.ics` returns 53 `VEVENT` entries, and `https://rudoes.github.io/worldcup_calendar/worldcup-2026.ics` still returns 104 `VEVENT` entries.

## Active Correction Plan: Remove Flag Emoji From Titles

- [x] Remove Unicode flag emoji from event summaries.
- [x] Add a validator guard against unsupported flag emoji in summaries.
- [x] Update the cache-busted subscribe URL for immediate resubscription.
- [x] Regenerate and validate the calendar feed.
- [x] Push and rerun the refresh workflow remotely.
- [x] Verify the live versioned feed.

## Active Polish Plan: Event Summaries And Descriptions

- [x] Add flag icons before team names in event summaries.
- [x] Remove team logo and flag URL text from descriptions.
- [x] Remove source and schedule page URL text from descriptions.
- [x] Add tests and validator checks for the new title/description contract.
- [x] Regenerate and validate the calendar feed.

## Event Summary And Description Polish Review

- Event summaries now prefix known teams with flag emoji, for example `🇲🇽 Mexico (2) - 🇿🇦 South Africa (0)`.
- Event descriptions no longer include team logo URLs, flag URLs, source URL text, or schedule page URL text.
- ICS metadata properties such as `URL`, `X-FIFA-SOURCE`, `ATTACH`, and `IMAGE` remain available outside the description for clients that use them.
- Verification: `npm run build` passed with 11 tests and 104 validated events.
- Generated ICS inspection: 0 `SUMMARY:Match X:` prefixes, 0 descriptions with URLs, and 0 descriptions with image URL text.

## Active Feature Fix Plan: Event Result Titles

- [x] Change event `SUMMARY` formatting to remove `Match X` prefixes.
- [x] Show scores in event titles as `Team (goals) - Team (goals)`.
- [x] Add regression tests for scored and unscored event summaries.
- [x] Regenerate and validate the calendar feed.
- [x] Push and rerun the refresh workflow remotely.

## Event Result Title Review

- Event `SUMMARY` values no longer start with `Match X:`.
- Completed match summaries now use `Team (goals) - Team (goals)`, for example `Mexico (2) - South Africa (0)`.
- Future/unscored match summaries now use `Team - Team`.
- Validator now rejects old `Match X:` summary prefixes and checks formatted score summaries for scored matches.
- Verification: local `npm run build` passed with 10 tests and 104 validated events; workflow run `27409729518` passed on commit `1319727`.
- Live verification: `https://rudoes.github.io/worldcup_calendar/worldcup-2026.ics` serves 104 events, 0 old `SUMMARY:Match X:` prefixes, and the first two result titles in the requested score format.

## Active Hardening Plan: FIFA Venue Label Changes

- [x] Inspect live FIFA stadium fields for stable venue identifiers.
- [x] Change timezone resolution to prefer FIFA stadium/city IDs over mutable display city labels.
- [x] Add regression tests for renamed labels and unknown venue failures.
- [x] Run `npm run build` locally.
- [x] Push and rerun the refresh workflow remotely.
- [x] Record root cause hardening and verification.

## Venue Timezone Hardening Review

- Risk addressed: FIFA display labels can change without changing the actual venue.
- Fix: timezone resolution now checks FIFA `IdStadium`, then `IdCity`, then legacy city labels.
- Generated data now records `venue.fifaStadiumId` and `venue.fifaCityId` for auditability.
- Unknown venues no longer fall back to `UTC`; they fail with an error that includes available stadium ID, city ID, and city label.
- Local verification: `npm run build` passed with 7 timezone resolver tests and 104 validated calendar events.
- Remote verification: workflow run `27409267585` passed on commit `ca58e47`.

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
- Hardening: updated `actions/checkout` and `actions/setup-node` from v4 to current v6 tags to avoid the Node 20 action-runtime deprecation warning during the June-July 2026 refresh window.
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
