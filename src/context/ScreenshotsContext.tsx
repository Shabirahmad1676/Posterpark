import React, { createContext, useContext } from "react";
import { useScreenshots } from "../hooks/useScreenshots";

type ScreenshotsContextValue = ReturnType<typeof useScreenshots>;

const ScreenshotsContext = createContext<ScreenshotsContextValue | null>(null);

export function ScreenshotsProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const value = useScreenshots();
  return (
    <ScreenshotsContext.Provider value={value}>
      {children}
    </ScreenshotsContext.Provider>
  );
}

export function useScreenshotsContext(): ScreenshotsContextValue {
  const ctx = useContext(ScreenshotsContext);
  if (!ctx) {
    throw new Error(
      "useScreenshotsContext must be used inside ScreenshotsProvider",
    );
  }
  return ctx;
}
