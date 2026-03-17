# Test Report

## Overview

Automated end-to-end test suite for the agent desktop web application, built with Playwright + TypeScript.

Target: `https://takehome-desktop.d.tekvisionflow.com`

---

## Test Scope

| Spec | Module | Test Cases |
|------|--------|-----------|
| `01-happy-path.spec.ts` | A — Happy Path | TC-01 |
| `02-edge-cases.spec.ts` | B — Entry Flow and Agent State | TC-02, TC-03 |
| `02-edge-cases.spec.ts` | C — Panel Visibility and Tab Navigation | TC-04, TC-05 |
| `02-edge-cases.spec.ts` | D — Data Rendering Accuracy | TC-06 – TC-10 |
| `02-edge-cases.spec.ts` | E — Live Chat Composer | TC-11 – TC-13 |
| `02-edge-cases.spec.ts` | F — Badge Count | TC-14 – TC-17 |
| `02-edge-cases.spec.ts` | G — API Contract Validation | TC-18 – TC-20 |

**Total: 20 test cases across 2 spec files.**

---

## What Each Test Verifies

### Module A — Happy Path

| TC | Description |
|----|-------------|
| TC-01 | Full end-to-end flow for account 10001: API call → page load → agent status → accept invite → verify all 8 interaction info fields → verify customer profile (name, tier, status, payment date, language, 3 transactions) → verify transcript order and badge count → send live chat message → assert agent message and system echo reply |

### Module B — Entry Flow and Agent State

| TC | Description |
|----|-------------|
| TC-02 | Chat invite is hidden on load; stays hidden through `Offline` and `Not Ready`; appears only when status becomes `Ready` |
| TC-03 | Chat invite remains hidden when agent transitions directly from `Offline` to `Not Ready` |

### Module C — Panel Visibility and Tab Navigation

| TC | Description |
|----|-------------|
| TC-04 | Unauthenticated payload shows `Not Authenticated` in interaction info and renders the profile unavailable placeholder |
| TC-05 | Interaction Information and Customer Profile tabs are mutually exclusive (opening one hides the other) |

### Module D — Data Rendering Accuracy

| TC | Description |
|----|-------------|
| TC-06 | 3-message transcript renders in submission order |
| TC-07 | 60-message transcript with intentionally out-of-order timestamps still renders in submission order |
| TC-08 | Account-specific transcript file (`/sampletranscription/10003.json`) is used when available |
| TC-09 | Default transcript (`/sampletranscription/default.json`) is used when no account-specific file exists |
| TC-10 | Customer profile transaction list renders all rows (account 10012 has 23 transactions) |

### Module E — Live Chat Composer

| TC | Description |
|----|-------------|
| TC-11 | Agent message appended to transcript has a valid `HH:MM:SS` timestamp |
| TC-12 | Send button is disabled when the input is empty |
| TC-13 | Send button remains disabled for whitespace-only input |

### Module F — Badge Count

| TC | Description |
|----|-------------|
| TC-14 | Badge count matches the full rendered transcript count after a 60-message payload |
| TC-15 | Badge increments correctly after sending a live chat message and receiving an echo reply |
| TC-16 | Badge count is stable across tab switches (Interaction Information ↔ Customer Profile) |
| TC-17 | Badge continues to increment beyond a 60-message base transcript after new messages are sent |

### Module G — API Contract Validation

| TC | Description |
|----|-------------|
| TC-18 | Account `10050` (upper bound) is accepted by the API and profile loads correctly |
| TC-19 | Account `10051` (out of range) is rejected with a 4xx response containing a `message` field |
| TC-20 | Malformed payload `{ interactionInformation: {} }` is rejected with a 4xx validation error |

---

## Run 1 — Results against `/desktop` (buggy version)

```
DESKTOP_PATH=/desktop npx playwright test
```

| TC | Description | Result | Notes |
|----|-------------|--------|-------|
| TC-01 | Billing Dispute full end-to-end | PASS | |
| TC-02 | Chat invite appears only when Ready | **FAIL** | Bug #1: invite visible before Ready |
| TC-03 | Invite hidden when Offline → Not Ready | **FAIL** | Bug #1: same root cause |
| TC-04 | Unauthenticated shows profile placeholder | PASS | |
| TC-05 | Tabs are mutually exclusive | PASS | |
| TC-06 | Baseline transcript submission order | PASS | |
| TC-07 | Out-of-order timestamps → submission order | PASS | |
| TC-08 | Account-specific transcript file used | PASS | |
| TC-09 | Default transcript used as fallback | PASS | |
| TC-10 | Transaction list renders all rows | **FAIL** | Bug #2: renders only 10 of 23 rows (paginated) |
| TC-11 | Agent message has valid timestamp | PASS | |
| TC-12 | Send button disabled for empty input | PASS | |
| TC-13 | Send button disabled for whitespace input | PASS | |
| TC-14 | Badge matches large transcript count | **FAIL** | Bug #3: badge capped at 35 |
| TC-15 | Badge increments on live chat send | PASS | |
| TC-16 | Badge stable across tab switches | PASS | |
| TC-17 | Badge increments after large transcript | **FAIL** | Bug #3: badge stuck at 35, won't increment |
| TC-18 | Account 10050 (upper bound) loads | PASS | |
| TC-19 | Account 10051 (out of range) rejected | PASS | |
| TC-20 | Invalid payload returns 4xx | PASS | |

**Summary: 15 passed, 5 failed — mapped to 3 distinct bugs.**

---

## Run 2 — Results against `/desktopv2` (badge bug fixed)

```
DESKTOP_PATH=/desktopv2 npx playwright test
```

| TC | Result | Change from Run 1 |
|----|--------|-------------------|
| TC-01 | PASS | — |
| TC-02 | **FAIL** | — (Bug #1 not fixed in v2) |
| TC-03 | **FAIL** | — (Bug #1 not fixed in v2) |
| TC-04 | PASS | — |
| TC-05 | PASS | — |
| TC-06 | PASS | — |
| TC-07 | PASS | — |
| TC-08 | PASS | — |
| TC-09 | PASS | — |
| TC-10 | **FAIL** | — (Bug #2 not fixed in v2) |
| TC-11 | PASS | — |
| TC-12 | PASS | — |
| TC-13 | PASS | — |
| TC-14 | **PASS** | Fixed: badge now shows correct count (60) |
| TC-15 | PASS | — |
| TC-16 | PASS | — |
| TC-17 | **PASS** | Fixed: badge increments past 35 after large transcript |
| TC-18 | PASS | — |
| TC-19 | PASS | — |
| TC-20 | PASS | — |

**Summary: 17 passed, 3 failed — Bug #3 (badge cap) confirmed fixed in `/desktopv2`.**

---

## Bugs Found

| # | Title | Severity | Failing TCs |
|---|-------|----------|-------------|
| 1 | Chat invite visible before agent status is `Ready` | Medium | TC-02, TC-03 |
| 2 | Transaction list only renders first page (10 of 23 rows) | Medium | TC-10 |
| 3 | Message-count badge stops incrementing after 35 messages | Medium | TC-14, TC-17 |

See [bug-report.md](./bug-report.md) for full reproduction steps, expected vs actual, and screenshots.
