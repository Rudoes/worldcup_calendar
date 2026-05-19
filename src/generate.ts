import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import { DATA_PATH, ICS_PATH } from "./constants.ts";
import { fetchFifaMatches, normalizeMatches } from "./fifa.ts";
import { buildIcs } from "./ics.ts";
import type { NormalizedDataFile } from "./types.ts";

async function main(): Promise<void> {
  const generatedAt = new Date().toISOString();
  const rawMatches = await fetchFifaMatches();
  const nextData = normalizeMatches(rawMatches, generatedAt);
  const previousData = await readExistingData();
  const data = previousData && hasSameCalendarPayload(previousData, nextData)
    ? { ...nextData, generatedAt: previousData.generatedAt }
    : nextData;
  const ics = buildIcs(data);

  await mkdir(dirname(DATA_PATH), { recursive: true });
  await mkdir(dirname(ICS_PATH), { recursive: true });
  await writeFile(DATA_PATH, `${JSON.stringify(data, null, 2)}\n`, "utf8");
  await writeFile(ICS_PATH, ics, "utf8");

  console.log(`Generated ${data.matches.length} matches.`);
  console.log(`Data: ${DATA_PATH}`);
  console.log(`Calendar: ${ICS_PATH}`);
}

async function readExistingData(): Promise<NormalizedDataFile | undefined> {
  try {
    return JSON.parse(await readFile(DATA_PATH, "utf8")) as NormalizedDataFile;
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === "ENOENT") {
      return undefined;
    }

    throw error;
  }
}

function hasSameCalendarPayload(previousData: NormalizedDataFile, nextData: NormalizedDataFile): boolean {
  return JSON.stringify(withoutGeneratedAt(previousData)) === JSON.stringify(withoutGeneratedAt(nextData));
}

function withoutGeneratedAt(data: NormalizedDataFile): Omit<NormalizedDataFile, "generatedAt"> {
  return {
    source: data.source,
    expectedMatchCount: data.expectedMatchCount,
    matches: data.matches
  };
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
