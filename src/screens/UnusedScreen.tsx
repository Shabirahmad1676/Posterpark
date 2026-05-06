import { FlashList } from "@shopify/flash-list";
import { useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ScreenshotCard } from "../components/ScreenshotCard";
import { useScreenshotsContext } from "../context/ScreenshotsContext";
import type { ScreenshotItem } from "../types/screenshot";

const PAGE_SIZE = 40;

export default function UnusedScreen() {
  const router = useRouter();
  const {
    unusedScreenshots,
    unusedCount,
    selectedIds,
    toggleSelect,
    selectAll,
    deselectAll,
    deleteOne,
    deleteSelected,
    deleteAll,
    errorMessage,
    successMessage,
    dismissSuccess,
  } = useScreenshotsContext();
  const [visibleLimit, setVisibleLimit] = useState(PAGE_SIZE);

  const allSelected = unusedCount > 0 && selectedIds.size === unusedCount;
  const hasSelection = selectedIds.size > 0;
  const visibleData = useMemo(
    () => unusedScreenshots.slice(0, visibleLimit),
    [unusedScreenshots, visibleLimit],
  );
  const hasMore = unusedScreenshots.length > visibleLimit;

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
      {/* ── Header ── */}
      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          style={({ pressed }) => [styles.backBtn, pressed && styles.pressed]}
        >
          <Text style={styles.backChevron}>‹</Text>
          <Text style={styles.backLabel}>Back</Text>
        </Pressable>

        <View style={styles.titleRow}>
          <Text style={styles.title}>Unused</Text>
          {unusedCount > 0 ? (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{unusedCount}</Text>
            </View>
          ) : null}
        </View>

        <Text style={styles.subtitle}>
          {unusedCount === 0
            ? "Nothing to clean up"
            : `${unusedCount} screenshot${unusedCount === 1 ? "" : "s"} · older than 7 days`}
        </Text>

        <View style={styles.divider} />
      </View>

      {/* ── Success banner ── */}
      {successMessage ? (
        <Pressable style={styles.successBox} onPress={dismissSuccess}>
          <View style={styles.successIconWrap}>
            <Text style={styles.successIcon}>✓</Text>
          </View>
          <Text style={styles.successText}>{successMessage}</Text>
          <Text style={styles.successDismiss}>✕</Text>
        </Pressable>
      ) : null}

      {/* ── Error banner ── */}
      {errorMessage ? (
        <View style={styles.errorBox}>
          <Text style={styles.errorIcon}>⚠️</Text>
          <Text style={styles.errorText}>{errorMessage}</Text>
        </View>
      ) : null}

      {/* ── Bulk action bar ── */}
      {unusedCount > 0 ? (
        <View style={styles.bulkBar}>
          {/* Select toggle */}
          <Pressable
            style={({ pressed }) => [
              styles.bulkBtn,
              allSelected && styles.bulkBtnActive,
              pressed && styles.pressed,
            ]}
            onPress={allSelected ? deselectAll : selectAll}
          >
            <View style={[styles.miniCheck, allSelected && styles.miniCheckOn]}>
              {allSelected ? <Text style={styles.miniCheckMark}>✓</Text> : null}
            </View>
            <Text
              style={[
                styles.bulkBtnText,
                allSelected && styles.bulkBtnTextActive,
              ]}
            >
              {allSelected ? "Deselect All" : "Select All"}
            </Text>
          </Pressable>

          <View style={styles.bulkRight}>
            {/* Delete selected */}
            <Pressable
              style={({ pressed }) => [
                styles.deleteSelectedBtn,
                !hasSelection && styles.disabled,
                pressed && hasSelection && styles.pressed,
              ]}
              disabled={!hasSelection}
              onPress={deleteSelected}
            >
              <Text style={styles.deleteSelectedText}>
                Delete{hasSelection ? ` (${selectedIds.size})` : ""}
              </Text>
            </Pressable>

            {/* Delete all */}
            <Pressable
              style={({ pressed }) => [
                styles.deleteAllBtn,
                pressed && styles.pressed,
              ]}
              onPress={deleteAll}
            >
              <Text style={styles.deleteAllText}>Delete All</Text>
            </Pressable>
          </View>
        </View>
      ) : null}

      {/* ── Selection summary strip ── */}
      {hasSelection ? (
        <View style={styles.selectionStrip}>
          <Text style={styles.selectionStripText}>
            {selectedIds.size} selected
          </Text>
          <Pressable onPress={deselectAll}>
            <Text style={styles.selectionStripClear}>Clear</Text>
          </Pressable>
        </View>
      ) : null}

      {/* ── List ── */}
      <FlashList
        data={visibleData}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        renderItem={({
          item,
          index,
        }: {
          item: ScreenshotItem;
          index: number;
        }) => (
          <ScreenshotCard
            item={item}
            onDelete={deleteOne}
            selectable
            selected={selectedIds.has(item.id)}
            onToggleSelect={toggleSelect}
            index={index}
          />
        )}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <View style={styles.emptyIconWrap}>
              <Text style={styles.emptyEmoji}>🎉</Text>
            </View>
            <Text style={styles.emptyTitle}>All clean!</Text>
            <Text style={styles.emptySubtitle}>
              No unused screenshots found. You're good to go.
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
          ) : unusedCount > 0 ? (
            <View style={styles.endMarker}>
              <View style={styles.endLine} />
              <Text style={styles.endText}>End of list</Text>
              <View style={styles.endLine} />
            </View>
          ) : null
        }
      />
    </SafeAreaView>
  );
}

/* ── Design tokens ── */
const ACCENT = "#0ea5e9";
const DANGER = "#f43f5e";
const DANGER_SOFT = "#fff1f2";
const DANGER_BORDER = "#fecdd3";
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
    backgroundColor: DANGER,
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

  /* ── Success ── */
  successBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginHorizontal: 16,
    marginTop: 12,
    backgroundColor: "#f0fdf4",
    borderLeftWidth: 3,
    borderLeftColor: "#22c55e",
    borderRadius: 10,
    padding: 12,
  },
  successIconWrap: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#22c55e",
    alignItems: "center",
    justifyContent: "center",
  },
  successIcon: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "800",
  },
  successText: {
    flex: 1,
    color: "#15803d",
    fontWeight: "600",
    fontSize: 13,
  },
  successDismiss: {
    color: "#86efac",
    fontSize: 12,
    fontWeight: "700",
  },

  /* ── Error ── */
  errorBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginHorizontal: 16,
    marginTop: 12,
    backgroundColor: DANGER_SOFT,
    borderLeftWidth: 3,
    borderLeftColor: DANGER,
    borderRadius: 10,
    padding: 12,
  },
  errorIcon: { fontSize: 15 },
  errorText: {
    flex: 1,
    color: "#be123c",
    fontSize: 13,
    fontWeight: "500",
  },

  /* ── Bulk bar ── */
  bulkBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 10,
    gap: 8,
  },
  bulkBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    backgroundColor: SURFACE,
    borderWidth: 1,
    borderColor: BORDER,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOpacity: 0.03,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  bulkBtnActive: {
    borderColor: ACCENT,
    backgroundColor: "#f0f9ff",
  },
  bulkBtnText: {
    color: INK,
    fontWeight: "600",
    fontSize: 13,
  },
  bulkBtnTextActive: {
    color: ACCENT,
  },
  miniCheck: {
    width: 17,
    height: 17,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: BORDER,
    backgroundColor: "#f8fafc",
    alignItems: "center",
    justifyContent: "center",
  },
  miniCheckOn: {
    backgroundColor: ACCENT,
    borderColor: ACCENT,
  },
  miniCheckMark: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "800",
  },
  bulkRight: {
    flexDirection: "row",
    gap: 8,
  },
  deleteSelectedBtn: {
    backgroundColor: DANGER_SOFT,
    borderWidth: 1,
    borderColor: DANGER_BORDER,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 12,
  },
  deleteSelectedText: {
    color: DANGER,
    fontWeight: "700",
    fontSize: 13,
  },
  deleteAllBtn: {
    backgroundColor: DANGER,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 12,
    shadowColor: DANGER,
    shadowOpacity: 0.25,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  deleteAllText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 13,
  },
  disabled: {
    opacity: 0.35,
  },

  /* ── Selection strip ── */
  selectionStrip: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginHorizontal: 16,
    marginBottom: 4,
    backgroundColor: "#f0f9ff",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: "#bae6fd",
  },
  selectionStripText: {
    color: ACCENT,
    fontWeight: "700",
    fontSize: 13,
  },
  selectionStripClear: {
    color: MUTED,
    fontWeight: "600",
    fontSize: 13,
  },

  /* ── List ── */
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
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
    backgroundColor: "#fef9c3",
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
    backgroundColor: DANGER_SOFT,
    borderRadius: 8,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  loadMoreCount: {
    color: DANGER,
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
