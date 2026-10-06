import axios from 'axios';
import { memo, useCallback, useState } from 'react';
import { ArrowUpRight, Heart, ImageOff, ShoppingCart } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useToast } from '../context/ToastContext';
import { useCart } from '../hooks/useCart';
import { imageUrl, money } from '../lib/constants';
import type { ApiErrorBody, Product } from '../types/api';

interface ProductCardProps {
  product: Product;
  admin?: boolean;
  onEdit?: (product: Product) => void;
  onDelete?: (product: Product) => void;
  onImage?: (product: Product) => void;
}

const WISH_KEY = 'rebel_mart_wishlist';

function readWish(): number[] {
  try {
    const value: unknown = JSON.parse(localStorage.getItem(WISH_KEY) || '[]');

    return Array.isArray(value) ? value.filter((id): id is number => typeof id === 'number') : [];
  } catch {
    return [];
  }
}

function ProductCard({ product, admin = false, onEdit, onDelete, onImage }: ProductCardProps) {
  const { add, loading } = useCart();
  const { show } = useToast() as unknown as {
    show: (message: string, type?: string) => void;
  };
  const [wish, setWish] = useState(() => readWish().includes(product.id));

  const toggleWishlist = useCallback(() => {
    const list = readWish();
    const next = list.includes(product.id)
      ? list.filter((id) => id !== product.id)
      : [...list, product.id];

    localStorage.setItem(WISH_KEY, JSON.stringify(next));
    setWish(!wish);
    show(wish ? 'Removed from wishlist' : 'Added to wishlist', 'info');
  }, [product.id, show, wish]);

  const addToCart = useCallback(async () => {
    try {
      await add(product.id);
      show('Added to cart');
    } catch (error: unknown) {
      const detail = axios.isAxiosError<ApiErrorBody>(error)
        ? error.response?.data?.detail
        : undefined;
      const message = typeof detail === 'string' ? detail : 'Could not add to cart';

      show(message, 'error');
    }
  }, [add, product.id, show]);

  return (
    <article className="product-card">
      <div className="product-media">
        {product.image_url ? (
          <img
            src={imageUrl(product.image_url)}
            alt={product.name}
            width="640"
            height="640"
            loading="lazy"
            decoding="async"
            onError={(event) => {
              event.currentTarget.style.display = 'none';
              event.currentTarget.nextElementSibling?.classList.remove('hidden');
            }}
          />
        ) : (
          <div className="product-placeholder">
            <span>RM</span>
            <small>Image coming soon</small>
          </div>
        )}

        {product.image_url && (
          <div className="product-image-error hidden">
            <ImageOff size={28} />
            <strong>Image unavailable</strong>
            <small>Admin can replace this image</small>
          </div>
        )}

        <div className="media-actions">
          <button className="round-action" onClick={toggleWishlist} aria-label="Wishlist">
            <Heart size={17} fill={wish ? 'currentColor' : 'none'} />
          </button>

          <Link className="round-action" to={`/products/${product.id}`} aria-label="View product">
            <ArrowUpRight size={17} />
          </Link>
        </div>

        {Number(product.stock) <= 0 ? (
          <span className="stock-badge sold">Sold out</span>
        ) : Number(product.stock) <= 5 ? (
          <span className="stock-badge low">Only {product.stock} left</span>
        ) : null}
      </div>

      <div className="product-body">
        <div className="eyebrow">Rebel Mart</div>

        <Link className="product-title" to={`/products/${product.id}`}>
          {product.name}
        </Link>

        <p className="product-description">
          {product.description || 'Quality product from Rebel Mart.'}
        </p>

        <div className="product-footer">
          <div>
            <strong>{money(product.price)}</strong>
            <span>{product.stock} in stock</span>
          </div>

          {!admin ? (
            <button
              disabled={loading || Number(product.stock) <= 0}
              className="btn-primary small"
              onClick={addToCart}
            >
              <ShoppingCart size={15} />
              {loading ? 'Adding…' : 'Add to cart'}
            </button>
          ) : (
            <div className="admin-actions">
              <button className="btn-secondary tiny" onClick={() => onEdit?.(product)}>
                Edit
              </button>

              <button className="btn-secondary tiny" onClick={() => onImage?.(product)}>
                Image
              </button>

              <button className="btn-danger tiny" onClick={() => onDelete?.(product)}>
                Delete
              </button>
            </div>
          )}
        </div>
      </div>
    </article>
  );
}

export default memo(ProductCard);
