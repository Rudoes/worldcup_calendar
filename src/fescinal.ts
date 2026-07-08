import {
  FESCINAL_PROGRAMMING_URLS,
  FESCINAL_SITE_URL,
  FESCINAL_TIME_ZONE
} from "./constants.ts";
import type { FescinalDataFile, FescinalSession } from "./types.ts";

interface ProgrammingPage {
  sourceUrl: string;
  html: string;
}

interface DateParts {
  year: number;
  month: number;
  day: number;
}

interface TimeParts {
  hour: number;
  minute: number;
}

const EARLY_MORNING_ROLLOVER_HOUR = 6;

const SPANISH_MONTHS: Record<string, number> = {
  enero: 1,
  febrero: 2,
  marzo: 3,
  abril: 4,
  mayo: 5,
  junio: 6,
  julio: 7,
  agosto: 8,
  septiembre: 9,
  setiembre: 9,
  octubre: 10,
  noviembre: 11,
  diciembre: 12
};

export async function fetchFescinalProgrammingPages(): Promise<ProgrammingPage[]> {
  return Promise.all(
    FESCINAL_PROGRAMMING_URLS.map(async (sourceUrl) => {
      const response = await fetch(sourceUrl, {
        headers: {
          "User-Agent": "worldcup-calendar/1.0 (+https://github.com/Rudoes/worldcup_calendar)"
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch Fescinal programming page ${sourceUrl}: ${response.status} ${response.statusText}`);
      }

      return {
        sourceUrl,
        html: await response.text()
      };
    })
  );
}

export function buildFescinalDataFile(
  sessions: FescinalSession[],
  generatedAt: string,
  upcomingFrom: string
): FescinalDataFile {
  return {
    generatedAt,
    upcomingFrom,
    timeZone: FESCINAL_TIME_ZONE,
    source: {
      siteUrl: FESCINAL_SITE_URL,
      programmingUrls: [...FESCINAL_PROGRAMMING_URLS]
    },
    sessions
  };
}

export function parseFescinalProgrammingPages(pages: ProgrammingPage[]): FescinalSession[] {
  const sessions = pages.flatMap((page) => parseFescinalProgrammingPage(page.html, page.sourceUrl));
  return sessions.sort(compareSessions);
}

export function parseFescinalProgrammingPage(html: string, sourceUrl: string): FescinalSession[] {
  const headings = [...html.matchAll(/<h5\b[^>]*class="[^"]*title-fescinal[^"]*"[^>]*>\s*Programaci(?:\u00f3|&oacute;)n para el\s+([\s\S]*?)<\/h5>/gi)];
  const sessions: FescinalSession[] = [];

  for (let index = 0; index < headings.length; index += 1) {
    const heading = headings[index]!;
    const sectionStart = (heading.index ?? 0) + heading[0].length;
    const sectionEnd = headings[index + 1]?.index ?? html.length;
    const sectionHtml = html.slice(sectionStart, sectionEnd);
    const headingDate = parseSpanishDate(textFromHtml(heading[1] ?? ""));

    for (const cardHtml of extractSessionCards(sectionHtml)) {
      const session = parseSessionCard(cardHtml, headingDate, sourceUrl);
      if (session) sessions.push(session);
    }
  }

  return sessions.sort(compareSessions);
}

export function filterUpcomingSessions(sessions: FescinalSession[], now: Date): FescinalSession[] {
  const nowMs = now.getTime();
  return sessions.filter((session) => new Date(session.startUtc).getTime() >= nowMs);
}

export function localDateTimeToUtcIso(
  date: DateParts,
  time: TimeParts,
  timeZone = FESCINAL_TIME_ZONE
): string {
  const requestedAsUtc = Date.UTC(date.year, date.month - 1, date.day, time.hour, time.minute, 0);
  const guess = new Date(requestedAsUtc);
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit"
  }).formatToParts(guess);

  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  const localRenderedAsUtc = Date.UTC(
    Number(values.year),
    Number(values.month) - 1,
    Number(values.day),
    Number(values.hour),
    Number(values.minute),
    Number(values.second)
  );
  const offsetMs = localRenderedAsUtc - guess.getTime();

  return new Date(requestedAsUtc - offsetMs).toISOString();
}

function parseSessionCard(cardHtml: string, headingDate: DateParts, sourceUrl: string): FescinalSession | undefined {
  const titleMatch = cardHtml.match(/<h5\b[^>]*class="[^"]*card-title[^"]*"[^>]*>[\s\S]*?<a\b[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>[\s\S]*?<\/h5>/i);
  if (!titleMatch) return undefined;

  const title = textFromHtml(titleMatch[2] ?? "");
  const filmUrl = toAbsoluteUrl(titleMatch[1] ?? "", sourceUrl);
  const dateLabel = extractField(cardHtml, "Fecha");
  const timeLabel = extractField(cardHtml, "Hora");
  const screen = extractField(cardHtml, "Sala");
  if (!title || !filmUrl || !timeLabel || !screen) return undefined;

  const programmingDate = dateLabel ? parseSpanishDate(dateLabel) : headingDate;
  const [startTime, endTime] = parseTimeRange(timeLabel);
  const startDate = startTime.hour < EARLY_MORNING_ROLLOVER_HOUR
    ? addDays(programmingDate, 1)
    : programmingDate;
  let endDate = startDate;
  if (compareTimes(endTime, startTime) <= 0) {
    endDate = addDays(endDate, 1);
  }

  const localStart = formatLocalDateTime(startDate, startTime);
  const localEnd = formatLocalDateTime(endDate, endTime);
  const ticketUrl = extractTicketUrl(cardHtml, sourceUrl);
  const id = [
    formatDate(startDate),
    formatTimeForId(startTime),
    slugify(screen),
    slugFromUrl(filmUrl) || slugify(title)
  ].join("-");

  return {
    id,
    title,
    screen,
    programmingDate: formatDate(programmingDate),
    localStart,
    localEnd,
    startUtc: localDateTimeToUtcIso(startDate, startTime),
    endUtc: localDateTimeToUtcIso(endDate, endTime),
    filmUrl,
    ...(ticketUrl ? { ticketUrl } : {}),
    sourceUrl
  };
}

function extractSessionCards(sectionHtml: string): string[] {
  const starts: number[] = [];
  for (const match of sectionHtml.matchAll(/<div\b[^>]*class="([^"]*)"[^>]*>/gi)) {
    const classes = new Set((match[1] ?? "").split(/\s+/).filter(Boolean));
    if (classes.has("col-sm-3") && classes.has("col-6") && classes.has("px-2")) {
      starts.push(match.index ?? 0);
    }
  }
  const cards: string[] = [];

  for (let index = 0; index < starts.length; index += 1) {
    const start = starts[index]!;
    const end = starts[index + 1] ?? sectionHtml.length;
    const cardHtml = sectionHtml.slice(start, end);
    if (cardHtml.includes("card-title") && cardHtml.includes("<b>Hora:</b>")) {
      cards.push(cardHtml);
    }
  }

  return cards;
}

function extractField(cardHtml: string, label: string): string | undefined {
  const match = cardHtml.match(new RegExp(`<b>\\s*${label}:\\s*<\\/b>\\s*([\\s\\S]*?)(?:<br\\s*\\/?>|<\\/small>)`, "i"));
  return match ? textFromHtml(match[1] ?? "") : undefined;
}

function extractTicketUrl(cardHtml: string, sourceUrl: string): string | undefined {
  const match = cardHtml.match(/<a\b[^>]*href="([^"]*\/add\/\?pid=[^"]+)"[^>]*>/i);
  return match ? toAbsoluteUrl(match[1] ?? "", sourceUrl) : undefined;
}

function parseTimeRange(value: string): [TimeParts, TimeParts] {
  const match = normalizeWhitespace(value).match(/^(\d{1,2}):(\d{2})\s*-\s*(\d{1,2}):(\d{2})$/);
  if (!match) {
    throw new Error(`Invalid Fescinal time range: ${value}`);
  }

  return [
    parseTime(Number(match[1]), Number(match[2])),
    parseTime(Number(match[3]), Number(match[4]))
  ];
}

function parseTime(hour: number, minute: number): TimeParts {
  if (!Number.isInteger(hour) || hour < 0 || hour > 23 || !Number.isInteger(minute) || minute < 0 || minute > 59) {
    throw new Error(`Invalid Fescinal time: ${hour}:${minute}`);
  }

  return { hour, minute };
}

function parseSpanishDate(value: string): DateParts {
  const normalized = normalizeWhitespace(value).toLowerCase();
  const dateText = normalized.includes(",")
    ? normalized.slice(normalized.lastIndexOf(",") + 1).trim()
    : normalized;
  const match = dateText.match(/^(\d{1,2})\s+(?:de\s+)?([a-z]+)\s+(?:de\s+)?(\d{4})$/);
  if (!match) {
    throw new Error(`Invalid Fescinal date: ${value}`);
  }

  const month = SPANISH_MONTHS[match[2]!];
  if (!month) {
    throw new Error(`Unknown Fescinal month: ${match[2]}`);
  }

  return {
    day: Number(match[1]),
    month,
    year: Number(match[3])
  };
}

function addDays(date: DateParts, days: number): DateParts {
  const next = new Date(Date.UTC(date.year, date.month - 1, date.day + days));
  return {
    year: next.getUTCFullYear(),
    month: next.getUTCMonth() + 1,
    day: next.getUTCDate()
  };
}

function compareTimes(a: TimeParts, b: TimeParts): number {
  return (a.hour * 60 + a.minute) - (b.hour * 60 + b.minute);
}

function compareSessions(a: FescinalSession, b: FescinalSession): number {
  return a.startUtc.localeCompare(b.startUtc) || a.screen.localeCompare(b.screen) || a.title.localeCompare(b.title);
}

function formatLocalDateTime(date: DateParts, time: TimeParts): string {
  return `${formatDate(date)}T${pad(time.hour)}:${pad(time.minute)}:00`;
}

function formatDate(date: DateParts): string {
  return `${date.year}-${pad(date.month)}-${pad(date.day)}`;
}

function formatTimeForId(time: TimeParts): string {
  return `${pad(time.hour)}${pad(time.minute)}`;
}

function pad(value: number): string {
  return String(value).padStart(2, "0");
}

function toAbsoluteUrl(href: string, baseUrl: string): string {
  return new URL(href, baseUrl).href;
}

function slugFromUrl(url: string): string | undefined {
  return new URL(url).pathname.split("/").filter(Boolean).at(-1);
}

function slugify(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80) || "session";
}

function textFromHtml(html: string): string {
  return normalizeWhitespace(decodeHtmlEntities(
    html
      .replace(/<br\s*\/?>/gi, " ")
      .replace(/<[^>]+>/g, " ")
  ));
}

function normalizeWhitespace(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

function decodeHtmlEntities(value: string): string {
  const named: Record<string, string> = {
    amp: "&",
    apos: "'",
    gt: ">",
    lt: "<",
    nbsp: " ",
    quot: "\"",
    aacute: "\u00e1",
    eacute: "\u00e9",
    iacute: "\u00ed",
    oacute: "\u00f3",
    uacute: "\u00fa",
    ntilde: "\u00f1",
    Aacute: "\u00c1",
    Eacute: "\u00c9",
    Iacute: "\u00cd",
    Oacute: "\u00d3",
    Uacute: "\u00da",
    Ntilde: "\u00d1"
  };

  return value.replace(/&(#x[0-9a-f]+|#\d+|[a-z][a-z0-9]+);/gi, (entity, body: string) => {
    if (body.startsWith("#x")) return String.fromCodePoint(Number.parseInt(body.slice(2), 16));
    if (body.startsWith("#")) return String.fromCodePoint(Number.parseInt(body.slice(1), 10));
    return named[body] ?? entity;
  });
}
