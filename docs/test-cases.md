# Test Cases

Total: 18 test cases across 7 modules.

---

## Module A - Happy Path

### TC-01: Billing Dispute - Full end-to-end flow (account 10001)

| | |
|---|---|
| **File** | `tests/01-happy-path.spec.ts` |
| **Test Data** | `PAYLOAD_HAPPY_PATH` from `test-data/payloads/happy-path.ts` |
| **Profile Assertion Data** | local file `test-data/profiles/10001.json` (`Olivia Carter`, account `10001`, 3 recent transactions) |
| **Transcript Data** | `HAPPY_PATH_TRANSCRIPT` from `test-data/transcripts/happy-path.ts` (3 messages) |

**Steps:**
1. POST `/api/testrun` with `PAYLOAD_HAPPY_PATH`, then open `/desktop/{runId}`
2. Wait until workspace is gated, set agent to `Ready`, then accept the chat invite
3. Assert all Interaction Information fields match `PAYLOAD_HAPPY_PATH.interactionInformation`
4. Open Customer Profile and assert rendered profile matches `test-data/profiles/10001.json`
5. Return to Interaction Information and assert transcript matches `PAYLOAD_HAPPY_PATH.chatTranscript`
6. Assert badge count equals the initial transcript length
7. Send `I am reviewing your billing history now.` and assert the appended `Agent` + `System` messages

---

## Module B - Entry Flow And Agent State

### TC-02: Chat invite appears only when agent status is Ready

| | |
|---|---|
| **File** | `tests/02-edge-cases.spec.ts` |
| **Test Data** | `PAYLOAD_HAPPY_PATH` from `test-data/payloads/happy-path.ts` |
| **Transcript Data** | `HAPPY_PATH_TRANSCRIPT` (3 messages) |

**Steps:**
1. POST `/api/testrun` with `PAYLOAD_HAPPY_PATH`
2. Assert invite is hidden initially
3. Switch agent status to `Offline` and `Not Ready`, confirming invite stays hidden
4. Switch to `Ready` and assert invite appears

### TC-03: Offline to Not Ready unexpectedly triggers the chat invite (Bug #6)

| | |
|---|---|
| **File** | `tests/02-edge-cases.spec.ts` |
| **Test Data** | `PAYLOAD_HAPPY_PATH` from `test-data/payloads/happy-path.ts` |
| **Transcript Data** | `HAPPY_PATH_TRANSCRIPT` (3 messages) |
| **Related Bug** | Bug #6 |

**Steps:**
1. POST `/api/testrun` with `PAYLOAD_HAPPY_PATH`
2. Set agent status to `Offline` and assert invite is hidden
3. Set agent status to `Not Ready`
4. Assert invite becomes visible to reproduce the bug

---

## Module C - Panel Visibility And Tab Navigation

### TC-04: Unauthenticated interaction shows the profile placeholder after unlock

| | |
|---|---|
| **File** | `tests/02-edge-cases.spec.ts` |
| **Test Data** | `PAYLOAD_UNAUTHENTICATED` from `test-data/payloads/unauthenticated.ts` |
| **Transcript Data** | `UNAUTHENTICATED_TRANSCRIPT` from `test-data/transcripts/unauthenticated.ts` (3 messages) |
| **Profile Data** | none expected; payload uses `authenticationStatus: 'Not Authenticated'` and empty `customerAccountNumber` |

**Steps:**
1. POST `/api/testrun` with `PAYLOAD_UNAUTHENTICATED`
2. Wait until workspace is gated, then set agent to `Ready` and accept the invite
3. Assert Interaction Information shows `Not Authenticated` and no customer account number
4. Open Customer Profile and assert the unavailable placeholder is shown

### TC-05: Interaction Information and Customer Profile tabs are mutually exclusive

| | |
|---|---|
| **File** | `tests/02-edge-cases.spec.ts` |
| **Test Data** | `PAYLOAD_HAPPY_PATH` from `test-data/payloads/happy-path.ts` |
| **Profile Assertion Data** | local file `test-data/profiles/10001.json` (`Olivia Carter`) |
| **Transcript Data** | `HAPPY_PATH_TRANSCRIPT` (3 messages) |

**Steps:**
1. POST `/api/testrun` with `PAYLOAD_HAPPY_PATH`
2. Unlock the workspace and accept the invite
3. Open Interaction Information and assert profile panel is hidden
4. Open Customer Profile, wait for `Olivia Carter`, and assert interaction panel is hidden

---

## Module D - Data Rendering Accuracy

### TC-06: Baseline transcript renders in submission order

| | |
|---|---|
| **File** | `tests/02-edge-cases.spec.ts` |
| **Test Data** | `PAYLOAD_HAPPY_PATH` from `test-data/payloads/happy-path.ts` |
| **Transcript Data** | `HAPPY_PATH_TRANSCRIPT` from `test-data/transcripts/happy-path.ts` (3 messages) |

**Steps:**
1. POST `/api/testrun` with `PAYLOAD_HAPPY_PATH`
2. Unlock the workspace and accept the invite
3. Wait for 3 transcript rows
4. Assert rendered transcript equals `PAYLOAD_HAPPY_PATH.chatTranscript`

### TC-07: Out-of-order timestamps still render in submission order

| | |
|---|---|
| **File** | `tests/02-edge-cases.spec.ts` |
| **Test Data** | `PAYLOAD_LARGE_CONVERSATION` from `test-data/payloads/large-conversation.ts` |
| **Transcript Data** | `LARGE_CONVERSATION_TRANSCRIPT` from `test-data/transcripts/large-conversation.ts` (60 messages) |
| **Special Check** | compares rendered items at indexes `4` and `5`, where timestamps are intentionally out of order |

**Steps:**
1. POST `/api/testrun` with `PAYLOAD_LARGE_CONVERSATION`
2. Unlock the workspace and accept the invite
3. Wait for 60 transcript rows
4. Assert rendered rows `4` and `5` equal `LARGE_CONVERSATION_TRANSCRIPT[4]` and `[5]`

### TC-08: Account-specific transcript file is rendered when available

| | |
|---|---|
| **File** | `tests/02-edge-cases.spec.ts` |
| **Test Data** | dynamic payload built inside the test |
| **Transcript Source** | GET `/sampletranscription/10003.json` -> assigned to `expectedTranscript` |
| **Interaction Data** | inline `interactionInformation` with account `10003`, `interactionId: 'CHAT-TRANSCRIPT-10003'`, journey `General Support`, queue `General` |

**Steps:**
1. GET `/sampletranscription/10003.json`
2. Build an inline `TestRunPayload` using account `10003` and the fetched transcript
3. POST `/api/testrun` with that payload
4. Unlock the workspace and accept the invite
5. Assert rendered transcript equals `expectedTranscript`

### TC-09: Default transcript is used when no account-specific file exists

| | |
|---|---|
| **File** | `tests/02-edge-cases.spec.ts` |
| **Test Data** | dynamic payload built inside the test |
| **Transcript Source** | GET `/sampletranscription/10001.json` -> expect `404`, then GET `/sampletranscription/default.json` |
| **Interaction Data** | inline `interactionInformation` with account `10001`, `interactionId: 'CHAT-TRANSCRIPT-DEFAULT-10001'`, journey `General Support`, queue `General` |

**Steps:**
1. GET `/sampletranscription/10001.json` and assert `404`
2. GET `/sampletranscription/default.json` into `defaultTranscript`
3. Build an inline `TestRunPayload` with account `10001` and `defaultTranscript`
4. POST `/api/testrun`, unlock the workspace, and accept the invite
5. Assert rendered transcript equals `defaultTranscript`

### TC-10: Transaction list is truncated at 10 rows (Bug #5, account 10012)

| | |
|---|---|
| **File** | `tests/02-edge-cases.spec.ts` |
| **Test Data** | inline payload built inside the test |
| **Profile Assertion Data** | local file `test-data/profiles/10012.json` (`Ethan Perry`, account `10012`, 23 recent transactions) |
| **Transcript Data** | inline transcript with 1 message: `{ sender: 'Customer', timestamp: '10:00:01', message: 'Hello' }` |
| **Related Bug** | Bug #5 |

**Steps:**
1. Read `test-data/profiles/10012.json`
2. Build an inline `TestRunPayload` for account `10012` with a single-message transcript
3. POST `/api/testrun`, unlock the workspace, and accept the invite
4. Open Customer Profile and wait for `Ethan Perry`
5. Count `[data-testid^="transaction-row-"]` and compare with `profile.recentTransactions.length`

---

## Module E - Live Chat Composer

### TC-11: Agent message timestamp is rendered as 00:xx:xx (Bug #3)

| | |
|---|---|
| **File** | `tests/02-edge-cases.spec.ts` |
| **Test Data** | `PAYLOAD_HAPPY_PATH` from `test-data/payloads/happy-path.ts` |
| **Transcript Data** | `HAPPY_PATH_TRANSCRIPT` (3 messages) |
| **Live Chat Input** | `Checking your account now.` |
| **Related Bug** | Bug #3 |

**Steps:**
1. POST `/api/testrun` with `PAYLOAD_HAPPY_PATH`
2. Unlock the workspace and accept the invite
3. Send `Checking your account now.`
4. Assert the appended agent message timestamp matches `/^00:\\d{2}:\\d{2}$/`

### TC-12: Send button is disabled for empty input

| | |
|---|---|
| **File** | `tests/02-edge-cases.spec.ts` |
| **Test Data** | `PAYLOAD_HAPPY_PATH` from `test-data/payloads/happy-path.ts` |
| **Transcript Data** | `HAPPY_PATH_TRANSCRIPT` (3 messages) |
| **Input State** | cleared via `clearLiveChatInput()` |

**Steps:**
1. POST `/api/testrun` with `PAYLOAD_HAPPY_PATH`
2. Unlock the workspace and accept the invite
3. Clear the live chat input
4. Assert send button is disabled

### TC-13: Send button remains disabled for whitespace-only input

| | |
|---|---|
| **File** | `tests/02-edge-cases.spec.ts` |
| **Test Data** | `PAYLOAD_HAPPY_PATH` from `test-data/payloads/happy-path.ts` |
| **Transcript Data** | `HAPPY_PATH_TRANSCRIPT` (3 messages) |
| **Input State** | whitespace-only string `'   '` |

**Steps:**
1. POST `/api/testrun` with `PAYLOAD_HAPPY_PATH`
2. Unlock the workspace and accept the invite
3. Fill the input with `'   '`
4. Assert send button is disabled

---

## Module F - Badge Count

### TC-14: Badge count matches the large transcript count

| | |
|---|---|
| **File** | `tests/02-edge-cases.spec.ts` |
| **Test Data** | `PAYLOAD_LARGE_CONVERSATION` from `test-data/payloads/large-conversation.ts` |
| **Transcript Data** | `LARGE_CONVERSATION_TRANSCRIPT` (60 messages) |

**Steps:**
1. POST `/api/testrun` with `PAYLOAD_LARGE_CONVERSATION`
2. Unlock the workspace and accept the invite
3. Wait for 60 transcript rows
4. Compare `getBadgeCount()` with rendered transcript count

### TC-15: Badge increments when live chat messages are appended

| | |
|---|---|
| **File** | `tests/02-edge-cases.spec.ts` |
| **Test Data** | `PAYLOAD_HAPPY_PATH` from `test-data/payloads/happy-path.ts` |
| **Transcript Data** | `HAPPY_PATH_TRANSCRIPT` (3 messages) |
| **Live Chat Input** | `Reviewing your account now.` |

**Steps:**
1. POST `/api/testrun` with `PAYLOAD_HAPPY_PATH`
2. Unlock the workspace and accept the invite
3. Assert starting badge count is 3
4. Send `Reviewing your account now.`
5. Assert badge count becomes `PAYLOAD_HAPPY_PATH.chatTranscript.length + 2`

### TC-16: Badge remains stable across tab switching

| | |
|---|---|
| **File** | `tests/02-edge-cases.spec.ts` |
| **Test Data** | `PAYLOAD_HAPPY_PATH` from `test-data/payloads/happy-path.ts` |
| **Transcript Data** | `HAPPY_PATH_TRANSCRIPT` (3 messages) |

**Steps:**
1. POST `/api/testrun` with `PAYLOAD_HAPPY_PATH`
2. Unlock the workspace and accept the invite
3. Assert initial badge count is 3
4. Switch to Customer Profile and back to Interaction Information
5. Assert badge count remains unchanged

### TC-17: Badge count continues to increment after a large transcript

| | |
|---|---|
| **File** | `tests/02-edge-cases.spec.ts` |
| **Test Data** | `PAYLOAD_LARGE_CONVERSATION` from `test-data/payloads/large-conversation.ts` |
| **Transcript Data** | `LARGE_CONVERSATION_TRANSCRIPT` (60 messages) |
| **Live Chat Input** | `Checking your account.` |

**Steps:**
1. POST `/api/testrun` with `PAYLOAD_LARGE_CONVERSATION`
2. Unlock the workspace and accept the invite
3. Wait for 60 transcript rows
4. Send `Checking your account.`
5. Assert transcript count and badge count both become `62`

---

## Module G - API Contract Validation

### TC-18: Invalid payload returns a 4xx validation error

| | |
|---|---|
| **File** | `tests/02-edge-cases.spec.ts` |
| **Test Data** | inline invalid request body `{ interactionInformation: {} }` |
| **API Expectation** | response status is `>= 400` and `< 500`, and body contains `message` |

**Steps:**
1. POST `/api/testrun` with `{ interactionInformation: {} }`
2. Assert response status is a 4xx
3. Assert response JSON contains `message`
