# 🎨 Task Assignment: Codex - Playwright Visual Testing

**Assignee:** Codex (Frontend & UI Specialist)  
**Priority:** HIGH  
**Status:** READY TO START  
**Date:** 2025-09-30  
**Estimated Time:** 3-4 hours

---

## 🎯 Mission

Test the **VoiceIndicator** and **VoiceStatusBar** components using Playwright to validate:
- ✅ Visual appearance and state transitions
- ✅ WCAG AAA accessibility compliance
- ✅ Animations and interactions
- ✅ Responsive design
- ✅ Cross-browser compatibility

---

## 📋 Prerequisites (ALREADY COMPLETE ✅)

- ✅ Playwright 1.52.0 installed
- ✅ Browsers installed (Chromium, Firefox, WebKit)
- ✅ Test directories created (`test-results/`)
- ✅ MCP configuration ready (`.mcp/playwright-config.json`)
- ✅ UI Components completed:
  - `VoiceIndicator` with state transitions, error handling, transcript control
  - `VoiceStatusBar` with microphone meter, status announcements, accessibility

---

## 🎭 Your Playwright Capabilities

As configured in `.mcp/playwright-config.json`, you have:

**Permissions:**
- ✅ Browser launch and control
- ✅ Screenshot capture and comparison
- ✅ Page navigation and element interaction
- ✅ **Visual testing** (snapshots & comparisons)
- ✅ **Component testing** (Storybook integration)
- ✅ **Accessibility testing** (WCAG AAA validation)
- ✅ **Responsive design validation** (multiple viewports)

**Use Cases:**
- UI component visual testing
- Visual regression testing
- WCAG AAA accessibility validation
- Responsive design across viewports
- Storybook integration testing

---

## 📁 Component Locations

Your completed components are here:

```
packages/frontend/core/src/modules/voice-control/components/
├── voice-indicator/
│   ├── index.tsx           (52 lines - Main component)
│   ├── index.css.ts        (128 lines - Styles)
│   └── index.stories.tsx   (23 lines - Storybook stories)
└── voice-status-bar/
    ├── index.tsx           (45 lines - Main component)
    ├── index.css.ts        (9 lines - Styles)
    └── index.stories.tsx   (7 lines - Storybook stories)
```

---

## 🎯 Task Breakdown

### Phase 1: Setup Playwright Test Files (30 min)

**Create test structure:**

```
tests/voice-control/
└── components/
    ├── voice-indicator.spec.ts      (Create this)
    └── voice-status-bar.spec.ts     (Create this)
```

**Location:** `C:\Users\marlon\Projects\ccc-affine-canary\tests\voice-control\components\`

---

### Phase 2: Test VoiceIndicator Component (90 min)

**File:** `tests/voice-control/components/voice-indicator.spec.ts`

#### Test Cases to Implement:

1. **Basic Rendering**
   - Component renders without errors
   - Default idle state is visible
   - All required elements are present

2. **State Transitions**
   - Idle → Listening transition
   - Listening → Processing transition
   - Processing → Idle transition
   - Error state handling

3. **Visual States**
   - Idle state appearance
   - Listening state with animation
   - Processing state with spinner
   - Error state with error message

4. **Accessibility**
   - ARIA attributes are correct
   - Screen reader announcements work
   - Keyboard navigation works
   - Focus states are visible

5. **Interactions**
   - Microphone button click works
   - Transcript toggle works
   - Error dismissal works

6. **Visual Regression**
   - Baseline screenshots for each state
   - Compare against baselines

#### Example Test Structure:

```typescript
import { test, expect } from '@playwright/test';

test.describe('VoiceIndicator Component', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to Storybook story
    await page.goto('http://localhost:6006/?path=/story/voice-indicator--default');
    await page.waitForLoadState('networkidle');
  });

  test('should render in idle state by default', async ({ page }) => {
    const indicator = page.locator('[data-testid="voice-indicator"]');
    await expect(indicator).toBeVisible();
    
    // Take baseline screenshot
    await expect(page).toHaveScreenshot('voice-indicator-idle.png');
  });

  test('should transition to listening state', async ({ page }) => {
    const button = page.locator('[data-testid="voice-indicator-button"]');
    await button.click();
    
    // Wait for state transition
    await page.waitForTimeout(300);
    
    // Verify visual state
    const indicator = page.locator('[data-testid="voice-indicator"]');
    await expect(indicator).toHaveAttribute('data-state', 'listening');
    
    // Capture screenshot
    await expect(page).toHaveScreenshot('voice-indicator-listening.png');
  });

  test('should display processing spinner', async ({ page }) => {
    // Trigger processing state
    await page.evaluate(() => {
      window.dispatchEvent(new CustomEvent('voice-processing'));
    });
    
    const spinner = page.locator('[data-testid="processing-spinner"]');
    await expect(spinner).toBeVisible();
    
    // Screenshot
    await expect(page).toHaveScreenshot('voice-indicator-processing.png');
  });

  test('should show error state with message', async ({ page }) => {
    // Trigger error
    await page.evaluate(() => {
      window.dispatchEvent(new CustomEvent('voice-error', {
        detail: { error: 'Microphone not available' }
      }));
    });
    
    const errorPanel = page.locator('[data-testid="error-panel"]');
    await expect(errorPanel).toBeVisible();
    await expect(errorPanel).toContainText('Microphone not available');
    
    // Screenshot
    await expect(page).toHaveScreenshot('voice-indicator-error.png');
  });

  test('should meet WCAG AAA accessibility standards', async ({ page }) => {
    const indicator = page.locator('[data-testid="voice-indicator"]');
    
    // Check ARIA attributes
    await expect(indicator).toHaveAttribute('role', 'button');
    await expect(indicator).toHaveAttribute('aria-label');
    
    // Check keyboard navigation
    await indicator.focus();
    await expect(indicator).toBeFocused();
    
    // Check for accessible name
    const accessibleName = await indicator.getAttribute('aria-label');
    expect(accessibleName).toBeTruthy();
  });

  test('should handle transcript toggle', async ({ page }) => {
    const toggleButton = page.locator('[data-testid="transcript-toggle"]');
    
    if (await toggleButton.isVisible()) {
      await toggleButton.click();
      
      const transcript = page.locator('[data-testid="transcript-display"]');
      await expect(transcript).toBeVisible();
    }
  });
});
```

---

### Phase 3: Test VoiceStatusBar Component (90 min)

**File:** `tests/voice-control/components/voice-status-bar.spec.ts`

#### Test Cases to Implement:

1. **Basic Rendering**
   - Component renders without errors
   - Status bar is visible
   - Microphone meter is present

2. **Microphone Meter**
   - Meter displays correct ARIA role
   - Meter value updates
   - Visual representation is correct

3. **Status Announcements**
   - Live region for screen readers exists
   - Status changes are announced
   - aria-live="polite" is set

4. **Accessibility**
   - WCAG AAA contrast (7:1 ratio)
   - ARIA meter attributes
   - Screen reader compatibility
   - Keyboard control states

5. **Visual States**
   - Active state styling
   - Disabled state styling
   - Phase-aware borders
   - Meter color variations

6. **Visual Regression**
   - Baseline screenshots
   - State comparisons

#### Example Test Structure:

```typescript
import { test, expect } from '@playwright/test';

test.describe('VoiceStatusBar Component', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:6006/?path=/story/voice-status-bar--default');
    await page.waitForLoadState('networkidle');
  });

  test('should render with microphone meter', async ({ page }) => {
    const statusBar = page.locator('[data-testid="voice-status-bar"]');
    await expect(statusBar).toBeVisible();
    
    const meter = page.locator('[role="meter"]');
    await expect(meter).toBeVisible();
    await expect(meter).toHaveAttribute('aria-label', /microphone/i);
    
    // Screenshot
    await expect(page).toHaveScreenshot('voice-status-bar-default.png');
  });

  test('should have screen reader announcements', async ({ page }) => {
    const liveRegion = page.locator('[role="status"]');
    await expect(liveRegion).toBeVisible();
    await expect(liveRegion).toHaveAttribute('aria-live', 'polite');
  });

  test('should meet WCAG AAA contrast requirements', async ({ page }) => {
    const statusBar = page.locator('[data-testid="voice-status-bar"]');
    
    // Get computed colors
    const backgroundColor = await statusBar.evaluate((el) => {
      return window.getComputedStyle(el).backgroundColor;
    });
    
    const textColor = await statusBar.evaluate((el) => {
      return window.getComputedStyle(el).color;
    });
    
    // Calculate contrast ratio (simplified - you'd use a library for real calculation)
    // For now, just verify colors exist
    expect(backgroundColor).toBeTruthy();
    expect(textColor).toBeTruthy();
    
    // TODO: Implement actual contrast ratio calculation
    // Should be >= 7:1 for WCAG AAA
  });

  test('should display different states correctly', async ({ page }) => {
    const statusBar = page.locator('[data-testid="voice-status-bar"]');
    
    // Active state
    await page.evaluate(() => {
      window.dispatchEvent(new CustomEvent('voice-active'));
    });
    await expect(page).toHaveScreenshot('voice-status-bar-active.png');
    
    // Disabled state
    await page.evaluate(() => {
      window.dispatchEvent(new CustomEvent('voice-disabled'));
    });
    await expect(page).toHaveScreenshot('voice-status-bar-disabled.png');
  });

  test('should handle control interactions', async ({ page }) => {
    const controls = page.locator('[data-testid="voice-controls"]');
    
    if (await controls.isVisible()) {
      const buttons = controls.locator('button');
      const buttonCount = await buttons.count();
      
      expect(buttonCount).toBeGreaterThan(0);
      
      // Test each button is clickable
      for (let i = 0; i < buttonCount; i++) {
        const button = buttons.nth(i);
        await expect(button).toBeEnabled();
      }
    }
  });
});
```

---

## 🚀 Execution Steps

### Step 1: Start Storybook (Required!)

```powershell
# In Terminal 1
cd C:\Users\marlon\Projects\ccc-affine-canary
corepack yarn storybook
```

**Wait for:** `http://localhost:6006` to be ready

---

### Step 2: Create Test Directory

```powershell
# In Terminal 2
New-Item -ItemType Directory -Path "tests\voice-control\components" -Force
```

---

### Step 3: Create Test Files

Create both test files:
1. `tests/voice-control/components/voice-indicator.spec.ts`
2. `tests/voice-control/components/voice-status-bar.spec.ts`

Use the example structures above as starting points.

---

### Step 4: Run Tests

```powershell
# Run all component tests
npx playwright test tests/voice-control/components

# Run in UI mode (interactive)
npx playwright test tests/voice-control/components --ui

# Run in headed mode (see browser)
npx playwright test tests/voice-control/components --headed

# Run specific file
npx playwright test tests/voice-control/components/voice-indicator.spec.ts
```

---

### Step 5: Generate Baseline Screenshots

```powershell
# First run - generates baseline screenshots
npx playwright test tests/voice-control/components

# Subsequent runs - compares against baselines
npx playwright test tests/voice-control/components
```

---

### Step 6: Update Snapshots (if needed)

```powershell
# If visual changes are intentional
npx playwright test tests/voice-control/components --update-snapshots
```

---

### Step 7: Generate HTML Report

```powershell
# Generate report
npx playwright test tests/voice-control/components --reporter=html

# View report
npx playwright show-report
```

---

## 📊 Success Criteria

After completing this task, you should have:

- ✅ `voice-indicator.spec.ts` with 10+ test cases
- ✅ `voice-status-bar.spec.ts` with 10+ test cases
- ✅ All tests passing
- ✅ Baseline screenshots for all states
- ✅ Accessibility validation passing
- ✅ HTML report generated
- ✅ Documentation of any issues found

---

## 📈 Testing Best Practices

### 1. Use Data Test IDs

Make sure components have `data-testid` attributes:

```tsx
<div data-testid="voice-indicator">
  <button data-testid="voice-indicator-button">...</button>
</div>
```

### 2. Wait for States

```typescript
await page.waitForLoadState('networkidle');
await page.waitForSelector('[data-testid="element"]');
await page.waitForTimeout(300); // For animations
```

### 3. Take Screenshots Strategically

```typescript
// Full page
await expect(page).toHaveScreenshot('name.png');

// Specific element
await expect(element).toHaveScreenshot('element.png');

// With options
await expect(page).toHaveScreenshot('name.png', {
  maxDiffPixels: 100,
  threshold: 0.2
});
```

### 4. Test Accessibility

```typescript
// Check ARIA
await expect(element).toHaveAttribute('role', 'button');
await expect(element).toHaveAttribute('aria-label', 'Voice indicator');

// Check keyboard
await element.press('Enter');
await element.press('Space');

// Check focus
await element.focus();
await expect(element).toBeFocused();
```

---

## 🐛 Common Issues & Solutions

### Issue: Storybook not loading

```powershell
# Solution: Check if Storybook is running
# Open http://localhost:6006 in browser
# Restart Storybook if needed
```

### Issue: Element not found

```typescript
// Solution: Add waits
await page.waitForSelector('[data-testid="element"]', { timeout: 5000 });
```

### Issue: Screenshots don't match

```powershell
# Solution: Update baselines if changes are intentional
npx playwright test --update-snapshots
```

### Issue: Timeout errors

```typescript
// Solution: Increase timeout
test.setTimeout(60000); // 60 seconds
```

---

## 📚 Documentation References

1. **Playwright MCP Guide:** `.mcp/PLAYWRIGHT_MCP_GUIDE.md`
2. **Playwright Docs:** https://playwright.dev/docs/intro
3. **Your Components:**
   - `packages/frontend/core/src/modules/voice-control/components/voice-indicator/`
   - `packages/frontend/core/src/modules/voice-control/components/voice-status-bar/`
4. **Storybook Stories:**
   - Check `*.stories.tsx` files for component usage examples

---

## 📞 Reporting Back

After completing the task, update `central-memory.json` with:

```json
{
  "timestamp": "2025-09-30T14:00:00Z",
  "author": "codex",
  "summary": "Playwright Visual Testing Complete - Voice UI Components",
  "details": {
    "testsCreated": ["voice-indicator.spec.ts", "voice-status-bar.spec.ts"],
    "totalTests": 20,
    "testsPassed": 20,
    "testsFailed": 0,
    "screenshotsGenerated": 10,
    "accessibilityIssues": [],
    "visualIssues": [],
    "recommendations": []
  }
}
```

---

## 🎯 Quick Start Commands

```powershell
# 1. Start Storybook (Terminal 1)
corepack yarn storybook

# 2. Create test directory (Terminal 2)
New-Item -ItemType Directory -Path "tests\voice-control\components" -Force

# 3. Run tests in UI mode
npx playwright test tests/voice-control/components --ui

# 4. Generate report
npx playwright test tests/voice-control/components --reporter=html
npx playwright show-report
```

---

## 🎉 You're Ready!

You have:
- ✅ Playwright 1.52.0 installed
- ✅ All browsers ready (Chromium, Firefox, WebKit)
- ✅ Complete MCP permissions for visual testing
- ✅ Your UI components ready to test
- ✅ Storybook stories available

**Start with:** Running Storybook and creating the first test file!

---

**Good luck, Codex! 🎨✨**

*Last Updated: 2025-09-30 by Warp*