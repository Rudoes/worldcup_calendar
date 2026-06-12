import {
  CALENDAR_DESCRIPTION,
  CALENDAR_NAME,
  FIFA_SCHEDULE_PAGE,
  UID_DOMAIN
} from "./constants.ts";
import type { NormalizedDataFile, NormalizedMatch, Participant } from "./types.ts";

const FIFA_FLAG_CODES: Record<string, string> = {
  ALG: "DZ",
  ARG: "AR",
  AUS: "AU",
  AUT: "AT",
  BEL: "BE",
  BIH: "BA",
  BRA: "BR",
  CAN: "CA",
  CIV: "CI",
  COD: "CD",
  COL: "CO",
  CPV: "CV",
  CRO: "HR",
  CUW: "CW",
  CZE: "CZ",
  ECU: "EC",
  EGY: "EG",
  ENG: "GB-ENG",
  ESP: "ES",
  FRA: "FR",
  GER: "DE",
  GHA: "GH",
  HAI: "HT",
  IRN: "IR",
  IRQ: "IQ",
  JOR: "JO",
  JPN: "JP",
  KOR: "KR",
  KSA: "SA",
  MAR: "MA",
  MEX: "MX",
  NED: "NL",
  NOR: "NO",
  NZL: "NZ",
  PAN: "PA",
  PAR: "PY",
  POR: "PT",
  QAT: "QA",
  RSA: "ZA",
  SCO: "GB-SCT",
  SEN: "SN",
  SUI: "CH",
  SWE: "SE",
  TUN: "TN",
  TUR: "TR",
  URU: "UY",
  USA: "US",
  UZB: "UZ"
};

export function buildIcs(data: NormalizedDataFile): string {
  const generatedAt = toIcsUtc(new Date(data.generatedAt));
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//worldcup-calendar//FIFA World Cup 2026//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    property("X-WR-CALNAME", CALENDAR_NAME),
    property("X-WR-CALDESC", CALENDAR_DESCRIPTION),
    "X-WR-TIMEZONE:UTC",
    "REFRESH-INTERVAL;VALUE=DURATION:PT12H",
    "X-PUBLISHED-TTL:PT12H",
    ...data.matches.flatMap((match) => buildEvent(match, generatedAt)),
    "END:VCALENDAR"
  ];

  return lines.map(foldLine).join("\r\n") + "\r\n";
}

function buildEvent(match: NormalizedMatch, generatedAt: string): string[] {
  const start = new Date(match.utcKickoff);
  if (Number.isNaN(start.valueOf())) {
    throw new Error(`Invalid kickoff date for match ${match.matchNumber}: ${match.utcKickoff}`);
  }

  const end = new Date(start.getTime() + match.durationMinutes * 60_000);
  const summary = eventSummary(match);
  const location = [
    match.venue.name,
    match.venue.city,
    match.venue.countryCode
  ].filter(Boolean).join(", ");
  const categories = ["FIFA World Cup 2026", match.stage, match.group].filter(Boolean).join(",");
  const logoUrls = [match.home.logoUrl, match.away.logoUrl].filter((url): url is string => Boolean(url));

  return [
    "BEGIN:VEVENT",
    property("UID", `fifa-world-cup-2026-match-${String(match.matchNumber).padStart(3, "0")}-${match.fifaMatchId}@${UID_DOMAIN}`),
    property("DTSTAMP", generatedAt),
    property("DTSTART", toIcsUtc(start)),
    property("DTEND", toIcsUtc(end)),
    "STATUS:CONFIRMED",
    "TRANSP:OPAQUE",
    property("SUMMARY", summary),
    property("LOCATION", location),
    property("DESCRIPTION", eventDescription(match)),
    property("CATEGORIES", categories, false),
    property("URL", FIFA_SCHEDULE_PAGE),
    property("X-FIFA-MATCH-NUMBER", String(match.matchNumber)),
    property("X-FIFA-MATCH-ID", match.fifaMatchId),
    property("X-FIFA-STAGE", match.stage),
    property("X-FIFA-SOURCE", match.sourceUrl),
    ...logoUrls.map((url) => property("ATTACH;FMTTYPE=image/png", url, false)),
    ...(logoUrls[0] ? [property("IMAGE;VALUE=URI", logoUrls[0], false)] : []),
    "END:VEVENT"
  ];
}

function eventDescription(match: NormalizedMatch): string {
  const lines = [
    `FIFA World Cup 2026 Match ${match.matchNumber}`,
    `Stage: ${match.stage}`,
    match.group ? `Group: ${match.group}` : undefined,
    `Teams: ${formatParticipant(match.home)} vs ${formatParticipant(match.away)}`,
    match.score ? `Score: ${formatScore(match)}` : undefined,
    match.winner ? `Winner: ${match.winner === "home" ? match.home.name : match.away.name}` : undefined,
    `Kickoff (UTC): ${formatUtcDisplay(match.utcKickoff)}`,
    `Kickoff (venue local): ${formatLocalDisplay(match.localKickoff)} (${match.venue.timeZone})`,
    `Venue: ${match.venue.name}, ${match.venue.city}${match.venue.countryCode ? `, ${match.venue.countryCode}` : ""}`
  ].filter((line): line is string => Boolean(line));

  return lines.join("\n");
}

function eventSummary(match: NormalizedMatch): string {
  const homeName = formatSummaryParticipant(match.home);
  const awayName = formatSummaryParticipant(match.away);

  if (!match.score) {
    return `${homeName} - ${awayName}`;
  }

  const penaltySuffix = match.score.homePenalties !== undefined && match.score.awayPenalties !== undefined
    ? ` (pens ${match.score.homePenalties}-${match.score.awayPenalties})`
    : "";

  return `${homeName} (${match.score.home}) - ${awayName} (${match.score.away})${penaltySuffix}`;
}

function formatScore(match: NormalizedMatch): string {
  if (!match.score) return "";

  const score = `${match.home.name} ${match.score.home}-${match.score.away} ${match.away.name}`;
  if (match.score.homePenalties === undefined || match.score.awayPenalties === undefined) {
    return score;
  }

  return `${score} (penalties ${match.score.homePenalties}-${match.score.awayPenalties})`;
}

function formatParticipant(participant: Participant): string {
  if (participant.abbreviation) return `${participant.name} (${participant.abbreviation})`;
  if (participant.placeholder) return `${participant.name} [${participant.placeholder}]`;
  return participant.name;
}

function formatSummaryParticipant(participant: Participant): string {
  const flag = flagEmoji(participant);
  return flag ? `${flag} ${participant.name}` : participant.name;
}

function flagEmoji(participant: Participant): string | undefined {
  const fifaCode = participant.countryCode ?? participant.abbreviation;
  if (!fifaCode) return undefined;

  const flagCode = FIFA_FLAG_CODES[fifaCode] ?? fifaCode;
  if (/^[A-Z]{2}$/.test(flagCode)) {
    return [...flagCode]
      .map((letter) => String.fromCodePoint(0x1F1E6 + letter.charCodeAt(0) - 65))
      .join("");
  }

  if (flagCode === "GB-ENG") return subdivisionFlagEmoji("gbeng");
  if (flagCode === "GB-SCT") return subdivisionFlagEmoji("gbsct");

  return undefined;
}

function subdivisionFlagEmoji(tag: string): string {
  return [
    String.fromCodePoint(0x1F3F4),
    ...[...tag].map((letter) => String.fromCodePoint(0xE0000 + letter.charCodeAt(0))),
    String.fromCodePoint(0xE007F)
  ].join("");
}

function property(name: string, value: string, escape = true): string {
  return `${name}:${escape ? escapeText(value) : value}`;
}

function escapeText(value: string): string {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/\n/g, "\\n")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,");
}

function foldLine(line: string): string {
  const folded = [];
  let current = "";
  let currentBytes = 0;

  for (const character of line) {
    const bytes = Buffer.byteLength(character, "utf8");
    const limit = current.startsWith(" ") ? 75 : 75;
    if (currentBytes + bytes > limit) {
      folded.push(current);
      current = ` ${character}`;
      currentBytes = 1 + bytes;
    } else {
      current += character;
      currentBytes += bytes;
    }
  }

  if (current) folded.push(current);
  return folded.join("\r\n");
}

function toIcsUtc(date: Date): string {
  return date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
}

function formatUtcDisplay(iso: string): string {
  return iso.replace("T", " ").replace("Z", " UTC");
}

function formatLocalDisplay(iso: string): string {
  return iso.slice(0, 16).replace("T", " ");
}
