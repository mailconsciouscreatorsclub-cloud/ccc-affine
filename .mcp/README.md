# 🤖 Model Context Protocol (MCP) Configuration

**Location:** `.mcp/`  
**Purpose:** Configuration files for AI agent capabilities and integrations  
**Updated:** 2025-09-30

---

## 📁 Directory Contents

### Core Files

| File | Purpose | Size | Status |
|------|---------|------|--------|
| `playwright-config.json` | Playwright MCP configuration for Warp, Claude, and Codex | 94 lines | ✅ Ready |
| `PLAYWRIGHT_MCP_GUIDE.md` | Comprehensive guide for browser automation | 539 lines | ✅ Complete |
| `setup-playwright.ps1` | Automated setup script for Playwright MCP | 140 lines | ✅ Tested |
| `README.md` | This file - Directory overview | - | ✅ Current |

---

## 🎯 What is MCP?

**Model Context Protocol (MCP)** enables AI agents to:
- Access specific tools and capabilities
- Perform browser automation
- Execute tests and capture results
- Share resources and coordinate workflows

---

## 🎭 Playwright MCP Setup

### Quick Start

```powershell
# Run the automated setup script
.\.mcp\setup-playwright.ps1
```

The script will:
1. ✅ Verify Playwright installation
2. ✅ Check browser installations
3. ✅ Prompt to install browsers (~400MB)
4. ✅ Verify MCP configuration
5. ✅ Create test result directories
6. ✅ Display next steps for each agent

### Manual Setup

If you prefer manual setup:

```powershell
# 1. Install Playwright browsers
npx playwright install

# 2. Create test directories
New-Item -ItemType Directory -Path "test-results\screenshots" -Force
New-Item -ItemType Directory -Path "test-results\videos" -Force
New-Item -ItemType Directory -Path "test-results\traces" -Force

# 3. Verify configuration
Get-Content .\.mcp\playwright-config.json
```

---

## 👥 Agent Capabilities

### 🔵 Warp (Project Lead & Integration Architect)

**Permissions:**
- ✅ Browser launch and control
- ✅ Screenshot capture
- ✅ Page navigation
- ✅ Element interaction
- ✅ Test execution

**Use Cases:**
- Integration testing coordination
- Visual regression validation
- End-to-end flow verification
- UI component validation

**Quick Commands:**
```powershell
# Start dev server and run integration tests
corepack yarn dev
npx playwright test tests/voice-control/integration

# Review results
npx playwright show-report
```

---

### 🟢 Claude (Backend & Testing Specialist)

**Permissions:**
- ✅ All Warp permissions
- ✅ Test debugging
- ✅ Performance testing
- ✅ API endpoint testing
- ✅ Cross-browser validation

**Use Cases:**
- Test suite execution and validation
- Test debugging with screenshots
- Performance benchmarking
- Bug reproduction with traces
- Cross-browser compatibility testing

**Quick Commands:**
```powershell
# Run tests with UI for interactive debugging
npx playwright test --ui

# Debug specific test
npx playwright test --debug

# Generate HTML report
npx playwright test --reporter=html
npx playwright show-report
```

---

### 🟡 Codex (Frontend & UI Specialist)

**Permissions:**
- ✅ All Warp permissions
- ✅ Visual testing
- ✅ Component testing
- ✅ Accessibility testing
- ✅ Responsive design validation

**Use Cases:**
- UI component visual testing
- Visual regression testing
- WCAG AAA accessibility validation
- Responsive design across viewports
- Storybook integration testing

**Quick Commands:**
```powershell
# Start Storybook and test components
corepack yarn storybook
npx playwright test tests/voice-control/components

# Update visual snapshots
npx playwright test --update-snapshots

# Test across different viewports
npx playwright test --project=mobile
npx playwright test --project=tablet
npx playwright test --project=desktop
```

---

## 🎯 Voice Control Testing Capabilities

### Components to Test

1. **VoiceIndicator**
   - State transitions (idle → listening → processing → error)
   - Animations and visual feedback
   - Error handling and recovery
   - Accessibility (ARIA states)

2. **VoiceStatusBar**
   - Microphone meter visualization
   - Status announcements for screen readers
   - WCAG AAA contrast compliance
   - Real-time command feedback

3. **VoiceCommandPalette** (Future)
   - Command search and filtering
   - Keyboard navigation
   - Command selection and execution

4. **VoiceTutorial** (Future)
   - Onboarding flow
   - Interactive training
   - Progress tracking

### Test Types

| Type | Purpose | Tools |
|------|---------|-------|
| **Integration** | End-to-end voice command flows | Playwright + Fixtures |
| **Visual** | Component appearance and animations | Playwright Screenshots |
| **Accessibility** | WCAG AAA compliance | axe-core + Playwright |
| **Performance** | Response times and metrics | Playwright Traces |

---

## 📚 Documentation

### Full Guide
The comprehensive Playwright MCP guide is available at:
```
.mcp/PLAYWRIGHT_MCP_GUIDE.md
```

**Contents:**
- 📋 Overview and benefits
- 🚀 Installation and setup
- ⚙️ Configuration details
- 💻 Usage examples
- 👥 Agent-specific workflows
- 🐛 Troubleshooting guide
- 📈 Best practices

### Key Sections
- **Lines 1-78:** Overview and setup
- **Lines 79-102:** Configuration reference
- **Lines 103-179:** Usage examples
- **Lines 180-272:** Agent workflows
- **Lines 273-356:** Voice control tests
- **Lines 357-427:** Troubleshooting
- **Lines 428-539:** Commands and best practices

---

## 🔧 Common Commands

### Running Tests

```powershell
# Run all tests
npx playwright test

# Run specific directory
npx playwright test tests/voice-control

# Run specific file
npx playwright test tests/voice-control/components/voice-indicator.spec.ts

# Run in headed mode (visible browser)
npx playwright test --headed

# Run in debug mode
npx playwright test --debug

# Run with UI mode
npx playwright test --ui
```

### Capturing Results

```powershell
# Generate HTML report
npx playwright test --reporter=html

# Show report
npx playwright show-report

# Take screenshots
npx playwright test --screenshot=on

# Record video
npx playwright test --video=on

# Record trace
npx playwright test --trace=on
```

### Updating Tests

```powershell
# Update visual snapshots
npx playwright test --update-snapshots

# Generate new tests
npx playwright codegen http://localhost:3000
```

---

## 📊 Test Results Structure

```
test-results/
├── screenshots/          # Visual snapshots
├── videos/              # Test execution recordings
├── traces/              # Detailed execution traces
└── playwright-report/   # HTML test reports
```

---

## 🚀 Next Steps

1. **Run Setup Script**
   ```powershell
   .\.mcp\setup-playwright.ps1
   ```

2. **Install Browsers** (if not already installed)
   ```powershell
   npx playwright install
   ```

3. **Read the Guide**
   ```powershell
   # Open in your editor
   code .\.mcp\PLAYWRIGHT_MCP_GUIDE.md
   ```

4. **Try a Test**
   ```powershell
   # Start dev server
   corepack yarn dev
   
   # Run a test in headed mode
   npx playwright test --headed
   ```

---

## 🆘 Need Help?

### Resources
- **Full Guide:** `.mcp/PLAYWRIGHT_MCP_GUIDE.md`
- **Setup Script:** `.mcp/setup-playwright.ps1`
- **Configuration:** `.mcp/playwright-config.json`
- **Central Memory:** `central-memory.json` (lines 774-908)

### Quick Troubleshooting

**Problem:** Browsers not found
```powershell
npx playwright install
```

**Problem:** Port already in use
```powershell
corepack yarn dev --port 3001
```

**Problem:** Tests timing out
```typescript
test.setTimeout(60000); // Increase timeout
```

**Problem:** Screenshots don't match
```powershell
npx playwright test --update-snapshots
```

---

## 📞 Contact

**Maintained by:** Warp (Project Lead)  
**Last Updated:** 2025-09-30  
**Version:** 1.0.0

---

**Happy Testing! 🎭✨**