import { useEffect, useRef } from "react";

/**
 * Calls onLoadMore when the sentinel enters the viewport. The hook is enabled
 * only for the catalog's Load More/infinite-browsing mode, so normal numbered
 * pagination remains fully user-controlled.
 */
export function useInfiniteScroll({ enabled, hasNextPage, isFetching, onLoadMore, rootMargin = "300px" }) {
  const sentinelRef = useRef(null);

  useEffect(() => {
    if (!enabled || !hasNextPage || !sentinelRef.current) return undefined;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && !isFetching) onLoadMore();
      },
      { rootMargin, threshold: 0.01 },
    );

    observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [enabled, hasNextPage, isFetching, onLoadMore, rootMargin]);

  return sentinelRef;
}
