import { readFile } from "node:fs/promises";
import { DATA_PATH, EXPECTED_MATCH_COUNT, ICS_PATH } from "./constants.ts";
import type { NormalizedDataFile } from "./types.ts";

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
  "X-FIFA-MATCH-NUMBER",
  "X-FIFA-MATCH-ID",
  "X-FIFA-SOURCE"
];

async function main(): Promise<void> {
  const data = JSON.parse(await readFile(DATA_PATH, "utf8")) as NormalizedDataFile;
  const ics = await readFile(ICS_PATH, "utf8");
  const events = parseEvents(ics);

  assert(data.expectedMatchCount === EXPECTED_MATCH_COUNT, "Data file expected match count is wrong.");
  assert(data.matches.length === EXPECTED_MATCH_COUNT, `Data file has ${data.matches.length} matches.`);
  for (const match of data.matches) {
    assert(match.venue.timeZone !== "UTC", `Missing venue timezone mapping for ${match.venue.city}.`);
  }
  assert(events.length === EXPECTED_MATCH_COUNT, `ICS has ${events.length} VEVENT blocks.`);
  assert(/^BEGIN:VCALENDAR\r?\n/.test(ics), "ICS does not start with VCALENDAR.");
  assert(/\r?\nEND:VCALENDAR\r?\n?$/.test(ics), "ICS does not end with VCALENDAR.");

  const uids = new Set<string>();
  const matchNumbers = new Set<number>();

  for (const event of events) {
    for (const required of REQUIRED_PROPERTIES) {
      assert(event.properties.has(required), `VEVENT missing ${required}.`);
    }

    const uid = single(event, "UID");
    assert(!uids.has(uid), `Duplicate UID: ${uid}`);
    uids.add(uid);

    const matchNumber = Number(single(event, "X-FIFA-MATCH-NUMBER"));
    assert(Number.isInteger(matchNumber), `Invalid match number: ${single(event, "X-FIFA-MATCH-NUMBER")}`);
    matchNumbers.add(matchNumber);

    assert(/^\d{8}T\d{6}Z$/.test(single(event, "DTSTART")), `Invalid DTSTART for match ${matchNumber}.`);
    assert(/^\d{8}T\d{6}Z$/.test(single(event, "DTEND")), `Invalid DTEND for match ${matchNumber}.`);
    assert(single(event, "SUMMARY").length > 0, `Empty SUMMARY for match ${matchNumber}.`);
    assert(single(event, "LOCATION").length > 0, `Empty LOCATION for match ${matchNumber}.`);
    assert(single(event, "DESCRIPTION").includes("Source:"), `DESCRIPTION lacks source for match ${matchNumber}.`);

    const dataMatch = data.matches.find((match) => match.matchNumber === matchNumber);
    assert(Boolean(dataMatch), `Match ${matchNumber} is not present in the normalized data.`);
    if (dataMatch?.home.logoUrl && dataMatch.away.logoUrl) {
      const attachmentCount = event.properties.get("ATTACH")?.length ?? 0;
      assert(attachmentCount >= 2, `Match ${matchNumber} is missing team logo ATTACH properties.`);
    }
  }

  for (let matchNumber = 1; matchNumber <= EXPECTED_MATCH_COUNT; matchNumber += 1) {
    assert(matchNumbers.has(matchNumber), `Missing match number ${matchNumber}.`);
  }

  console.log(`Validated ${events.length} calendar events.`);
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
