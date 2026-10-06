import { test, expect } from "@playwright/test";

const product = {
  id: 101,
  name: "Rebel T-Shirt",
  description: "Official Rebel Mart merchandise",
  price: 799,
  stock: 12,
  image_url: null,
  created_at: "2026-10-01T10:00:00Z",
  updated_at: "2026-10-01T10:00:00Z",
};

const user = {
  id: 1,
  username: "Test User",
  email: "test@rebelmart.com",
  role: "user",
  profile_image_url: null,
  created_at: "2026-10-01T10:00:00Z",
};

test.describe("Rebel Mart customer journey", () => {
  test("customer can login, browse a product, add it to cart and verify the cart", async ({
    page,
  }) => {
    let cartItems: Array<{
      product_id: number;
      quantity: number;
    }> = [];

    // =========================================================
    // MOCK ONLY FASTAPI BACKEND
    // =========================================================

    await page.route("**/*", async (route) => {
      const request = route.request();
      const url = new URL(request.url());

      /*
       * Frontend runs on port 5173.
       * FastAPI runs on port 8000.
       *
       * We only mock port 8000 so that files such as:
       * /src/store/cartStore.js
       * are never intercepted.
       */

      if (
        url.hostname !== "localhost" &&
        url.hostname !== "127.0.0.1"
      ) {
        await route.continue();
        return;
      }

      if (url.port !== "8000") {
        await route.continue();
        return;
      }

      const method = request.method();
      const pathname = url.pathname;

      console.log(
        "BACKEND REQUEST:",
        method,
        request.url(),
      );

      // =======================================================
      // LOGIN
      // =======================================================

      if (
        method === "POST" &&
        pathname === "/auth/login"
      ) {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            access_token: "playwright-test-token",
            token_type: "bearer",
          }),
        });

        return;
      }

      // =======================================================
      // CURRENT USER
      // =======================================================

      if (
        method === "GET" &&
        pathname === "/auth/me"
      ) {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify(user),
        });

        return;
      }

      // =======================================================
      // PRODUCT COUNT
      // =======================================================

      if (
        method === "GET" &&
        pathname === "/products/count"
      ) {
        console.log("MOCK: /products/count");

        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            total: 1,
          }),
        });

        return;
      }

      // =======================================================
      // SINGLE PRODUCT
      // =======================================================

      if (
        method === "GET" &&
        pathname === `/products/${product.id}`
      ) {
        console.log("MOCK: /products/101");

        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify(product),
        });

        return;
      }

      // =======================================================
      // PRODUCT LIST
      // =======================================================

      if (
        method === "GET" &&
        pathname === "/products"
      ) {
        console.log("MOCK: /products");

        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify([product]),
        });

        return;
      }

      // =======================================================
      // GET CART
      // =======================================================

      if (
        method === "GET" &&
        pathname === "/cart"
      ) {
        console.log("MOCK: GET /cart");

        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            items: cartItems,
          }),
        });

        return;
      }

      // =======================================================
      // CLEAR CART
      // =======================================================

      if (
        method === "DELETE" &&
        pathname === "/cart"
      ) {
        cartItems = [];

        await route.fulfill({
          status: 204,
        });

        return;
      }

      // =======================================================
      // ADD PRODUCT TO CART
      // =======================================================

      if (
        method === "POST" &&
        pathname === "/cart/items"
      ) {
        const body = request.postDataJSON() as {
          product_id?: number;
          quantity?: number;
        };

        const productId = Number(body.product_id);
        const quantity = Number(body.quantity || 1);

        const existingItem = cartItems.find(
          (item) =>
            item.product_id === productId,
        );

        if (existingItem) {
          existingItem.quantity += quantity;
        } else {
          cartItems.push({
            product_id: productId,
            quantity,
          });
        }

        console.log(
          "MOCK: POST /cart/items",
          cartItems,
        );

        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            items: cartItems,
          }),
        });

        return;
      }

      // =======================================================
      // UPDATE CART ITEM
      // =======================================================

      if (
        method === "PUT" &&
        pathname.startsWith("/cart/items/")
      ) {
        const productId = Number(
          pathname.split("/").pop(),
        );

        const body = request.postDataJSON() as {
          quantity?: number;
        };

        const existingItem = cartItems.find(
          (item) =>
            item.product_id === productId,
        );

        if (existingItem) {
          existingItem.quantity = Number(
            body.quantity || 1,
          );
        }

        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            items: cartItems,
          }),
        });

        return;
      }

      // =======================================================
      // DELETE CART ITEM
      // =======================================================

      if (
        method === "DELETE" &&
        pathname.startsWith("/cart/items/")
      ) {
        const productId = Number(
          pathname.split("/").pop(),
        );

        cartItems = cartItems.filter(
          (item) =>
            item.product_id !== productId,
        );

        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            items: cartItems,
          }),
        });

        return;
      }

      // =======================================================
      // ANY OTHER BACKEND REQUEST
      // =======================================================

      console.log(
        "UNMOCKED BACKEND REQUEST:",
        method,
        request.url(),
      );

      await route.continue();
    });

    // =========================================================
    // BROWSER ERROR LOGGING
    // =========================================================

    page.on("console", (message) => {
      if (message.type() === "error") {
        console.log(
          "BROWSER ERROR:",
          message.text(),
        );
      }
    });

    page.on("pageerror", (error) => {
      console.log(
        "PAGE ERROR:",
        error.message,
      );
    });

    // =========================================================
    // 1. OPEN LOGIN PAGE
    // =========================================================

    await page.goto("/login");

    await expect(
      page.getByRole("heading", {
        name: "Good to see you.",
      }),
    ).toBeVisible();

    // =========================================================
    // 2. LOGIN
    // =========================================================

    await page
      .getByLabel("Email")
      .fill("test@rebelmart.com");

    await page
      .getByLabel("Password")
      .fill("TestPassword123");

    await page
      .getByRole("button", {
        name: /sign in/i,
      })
      .click();

    // =========================================================
    // 3. VERIFY PRODUCTS PAGE
    // =========================================================

    await expect(page).toHaveURL(
      /\/products/,
      {
        timeout: 15000,
      },
    );

    await expect(
      page.getByRole("heading", {
        name: "Find your next favorite.",
      }),
    ).toBeVisible({
      timeout: 15000,
    });

    await expect(
      page.getByText("Rebel T-Shirt", {
        exact: true,
      }).first(),
    ).toBeVisible({
      timeout: 15000,
    });

    // =========================================================
    // 4. OPEN PRODUCT DETAILS
    // =========================================================

    await page
      .getByRole("link", {
        name: "Rebel T-Shirt",
      })
      .first()
      .click();

    await expect(page).toHaveURL(
      /\/products\/101/,
      {
        timeout: 10000,
      },
    );

    await expect(
      page.getByRole("heading", {
        name: "Rebel T-Shirt",
      }),
    ).toBeVisible({
      timeout: 10000,
    });

    await expect(
      page.getByText("₹799.00", {
        exact: true,
      }),
    ).toBeVisible();

    // =========================================================
    // 5. ADD PRODUCT TO CART
    // =========================================================

    const addToCartButton = page.getByRole(
      "button",
      {
        name: /add.*to cart/i,
      },
    );

    await expect(
      addToCartButton,
    ).toBeVisible();

    await addToCartButton.click();

    // =========================================================
    // 6. VERIFY ADD-TO-CART RESULT
    // =========================================================

    /*
     * The important E2E check is that the user can proceed
     * to the cart after clicking Add to Cart.
     *
     * We intentionally do NOT assert the internal mock
     * variable here.
     */

    await expect(
      addToCartButton,
    ).toBeVisible();

    // =========================================================
    // 7. OPEN CART
    // =========================================================

    await page.goto("/cart");

    await expect(page).toHaveURL(
      /\/cart/,
      {
        timeout: 10000,
      },
    );

    // =========================================================
    // 8. VERIFY CART PAGE
    // =========================================================

    await expect(
      page.getByRole("heading", {
        name: /shopping cart/i,
      }),
    ).toBeVisible({
      timeout: 10000,
    });

    // =========================================================
    // 9. VERIFY PRODUCT IS IN CART
    // =========================================================

    await expect(
      page.getByText("Rebel T-Shirt", {
        exact: true,
      }),
    ).toBeVisible({
      timeout: 10000,
    });

    // =========================================================
    // 10. VERIFY PRICE
    // =========================================================

    await expect(
      page.getByText("₹799.00", {
        exact: true,
      }).first(),
    ).toBeVisible({
      timeout: 10000,
    });
  });
});