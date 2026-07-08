import { readFile } from "node:fs/promises";
import {
  FESCINAL_DATA_PATH,
  FESCINAL_ICS_PATH,
  FESCINAL_PROGRAMMING_URLS,
  FESCINAL_SITE_URL,
  FESCINAL_TIME_ZONE
} from "./constants.ts";
import type { FescinalDataFile } from "./types.ts";

interface ParsedEvent {
  properties: Map<string, string[]>;
}

const REQUIRED_PROPERTIES = [
  "UID",
  "DTSTAMP",
  "DTSTART",
  "DTEND",
  "SUMMARY",
  "LOCATION",
  "DESCRIPTION",
  "URL",
  "X-FESCINAL-ID",
  "X-FESCINAL-SCREEN",
  "X-FESCINAL-FILM-URL",
  "X-FESCINAL-SOURCE"
];

async function main(): Promise<void> {
  const data = JSON.parse(await readFile(FESCINAL_DATA_PATH, "utf8")) as FescinalDataFile;
  const ics = await readFile(FESCINAL_ICS_PATH, "utf8");
  const events = parseEvents(ics);

  assert(data.timeZone === FESCINAL_TIME_ZONE, `Unexpected Fescinal timezone: ${data.timeZone}`);
  assert(data.source.siteUrl === FESCINAL_SITE_URL, "Unexpected Fescinal source site URL.");
  assert(JSON.stringify(data.source.programmingUrls) === JSON.stringify([...FESCINAL_PROGRAMMING_URLS]), "Unexpected Fescinal programming URLs.");
  assert(events.length === data.sessions.length, `ICS has ${events.length} events but data has ${data.sessions.length} sessions.`);
  assert(/^BEGIN:VCALENDAR\r?\n/.test(ics), "ICS does not start with VCALENDAR.");
  assert(/\r?\nEND:VCALENDAR\r?\n?$/.test(ics), "ICS does not end with VCALENDAR.");
  assert(!/ATTACH|IMAGE|media\/portadas|poster/i.test(ics), "Fescinal ICS includes poster/image metadata.");

  const ids = new Set<string>();
  const uids = new Set<string>();
  const sessionById = new Map(data.sessions.map((session) => [session.id, session]));

  for (const session of data.sessions) {
    assert(session.id.length > 0, "Fescinal session has an empty id.");
    assert(!ids.has(session.id), `Duplicate Fescinal session id: ${session.id}`);
    ids.add(session.id);
    assert(session.title.length > 0, `Fescinal session ${session.id} has an empty title.`);
    assert(session.screen.length > 0, `Fescinal session ${session.id} has an empty screen.`);
    assert(/^https:\/\/www\.fescinal\.es\//.test(session.filmUrl), `Invalid film URL for Fescinal session ${session.id}.`);
    assert(!session.ticketUrl || /^https:\/\/www\.fescinal\.es\//.test(session.ticketUrl), `Invalid ticket URL for Fescinal session ${session.id}.`);
    assert(data.source.programmingUrls.includes(session.sourceUrl), `Unexpected source URL for Fescinal session ${session.id}.`);
    assert(Date.parse(session.startUtc) < Date.parse(session.endUtc), `Fescinal session ${session.id} does not end after it starts.`);
    assert(Date.parse(session.startUtc) >= Date.parse(data.upcomingFrom), `Past Fescinal session included: ${session.id}`);
  }

  for (const event of events) {
    for (const required of REQUIRED_PROPERTIES) {
      assert(event.properties.has(required), `VEVENT missing ${required}.`);
    }

    const uid = single(event, "UID");
    assert(!uids.has(uid), `Duplicate UID: ${uid}`);
    uids.add(uid);

    const id = single(event, "X-FESCINAL-ID");
    const session = sessionById.get(id);
    assert(Boolean(session), `VEVENT references unknown Fescinal session id: ${id}`);
    assert(uid === `fescinal-2026-${id}@worldcup-calendar.local`, `Unexpected UID for Fescinal session ${id}.`);
    assert(/^\d{8}T\d{6}Z$/.test(single(event, "DTSTART")), `Invalid DTSTART for Fescinal session ${id}.`);
    assert(/^\d{8}T\d{6}Z$/.test(single(event, "DTEND")), `Invalid DTEND for Fescinal session ${id}.`);
    assert(single(event, "SUMMARY").length > 0, `Empty SUMMARY for Fescinal session ${id}.`);
    assert(single(event, "X-FESCINAL-SCREEN") === session!.screen.replace(/,/g, "\\,"), `Screen mismatch for Fescinal session ${id}.`);
    assert(single(event, "DESCRIPTION").length > 0, `Empty DESCRIPTION for Fescinal session ${id}.`);
    assert(!/https?:\/\//i.test(single(event, "DESCRIPTION")), `DESCRIPTION has URL text for Fescinal session ${id}.`);
  }

  console.log(`Validated ${events.length} Fescinal calendar events.`);
}

function parseEvents(ics: string): ParsedEvent[] {
  const unfolded = unfoldLines(ics);
  const events: ParsedEvent[] = [];
  let current: ParsedEvent | null = null;

  for (const line of unfolded) {
    if (line === "BEGIN:VEVENT") {
      current = { properties: new Map() };
      continue;
    }

    if (line === "END:VEVENT") {
      assert(current !== null, "END:VEVENT without BEGIN:VEVENT.");
      events.push(current);
      current = null;
      continue;
    }

    if (!current) continue;

    const separator = line.indexOf(":");
    assert(separator !== -1, `Malformed ICS property: ${line}`);
    const rawName = line.slice(0, separator);
    const name = rawName.split(";")[0] ?? rawName;
    const value = line.slice(separator + 1);
    const values = current.properties.get(name) ?? [];
    values.push(value);
    current.properties.set(name, values);
  }

  assert(current === null, "Unclosed VEVENT block.");
  return events;
}

function unfoldLines(ics: string): string[] {
  const rawLines = ics.split(/\r?\n/);
  const lines: string[] = [];

  for (const line of rawLines) {
    if (!line) continue;
    if (/^[ \t]/.test(line)) {
      assert(lines.length > 0, "ICS continuation line without previous line.");
      lines[lines.length - 1] += line.slice(1);
    } else {
      lines.push(line);
    }
  }

  return lines;
}

function single(event: ParsedEvent, property: string): string {
  const values = event.properties.get(property);
  assert(Boolean(values?.length), `Missing ${property}.`);
  return values![0]!;
}

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
