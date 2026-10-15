import { memo, useCallback, useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, ChevronRight, Heart, ShieldCheck, Sparkles, Truck, Headphones, ShoppingBag, Star, BadgePercent, Flame, Trophy, Film } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import ProductCard from "../components/ProductCard";
import MovieUniverseFilter from "../components/MovieUniverseFilter";
import { useProductPage } from "../hooks/useProducts";
import api from "../services/api";
import { imageUrl } from "../lib/constants";
import { MOCK_PRABHAS_PRODUCTS } from "../lib/mockProducts";

const CAMPAIGNS = [
  {
    image: "/events/saaho.webp",
    label: "THE REBEL COLLECTION",
    title: "Legends Never Fade.",
    copy: "Iconic merchandise celebrating Indian Cinema's powerhouse Rebel Star Prabhas. Streetwear, posters and collectibles designed for true fans.",
    cta: "Shop the Collection"
  },
  {
    image: "/events/rajasaab.webp",
    label: "UPCOMING BLOCKBUSTER",
    title: "The Raja Saab Era.",
    copy: "Step into vintage royal swagger and supernatural mystery with exclusive early-edition fanwear.",
    cta: "Explore Raja Saab Drops"
  },
  {
    image: "/events/darling.webp",
    label: "TIMELESS CLASSIC",
    title: "Style With A Story.",
    copy: "Celebrate the iconic cinematic moments that built the greatest fandom in Indian cinema history.",
    cta: "Discover Fan Favourites"
  },
];

const CATEGORIES = [
  { name: "T-Shirts", sub: "Heavyweight Graphic Tees", image: "/categories/tshirts.webp", search: "T-Shirts" },
  { name: "Hoodies", sub: "Premium Streetwear Fleece", image: "/categories/hoodies.jpeg", search: "Hoodies" },
  { name: "Posters & Frames", sub: "High-Gloss Cinema Art", image: "/categories/posters.jpg", search: "Posters" },
  { name: "Collectibles", sub: "Action Figures & Keepsakes", image: "/categories/collectibles.jpg", search: "Collectibles" },
];

const HeroCarousel = memo(function HeroCarousel({ campaigns = CAMPAIGNS }) {
  const [active, setActive] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(() => setActive((v) => (v + 1) % campaigns.length), 6500);
    return () => window.clearInterval(timer);
  }, [campaigns.length]);

  const move = useCallback(
    (delta) => setActive((v) => (v + delta + campaigns.length) % campaigns.length),
    [campaigns.length],
  );

  const item = campaigns[active] || CAMPAIGNS[0];

  return (
    <section className="rm-campaign" aria-label="Featured Rebel Mart collections">
      <img
        key={item.image}
        className="rm-campaign-image"
        src={item.image?.startsWith("/uploads/") ? imageUrl(item.image) : item.image}
        alt="Featured Rebel Mart fan collection"
        fetchPriority="high"
      />
      <div className="rm-campaign-overlay" />
      <div className="rm-campaign-copy">
        <span className="rm-campaign-kicker">
          <Sparkles size={14} /> {item.label}
        </span>
        <h1>{item.title}</h1>
        <p>{item.copy}</p>
        <Link className="rm-pill-button" to="/products">
          {item.cta} <ArrowRight size={17} />
        </Link>
      </div>

      <button className="rm-campaign-arrow rm-prev" onClick={() => move(-1)} aria-label="Previous banner">
        <ArrowLeft size={18} />
      </button>
      <button className="rm-campaign-arrow rm-next" onClick={() => move(1)} aria-label="Next banner">
        <ArrowRight size={18} />
      </button>

      <div className="rm-campaign-dots">
        {campaigns.map((c, i) => (
          <button
            key={c.label || i}
            className={i === active ? "active" : ""}
            onClick={() => setActive(i)}
            aria-label={`Show campaign ${i + 1}`}
          />
        ))}
      </div>
    </section>
  );
});

function SectionTitle({ eyebrow, title, description, to = "/products", action = "View all" }) {
  return (
    <div className="rm-section-title">
      <div>
        <span>{eyebrow}</span>
        <h2>{title}</h2>
        {description && <p>{description}</p>}
      </div>
      <Link to={to}>
        {action} <ChevronRight size={17} />
      </Link>
    </div>
  );
}

function Benefits({ items }) {
  const icons = [Truck, ShieldCheck, BadgePercent, Headphones];
  return (
    <section className="rm-benefits" aria-label="Shopping benefits">
      {items.map((item, index) => {
        const Icon = icons[index % icons.length];
        return (
          <div key={`${item.title}-${index}`}>
            <span><Icon size={20} /></span>
            <div>
              <strong>{item.title}</strong>
              <small>{item.description}</small>
            </div>
          </div>
        );
      })}
    </section>
  );
}

const DEFAULT_CONTENT = {
  promo: { headline: "✦ REBEL STAR PRABHAS FAN FEST", message: "Official movie merchandise & collectibles", cta: "Shop the collection" },
  sale: {
    eyebrow: "PRABHAS BIRTHDAY SEASON CELEBRATION",
    title: "Celebrate The Rebel Star.",
    description: "Enjoy flat 23% off every authentic cinema merchandise product storewide. Instant discounts applied across the catalog.",
  },
  offers: [
    { label: "WELCOME OFFER", discount: "10% OFF", description: "On orders of ₹999 or more", code: "WELCOME10", hint: "Enter code at checkout" },
    { label: "FAN FEST SPECIAL", discount: "15% OFF", description: "On orders of ₹1,999 or more", code: "REBEL15", hint: "Enter code at checkout" },
  ],
  categoriesTitle: { eyebrow: "EXPLORE THE CATALOG", title: "Shop By Category", description: "Your favourite cinema essentials, engineered for comfort and durability." },
  categories: CATEGORIES,
  benefits: [
    { title: "Pan-India Express Delivery", description: "Fast dispatch with step-by-step live tracking" },
    { title: "100% Authentic Merch", description: "Official cinema licensing and high-grade prints" },
    { title: "Special Fan Coupons", description: "Save big on every order with seasonal deals" },
    { title: "24/7 Fan Care Support", description: "Friendly live assistance whenever you need help" },
  ],
  featuredTitle: { eyebrow: "PRABHAS BLOCKBUSTERS", title: "Trending Top Picks", description: "Most coveted pieces in the Rebel community right now." },
  editorial: {
    eyebrow: "CRAFTED FOR THE REBELVERSE",
    title: "More than merch.\nIt's a cinematic statement.",
    description: "From the raw violence of Khansaar in Salaar to the futuristic epic of Kalki 2898 AD and royal glory of Mahishmati in Baahubali — wear your cinema pride wherever you go.",
    cta: "Explore the Collection",
    image: "/events/mirchi.webp",
    sticker: "Official\nFanwear",
  },
  bestTitle: { eyebrow: "COMMUNITY FAVORITES", title: "Best Sellers", description: "Crowd favourites that Rebel fans keep coming back to.", badge: "Top Seller" },
  newsletter: {
    eyebrow: "JOIN THE REBEL CLUB",
    title: "Never miss a drop.",
    description: "Be the first to hear about upcoming movie drops, limited edition figurines, and VIP fan club discounts.",
    cta: "Join Rebel Club Free",
  },
};

function mergeContent(data) {
  return {
    ...DEFAULT_CONTENT,
    ...(data || {}),
    promo: { ...DEFAULT_CONTENT.promo, ...(data?.promo || {}) },
    sale: { ...DEFAULT_CONTENT.sale, ...(data?.sale || {}) },
    categoriesTitle: { ...DEFAULT_CONTENT.categoriesTitle, ...(data?.categoriesTitle || {}) },
    editorial: { ...DEFAULT_CONTENT.editorial, ...(data?.editorial || {}) },
    bestTitle: { ...DEFAULT_CONTENT.bestTitle, ...(data?.bestTitle || {}) },
    newsletter: { ...DEFAULT_CONTENT.newsletter, ...(data?.newsletter || {}) },
    offers: data?.offers?.length === 2 ? data.offers : DEFAULT_CONTENT.offers,
    categories: data?.categories?.length ? data.categories : CATEGORIES,
    benefits: data?.benefits?.length ? data.benefits : DEFAULT_CONTENT.benefits,
  };
}

export default function Home() {
  const { data: remoteProducts = [], isLoading, isError } = useProductPage("", 1);
  const products = remoteProducts && remoteProducts.length > 0 ? remoteProducts : MOCK_PRABHAS_PRODUCTS;
  const [content, setContent] = useState(mergeContent());
  const navigate = useNavigate();
  const featured = products.slice(0, 6);
  const bestSellers = products.slice(6, 10).length ? products.slice(6, 10) : products.slice(0, 4);
  const topPicksRef = useRef(null);

  const scrollTopPicks = useCallback((direction) => {
    const node = topPicksRef.current;
    if (!node) return;
    node.scrollBy({ left: direction * (node.clientWidth * 0.72), behavior: "smooth" });
  }, []);

  useEffect(() => {
    let alive = true;
    api.get("/homepage/content").then(({ data }) => {
      if (alive) setContent(mergeContent(data));
    }).catch(() => {});
    return () => { alive = false; };
  }, []);

  const handleMovieSelect = (query) => {
    navigate(query ? `/products?search=${encodeURIComponent(query)}` : "/products");
  };

  const c = content;

  return (
    <div className="rm-store-home">
      {/* Top Banner Carousel */}
      <HeroCarousel campaigns={c.campaigns?.length ? c.campaigns : CAMPAIGNS} />

      {/* Movie Universe Filter Bar */}
      <div className="container" style={{ marginTop: "24px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
          <span className="eyebrow" style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <Film size={14} /> Cinema Universes
          </span>
          <Link to="/products" style={{ fontSize: "12px", color: "var(--accent)", fontWeight: "700" }}>
            Browse All Films →
          </Link>
        </div>
        <MovieUniverseFilter onSelect={handleMovieSelect} />
      </div>

      {/* Benefits Strip */}
      <div className="rm-benefits-wrap">
        <Benefits items={c.benefits} />
      </div>

      {/* Prabhas Birthday Season Sale */}
      <section className="rm-sale-offers" aria-label="Birthday sale offers">
        <div className="rm-sale-offers-inner">
          <div className="rm-sale-offers-intro">
            <span className="rm-sale-eyebrow">
              <BadgePercent size={15} /> {c.sale.eyebrow}
            </span>
            <h2>{c.sale.title}</h2>
            <p>{c.sale.description}</p>
          </div>
          {c.offers.map((offer, index) => (
            <article className={`rm-offer-card ${index === 1 ? "rm-offer-featured" : ""}`} key={offer.code}>
              <span className="rm-offer-pill">{offer.label}</span>
              <strong>{offer.discount}</strong>
              <p>{offer.description}</p>
              <div className="rm-offer-code">
                <code>{offer.code}</code>
                <span>{offer.hint}</span>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* Shop by Category */}
      <section className="rm-home-section">
        <div className="container">
          <SectionTitle {...c.categoriesTitle} />
          <div className="rm-category-grid">
            {c.categories.map((category, index) => (
              <Link
                className="rm-category-card"
                to={`/products?search=${encodeURIComponent(category.search || category.name)}`}
                key={`${category.name}-${index}`}
              >
                <div className="rm-category-image">
                  <img
                    src={category.image?.startsWith("/uploads/") ? imageUrl(category.image) : category.image}
                    alt={category.name}
                    loading="lazy"
                  />
                  <span><ArrowRight size={17} /></span>
                </div>
                <div className="rm-category-copy">
                  <strong>{category.name}</strong>
                  <small>{category.sub}</small>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Top Picks Horizontal Rail */}
      <section className="rm-home-section">
        <div className="container">
          <div className="rm-top-picks-header">
            <SectionTitle {...c.featuredTitle} />
            <div className="rm-top-picks-controls" aria-label="Top picks controls">
              <button type="button" className="rm-top-picks-arrow" onClick={() => scrollTopPicks(-1)} aria-label="Previous">
                <ArrowLeft size={16} />
              </button>
              <button type="button" className="rm-top-picks-arrow" onClick={() => scrollTopPicks(1)} aria-label="Next">
                <ArrowRight size={16} />
              </button>
            </div>
          </div>

          {isLoading ? (
            <div className="product-grid">
              {Array.from({ length: 4 }, (_, i) => <div className="skeleton-card" key={i} />)}
            </div>
          ) : isError ? (
            <div className="empty-state">
              <p>Products are temporarily unavailable.</p>
              <Link className="btn-primary" to="/products">Browse All Products</Link>
            </div>
          ) : featured.length ? (
            <div ref={topPicksRef} className="rm-top-picks-rail">
              {featured.map((product, index) => (
                <div className="rm-top-pick-item" key={product.id}>
                  <span className="rm-rank-badge">#{index + 1}</span>
                  <ProductCard product={product} />
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <ShoppingBag size={32} color="var(--accent)" />
              <p>Your next favourite piece is on the way.</p>
              <Link className="btn-primary" to="/products">Explore Products</Link>
            </div>
          )}
        </div>
      </section>

      {/* Editorial High-Fashion Banner */}
      <section className="rm-editorial-wrap">
        <div className="rm-editorial">
          <div className="rm-editorial-copy">
            <span>{c.editorial.eyebrow}</span>
            <h2>
              {c.editorial.title.split("\n").map((line, i) => (
                <span key={i}>
                  {i > 0 && <br />}
                  {line}
                </span>
              ))}
            </h2>
            <p>{c.editorial.description}</p>
            <Link className="rm-pill-button" to="/products">
              {c.editorial.cta} <ArrowRight size={17} />
            </Link>
          </div>
          <div className="rm-editorial-image">
            <img
              src={c.editorial.image?.startsWith("/uploads/") ? imageUrl(c.editorial.image) : c.editorial.image}
              alt="Featured fan collection"
              loading="lazy"
            />
            <div className="rm-editorial-sticker">
              <Trophy size={16} />
              <span>
                {c.editorial.sticker.split("\n").map((line, i) => (
                  <span key={i}>{i > 0 && <br />}{line}</span>
                ))}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Best Sellers Grid */}
      <section className="rm-home-section">
        <div className="container">
          <SectionTitle
            eyebrow={c.bestTitle.eyebrow}
            title={c.bestTitle.title}
            description={c.bestTitle.description}
          />
          {bestSellers.length ? (
            <div className="product-grid">
              {bestSellers.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <Link className="btn-primary" to="/products">Browse All Products</Link>
          )}
        </div>
      </section>

      {/* Fan Club Newsletter */}
      <section className="container">
        <div className="rm-newsletter">
          <div>
            <span>{c.newsletter.eyebrow}</span>
            <h2>{c.newsletter.title}</h2>
            <p>{c.newsletter.description}</p>
          </div>
          <Link className="rm-pill-button" to="/register">
            {c.newsletter.cta} <ArrowRight size={17} />
          </Link>
        </div>
      </section>
    </div>
  );
}
