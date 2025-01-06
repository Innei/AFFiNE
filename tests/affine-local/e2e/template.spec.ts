import { test } from '@affine-test/kit/playwright';
import { openHomePage } from '@affine-test/kit/utils/load-page';
import { waitForEditorLoad } from '@affine-test/kit/utils/page-logic';
import { toggleFeatureFlag } from '@affine-test/kit/utils/setting';
import { expect, type Locator, type Page } from '@playwright/test';

async function enableFeatureFlag(page: Page) {
  await toggleFeatureFlag(page, 'enable_template_doc');
}

function getTemplateRow(page: Page) {
  return page.locator(
    '[data-testid="doc-property-row"][data-info-id="template"]'
  );
}

async function toggleTemplate(row: Locator, value: boolean) {
  const checkbox = row.locator('input[type="checkbox"]');
  const state = await checkbox.inputValue();
  const checked = state === 'on';
  if (checked !== value) {
    await checkbox.click();
    const newState = await checkbox.inputValue();
    const newChecked = newState === 'on';
    expect(newChecked).toBe(value);
  }
}

const createDocAndMarkAsTemplate = async (
  page: Page,
  title?: string,
  onCreated?: () => Promise<void>
) => {
  await page.getByTestId('sidebar-new-page-button').click();
  await waitForEditorLoad(page);

  if (title) {
    await page.keyboard.type(title);
  }

  const collapse = page.getByTestId('page-info-collapse');
  const open = await collapse.getAttribute('aria-expanded');
  if (open?.toLowerCase() !== 'true') {
    await collapse.click();
  }

  // add if not exists
  if ((await getTemplateRow(page).count()) === 0) {
    const addPropertyButton = page.getByTestId('add-property-button');
    if (!(await addPropertyButton.isVisible())) {
      await page.getByTestId('property-collapsible-button').click();
    }
    await addPropertyButton.click();
    await page
      .locator('[role="menuitem"][data-property-type="journal"]')
      .click();
    await page.keyboard.press('Escape');
  }
  // expand if collapsed
  else if (!(await getTemplateRow(page).isVisible())) {
    await page.getByTestId('property-collapsible-button').click();
  }

  const templateRow = getTemplateRow(page);
  await expect(templateRow).toBeVisible();
  await toggleTemplate(templateRow, true);

  // focus editor
  await page.locator('affine-note').first().click();
  await onCreated?.();
};

test('create a doc and mark it as template', async ({ page }) => {
  await openHomePage(page);
  await enableFeatureFlag(page);
  await createDocAndMarkAsTemplate(page, 'Test Template', async () => {
    await page.keyboard.type('# Template');
    await page.keyboard.press('Enter');
    await page.keyboard.type('This is a template doc');
  });
});

test('create a doc, and initialize it from template', async ({ page }) => {
  await openHomePage(page);
  await enableFeatureFlag(page);
  await createDocAndMarkAsTemplate(page, 'Test Template', async () => {
    await page.keyboard.type('# Template');
    await page.keyboard.press('Enter');
    await page.keyboard.type('This is a template doc');
  });

  await page.getByTestId('sidebar-new-page-button').click();
  await waitForEditorLoad(page);
  await page.getByTestId('template-docs-badge').click();
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('Enter');
  await expect(page.getByText('This is a template doc')).toBeVisible();

  // the starter bar should be hidden
  await expect(page.getByTestId('template-docs-badge')).not.toBeVisible();
});
