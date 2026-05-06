import * as Haptics from "expo-haptics";
import * as MediaLibrary from "expo-media-library";
import { useCallback, useState } from "react";
import { Alert } from "react-native";
import type { ScreenshotItem } from "../types/screenshot";

type UseScreenshotDeleteParams = {
  unusedScreenshots: ScreenshotItem[];
  selectedIds: Set<string>;
  setUnusedScreenshots: React.Dispatch<React.SetStateAction<ScreenshotItem[]>>;
  setRecentScreenshots: React.Dispatch<React.SetStateAction<ScreenshotItem[]>>;
  removeFromSelection: (id: string) => void;
  clearSelection: () => void;
  setErrorMessage: React.Dispatch<React.SetStateAction<string | null>>;
};

export function useScreenshotDelete({
  unusedScreenshots,
  selectedIds,
  setUnusedScreenshots,
  setRecentScreenshots,
  removeFromSelection,
  clearSelection,
  setErrorMessage,
}: UseScreenshotDeleteParams) {
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const dismissSuccess = useCallback(() => {
    setSuccessMessage(null);
  }, []);

  const deleteOne = useCallback(
    (item: ScreenshotItem) => {
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
                removeFromSelection(item.id);
                Haptics.notificationAsync(
                  Haptics.NotificationFeedbackType.Success,
                );
              } catch (error) {
                const message =
                  error instanceof Error ? error.message : "Delete failed.";
                setErrorMessage(`Delete failed: ${message}`);
                Haptics.notificationAsync(
                  Haptics.NotificationFeedbackType.Error,
                );
                Alert.alert("Delete failed", message);
              }
            },
          },
        ],
      );
    },
    [
      removeFromSelection,
      setErrorMessage,
      setRecentScreenshots,
      setUnusedScreenshots,
    ],
  );

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
              clearSelection();
              setSuccessMessage(`Deleted ${toDelete.length} screenshot(s).`);
              Haptics.notificationAsync(
                Haptics.NotificationFeedbackType.Success,
              );
            } catch (error) {
              const message =
                error instanceof Error ? error.message : "Bulk delete failed.";
              setErrorMessage(`Delete failed: ${message}`);
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
              Alert.alert("Delete failed", message);
            }
          },
        },
      ],
    );
  }, [
    clearSelection,
    selectedIds,
    setErrorMessage,
    setRecentScreenshots,
    setUnusedScreenshots,
    unusedScreenshots,
  ]);

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
              clearSelection();
              setSuccessMessage(`Deleted ${count} screenshot(s).`);
              Haptics.notificationAsync(
                Haptics.NotificationFeedbackType.Success,
              );
            } catch (error) {
              const message =
                error instanceof Error ? error.message : "Bulk delete failed.";
              setErrorMessage(`Delete failed: ${message}`);
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
              Alert.alert("Delete failed", message);
            }
          },
        },
      ],
    );
  }, [
    clearSelection,
    setErrorMessage,
    setRecentScreenshots,
    setUnusedScreenshots,
    unusedScreenshots,
  ]);

  return {
    successMessage,
    dismissSuccess,
    deleteOne,
    deleteSelected,
    deleteAll,
  };
}
