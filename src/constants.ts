export const COMPETITION_ID = "17";
export const SEASON_ID = "285023";
export const EXPECTED_MATCH_COUNT = 104;
export const FIFA_API_URL =
  `https://api.fifa.com/api/v3/calendar/matches?idCompetition=${COMPETITION_ID}&idSeason=${SEASON_ID}&count=200`;
export const FIFA_SCHEDULE_PAGE =
  "https://www.fifa.com/en/tournaments/mens/worldcup/canadamexicousa2026/articles/match-schedule-fixtures-results-teams-stadiums";
export const FIFA_SCHEDULE_PDF =
  "https://digitalhub.fifa.com/m/1be9ce37eb98fcc5/original/FWC26-Match-Schedule_English.pdf";

export const DATA_PATH = "data/fifa-2026-matches.json";
export const ICS_PATH = "docs/worldcup-2026.ics";
export const CALENDAR_NAME = "FIFA World Cup 2026";
export const CALENDAR_DESCRIPTION =
  "All FIFA World Cup 2026 matches from FIFA public fixture data.";
export const UID_DOMAIN = "worldcup-calendar.local";
export const GROUP_STAGE_DURATION_MINUTES = 120;
export const KNOCKOUT_DURATION_MINUTES = 180;

export const CITY_TIME_ZONES: Record<string, string> = {
  Atlanta: "America/New_York",
  Boston: "America/New_York",
  Dallas: "America/Chicago",
  Guadalajara: "America/Mexico_City",
  Houston: "America/Chicago",
  "Kansas City": "America/Chicago",
  "Los Angeles": "America/Los_Angeles",
  "Mexico City": "America/Mexico_City",
  Miami: "America/New_York",
  Monterrey: "America/Monterrey",
  "New Jersey": "America/New_York",
  "New York": "America/New_York",
  Philadelphia: "America/New_York",
  "San Francisco": "America/Los_Angeles",
  "San Francisco Bay Area": "America/Los_Angeles",
  Seattle: "America/Los_Angeles",
  Toronto: "America/Toronto",
  Vancouver: "America/Vancouver"
};
