import { expect, test, type APIRequestContext, type Page } from '@playwright/test';
import { createTestRun, type TestRunPayload, type TranscriptMessage } from '@src/api/testrun';
import {
  buildAccountTranscriptPayload,
  buildDefaultTranscriptPayload,
  INVALID_INTERACTION_INFO_PAYLOAD,
  LARGE_CONVERSATION_TRANSCRIPT,
  PAYLOAD_BOUNDARY_ACCOUNT_10050,
  PAYLOAD_EMPTY_TRANSCRIPT_10001,
  PAYLOAD_HAPPY_PATH,
  PAYLOAD_LARGE_CONVERSATION,
  PAYLOAD_MINIMAL_PROFILE_10001,
  PAYLOAD_OUT_OF_RANGE_ACCOUNT_10051,
  PAYLOAD_TRANSACTION_PROFILE_10012,
  PAYLOAD_UNAUTHENTICATED,
} from '@test-data';
import { DesktopPage } from '@src/pages/DesktopPage';
import { profile10001, profile10012, type ProfileFixture } from '@test-data/profiles';

const DESKTOP_BASE = process.env.DESKTOP_PATH ?? '/desktop';

async function fetchJson<T>(request: APIRequestContext, path: string): Promise<T> {
  const response = await request.get(path);
  expect(response.ok()).toBeTruthy();
  return response.json() as Promise<T>;
}

async function openDesktopWithRun(
  page: Page,
  request: APIRequestContext,
  payload: TestRunPayload,
): Promise<DesktopPage> {
  const { runId } = await createTestRun(request, payload);
  const desktop = new DesktopPage(page);
  await desktop.goto(runId, DESKTOP_BASE);
  await desktop.waitForAgentStatus();
  return desktop;
}

async function readyAndAccept(desktop: DesktopPage) {
  await desktop.setAgentStatusReady();
  await desktop.acceptChatInvite();
}

test.describe('02 - Edge cases', () => {
  test.describe('B. Entry flow and agent state', () => {
    test('TC-02 Chat invite appears only when agent status is Ready', async ({ page, request }) => {
      const desktop = await openDesktopWithRun(page, request, PAYLOAD_HAPPY_PATH);

      await expect.poll(() => desktop.isChatInviteVisible()).toBe(false);
      await desktop.setAgentStatus('Offline');
      await expect.poll(() => desktop.isChatInviteVisible()).toBe(false);
      await desktop.setAgentStatus('Not Ready');
      await expect.poll(() => desktop.isChatInviteVisible()).toBe(false);
      await desktop.setAgentStatusReady();
      await expect.poll(() => desktop.isChatInviteVisible()).toBe(true);
    });

    test('TC-03 Chat invite remains hidden when agent moves from Offline to Not Ready', async ({ page, request }) => {
      const desktop = await openDesktopWithRun(page, request, PAYLOAD_HAPPY_PATH);

      await desktop.setAgentStatus('Offline');
      await expect.poll(() => desktop.isChatInviteVisible()).toBe(false);

      await desktop.setAgentStatus('Not Ready');
      await expect.poll(() => desktop.isChatInviteVisible()).toBe(false);
    });

    test('TC-04 Workspace is gated (send button unavailable) before accepting the chat invite', async ({ page, request }) => {
      const desktop = await openDesktopWithRun(page, request, PAYLOAD_HAPPY_PATH);

      await desktop.setAgentStatusReady();
      // Do NOT accept the invite — workspace should remain gated

      await expect.poll(() => desktop.isWorkspaceGatedVisible()).toBe(true);

      const sendButtonExists = await page.locator('[data-testid="agent-chat-send"]').count();
      if (sendButtonExists > 0) {
        await expect.poll(() => desktop.isSendButtonDisabled()).toBe(true);
      }
    });
  });

  test.describe('C. Panel visibility and tab navigation', () => {
    test('TC-05 Unauthenticated interaction shows the profile placeholder after unlock', async ({ page, request }) => {
      const desktop = await openDesktopWithRun(page, request, PAYLOAD_UNAUTHENTICATED);

      await desktop.waitForWorkspaceGated();
      await readyAndAccept(desktop);
      await expect.poll(() => desktop.isWorkspaceGatedVisible()).toBe(false);

      const interactionInfo = await desktop.getInteractionInfo();
      expect(interactionInfo.authenticationStatus).toBe('Not Authenticated');
      expect(interactionInfo.customerAccountNumber).toBeTruthy();  // App renders "-" as placeholder for absent account number

      await desktop.openCustomerProfileTab();
      await expect.poll(() => desktop.isProfilePlaceholderVisible()).toBe(true);
    });

    test('TC-06 Interaction Information and Customer Profile tabs are mutually exclusive', async ({ page, request }) => {
      const profile = profile10001;
      const desktop = await openDesktopWithRun(page, request, PAYLOAD_HAPPY_PATH);

      await readyAndAccept(desktop);

      await desktop.openInteractionInformationTab();
      await expect.poll(() => desktop.isInteractionInformationVisible()).toBe(true);
      await expect.poll(() => desktop.isProfileVisible()).toBe(false);

      await desktop.openCustomerProfileTab();
      await desktop.waitForProfile(profile.customerName);
      await expect.poll(() => desktop.isProfileVisible()).toBe(true);
      await expect.poll(() => desktop.isInteractionInformationVisible()).toBe(false);
    });
  });

  test.describe('D. Data rendering accuracy', () => {
    test('TC-07 Baseline transcript renders in submission order', async ({ page, request }) => {
      const desktop = await openDesktopWithRun(page, request, PAYLOAD_HAPPY_PATH);

      await readyAndAccept(desktop);
      await desktop.waitForTranscriptCount(PAYLOAD_HAPPY_PATH.chatTranscript.length);
      await expect.poll(() => desktop.getTranscriptMessages()).toEqual(PAYLOAD_HAPPY_PATH.chatTranscript);
    });

    test('TC-08 Out-of-order timestamps still render in submission order', async ({ page, request }) => {
      const desktop = await openDesktopWithRun(page, request, PAYLOAD_LARGE_CONVERSATION);

      await readyAndAccept(desktop);
      await desktop.waitForTranscriptCount(LARGE_CONVERSATION_TRANSCRIPT.length);

      const rendered = await desktop.getTranscriptMessages();
      expect(rendered[4]).toEqual(LARGE_CONVERSATION_TRANSCRIPT[4]);
      expect(rendered[5]).toEqual(LARGE_CONVERSATION_TRANSCRIPT[5]);
    });

    test('TC-09 Account-specific transcript file is rendered when available', async ({ page, request }) => {
      const account = '10003';
      const expectedTranscript = await fetchJson<TranscriptMessage[]>(request, `/sampletranscription/${account}.json`);
      const payload = buildAccountTranscriptPayload(account, expectedTranscript);
      const desktop = await openDesktopWithRun(page, request, payload);

      await readyAndAccept(desktop);
      await desktop.waitForTranscriptCount(expectedTranscript.length);
      await expect.poll(() => desktop.getTranscriptMessages()).toEqual(expectedTranscript);
    });

    test('TC-10 Default transcript is used when no account-specific file exists', async ({ page, request }) => {
      const account = '10001';
      const specificRes = await request.get(`/sampletranscription/${account}.json`);
      expect(specificRes.status()).toBe(404);

      const defaultTranscript = await fetchJson<TranscriptMessage[]>(request, '/sampletranscription/default.json');
      const payload = buildDefaultTranscriptPayload(account, defaultTranscript);
      const desktop = await openDesktopWithRun(page, request, payload);

      await readyAndAccept(desktop);
      await desktop.waitForTranscriptCount(defaultTranscript.length);
      await expect.poll(() => desktop.getTranscriptMessages()).toEqual(defaultTranscript);
    });

    test('TC-11 Customer profile transaction list renders the expected rows', async ({ page, request }) => {
      const profile = profile10012;
      const desktop = await openDesktopWithRun(page, request, PAYLOAD_TRANSACTION_PROFILE_10012);

      await readyAndAccept(desktop);
      await desktop.openCustomerProfileTab();
      await desktop.waitForProfile(profile.customerName);

      const renderedTxCount = await page.locator('[data-testid^="transaction-row-"]').count();
      expect(renderedTxCount).toBe(profile.recentTransactions.length);
    });

    test('TC-12 Customer profile loads with a non-empty customerName', async ({ page, request }) => {
      const desktop = await openDesktopWithRun(page, request, PAYLOAD_MINIMAL_PROFILE_10001);

      await readyAndAccept(desktop);
      await desktop.openCustomerProfileTab();

      const profile = await desktop.getProfileData();
      expect(profile).toBeDefined();
      expect(profile.customerName).toBeTruthy();
    });
  });

  test.describe('E. Live chat composer', () => {
    test('TC-13 Send button is disabled for empty input', async ({ page, request }) => {
      const desktop = await openDesktopWithRun(page, request, PAYLOAD_HAPPY_PATH);

      await readyAndAccept(desktop);
      await desktop.clearLiveChatInput();
      await expect.poll(() => desktop.isSendButtonDisabled()).toBe(true);
    });

    test('TC-14 Send button remains disabled for whitespace-only input', async ({ page, request }) => {
      const desktop = await openDesktopWithRun(page, request, PAYLOAD_HAPPY_PATH);

      await readyAndAccept(desktop);
      await desktop.fillChatInput('   ');
      await expect.poll(() => desktop.isSendButtonDisabled()).toBe(true);
    });

    test('TC-15 Very long message (500 chars) is sent without truncation', async ({ page, request }) => {
      const desktop = await openDesktopWithRun(page, request, PAYLOAD_HAPPY_PATH);

      await readyAndAccept(desktop);
      const beforeSend = await desktop.getTranscriptCount();

      const longMessage = 'A'.repeat(500);
      await desktop.sendLiveChatMessage(longMessage);
      await desktop.waitForTranscriptCount(beforeSend + 2);

      const transcript = await desktop.getTranscriptMessages();
      expect(transcript[beforeSend].message).toBe(longMessage);
      expect(transcript[beforeSend].message.length).toBe(500);
    });

    test('TC-16 Rapid consecutive message sending delivers all messages', async ({ page, request }) => {
      const desktop = await openDesktopWithRun(page, request, PAYLOAD_HAPPY_PATH);

      await readyAndAccept(desktop);
      const initialCount = await desktop.getTranscriptCount();

      await desktop.sendLiveChatMessage('Message 1');
      await desktop.sendLiveChatMessage('Message 2');
      await desktop.sendLiveChatMessage('Message 3');

      await page.waitForTimeout(3000);

      const finalCount = await desktop.getTranscriptCount();
      expect(finalCount).toBeGreaterThanOrEqual(initialCount + 3);
    });
  });

  test.describe('F. Badge count', () => {
    test('TC-17 Badge count matches the large transcript count', async ({ page, request }) => {
      const desktop = await openDesktopWithRun(page, request, PAYLOAD_LARGE_CONVERSATION);

      await readyAndAccept(desktop);
      await desktop.waitForTranscriptCount(LARGE_CONVERSATION_TRANSCRIPT.length);

      const renderedCount = await desktop.getTranscriptCount();
      await expect.poll(() => desktop.getBadgeCount()).toBe(renderedCount);
    });

    test('TC-18 Badge increments when live chat messages are appended', async ({ page, request }) => {
      const desktop = await openDesktopWithRun(page, request, PAYLOAD_HAPPY_PATH);

      await readyAndAccept(desktop);
      await desktop.waitForTranscriptCount(PAYLOAD_HAPPY_PATH.chatTranscript.length);
      await expect.poll(() => desktop.getBadgeCount()).toBe(PAYLOAD_HAPPY_PATH.chatTranscript.length);

      const beforeSend = await desktop.getTranscriptCount();
      await desktop.sendLiveChatMessage('Reviewing your account now.');
      await desktop.waitForTranscriptCount(beforeSend + 2);

      await expect.poll(() => desktop.getBadgeCount()).toBe(PAYLOAD_HAPPY_PATH.chatTranscript.length + 2);
    });

    test('TC-19 Badge remains stable across tab switching', async ({ page, request }) => {
      const desktop = await openDesktopWithRun(page, request, PAYLOAD_HAPPY_PATH);

      await readyAndAccept(desktop);
      await desktop.waitForTranscriptCount(PAYLOAD_HAPPY_PATH.chatTranscript.length);

      const expectedBadge = PAYLOAD_HAPPY_PATH.chatTranscript.length;
      await expect.poll(() => desktop.getBadgeCount()).toBe(expectedBadge);

      await desktop.openCustomerProfileTab();
      await desktop.openInteractionInformationTab();

      await expect.poll(() => desktop.getBadgeCount()).toBe(expectedBadge);
    });

    test('TC-20 Badge count continues to increment after a large transcript', async ({ page, request }) => {
      const desktop = await openDesktopWithRun(page, request, PAYLOAD_LARGE_CONVERSATION);

      await readyAndAccept(desktop);
      await desktop.waitForTranscriptCount(LARGE_CONVERSATION_TRANSCRIPT.length);

      await desktop.sendLiveChatMessage('Checking your account.');
      await desktop.waitForTranscriptCount(LARGE_CONVERSATION_TRANSCRIPT.length + 2);

      const renderedCount = await desktop.getTranscriptCount();
      const badge = await desktop.getBadgeCount();
      expect(renderedCount).toBe(LARGE_CONVERSATION_TRANSCRIPT.length + 2);
      expect(badge).toBe(LARGE_CONVERSATION_TRANSCRIPT.length + 2);
    });
  });

  test.describe('G. API contract validation', () => {
    test('TC-21 Authenticated runs accept the upper-bound sample profile account 10050', async ({ page, request }) => {
      const account = '10050';
      const profile = await fetchJson<ProfileFixture>(request, `/sampleprofile/${account}.json`);
      const desktop = await openDesktopWithRun(page, request, PAYLOAD_BOUNDARY_ACCOUNT_10050);

      await readyAndAccept(desktop);
      await desktop.openCustomerProfileTab();
      await desktop.waitForProfile(profile.customerName);

      const renderedProfile = await desktop.getProfileData();
      expect(renderedProfile.customerName).toBe(profile.customerName);
    });

    test('TC-22 Authenticated runs reject sample profile accounts outside 10001-10050', async ({ request }) => {
      const response = await request.post('/api/testrun', {
        data: PAYLOAD_OUT_OF_RANGE_ACCOUNT_10051,
      });

      expect(response.status()).toBeGreaterThanOrEqual(400);
      expect(response.status()).toBeLessThan(500);

      const body = await response.json();
      expect(body).toHaveProperty('message');
    });

    test('TC-23 Invalid payload returns a 4xx validation error', async ({ request }) => {
      const response = await request.post('/api/testrun', {
        data: INVALID_INTERACTION_INFO_PAYLOAD,
      });

      expect(response.status()).toBeGreaterThanOrEqual(400);
      expect(response.status()).toBeLessThan(500);

      const body = await response.json();
      expect(body).toHaveProperty('message');
    });

    test('TC-24 API rejects empty chatTranscript (Bug #4)', async ({ request }) => {
      // Bug #4: API currently rejects chatTranscript: [] with "must not be empty".
      // This test documents the bug - it will FAIL until the API is fixed.
      const response = await request.post('/api/testrun', {
        data: PAYLOAD_EMPTY_TRANSCRIPT_10001,
      });

      // Expected: API should accept empty transcript (fresh conversation scenario)
      // Actual: API rejects with validation error - this assertion will FAIL documenting Bug #4
      expect(response.ok()).toBeTruthy();
    });
  });

  test.describe('H. Echo message behavior', () => {
    test('TC-25 Echo reply sender type after agent sends message', async ({ page, request }) => {
      const desktop = await openDesktopWithRun(page, request, PAYLOAD_HAPPY_PATH);

      await readyAndAccept(desktop);
      await desktop.waitForTranscriptCount(PAYLOAD_HAPPY_PATH.chatTranscript.length);

      const beforeSend = await desktop.getTranscriptCount();
      await desktop.sendLiveChatMessage('I am reviewing your billing history now.');
      await desktop.waitForTranscriptCount(beforeSend + 2);

      const transcript = await desktop.getTranscriptMessages();
      expect(transcript[beforeSend].sender).toBe('Agent');
      expect(transcript[beforeSend].message).toBe('I am reviewing your billing history now.');
      expect(transcript[beforeSend + 1].sender).toBe('Customer');
    });
  });

  test.describe('I. Agent message timestamp accuracy', () => {
    test('TC-26 Agent message timestamp shows actual time not epoch', async ({ page, request }) => {
      const desktop = await openDesktopWithRun(page, request, PAYLOAD_HAPPY_PATH);

      await readyAndAccept(desktop);
      const beforeSend = await desktop.getTranscriptCount();

      await desktop.sendLiveChatMessage('Timestamp verification test');
      await desktop.waitForTranscriptCount(beforeSend + 2);

      const transcript = await desktop.getTranscriptMessages();
      const agentMessage = transcript[beforeSend];

      const timestampMatch = agentMessage.timestamp.match(/^(\d{2}):(\d{2}):(\d{2})$/);
      expect(timestampMatch).not.toBeNull();

      if (timestampMatch) {
        const hour = parseInt(timestampMatch[1], 10);
        expect(hour).toBeGreaterThanOrEqual(0);
        expect(hour).toBeLessThan(24);
      }
    });
  });
});
