export function property(name: string, value: string, escape = true): string {
  return `${name}:${escape ? escapeText(value) : value}`;
}

export function escapeText(value: string): string {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/\n/g, "\\n")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,");
}

export function foldLine(line: string): string {
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

export function toIcsUtc(date: Date): string {
  return date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
}
