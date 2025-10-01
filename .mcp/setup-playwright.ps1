# Playwright MCP Setup Script
# For: Warp, Claude, Codex
# Date: 2025-09-30

Write-Host "🎭 Playwright MCP Setup for AI Agents" -ForegroundColor Cyan
Write-Host "======================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Check Playwright installation
Write-Host "📦 Step 1: Checking Playwright installation..." -ForegroundColor Yellow
$playwrightVersion = & corepack yarn playwright --version 2>$null
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Playwright is installed: $playwrightVersion" -ForegroundColor Green
} else {
    Write-Host "❌ Playwright not found in project" -ForegroundColor Red
    Write-Host "   Run: corepack yarn install" -ForegroundColor Yellow
    exit 1
}

Write-Host ""

# Step 2: Check if browsers are installed
Write-Host "🌐 Step 2: Checking browser installations..." -ForegroundColor Yellow

$browsersPath = "$env:USERPROFILE\AppData\Local\ms-playwright"
if (Test-Path $browsersPath) {
    $browserCount = (Get-ChildItem $browsersPath -Directory | Measure-Object).Count
    if ($browserCount -gt 0) {
        Write-Host "✅ Found $browserCount browser(s) installed" -ForegroundColor Green
        Get-ChildItem $browsersPath -Directory | ForEach-Object {
            Write-Host "   - $($_.Name)" -ForegroundColor Gray
        }
    } else {
        Write-Host "⚠️  No browsers found" -ForegroundColor Yellow
    }
} else {
    Write-Host "⚠️  Browsers not installed yet" -ForegroundColor Yellow
}

Write-Host ""

# Step 3: Prompt to install browsers
Write-Host "📥 Step 3: Browser Installation" -ForegroundColor Yellow
$install = Read-Host "Would you like to install Playwright browsers now? (y/n)"

if ($install -eq 'y' -or $install -eq 'Y') {
    Write-Host ""
    Write-Host "Installing browsers (this may take a few minutes)..." -ForegroundColor Cyan
    Write-Host "Download size: ~400MB" -ForegroundColor Gray
    Write-Host ""
    
    & npx playwright install
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "✅ Browsers installed successfully!" -ForegroundColor Green
    } else {
        Write-Host ""
        Write-Host "❌ Browser installation failed" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "⏭️  Skipping browser installation" -ForegroundColor Yellow
    Write-Host "   You can install them later with: npx playwright install" -ForegroundColor Gray
}

Write-Host ""

# Step 4: Verify MCP configuration
Write-Host "⚙️  Step 4: Verifying MCP configuration..." -ForegroundColor Yellow
$mcpConfigPath = ".\.mcp\playwright-config.json"

if (Test-Path $mcpConfigPath) {
    Write-Host "✅ MCP configuration found" -ForegroundColor Green
    Write-Host "   Location: $mcpConfigPath" -ForegroundColor Gray
    
    # Parse and display agent permissions
    $config = Get-Content $mcpConfigPath | ConvertFrom-Json
    Write-Host ""
    Write-Host "   Configured Agents:" -ForegroundColor Cyan
    $config.agents.PSObject.Properties | ForEach-Object {
        Write-Host "   - $($_.Name): $($_.Value.role)" -ForegroundColor Gray
    }
} else {
    Write-Host "❌ MCP configuration not found" -ForegroundColor Red
    Write-Host "   Expected location: $mcpConfigPath" -ForegroundColor Gray
}

Write-Host ""

# Step 5: Create test results directories
Write-Host "📁 Step 5: Setting up test directories..." -ForegroundColor Yellow

$testDirs = @(
    "test-results",
    "test-results\screenshots",
    "test-results\videos",
    "test-results\traces"
)

foreach ($dir in $testDirs) {
    if (-not (Test-Path $dir)) {
        New-Item -ItemType Directory -Path $dir -Force | Out-Null
        Write-Host "✅ Created: $dir" -ForegroundColor Green
    } else {
        Write-Host "✓  Exists: $dir" -ForegroundColor Gray
    }
}

Write-Host ""

# Step 6: Display next steps
Write-Host "🎉 Setup Complete!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Next Steps:" -ForegroundColor Cyan
Write-Host ""
Write-Host "For Warp (Project Lead):" -ForegroundColor Blue
Write-Host "  1. Start dev server: corepack yarn dev" -ForegroundColor White
Write-Host "  2. Run integration tests: npx playwright test tests/voice-control/integration" -ForegroundColor White
Write-Host ""
Write-Host "For Claude (Testing Specialist):" -ForegroundColor Green
Write-Host "  1. Run tests with UI: npx playwright test --ui" -ForegroundColor White
Write-Host "  2. Debug tests: npx playwright test --debug" -ForegroundColor White
Write-Host "  3. Generate report: npx playwright test --reporter=html" -ForegroundColor White
Write-Host ""
Write-Host "For Codex (UI Specialist):" -ForegroundColor Yellow
Write-Host "  1. Start Storybook: corepack yarn storybook" -ForegroundColor White
Write-Host "  2. Test components: npx playwright test tests/voice-control/components" -ForegroundColor White
Write-Host "  3. Update snapshots: npx playwright test --update-snapshots" -ForegroundColor White
Write-Host ""
Write-Host "📚 Documentation:" -ForegroundColor Cyan
Write-Host "   Full guide: .\.mcp\PLAYWRIGHT_MCP_GUIDE.md" -ForegroundColor Gray
Write-Host ""
Write-Host "🔧 Quick Commands:" -ForegroundColor Cyan
Write-Host "   Run all tests:   npx playwright test" -ForegroundColor White
Write-Host "   Run in browser:  npx playwright test --headed" -ForegroundColor White
Write-Host "   Open UI:         npx playwright test --ui" -ForegroundColor White
Write-Host "   Show report:     npx playwright show-report" -ForegroundColor White
Write-Host ""
Write-Host "Happy Testing!" -ForegroundColor Magenta
