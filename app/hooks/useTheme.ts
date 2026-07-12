'use client';
import { useState, useEffect, useCallback } from 'react';

type Theme = 'light' | 'dark';

/**
 * useTheme — TransitOps dark-mode hook
 *
 * Priority order:
 *   1. Value saved in localStorage ('theme' key)
 *   2. OS / browser prefers-color-scheme media query
 *   3. Falls back to 'light'
 *
 * Sets `data-theme` attribute on <html> so that CSS custom-property
 * token blocks ([data-theme="dark"]) in globals.css activate correctly.
 *
 * SSR-safe: DOM access is deferred to useEffect so the hook can be
 * imported by server-rendered pages without throwing.
 */
export function useTheme() {
  // SSR-safe initial state — always 'light' on first render to match
  // what the server would produce, avoiding a hydration mismatch.
  const [theme, setThemeState] = useState<Theme>('light');

  useEffect(() => {
    // Resolve the true initial theme once we're in the browser.
    const saved = localStorage.getItem('theme') as Theme | null;
    const system: Theme = window.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light';
    const initial = saved ?? system;

    setThemeState(initial);
    document.documentElement.setAttribute('data-theme', initial);
  }, []);

  /**
   * setTheme — apply a specific theme.
   * Updates React state, persists to localStorage, and writes the
   * data-theme attribute so CSS tokens switch immediately.
   */
  const setTheme = useCallback((t: Theme) => {
    setThemeState(t);
    localStorage.setItem('theme', t);
    document.documentElement.setAttribute('data-theme', t);
  }, []);

  /**
   * toggle — flip between 'light' and 'dark'.
   */
  const toggle = useCallback(() => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  }, [theme, setTheme]);

  return { theme, toggle, setTheme };
}
