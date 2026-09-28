from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.models.order import Order, OrderItem
from app.models.product import Product
from app.services.cart_service import cart_service
from app.services.websocket_service import websocket_manager
from app.tasks.email_tasks import send_order_confirmation_email


class OrderService:

    async def create_order(
        self,
        user_id: int,
        user_email: str,
        db: Session,
    ) -> Order:

        cart = cart_service.get_cart(user_id)

        if not cart:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cart is empty",
            )

        product_ids = sorted(cart.keys())

        try:
            products = db.scalars(
                select(Product)
                .where(Product.id.in_(product_ids))
                .order_by(Product.id)
                .with_for_update()
            ).all()

            products_by_id = {
                product.id: product
                for product in products
            }

            if len(products_by_id) != len(product_ids):
                missing_products = [
                    product_id
                    for product_id in product_ids
                    if product_id not in products_by_id
                ]

                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=(
                        f"Products not found: "
                        f"{missing_products}"
                    ),
                )

            total_amount = 0.0

            order_items_data: list[dict] = []

            for product_id in product_ids:

                quantity = cart[product_id]

                product = products_by_id[product_id]

                if quantity <= 0:
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail=(
                            f"Invalid quantity for "
                            f"product {product_id}"
                        ),
                    )

                if product.stock < quantity:
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail=(
                            f"Insufficient stock for "
                            f"product '{product.name}'. "
                            f"Available: {product.stock}, "
                            f"Requested: {quantity}"
                        ),
                    )

                subtotal = product.price * quantity

                total_amount += subtotal

                order_items_data.append(
                    {
                        "product": product,
                        "quantity": quantity,
                        "unit_price": product.price,
                        "subtotal": subtotal,
                    }
                )

            order = Order(
                user_id=user_id,
                total_amount=total_amount,
                status="PLACED",
            )

            db.add(order)

            for item_data in order_items_data:

                product = item_data["product"]

                product.stock -= item_data["quantity"]

                order_item = OrderItem(
                    product_id=product.id,
                    quantity=item_data["quantity"],
                    unit_price=item_data["unit_price"],
                    subtotal=item_data["subtotal"],
                )

                order.items.append(order_item)

            db.commit()

            db.refresh(order)

            cart_service.clear_cart(user_id)

            # Send order confirmation email through Celery.
            send_order_confirmation_email.delay(
                user_email,
                order.id,
                float(order.total_amount),
            )

            # Send real-time order status update.
            await websocket_manager.send_order_status(
                user_id=user_id,
                order_id=order.id,
                status=order.status,
            )

            return order

        except HTTPException:
            db.rollback()
            raise

        except Exception:
            db.rollback()
            raise

    def get_user_orders(
        self,
        user_id: int,
        db: Session,
    ) -> list[Order]:

        orders = db.scalars(
            select(Order)
            .where(Order.user_id == user_id)
            .options(
                selectinload(Order.items)
            )
            .order_by(Order.created_at.desc())
        ).all()

        return list(orders)

    def get_user_order(
        self,
        user_id: int,
        order_id: int,
        db: Session,
    ) -> Order:

        order = db.scalar(
            select(Order)
            .where(
                Order.id == order_id,
                Order.user_id == user_id,
            )
            .options(
                selectinload(Order.items)
            )
        )

        if order is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Order not found",
            )

        return order


order_service = OrderService()