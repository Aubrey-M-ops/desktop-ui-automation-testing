# Bug Report

Automation run date: 2026-03-17

Test run summary:
- Total: 20
- Passed: 15
- Failed: 5
- Failed tests mapped to 3 distinct desktop bugs

## Bug 1: Chat invite appears when agent status is `Not Ready`

**Failing tests**
- `TC-02 Chat invite appears only when agent status is Ready`
- `TC-03 Chat invite remains hidden when agent moves from Offline to Not Ready`

**Steps to reproduce**
1. Create a test run with an authenticated payload such as `PAYLOAD_HAPPY_PATH`.
2. Open `/desktop/{runId}`.
3. Keep the agent in `Offline`, then switch the agent status to `Not Ready`.
4. Observe the entry-flow area.

**Expected result**
- The chat invite should stay hidden until the agent status is `Ready`.

**Actual result**
- The desktop renders `New chat invite` while the agent status is still `Not Ready`.

**Screenshot**

![Chat invite visible in Not Ready state](docs/bug-screenshots/not-ready-invite-visible.png)

---

## Bug 2: Customer Profile transaction list only renders the first page of rows

**Failing tests**
- `TC-10 Customer profile transaction list renders the expected rows`

**Steps to reproduce**
1. Create an authenticated run for account `10012`.
2. Accept the chat invite and open the `Customer Profile` tab.
3. Compare the rendered transaction rows with `test-data/profiles/10012.json`.

**Expected result**
- All `23` transactions from the sample profile should be rendered for validation.

**Actual result**
- The profile header says `23 items`, but only `10` transaction rows are rendered on the page and the UI shows `Page 1 of 3`.

**Screenshot**

![Transaction list paginated after 10 rows](docs/bug-screenshots/transaction-list-pagination.png)

---

## Bug 3: Chat message-count badge stops incrementing after 35 messages

**Failing tests**
- `TC-14 Badge count matches the large transcript count`
- `TC-17 Badge count continues to increment after a large transcript`

**Steps to reproduce**
1. Create a run with `PAYLOAD_LARGE_CONVERSATION` so the transcript contains `60` messages.
2. Open `/desktop/{runId}` and accept the chat invite.
3. Observe the badge in the chat window header.
4. Optionally send one additional live chat message and wait for the echo reply.

**Expected result**
- The badge should match the full rendered transcript count.
- With the base payload it should show `60`.
- After sending one agent message and one echo reply it should show `62`.

**Actual result**
- The badge stops at `35` and does not continue incrementing, even after additional messages are appended.

**Screenshot**

![Badge capped at 35 after large transcript](docs/bug-screenshots/badge-cap-after-large-transcript.png)
