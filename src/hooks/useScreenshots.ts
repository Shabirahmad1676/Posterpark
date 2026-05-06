import { File } from "expo-file-system";
import * as MediaLibrary from "expo-media-library";
import { useCallback, useRef, useState } from "react";
import { Platform } from "react-native";
import type { ScreenshotItem } from "../types/screenshot";
import { classifyScreenshot } from "../utils/classifyScreenshot";
import {
  isOlderThanSevenDays,
  looksLikeScreenshotName,
} from "../utils/screenshotUtils";
import { useScreenshotDelete } from "./useScreenshotDelete";
import { useScreenshotSelection } from "./useScreenshotSelection";

export function useScreenshots() {
  const scanningRef = useRef(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [limitedAccess, setLimitedAccess] = useState(false);
  const [unusedScreenshots, setUnusedScreenshots] = useState<ScreenshotItem[]>(
    [],
  );
  const [recentScreenshots, setRecentScreenshots] = useState<ScreenshotItem[]>(
    [],
  );

  const {
    selectedIds,
    toggleSelect,
    selectAll,
    deselectAll,
    removeFromSelection,
  } = useScreenshotSelection(unusedScreenshots.map((item) => item.id));

  const {
    successMessage,
    dismissSuccess,
    deleteOne,
    deleteSelected,
    deleteAll,
  } = useScreenshotDelete({
    unusedScreenshots,
    selectedIds,
    setUnusedScreenshots,
    setRecentScreenshots,
    removeFromSelection,
    clearSelection: deselectAll,
    setErrorMessage,
  });

  const unusedCount = unusedScreenshots.length;
  const recentCount = recentScreenshots.length;
  const detectedScreenshotCount = unusedCount + recentCount;
  const knownBytes = unusedScreenshots.reduce(
    (sum, item) => sum + (item.fileSize ?? 0),
    0,
  );
  const knownSizeCount = unusedScreenshots.filter(
    (item) => typeof item.fileSize === "number",
  ).length;
  const estimatedUnusedBytes =
    knownSizeCount > 0 ? (knownBytes / knownSizeCount) * unusedCount : 0;

  const fetchImagesAndDetectScreenshots = useCallback(async () => {
    if (scanningRef.current) return;

    if (Platform.OS === "web") {
      setErrorMessage("Media library is not available on web.");
      return;
    }

    scanningRef.current = true;
    setLoading(true);
    setErrorMessage(null);
    dismissSuccess();

    try {
      const permission = await MediaLibrary.requestPermissionsAsync();
      setLimitedAccess(permission.accessPrivileges === "limited");
      if (permission.status !== "granted") {
        setErrorMessage("Permission denied. Please allow photo access.");
        deselectAll();
        setUnusedScreenshots([]);
        setRecentScreenshots([]);
        return;
      }

      // Step 1: collect all assets directly from screenshot albums (most accurate)
      const albums = await MediaLibrary.getAlbumsAsync();
      const screenshotAlbums = albums.filter((album) =>
        /screenshot/i.test(album.title),
      );
      const assetsMap = new Map<string, MediaLibrary.Asset>();

      for (const album of screenshotAlbums) {
        let after: string | undefined;
        let hasNextPage = true;

        while (hasNextPage) {
          const page = await MediaLibrary.getAssetsAsync({
            album,
            first: 200,
            mediaType: [MediaLibrary.MediaType.photo],
            after,
            sortBy: [[MediaLibrary.SortBy.creationTime, false]],
          });
          for (const asset of page.assets) {
            assetsMap.set(asset.id, asset);
          }
          hasNextPage = page.hasNextPage;
          after = page.endCursor ?? undefined;
        }
      }

      // Step 2: also catch screenshots outside any album that match by filename
      {
        let after: string | undefined;
        let hasNextPage = true;
        let pageCount = 0;
        // pageCount starts at 0, so this scans at most pages 0..4 (5 pages = 1000 photos).
        const PAGE_LIMIT = 5;

        while (hasNextPage && pageCount < PAGE_LIMIT) {
          const page = await MediaLibrary.getAssetsAsync({
            first: 200,
            mediaType: [MediaLibrary.MediaType.photo],
            after,
            sortBy: [[MediaLibrary.SortBy.creationTime, false]],
          });
          for (const asset of page.assets) {
            if (looksLikeScreenshotName(asset.filename)) {
              assetsMap.set(asset.id, asset);
            }
          }
          hasNextPage = page.hasNextPage;
          after = page.endCursor ?? undefined;
          pageCount++;
        }
      }

      const allScreenshotAssets = Array.from(assetsMap.values());
      const unused: ScreenshotItem[] = [];
      const recent: ScreenshotItem[] = [];

      for (const asset of allScreenshotAssets) {
        const item: ScreenshotItem = {
          id: asset.id,
          uri: asset.uri,
          filename: asset.filename,
          createdAt: asset.creationTime,
          category: classifyScreenshot(asset.filename, {
            createdAt: asset.creationTime,
          }),
        };
        if (isOlderThanSevenDays(asset.creationTime)) {
          unused.push(item);
        } else {
          recent.push(item);
        }
      }

      const SAMPLE_SIZE_LIMIT = 120;
      const sizedUnused = await Promise.all(
        unused.map(async (item, index) => {
          if (index >= SAMPLE_SIZE_LIMIT) return item;
          try {
            const file = new File(item.uri);
            const existsValue =
              typeof file.exists === "function"
                ? await (file.exists as () => Promise<boolean>)()
                : Boolean(file.exists);
            const sizeValue =
              typeof file.size === "function"
                ? await (file.size as () => Promise<number | null>)()
                : file.size;
            if (existsValue && typeof sizeValue === "number") {
              return { ...item, fileSize: sizeValue };
            }
          } catch {
            // Best-effort size lookup: keep item without fileSize if unavailable.
          }
          return item;
        }),
      );

      setUnusedScreenshots(sizedUnused);
      setRecentScreenshots(recent);
      deselectAll();
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Failed to fetch images and detect screenshots.";
      setErrorMessage(message);
      deselectAll();
      setUnusedScreenshots([]);
      setRecentScreenshots([]);
    } finally {
      setLoading(false);
      scanningRef.current = false;
    }
  }, [deselectAll, dismissSuccess]);

  return {
    loading,
    errorMessage,
    successMessage,
    dismissSuccess,
    detectedScreenshotCount,
    limitedAccess,
    estimatedUnusedBytes,
    knownSizeCount,
    // V2 split
    unusedScreenshots,
    recentScreenshots,
    unusedCount,
    recentCount,
    // selection
    selectedIds,
    toggleSelect,
    selectAll,
    deselectAll,
    // actions
    fetchImagesAndDetectScreenshots,
    deleteOne,
    deleteSelected,
    deleteAll,
  };
}
