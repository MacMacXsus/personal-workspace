const BOOKMARK_COLOR_PALETTE = [
  "#8b7cf8",
  "#5ecfb0",
  "#f5a623",
  "#7ec8e3",
  "#e05252",
  "#6b6b80",
];

export const DEFAULT_BOOKMARK_FOLDER = "General";

function hashString(value: string): number {
  let hash = 0;

  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) >>> 0;
  }

  return hash;
}

export function normalizeBookmarkFolderName(value: string | undefined): string {
  const folderName = value?.trim();

  return folderName ? folderName : DEFAULT_BOOKMARK_FOLDER;
}

export function normalizeBookmarkTitle(value: string): string {
  return value.trim();
}

export function normalizeBookmarkUrl(
  rawValue: string,
): { url: string; hostname: string } {
  const trimmed = rawValue.trim();

  if (!trimmed) {
    throw new Error("Please enter a bookmark URL.");
  }

  const candidate = /^(https?:)?\/\//i.test(trimmed)
    ? trimmed
    : `https://${trimmed}`;

  let parsed: URL;

  try {
    parsed = new URL(candidate);
  } catch {
    throw new Error("Please enter a valid bookmark URL.");
  }

  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new Error("Bookmark URLs must use http or https.");
  }

  parsed.hash = "";

  return {
    url: parsed.toString(),
    hostname: parsed.hostname.toLowerCase(),
  };
}

export function normalizeBookmarkTagNames(tags: string[]): string[] {
  const normalized = tags
    .map((tag) => tag.trim())
    .filter(Boolean)
    .map((tag) => tag.replace(/\s+/g, " "))
    .filter(Boolean);

  return Array.from(new Set(normalized));
}

export function slugifyBookmarkValue(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
}

export function deriveBookmarkAccentColor(seed: string): string {
  const index = hashString(seed) % BOOKMARK_COLOR_PALETTE.length;

  return BOOKMARK_COLOR_PALETTE[index] ?? BOOKMARK_COLOR_PALETTE[0];
}

export function deriveBookmarkFaviconLabel(
  title: string,
  hostname: string,
): string {
  const source = title.trim() || hostname.trim() || "B";
  const firstCharacter = source.match(/[a-z0-9]/i)?.[0] ?? "B";

  return firstCharacter.toUpperCase();
}
