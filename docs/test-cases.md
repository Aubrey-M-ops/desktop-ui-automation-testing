# Test Cases


> **Total: 31 test cases** across 10 modules (updated 2026-03-17).

---

## Module A - Happy Path

### TC-01: Billing Dispute - Full end-to-end flow (account 10001)

| | |
|---|---|
| **File** | `tests/01-happy-path.spec.ts` |
| **Test Data** | `PAYLOAD_HAPPY_PATH` from `test-data/scenarios/happy-path.ts` |
| **Profile Assertion Data** | local file `test-data/profiles/10001.json` |
| **Transcript Data** | 3 messages in payload |

**Steps:**
1. POST `/api/testrun` with `PAYLOAD_HAPPY_PATH`, open `/desktop/{runId}`
2. Set agent to `Ready`, accept chat invite
3. Assert all 8 Interaction Information fields match payload
4. Open Customer Profile, assert profile matches `10001.json`
5. Assert transcript matches payload (3 messages)
6. Assert badge count = 3
7. Send live message, assert agent + echo replies appear

---

## Module B - Entry Flow and Agent State

### TC-02: Chat invite appears only when agent status is Ready

| | |
|---|---|
| **File** | `tests/02-edge-cases.spec.ts` |
| **Test Data** | `PAYLOAD_HAPPY_PATH` |

**Steps:**
1. POST `/api/testrun`, observe invite hidden initially
2. Switch to `Offline` and `Not Ready` → invite stays hidden
3. Switch to `Ready` → invite appears

### TC-03: Chat invite remains hidden when agent moves from Offline to Not Ready

| | |
|---|---|
| **File** | `tests/02-edge-cases.spec.ts` |
| **Test Data** | `PAYLOAD_HAPPY_PATH` |

**Steps:**
1. Set agent status to `Offline` → invite hidden
2. Set to `Not Ready` → invite should stay hidden

### TC-04: Workspace is gated before accepting chat invite

| | |
|---|---|
| **File** | `tests/02-edge-cases.spec.ts` |
| **Test Data** | `PAYLOAD_HAPPY_PATH` |

**Steps:**
1. Set agent to `Ready` but don't accept invite
2. Assert workspace gated overlay visible
3. Assert send button absent or disabled

---

## Module C - Panel Visibility and Tab Navigation

### TC-05: Unauthenticated interaction shows profile placeholder

| | |
|---|---|
| **File** | `tests/02-edge-cases.spec.ts` |
| **Test Data** | `PAYLOAD_UNAUTHENTICATED` |

**Steps:**
1. POST with `authenticationStatus: 'Not Authenticated'`
2. Accept invite
3. Assert interaction info shows "Not Authenticated"
4. Open Customer Profile → assert placeholder visible

### TC-06: Interaction Information and Customer Profile tabs are mutually exclusive

| | |
|---|---|
| **File** | `tests/02-edge-cases.spec.ts` |
| **Test Data** | `PAYLOAD_HAPPY_PATH` |

**Steps:**
1. Open Interaction Information → profile hidden
2. Open Customer Profile → interaction info hidden

---

## Module D - Data Rendering Accuracy

### TC-07: Baseline transcript renders in submission order

| | |
|---|---|
| **File** | `tests/02-edge-cases.spec.ts` |
| **Test Data** | `PAYLOAD_HAPPY_PATH` (3 messages) |

**Steps:**
1. Accept invite, wait for 3 transcript rows
2. Assert rendered transcript equals payload

### TC-08: Out-of-order timestamps render in submission order

| | |
|---|---|
| **File** | `tests/02-edge-cases.spec.ts` |
| **Test Data** | `PAYLOAD_LARGE_CONVERSATION` (60 messages) |

**Steps:**
1. Accept invite, wait for 60 rows
2. Assert rows 4 and 5 match payload order (timestamps intentionally out of order)

### TC-09: Account-specific transcript file is rendered

| | |
|---|---|
| **File** | `tests/02-edge-cases.spec.ts` |
| **Test Data** | Dynamic - GET `/sampletranscription/10003.json` |

**Steps:**
1. Fetch account-specific transcript from API
2. Create run with that transcript
3. Assert rendered transcript matches fetched data

### TC-10: Default transcript used when no account-specific file exists

| | |
|---|---|
| **File** | `tests/02-edge-cases.spec.ts` |
| **Test Data** | GET `/sampletranscription/default.json` |

**Steps:**
1. Confirm `/sampletranscription/10001.json` returns 404
2. Fetch `default.json`
3. Assert rendered transcript matches default

### TC-11: Customer profile transaction list renders all rows

| | |
|---|---|
| **File** | `tests/02-edge-cases.spec.ts` |
| **Test Data** | Account 10012 with 23 transactions |

**Steps:**
1. Create run for account 10012
2. Open Customer Profile
3. Assert transaction count = 23

### TC-12: Customer profile loads with non-empty customerName

| | |
|---|---|
| **File** | `tests/02-edge-cases.spec.ts` |
| **Test Data** | Account 10001 |

**Steps:**
1. Accept invite, open Customer Profile
2. Assert `customerName` is truthy

---

## Module E - Live Chat Composer

### TC-13: Send button disabled for empty input

| | |
|---|---|
| **File** | `tests/02-edge-cases.spec.ts` |
| **Test Data** | `PAYLOAD_HAPPY_PATH` |

**Steps:**
1. Accept invite
2. Clear chat input
3. Assert send button disabled

### TC-14: Send button disabled for whitespace-only input

| | |
|---|---|
| **File** | `tests/02-edge-cases.spec.ts` |
| **Test Data** | `PAYLOAD_HAPPY_PATH` |

**Steps:**
1. Accept invite
2. Fill input with `'   '`
3. Assert send button disabled

### TC-15: Very long message (500 chars) sent without truncation

| | |
|---|---|
| **File** | `tests/02-edge-cases.spec.ts` |
| **Test Data** | `PAYLOAD_HAPPY_PATH` |

**Steps:**
1. Send 500-character message
2. Assert message received completely
3. Assert length = 500

### TC-16: Rapid consecutive message sending

| | |
|---|---|
| **File** | `tests/02-edge-cases.spec.ts` |
| **Test Data** | `PAYLOAD_HAPPY_PATH` |

**Steps:**
1. Send 3 messages rapidly without waiting
2. Wait 3 seconds
3. Assert at least 3 messages delivered

---

## Module F - Badge Count

### TC-17: Badge count matches large transcript count

| | |
|---|---|
| **File** | `tests/02-edge-cases.spec.ts` |
| **Test Data** | `PAYLOAD_LARGE_CONVERSATION` (60 messages) |

**Steps:**
1. Accept invite, wait for 60 transcript rows
2. Assert badge count = 60

### TC-18: Badge increments when live chat messages appended

| | |
|---|---|
| **File** | `tests/02-edge-cases.spec.ts` |
| **Test Data** | `PAYLOAD_HAPPY_PATH` (3 messages) |

**Steps:**
1. Assert initial badge = 3
2. Send message, wait for agent + echo
3. Assert badge = 5

### TC-19: Badge stable across tab switching

| | |
|---|---|
| **File** | `tests/02-edge-cases.spec.ts` |
| **Test Data** | `PAYLOAD_HAPPY_PATH` |

**Steps:**
1. Assert badge = 3
2. Switch to Customer Profile and back
3. Assert badge still = 3

### TC-20: Badge continues to increment after large transcript

| | |
|---|---|
| **File** | `tests/02-edge-cases.spec.ts` |
| **Test Data** | `PAYLOAD_LARGE_CONVERSATION` (60 messages) |

**Steps:**
1. Wait for 60 transcript rows
2. Send message, wait for agent + echo
3. Assert transcript count = 62 and badge = 62

---

## Module G - API Contract Validation

### TC-21: Authenticated runs accept upper-bound account 10050

| | |
|---|---|
| **File** | `tests/02-edge-cases.spec.ts` |
| **Test Data** | Account 10050 |

**Steps:**
1. POST with account 10050
2. Accept invite, open profile
3. Assert profile loads successfully

### TC-22: Authenticated runs reject out-of-range accounts

| | |
|---|---|
| **File** | `tests/02-edge-cases.spec.ts` |
| **Test Data** | Account 10051 |

**Steps:**
1. POST with account 10051
2. Assert 4xx response
3. Assert response contains `message` field

### TC-23: Invalid payload returns 4xx validation error

| | |
|---|---|
| **File** | `tests/02-edge-cases.spec.ts` |
| **Test Data** | `{ interactionInformation: {} }` |

**Steps:**
1. POST with empty interaction info
2. Assert 4xx response with `message` field

### TC-24: API validates empty chatTranscript input

| | |
|---|---|
| **File** | `tests/02-edge-cases.spec.ts` |
| **Test Data** | `chatTranscript: []` |

**Steps:**
1. POST with empty transcript array
2. Assert API response follows the transcript validation rule

---

## Module H - Echo Message Behavior

### TC-25: Echo reply sender type after agent sends message

| | |
|---|---|
| **File** | `tests/02-edge-cases.spec.ts` |
| **Test Data** | `PAYLOAD_HAPPY_PATH` |

**Steps:**
1. Send agent message
2. Wait for agent + echo rows
3. Assert echo sender = "Customer" (not "System")

---

## Module I - Agent Message Timestamp Accuracy

### TC-26: Agent message timestamp shows actual time not epoch

| | |
|---|---|
| **File** | `tests/02-edge-cases.spec.ts` |
| **Test Data** | `PAYLOAD_HAPPY_PATH` |

**Steps:**
1. Send agent message
2. Assert timestamp matches `/^\d{2}:\d{2}:\d{2}$/`
3. Assert hour is between 0-23

---

## Module J - Security Verification

### TC-27: HTML/Script tags in pre-loaded transcript are escaped

| | |
|---|---|
| **File** | `tests/03-xss-verification.spec.ts` |
| **Test Data** | Transcript with `<script>`, `<img onerror>`, `<a href="javascript:">` |

**Steps:**
1. Create run with XSS payload in transcript
2. Register alert listener
3. Assert no alert fires
4. Assert tags are displayed as text (escaped)

### TC-28: HTML/Script tags in live chat are escaped

| | |
|---|---|
| **File** | `tests/03-xss-verification.spec.ts` |
| **Test Data** | Live message with `<script>alert("XSS")</script>` |

**Steps:**
1. Send XSS payload via live chat
2. Assert no alert fires
3. Assert tags escaped in DOM

### TC-29: SQL injection patterns rejected by API

| | |
|---|---|
| **File** | `tests/03-xss-verification.spec.ts` |
| **Test Data** | `customerAccountNumber: "10001' OR '1'='1"` |

**Steps:**
1. Attempt POST with SQL injection pattern
2. Assert API rejects or stores as literal text

### TC-30: Unicode and emoji characters preserved

| | |
|---|---|
| **File** | `tests/03-xss-verification.spec.ts` |
| **Test Data** | `你好 😀 مرحبا 🎉 Здравствуй`, `𝕌𝕟𝕚𝕔𝕠𝕕𝕖`, `™️ © ®` |

**Steps:**
1. Create run with unicode/emoji messages
2. Assert all characters preserved correctly

### TC-31: API validates message length over 1000 characters

| | |
|---|---|
| **File** | `tests/03-xss-verification.spec.ts` |
| **Test Data** | Message with 1200+ characters |

**Steps:**
1. POST with >1000 char message
2. Expected: message accepted or UI shows char limit
3. Actual: API rejects with "size must be between 0 and 1000"

---


## Summary

| Module | Test Range | Count |
|--------|------------|-------|
| A - Happy Path | TC-01 | 1 |
| B - Entry Flow | TC-02 – TC-04 | 3 |
| C - Panel Visibility | TC-05 – TC-06 | 2 |
| D - Data Rendering | TC-07 – TC-12 | 6 |
| E - Live Chat | TC-13 – TC-16 | 4 |
| F - Badge Count | TC-17 – TC-20 | 4 |
| G - API Validation | TC-21 – TC-24 | 4 |
| H - Echo Behavior | TC-25 | 1 |
| I - Timestamp | TC-26 | 1 |
| J - Security | TC-27 – TC-31 | 5 |
| **Total** | | **31** |

**Test distribution:**
- Happy path: 1 test (3%)
- Edge cases: 25 tests (81%)
- Security: 5 tests (16%)
