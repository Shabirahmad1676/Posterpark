import { useRouter } from "expo-router";
import React from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useScreenshotsContext } from "../context/ScreenshotsContext";

export default function DashboardScreen() {
  const router = useRouter();
  const {
    loading,
    errorMessage,
    unusedCount,
    recentCount,
    albumScreenshotCount,
    limitedAccess,
    potentialFreeBytes,
    knownSizeCount,
    fetchImagesAndDetectScreenshots,
  } = useScreenshotsContext();

  const hasScanned = unusedCount > 0 || recentCount > 0;
  const detectedCount = unusedCount + recentCount;
  const freeMb = Math.max(0, potentialFreeBytes / (1024 * 1024));

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
      {/* ── App header ── */}
      <View style={styles.header}>
        <View style={styles.logoRow}>
          {/* <View style={styles.logoMark}> */}
          {/* <Text style={styles.logoMarkText}>SC</Text> */}
          {/* </View> */}
          {/* <Text style={styles.appName}>SnapClean</Text> */}
        </View>
        <Text style={styles.title}>Screenshot Cleanup</Text>
        <Text style={styles.subtitle}>Scan your library and free up space</Text>
      </View>

      {loading ? (
        /* ── Loading state ── */
        <View style={styles.loadingBox}>
          <View style={styles.loadingSpinnerWrap}>
            <ActivityIndicator size="large" color={ACCENT} />
          </View>
          <Text style={styles.loadingTitle}>Scanning…</Text>
          <Text style={styles.loadingSubtitle}>Analysing your photo library</Text>
        </View>
      ) : (
        <View style={styles.body}>
          {/* ── Banners ── */}
          {errorMessage ? (
            <View style={[styles.banner, styles.bannerError]}>
              <Text style={styles.bannerIcon}>⚠️</Text>
              <Text style={styles.bannerText}>{errorMessage}</Text>
            </View>
          ) : null}

          {limitedAccess ? (
            <View style={[styles.banner, styles.bannerWarn]}>
              <Text style={styles.bannerIcon}>⚡</Text>
              <Text style={styles.bannerText}>
                Limited photo access — counts may be lower than your gallery.
              </Text>
            </View>
          ) : null}

          {albumScreenshotCount > 0 ? (
            <View style={[styles.banner, styles.bannerInfo]}>
              <Text style={styles.bannerIcon}>ℹ️</Text>
              <Text style={styles.bannerText}>
                Detected {detectedCount} of ~{albumScreenshotCount} screenshot album items.
              </Text>
            </View>
          ) : null}

          {/* ── Storage insight card ── */}
          {/* {unusedCount > 0 ? (
            <View style={styles.storageCard}>
              <View style={styles.storageCardLeft}>
                <Text style={styles.storageLabel}>Potential savings</Text>
                <Text style={styles.storageAmount}>
                  {knownSizeCount > 0 ? `${freeMb.toFixed(1)} MB` : "—"}
                </Text>
                <Text style={styles.storageHint}>
                  {knownSizeCount > 0
                    ? "by deleting unused screenshots"
                    : "delete unused screenshots to free up space"}
                </Text>
              </View>
              <View style={styles.storageIconWrap}>
                <Text style={styles.storageIcon}>💾</Text>
              </View>
            </View>
          ) : null} */}

          {/* ── Category cards ── */}
          {hasScanned ? (
            <View style={styles.cardsSection}>
              <Text style={styles.sectionLabel}>Your screenshots</Text>

              {/* Unused */}
              <Pressable
                style={({ pressed }) => [
                  styles.categoryCard,
                  styles.unusedCard,
                  pressed && styles.pressed,
                ]}
                onPress={() => router.push("/unused")}
              >
                <View style={[styles.categoryIconWrap, styles.unusedIconWrap]}>
                  <Text style={styles.categoryEmoji}>🧹</Text>
                </View>
                <View style={styles.categoryMeta}>
                  <Text style={styles.categoryCount}>{unusedCount}</Text>
                  <Text style={styles.categoryLabel}>Unused screenshots</Text>
                  <Text style={styles.categoryHint}>Older than 7 days</Text>
                </View>
                <View style={[styles.chevronWrap, styles.unusedChevronWrap]}>
                  <Text style={styles.chevron}>›</Text>
                </View>
              </Pressable>

              {/* Recent */}
              <Pressable
                style={({ pressed }) => [
                  styles.categoryCard,
                  styles.recentCard,
                  pressed && styles.pressed,
                ]}
                onPress={() => router.push("/recent")}
              >
                <View style={[styles.categoryIconWrap, styles.recentIconWrap]}>
                  <Text style={styles.categoryEmoji}>⏱️</Text>
                </View>
                <View style={styles.categoryMeta}>
                  <Text style={styles.categoryCount}>{recentCount}</Text>
                  <Text style={styles.categoryLabel}>Recent screenshots</Text>
                  <Text style={styles.categoryHint}>Last 7 days</Text>
                </View>
                <View style={[styles.chevronWrap, styles.recentChevronWrap]}>
                  <Text style={styles.chevron}>›</Text>
                </View>
              </Pressable>
            </View>
          ) : (
            /* ── Empty / pre-scan state ── */
            <View style={styles.emptyState}>
              <View style={styles.emptyIconWrap}>
                <Text style={styles.emptyEmoji}>📸</Text>
              </View>
              <Text style={styles.emptyTitle}>Nothing scanned yet</Text>
              <Text style={styles.emptySubtitle}>
                Tap "Scan Now" to analyse your photo library and find screenshots to clean up.
              </Text>
            </View>
          )}

          {/* ── Scan CTA ── */}
          <View style={styles.scanWrap}>
            <Pressable
              style={({ pressed }) => [styles.scanBtn, pressed && styles.scanBtnPressed]}
              onPress={fetchImagesAndDetectScreenshots}
            >
              <Text style={styles.scanBtnText}>
                {hasScanned ? "Re-scan Library" : "Scan Now"}
              </Text>
            </Pressable>
            {hasScanned ? (
              <Text style={styles.scanCaption}>
                Results update after each scan
              </Text>
            ) : null}
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

/* ── Design tokens ── */
const ACCENT = "#0ea5e9";
const DANGER = "#f43f5e";
const INK = "#0f172a";
const MUTED = "#94a3b8";
const SURFACE = "#ffffff";
const BG = "#f8fafc";
const BORDER = "#e2e8f0";

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BG,
  },

  /* ── Header ── */
  header: {
    backgroundColor: SURFACE,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
    gap: 6,
  },
  logoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 10,
  },
  logoMark: {
    width: 30,
    height: 30,
    borderRadius: 9,
    backgroundColor: ACCENT,
    alignItems: "center",
    justifyContent: "center",
  },
  logoMarkText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  appName: {
    fontSize: 13,
    fontWeight: "700",
    color: MUTED,
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  title: {
    fontSize: 34,
    fontWeight: "800",
    color: INK,
    letterSpacing: -0.8,
    lineHeight: 38,
  },
  subtitle: {
    fontSize: 14,
    color: MUTED,
    marginTop: 2,
  },

  /* ── Loading ── */
  loadingBox: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  loadingSpinnerWrap: {
    width: 72,
    height: 72,
    borderRadius: 24,
    backgroundColor: "#e0f2fe",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  loadingTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: INK,
  },
  loadingSubtitle: {
    fontSize: 14,
    color: MUTED,
  },

  /* ── Body ── */
  body: {
    flex: 1,
    paddingTop: 16,
    gap: 12,
  },

  /* ── Banners ── */
  banner: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    marginHorizontal: 16,
    borderRadius: 12,
    padding: 12,
    borderLeftWidth: 3,
  },
  bannerError: {
    backgroundColor: "#fff1f2",
    borderLeftColor: DANGER,
  },
  bannerWarn: {
    backgroundColor: "#fffbeb",
    borderLeftColor: "#f59e0b",
  },
  bannerInfo: {
    backgroundColor: "#f0f9ff",
    borderLeftColor: ACCENT,
  },
  bannerIcon: { fontSize: 15, marginTop: 1 },
  bannerText: {
    flex: 1,
    fontSize: 13,
    color: INK,
    fontWeight: "500",
    lineHeight: 18,
  },

  /* ── Storage card ── */
  storageCard: {
    marginHorizontal: 16,
    backgroundColor: INK,
    borderRadius: 18,
    padding: 18,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: INK,
    shadowOpacity: 0.2,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  storageCardLeft: {
    flex: 1,
    gap: 3,
  },
  storageLabel: {
    color: "#94a3b8",
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  storageAmount: {
    color: "#ffffff",
    fontSize: 32,
    fontWeight: "800",
    letterSpacing: -0.5,
  },
  storageHint: {
    color: "#64748b",
    fontSize: 12,
    lineHeight: 16,
  },
  storageIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: "#1e293b",
    alignItems: "center",
    justifyContent: "center",
  },
  storageIcon: { fontSize: 26 },

  /* ── Category section ── */
  cardsSection: {
    paddingHorizontal: 16,
    gap: 10,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: MUTED,
    letterSpacing: 0.8,
    textTransform: "uppercase",
    marginBottom: 2,
  },
  categoryCard: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 18,
    padding: 14,
    gap: 14,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  unusedCard: {
    backgroundColor: SURFACE,
    borderColor: "#fecdd3",
  },
  recentCard: {
    backgroundColor: SURFACE,
    borderColor: "#bae6fd",
  },
  categoryIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
  },
  unusedIconWrap: { backgroundColor: "#fff1f2" },
  recentIconWrap: { backgroundColor: "#e0f2fe" },
  categoryEmoji: { fontSize: 26 },
  categoryMeta: {
    flex: 1,
    gap: 1,
  },
  categoryCount: {
    fontSize: 26,
    fontWeight: "800",
    color: INK,
    letterSpacing: -0.5,
  },
  categoryLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#334155",
  },
  categoryHint: {
    fontSize: 11.5,
    color: MUTED,
    marginTop: 1,
  },
  chevronWrap: {
    width: 30,
    height: 30,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  unusedChevronWrap: { backgroundColor: "#fff1f2" },
  recentChevronWrap: { backgroundColor: "#e0f2fe" },
  chevron: {
    fontSize: 20,
    color: MUTED,
    fontWeight: "600",
  },

  /* ── Empty state ── */
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingHorizontal: 40,
  },
  emptyIconWrap: {
    width: 88,
    height: 88,
    borderRadius: 28,
    backgroundColor: "#e0f2fe",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 6,
  },
  emptyEmoji: { fontSize: 44 },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: INK,
    textAlign: "center",
  },
  emptySubtitle: {
    fontSize: 14,
    color: MUTED,
    textAlign: "center",
    lineHeight: 20,
  },

  /* ── Scan CTA ── */
  scanWrap: {
    paddingHorizontal: 16,
    paddingBottom: 32,
    gap: 8,
    marginTop: "auto",
  },
  scanBtn: {
    backgroundColor: ACCENT,
    paddingVertical: 15,
    borderRadius: 16,
    alignItems: "center",
    shadowColor: ACCENT,
    shadowOpacity: 0.3,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  scanBtnPressed: {
    opacity: 0.82,
    shadowOpacity: 0.15,
  },
  scanBtnText: {
    color: "#ffffff",
    fontWeight: "800",
    fontSize: 16,
    letterSpacing: 0.2,
  },
  scanCaption: {
    textAlign: "center",
    fontSize: 12,
    color: MUTED,
  },

  pressed: { opacity: 0.72 },
});