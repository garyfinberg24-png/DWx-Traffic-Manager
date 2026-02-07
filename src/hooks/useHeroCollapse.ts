/**
 * DWx Traffic Manager - Hero Collapse Hook
 * Manages collapse/expand state for hero banners with localStorage persistence.
 * Each page gets its own key; a global default can override initial state.
 */

import { useState, useCallback } from 'react';

const PAGE_KEY_PREFIX = 'dwx-hero-collapsed-';
const GLOBAL_DEFAULT_KEY = 'dwx-hero-default-minimised';

function getInitialState(pageId: string): boolean {
  try {
    const pageValue = localStorage.getItem(`${PAGE_KEY_PREFIX}${pageId}`);
    if (pageValue !== null) return pageValue === 'true';

    const globalDefault = localStorage.getItem(GLOBAL_DEFAULT_KEY);
    if (globalDefault !== null) return globalDefault === 'true';
  } catch {
    // localStorage unavailable (SSR, private browsing)
  }
  return false;
}

export function useHeroCollapse(pageId: string) {
  const [isCollapsed, setIsCollapsed] = useState(() => getInitialState(pageId));

  const persist = useCallback(
    (value: boolean) => {
      try {
        localStorage.setItem(`${PAGE_KEY_PREFIX}${pageId}`, String(value));
      } catch {
        // Silent fail
      }
    },
    [pageId]
  );

  const toggle = useCallback(() => {
    setIsCollapsed((prev) => {
      const next = !prev;
      persist(next);
      return next;
    });
  }, [persist]);

  const collapse = useCallback(() => {
    setIsCollapsed(true);
    persist(true);
  }, [persist]);

  const expand = useCallback(() => {
    setIsCollapsed(false);
    persist(false);
  }, [persist]);

  return { isCollapsed, toggle, collapse, expand };
}
