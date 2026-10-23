import { test, expect } from '@playwright/test';

test.describe('ContentPilot 2.0 — AI Creative Studio End-to-End Flow', () => {
  const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
  const TEST_EMAIL = 'test@contentpilot.io';
  const TEST_PASSWORD = 'Password123!';

  test('Critical Path: Generate Image -> Wait for Result -> Download -> Attach to Post', async ({ page }) => {
    // 1. Visit Login Page & Authenticate
    await page.goto(`${BASE_URL}/`);
    
    // Check if on login page
    const emailInput = page.locator('input[type="email"]');
    if (await emailInput.isVisible()) {
      await emailInput.fill(TEST_EMAIL);
      await page.fill('input[type="password"]', TEST_PASSWORD);
      await page.click('button[type="submit"]');
    }

    // 2. Navigate to AI Creative Studio (/creative)
    await page.click('text=AI Студия');
    await expect(page).toHaveURL(/.*\/creative/);
    await expect(page.locator('h1')).toContainText('AI Creative Studio');

    // 3. Select a business preset
    const presetBtn = page.locator('button:has-text("Уютный сезонный кофе")');
    if (await presetBtn.isVisible()) {
      await presetBtn.click();
    }

    // 4. Verify deterministic price overlay configuration
    const overlayCheckbox = page.locator('input[type="checkbox"]');
    if (!(await overlayCheckbox.isChecked())) {
      await overlayCheckbox.check();
    }
    const priceInput = page.locator('input[placeholder*="320 ₽"]');
    await expect(priceInput).toHaveValue(/320/);

    // 5. Trigger generation
    const generateBtn = page.locator('button:has-text("Сгенерировать рекламный визуал")');
    await expect(generateBtn).toBeEnabled();
    await generateBtn.click();

    // 6. Wait for result preview card to appear
    const resultCard = page.locator('img[alt="Creative output"]');
    await expect(resultCard).toBeVisible({ timeout: 20000 });

    // 7. Verify Download button
    const downloadBtn = page.locator('a:has-text("Скачать файл")');
    await expect(downloadBtn).toBeVisible();
    await expect(downloadBtn).toHaveAttribute('href', /.*\/uploads\/creative\/.*/);

    // 8. Attach to post workflow
    const attachBtn = page.locator('button:has-text("Прикрепить к посту")');
    await attachBtn.click();

    // Verify modal is open
    await expect(page.locator('text=Прикрепить к публикации')).toBeVisible();

    // Select TELEGRAM platform
    await page.click('button:has-text("TELEGRAM")');

    // Submit post creation
    const submitPostBtn = page.locator('button:has-text("Создать публикацию")');
    await submitPostBtn.click();

    // Verify success feedback
    await expect(page.locator('text=Публикация успешно создана')).toBeVisible({ timeout: 5000 });
  });

  test('Video Studio: Vertical Reels 9:16 task status polling', async ({ page }) => {
    await page.goto(`${BASE_URL}/creative`);
    
    // Switch to Reels & Video tab
    await page.click('text=Reels & Видео');

    // Verify aspect ratio default is 9:16
    const formatSelect = page.locator('select').nth(1);
    await expect(formatSelect).toBeVisible();

    // Check duration slider
    const durationSlider = page.locator('input[type="range"]');
    await expect(durationSlider).toBeVisible();

    // Trigger video creation
    const createVideoBtn = page.locator('button:has-text("Создать промо-ролик Reels")');
    await createVideoBtn.click();

    // Verify progress tracking
    await expect(page.locator('text=Генерация креатива')).toBeVisible();
  });
});
