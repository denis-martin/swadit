import { test, expect } from '@playwright/test';

test('loads the default API and navigates to the source editor', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('.sidebar')).toBeVisible();

    await page.locator('a[href="/source"]').first().click();
    await expect(page.locator('ace .ace_content')).toBeVisible();
    await expect(page.getByText('validation passed')).toBeVisible();
});
