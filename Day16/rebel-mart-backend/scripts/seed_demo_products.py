"""Create duplicate demo products so catalog pagination/infinite scrolling is easy to test.

Usage:
    python scripts/seed_demo_products.py
    python scripts/seed_demo_products.py --target-count 80
    python scripts/seed_demo_products.py --copies-per-product 5

The script clones existing products (name, description, price, stock and image URL)
and adds a clear [Demo Copy N] suffix to the name. It is safe to run repeatedly:
existing demo copies are not duplicated again.
"""

from __future__ import annotations

import argparse
import re
from datetime import datetime, timezone

from sqlalchemy import select

from app.database import SessionLocal
from app.models.product import Product
from app.services.cache_service import clear_products_cache

DEMO_SUFFIX_RE = re.compile(r" \[Demo Copy (\d+)\]$")
DEFAULT_TARGET_COUNT = 60
DEFAULT_COPIES_PER_PRODUCT = 0  # 0 means create copies until target count is reached.


def is_demo_copy(name: str) -> bool:
    return bool(DEMO_SUFFIX_RE.search(name))


def seed_products(target_count: int, copies_per_product: int = 0) -> int:
    with SessionLocal() as db:
        all_products = list(db.scalars(select(Product).order_by(Product.id.asc())).all())
        originals = [product for product in all_products if not is_demo_copy(product.name)]

        if not originals:
            raise RuntimeError("No original products were found. Add at least one product first.")

        existing_names = {product.name for product in all_products}
        created = 0

        # First honour an explicit copies-per-product request.
        if copies_per_product > 0:
            for original in originals:
                for copy_number in range(1, copies_per_product + 1):
                    name = f"{original.name} [Demo Copy {copy_number}]"
                    if name in existing_names:
                        continue
                    db.add(
                        Product(
                            name=name,
                            description=original.description,
                            price=original.price,
                            stock=original.stock,
                            image_url=original.image_url,
                        )
                    )
                    existing_names.add(name)
                    created += 1

        # Otherwise, keep cloning round-robin until the requested catalog size exists.
        if copies_per_product == 0:
            next_copy_number = {original.id: 1 for original in originals}
            for product in all_products:
                match = DEMO_SUFFIX_RE.search(product.name)
                if not match:
                    continue
                base_name = product.name[: match.start()]
                base = next((item for item in originals if item.name == base_name), None)
                if base is not None:
                    next_copy_number[base.id] = max(next_copy_number[base.id], int(match.group(1)) + 1)

            index = 0
            while len(all_products) + created < target_count:
                original = originals[index % len(originals)]
                copy_number = next_copy_number[original.id]
                name = f"{original.name} [Demo Copy {copy_number}]"
                next_copy_number[original.id] += 1
                index += 1

                if name in existing_names:
                    continue

                db.add(
                    Product(
                        name=name,
                        description=original.description,
                        price=original.price,
                        stock=original.stock,
                        image_url=original.image_url,
                    )
                )
                existing_names.add(name)
                created += 1

        if created:
            db.commit()
            clear_products_cache()

        return created


def main() -> None:
    parser = argparse.ArgumentParser(description="Seed duplicate demo products for pagination testing.")
    parser.add_argument(
        "--target-count",
        type=int,
        default=DEFAULT_TARGET_COUNT,
        help=f"Minimum total number of products (default: {DEFAULT_TARGET_COUNT}).",
    )
    parser.add_argument(
        "--copies-per-product",
        type=int,
        default=DEFAULT_COPIES_PER_PRODUCT,
        help="Clone each original this many times instead of using target-count (default: target-count mode).",
    )
    args = parser.parse_args()

    if args.target_count < 21:
        parser.error("--target-count must be at least 21 so page 2 can be demonstrated.")
    if args.copies_per_product < 0:
        parser.error("--copies-per-product cannot be negative.")

    created = seed_products(args.target_count, args.copies_per_product)
    print(f"Created {created} demo product(s).")
    print(f"Open the Products page and scroll to the bottom to test infinite scrolling.")
    print(f"Demo copies are named like: Original Product [Demo Copy 1]")


if __name__ == "__main__":
    main()
