# Lessons

## Flag Emoji In Google Calendar Titles

- What went wrong: Unicode flag emoji in `SUMMARY` rendered as regional-indicator country letters such as `CA` and `BA` in the user's Google Calendar environment.
- Why: Calendar event titles are plain text, and flag emoji rendering depends on the client OS/browser font stack. Google Calendar cannot force image-style flag icons in titles.
- Rule: Do not use Unicode flag emoji in event `SUMMARY` values for this project. Keep summaries text-only unless the target calendar client is verified to render the exact symbols correctly.
