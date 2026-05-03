import { useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ScreenshotCard } from "../components/ScreenshotCard";
import { useScreenshotsContext } from "../context/ScreenshotsContext";
import type { ScreenshotItem } from "../types/screenshot";

const PAGE_SIZE = 40;

export default function RecentScreen() {
  const router = useRouter();
  const { recentScreenshots, recentCount, deleteOne, errorMessage } =
    useScreenshotsContext();
  const [visibleLimit, setVisibleLimit] = useState(PAGE_SIZE);
  const visibleData = useMemo(
    () => recentScreenshots.slice(0, visibleLimit),
    [recentScreenshots, visibleLimit],
  );
  const hasMore = recentScreenshots.length > visibleLimit;

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          style={({ pressed }) => [styles.backBtn, pressed && styles.pressed]}
        >
          <Text style={styles.backChevron}>‹</Text>
          <Text style={styles.backLabel}>Back</Text>
        </Pressable>

        <View style={styles.titleRow}>
          <Text style={styles.title}>Recent</Text>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{recentCount}</Text>
          </View>
        </View>

        <Text style={styles.subtitle}>
          {recentCount === 0
            ? "Nothing captured lately"
            : `${recentCount} screenshot${recentCount === 1 ? "" : "s"} · last 7 days`}
        </Text>

        {/* Thin accent divider */}
        <View style={styles.divider} />
      </View>

      {/* Error */}
      {errorMessage ? (
        <View style={styles.errorBox}>
          <Text style={styles.errorIcon}>⚠️</Text>
          <Text style={styles.errorText}>{errorMessage}</Text>
        </View>
      ) : null}

      <FlatList
        data={visibleData}
        keyExtractor={(item) => item.id}
        initialNumToRender={12}
        maxToRenderPerBatch={12}
        windowSize={7}
        updateCellsBatchingPeriod={50}
        removeClippedSubviews
        contentContainerStyle={styles.listContent}
        renderItem={({ item, index }: { item: ScreenshotItem; index: number }) => (
          <ScreenshotCard item={item} onDelete={deleteOne} index={index} />
        )}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <View style={styles.emptyIconWrap}>
              <Text style={styles.emptyEmoji}>📂</Text>
            </View>
            <Text style={styles.emptyTitle}>Nothing here yet</Text>
            <Text style={styles.emptySubtitle}>
              Screenshots from the last 7 days will appear here.
            </Text>
          </View>
        }
        ListFooterComponent={
          hasMore ? (
            <Pressable
              style={({ pressed }) => [
                styles.loadMoreBtn,
                pressed && styles.pressed,
              ]}
              onPress={() => setVisibleLimit((prev) => prev + PAGE_SIZE)}
            >
              <Text style={styles.loadMoreText}>Load more</Text>
              <View style={styles.loadMorePill}>
                <Text style={styles.loadMoreCount}>+40</Text>
              </View>
            </Pressable>
          ) : (
            <View style={styles.endMarker}>
              <View style={styles.endLine} />
              <Text style={styles.endText}>All caught up</Text>
              <View style={styles.endLine} />
            </View>
          )
        }
      />
    </SafeAreaView>
  );
}

const ACCENT = "#0ea5e9";
const ACCENT_SOFT = "#e0f2fe";
const SURFACE = "#ffffff";
const BG = "#f8fafc";
const INK = "#0f172a";
const MUTED = "#94a3b8";
const BORDER = "#e2e8f0";

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BG,
  },

  /* ── Header ── */
  header: {
    paddingHorizontal: 20,
    paddingTop: 6,
    paddingBottom: 16,
    backgroundColor: SURFACE,
  },
  backBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    alignSelf: "flex-start",
    marginBottom: 14,
  },
  backChevron: {
    fontSize: 22,
    color: ACCENT,
    lineHeight: 24,
    fontWeight: "300",
  },
  backLabel: {
    fontSize: 15,
    color: ACCENT,
    fontWeight: "600",
    letterSpacing: 0.1,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  title: {
    fontSize: 30,
    fontWeight: "800",
    color: INK,
    letterSpacing: -0.5,
  },
  badge: {
    backgroundColor: ACCENT,
    borderRadius: 20,
    paddingHorizontal: 9,
    paddingVertical: 3,
    marginTop: 2,
  },
  badgeText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "700",
  },
  subtitle: {
    fontSize: 13,
    color: MUTED,
    marginTop: 4,
    letterSpacing: 0.1,
  },
  divider: {
    height: 1,
    backgroundColor: BORDER,
    marginTop: 16,
    marginHorizontal: -20,
  },

  /* ── Error ── */
  errorBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    margin: 16,
    backgroundColor: "#fff1f2",
    borderLeftWidth: 3,
    borderLeftColor: "#f43f5e",
    borderRadius: 10,
    padding: 12,
  },
  errorIcon: { fontSize: 16 },
  errorText: {
    flex: 1,
    color: "#be123c",
    fontSize: 13,
    fontWeight: "500",
  },

  /* ── List ── */
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 32,
    gap: 10,
  },

  /* ── Empty ── */
  emptyState: {
    alignItems: "center",
    paddingVertical: 72,
    gap: 8,
  },
  emptyIconWrap: {
    width: 72,
    height: 72,
    borderRadius: 24,
    backgroundColor: ACCENT_SOFT,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  emptyEmoji: { fontSize: 36 },
  emptyTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: INK,
  },
  emptySubtitle: {
    fontSize: 13,
    color: MUTED,
    textAlign: "center",
    paddingHorizontal: 32,
    lineHeight: 19,
  },

  /* ── Footer ── */
  loadMoreBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginVertical: 16,
    alignSelf: "center",
    backgroundColor: SURFACE,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: BORDER,
    paddingHorizontal: 18,
    paddingVertical: 11,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  loadMoreText: {
    color: INK,
    fontWeight: "600",
    fontSize: 14,
  },
  loadMorePill: {
    backgroundColor: ACCENT_SOFT,
    borderRadius: 8,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  loadMoreCount: {
    color: ACCENT,
    fontWeight: "700",
    fontSize: 12,
  },
  endMarker: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 24,
    marginHorizontal: 16,
    gap: 10,
  },
  endLine: {
    flex: 1,
    height: 1,
    backgroundColor: BORDER,
  },
  endText: {
    color: MUTED,
    fontSize: 12,
    fontWeight: "500",
    letterSpacing: 0.3,
  },

  pressed: { opacity: 0.72 },
});