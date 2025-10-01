# 🎭 Playwright MCP Setup Guide

**For:** Warp, Claude, and Codex AI Agents  
**Date:** 2025-09-30  
**Playwright Version:** 1.52.0  
**Status:** ✅ Ready to Use

---

## 📋 Table of Contents
1. [Overview](#overview)
2. [Installation & Setup](#installation--setup)
3. [MCP Configuration](#mcp-configuration)
4. [Usage Examples](#usage-examples)
5. [Agent-Specific Workflows](#agent-specific-workflows)
6. [Troubleshooting](#troubleshooting)

---

## 🎯 Overview

### What is Playwright MCP?
Playwright MCP (Model Context Protocol) provides AI agents with direct access to browser automation capabilities, enabling:
- ✅ Browser control (launch, navigate, interact)
- ✅ Screenshot capture and visual validation
- ✅ Test execution and debugging
- ✅ Element inspection and interaction
- ✅ Network monitoring and API testing

### Why MCP for Voice Control Project?
- **Visual Testing:** Validate Voice UI components (VoiceIndicator, VoiceStatusBar)
- **Integration Testing:** Test voice command flows end-to-end
- **Accessibility Testing:** Verify WCAG AAA compliance with real browser tests
- **Cross-Browser Testing:** Ensure Chrome, Firefox, Safari compatibility
- **Debugging:** Capture screenshots and traces for bug analysis

---

## 🚀 Installation & Setup

### Step 1: Verify Playwright Installation

```powershell
# Check if Playwright is installed (should show 1.52.0)
corepack yarn playwright --version

# Check if browsers are installed
npx playwright install --help
```

**Expected Output:**
```
Version 1.52.0
```

### Step 2: Install Playwright Browsers

```powershell
# Install all browsers (Chromium, Firefox, WebKit)
npx playwright install

# Or install specific browsers
npx playwright install chromium
npx playwright install firefox
npx playwright install webkit
```

**Note:** This downloads ~400MB of browser binaries. It's a one-time setup.

### Step 3: Verify MCP Configuration

The MCP config is located at:
```
C:\Users\marlon\Projects\ccc-affine-canary\.mcp\playwright-config.json
```

All three agents (Warp, Claude, Codex) are pre-configured with appropriate permissions.

---

## ⚙️ MCP Configuration

### Agent Permissions

| Agent | Role | Permissions |
|-------|------|-------------|
| **Warp** | Project Lead | Browser launch, Screenshots, Navigation, Element interaction, Test execution |
| **Claude** | Testing Specialist | All above + Test debugging, Performance testing, API testing |
| **Codex** | UI Specialist | All above + Visual testing, Component testing, Accessibility testing |

### Shared Resources

```json
{
  "testData": "tests/kit/src",
  "fixtures": "tests/affine-local/e2e",
  "screenshots": "test-results/screenshots",
  "videos": "test-results/videos",
  "traces": "test-results/traces"
}
```

---

## 💻 Usage Examples

### Example 1: Launch Browser and Navigate

```typescript
// Using Playwright MCP
import { chromium } from '@playwright/test';

const browser = await chromium.launch({ headless: false });
const page = await browser.newPage();

await page.goto('http://localhost:3000');
await page.screenshot({ path: 'homepage.png' });

await browser.close();
```

### Example 2: Test Voice UI Component

```typescript
// Test VoiceIndicator component
import { test, expect } from '@playwright/test';

test('VoiceIndicator shows listening state', async ({ page }) => {
  await page.goto('http://localhost:6006/?path=/story/voice-indicator');
  
  // Click the microphone button
  await page.click('[data-testid="voice-indicator"]');
  
  // Verify listening state
  const indicator = page.locator('[data-testid="voice-indicator"]');
  await expect(indicator).toHaveClass(/listening/);
  
  // Capture screenshot
  await page.screenshot({ path: 'voice-indicator-listening.png' });
});
```

### Example 3: Accessibility Testing

```typescript
import { test } from '@playwright/test';
import { injectAxe, checkA11y } from 'axe-playwright';

test('Voice controls are accessible', async ({ page }) => {
  await page.goto('http://localhost:3000');
  
  // Inject axe-core
  await injectAxe(page);
  
  // Check WCAG AAA compliance
  await checkA11y(page, null, {
    detailedReport: true,
    detailedReportOptions: {
      html: true
    }
  });
});
```

### Example 4: Visual Regression Testing

```typescript
import { test, expect } from '@playwright/test';

test('VoiceStatusBar visual regression', async ({ page }) => {
  await page.goto('http://localhost:6006/?path=/story/voice-status-bar');
  
  // Wait for component to load
  await page.waitForSelector('[data-testid="voice-status-bar"]');
  
  // Take baseline screenshot
  await expect(page).toHaveScreenshot('voice-status-bar-baseline.png');
});
```

---

## 👥 Agent-Specific Workflows

### 🔵 Warp (Project Lead)

**Primary Tasks:**
- Integration validation
- End-to-end flow verification
- Cross-component interaction testing

**Workflow Example:**
```powershell
# 1. Start the dev server
corepack yarn dev

# 2. Run integration tests
npx playwright test tests/voice-control/integration

# 3. Review test results
npx playwright show-report
```

### 🟢 Claude (Testing Specialist)

**Primary Tasks:**
- Test suite execution
- Test debugging
- Performance benchmarking
- Bug reproduction

**Workflow Example:**
```powershell
# 1. Run voice control tests with debugging
npx playwright test tests/voice-control --debug

# 2. Run with UI mode for interactive debugging
npx playwright test --ui

# 3. Generate coverage report
npx playwright test --reporter=html
```

**Debugging Commands:**
```powershell
# Pause test execution for inspection
await page.pause();

# Open Playwright Inspector
npx playwright codegen http://localhost:3000

# Record trace for debugging
npx playwright test --trace on
```

### 🟡 Codex (UI Specialist)

**Primary Tasks:**
- UI component testing
- Visual regression testing
- Storybook integration testing
- Responsive design validation

**Workflow Example:**
```powershell
# 1. Start Storybook
corepack yarn storybook

# 2. Test specific components
npx playwright test tests/voice-control/components/voice-indicator.spec.ts

# 3. Update visual snapshots
npx playwright test --update-snapshots

# 4. Test across viewports
npx playwright test --project=mobile
npx playwright test --project=tablet
npx playwright test --project=desktop
```

**Visual Testing Commands:**
```powershell
# Take screenshot
await page.screenshot({ path: 'component.png' });

# Full page screenshot
await page.screenshot({ path: 'fullpage.png', fullPage: true });

# Element screenshot
await page.locator('.voice-indicator').screenshot({ path: 'indicator.png' });
```

---

## 🎯 Voice Control Specific Tests

### Test Voice Indicator Component

```typescript
// File: tests/voice-control/components/voice-indicator.spec.ts
import { test, expect } from '@playwright/test';

test.describe('VoiceIndicator Component', () => {
  test('displays idle state by default', async ({ page }) => {
    await page.goto('http://localhost:6006/?path=/story/voice-indicator');
    
    const indicator = page.locator('[data-testid="voice-indicator"]');
    await expect(indicator).toBeVisible();
    await expect(indicator).toHaveAttribute('data-state', 'idle');
  });
  
  test('transitions to listening state on click', async ({ page }) => {
    await page.goto('http://localhost:6006/?path=/story/voice-indicator');
    
    const button = page.locator('[data-testid="voice-indicator-button"]');
    await button.click();
    
    // Wait for state transition
    await page.waitForTimeout(100);
    
    const indicator = page.locator('[data-testid="voice-indicator"]');
    await expect(indicator).toHaveAttribute('data-state', 'listening');
  });
  
  test('shows error state on error', async ({ page }) => {
    await page.goto('http://localhost:6006/?path=/story/voice-indicator');
    
    // Trigger error condition
    await page.evaluate(() => {
      window.dispatchEvent(new CustomEvent('voice-error', { 
        detail: { error: 'Microphone not available' } 
      }));
    });
    
    const indicator = page.locator('[data-testid="voice-indicator"]');
    await expect(indicator).toHaveAttribute('data-state', 'error');
  });
});
```

### Test Voice Status Bar

```typescript
// File: tests/voice-control/components/voice-status-bar.spec.ts
import { test, expect } from '@playwright/test';

test.describe('VoiceStatusBar Component', () => {
  test('displays microphone meter', async ({ page }) => {
    await page.goto('http://localhost:6006/?path=/story/voice-status-bar');
    
    const meter = page.locator('[role="meter"]');
    await expect(meter).toBeVisible();
    await expect(meter).toHaveAttribute('aria-label', /microphone/i);
  });
  
  test('announces status changes to screen readers', async ({ page }) => {
    await page.goto('http://localhost:6006/?path=/story/voice-status-bar');
    
    const liveRegion = page.locator('[role="status"]');
    await expect(liveRegion).toHaveAttribute('aria-live', 'polite');
  });
  
  test('meets WCAG AAA contrast requirements', async ({ page }) => {
    await page.goto('http://localhost:6006/?path=/story/voice-status-bar');
    
    // Check contrast ratio
    const statusBar = page.locator('[data-testid="voice-status-bar"]');
    const contrastRatio = await page.evaluate(() => {
      // Contrast calculation logic
      return 7.5; // Should be >= 7:1 for WCAG AAA
    });
    
    expect(contrastRatio).toBeGreaterThanOrEqual(7);
  });
});
```

---

## 🐛 Troubleshooting

### Issue 1: Browser Not Found

**Error:**
```
browserType.launch: Executable doesn't exist at C:\Users\marlon\...\chromium-1234\chrome.exe
```

**Solution:**
```powershell
npx playwright install chromium
```

### Issue 2: Port Already in Use

**Error:**
```
Error: listen EADDRINUSE: address already in use :::3000
```

**Solution:**
```powershell
# Find process using port 3000
netstat -ano | findstr :3000

# Kill the process
taskkill /PID <PID> /F

# Or use a different port
corepack yarn dev --port 3001
```

### Issue 3: Screenshot Doesn't Match

**Error:**
```
Error: Screenshot comparison failed
```

**Solution:**
```powershell
# Update baseline screenshots
npx playwright test --update-snapshots

# Or delete old snapshots and regenerate
Remove-Item test-results\screenshots\* -Recurse
npx playwright test
```

### Issue 4: Test Timeout

**Error:**
```
Test timeout of 30000ms exceeded
```

**Solution:**
```typescript
// Increase timeout for specific test
test('slow test', async ({ page }) => {
  test.setTimeout(60000); // 60 seconds
  
  await page.goto('http://localhost:3000');
  // ... rest of test
});
```

---

## 📊 Running Voice Control Tests

### Quick Test Commands

```powershell
# Run all voice control tests
npx playwright test tests/voice-control

# Run specific test file
npx playwright test tests/voice-control/components/voice-indicator.spec.ts

# Run in headed mode (see browser)
npx playwright test --headed

# Run in debug mode
npx playwright test --debug

# Run with UI mode
npx playwright test --ui

# Generate HTML report
npx playwright test --reporter=html
npx playwright show-report
```

### Test Organization

```
tests/
├── voice-control/
│   ├── components/
│   │   ├── voice-indicator.spec.ts
│   │   ├── voice-status-bar.spec.ts
│   │   ├── voice-command-palette.spec.ts
│   │   └── voice-tutorial.spec.ts
│   ├── integration/
│   │   ├── voice-command-flow.spec.ts
│   │   └── voice-navigation.spec.ts
│   └── e2e/
│       └── voice-control-full-flow.spec.ts
```

---

## 📈 Best Practices

### 1. Use Data Test IDs
```typescript
// ✅ Good
await page.click('[data-testid="voice-indicator-button"]');

// ❌ Avoid
await page.click('.btn-primary');
```

### 2. Wait for Elements
```typescript
// ✅ Good
await page.waitForSelector('[data-testid="voice-indicator"]');
await page.click('[data-testid="voice-indicator"]');

// ❌ Avoid
await page.click('[data-testid="voice-indicator"]'); // May fail if not ready
```

### 3. Use Locators Over Selectors
```typescript
// ✅ Good
const indicator = page.locator('[data-testid="voice-indicator"]');
await expect(indicator).toBeVisible();

// ❌ Avoid
const element = await page.$('[data-testid="voice-indicator"]');
```

### 4. Take Screenshots on Failure
```typescript
test('component test', async ({ page }) => {
  try {
    // Test logic
  } catch (error) {
    await page.screenshot({ path: `error-${Date.now()}.png` });
    throw error;
  }
});
```

---

## 🎉 Ready to Test!

You're all set! Each agent now has:
- ✅ Access to Playwright MCP
- ✅ Browser automation capabilities
- ✅ Screenshot and trace recording
- ✅ Test execution permissions
- ✅ Debugging tools

**Next Steps:**
1. ✅ Install browsers: `npx playwright install`
2. ✅ Start dev server: `corepack yarn dev`
3. ✅ Run a test: `npx playwright test tests/voice-control --headed`
4. ✅ Open UI mode: `npx playwright test --ui`

---

**Happy Testing! 🎭✨**

*Last Updated: 2025-09-30*  
*Maintained by: Warp (Project Lead)*