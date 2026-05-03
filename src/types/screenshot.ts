export type ScreenshotItem = {
  id: string;
  uri: string;
  filename: string;
  createdAt: number;
  fileSize?: number;
};

export type ScreenshotCategory = "unused" | "recent";
