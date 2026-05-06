import React from "react";
import {
    ActivityIndicator,
    FlatList,
    Pressable,
    StyleSheet,
    Text,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ScreenshotCard } from "../components/ScreenshotCard";
import { useScreenshots } from "../hooks/useScreenshots";
import type { ScreenshotItem } from "../types/screenshot";

export default function HomeScreen() {
  const {
    loading,
    errorMessage,
    unusedScreenshots,
    unusedCount,
    fetchImagesAndDetectScreenshots,
    deleteOne,
    deleteAll,
  } = useScreenshots();
  const headerText =
    unusedCount === 0
      ? "Unused screenshots (7+ days): none"
      : `Unused screenshots (7+ days): ${unusedCount}`;

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
      <View style={styles.topBar}>
        <Text style={styles.title}>Screenshot Cleanup</Text>
        <Text style={styles.subtitle}>{headerText}</Text>
      </View>

      <View style={styles.actionsRow}>
        <Pressable
          onPress={fetchImagesAndDetectScreenshots}
          style={({ pressed }) => [
            styles.primaryBtn,
            pressed && styles.pressed,
          ]}
        >
          <Text style={styles.primaryBtnText}>Fetch images</Text>
        </Pressable>

        <Pressable
          onPress={deleteAll}
          disabled={unusedCount === 0}
          style={({ pressed }) => [
            styles.deleteBtn,
            unusedCount === 0 && styles.disabled,
            pressed && styles.pressed,
          ]}
        >
          <Text style={styles.deleteBtnText}>Delete all</Text>
        </Pressable>
      </View>

      {loading ? (
        <View style={styles.centerState}>
          <ActivityIndicator size="large" />
          <Text style={styles.stateText}>Scanning photos...</Text>
        </View>
      ) : null}

      {errorMessage ? (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{errorMessage}</Text>
        </View>
      ) : null}

      <FlatList
        data={unusedScreenshots}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }: { item: ScreenshotItem }) => (
          <ScreenshotCard item={item} onDelete={deleteOne} />
        )}
        ListEmptyComponent={
          !loading ? (
            <View style={styles.centerState}>
              <Text style={styles.stateText}>
                No screenshots older than 7 days found.
              </Text>
            </View>
          ) : null
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f7faf8",
  },
  topBar: {
    paddingHorizontal: 16,
    paddingTop: 12,
    gap: 6,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: "#0f172a",
  },
  subtitle: {
    fontSize: 15,
    color: "#475569",
  },
  actionsRow: {
    flexDirection: "row",
    gap: 10,
    paddingHorizontal: 16,
    marginTop: 14,
    marginBottom: 12,
  },
  primaryBtn: {
    backgroundColor: "#0f766e",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
  },
  primaryBtnText: {
    color: "#ffffff",
    fontWeight: "700",
  },
  deleteBtn: {
    backgroundColor: "#ef4444",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
  },
  deleteBtnText: {
    color: "#ffffff",
    fontWeight: "700",
  },
  disabled: {
    opacity: 0.5,
  },
  pressed: {
    opacity: 0.8,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 24,
    gap: 10,
  },
  centerState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 20,
    gap: 8,
  },
  stateText: {
    color: "#64748b",
  },
  errorBox: {
    marginHorizontal: 16,
    marginBottom: 8,
    backgroundColor: "#fee2e2",
    borderColor: "#ef4444",
    borderWidth: 1,
    borderRadius: 10,
    padding: 10,
  },
  errorText: {
    color: "#991b1b",
  },
});
