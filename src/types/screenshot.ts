export type ScreenshotCategory =
  | "otp"
  | "receipt"
  | "bank"
  | "meme"
  | "conversation"
  | "medical"
  | "unknown";

export interface ScreenshotItem {
  id: string;
  uri: string;
  filename: string;
  createdAt: number;
  fileSize?: number;
  category?: ScreenshotCategory;
}
