import React, { useEffect, useMemo, useRef, useState } from 'react';

interface ReelProps<T> {
  items: T[];
  itemToLabel: (item: T) => string;
  stopIndex?: number | null; // index to land on
  spinTrigger?: number; // changing this value triggers a spin
  height?: number; // px
  durationMs?: number; // spin duration
}

/**
 * Simple vertical reel: renders items stacked vertically in a tall column and animates translateY
 * to land on the desired stopIndex. Not physics-accurate, but smooth and deterministic.
 */
export default function Reel<T>({
  items,
  itemToLabel,
  stopIndex = null,
  spinTrigger = 0,
  height = 48,
  durationMs = 1200,
}: ReelProps<T>) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [offset, setOffset] = useState(0);
  const [spinning, setSpinning] = useState(false);

  const totalHeight = useMemo(() => items.length * height, [items.length, height]);

  useEffect(() => {
    if (stopIndex == null || items.length === 0) return;
    // Perform a spin by animating to the target item plus a few extra loops
    const loops = 3; // number of extra full scrolls
    const targetOffset = -(stopIndex * height) - (loops * totalHeight);
    // Trigger layout so transition applies
    requestAnimationFrame(() => {
      setSpinning(true);
      setOffset(targetOffset);
      setTimeout(() => {
        // After animation, normalize offset to exact position (without loops)
        setSpinning(false);
        setOffset(-(stopIndex * height));
      }, durationMs + 50);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [spinTrigger]);

  return (
    <div
      ref={containerRef}
      className="overflow-hidden rounded border bg-white dark:bg-gray-800 dark:border-gray-700 w-full sm:w-[180px] md:w-[220px] lg:w-[260px]"
      style={{ height: `${height}px` }}
      aria-live="polite"
    >
      <div
        style={{
          transform: `translateY(${offset}px)`,
          transition: spinning ? `transform ${durationMs}ms cubic-bezier(0.2, 0.8, 0.2, 1)` : 'none',
        }}
      >
        {/* Render items several times to allow loops feeling */}
        {[...Array(4)].map((_, k) => (
          <div key={k}>
            {items.map((it, i) => (
              <div
                key={`${k}-${i}`}
                className="flex items-center justify-center font-semibold text-sm sm:text-xl md:text-2xl text-gray-800 dark:text-gray-100"
                style={{ height: `${height}px`, padding: '2px 0' }}
              >
                {itemToLabel(it)}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
