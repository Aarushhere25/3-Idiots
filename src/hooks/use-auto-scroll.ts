"use client";

import { useEffect, useRef } from "react";

export function useAutoScroll<T>(dependency: T) {
  const endRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [dependency]);

  return endRef;
}
