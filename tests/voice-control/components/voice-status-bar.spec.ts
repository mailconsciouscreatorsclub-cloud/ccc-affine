import { expect, test } from '@playwright/test';

type StoryArgs = Record<string, string | number | boolean>;

const buildArgs = (args?: StoryArgs) => {
  if (!args) {
    return '';
  }
  return Object.entries(args)
    .map(([key, value]) => `${encodeURIComponent(key)}:${encodeURIComponent(String(value))}`)
    .join(';');
};

const gotoStory = async (page: import('@playwright/test').Page, storyId: string, args?: StoryArgs) => {
  const query = buildArgs(args);
  const url = `http://localhost:6006/iframe.html?id=${storyId}&viewMode=story${query ? `&args=${query}` : ''}`;
  await page.goto(url, { waitUntil: 'networkidle' });
};

const disableAnimations = async (page: import('@playwright/test').Page) => {
  await page.addStyleTag({
    content: `*, *::before, *::after { animation-duration: 0s !important; animation-delay: 0s !important; transition-duration: 0s !important; }`,
  });
};

test.describe('VoiceStatusBar (Storybook)', () => {
  test('renders idle status with accessible meter output', async ({ page }) => {
    await gotoStory(page, 'voice-control-voice-status-bar--idle');
    await disableAnimations(page);

    const status = page.getByRole('status');
    await expect(status).toHaveAttribute('aria-live', 'polite');

    const meter = page.getByRole('meter', { name: /microphone input level/i });
    await expect(meter).toHaveAttribute('aria-valuenow', '0');
    await expect(status).toContainText('Voice control is ready');

    const toggle = page.getByRole('button', { name: /pause voice control/i });
    await expect(toggle).toHaveAttribute('aria-pressed', 'true');
  });

  test('displays listening state with elevated microphone meter', async ({ page }) => {
    await gotoStory(page, 'voice-control-voice-status-bar--listening');
    await disableAnimations(page);

    const meter = page.getByRole('meter', { name: /microphone input level/i });
    await expect(meter).toHaveAttribute('aria-valuenow', '68');

    const statusBadge = page.getByText(/Language: English \(US\) • Active/);
    await expect(statusBadge).toBeVisible();
  });

  test('surfaced processing story renders busy language', async ({ page }) => {
    await gotoStory(page, 'voice-control-voice-status-bar--processing');
    await disableAnimations(page);

    const status = page.getByRole('status');
    await expect(status).toHaveAttribute('aria-live', 'polite');
    await expect(status).toContainText('Analyzing the latest command');
  });

  test('error state is asserted and labelled as paused', async ({ page }) => {
    await gotoStory(page, 'voice-control-voice-status-bar--error');
    await disableAnimations(page);

    const status = page.getByRole('status');
    await expect(status).toHaveAttribute('aria-live', 'assertive');
    await expect(status).toContainText('Last command failed: Toggle sidebar');

    const badge = page.getByText(/Language: English \(US\) • Paused/);
    await expect(badge).toBeVisible();
  });

  test('captures listening bar visual regression', async ({ page }) => {
    await gotoStory(page, 'voice-control-voice-status-bar--listening');
    await disableAnimations(page);

    const status = page.getByRole('status');
    await expect(status).toHaveScreenshot('voice-status-bar-listening.png', {
      animations: 'disabled',
      caret: 'hide',
    });
  });
});
