"use client";

import React, { useEffect, useRef } from "react";

interface InfiniteScrollSentinelProps {
  onVisible: () => void;
  disabled?: boolean;
  rootMargin?: string;
}

/**
 * Déclenche onVisible quand l'élément entre dans le viewport (scroll infini).
 */
const InfiniteScrollSentinel: React.FC<InfiniteScrollSentinelProps> = ({
  onVisible,
  disabled = false,
  rootMargin = "200px",
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const onVisibleRef = useRef(onVisible);
  onVisibleRef.current = onVisible;

  useEffect(() => {
    if (disabled) return;
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) onVisibleRef.current();
      },
      { rootMargin, threshold: 0 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [disabled, rootMargin]);

  return (
    <div
      ref={ref}
      className="h-4 w-full"
      aria-hidden
    />
  );
};

export default InfiniteScrollSentinel;
