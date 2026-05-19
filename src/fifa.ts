import {
  CITY_TIME_ZONES,
  EXPECTED_MATCH_COUNT,
  FIFA_API_URL,
  FIFA_SCHEDULE_PAGE,
  FIFA_SCHEDULE_PDF,
  GROUP_STAGE_DURATION_MINUTES,
  KNOCKOUT_DURATION_MINUTES
} from "./constants.ts";
import type {
  FifaCalendarResponse,
  FifaMatch,
  FifaTeam,
  NormalizedDataFile,
  NormalizedMatch,
  Participant
} from "./types.ts";

export async function fetchFifaMatches(): Promise<FifaMatch[]> {
  const response = await fetch(FIFA_API_URL, {
    headers: {
      Accept: "application/json",
      "User-Agent": "worldcup-calendar-generator/1.0"
    }
  });

  if (!response.ok) {
    throw new Error(`FIFA API request failed: ${response.status} ${response.statusText}`);
  }

  const payload = (await response.json()) as FifaCalendarResponse;
  if (!Array.isArray(payload.Results)) {
    throw new Error("FIFA API response did not include a Results array.");
  }

  return payload.Results.sort((a, b) => a.MatchNumber - b.MatchNumber);
}

export function normalizeMatches(matches: FifaMatch[], generatedAt: string): NormalizedDataFile {
  if (matches.length !== EXPECTED_MATCH_COUNT) {
    throw new Error(`Expected ${EXPECTED_MATCH_COUNT} matches, received ${matches.length}.`);
  }

  const normalized = matches.map(normalizeMatch);

  return {
    generatedAt,
    source: {
      apiUrl: FIFA_API_URL,
      schedulePage: FIFA_SCHEDULE_PAGE,
      schedulePdf: FIFA_SCHEDULE_PDF
    },
    expectedMatchCount: EXPECTED_MATCH_COUNT,
    matches: normalized
  };
}

function normalizeMatch(match: FifaMatch): NormalizedMatch {
  const stage = localized(match.StageName) ?? "Unknown stage";
  const group = localized(match.GroupName);
  const venueName = localized(match.Stadium?.Name) ?? "Unknown venue";
  const city = localized(match.Stadium?.CityName) ?? "Unknown city";
  const timeZone = CITY_TIME_ZONES[city] ?? "UTC";

  return {
    matchNumber: match.MatchNumber,
    fifaMatchId: match.IdMatch,
    stage,
    group: group || undefined,
    utcKickoff: match.Date,
    localKickoff: match.LocalDate,
    durationMinutes: stage === "First Stage" ? GROUP_STAGE_DURATION_MINUTES : KNOCKOUT_DURATION_MINUTES,
    home: normalizeParticipant(match.Home, match.PlaceHolderA),
    away: normalizeParticipant(match.Away, match.PlaceHolderB),
    score: normalizeScore(match),
    winner: normalizeWinner(match),
    matchStatus: match.MatchStatus ?? undefined,
    resultType: match.ResultType ?? undefined,
    venue: {
      name: venueName,
      city,
      countryCode: match.Stadium?.IdCountry,
      timeZone
    },
    sourceUrl: FIFA_API_URL
  };
}

function normalizeScore(match: FifaMatch): NormalizedMatch["score"] {
  if (match.HomeTeamScore === null || match.HomeTeamScore === undefined) return undefined;
  if (match.AwayTeamScore === null || match.AwayTeamScore === undefined) return undefined;

  return {
    home: match.HomeTeamScore,
    away: match.AwayTeamScore,
    homePenalties: match.HomeTeamPenaltyScore ?? undefined,
    awayPenalties: match.AwayTeamPenaltyScore ?? undefined
  };
}

function normalizeWinner(match: FifaMatch): NormalizedMatch["winner"] {
  if (!match.Winner) return undefined;
  if (match.Home?.IdTeam && match.Winner === match.Home.IdTeam) return "home";
  if (match.Away?.IdTeam && match.Winner === match.Away.IdTeam) return "away";
  return undefined;
}

function normalizeParticipant(team: FifaTeam | null | undefined, placeholder: string | null | undefined): Participant {
  if (!team) {
    const raw = placeholder ?? "TBD";
    return {
      name: describePlaceholder(raw),
      placeholder: raw
    };
  }

  const abbreviation = team.Abbreviation;
  const flagUrl = resolveFlagUrl(team.PictureUrl, abbreviation);
  const logoUrl = team.IdTeam
    ? `https://api.fifa.com/api/v3/picture/teams-sq-4/${team.IdTeam}`
    : flagUrl;

  return {
    name: localized(team.TeamName) ?? team.ShortClubName ?? abbreviation ?? "TBD",
    abbreviation,
    fifaTeamId: team.IdTeam,
    countryCode: team.IdCountry,
    logoUrl,
    flagUrl
  };
}

function localized(values: { Locale: string; Description: string }[] | null | undefined): string | undefined {
  if (!values || values.length === 0) return undefined;
  return values.find((value) => value.Locale.toLowerCase() === "en-gb")?.Description ?? values[0]?.Description;
}

function resolveFlagUrl(template: string | undefined, abbreviation: string | undefined): string | undefined {
  if (template) {
    return template.replace("{format}", "sq").replace("{size}", "4");
  }

  if (!abbreviation) return undefined;
  return `https://api.fifa.com/api/v3/picture/flags-sq-4/${abbreviation}`;
}

function describePlaceholder(raw: string): string {
  const winner = raw.match(/^W(\d+)$/);
  if (winner) return `Winner Match ${winner[1]}`;

  const runnerUp = raw.match(/^RU(\d+)$/);
  if (runnerUp) return `Runner-up Match ${runnerUp[1]}`;

  const groupWinner = raw.match(/^1([A-L])$/);
  if (groupWinner) return `Group ${groupWinner[1]} winner`;

  const groupRunnerUp = raw.match(/^2([A-L])$/);
  if (groupRunnerUp) return `Group ${groupRunnerUp[1]} runner-up`;

  const thirdPlace = raw.match(/^3([A-L]+)$/);
  if (thirdPlace) {
    return `Best third-place team from Groups ${thirdPlace[1].split("").join("/")}`;
  }

  return raw;
}
