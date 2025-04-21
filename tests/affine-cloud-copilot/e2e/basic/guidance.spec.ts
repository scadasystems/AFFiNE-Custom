import { expect } from '@playwright/test';

import { test } from '../base/base-test';

test.describe('AIBasic/Guidance', () => {
  test.beforeEach(async ({ page, utils }) => {
    await utils.testUtils.setupTestEnvironment(page);
  });

  test('should show AI panel when space is pressed on empty paragraph', async ({
    page,
    utils,
  }) => {
    await utils.editor.focusToEditor(page);
    await page.keyboard.press('Space');
    await expect(page.locator('affine-ai-panel-widget')).toBeVisible();
  });
});
