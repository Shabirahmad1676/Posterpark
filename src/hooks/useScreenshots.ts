import { File } from "expo-file-system";
import * as MediaLibrary from "expo-media-library";
import { useCallback, useState } from "react";
import { Alert, Platform } from "react-native";
import type { ScreenshotItem } from "../types/screenshot";
import {
  isOlderThanSevenDays,
  looksLikeScreenshotName,
} from "../utils/screenshotUtils";

export function useScreenshots() {
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [albumScreenshotCount, setAlbumScreenshotCount] = useState<number>(0);
  const [limitedAccess, setLimitedAccess] = useState(false);
  const [unusedScreenshots, setUnusedScreenshots] = useState<ScreenshotItem[]>(
    [],
  );
  const [recentScreenshots, setRecentScreenshots] = useState<ScreenshotItem[]>(
    [],
  );
  // Selection state for unused bulk-actions
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const unusedCount = unusedScreenshots.length;
  const recentCount = recentScreenshots.length;
  const knownBytes = unusedScreenshots.reduce(
    (sum, item) => sum + (item.fileSize ?? 0),
    0,
  );
  const knownSizeCount = unusedScreenshots.filter(
    (item) => typeof item.fileSize === "number",
  ).length;
  const potentialFreeBytes =
    knownSizeCount > 0 ? (knownBytes / knownSizeCount) * unusedCount : 0;

  // Keep legacy alias so existing consumers don't break during migration
  const oldScreenshots = unusedScreenshots;
  const oldCount = unusedCount;

  const fetchImagesAndDetectScreenshots = useCallback(async () => {
    if (Platform.OS === "web") {
      setErrorMessage("Media library is not available on web.");
      return;
    }

    setLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const permission = await MediaLibrary.requestPermissionsAsync();
      setLimitedAccess(permission.accessPrivileges === "limited");
      if (permission.status !== "granted") {
        setErrorMessage("Permission denied. Please allow photo access.");
        setAlbumScreenshotCount(0);
        setSelectedIds(new Set());
        setUnusedScreenshots([]);
        setRecentScreenshots([]);
        return;
      }

      // Step 1: collect all assets directly from screenshot albums (most accurate)
      const albums = await MediaLibrary.getAlbumsAsync();
      const screenshotAlbums = albums.filter((album) =>
        /screenshot/i.test(album.title),
      );
      // Use the largest matching screenshot album count as a stable expected total.
      const maxAlbumCount = screenshotAlbums.reduce(
        (max, album) => Math.max(max, album.assetCount ?? 0),
        0,
      );
      setAlbumScreenshotCount(maxAlbumCount);

      const seenIds = new Set<string>();
      const allScreenshotAssets: MediaLibrary.Asset[] = [];

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
            if (!seenIds.has(asset.id)) {
              seenIds.add(asset.id);
              allScreenshotAssets.push(asset);
            }
          }
          hasNextPage = page.hasNextPage;
          after = page.endCursor ?? undefined;
        }
      }

      // Step 2: also catch screenshots outside any album that match by filename
      {
        let after: string | undefined;
        let hasNextPage = true;

        while (hasNextPage) {
          const page = await MediaLibrary.getAssetsAsync({
            first: 200,
            mediaType: [MediaLibrary.MediaType.photo],
            after,
            sortBy: [[MediaLibrary.SortBy.creationTime, false]],
          });
          for (const asset of page.assets) {
            if (
              !seenIds.has(asset.id) &&
              looksLikeScreenshotName(asset.filename)
            ) {
              seenIds.add(asset.id);
              allScreenshotAssets.push(asset);
            }
          }
          hasNextPage = page.hasNextPage;
          after = page.endCursor ?? undefined;
        }
      }

      const unused: ScreenshotItem[] = [];
      const recent: ScreenshotItem[] = [];

      for (const asset of allScreenshotAssets) {
        const item: ScreenshotItem = {
          id: asset.id,
          uri: asset.uri,
          filename: asset.filename,
          createdAt: asset.creationTime,
        };
        if (isOlderThanSevenDays(asset.creationTime)) {
          unused.push(item);
        } else {
          recent.push(item);
        }
      }

      const SAMPLE_SIZE_LIMIT = 120;
      const sizedUnused = [...unused];
      await Promise.all(
        sizedUnused.slice(0, SAMPLE_SIZE_LIMIT).map(async (item, index) => {
          try {
            const file = new File(item.uri);
            if (file.exists && typeof file.size === "number") {
              sizedUnused[index] = { ...item, fileSize: file.size };
            }
          } catch {
            // Best-effort size lookup: keep item without fileSize if unavailable.
          }
        }),
      );

      setUnusedScreenshots(sizedUnused);
      setRecentScreenshots(recent);
      setSelectedIds(new Set());
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Failed to fetch images and detect screenshots.";
      setErrorMessage(message);
      setAlbumScreenshotCount(0);
      setUnusedScreenshots([]);
      setRecentScreenshots([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Single-item delete: one batched call triggers one OS prompt
  const deleteOne = useCallback((item: ScreenshotItem) => {
    Alert.alert(
      "Delete screenshot?",
      `This will permanently delete ${item.filename}.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await MediaLibrary.deleteAssetsAsync([item.id]);
              setErrorMessage(null);
              setUnusedScreenshots((prev) =>
                prev.filter((x) => x.id !== item.id),
              );
              setRecentScreenshots((prev) =>
                prev.filter((x) => x.id !== item.id),
              );
              setSelectedIds((prev) => {
                const next = new Set(prev);
                next.delete(item.id);
                return next;
              });
            } catch (error) {
              const message =
                error instanceof Error ? error.message : "Delete failed.";
              setErrorMessage(`Delete failed: ${message}`);
              Alert.alert("Delete failed", message);
            }
          },
        },
      ],
    );
  }, []);

  // Bulk delete selected unused screenshots
  const deleteSelected = useCallback(() => {
    const toDelete = unusedScreenshots.filter((x) => selectedIds.has(x.id));
    if (toDelete.length === 0) return;

    Alert.alert(
      "Delete selected screenshots?",
      `Delete ${toDelete.length} screenshot(s)?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await MediaLibrary.deleteAssetsAsync(toDelete.map((x) => x.id));
              setErrorMessage(null);
              const deletedIds = new Set(toDelete.map((x) => x.id));
              setUnusedScreenshots((prev) =>
                prev.filter((x) => !deletedIds.has(x.id)),
              );
              setRecentScreenshots((prev) =>
                prev.filter((x) => !deletedIds.has(x.id)),
              );
              setSelectedIds(new Set());
              setSuccessMessage(`Deleted ${toDelete.length} screenshot(s).`);
            } catch (error) {
              const message =
                error instanceof Error ? error.message : "Bulk delete failed.";
              setErrorMessage(`Delete failed: ${message}`);
              Alert.alert("Delete failed", message);
            }
          },
        },
      ],
    );
  }, [unusedScreenshots, selectedIds]);

  // Bulk delete: all unused in one array → single OS prompt
  const deleteAll = useCallback(() => {
    if (unusedScreenshots.length === 0) return;

    Alert.alert(
      "Delete all unused screenshots?",
      `Delete ${unusedScreenshots.length} screenshot(s) older than 7 days?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete all",
          style: "destructive",
          onPress: async () => {
            try {
              await MediaLibrary.deleteAssetsAsync(
                unusedScreenshots.map((x) => x.id),
              );
              setErrorMessage(null);
              const count = unusedScreenshots.length;
              const deletedIds = new Set(unusedScreenshots.map((x) => x.id));
              setUnusedScreenshots([]);
              setRecentScreenshots((prev) =>
                prev.filter((x) => !deletedIds.has(x.id)),
              );
              setSelectedIds(new Set());
              setSuccessMessage(`Deleted ${count} screenshot(s).`);
            } catch (error) {
              const message =
                error instanceof Error ? error.message : "Bulk delete failed.";
              setErrorMessage(`Delete failed: ${message}`);
              Alert.alert("Delete failed", message);
            }
          },
        },
      ],
    );
  }, [unusedScreenshots]);

  // Selection helpers
  const toggleSelect = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const selectAll = useCallback(() => {
    setSelectedIds(new Set(unusedScreenshots.map((x) => x.id)));
  }, [unusedScreenshots]);

  const deselectAll = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  const dismissSuccess = useCallback(() => setSuccessMessage(null), []);

  return {
    loading,
    errorMessage,
    successMessage,
    dismissSuccess,
    albumScreenshotCount,
    limitedAccess,
    potentialFreeBytes,
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
    // legacy aliases
    oldScreenshots,
    oldCount,
  };
}
