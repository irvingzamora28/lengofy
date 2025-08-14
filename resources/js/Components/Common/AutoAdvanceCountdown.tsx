import React, { useEffect, useRef, useState } from "react";

export interface AutoAdvanceCountdownProps {
  seconds?: number; // default 3
  active: boolean;
  onFinish: () => void;
  onCancel?: () => void;
  // If provided, the component will listen for click/touchstart on this element to cancel
  containerRef?: React.RefObject<HTMLElement>;
  // Optional custom label render
  renderLabel?: (remaining: number) => React.ReactNode;
  className?: string; // additional classes for the badge
}

/**
 * AutoAdvanceCountdown
 * - Shows a small badge with a countdown and calls onFinish after the given seconds.
 * - When active and containerRef is provided, any click/touchstart within the container cancels the countdown.
 * - Automatically ignores the first interaction that triggered activation to prevent immediate cancel.
 */
const AutoAdvanceCountdown: React.FC<AutoAdvanceCountdownProps> = ({
  seconds = 3,
  active,
  onFinish,
  onCancel,
  containerRef,
  renderLabel,
  className,
}) => {
  const [remaining, setRemaining] = useState<number>(seconds);
  const intervalRef = useRef<number | null>(null);
  const timeoutRef = useRef<number | null>(null);
  const ignoreNextInteractionRef = useRef<boolean>(false);
  const activeRef = useRef<boolean>(false);

  const clearTimers = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  };

  const cancel = () => {
    if (!activeRef.current) return;
    activeRef.current = false;
    clearTimers();
    setRemaining(seconds);
    onCancel?.();
  };

  // Handle container interaction cancellation
  useEffect(() => {
    const el = containerRef?.current;
    if (!el || !active) return;

    const onInteract = () => {
      if (ignoreNextInteractionRef.current) {
        ignoreNextInteractionRef.current = false;
        return;
      }
      cancel();
    };

    el.addEventListener("click", onInteract, { capture: true });
    el.addEventListener("touchstart", onInteract, { capture: true });
    return () => {
      el.removeEventListener("click", onInteract, { capture: true } as any);
      el.removeEventListener("touchstart", onInteract, { capture: true } as any);
    };
  }, [active, containerRef]);

  // Start/stop on active changes
  useEffect(() => {
    clearTimers();

    if (active) {
      activeRef.current = true;
      setRemaining(seconds);
      ignoreNextInteractionRef.current = true; // ignore the interaction that started activation

      intervalRef.current = window.setInterval(() => {
        setRemaining((r) => Math.max(0, r - 1));
      }, 1000);

      timeoutRef.current = window.setTimeout(() => {
        activeRef.current = false;
        clearTimers();
        setRemaining(seconds);
        onFinish();
      }, seconds * 1000);
    } else {
      activeRef.current = false;
      setRemaining(seconds);
    }

    return () => {
      clearTimers();
    };
  }, [active, seconds, onFinish]);

  if (!active) return null;

  return (
    <div
      className={
        "absolute top-2 right-2 select-none rounded-full bg-gray-900/80 text-white text-xs px-2 py-1 shadow " +
        (className ?? "")
      }
      aria-live="polite"
    >
      {renderLabel ? renderLabel(remaining) : <>Next in {remaining}</>}
    </div>
  );
};

export default AutoAdvanceCountdown;
