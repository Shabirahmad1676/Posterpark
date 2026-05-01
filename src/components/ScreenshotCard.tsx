import { Image } from "expo-image";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import type { ScreenshotItem } from "../types/screenshot";

type Props = {
  item: ScreenshotItem;
  onDelete: (item: ScreenshotItem) => void;
};

export function ScreenshotCard({ item, onDelete }: Props) {
  const daysOld = Math.floor(
    (Date.now() - item.createdAt) / (24 * 60 * 60 * 1000),
  );

  return (
    <View style={styles.card}>
      <Image
        source={{ uri: item.uri }}
        style={styles.thumb}
        contentFit="cover"
        cachePolicy="memory-disk"
        recyclingKey={item.id}
        transition={150}
      />

      <View style={styles.meta}>
        <Text style={styles.filename} numberOfLines={1}>
          {item.filename}
        </Text>
        <Text style={styles.daysOld}>{daysOld} days old</Text>
      </View>

      <Pressable
        onPress={() => onDelete(item)}
        style={({ pressed }) => [styles.deleteBtn, pressed && styles.pressed]}
      >
        <Text style={styles.deleteBtnText}>Delete</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 14,
    padding: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderColor: "#e2e8f0",
    borderWidth: 1,
  },
  thumb: {
    width: 60,
    height: 60,
    borderRadius: 10,
    backgroundColor: "#dbeafe",
  },
  meta: {
    flex: 1,
  },
  filename: {
    color: "#0f172a",
    fontWeight: "600",
  },
  daysOld: {
    color: "#64748b",
    marginTop: 4,
    fontSize: 12,
  },
  deleteBtn: {
    backgroundColor: "#fee2e2",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  deleteBtnText: {
    color: "#b91c1c",
    fontWeight: "700",
    fontSize: 12,
  },
  pressed: {
    opacity: 0.8,
  },
});
