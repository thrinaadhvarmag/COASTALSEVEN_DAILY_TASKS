import { useMemo, useState } from 'react';
import {
  Search,
  SlidersHorizontal,
  RefreshCw,
  LoaderCircle,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import ProductCard from '../components/ProductCard';
import EmptyState from '../components/EmptyState';
import { getErrorMessage } from '../lib/constants';
import { useDebounce } from '../hooks/useDebounce';
import { useInfiniteScroll } from '../hooks/useInfiniteScroll';
import {
  PRODUCTS_PAGE_SIZE,
  useProductCount,
  useProductPage,
  useProducts,
} from '../hooks/useProducts';
export default function Products() {
  const [params, setParams] = useSearchParams();
  const search = params.get('search') || '';
  const currentPage = Math.max(1, Number(params.get('page') || 1));
  const [sort, setSort] = useState('featured');
  const [loadMoreMode, setLoadMoreMode] = useState(false);
  const debouncedSearch = useDebounce(search.trim(), 300);
  const pageQuery = useProductPage(debouncedSearch, currentPage);
  const countQuery = useProductCount(debouncedSearch);
  const infiniteQuery = useProducts(debouncedSearch, currentPage, loadMoreMode);
  const totalProducts = countQuery.data || 0;
  const totalPages = Math.max(1, Math.ceil(totalProducts / PRODUCTS_PAGE_SIZE));
  const pageProducts = pageQuery.data || [];
  const loadedProducts = infiniteQuery.data?.pages?.flatMap((page) => page) || [];
  const products = loadMoreMode ? loadedProducts : pageProducts;
  const visible = useMemo(() => {
    const list = [...products];
    if (sort === 'price-low') list.sort((a, b) => Number(a.price) - Number(b.price));
    if (sort === 'price-high') list.sort((a, b) => Number(b.price) - Number(a.price));
    if (sort === 'name') list.sort((a, b) => a.name.localeCompare(b.name));
    return list;
  }, [products, sort]);
  const error = pageQuery.error || countQuery.error || infiniteQuery.error;
  const loading = pageQuery.isLoading || countQuery.isLoading;
  const updatePage = (page) => {
    const next = Math.min(Math.max(page, 1), totalPages);
    setLoadMoreMode(false);
    setParams(
      debouncedSearch ? { search: debouncedSearch, page: String(next) } : { page: String(next) },
    );
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  const startLoadMore = async () => {
    setLoadMoreMode(true);
    if (!infiniteQuery.isFetchingNextPage && infiniteQuery.hasNextPage) {
      await infiniteQuery.fetchNextPage();
    }
  };
  const clearSearch = () => {
    setLoadMoreMode(false);
    setParams({ page: '1' });
  };
  const loadedPageCount = infiniteQuery.data?.pages?.length || 0;
  const fetchNextPage = infiniteQuery.fetchNextPage;
  const infiniteSentinelRef = useInfiniteScroll({
    enabled: loadMoreMode,
    hasNextPage: infiniteQuery.hasNextPage,
    isFetching: infiniteQuery.isFetchingNextPage,
    onLoadMore: fetchNextPage,
  });
  const canLoadMore = loadMoreMode && infiniteQuery.hasNextPage;
  const firstPage = Math.max(1, Math.min(totalPages - 4, currentPage - 2));
  const pageNumbers = Array.from(
    { length: Math.min(5, totalPages) },
    (_, index) => firstPage + index,
  ).filter((p) => p <= totalPages);
  return (
    <div className="container page-section">
      <div className="page-heading">
        <div>
          <div className="eyebrow">Catalog</div>
          <h1>Find your next favorite.</h1>
          <p>Search, compare and add products without the clutter.</p>
        </div>

        <div className="catalog-count">
          {totalProducts} product{totalProducts === 1 ? '' : 's'} ·{' '}
          {loadMoreMode
            ? `${loadedProducts.length} loaded`
            : `Page ${currentPage} of ${totalPages}`}
        </div>
      </div>

      <div className="filter-bar">
        <div className="search-box">
          <Search size={18} />

          <input
            value={search}
            onChange={(e) => {
              const value = e.target.value;
              setLoadMoreMode(false);
              setParams(value ? { search: value, page: '1' } : { page: '1' });
            }}
            placeholder="Search products…"
            aria-label="Search products"
          />
        </div>

        <div className="select-wrap">
          <SlidersHorizontal size={17} />
          <select value={sort} onChange={(e) => setSort(e.target.value)} aria-label="Sort products">
            <option value="featured">Featured</option>
            <option value="price-low">Price: low to high</option>
            <option value="price-high">Price: high to low</option>
            <option value="name">Name</option>
          </select>
        </div>

        <button
          className="icon-btn"
          onClick={() => {
            pageQuery.refetch();
            countQuery.refetch();
            infiniteQuery.refetch();
          }}
          title="Refresh"
          aria-label="Refresh products"
        >
          <RefreshCw size={17} />
        </button>
      </div>

      {error && <div className="alert error">{getErrorMessage(error)}</div>}

      {loading ? (
        <div className="product-grid">
          {Array.from({ length: 8 }).map((_, i) => (
            <div className="skeleton-card" key={i} />
          ))}
        </div>
      ) : visible.length === 0 ? (
        <EmptyState
          icon={Search}
          title="No products found"
          text="Try a different search or clear your filters."
          action={
            <button className="btn-secondary" onClick={clearSearch}>
              Clear search
            </button>
          }
        />
      ) : (
        <>
          <div className="product-grid">
            {visible.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>

          <div className="catalog-pagination" aria-label="Product navigation">
            <div className="pagination-info">
              {loadMoreMode
                ? `Loaded ${loadedProducts.length} of ${totalProducts}`
                : `Showing page ${currentPage} · ${pageProducts.length} products`}
            </div>

            <div className="pagination-actions">
              <button
                className="btn-secondary small"
                onClick={() => updatePage(currentPage - 1)}
                disabled={currentPage === 1}
                aria-label="Previous page"
              >
                <ChevronLeft size={16} />
                Previous
              </button>

              <div className="page-numbers">
                {pageNumbers.map((page) => (
                  <button
                    key={page}
                    className={`page-number ${page === currentPage && !loadMoreMode ? 'active' : ''}`}
                    onClick={() => updatePage(page)}
                    aria-current={page === currentPage && !loadMoreMode ? 'page' : undefined}
                  >
                    {page}
                  </button>
                ))}
              </div>

              <button
                className="btn-secondary small"
                onClick={() => updatePage(currentPage + 1)}
                disabled={currentPage === totalPages}
                aria-label="Next page"
              >
                Next
                <ChevronRight size={16} />
              </button>
            </div>
          </div>

          <div className="load-more-panel">
            <div>
              <strong>Prefer browsing continuously?</strong>

              <span>Load the next {PRODUCTS_PAGE_SIZE} products without leaving this page.</span>
            </div>

            <button
              className="btn-primary"
              onClick={() => (canLoadMore ? infiniteQuery.fetchNextPage() : startLoadMore())}
              disabled={
                infiniteQuery.isFetchingNextPage || (loadMoreMode && !infiniteQuery.hasNextPage)
              }
            >
              {infiniteQuery.isFetchingNextPage ? (
                <>
                  <LoaderCircle className="spin" size={17} />
                  Loading…
                </>
              ) : loadMoreMode && !infiniteQuery.hasNextPage ? (
                'All products loaded'
              ) : (
                `Load ${PRODUCTS_PAGE_SIZE} more products`
              )}
            </button>
          </div>

          {loadMoreMode && (
            <div ref={infiniteSentinelRef} className="infinite-loader" aria-live="polite">
              {infiniteQuery.isFetchingNextPage && (
                <>
                  <LoaderCircle className="spin" size={18} />
                  Loading more products…
                </>
              )}
              {!infiniteQuery.isFetchingNextPage && !infiniteQuery.hasNextPage && (
                <span>You&apos;ve reached the end of the catalog.</span>
              )}
              {!infiniteQuery.isFetchingNextPage && infiniteQuery.hasNextPage && (
                <span>
                  {loadedPageCount} page{loadedPageCount === 1 ? '' : 's'} loaded · the next page
                  loads automatically as you approach the end
                </span>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
