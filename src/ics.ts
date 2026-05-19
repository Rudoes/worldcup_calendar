import {
  CALENDAR_DESCRIPTION,
  CALENDAR_NAME,
  FIFA_SCHEDULE_PAGE,
  UID_DOMAIN
} from "./constants.ts";
import type { NormalizedDataFile, NormalizedMatch, Participant } from "./types.ts";

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
  const summary = `Match ${match.matchNumber}: ${match.home.name} vs ${match.away.name}`;
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
    `Kickoff (UTC): ${formatUtcDisplay(match.utcKickoff)}`,
    `Kickoff (venue local): ${formatLocalDisplay(match.localKickoff)} (${match.venue.timeZone})`,
    `Venue: ${match.venue.name}, ${match.venue.city}${match.venue.countryCode ? `, ${match.venue.countryCode}` : ""}`,
    ...teamImageLines("Home", match.home),
    ...teamImageLines("Away", match.away),
    `Source: ${match.sourceUrl}`,
    `Schedule page: ${FIFA_SCHEDULE_PAGE}`
  ].filter((line): line is string => Boolean(line));

  return lines.join("\n");
}

function formatParticipant(participant: Participant): string {
  if (participant.abbreviation) return `${participant.name} (${participant.abbreviation})`;
  if (participant.placeholder) return `${participant.name} [${participant.placeholder}]`;
  return participant.name;
}

function teamImageLines(label: string, participant: Participant): string[] {
  const lines = [];
  if (participant.logoUrl) lines.push(`${label} team logo: ${participant.logoUrl}`);
  if (participant.flagUrl && participant.flagUrl !== participant.logoUrl) {
    lines.push(`${label} team flag: ${participant.flagUrl}`);
  }
  return lines;
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
