# Code Quality Setup

This project uses Prettier, ESLint with React rules, and strict TypeScript checking.

## 1. Install the quality tools

From the project root:

```bash
npm install
```

This installs the development dependencies listed in `package.json`.

## 2. Format the project

```bash
npm run format
```

Check formatting without changing files:

```bash
npm run format:check
```

## 3. Run ESLint

```bash
npm run lint
```

Automatically fix supported ESLint issues:

```bash
npm run lint:fix
```

ESLint is configured for JavaScript, JSX, TypeScript, and TSX with:

- ESLint recommended rules
- TypeScript ESLint recommended rules
- React recommended rules
- React Hooks rules
- React Refresh rules

## 4. Run strict TypeScript checking

```bash
npm run typecheck
```

The TypeScript configurations use `strict: true`.

## 5. Run all quality checks

```bash
npm run quality
```

This runs formatting verification, ESLint, and TypeScript checking.

To format and automatically fix supported lint issues first:

```bash
npm run quality:fix
```

## Recommended workflow

Before committing code:

```bash
npm run quality:fix
npm run test:run
npm run build
```

## Current ESLint fixes

The TypeScript `any` errors reported by ESLint in `ProductCard.tsx` and `AuthContext.tsx` have been replaced with explicit types/`unknown` error handling. Debug `console.log` calls in Playwright E2E tests are allowed because they are intentional test diagnostics; application source still warns on unexpected console usage.

## ESLint cleanup applied

The reported 15 ESLint errors were addressed without disabling the core TypeScript or React Hooks rules:

- Replaced explicit `any` usage in `ProductCard.tsx` and `AuthContext.tsx`.
- Removed unused imports from `AdminDashboard.jsx`.
- Reworked `AuthContext.tsx` to avoid synchronous state updates in effects and stabilized callbacks with `useCallback`.
- Made the product URL parameters the source of truth in `Products.jsx`, removing effect-driven state synchronization.
- Moved profile-form synchronization to the edit action in `Profile.jsx` instead of setting state from an effect.
- Escaped apostrophes flagged by `react/no-unescaped-entities`.
- Memoized the admin product fallback to keep hook dependencies stable.
- Allowed intentional console output in Playwright E2E tests and excluded context modules from the Fast Refresh export warning, where that rule conflicts with the context/hook export pattern used by this project.
