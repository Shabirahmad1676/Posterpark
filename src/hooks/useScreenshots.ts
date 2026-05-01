import * as MediaLibrary from "expo-media-library";
import { useCallback, useMemo, useState } from "react";
import { Alert, Platform } from "react-native";
import type { ScreenshotItem } from "../types/screenshot";
import {
    isOlderThanSevenDays,
    looksLikeScreenshotName,
} from "../utils/screenshotUtils";

export function useScreenshots() {
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [oldScreenshots, setOldScreenshots] = useState<ScreenshotItem[]>([]);

  const oldCount = oldScreenshots.length;

  const fetchImagesAndDetectScreenshots = useCallback(async () => {
    if (Platform.OS === "web") {
      setErrorMessage("Media library is not available on web.");
      return;
    }

    setLoading(true);
    setErrorMessage(null);

    try {
      const permission = await MediaLibrary.requestPermissionsAsync();
      if (permission.status !== "granted") {
        setErrorMessage("Permission denied. Please allow photo access.");
        setOldScreenshots([]);
        return;
      }

      // Collect IDs that live inside a "Screenshots" album
      const screenshotIds = new Set<string>();
      const albums = await MediaLibrary.getAlbumsAsync();
      const screenshotAlbums = albums.filter((album) =>
        /screenshot/i.test(album.title),
      );

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
          page.assets.forEach((asset) => screenshotIds.add(asset.id));
          hasNextPage = page.hasNextPage;
          after = page.endCursor ?? undefined;
        }
      }

      // Walk all photos and detect screenshots by album membership or filename
      let allAssets: MediaLibrary.Asset[] = [];
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
          allAssets = allAssets.concat(page.assets);
          hasNextPage = page.hasNextPage;
          after = page.endCursor ?? undefined;
        }
      }

      const detected: ScreenshotItem[] = allAssets
        .filter((asset) => {
          const inScreenshotAlbum = screenshotIds.has(asset.id);
          const byFileName = looksLikeScreenshotName(asset.filename);
          return (
            (inScreenshotAlbum || byFileName) &&
            isOlderThanSevenDays(asset.creationTime)
          );
        })
        .map((asset) => ({
          id: asset.id,
          uri: asset.uri,
          filename: asset.filename,
          createdAt: asset.creationTime,
        }));

      setOldScreenshots(detected);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Failed to fetch images and detect screenshots.";
      setErrorMessage(message);
      setOldScreenshots([]);
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
              setOldScreenshots((prev) => prev.filter((x) => x.id !== item.id));
            } catch (error) {
              const message =
                error instanceof Error ? error.message : "Delete failed.";
              Alert.alert("Delete failed", message);
            }
          },
        },
      ],
    );
  }, []);

  // Bulk delete: all IDs in one array → single OS prompt regardless of count
  const deleteAll = useCallback(() => {
    if (oldScreenshots.length === 0) return;

    Alert.alert(
      "Delete all old screenshots?",
      `Delete ${oldScreenshots.length} screenshot(s) older than 7 days?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete all",
          style: "destructive",
          onPress: async () => {
            try {
              await MediaLibrary.deleteAssetsAsync(
                oldScreenshots.map((x) => x.id),
              );
              setOldScreenshots([]);
            } catch (error) {
              const message =
                error instanceof Error ? error.message : "Bulk delete failed.";
              Alert.alert("Delete failed", message);
            }
          },
        },
      ],
    );
  }, [oldScreenshots]);

  const headerText = useMemo(
    () =>
      oldCount === 0
        ? "Unused screenshots (7+ days): none"
        : `Unused screenshots (7+ days): ${oldCount}`,
    [oldCount],
  );

  return {
    loading,
    errorMessage,
    oldScreenshots,
    oldCount,
    headerText,
    fetchImagesAndDetectScreenshots,
    deleteOne,
    deleteAll,
  };
}
