# Demo products for pagination / infinite scrolling

The catalog endpoint returns **20 products per page**. If your database only has a few products, it is difficult to see the infinite-scroll behavior.

This project includes a safe seed script that clones the products already in your database. The clones keep the original description, price, stock and image URL, but receive a name such as:

```text
Original Product [Demo Copy 1]
Original Product [Demo Copy 2]
```

Existing demo copies are detected and are not duplicated again.

## Run it

From the backend project root, with your virtual environment activated:

```bash
python scripts/seed_demo_products.py
```

By default it creates enough demo products to reach **60 total products**.

You can choose a larger catalog:

```bash
python scripts/seed_demo_products.py --target-count 100
```

Or clone every original exactly five times:

```bash
python scripts/seed_demo_products.py --copies-per-product 5
```

## Test infinite scrolling

1. Start FastAPI.
2. Start the React frontend.
3. Log in.
4. Open **Products**.
5. Scroll near the bottom.
6. The frontend requests page 2, page 3, etc. in batches of 20.
7. The footer changes from `Scroll to load more` to `You've reached the end of the catalog.` after the final page.

The cloned products are real database rows, so you can edit or delete them from the Admin Dashboard just like normal products.
