import { Image } from "expo-image";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import type { ScreenshotItem } from "../types/screenshot";

type Props = {
  item: ScreenshotItem;
  onDelete: (item: ScreenshotItem) => void;
  selectable?: boolean;
  selected?: boolean;
  onToggleSelect?: (id: string) => void;
  index?: number;
};

export function ScreenshotCard({
  item,
  onDelete,
  selectable = false,
  selected = false,
  onToggleSelect,
  index = 0,
}: Props) {
  const date = new Date(item.createdAt);
  const dateLabel = date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  const daysOld = Math.floor(
    (Date.now() - item.createdAt) / (24 * 60 * 60 * 1000),
  );

  // Freshness indicator color
  const freshnessColor =
    daysOld <= 1 ? "#22c55e" : daysOld <= 3 ? "#f59e0b" : "#cbd5e1";

  return (
    <Pressable
      onPress={
        selectable && onToggleSelect ? () => onToggleSelect(item.id) : undefined
      }
      style={({ pressed }) => [
        styles.card,
        selected && styles.cardSelected,
        pressed && selectable && styles.pressed,
      ]}
    >
      {/* Selection checkbox */}
      {selectable ? (
        <View style={[styles.checkbox, selected && styles.checkboxChecked]}>
          {selected ? <Text style={styles.checkmark}>✓</Text> : null}
        </View>
      ) : null}

      {/* Thumbnail with freshness dot */}
      <View style={styles.thumbWrap}>
        <Image
          source={{ uri: item.uri }}
          style={styles.thumb}
          contentFit="cover"
          cachePolicy="memory-disk"
          recyclingKey={item.id}
          transition={200}
        />
        <View style={[styles.freshnessDot, { backgroundColor: freshnessColor }]} />
      </View>

      {/* Metadata */}
      <View style={styles.meta}>
        <Text style={styles.filename} numberOfLines={1}>
          {item.filename}
        </Text>
        <Text style={styles.date}>{dateLabel}</Text>
        <View style={styles.agePill}>
          <Text style={styles.ageText}>
            {daysOld === 0 ? "Today" : daysOld === 1 ? "Yesterday" : `${daysOld}d ago`}
          </Text>
        </View>
      </View>

      {/* Delete */}
      <Pressable
        onPress={() => onDelete(item)}
        style={({ pressed }) => [
          styles.deleteBtn,
          pressed && styles.deleteBtnPressed,
        ]}
        hitSlop={10}
      >
        <Text style={styles.deleteBtnIcon}>✕</Text>
      </Pressable>
    </Pressable>
  );
}

const ACCENT = "#0ea5e9";
const INK = "#0f172a";
const MUTED = "#94a3b8";
const BORDER = "#e2e8f0";

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    paddingVertical: 10,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderWidth: 1,
    borderColor: BORDER,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  cardSelected: {
    borderColor: ACCENT,
    backgroundColor: "#f0f9ff",
    shadowColor: ACCENT,
    shadowOpacity: 0.12,
  },

  /* ── Checkbox ── */
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 7,
    borderWidth: 1.5,
    borderColor: BORDER,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f8fafc",
  },
  checkboxChecked: {
    backgroundColor: ACCENT,
    borderColor: ACCENT,
  },
  checkmark: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "800",
  },

  /* ── Thumbnail ── */
  thumbWrap: {
    position: "relative",
  },
  thumb: {
    width: 58,
    height: 58,
    borderRadius: 12,
    backgroundColor: "#e0f2fe",
  },
  freshnessDot: {
    position: "absolute",
    bottom: 2,
    right: 2,
    width: 9,
    height: 9,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: "#fff",
  },

  /* ── Meta ── */
  meta: {
    flex: 1,
    gap: 2,
  },
  filename: {
    color: INK,
    fontWeight: "700",
    fontSize: 13.5,
    letterSpacing: -0.1,
  },
  date: {
    color: MUTED,
    fontSize: 11.5,
    marginTop: 1,
  },
  agePill: {
    marginTop: 5,
    alignSelf: "flex-start",
    backgroundColor: "#f1f5f9",
    borderRadius: 6,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  ageText: {
    color: "#475569",
    fontSize: 11,
    fontWeight: "600",
  },

  /* ── Delete ── */
  deleteBtn: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: "#fff1f2",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#fecdd3",
  },
  deleteBtnPressed: {
    opacity: 0.65,
    backgroundColor: "#ffe4e6",
  },
  deleteBtnIcon: {
    color: "#f43f5e",
    fontSize: 12,
    fontWeight: "800",
  },

  pressed: { opacity: 0.8 },
});