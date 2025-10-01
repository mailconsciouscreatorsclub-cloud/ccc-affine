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

test.describe('VoiceIndicator (Storybook)', () => {
  test('renders idle indicator with accessible status output', async ({ page }) => {
    await gotoStory(page, 'voice-control-voice-indicator--idle');
    await disableAnimations(page);

    const status = page.getByRole('status');
    await expect(status).toHaveAttribute('aria-live', 'polite');
    await expect(status).not.toHaveAttribute('aria-busy', /true/);

    const indicatorButton = status.locator('button[data-state="idle"]');
    await expect(indicatorButton).toBeVisible();

    await expect(page.getByRole('button', { name: /transcript/i })).toHaveCount(0);
  });

  test('supports transcript toggle interaction', async ({ page }) => {
    await gotoStory(page, 'voice-control-voice-indicator--listening', {
      transcript: 'Open my project notes…',
      confidence: 0.76,
    });
    await disableAnimations(page);

    const toggle = page.getByRole('button', { name: /show transcript preview/i });
    await toggle.click();

    const transcriptPanel = page.getByRole('region').filter({ hasText: 'Listening…' });
    await expect(transcriptPanel).toBeVisible();
    await expect(transcriptPanel).toContainText('Open my project notes…');
  });

  test('indicates processing state via busy status and spinner', async ({ page }) => {
    await gotoStory(page, 'voice-control-voice-indicator--processing', {
      transcript: 'Creating a new page called Meeting Notes…',
      confidence: 0.92,
    });
    await disableAnimations(page);

    const status = page.getByRole('status');
    await expect(status).toHaveAttribute('aria-live', 'polite');
    await expect(status).toHaveAttribute('aria-busy', 'true');

    const spinner = page.locator('[class*="processingSpinner"]');
    await expect(spinner).toBeVisible();
  });

  test('announces error state assertively', async ({ page }) => {
    await gotoStory(page, 'voice-control-voice-indicator--error', {
      transcript: 'Could you repeat that command?',
      error: 'Microphone permissions were denied.',
    });
    await disableAnimations(page);

    const status = page.getByRole('status');
    await expect(status).toHaveAttribute('aria-live', 'assertive');
    await expect(status).toHaveAttribute('data-state', 'error');
    await expect(status).toContainText('Microphone permissions were denied.');
  });

  test('captures listening state visual regression', async ({ page }) => {
    await gotoStory(page, 'voice-control-voice-indicator--listening', {
      transcript: 'Listening for command…',
      confidence: 0.65,
    });
    await disableAnimations(page);

    const status = page.getByRole('status');
    await expect(status).toHaveScreenshot('voice-indicator-listening.png', {
      animations: 'disabled',
      caret: 'hide',
    });
  });
});
