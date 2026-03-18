# Desktop Automation Testing

[![Tests](https://img.shields.io/badge/tests-31%20total-blue)](./docs/test-cases.md)
[![Pass Rate](https://img.shields.io/badge/pass%20rate-77.4%25-yellow)](./docs/test-report.md)
[![Bugs Found](https://img.shields.io/badge/bugs%20found-5-red)](./docs/bug-report.md)

> Automated end-to-end testing framework for the agent desktop web application, built with Playwright and TypeScript.

**Target:** `https://takehome-desktop.d.tekvisionflow.com`

---

## 📚 Documentation

**Complete test coverage and detailed bug reports:**

- **[📋 Test Cases](./docs/test-cases.md)** - Complete test case descriptions with steps, data, and expected results (31 test cases across 10 modules)
- **[🐛 Bug Report](./docs/bug-report.md)** - Detailed bug reproduction steps, screenshots, and business impact (5 bugs discovered)
- **[📊 Test Report](./docs/test-report.md)** - Test execution results, pass/fail breakdown, and coverage analysis

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** 18+ (tested with v22.22.0)
- **npm** or **pnpm**

### Installation

```bash
# Install dependencies
npm install

# Install Playwright browsers
npx playwright install chromium
```

### Running Tests

```bash
# Run all 31 tests
npx playwright test

# Run with HTML reporter (opens automatically)
npx playwright test --reporter=html

# Run specific module
npx playwright test tests/01-happy-path.spec.ts

# Run in headed mode (see browser)
npx playwright test --headed

# View last HTML report
npx playwright show-report
```

### Verifying Bug Fixes

The framework supports testing against two desktop versions:

#### Test against buggy version (default):
```bash
npx playwright test
# or explicitly:
DESKTOP_PATH=/desktop npx playwright test
```

Expected: 7 failures (Bugs #1-5)

#### Test against fixed version:
```bash
DESKTOP_PATH=/desktopv2 npx playwright test
```

Expected: 5 failures (Bug #3 fixed, #1, #2, #4, #5 remain)

**Verification example for Bug #3 (badge cap):**
```bash
# Against buggy version
DESKTOP_PATH=/desktop npx playwright test tests/02-edge-cases.spec.ts -g "TC-17"
# ❌ FAIL: Badge shows 35 instead of 60

# Against fixed version
DESKTOP_PATH=/desktopv2 npx playwright test tests/02-edge-cases.spec.ts -g "TC-17"
# ✅ PASS: Badge correctly shows 60
```

---

## 🧪 Test Coverage

**31 test cases** across 10 functional modules, covering end-to-end workflows, edge cases, and security.

| Module | Tests | Coverage |
|--------|-------|----------|
| **A. Happy Path** | 1 | Full E2E workflow: API → Agent status → Chat acceptance → Profile/Transcript validation → Live chat |
| **B. Entry Flow & State** | 3 | Chat invite visibility, agent status transitions, workspace gating |
| **C. Panel Visibility** | 2 | Authenticated/unauthenticated rendering, tab mutual exclusivity |
| **D. Data Rendering** | 6 | Transcript order, account-specific files, transaction list, profile validation |
| **E. Live Chat Composer** | 4 | Input validation, message length (500 chars, 1000+ limit), rapid sending |
| **F. Badge Count** | 4 | Large transcript accuracy, live chat increments, tab stability |
| **G. API Validation** | 4 | Account boundary (10001-10050), invalid payload rejection, empty transcript |
| **H. Echo Behavior** | 1 | Echo reply sender type verification |
| **I. Timestamp Accuracy** | 1 | Agent message timestamp format validation |
| **J. Security** | 5 | XSS protection, SQL injection prevention, Unicode/emoji, message limits |

📄 **Complete test case documentation:** [docs/test-cases.md](./docs/test-cases.md)

---

## 🐛 Bugs Discovered

| # | Title | Severity | Failing Tests | Status |
|---|-------|----------|---------------|--------|
| **#1** | Chat invite appears when agent status is "Not Ready" | Medium | TC-02, TC-03 | 🔴 Open |
| **#2** | Transaction list only renders first 10 of 23 rows | Medium | TC-11 | 🔴 Open |
| **#3** | Message badge stops incrementing after 35 messages | Medium | TC-17, TC-20 | 🟢 Fixed in `/desktopv2` |
| **#4** | API rejects empty `chatTranscript` array | Medium | TC-24 | 🔴 Open |
| **#5** | Message length hard limit of 1000 characters | Low | TC-31 | 🔴 Open |

📄 **Full details:** [docs/bug-report.md](./docs/bug-report.md)

---

## 📊 Test Results Summary

**Last run:** 2026-03-17  
**Total tests:** 31  
**Passed:** 24 (77.4%)  
**Failed:** 7 (mapped to 5 bugs)  
**Duration:** ~60 seconds

| Module | Tests | Pass | Fail |
|--------|-------|------|------|
| Happy Path | 1 | ✅ 1 | - |
| Entry Flow & State | 3 | ✅ 1 | ❌ 2 |
| Panel Visibility | 2 | ✅ 2 | - |
| Data Rendering | 6 | ✅ 5 | ❌ 1 |
| Live Chat Composer | 4 | ✅ 4 | - |
| Badge Count | 4 | ✅ 2 | ❌ 2 |
| API Validation | 4 | ✅ 3 | ❌ 1 |
| Echo Behavior | 1 | ✅ 1 | - |
| Timestamp Accuracy | 1 | ✅ 1 | - |
| Security | 5 | ✅ 4 | ❌ 1 |

📄 **Detailed results:** [docs/test-report.md](./docs/test-report.md)

---

## 🏗️ Project Structure

```
desktop-auto-testing/
├── src/
│   ├── api/
│   │   └── testrun.ts           # API client for /api/testrun (with retry logic)
│   ├── pages/
│   │   └── DesktopPage.ts       # Page Object Model - all UI interactions
│   └── config/
│       └── selectors.ts         # Centralized data-testid mappings
│
├── test-data/
│   ├── payloads/                # Static payload fixtures (one file per scenario)
│   │   ├── happy-path.ts
│   │   ├── large-conversation.ts
│   │   ├── unauthenticated.ts
│   │   ├── edge-cases.ts
│   │   ├── security.ts          # XSS / SQL injection / Unicode payloads
│   │   └── index.ts             # Barrel re-export
│   ├── builders/                # Factory functions for dynamic payloads
│   │   └── index.ts             # buildAuthenticatedPayload, buildAccountTranscriptPayload, …
│   └── profiles/                # Expected profile fixtures (co-located JSON + types)
│       ├── 10001.json
│       ├── 10012.json
│       └── index.ts             # Typed exports + ProfileFixture interface
│
├── tests/
│   ├── 01-happy-path.spec.ts    # Module A: Full E2E workflow
│   ├── 02-edge-cases.spec.ts    # Modules B-I: Edge cases & API validation
│   └── 03-xss-verification.spec.ts # Module J: Security tests
│
├── docs/
│   ├── test-cases.md            # Complete test case descriptions
│   ├── bug-report.md            # Detailed bug reproduction steps
│   ├── test-report.md           # Test execution results
│   ├── bug-screenshots/         # Screenshots for each bug
│   └── entry-flow.svg           # Agent entry flow diagram
│
├── playwright.config.ts         # Playwright configuration
└── README.md                    # This file
```

---

## 🛠️ Technology Stack

| Technology | Purpose | Rationale |
|------------|---------|-----------|
| **Playwright** | Browser automation & API testing | Built-in API client, robust waiting, traces, screenshots |
| **TypeScript** | Type-safe test code | Catches errors at compile time, better IDE support |
| **Page Object Model** | UI abstraction layer | Maintainable, reusable, isolates selector changes |
| **Dynamic Fixtures** | Runtime assertion baselines | No hardcoded expected values, data-driven |
| **HTML Reporter** | Test results visualization | Screenshots, traces, error context |

---

## 🔧 Configuration

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `BASE_URL` | `https://takehome-desktop.d.tekvisionflow.com` | Backend API base URL |
| `DESKTOP_PATH` | `/desktop` | Desktop path prefix (`/desktopv2` for fixed version) |

### Playwright Config

Key settings in `playwright.config.ts`:

```typescript
{
  testDir: './tests',
  use: {
    baseURL: process.env.BASE_URL ?? 'https://takehome-desktop.d.tekvisionflow.com',
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
  },
  reporter: [['html', { open: 'never' }]],
}
```

---

## 🔍 Key Features

### Deterministic Test Runs

Every test creates its own isolated test run via `POST /api/testrun`:

```typescript
const { runId } = await createTestRun(request, payload);
await page.goto(`/desktop/${runId}`);
```

No shared state, no test interdependencies, fully parallelizable.

### Static Fixture Baselines

Expected values live in co-located JSON fixtures, not hardcoded inline:

```typescript
// test-data/profiles/index.ts — typed, version-controlled
import { profile10001 } from '@test-data/profiles';

const profile = await desktop.getProfileData();
expect(profile.customerName).toBe(profile10001.customerName);
expect(profile.recentTransactions).toEqual(profile10001.recentTransactions);
```

Fixtures update in one place; every test that references them stays in sync automatically.

### Centralized Assertion Fields

Field lists that drive `for...of` assertion loops are defined once in `src/config/assertion-fields.ts`:

```typescript
// assertion-fields.ts
export const ASSERTION_FIELDS = {
  interactionInfoExact: ['interactionId', 'channel', 'authenticationStatus', ...],
  profileExact: ['customerName', 'customerTier', 'accountStatus', ...],
};

// In tests — adding a new field to assert requires a single-line change
for (const field of ASSERTION_FIELDS.profileExact) {
  expect(profile[field]).toBe(expectedProfile[field]);
}
```

### Layered Test Data

`test-data/` is split into three purpose-specific layers:

| Layer | Path | Contents |
|-------|------|----------|
| **Payloads** | `test-data/payloads/` | Static `TestRunPayload` fixtures per scenario |
| **Builders** | `test-data/builders/` | Factory functions for parameterized payloads |
| **Profiles** | `test-data/profiles/` | Expected UI state (JSON + typed exports) |

All layers are exposed through a single barrel — `import { ... } from '@test-data'` — with `@test-data/*` sub-path aliases for targeted imports.

### Robust Waiting Strategies

No `sleep()` or hardcoded timeouts:

```typescript
// Wait for specific count
await desktop.waitForTranscriptCount(60);

// Poll with timeout
await expect.poll(() => desktop.getBadgeCount()).toBe(60);

// Wait for element state
await desktop.waitForProfile(expectedName);
```

### Page Object Model

All UI interactions abstracted in `DesktopPage.ts`:

```typescript
class DesktopPage {
  async setAgentStatusReady() { /* ... */ }
  async acceptChatInvite() { /* ... */ }
  async getProfileData(): Promise<ProfileData> { /* ... */ }
  async sendLiveChatMessage(text: string) { /* ... */ }
  // ... 30+ methods
}
```

Tests stay clean and readable:

```typescript
await desktop.setAgentStatusReady();
await desktop.acceptChatInvite();
const profile = await desktop.getProfileData();
expect(profile.customerName).toBe(profile10001.customerName);
```

---

## 🤝 Reviewing

1. **Run the tests** to verify reproducibility
2. **Check the bug report** for clear reproduction steps
3. **Review test-cases.md** for coverage completeness
4. **Try the desktopv2 verification** to confirm fix detection

---
