import {
  FESCINAL_CALENDAR_DESCRIPTION,
  FESCINAL_CALENDAR_NAME,
  FESCINAL_LOCATION,
  FESCINAL_TIME_ZONE,
  UID_DOMAIN
} from "./constants.ts";
import { foldLine, property, toIcsUtc } from "./ics-utils.ts";
import type { FescinalDataFile, FescinalSession } from "./types.ts";

export function buildFescinalIcs(data: FescinalDataFile): string {
  const generatedAt = toIcsUtc(new Date(data.generatedAt));
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//worldcup-calendar//Fescinal 2026//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    property("X-WR-CALNAME", FESCINAL_CALENDAR_NAME),
    property("X-WR-CALDESC", FESCINAL_CALENDAR_DESCRIPTION),
    "X-WR-TIMEZONE:UTC",
    "REFRESH-INTERVAL;VALUE=DURATION:PT12H",
    "X-PUBLISHED-TTL:PT12H",
    ...data.sessions.flatMap((session) => buildEvent(session, generatedAt)),
    "END:VCALENDAR"
  ];

  return lines.map(foldLine).join("\r\n") + "\r\n";
}

function buildEvent(session: FescinalSession, generatedAt: string): string[] {
  const start = new Date(session.startUtc);
  const end = new Date(session.endUtc);
  if (Number.isNaN(start.valueOf())) {
    throw new Error(`Invalid Fescinal start date for ${session.id}: ${session.startUtc}`);
  }
  if (Number.isNaN(end.valueOf()) || end <= start) {
    throw new Error(`Invalid Fescinal end date for ${session.id}: ${session.endUtc}`);
  }

  return [
    "BEGIN:VEVENT",
    property("UID", `fescinal-2026-${session.id}@${UID_DOMAIN}`),
    property("DTSTAMP", generatedAt),
    property("DTSTART", toIcsUtc(start)),
    property("DTEND", toIcsUtc(end)),
    "STATUS:CONFIRMED",
    "TRANSP:OPAQUE",
    property("SUMMARY", session.title),
    property("LOCATION", `${FESCINAL_LOCATION}, ${session.screen}`),
    property("DESCRIPTION", eventDescription(session)),
    property("CATEGORIES", "Fescinal 2026,Cinema", false),
    property("URL", session.ticketUrl ?? session.filmUrl, false),
    property("X-FESCINAL-ID", session.id),
    property("X-FESCINAL-SCREEN", session.screen),
    property("X-FESCINAL-FILM-URL", session.filmUrl, false),
    ...(session.ticketUrl ? [property("X-FESCINAL-TICKET-URL", session.ticketUrl, false)] : []),
    property("X-FESCINAL-SOURCE", session.sourceUrl, false),
    "END:VEVENT"
  ];
}

function eventDescription(session: FescinalSession): string {
  return [
    "Fescinal 2026",
    `Screen: ${session.screen}`,
    `Local time: ${formatLocalRange(session)} (${FESCINAL_TIME_ZONE})`
  ].join("\n");
}

function formatLocalRange(session: FescinalSession): string {
  return `${formatLocalDisplay(session.localStart)} - ${formatLocalDisplay(session.localEnd)}`;
}

function formatLocalDisplay(iso: string): string {
  return iso.slice(0, 16).replace("T", " ");
}
