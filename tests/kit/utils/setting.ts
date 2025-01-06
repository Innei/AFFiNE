import { expect, type Page } from '@playwright/test';

export async function clickCollaborationPanel(page: Page) {
  await page.click('[data-tab-key="collaboration"]');
}

export async function clickPublishPanel(page: Page) {
  await page.click('[data-tab-key="publish"]');
}

export async function openSettingModal(page: Page) {
  await page.getByTestId('settings-modal-trigger').click();
}

export async function openAppearancePanel(page: Page) {
  await page.getByTestId('appearance-panel-trigger').click();
}

export async function openEditorSetting(page: Page) {
  await page.getByTestId('settings-modal-trigger').click();
  await page.getByTestId('editor-panel-trigger').click();
}

export async function openShortcutsPanel(page: Page) {
  await page.getByTestId('shortcuts-panel-trigger').click();
}

export async function openAboutPanel(page: Page) {
  await page.getByTestId('about-panel-trigger').click();
}

export async function openExperimentalFeaturesPanel(page: Page) {
  await page.getByTestId('experimental-features-trigger').click();
}

export async function confirmExperimentalPrompt(page: Page) {
  await page.getByTestId('experimental-prompt-disclaimer').click();
  await page.getByTestId('experimental-confirm-button').click();
}

export async function openWorkspaceSettingPanel(
  page: Page,
  workspaceName: string
) {
  await page.getByTestId('settings-sidebar').getByText(workspaceName).click();
}

export async function clickUserInfoCard(page: Page) {
  await page.getByTestId('user-info-card').click({
    delay: 50,
  });
}

export async function toggleFeatureFlag(
  page: Page,
  flag: string,
  value = true
) {
  await openSettingModal(page);
  await openExperimentalFeaturesPanel(page);
  const prompt = page.getByTestId('experimental-prompt');
  await expect(prompt).toBeVisible();
  await confirmExperimentalPrompt(page);
  const settings = page.getByTestId('experimental-settings');
  await expect(settings).toBeVisible();

  const featureRow = settings.getByTestId(`experimental-feature-${flag}`);
  const switchValue = await featureRow
    .locator('input[type="checkbox"]')
    .inputValue();

  const targetValue = value ? 'on' : 'off';

  if (switchValue !== targetValue) {
    await featureRow.getByTestId('feature-switch').click();
  }
  await page.keyboard.press('Escape');
}
