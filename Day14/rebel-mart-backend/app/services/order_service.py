import logging
from decimal import Decimal

from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.models.order import Order, OrderItem, OrderStatus
from app.schemas.order import CheckoutDetails
from app.models.product import Product
from app.services.cache_service import clear_all_product_cache
from app.services.cart_service import CartUnavailableError, cart_service
from app.services.websocket_service import websocket_manager
from app.tasks.email_tasks import send_order_confirmation_email

logger = logging.getLogger("ecommerce.orders")


class OrderService:
    async def create_order(
        self,
        user_id: int,
        user_email: str,
        db: Session,
        checkout: CheckoutDetails | None = None,
        fallback_name: str | None = None,
    ) -> Order:
        try:
            cart = cart_service.get_cart(user_id)
        except CartUnavailableError:
            raise HTTPException(status_code=503, detail="Shopping cart service is temporarily unavailable")

        if not cart:
            raise HTTPException(status_code=400, detail="Cart is empty")

        product_ids = sorted(cart.keys())
        try:
            products = db.scalars(
                select(Product)
                .where(Product.id.in_(product_ids))
                .order_by(Product.id)
                .with_for_update()
            ).all()
            products_by_id = {p.id: p for p in products}
            missing = [pid for pid in product_ids if pid not in products_by_id]
            if missing:
                raise HTTPException(status_code=404, detail=f"Products not found: {missing}")

            total = Decimal("0.00")
            order = Order(
                user_id=user_id,
                total_amount=Decimal("0.00"),
                status=OrderStatus.PLACED.value,
                customer_name=checkout.customer_name.strip() if checkout else fallback_name,
                phone=checkout.phone.strip() if checkout else None,
                address=checkout.address.strip() if checkout else None,
                city=checkout.city.strip() if checkout else None,
                state=checkout.state.strip() if checkout else None,
                pincode=checkout.pincode.strip() if checkout else None,
                delivery_instructions=(checkout.delivery_instructions or "").strip() or None if checkout else None,
            )
            db.add(order)
            db.flush()

            for product_id in product_ids:
                quantity = cart[product_id]
                product = products_by_id[product_id]

                if quantity <= 0:
                    raise HTTPException(status_code=400, detail=f"Invalid quantity for product {product_id}")
                if product.stock < quantity:
                    raise HTTPException(
                        status_code=409,
                        detail=(
                            f"Insufficient stock for product '{product.name}'. "
                            f"Available: {product.stock}, Requested: {quantity}"
                        ),
                    )

                unit_price = Decimal(product.price).quantize(Decimal("0.01"))
                subtotal = (unit_price * quantity).quantize(Decimal("0.01"))
                total += subtotal
                product.stock -= quantity

                order.items.append(
                    OrderItem(
                        product_id=product.id,
                        quantity=quantity,
                        unit_price=unit_price,
                        subtotal=subtotal,
                    )
                )

            order.total_amount = total.quantize(Decimal("0.01"))
            db.commit()
            db.refresh(order)

        except HTTPException:
            db.rollback()
            raise
        except Exception:
            db.rollback()
            logger.exception("Checkout failed for user_id=%s", user_id)
            raise HTTPException(status_code=500, detail="Could not create order")

        # The order is committed. Cleanup/notifications must not turn a successful
        # checkout into a 500 response.
        try:
            cart_service.clear_cart(user_id)
        except CartUnavailableError:
            logger.exception("Could not clear cart after successful order_id=%s", order.id)

        clear_all_product_cache()

        try:
            send_order_confirmation_email.delay(
                user_email,
                order.id,
                float(order.total_amount),
            )
        except Exception:
            logger.exception("Could not enqueue confirmation email for order_id=%s", order.id)

        try:
            await websocket_manager.send_order_status(
                user_id=user_id,
                order_id=order.id,
                status=order.status,
            )
        except Exception:
            logger.exception("Could not publish order status for order_id=%s", order.id)

        return self.get_user_order(user_id, order.id, db)

    def get_user_orders(self, user_id: int, db: Session, page: int = 1, page_size: int = 20) -> list[Order]:
        return list(
            db.scalars(
                select(Order)
                .where(Order.user_id == user_id)
                .options(selectinload(Order.items))
                .order_by(Order.created_at.desc())
                .offset((page - 1) * page_size)
                .limit(page_size)
            ).all()
        )

    def get_user_order(self, user_id: int, order_id: int, db: Session) -> Order:
        order = db.scalar(
            select(Order)
            .where(Order.id == order_id, Order.user_id == user_id)
            .options(selectinload(Order.items))
        )
        if order is None:
            raise HTTPException(status_code=404, detail="Order not found")
        return order

    def get_all_orders(self, db: Session, page: int = 1, page_size: int = 20) -> list[Order]:
        return list(
            db.scalars(
                select(Order)
                .options(selectinload(Order.items))
                .order_by(Order.created_at.desc())
                .offset((page - 1) * page_size)
                .limit(page_size)
            ).all()
        )

    async def update_status(self, order_id: int, new_status: str, db: Session) -> Order:
        order = db.scalar(
            select(Order)
            .where(Order.id == order_id)
            .options(selectinload(Order.items))
            .with_for_update()
        )
        if order is None:
            raise HTTPException(status_code=404, detail="Order not found")

        current = OrderStatus(order.status)
        target = OrderStatus(new_status)
        allowed = {
            OrderStatus.PLACED: {OrderStatus.CONFIRMED, OrderStatus.CANCELLED},
            OrderStatus.CONFIRMED: {OrderStatus.PROCESSING, OrderStatus.CANCELLED},
            OrderStatus.PROCESSING: {OrderStatus.SHIPPED, OrderStatus.CANCELLED},
            OrderStatus.SHIPPED: {OrderStatus.DELIVERED},
            OrderStatus.DELIVERED: set(),
            OrderStatus.CANCELLED: set(),
        }

        if target not in allowed[current]:
            raise HTTPException(
                status_code=409,
                detail=f"Cannot change order status from {current.value} to {target.value}",
            )

        if target == OrderStatus.CANCELLED:
            self._restore_order_stock(order, db)

        order.status = target.value
        db.commit()
        db.refresh(order)

        if target == OrderStatus.CANCELLED:
            clear_all_product_cache()

        # Admin status changes should also reach the customer in real time.
        try:
            await websocket_manager.send_order_status(
                user_id=order.user_id,
                order_id=order.id,
                status=order.status,
            )
        except Exception:
            logger.exception("Could not publish admin order status update for order_id=%s", order.id)

        return self.get_order_for_response(order.id, db)

    async def cancel_order(self, user_id: int, order_id: int, db: Session) -> Order:
        order = db.scalar(
            select(Order)
            .where(Order.id == order_id, Order.user_id == user_id)
            .options(selectinload(Order.items))
            .with_for_update()
        )
        if order is None:
            raise HTTPException(status_code=404, detail="Order not found")
        if order.status != OrderStatus.PLACED.value:
            raise HTTPException(status_code=409, detail="Only placed orders can be cancelled")

        self._restore_order_stock(order, db)
        order.status = OrderStatus.CANCELLED.value
        db.commit()
        db.refresh(order)
        clear_all_product_cache()

        try:
            await websocket_manager.send_order_status(
                user_id=user_id,
                order_id=order.id,
                status=order.status,
            )
        except Exception:
            logger.exception("Could not publish cancellation for order_id=%s", order.id)

        return self.get_user_order(user_id, order.id, db)

    @staticmethod
    def _restore_order_stock(order: Order, db: Session) -> None:
        product_ids = [item.product_id for item in order.items]
        if not product_ids:
            return

        products = {
            p.id: p
            for p in db.scalars(
                select(Product)
                .where(Product.id.in_(product_ids))
                .with_for_update()
            ).all()
        }

        for item in order.items:
            product = products.get(item.product_id)
            if product is None:
                raise HTTPException(
                    status_code=409,
                    detail=f"Product {item.product_id} no longer exists; order cannot be cancelled",
                )
            product.stock += item.quantity

    def get_order_for_response(self, order_id: int, db: Session) -> Order:
        order = db.scalar(
            select(Order)
            .where(Order.id == order_id)
            .options(selectinload(Order.items))
        )
        if order is None:
            raise HTTPException(status_code=404, detail="Order not found")
        return order


order_service = OrderService()
