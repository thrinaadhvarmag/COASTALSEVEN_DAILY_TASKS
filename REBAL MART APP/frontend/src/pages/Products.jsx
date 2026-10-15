import { useMemo, useState } from "react";
import { Search, SlidersHorizontal, RefreshCw, LoaderCircle, ChevronLeft, ChevronRight, Film, X } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import ProductCard from "../components/ProductCard";
import EmptyState from "../components/EmptyState";
import MovieUniverseFilter, { MOVIES } from "../components/MovieUniverseFilter";
import { getErrorMessage } from "../lib/constants";
import { useDebounce } from "../hooks/useDebounce";
import { useInfiniteScroll } from "../hooks/useInfiniteScroll";
import { PRODUCTS_PAGE_SIZE, useProductCount, useProductPage, useProducts } from "../hooks/useProducts";
import { MOCK_PRABHAS_PRODUCTS } from "../lib/mockProducts";

export default function Products() {
  const [params, setParams] = useSearchParams();
  const search = params.get("search") || "";
  const currentPage = Math.max(1, Number(params.get("page") || 1));
  const [sort, setSort] = useState("featured");
  const [loadMoreMode, setLoadMoreMode] = useState(false);
  const [wishlistOnly, setWishlistOnly] = useState(false);
  const [inStockOnly, setInStockOnly] = useState(false);
  const [wishlistVersion, setWishlistVersion] = useState(0);
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  const debouncedSearch = useDebounce(search.trim(), 300);
  const pageQuery = useProductPage(debouncedSearch, currentPage);
  const countQuery = useProductCount(debouncedSearch);
  const infiniteQuery = useProducts(debouncedSearch, currentPage, loadMoreMode);

  const pageProducts = pageQuery.data && pageQuery.data.length > 0 ? pageQuery.data : MOCK_PRABHAS_PRODUCTS;
  const loadedProducts = infiniteQuery.data?.pages?.flatMap((page) => page) || [];
  const products = loadMoreMode ? (loadedProducts.length > 0 ? loadedProducts : MOCK_PRABHAS_PRODUCTS) : pageProducts;
  const totalProducts = countQuery.data || products.length;
  const totalPages = Math.max(1, Math.ceil(totalProducts / PRODUCTS_PAGE_SIZE));

  const wishlistIds = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem("rebel_mart_wishlist") || "[]").map(Number);
    } catch {
      return [];
    }
  }, [wishlistVersion]);

  const visible = useMemo(() => {
    let list = [...products].filter((product) => {
      if (wishlistOnly && !wishlistIds.includes(Number(product.id))) return false;
      if (inStockOnly && Number(product.stock || 0) <= 0) return false;
      return true;
    });

    if (sort === "price-low") list.sort((a, b) => Number(a.price) - Number(b.price));
    if (sort === "price-high") list.sort((a, b) => Number(b.price) - Number(a.price));
    if (sort === "name") list.sort((a, b) => a.name.localeCompare(b.name));
    return list;
  }, [products, sort, wishlistOnly, inStockOnly, wishlistIds]);

  const error = pageQuery.error || countQuery.error || infiniteQuery.error;
  const loading = pageQuery.isLoading || countQuery.isLoading;

  const updatePage = (page) => {
    const next = Math.min(Math.max(page, 1), totalPages);
    setLoadMoreMode(false);
    setParams(
      debouncedSearch
        ? { search: debouncedSearch, page: String(next) }
        : { page: String(next) },
    );
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const clearSearch = () => {
    setLoadMoreMode(false);
    setWishlistOnly(false);
    setInStockOnly(false);
    setParams({ page: "1" });
  };

  const handleMovieFilter = (query) => {
    setLoadMoreMode(false);
    setParams(query ? { search: query, page: "1" } : { page: "1" });
  };

  const loadedPageCount = infiniteQuery.data?.pages?.length || 0;
  const fetchNextPage = infiniteQuery.fetchNextPage;
  const infiniteSentinelRef = useInfiniteScroll({
    enabled: loadMoreMode,
    hasNextPage: infiniteQuery.hasNextPage,
    isFetching: infiniteQuery.isFetchingNextPage,
    onLoadMore: fetchNextPage,
  });

  const firstPage = Math.max(1, Math.min(totalPages - 4, currentPage - 2));
  const pageNumbers = Array.from({ length: Math.min(5, totalPages) }, (_, index) => firstPage + index).filter((p) => p <= totalPages);

  return (
    <div className="container page-section">
      <div className="page-heading">
        <div>
          <span className="eyebrow">Official Rebel Star Merchandise</span>
          <h1>All Cinema Collections</h1>
          <p>Explore official fanwear, posters, hoodies and collectibles across every Prabhas blockbuster.</p>
        </div>

        <div className="catalog-count">
          {totalProducts} product{totalProducts === 1 ? "" : "s"} · {loadMoreMode ? `${loadedProducts.length} loaded` : `Page ${currentPage} of ${totalPages}`}
        </div>
      </div>

      {/* Movie Universe Quick Filter Chips */}
      <MovieUniverseFilter selected={search} onSelect={handleMovieFilter} />

      <div className="catalog-layout">
        {/* Left Filter Sidebar */}
        <aside className={`catalog-sidebar ${mobileFilterOpen ? "mobile-filter-drawer-open" : ""}`}>
          <div className="catalog-filter-heading">
            <strong>Filter Catalog</strong>
            <button type="button" onClick={clearSearch}>Reset filters</button>
          </div>

          {/* Movie Universe Filter in Sidebar */}
          <section className="catalog-filter-group">
            <h3>Cinema Universe</h3>
            {MOVIES.filter((m) => m.id !== "all").map((movie) => {
              const isChecked = search.toLowerCase().includes(movie.id) || search.toLowerCase().includes(movie.query?.toLowerCase() || "");
              return (
                <label key={movie.id} className="catalog-filter-option">
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => {
                      setLoadMoreMode(false);
                      setParams(isChecked ? { page: "1" } : { search: movie.query || movie.name, page: "1" });
                    }}
                  />
                  <span>{movie.name}</span>
                </label>
              );
            })}
          </section>

          {/* Category Filter */}
          <section className="catalog-filter-group">
            <h3>Categories</h3>
            {["T-Shirts", "Hoodies", "Posters", "Collectibles", "Accessories"].map((category) => {
              const isChecked = search.toLowerCase() === category.toLowerCase();
              return (
                <label key={category} className="catalog-filter-option">
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => {
                      setLoadMoreMode(false);
                      setParams(isChecked ? { page: "1" } : { search: category, page: "1" });
                    }}
                  />
                  <span>{category}</span>
                </label>
              );
            })}
          </section>

          {/* Availability & Wishlist */}
          <section className="catalog-filter-group">
            <h3>Preferences</h3>
            <label className="catalog-filter-option">
              <input
                type="checkbox"
                checked={inStockOnly}
                onChange={(e) => setInStockOnly(e.target.checked)}
              />
              <span>In stock items only</span>
            </label>
            <label className="catalog-filter-option">
              <input
                type="checkbox"
                checked={wishlistOnly}
                onChange={(e) => {
                  setWishlistOnly(e.target.checked);
                  setWishlistVersion((v) => v + 1);
                }}
              />
              <span>Show saved wishlist ({wishlistIds.length})</span>
            </label>
          </section>

          {/* Customer Rating */}
          <section className="catalog-filter-group">
            <h3>Authenticity & Rating</h3>
            <div className="catalog-rating">★★★★★ <span>Top Rated by Fans</span></div>
            <p className="catalog-filter-muted">100% Licensed Rebel Star Cinema Art</p>
          </section>
        </aside>

        {/* Main Products Grid Column */}
        <div className="catalog-main">
          <div className="filter-bar">
            <div className="search-box">
              <Search size={18} />
              <input
                value={search}
                onChange={(e) => {
                  const value = e.target.value;
                  setLoadMoreMode(false);
                  setParams(value ? { search: value, page: "1" } : { page: "1" });
                }}
                placeholder="Search Salaar tees, Kalki hoodies, posters…"
                aria-label="Search products"
              />
              {search && (
                <button type="button" onClick={() => setParams({ page: "1" })} aria-label="Clear search">
                  <X size={16} />
                </button>
              )}
            </div>

            <div className="select-wrap">
              <SlidersHorizontal size={17} />
              <select value={sort} onChange={(e) => setSort(e.target.value)} aria-label="Sort products">
                <option value="featured">Featured Picks</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
                <option value="name">Product Name (A-Z)</option>
              </select>
            </div>

            <button
              className="icon-btn"
              onClick={() => {
                pageQuery.refetch();
                countQuery.refetch();
                infiniteQuery.refetch();
              }}
              title="Refresh Catalog"
              aria-label="Refresh products"
            >
              <RefreshCw size={17} />
            </button>
          </div>

          {error && <div className="alert error">{getErrorMessage(error)}</div>}

          {loading ? (
            <div className="product-grid">
              {Array.from({ length: 6 }).map((_, i) => <div className="skeleton-card" key={i} />)}
            </div>
          ) : visible.length === 0 ? (
            <EmptyState
              icon={Search}
              title="No products found"
              text="We couldn't find matching merchandise for your search. Try another movie or clear your filters."
              action={
                <button className="btn-primary" onClick={clearSearch}>
                  Clear all filters
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

              {/* Pagination Controls */}
              <div className="catalog-pagination" aria-label="Product navigation">
                <div className="pagination-info">
                  {loadMoreMode
                    ? `Loaded ${loadedProducts.length} of ${totalProducts}`
                    : `Showing ${pageProducts.length} of ${totalProducts} products · Page ${currentPage} of ${totalPages}`}
                </div>

                <div className="pagination-actions">
                  <button
                    className="btn-secondary small"
                    onClick={() => updatePage(currentPage - 1)}
                    disabled={currentPage === 1}
                    aria-label="Previous page"
                  >
                    <ChevronLeft size={16} /> Previous
                  </button>

                  <div className="page-numbers" aria-label="Choose page">
                    {pageNumbers.map((page) => (
                      <button
                        key={page}
                        className={`page-number ${page === currentPage && !loadMoreMode ? "active" : ""}`}
                        onClick={() => updatePage(page)}
                        aria-current={page === currentPage && !loadMoreMode ? "page" : undefined}
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
                    Next <ChevronRight size={16} />
                  </button>
                </div>
              </div>

              {loadMoreMode && (
                <div ref={infiniteSentinelRef} className="infinite-loader" aria-live="polite">
                  {infiniteQuery.isFetchingNextPage ? (
                    <>
                      <LoaderCircle className="spin" size={18} /> Loading more merchandise…
                    </>
                  ) : !infiniteQuery.hasNextPage ? (
                    <span>You&apos;ve reached the end of the Rebel Mart catalog.</span>
                  ) : (
                    <span>{loadedPageCount} pages loaded.</span>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
