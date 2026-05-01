import {
    SCREENSHOT_NAME_PATTERN,
    SEVEN_DAYS_MS,
} from "../constants/screenshots";

export function isOlderThanSevenDays(createdAtMs: number): boolean {
  return Date.now() - createdAtMs >= SEVEN_DAYS_MS;
}

export function looksLikeScreenshotName(filename: string): boolean {
  return SCREENSHOT_NAME_PATTERN.test(filename);
}
