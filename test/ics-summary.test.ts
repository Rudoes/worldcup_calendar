import assert from "node:assert/strict";
import test from "node:test";
import { buildIcs } from "../src/ics.ts";
import type { NormalizedDataFile, NormalizedMatch } from "../src/types.ts";

const baseMatch: NormalizedMatch = {
  matchNumber: 1,
  fifaMatchId: "400021443",
  stage: "First Stage",
  group: "Group A",
  utcKickoff: "2026-06-11T19:00:00Z",
  localKickoff: "2026-06-11T13:00:00Z",
  durationMinutes: 120,
  home: {
    name: "Mexico",
    abbreviation: "MEX",
    fifaTeamId: "43911",
    countryCode: "MEX"
  },
  away: {
    name: "South Africa",
    abbreviation: "RSA",
    fifaTeamId: "43883",
    countryCode: "RSA"
  },
  matchStatus: 0,
  resultType: 1,
  venue: {
    name: "Mexico City Stadium",
    city: "Mexico City",
    countryCode: "MEX",
    fifaStadiumId: "400222084",
    fifaCityId: "400222094",
    timeZone: "America/Mexico_City"
  },
  sourceUrl: "https://api.fifa.com/api/v3/calendar/matches?idCompetition=17&idSeason=285023&count=200"
};

function dataFile(match: NormalizedMatch): NormalizedDataFile {
  return {
    generatedAt: "2026-06-12T10:00:00.000Z",
    source: {
      apiUrl: "https://api.fifa.com/api/v3/calendar/matches?idCompetition=17&idSeason=285023&count=200",
      schedulePage: "https://www.fifa.com/en/tournaments/mens/worldcup/canadamexicousa2026/articles/match-schedule-fixtures-results-teams-stadiums",
      schedulePdf: "https://digitalhub.fifa.com/m/1be9ce37eb98fcc5/original/FWC26-Match-Schedule_English.pdf"
    },
    expectedMatchCount: 1,
    matches: [match]
  };
}

function summaryFor(match: NormalizedMatch): string {
  return propertyFor(match, "SUMMARY");
}

function descriptionFor(match: NormalizedMatch): string {
  return propertyFor(match, "DESCRIPTION");
}

function propertyFor(match: NormalizedMatch, name: string): string {
  const propertyLine = unfoldLines(buildIcs(dataFile(match))).find((line) => line.startsWith(`${name}:`));
  assert(propertyLine, `Expected generated ICS to include ${name}.`);
  return propertyLine.slice(`${name}:`.length).replace(/\\,/g, ",").replace(/\\n/g, "\n");
}

function unfoldLines(ics: string): string[] {
  const lines: string[] = [];
  for (const line of ics.split(/\r?\n/)) {
    if (!line) continue;
    if (/^[ \t]/.test(line)) {
      lines[lines.length - 1] += line.slice(1);
    } else {
      lines.push(line);
    }
  }
  return lines;
}

test("formats scored event summaries with goals next to team names", () => {
  const summary = summaryFor({
    ...baseMatch,
    score: {
      home: 2,
      away: 0
    },
    winner: "home"
  });

  assert.equal(summary, "🇲🇽 Mexico (2) - 🇿🇦 South Africa (0)");
});

test("formats unscored event summaries without match number prefixes", () => {
  assert.equal(summaryFor(baseMatch), "🇲🇽 Mexico - 🇿🇦 South Africa");
});

test("does not include Match prefixes in event summaries", () => {
  assert.doesNotMatch(summaryFor(baseMatch), /^Match \d+:/);
});

test("omits image and source URLs from event descriptions", () => {
  const description = descriptionFor({
    ...baseMatch,
    home: {
      ...baseMatch.home,
      logoUrl: "https://api.fifa.com/api/v3/picture/teams-sq-4/43911",
      flagUrl: "https://api.fifa.com/api/v3/picture/flags-sq-4/MEX"
    },
    away: {
      ...baseMatch.away,
      logoUrl: "https://api.fifa.com/api/v3/picture/teams-sq-4/43883",
      flagUrl: "https://api.fifa.com/api/v3/picture/flags-sq-4/RSA"
    }
  });

  assert.doesNotMatch(description, /team logo:/i);
  assert.doesNotMatch(description, /team flag:/i);
  assert.doesNotMatch(description, /Source:/);
  assert.doesNotMatch(description, /Schedule page:/);
  assert.doesNotMatch(description, /https?:\/\//);
});
