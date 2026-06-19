"use client";

import { useEffect, useRef, useCallback } from "react";
import { SESSION_INACTIVITY_TIMEOUT_MS } from "@/lib/constants";

const ACTIVITY_EVENTS = [
  "mousedown",
  "mousemove",
  "keydown",
  "scroll",
  "touchstart",
  "click",
  "pointermove",
] as const;

interface UseSessionTimeoutOptions {
  onTimeout: () => void;
  enabled?: boolean;
}

/**
 * Tracks user activity and calls onTimeout when the user has been idle
 * for SESSION_INACTIVITY_TIMEOUT_MS (default 10 minutes).
 *
 * Attaches passive event listeners to document — no re-renders on activity.
 */
export function useSessionTimeout({
  onTimeout,
  enabled = true,
}: UseSessionTimeoutOptions) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onTimeoutRef = useRef(onTimeout);
  onTimeoutRef.current = onTimeout;

  const resetTimer = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      onTimeoutRef.current();
    }, SESSION_INACTIVITY_TIMEOUT_MS);
  }, []);

  useEffect(() => {
    if (!enabled) return;

    resetTimer();

    const handler = () => resetTimer();

    ACTIVITY_EVENTS.forEach((event) => {
      document.addEventListener(event, handler, { passive: true });
    });

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      ACTIVITY_EVENTS.forEach((event) => {
        document.removeEventListener(event, handler);
      });
    };
  }, [enabled, resetTimer]);
}
