---
name: webapp-testing
description: Practical web application end-to-end and integration testing using Playwright, Vitest, and browser automation for React and modern web platforms.
---

# Web Application Testing Skill

Best practices and automation patterns for verifying web applications, focusing on React, TypeScript, responsive layouts, and REST API integration.

## 1. Testing Philosophy
- Prioritize user-facing behavior over internal implementation details.
- Test the full critical path: Authentication -> Navigation -> Form submission -> Async background task updates -> Output display.
- Assert accessibility (ARIA roles, visible labels, keyboard navigation).

## 2. Playwright E2E Setup & Patterns
```typescript
import { test, expect } from '@playwright/test';

test.describe('AI Creative Studio Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Login and navigate to Creative Studio
    await page.goto('/login');
    await page.fill('input[type="email"]', 'test@contentpilot.io');
    await page.fill('input[type="password"]', 'Password123!');
    await page.click('button[type="submit"]');
    await page.waitForURL('/creative');
  });

  test('should generate image with price overlay', async ({ page }) => {
    await page.click('text=Создать визуал');
    await page.fill('textarea[name="prompt"]', 'Свежеобжаренный кофе капучино');
    await page.fill('input[name="overlayPrice"]', '320 ₽');
    await page.click('button:has-text("Сгенерировать")');
    
    // Check loading indicator and eventual completion
    await expect(page.locator('.creative-result-card')).toBeVisible({ timeout: 15000 });
    await expect(page.locator('text=320 ₽')).toBeVisible();
  });
});
```

## 3. Component & Store Unit Testing (Vitest + React Testing Library)
- Test custom hooks and state machines with `@testing-library/react`.
- Mock API responses with MSW (Mock Service Worker) or test against real backend in integration mode.
- Validate error states, network timeouts, and unauthorized token refreshes.
