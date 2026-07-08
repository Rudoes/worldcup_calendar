import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import { FESCINAL_DATA_PATH, FESCINAL_ICS_PATH } from "./constants.ts";
import {
  buildFescinalDataFile,
  fetchFescinalProgrammingPages,
  filterUpcomingSessions,
  parseFescinalProgrammingPages
} from "./fescinal.ts";
import { buildFescinalIcs } from "./ics-fescinal.ts";
import type { FescinalDataFile } from "./types.ts";

async function main(): Promise<void> {
  const now = new Date();
  const generatedAt = now.toISOString();
  const pages = await fetchFescinalProgrammingPages();
  const allSessions = parseFescinalProgrammingPages(pages);
  const upcomingSessions = filterUpcomingSessions(allSessions, now);
  const nextData = buildFescinalDataFile(upcomingSessions, generatedAt, generatedAt);
  const previousData = await readExistingData();
  const data = previousData && hasSameCalendarPayload(previousData, nextData)
    ? { ...nextData, generatedAt: previousData.generatedAt, upcomingFrom: previousData.upcomingFrom }
    : nextData;
  const ics = buildFescinalIcs(data);

  await mkdir(dirname(FESCINAL_DATA_PATH), { recursive: true });
  await mkdir(dirname(FESCINAL_ICS_PATH), { recursive: true });
  await writeFile(FESCINAL_DATA_PATH, `${JSON.stringify(data, null, 2)}\n`, "utf8");
  await writeFile(FESCINAL_ICS_PATH, ics, "utf8");

  console.log(`Generated ${data.sessions.length} upcoming Fescinal sessions.`);
  console.log(`Data: ${FESCINAL_DATA_PATH}`);
  console.log(`Calendar: ${FESCINAL_ICS_PATH}`);
}

async function readExistingData(): Promise<FescinalDataFile | undefined> {
  try {
    return JSON.parse(await readFile(FESCINAL_DATA_PATH, "utf8")) as FescinalDataFile;
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === "ENOENT") {
      return undefined;
    }

    throw error;
  }
}

function hasSameCalendarPayload(previousData: FescinalDataFile, nextData: FescinalDataFile): boolean {
  return JSON.stringify(withoutGeneratedAt(previousData)) === JSON.stringify(withoutGeneratedAt(nextData));
}

function withoutGeneratedAt(data: FescinalDataFile): Omit<FescinalDataFile, "generatedAt" | "upcomingFrom"> {
  return {
    timeZone: data.timeZone,
    source: data.source,
    sessions: data.sessions
  };
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
