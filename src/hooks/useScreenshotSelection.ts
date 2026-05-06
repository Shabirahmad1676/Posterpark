import { useCallback, useState } from "react";

export function useScreenshotSelection(unusedIds: string[]) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

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
    setSelectedIds(new Set(unusedIds));
  }, [unusedIds]);

  const deselectAll = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  const removeFromSelection = useCallback((id: string) => {
    setSelectedIds((prev) => {
      if (!prev.has(id)) return prev;
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  }, []);

  return {
    selectedIds,
    toggleSelect,
    selectAll,
    deselectAll,
    removeFromSelection,
  };
}
