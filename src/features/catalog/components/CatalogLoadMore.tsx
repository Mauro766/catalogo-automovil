import { useEffect, useRef } from 'react';

interface CatalogLoadMoreProps {
  hasMore: boolean;
  loading: boolean;
  loadingMore: boolean;
  error: string | null;
  onLoadMore: () => void;
  onRetry: () => void;
}

export const CatalogLoadMore = ({
  hasMore,
  loading,
  loadingMore,
  error,
  onLoadMore,
  onRetry,
}: CatalogLoadMoreProps) => {
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || !hasMore || loading || loadingMore || error) {
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          onLoadMore();
        }
      },
      { rootMargin: '500px 0px' },
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [error, hasMore, loading, loadingMore, onLoadMore]);

  if (error) {
    return (
      <div className="dp-catalog-load-more" role="alert">
        <p>{error}</p>
        <button type="button" className="dp-btn-outline" onClick={onRetry}>
          Reintentar
        </button>
      </div>
    );
  }

  return (
    <div
      className="dp-catalog-load-more"
      ref={sentinelRef}
      role={loadingMore ? 'status' : undefined}
      aria-live="polite"
    >
      {loadingMore
        ? <p>Cargando más vehículos…</p>
        : !hasMore && <p>Ya viste todos los vehículos disponibles.</p>}
    </div>
  );
};
