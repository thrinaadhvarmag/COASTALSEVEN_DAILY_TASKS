import { expect, test, type Page } from '@playwright/test';
const customerUser = {
  id: 1,
  username: 'demo-user',
  email: 'demo@example.com',
  role: 'customer',
  profile_image_url: null,
  created_at: '2026-01-01T00:00:00Z',
};
const adminUser = {
  ...customerUser,
  username: 'admin-user',
  email: 'admin@example.com',
  role: 'admin',
};
async function mockSuccessfulLogin(page: Page, user = customerUser) {
  await page.route('**/auth/login', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ access_token: 'fake-token', token_type: 'bearer' }),
    });
  });
  await page.route('**/auth/me', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(user),
    });
  });
}
test.describe('Login page edge cases', () => {
  test('renders the login form and blocks empty submit', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByRole('heading', { name: 'Good to see you.' })).toBeVisible();
    await expect(page.locator('input[type="email"]')).toHaveAttribute('required');
    await expect(page.locator('input[type="password"]')).toHaveAttribute('required');
    await page.getByRole('button', { name: /sign in/i }).click();
    await expect(page.locator('input[type="email"]')).toBeFocused();
  });
  test('shows an error for invalid credentials', async ({ page }) => {
    await page.route('**/auth/login', async (route) => {
      await route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({ detail: 'Invalid email or password' }),
      });
    });
    await page.goto('/login');
    await page.getByLabel('Email').fill('wrong@example.com');
    await page.getByPlaceholder('Your password').fill('wrongpass');
    await page.getByRole('button', { name: /sign in/i }).click();
    await expect(page.getByText('Invalid email or password')).toBeVisible();
  });
  test('toggles password visibility', async ({ page }) => {
    await page.goto('/login');
    const passwordInput = page.locator('input[type="password"]');
    await passwordInput.fill('secret123');
    await expect(passwordInput).toHaveValue('secret123');
    await page.locator('button[type="button"]').click();
    await expect(page.locator('input[type="text"]')).toHaveValue('secret123');
  });
  test('logs in a customer and redirects to products', async ({ page }) => {
    await mockSuccessfulLogin(page, customerUser);
    await page.goto('/login');
    await page.getByLabel('Email').fill('demo@example.com');
    await page.getByPlaceholder('Your password').fill('secret123');
    await page.getByRole('button', { name: /sign in/i }).click();
    await expect(page).toHaveURL(/\/products$/);
  });
  test('logs in an admin and redirects to admin dashboard', async ({ page }) => {
    await mockSuccessfulLogin(page, adminUser);
    await page.goto('/login');
    await page.getByLabel('Email').fill('admin@example.com');
    await page.getByPlaceholder('Your password').fill('secret123');
    await page.getByRole('button', { name: /sign in/i }).click();
    await expect(page).toHaveURL(/\/admin$/);
  });
  test('redirects back to the protected page after successful login', async ({ page }) => {
    await mockSuccessfulLogin(page, customerUser);
    await page.goto('/profile');
    await expect(page).toHaveURL(/\/login/);
    await page.getByLabel('Email').fill('demo@example.com');
    await page.getByPlaceholder('Your password').fill('secret123');
    await page.getByRole('button', { name: /sign in/i }).click();
    await expect(page).toHaveURL(/\/profile$/);
  });
});
