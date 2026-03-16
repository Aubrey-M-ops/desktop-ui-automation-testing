# Test Cases

Total: 18 test cases across 7 modules.

---

## Module A - Happy Path E2E

### TC-01: Billing Dispute - Full End-to-End Flow

| | |
|---|---|
| **File** | `01-happy-path.spec.ts` |
| **Preloaded Data** | `BILLING_DISPUTE_PAYLOAD` (account 10001, 3 transcript messages); GET `/sampleprofile/10001.json` as the assertion baseline |
| **Related Bugs** | Bug #2 (incorrect echo sender), Bug #3 (invalid agent timestamp) |

**Steps:**
1. POST `/api/testrun` -> get `runId`, then open `/desktop/{runId}`
2. Assert `workspace-gated` is visible before acceptance
3. `setAgentStatusReady()` -> assert `chat-invite` appears
4. `acceptChatInvite()` -> assert `workspace-gated` disappears
5. Assert all 8 Interaction Info fields fully match the payload (`interactionId` / `channel` / `authenticationStatus` / `customerAccountNumber` / `journeyName` / `queueName` / `agentDesktopStatus` / `startTime`)
6. `openCustomerProfileTab()` -> `waitForProfile(expectedProfile.customerName)`
7. Assert `getProfileData()` fully matches `expectedProfile` including each `recentTransactions` row
8. `openInteractionInformationTab()` -> assert `interaction-information` is visible and `customer-profile` is not
9. Assert the 3 transcript messages match sender / timestamp / message one by one
10. `sendLiveChatMessage('I am reviewing your billing history now.')`
11. Wait for 1 new agent message and 1 echo message
12. Assert `getBadgeCount() === 5`

---

## Module B - Entry Flow And State Machine

### TC-02: Chat Invite Appears Only In Ready State, Not In Offline / Not Ready

| | |
|---|---|
| **File** | `02-edge-cases.spec.ts` |
| **Preloaded Data** | `BILLING_DISPUTE_PAYLOAD` |

**Steps:**
1. Create a run and open the desktop
2. Assert `chat-invite` is not visible initially because the desktop starts in `Offline`
3. `setAgentStatus('Not Ready')` -> assert `chat-invite` is still not visible
4. `setAgentStatusReady()` -> assert `chat-invite` appears
5. `acceptChatInvite()` -> assert `workspace-gated` disappears

---

### TC-03: Offline -> Not Ready Unexpectedly Triggers Chat Invite

| | |
|---|---|
| **File** | `02-edge-cases.spec.ts` |
| **Preloaded Data** | `BILLING_DISPUTE_PAYLOAD` |
| **Related Bug** | Bug #6 (Not Ready triggers the chat invite) |
| **Status** | Verified on the hosted environment: switching from Offline to Not Ready unexpectedly shows the invite |

**Steps:**
1. Create a run and open the desktop
2. `setAgentStatus('Offline')` -> assert `chat-invite` is not visible
3. `setAgentStatus('Not Ready')` -> assert `chat-invite` is still not visible <- **actual result: invite appears (bug)**

---

## Module C - Panel Visibility And Tab Navigation

### TC-04: Unauthenticated - Show Profile Placeholder After Workspace Unlock

| | |
|---|---|
| **File** | `02-edge-cases.spec.ts` |
| **Preloaded Data** | `UNAUTHENTICATED_PAYLOAD` (`authenticationStatus = "Not Authenticated"`) |

**Steps:**
1. Create a run, then `waitForWorkspaceGated()`
2. `setAgentStatusReady()`, `acceptChatInvite()`
3. Assert `isWorkspaceGatedVisible() === false` after acceptance
4. Assert `isProfileVisible() === false` on the default Interaction Info tab
5. Assert `getInteractionInfo().authenticationStatus === 'Not Authenticated'`
6. Assert `getInteractionInfo().customerAccountNumber` is empty
7. `openCustomerProfileTab()`
8. Assert `isProfilePlaceholderVisible() === true` (`data-testid="customer-profile-unavailable"`, text `Customer profile unavailable until authenticated`)
9. Assert `isProfileVisible() === true` because the section container is visible but only contains the placeholder

---

### TC-05: Tab Switching - Interaction Info And Customer Profile Are Mutually Exclusive

| | |
|---|---|
| **File** | `02-edge-cases.spec.ts` |
| **Preloaded Data** | `BILLING_DISPUTE_PAYLOAD` |

**Steps:**
1. Create a run, accept the invite, then `waitForProfile('Olivia Carter')`
2. `openInteractionInformationTab()` -> assert `isInteractionInformationVisible() === true`, `isProfileVisible() === false`
3. `openCustomerProfileTab()` -> assert `isProfileVisible() === true`, `isInteractionInformationVisible() === false`

---

## Module D - Data Rendering Accuracy

### TC-06: Transcript Renders In Submission Order (Baseline Check)

| | |
|---|---|
| **File** | `02-edge-cases.spec.ts` |
| **Preloaded Data** | `BILLING_DISPUTE_PAYLOAD` (3 transcript messages in fixed order) |

**Steps:**
1. Create a run and accept the invite
2. `waitForTranscriptCount(3)`
3. Assert `getTranscriptMessages()` fully matches `payload.chatTranscript` including sender / timestamp / message for each row

---

### TC-07: Out-Of-Order Timestamps Still Render In Submission Order

| | |
|---|---|
| **File** | `02-edge-cases.spec.ts` |
| **Preloaded Data** | `BADGE_BUG_PAYLOAD` (`SAMPLE_TRANSCRIPT_47`, where messages 5 and 6 contain out-of-order timestamps) |
| **Related Bug** | Bug #4 (transcript timestamps are out of order) |

**Steps:**
1. Create a run and accept the invite
2. `waitForTranscriptCount(47)`
3. Assert `rendered[4] === SAMPLE_TRANSCRIPT_47[4]`
4. Assert `rendered[5] === SAMPLE_TRANSCRIPT_47[5]` to confirm the UI keeps submission order instead of re-sorting by time

---

### TC-08: Transaction List Stops At 10 Rows

| | |
|---|---|
| **File** | `02-edge-cases.spec.ts` |
| **Preloaded Data** | GET `/sampleprofile/10012.json` -> `profile.recentTransactions.length === 23` |
| **Related Bug** | Bug #5 (transaction list stops at 10 rows) |
| **Status** | Verified on the hosted environment: the UI only renders the first 10 rows; the remaining 13 are not visible |

**Steps:**
1. Create a run for account 10012 and accept the invite
2. `openCustomerProfileTab()`, `waitForProfile(profile.customerName)`
3. Assert `[data-testid^="transaction-row-"]` count === 23 <- **actual result: 10 rows are rendered (bug)**

---

### TC-17: Account With A Dedicated Transcript File - Render Account-Specific Content

| | |
|---|---|
| **File** | `02-edge-cases.spec.ts` |
| **Preloaded Data** | account 10003 -> GET `/sampletranscription/10003.json` returns 200 (47 messages, different from `default.json`) |

**Steps:**
1. GET `/sampletranscription/10003.json` -> `expectedTranscript` loaded dynamically, not hardcoded
2. Create a run for account 10003 with `expectedTranscript`, then accept the invite
3. `waitForTranscriptCount(expectedTranscript.length)`
4. Assert `getTranscriptMessages()` fully matches `expectedTranscript`

---

### TC-18: Account Without A Dedicated Transcript File - Fallback To `default.json`

| | |
|---|---|
| **File** | `02-edge-cases.spec.ts` |
| **Preloaded Data** | account 10001 -> GET `/sampletranscription/10001.json` returns 404 |

**Steps:**
1. GET `/sampletranscription/10001.json` -> assert `status === 404` to confirm no dedicated file exists
2. GET `/sampletranscription/default.json` -> `expectedTranscript` (30 messages)
3. Create a run for account 10001 with `expectedTranscript`, then accept the invite
4. `waitForTranscriptCount(expectedTranscript.length)`
5. Assert `getTranscriptMessages()` fully matches `expectedTranscript`

---

## Module E - Live Chat Message Sending

### TC-09: Agent Message Timestamp Format Is Incorrect

| | |
|---|---|
| **File** | `02-edge-cases.spec.ts` |
| **Preloaded Data** | `BILLING_DISPUTE_PAYLOAD` |
| **Related Bug** | Bug #3 (invalid agent message timestamp) |

**Steps:**
1. Create a run and accept the invite
2. `sendLiveChatMessage('Checking your account now.')`
3. Assert `getLastAgentTimestamp()` matches `/^00:\d{2}:\d{2}$/`; if it passes, the bug is reproduced

---

### TC-10: Send Button Is Disabled When Input Is Empty

| | |
|---|---|
| **File** | `02-edge-cases.spec.ts` |
| **Preloaded Data** | `BILLING_DISPUTE_PAYLOAD` |

**Steps:**
1. Create a run and accept the invite
2. `clearLiveChatInput()` to empty the input
3. Assert `isSendButtonDisabled() === true`

---

### TC-11: Send Button Remains Disabled For Whitespace-Only Input (Regression)

| | |
|---|---|
| **File** | `02-edge-cases.spec.ts` |
| **Preloaded Data** | `BILLING_DISPUTE_PAYLOAD` |

**Steps:**
1. Create a run and accept the invite
2. `fillChatInput('   ')` using 3 spaces
3. Assert `isSendButtonDisabled() === true` to confirm input validation uses `trim()` instead of raw length

---

## Module F - Badge Message Count

### TC-12: Badge Count Matches The Large Transcript Count

| | |
|---|---|
| **File** | `02-edge-cases.spec.ts` |
| **Preloaded Data** | `BADGE_BUG_PAYLOAD` (47 transcript messages) |
| **Related Bug** | Bug #1 (badge count stops at 35) |

**Steps:**
1. Create a run and accept the invite
2. `waitForTranscriptCount(47)`
3. `renderedCount = getTranscriptCount()`
4. Assert `getBadgeCount() === renderedCount` <- **actual result: badge stops at 35 (bug)**

---

### TC-13: Live-Chat Messages Increment The Badge Count

| | |
|---|---|
| **File** | `02-edge-cases.spec.ts` |
| **Preloaded Data** | `BILLING_DISPUTE_PAYLOAD` (3 transcript messages) |

**Steps:**
1. Accept the invite, then `waitForTranscriptCount(3)`
2. Assert `getBadgeCount() === 3`
3. `before = getLiveChatCounts()`
4. `sendLiveChatMessage('Reviewing your account now.')`
5. `waitForEchoReply(before)`
6. Assert `getBadgeCount() === 5` (`3 + 1 agent + 1 echo`)

---

### TC-14: Badge Remains Stable After Tab Switching

| | |
|---|---|
| **File** | `02-edge-cases.spec.ts` |
| **Preloaded Data** | `BILLING_DISPUTE_PAYLOAD` (3 transcript messages) |

**Steps:**
1. Accept the invite, then `waitForTranscriptCount(3)`
2. Assert `getBadgeCount() === 3`
3. `openCustomerProfileTab()`
4. `openInteractionInformationTab()`
5. Assert `getBadgeCount() === 3`; tab re-render must not reset the badge

---

### TC-15: Badge Cap 35 - Live-Chat Threshold Stress Test

| | |
|---|---|
| **File** | `02-edge-cases.spec.ts` |
| **Preloaded Data** | `BADGE_LIVECHAT_PAYLOAD` (34 transcript messages; after sending 1 message the total crosses the 35 cap) |
| **Related Bug** | Bug #1 extension: badge cap also applies to live-chat messages |
| **Status** | Verified on the hosted environment |

**Steps:**
1. Accept the invite, then `waitForTranscriptCount(34)`
2. `before = getLiveChatCounts()`
3. `sendLiveChatMessage('Checking your account.')`
4. `waitForEchoReply(before)`
5. Assert `getTranscriptCount() === 36` (`34 + agent + echo`, rendering still works)
6. Assert `getBadgeCount() === 35`; the badge stays at the cap and no longer increments

---

## Module G - API Contract Validation

### TC-16: Invalid Payload Returns A 4xx Error

| | |
|---|---|
| **File** | `02-edge-cases.spec.ts` |

**Steps:**
1. POST `/api/testrun({ interactionInformation: {} })` with all required fields missing
2. Assert HTTP `status >= 400` and `< 500`
3. Assert the response body contains a `message` field
