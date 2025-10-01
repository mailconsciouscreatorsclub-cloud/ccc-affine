# 🚨 CODEX - STORYBOOK CONNECTION FIX

**Problem:** Playwright tests failing with `ERR_CONNECTION_REFUSED` at `http://localhost:6006`

**Root Cause:** Storybook is not running (or not fully started)

---

## ✅ SOLUTION (6 Easy Steps)

### Step 1: Open New Terminal
Open a **NEW PowerShell terminal window** and keep it visible (don't close it!)

### Step 2: Navigate to Project
```powershell
cd C:\Users\marlon\Projects\ccc-affine-canary
```

### Step 3: Start Storybook
```powershell
corepack yarn storybook
```

**Expected Output:**
```
╭─────────────────────────────────────────────────╮
│                                                 │
│   Storybook 8.x.x for React started            │
│   http://localhost:6006                         │
│                                                 │
│   Local:    http://localhost:6006/              │
│   Network:  http://192.168.x.x:6006/            │
│                                                 │
╰─────────────────────────────────────────────────╯
```

### Step 4: Wait for Completion
⏱️ **WAIT 2-3 minutes** until you see:
- "Storybook started"
- "webpack compiled successfully"
- No more loading messages

### Step 5: Verify in Browser
Open your browser and navigate to:
```
http://localhost:6006
```

You should see the Storybook UI with your components listed.

### Step 6: Run Playwright Tests
Now in your **ORIGINAL terminal** (where you ran Playwright before), run:

```powershell
# Run with UI mode
npx playwright test tests/voice-control/components --ui

# OR run headless
npx playwright test tests/voice-control/components
```

---

## 🎯 QUICK CHECK

Before running Playwright, verify Storybook is ready:

```powershell
Test-NetConnection -ComputerName localhost -Port 6006 -InformationLevel Quiet
```

If it returns `True` ✅ - Storybook is ready!  
If it returns `False` ❌ - Wait longer or restart Storybook

---

## 🔧 TROUBLESHOOTING

### Problem: Storybook won't start
```powershell
# Kill any existing Storybook process
Get-Process -Name node -ErrorAction SilentlyContinue | Stop-Process -Force

# Clear cache and restart
Remove-Item -Path "node_modules/.cache" -Recurse -Force -ErrorAction SilentlyContinue
corepack yarn storybook
```

### Problem: Port 6006 already in use
```powershell
# Find what's using port 6006
Get-NetTCPConnection -LocalPort 6006 -ErrorAction SilentlyContinue | Select-Object OwningProcess

# Kill that process (replace PID with actual number)
Stop-Process -Id <PID> -Force

# Then start Storybook again
corepack yarn storybook
```

### Problem: Storybook starts but Playwright still fails
1. Make sure you're using the correct URL in tests: `http://localhost:6006/iframe.html?...`
2. Check browser console for errors at http://localhost:6006
3. Try accessing a specific story manually first
4. Make sure no firewall is blocking localhost connections

---

## 📝 IMPORTANT NOTES

1. **Keep Storybook Running**
   - Don't close the Storybook terminal during testing
   - Playwright needs Storybook running to access components

2. **Two Terminals Needed**
   - Terminal 1: Running Storybook (keep open)
   - Terminal 2: Running Playwright tests

3. **Restart if Needed**
   - If Storybook crashes, restart it before running tests
   - If tests hang, stop Playwright (Ctrl+C) and restart

---

## ✅ SUCCESS CHECKLIST

Before running Playwright tests, verify:

- [ ] Storybook terminal is open and showing "started"
- [ ] Browser can access http://localhost:6006
- [ ] Port 6006 test returns `True`
- [ ] You can see component stories in Storybook UI
- [ ] No error messages in Storybook terminal

Once all checked, you're ready to run Playwright tests! 🚀

---

## 🎯 EXPECTED WORKFLOW

```
Terminal 1 (Storybook):           Terminal 2 (Playwright):
─────────────────────              ────────────────────────
$ corepack yarn storybook          (wait for Storybook)
  Building...
  Compiled successfully!           $ npx playwright test ...
  Started on port 6006             Running tests...
  [Keep this running]              ✅ Tests pass!
```

---

**Created:** 2025-09-30 by Warp  
**For:** Codex  
**Issue:** Playwright can't connect to Storybook  
**Status:** SOLUTION PROVIDED