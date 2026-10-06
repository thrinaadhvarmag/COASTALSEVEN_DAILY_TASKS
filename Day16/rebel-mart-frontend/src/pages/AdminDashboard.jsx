import { useMemo, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  ImagePlus,
  Package,
  RefreshCw,
  ShoppingBag,
  X,
  UploadCloud,
  Eye,
  TrendingUp,
} from 'lucide-react';
import api from '../services/api';
import ProductCard from '../components/ProductCard';
import { getErrorMessage, money, statusClasses, statusLabel, imageUrl } from '../lib/constants';
import { useToast } from '../context/ToastContext';
import { useAdminOrders, useAdminProducts } from '../hooks/useAdminData';
import { useDeleteProductMutation, useUpdateProductMutation } from '../hooks/useProductMutations';
const blank = { name: '', description: '', price: '', stock: '' };
const statuses = ['CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED'];
const LOW_STOCK_THRESHOLD = 10;
export default function AdminDashboard() {
  const [form, setForm] = useState(blank);
  const [stockDrafts, setStockDrafts] = useState({});
  const [stockBusy, setStockBusy] = useState({});
  const [editing, setEditing] = useState(null);
  const [imageTarget, setImageTarget] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [search, setSearch] = useState('');
  const [busy, setBusy] = useState(false);
  const [upload, setUpload] = useState(0);
  const fileRef = useRef();
  const { show } = useToast();
  const queryClient = useQueryClient();
  const productsQuery = useAdminProducts();
  const ordersQuery = useAdminOrders();
  const products = useMemo(() => productsQuery.data || [], [productsQuery.data]);
  const orders = ordersQuery.data || [];
  const loading = productsQuery.isLoading || ordersQuery.isLoading;
  const updateProductMutation = useUpdateProductMutation();
  const deleteProductMutation = useDeleteProductMutation();
  const load = async () => {
    try {
      await Promise.all([productsQuery.refetch(), ordersQuery.refetch()]);
    } catch (e) {
      show(getErrorMessage(e), 'error');
    }
  };
  const filtered = useMemo(
    () => products.filter((p) => p.name.toLowerCase().includes(search.toLowerCase())),
    [products, search],
  );
  const inventory = useMemo(
    () => [...products].sort((a, b) => Number(a.stock || 0) - Number(b.stock || 0)),
    [products],
  );
  const lowStock = products.filter(
    (p) => Number(p.stock || 0) > 0 && Number(p.stock || 0) <= LOW_STOCK_THRESHOLD,
  ).length;
  const outOfStock = products.filter((p) => Number(p.stock || 0) <= 0).length;
  const totalUnits = products.reduce((s, p) => s + Number(p.stock || 0), 0);
  const stockValue = products.reduce((s, p) => s + Number(p.stock || 0) * Number(p.price || 0), 0);
  const stockValueLabel = money(stockValue);
  const getDraft = (p) => stockDrafts[p.id] ?? String(p.stock ?? 0);
  const setDraft = (id, value) => setStockDrafts((d) => ({ ...d, [id]: value }));
  const saveStock = async (p, nextStock) => {
    const value = Number(nextStock);
    if (!Number.isInteger(value) || value < 0) {
      show('Stock must be a whole number of 0 or more', 'error');
      return;
    }
    setStockBusy((b) => ({ ...b, [p.id]: true }));
    try {
      await updateProductMutation.mutateAsync({
        productId: p.id,
        payload: {
          name: p.name,
          description: p.description || '',
          price: Number(p.price),
          stock: value,
        },
      });
      show(`${p.name} stock updated to ${value}`);
      setStockDrafts((d) => {
        const n = { ...d };
        delete n[p.id];
        return n;
      });
    } catch (e) {
      show(getErrorMessage(e), 'error');
    } finally {
      setStockBusy((b) => ({ ...b, [p.id]: false }));
    }
  };
  const quickRestock = (p, amount) => saveStock(p, Number(p.stock || 0) + amount);
  const chooseImage = (f) => {
    if (!f) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(f.type) || f.size > 5 * 1024 * 1024) {
      show('Use JPG, PNG or WEBP under 5 MB', 'error');
      return;
    }
    setImageFile(f);
    setImagePreview(URL.createObjectURL(f));
  };
  const resetForm = () => {
    setForm(blank);
    setEditing(null);
    setImageFile(null);
    setImagePreview('');
  };
  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const payload = {
        name: form.name.trim(),
        description: form.description.trim(),
        price: Number(form.price),
        stock: Number(form.stock),
      };
      let product;
      if (editing) {
        product = await updateProductMutation.mutateAsync({ productId: editing.id, payload });
        show('Product updated');
      } else {
        const r = await api.post('/products', payload);
        product = r.data;
        show('Product created');
      }
      if (imageFile) {
        const fd = new FormData();
        fd.append('image', imageFile);
        await api.post(`/products/${product.id}/image`, fd, {
          headers: { 'Content-Type': 'multipart/form-data' },
          onUploadProgress: (p) => p.total && setUpload(Math.round((p.loaded * 100) / p.total)),
        });
        show('Product image uploaded');
      }
      resetForm();
      await queryClient.invalidateQueries({ queryKey: ['products'] });
      await queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      await load();
    } catch (e) {
      show(getErrorMessage(e), 'error');
    } finally {
      setBusy(false);
      setUpload(0);
    }
  };
  const startEdit = (p) => {
    setEditing(p);
    setForm({ name: p.name, description: p.description || '', price: p.price, stock: p.stock });
    setImageFile(null);
    setImagePreview(p.image_url ? imageUrl(p.image_url) : '');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  const openImage = (p) => {
    setImageTarget(p);
    setImageFile(null);
    setImagePreview(p.image_url ? imageUrl(p.image_url) : '');
  };
  const uploadOnly = async () => {
    if (!imageTarget || !imageFile) return;
    setBusy(true);
    try {
      const fd = new FormData();
      fd.append('image', imageFile);
      await api.post(`/products/${imageTarget.id}/image`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      show('Product image updated');
      setImageTarget(null);
      setImageFile(null);
      setImagePreview('');
      await queryClient.invalidateQueries({ queryKey: ['products'] });
      await queryClient.invalidateQueries({ queryKey: ['product', imageTarget.id] });
      await load();
    } catch (e) {
      show(getErrorMessage(e), 'error');
    } finally {
      setBusy(false);
    }
  };
  const removeProduct = async (p) => {
    if (!window.confirm(`Delete “${p.name}”? This cannot be undone.`)) return;
    try {
      await deleteProductMutation.mutateAsync(p.id);
      show('Product deleted');
    } catch (e) {
      show(getErrorMessage(e), 'error');
    }
  };
  const updateOrder = async (o, status) => {
    try {
      await api.patch(`/orders/admin/${o.id}/status`, { status });
      show(`Order #${o.id} updated`);
      await queryClient.invalidateQueries({ queryKey: ['orders'] });
      await queryClient.invalidateQueries({ queryKey: ['order', o.id] });
      await queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
      await load();
    } catch (e) {
      show(getErrorMessage(e), 'error');
    }
  };
  const withImages = products.filter((p) => p.image_url).length;
  const revenue = orders.reduce((s, o) => s + Number(o.total_amount || 0), 0);
  return (
    <div className="container page-section">
      <div className="page-heading">
        <div>
          <div className="eyebrow">Rebel Mart Admin</div>
          <h1>Control center</h1>
          <p>Manage your catalog and orders from one workspace.</p>
        </div>
        <button className="btn-secondary" onClick={load}>
          <RefreshCw size={16} />
          Refresh
        </button>
      </div>

      <div className="admin-stats">
        <div className="stat-card">
          <Package />
          <strong>{products.length}</strong>
          <span>Products</span>
        </div>
        <div className="stat-card">
          <ShoppingBag />
          <strong>{orders.length}</strong>
          <span>Orders</span>
        </div>
        <div className="stat-card">
          <ImagePlus />
          <strong>{withImages}</strong>
          <span>Products with images</span>
        </div>
        <div className="stat-card">
          <TrendingUp />
          <strong>{money(revenue)}</strong>
          <span>Order value</span>
        </div>
      </div>

      <section className="inventory-section">
        <div className="inventory-head">
          <div>
            <div className="eyebrow">Inventory</div>
            <h2>Stock control</h2>
            <p className="muted">
              Monitor every product and restock low inventory before it runs out.
            </p>
          </div>
          <div className="inventory-threshold">
            Low stock threshold
            <strong>≤ {LOW_STOCK_THRESHOLD}</strong>
          </div>
        </div>

        <div className="inventory-metrics">
          <div className="inventory-metric">
            <Package size={17} />
            <div>
              <strong>{totalUnits}</strong>
              <span>Total units</span>
            </div>
          </div>
          <div className="inventory-metric low">
            <TrendingUp size={17} />
            <div>
              <strong>{lowStock}</strong>
              <span>Low stock</span>
            </div>
          </div>
          <div className="inventory-metric danger">
            <ShoppingBag size={17} />
            <div>
              <strong>{outOfStock}</strong>
              <span>Out of stock</span>
            </div>
          </div>
          <div className="inventory-metric">
            <TrendingUp size={17} />
            <div>
              <strong>{stockValueLabel}</strong>
              <span>Inventory value</span>
            </div>
          </div>
        </div>

        <div className="inventory-table">
          <div className="inventory-row inventory-header">
            <span>Product</span>
            <span>Current stock</span>
            <span>Inventory status</span>
            <span>Restock quantity</span>
            <span>Action</span>
          </div>

          {loading
            ? Array.from({ length: 4 }).map((_, i) => (
                <div className="inventory-row inventory-skeleton" key={i} />
              ))
            : inventory.map((p) => {
                const stock = Number(p.stock || 0);
                const isOut = stock === 0;
                const isLow = stock > 0 && stock <= LOW_STOCK_THRESHOLD;
                return (
                  <div
                    className={`inventory-row ${isOut ? 'is-out' : ''} ${isLow ? 'is-low' : ''}`}
                    key={p.id}
                  >
                    <div className="inventory-product">
                      <div className="inventory-thumb">
                        {p.image_url ? (
                          <img src={imageUrl(p.image_url)} alt="" />
                        ) : (
                          <span>{p.name?.[0] || 'R'}</span>
                        )}
                      </div>

                      <div>
                        <strong>{p.name}</strong>

                        <small>
                          Product #{p.id} · {money(p.price)}
                        </small>
                      </div>
                    </div>

                    <div className="stock-number">
                      <strong>{stock}</strong>

                      <span>units</span>
                    </div>

                    <div>
                      <span
                        className={`inventory-status ${isOut ? 'out' : isLow ? 'low' : 'healthy'}`}
                      >
                        {isOut ? 'Out of stock' : isLow ? 'Low stock' : 'Healthy'}
                      </span>
                    </div>

                    <div className="restock-control">
                      <input
                        className="input"
                        type="number"
                        min="0"
                        step="1"
                        value={getDraft(p)}
                        onChange={(e) => setDraft(p.id, e.target.value)}
                        aria-label={`Stock for ${p.name}`}
                      />

                      <div className="quick-restock">
                        <button type="button" onClick={() => quickRestock(p, 10)}>
                          +10
                        </button>

                        <button type="button" onClick={() => quickRestock(p, 25)}>
                          +25
                        </button>

                        <button type="button" onClick={() => quickRestock(p, 50)}>
                          +50
                        </button>
                      </div>
                    </div>

                    <button
                      className="btn-primary tiny"
                      disabled={!!stockBusy[p.id]}
                      onClick={() => saveStock(p, getDraft(p))}
                    >
                      {stockBusy[p.id] ? 'Saving…' : 'Update stock'}
                    </button>
                  </div>
                );
              })}
        </div>
      </section>

      <div className="admin-layout">
        <section className="card admin-editor">
          <div className="section-title">
            <div>
              <h2>{editing ? 'Edit product' : 'Create product'}</h2>
              <p>
                {editing
                  ? `Editing product #${editing.id}`
                  : 'Create the catalog item and image in one flow.'}
              </p>
            </div>
            {editing && (
              <button className="icon-btn" onClick={resetForm}>
                <X size={18} />
              </button>
            )}
          </div>

          <form onSubmit={submit} className="form-stack">
            <label>
              <span>Product name</span>
              <input
                className="input"
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </label>
            <label>
              <span>Description</span>
              <textarea
                className="input textarea"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </label>
            <div className="form-grid">
              <label>
                <span>Price (₹)</span>
                <input
                  className="input"
                  type="number"
                  min="0"
                  step="0.01"
                  required
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: e.target.value })}
                />
              </label>
              <label>
                <span>Stock</span>
                <input
                  className="input"
                  type="number"
                  min="0"
                  step="1"
                  required
                  value={form.stock}
                  onChange={(e) => setForm({ ...form, stock: e.target.value })}
                />
              </label>
            </div>

            <div
              className="image-picker"
              onClick={() => fileRef.current?.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                chooseImage(e.dataTransfer.files?.[0]);
              }}
            >
              <input
                ref={fileRef}
                hidden
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={(e) => chooseImage(e.target.files?.[0])}
              />
              {imagePreview ? (
                <>
                  <img src={imagePreview} alt="Preview" />

                  <div className="image-picker-overlay">
                    <Eye size={17} />
                    Change image
                  </div>
                </>
              ) : (
                <div className="upload-empty">
                  <UploadCloud size={28} />

                  <strong>Upload product image</strong>

                  <span>Drag & drop or click · JPG, PNG, WEBP · max 5 MB</span>
                </div>
              )}
            </div>

            {upload > 0 && (
              <div className="upload-progress">
                <span style={{ width: `${upload}%` }} />
              </div>
            )}
            <div className="form-actions">
              <button type="button" className="btn-secondary" onClick={resetForm}>
                Reset
              </button>
              <button disabled={busy} className="btn-primary grow">
                {busy ? 'Saving…' : editing ? 'Save product' : 'Create product'}
              </button>
            </div>
          </form>
        </section>

        <section>
          <div className="section-toolbar">
            <div>
              <h2>Catalog</h2>
              <p className="muted">Image previews, edit, replace and delete actions.</p>
            </div>
            <input
              className="input toolbar-search"
              placeholder="Filter products…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          {loading ? (
            <div className="product-grid">
              {Array.from({ length: 4 }).map((_, i) => (
                <div className="skeleton-card" key={i} />
              ))}
            </div>
          ) : (
            <div className="product-grid admin-products">
              {filtered.map((p) => (
                <ProductCard
                  key={p.id}
                  product={p}
                  admin
                  onEdit={startEdit}
                  onDelete={removeProduct}
                  onImage={openImage}
                />
              ))}
            </div>
          )}
        </section>
      </div>

      <section className="admin-orders">
        <div className="section-toolbar">
          <div>
            <h2>Order management</h2>
            <p className="muted">Move orders through the fulfillment workflow.</p>
          </div>
        </div>
        {orders.length ? (
          <div className="stack">
            {orders.map((o) => (
              <div className="card order-row admin-order-row" key={o.id}>
                <div className="order-main">
                  <strong>Order #{o.id}</strong>

                  <span>
                    {o.created_at ? new Date(o.created_at).toLocaleString() : 'Recently placed'}
                  </span>

                  <small>
                    {o.customer_name || 'Customer'} · {o.phone || 'No phone'}
                  </small>
                </div>

                <div className="admin-delivery-mini">
                  <strong>{o.customer_name || 'Customer details unavailable'}</strong>

                  <span>
                    {[o.address, o.city, o.state, o.pincode].filter(Boolean).join(', ') ||
                      'Address not provided'}
                  </span>
                </div>

                <span className={`status ${statusClasses[o.status] || ''}`}>
                  {statusLabel(o.status)}
                </span>

                <strong>{money(o.total_amount)}</strong>

                <div className="status-actions">
                  {statuses.map((s) => (
                    <button
                      key={s}
                      disabled={o.status === s}
                      className="btn-secondary tiny"
                      onClick={() => updateOrder(o, s)}
                    >
                      {statusLabel(s)}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="card empty-inline">No orders yet.</div>
        )}
      </section>

      {imageTarget && (
        <div className="modal-backdrop">
          <div className="modal">
            <div className="modal-head">
              <div>
                <div className="eyebrow">Media</div>
                <h2>Change product image</h2>
                <p>{imageTarget.name}</p>
              </div>
              <button
                className="icon-btn"
                onClick={() => {
                  setImageTarget(null);
                  setImagePreview('');
                }}
              >
                <X />
              </button>
            </div>
            <div className="image-picker large-picker" onClick={() => fileRef.current?.click()}>
              {imagePreview ? (
                <img src={imagePreview} alt="Preview" />
              ) : (
                <div className="upload-empty">
                  <ImagePlus size={28} />

                  <strong>Select an image</strong>
                </div>
              )}
            </div>
            <div className="form-actions">
              <button className="btn-secondary" onClick={() => setImageTarget(null)}>
                Cancel
              </button>
              <button className="btn-primary" disabled={!imageFile || busy} onClick={uploadOnly}>
                {busy ? 'Uploading…' : 'Upload image'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
