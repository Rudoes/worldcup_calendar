import { mkdir, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import { DATA_PATH, ICS_PATH } from "./constants.ts";
import { fetchFifaMatches, normalizeMatches } from "./fifa.ts";
import { buildIcs } from "./ics.ts";

async function main(): Promise<void> {
  const generatedAt = new Date().toISOString();
  const rawMatches = await fetchFifaMatches();
  const data = normalizeMatches(rawMatches, generatedAt);
  const ics = buildIcs(data);

  await mkdir(dirname(DATA_PATH), { recursive: true });
  await mkdir(dirname(ICS_PATH), { recursive: true });
  await writeFile(DATA_PATH, `${JSON.stringify(data, null, 2)}\n`, "utf8");
  await writeFile(ICS_PATH, ics, "utf8");

  console.log(`Generated ${data.matches.length} matches.`);
  console.log(`Data: ${DATA_PATH}`);
  console.log(`Calendar: ${ICS_PATH}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
