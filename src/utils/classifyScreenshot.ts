import type { ScreenshotCategory } from "../types/screenshot";

export interface ScreenshotClassificationMetadata {
  createdAt?: number | string | Date;
  albumName?: string;
  sourceApp?: string;
  mimeType?: string;
  width?: number;
  height?: number;
}

const CATEGORY_ORDER: ScreenshotCategory[] = [
  "otp",
  "receipt",
  "bank",
  "meme",
  "conversation",
  "medical",
  "unknown",
];

const KEYWORD_RULES: Array<{
  category: Exclude<ScreenshotCategory, "unknown">;
  pattern: RegExp;
  score: number;
}> = [
  {
    category: "otp",
    pattern:
      /\botp\b|one[\s_-]?time\s(?:password|code)|verification\s?code|2fa|auth(?:entication)?\s?code|login\s?code|security\s?code|passcode\b|\bpin\b/i,
    score: 3,
  },
  {
    category: "receipt",
    pattern:
      /receipt|invoice|tax\s?invoice|bill\b|cash\s?memo|order\s?(?:id|#)?|purchase|subtotal|gst|vat|payment\s?(?:success|received|complete)?|booking\s?confirmed/i,
    score: 3,
  },
  {
    category: "bank",
    pattern:
      /\bbank\b|account\s?statement|transaction|credit\s?card|debit\s?card|ifsc|swift|upi|neft|imps|rtgs|balance\s?(?:updated|alert)?|gpay|google\s?pay|phonepe|paytm/i,
    score: 3,
  },
  {
    category: "meme",
    pattern:
      /\bmeme\b|funny|joke|lol|lmao|rofl|shitpost|reaction\s?(?:pic|image|meme)?|template|9gag|dank|reddit/i,
    score: 3,
  },
  {
    category: "conversation",
    pattern:
      /whatsapp|telegram|signal|messenger|imessage|chat\b|conversation|discord|slack|teams\b|wechat|sms/i,
    score: 3,
  },
  {
    category: "medical",
    pattern:
      /prescription|\brx\b|doctor|hospital|clinic|pharmacy|lab\s?report|test\s?result|blood\s?test|cbc|x[\s-]?ray|mri|ct\s?scan|ultrasound|medicine|health\s?record/i,
    score: 3,
  },
];

const WHATSAPP_STYLE_FILENAME =
  /whatsapp\simage|img[-_]?\d{8}[-_]?wa\d+|wa\d{3,}/i;
const SCREENSHOT_STYLE_FILENAME =
  /screenshot|screen[_\s-]?shot|captura\sde\spantalla|スクリーンショット|截屏|屏幕截图/i;

function normalizeForMatching(value: string): string {
  return value
    .toLowerCase()
    .replace(/\.[a-z0-9]{2,5}$/i, "")
    .replace(/[._-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function toTimestampMs(createdAt?: number | string | Date): number | null {
  if (createdAt == null) return null;
  if (createdAt instanceof Date) return createdAt.getTime();

  const numericValue =
    typeof createdAt === "number" ? createdAt : Number.parseInt(createdAt, 10);
  if (Number.isNaN(numericValue)) return null;

  // Heuristic: timestamps under 1e12 are usually seconds, not milliseconds.
  return numericValue < 1_000_000_000_000 ? numericValue * 1000 : numericValue;
}

function addScore(
  scores: Record<ScreenshotCategory, number>,
  category: Exclude<ScreenshotCategory, "unknown">,
  value: number,
) {
  scores[category] += value;
}

export function classifyScreenshot(
  filename: string,
  metadata: ScreenshotClassificationMetadata = {},
): ScreenshotCategory {
  const normalizedFilename = filename.trim().toLowerCase();
  const normalizedFilenameForRules = normalizeForMatching(filename);
  const context = [
    normalizedFilename,
    normalizedFilenameForRules,
    normalizeForMatching(metadata.albumName ?? ""),
    normalizeForMatching(metadata.sourceApp ?? ""),
  ]
    .join(" ")
    .trim();

  const scores: Record<ScreenshotCategory, number> = {
    otp: 0,
    receipt: 0,
    bank: 0,
    meme: 0,
    conversation: 0,
    medical: 0,
    unknown: 0,
  };

  for (const rule of KEYWORD_RULES) {
    if (rule.pattern.test(context)) {
      addScore(scores, rule.category, rule.score);
    }
  }

  const createdAtMs = toTimestampMs(metadata.createdAt);
  if (createdAtMs != null) {
    const createdAtDate = new Date(createdAtMs);
    const hour = createdAtDate.getHours();
    const dayOfMonth = createdAtDate.getDate();
    const dayOfWeek = createdAtDate.getDay();

    if (SCREENSHOT_STYLE_FILENAME.test(normalizedFilename) && hour <= 6) {
      addScore(scores, "otp", 1);
    }

    if (WHATSAPP_STYLE_FILENAME.test(normalizedFilename) && hour >= 18) {
      addScore(scores, "conversation", 1);
    }

    if (
      /statement|salary|account|transaction/i.test(context) &&
      (dayOfMonth <= 3 || dayOfMonth >= 28)
    ) {
      addScore(scores, "bank", 1);
    }

    if (
      /receipt|invoice|bill|order|booking/i.test(context) &&
      hour >= 8 &&
      hour <= 22
    ) {
      addScore(scores, "receipt", 1);
    }

    if (
      /meme|funny|joke|reddit|reaction/i.test(context) &&
      (dayOfWeek === 0 || dayOfWeek === 6)
    ) {
      addScore(scores, "meme", 1);
    }
  }

  if (WHATSAPP_STYLE_FILENAME.test(normalizedFilename)) {
    addScore(scores, "conversation", 2);
  }

  if (/^screenshot[_-]?\d{4}/i.test(normalizedFilename)) {
    addScore(scores, "otp", 1);
  }

  if (
    createdAtMs != null &&
    SCREENSHOT_STYLE_FILENAME.test(normalizedFilename) &&
    Math.max(
      scores.otp,
      scores.receipt,
      scores.bank,
      scores.meme,
      scores.conversation,
      scores.medical,
    ) === 0
  ) {
    const fallbackDate = new Date(createdAtMs);
    const hour = fallbackDate.getHours();
    const dayOfMonth = fallbackDate.getDate();
    const dayOfWeek = fallbackDate.getDay();

    if (hour <= 6) {
      addScore(scores, "otp", 2);
    } else if ((dayOfWeek === 0 || dayOfWeek === 6) && hour >= 20) {
      addScore(scores, "meme", 2);
    } else if (hour >= 18) {
      addScore(scores, "conversation", 2);
    } else if (dayOfMonth <= 3 || dayOfMonth >= 28) {
      addScore(scores, "bank", 2);
    } else {
      addScore(scores, "receipt", 2);
    }
  }

  let bestCategory: ScreenshotCategory = "unknown";
  let bestScore = 0;

  for (const category of CATEGORY_ORDER) {
    const score = scores[category];
    if (score > bestScore) {
      bestScore = score;
      bestCategory = category;
    }
  }

  return bestScore >= 2 ? bestCategory : "unknown";
}
