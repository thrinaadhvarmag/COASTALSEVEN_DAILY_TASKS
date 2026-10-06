import { ArrowLeft, CheckCircle2, PackageCheck } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { getErrorMessage, money, statusClasses, statusLabel } from '../lib/constants';
import { useOrder } from '../hooks/useOrders';
const steps = ['PLACED', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED'];
export default function OrderDetails() {
  const { id } = useParams();
  const query = useOrder(id);
  const order = query.data;
  if (query.error)
    return (
      <div className="container page-section">
        <div className="alert error">{getErrorMessage(query.error)}</div>
      </div>
    );
  if (query.isLoading || !order)
    return (
      <div className="container page-section">
        <div className="spinner mx-auto" />
      </div>
    );
  const current = steps.indexOf(order.status);
  return (
    <div className="container page-section">
      <Link className="back-link" to="/orders">
        <ArrowLeft size={16} />
        My orders
      </Link>
      <div className="order-detail card">
        <div className="detail-header">
          <div>
            <div className="eyebrow">Order</div>
            <h1>#{order.id}</h1>
            <p>
              {order.created_at ? new Date(order.created_at).toLocaleString() : 'Recently placed'}
            </p>
          </div>
          <span className={`status ${statusClasses[order.status] || ''}`}>
            {statusLabel(order.status)}
          </span>
        </div>

        <div className="progress-track">
          {steps.map((step, index) => (
            <div
              className={`progress-step ${index <= current && order.status !== 'CANCELLED' ? 'done' : ''}`}
              key={step}
            >
              <span>
                {index <= current && order.status !== 'CANCELLED' ? (
                  <CheckCircle2 size={16} />
                ) : (
                  index + 1
                )}
              </span>

              <small>{statusLabel(step)}</small>
            </div>
          ))}
        </div>

        <div className="delivery-card">
          <div className="eyebrow">Delivery details</div>
          <div className="delivery-grid">
            <div>
              <span>Name</span>
              <strong>{order.customer_name || '—'}</strong>
            </div>
            <div>
              <span>Phone</span>
              <strong>{order.phone || '—'}</strong>
            </div>
            <div className="wide">
              <span>Address</span>
              <strong>
                {[order.address, order.city, order.state, order.pincode]
                  .filter(Boolean)
                  .join(', ') || '—'}
              </strong>
            </div>
            {order.delivery_instructions && (
              <div className="wide">
                <span>Instructions</span>

                <strong>{order.delivery_instructions}</strong>
              </div>
            )}
          </div>
        </div>

        <div className="order-items">
          {(order.items || []).map((item) => (
            <div className="order-item" key={item.id}>
              <div className="cart-thumb">
                <span>
                  <PackageCheck size={20} />
                </span>
              </div>

              <div>
                <strong>Product #{item.product_id}</strong>

                <span>
                  Qty {item.quantity} · {money(item.unit_price)} each
                </span>
              </div>

              <strong>{money(item.subtotal)}</strong>
            </div>
          ))}
        </div>
        <div className="order-total">
          <span>Total</span>
          <strong>{money(order.total_amount)}</strong>
        </div>
      </div>
    </div>
  );
}
