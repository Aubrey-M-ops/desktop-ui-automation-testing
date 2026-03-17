# Test Report

## Overview

Automated end-to-end test suite for the agent desktop web application, built with Playwright + TypeScript.

Target: `https://takehome-desktop.d.tekvisionflow.com`

**Last Updated:** 2026-03-17 (After deduplication)

---

## Test Scope

| Spec | Module | Test Cases |
|------|--------|-----------|
| `01-happy-path.spec.ts` | A — Happy Path | TC-01 |
| `02-edge-cases.spec.ts` | B — Entry Flow and Agent State | TC-02, TC-03, TC-04 |
| `02-edge-cases.spec.ts` | C — Panel Visibility and Tab Navigation | TC-05, TC-06 |
| `02-edge-cases.spec.ts` | D — Data Rendering Accuracy | TC-07 – TC-12 |
| `02-edge-cases.spec.ts` | E — Live Chat Composer | TC-13 – TC-16 |
| `02-edge-cases.spec.ts` | F — Badge Count | TC-17 – TC-20 |
| `02-edge-cases.spec.ts` | G — API Contract Validation | TC-21 – TC-24 |
| `02-edge-cases.spec.ts` | H — Echo Message Behavior | TC-25 |
| `02-edge-cases.spec.ts` | I — Agent Message Timestamp Accuracy | TC-26 |
| `03-xss-verification.spec.ts` | J — Security Verification | TC-27 – TC-31 |

**Total: 31 test cases across 2 spec files** (reduced from 35 after removing duplicates).

---

## Deduplication Summary

Removed 4 duplicate test cases:
- **Old TC-13**: "Agent message timestamp format" → Covered by TC-26
- **Old TC-17**: "Special characters and emojis" → Covered by TC-28 and TC-30
- **Old TC-28**: "Echo message content non-empty" → Covered by TC-25
- **Old TC-30**: "Multiple messages sequential timestamps" → Covered by TC-26

All remaining test cases have been renumbered sequentially.

---

## What Each Test Verifies

### Module A — Happy Path

| TC | Description |
|----|-------------|
| TC-01 | Full end-to-end flow for account 10001: API call → page load → agent status → accept invite → verify all 8 interaction info fields → verify customer profile (name, tier, status, payment date, language, 3 transactions) → verify transcript order and badge count → send live chat message → assert agent message and customer echo reply |

### Module B — Entry Flow and Agent State

| TC | Description |
|----|-------------|
| TC-02 | Chat invite is hidden on load; stays hidden through `Offline` and `Not Ready`; appears only when status becomes `Ready` |
| TC-03 | Chat invite remains hidden when agent transitions directly from `Offline` to `Not Ready` |
| TC-04 | Workspace is properly gated before accepting chat invite - send button unavailable |

### Module C — Panel Visibility and Tab Navigation

| TC | Description |
|----|-------------|
| TC-05 | Unauthenticated payload shows `Not Authenticated` in interaction info and renders the profile unavailable placeholder |
| TC-06 | Interaction Information and Customer Profile tabs are mutually exclusive (opening one hides the other) |

### Module D — Data Rendering Accuracy

| TC | Description |
|----|-------------|
| TC-07 | 3-message transcript renders in submission order |
| TC-08 | 60-message transcript with intentionally out-of-order timestamps still renders in submission order |
| TC-09 | Account-specific transcript file (`/sampletranscription/10003.json`) is used when available |
| TC-10 | Default transcript (`/sampletranscription/default.json`) is used when no account-specific file exists |
| TC-11 | Customer profile transaction list renders all rows (account 10012 has 23 transactions) |
| TC-12 | Customer profile loads with a non-empty customerName |

### Module E — Live Chat Composer

| TC | Description |
|----|-------------|
| TC-13 | Send button is disabled when the input is empty |
| TC-14 | Send button remains disabled for whitespace-only input |
| TC-15 | 500-character message is sent without truncation |
| TC-16 | Rapid consecutive messages all arrive correctly |

### Module F — Badge Count

| TC | Description |
|----|-------------|
| TC-17 | Badge count matches the full rendered transcript count after a 60-message payload |
| TC-18 | Badge increments correctly after sending a live chat message and receiving an echo reply |
| TC-19 | Badge count is stable across tab switches (Interaction Information ↔ Customer Profile) |
| TC-20 | Badge continues to increment beyond a 60-message base transcript after new messages are sent |

### Module G — API Contract Validation

| TC | Description |
|----|-------------|
| TC-21 | Account `10050` (upper bound) is accepted by the API and profile loads correctly |
| TC-22 | Account `10051` (out of range) is rejected with a 4xx response containing a `message` field |
| TC-23 | Malformed payload `{ interactionInformation: {} }` is rejected with a 4xx validation error |
| TC-24 | Empty `chatTranscript: []` is rejected (Bug #4 - should be allowed for fresh conversations) |

### Module H — Echo Message Behavior

| TC | Description |
|----|-------------|
| TC-25 | Echo reply after agent sends message has sender type "Customer" (not "System") |

### Module I — Agent Message Timestamp Accuracy

| TC | Description |
|----|-------------|
| TC-26 | Agent message timestamp shows actual time in HH:MM:SS format (not epoch "00:xx:xx") |

### Module J — Security Verification

| TC | Description |
|----|-------------|
| TC-27 | HTML/script tags in pre-loaded transcript are properly escaped |
| TC-28 | HTML/script tags in live chat messages are properly escaped |
| TC-29 | SQL injection patterns in account numbers are rejected by the API |
| TC-30 | Unicode and emoji characters are preserved in messages |
| TC-31 | Messages over 1000 characters are rejected (Bug #5 - API length limit) |

---

## Latest Test Run — Results against `/desktop`

```
npx playwright test
```

**Date:** 2026-03-17  
**Environment:** `https://takehome-desktop.d.tekvisionflow.com/desktop`

| TC | Description | Result | Notes |
|----|-------------|--------|-------|
| TC-01 | Billing Dispute full end-to-end | ✅ PASS | |
| TC-02 | Chat invite appears only when Ready | ❌ FAIL | Bug #1: invite visible before Ready |
| TC-03 | Invite hidden when Offline → Not Ready | ❌ FAIL | Bug #1: same root cause |
| TC-04 | Workspace gated before accept | ✅ PASS | |
| TC-05 | Unauthenticated shows profile placeholder | ✅ PASS | |
| TC-06 | Tabs are mutually exclusive | ✅ PASS | |
| TC-07 | Baseline transcript submission order | ✅ PASS | |
| TC-08 | Out-of-order timestamps → submission order | ✅ PASS | |
| TC-09 | Account-specific transcript file used | ✅ PASS | |
| TC-10 | Default transcript used as fallback | ✅ PASS | |
| TC-11 | Transaction list renders all rows | ❌ FAIL | Bug #2: renders only 10 of 23 rows (paginated) |
| TC-12 | Profile loads with customerName | ✅ PASS | |
| TC-13 | Send button disabled for empty input | ✅ PASS | |
| TC-14 | Send button disabled for whitespace input | ✅ PASS | |
| TC-15 | Long message (500 chars) sent without truncation | ✅ PASS | |
| TC-16 | Rapid consecutive messages all arrive | ✅ PASS | |
| TC-17 | Badge matches large transcript count | ❌ FAIL | Bug #3: badge capped at 35 |
| TC-18 | Badge increments on live chat send | ✅ PASS | |
| TC-19 | Badge stable across tab switches | ✅ PASS | |
| TC-20 | Badge increments after large transcript | ❌ FAIL | Bug #3: badge stuck at 35, won't increment |
| TC-21 | Account 10050 (upper bound) loads | ✅ PASS | |
| TC-22 | Account 10051 (out of range) rejected | ✅ PASS | |
| TC-23 | Invalid payload returns 4xx | ✅ PASS | |
| TC-24 | Empty chatTranscript accepted | ❌ FAIL | Bug #4: API rejects with validation error |
| TC-25 | Echo reply sender is "Customer" | ✅ PASS | |
| TC-26 | Agent timestamp shows actual time | ✅ PASS | |
| TC-27 | XSS protection in pre-loaded transcript | ✅ PASS | |
| TC-28 | XSS protection in live chat | ✅ PASS | |
| TC-29 | SQL injection patterns rejected | ✅ PASS | |
| TC-30 | Unicode/emoji preserved | ✅ PASS | |
| TC-31 | Message over 1000 chars rejected | ❌ FAIL | Bug #5: API enforces 1000 char limit |

**Summary: 24 passed, 7 failed** (77.4% pass rate) — mapped to 5 distinct bugs.

---

## Bugs Found

| # | Title | Severity | Failing TCs |
|---|-------|----------|-------------|
| 1 | Chat invite visible before agent status is `Ready` | Medium | TC-02, TC-03 |
| 2 | Transaction list only renders first page (10 of 23 rows) | Medium | TC-11 |
| 3 | Message-count badge stops incrementing after 35 messages | Medium | TC-17, TC-20 |
| 4 | API rejects empty chatTranscript array | Medium | TC-24 |
| 5 | Message length hard limit of 1000 characters | Low | TC-31 |

See [bug-report.md](./bug-report.md) for full reproduction steps, expected vs actual, and screenshots.

---

## Security Tests (All Passed ✅)

- XSS Protection: HTML/script tags properly escaped in both pre-loaded and live messages
- SQL Injection: Malformed account numbers rejected by API
- Input Validation: Invalid sender types, out-of-range accounts, missing fields all properly validated
- Unicode Support: Multi-language characters and emojis preserved correctly

---

## Test Execution Time

**Total duration:** ~60 seconds  
**Average per test:** ~1.9 seconds

---

## Next Steps

1. **Fix Bug #4** (empty transcript) - Update API validation to allow empty arrays for fresh conversations
2. **Fix Bug #5** (message length) - Add character counter to UI, or increase limit to 2000-5000 chars
3. **Verify Bug #1 fix** - Ensure chat invite only appears when agent status is "Ready"
4. **Verify Bug #2 fix** - Ensure all transaction rows render (pagination or scrolling)
5. **Verify Bug #3 fix** in `/desktopv2` - Badge count should exceed 35

---

## Files

- **Test Specs:** `tests/01-happy-path.spec.ts`, `tests/02-edge-cases.spec.ts`, `tests/03-xss-verification.spec.ts`
- **Page Object:** `src/pages/DesktopPage.ts`
- **Test Data:** `test-data/payloads/`, `test-data/profiles/`, `test-data/transcripts/`
- **API Client:** `src/api/testrun.ts`
- **Config:** `playwright.config.ts`

