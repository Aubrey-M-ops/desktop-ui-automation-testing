import { expect, test, type APIRequestContext, type Page } from '@playwright/test';
import { createTestRun, type TestRunPayload, type TranscriptMessage } from '../src/api/testrun';
import {
  BADGE_BUG_PAYLOAD,
  BADGE_LIVECHAT_PAYLOAD,
  BILLING_DISPUTE_PAYLOAD,
  SAMPLE_TRANSCRIPT_47,
  TRANSCRIPT_34,
  UNAUTHENTICATED_PAYLOAD,
} from '../src/data/payloads';
import { DesktopPage } from '../src/pages/DesktopPage';

const DESKTOP_BASE = process.env.DESKTOP_PATH ?? '/desktop';

interface ProfileFixture {
  customerName: string;
  recentTransactions: Array<{ date: string; description: string; amount: string }>;
}

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
      const desktop = await openDesktopWithRun(page, request, BILLING_DISPUTE_PAYLOAD);

      await expect.poll(() => desktop.isChatInviteVisible()).toBe(false);
      await desktop.setAgentStatus('Offline');
      await expect.poll(() => desktop.isChatInviteVisible()).toBe(false);
      await desktop.setAgentStatus('Not Ready');
      await expect.poll(() => desktop.isChatInviteVisible()).toBe(false);
      await desktop.setAgentStatusReady();
      await expect.poll(() => desktop.isChatInviteVisible()).toBe(true);
    });

    test('TC-03 Offline to Not Ready unexpectedly triggers the chat invite (Bug #6)', async ({ page, request }) => {
      const desktop = await openDesktopWithRun(page, request, BILLING_DISPUTE_PAYLOAD);

      await desktop.setAgentStatus('Offline');
      await expect.poll(() => desktop.isChatInviteVisible()).toBe(false);

      await desktop.setAgentStatus('Not Ready');
      await expect.poll(() => desktop.isChatInviteVisible()).toBe(true);
    });
  });

  test.describe('C. Panel visibility and tab navigation', () => {
    test('TC-04 Unauthenticated interaction shows the profile placeholder after unlock', async ({ page, request }) => {
      const desktop = await openDesktopWithRun(page, request, UNAUTHENTICATED_PAYLOAD);

      await desktop.waitForWorkspaceGated();
      await readyAndAccept(desktop);
      await expect.poll(() => desktop.isWorkspaceGatedVisible()).toBe(false);

      const interactionInfo = await desktop.getInteractionInfo();
      expect(interactionInfo.authenticationStatus).toBe('Not Authenticated');
      expect(interactionInfo.customerAccountNumber).toBeFalsy();

      await desktop.openCustomerProfileTab();
      await expect.poll(() => desktop.isProfilePlaceholderVisible()).toBe(true);
    });

    test('TC-05 Interaction Information and Customer Profile tabs are mutually exclusive', async ({ page, request }) => {
      const profile = await fetchJson<ProfileFixture>(request, '/sampleprofile/10001.json');
      const desktop = await openDesktopWithRun(page, request, BILLING_DISPUTE_PAYLOAD);

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
    test('TC-06 Baseline transcript renders in submission order', async ({ page, request }) => {
      const desktop = await openDesktopWithRun(page, request, BILLING_DISPUTE_PAYLOAD);

      await readyAndAccept(desktop);
      await desktop.waitForTranscriptCount(BILLING_DISPUTE_PAYLOAD.chatTranscript.length);
      await expect.poll(() => desktop.getTranscriptMessages()).toEqual(BILLING_DISPUTE_PAYLOAD.chatTranscript);
    });

    test('TC-07 Out-of-order timestamps still render in submission order', async ({ page, request }) => {
      const desktop = await openDesktopWithRun(page, request, BADGE_BUG_PAYLOAD);

      await readyAndAccept(desktop);
      await desktop.waitForTranscriptCount(SAMPLE_TRANSCRIPT_47.length);

      const rendered = await desktop.getTranscriptMessages();
      expect(rendered[4]).toEqual(SAMPLE_TRANSCRIPT_47[4]);
      expect(rendered[5]).toEqual(SAMPLE_TRANSCRIPT_47[5]);
    });

    test('TC-08 Account-specific transcript file is rendered when available', async ({ page, request }) => {
      const account = '10003';
      const expectedTranscript = await fetchJson<TranscriptMessage[]>(request, `/sampletranscription/${account}.json`);
      const payload: TestRunPayload = {
        interactionInformation: {
          interactionId: `CHAT-TRANSCRIPT-${account}`,
          channel: 'Chat',
          authenticationStatus: 'Authenticated',
          customerAccountNumber: account,
          journeyName: 'General Support',
          queueName: 'General',
          agentDesktopStatus: 'Connected',
          startTime: '2026-03-11T10:00:00Z',
        },
        chatTranscript: expectedTranscript,
      };
      const desktop = await openDesktopWithRun(page, request, payload);

      await readyAndAccept(desktop);
      await desktop.waitForTranscriptCount(expectedTranscript.length);
      await expect.poll(() => desktop.getTranscriptMessages()).toEqual(expectedTranscript);
    });

    test('TC-09 Default transcript is used when no account-specific file exists', async ({ page, request }) => {
      const account = '10001';
      const specificRes = await request.get(`/sampletranscription/${account}.json`);
      expect(specificRes.status()).toBe(404);

      const defaultTranscript = await fetchJson<TranscriptMessage[]>(request, '/sampletranscription/default.json');
      const payload: TestRunPayload = {
        interactionInformation: {
          interactionId: `CHAT-TRANSCRIPT-DEFAULT-${account}`,
          channel: 'Chat',
          authenticationStatus: 'Authenticated',
          customerAccountNumber: account,
          journeyName: 'General Support',
          queueName: 'General',
          agentDesktopStatus: 'Connected',
          startTime: '2026-03-11T10:00:00Z',
        },
        chatTranscript: defaultTranscript,
      };
      const desktop = await openDesktopWithRun(page, request, payload);

      await readyAndAccept(desktop);
      await desktop.waitForTranscriptCount(defaultTranscript.length);
      await expect.poll(() => desktop.getTranscriptMessages()).toEqual(defaultTranscript);
    });

    test('TC-10 Transaction list is truncated at 10 rows (Bug #5, account 10012)', async ({ page, request }) => {
      const account = '10012';
      const profile = await fetchJson<ProfileFixture>(request, `/sampleprofile/${account}.json`);
      const payload: TestRunPayload = {
        interactionInformation: {
          interactionId: 'CHAT-TX-TRUNC',
          channel: 'Chat',
          authenticationStatus: 'Authenticated',
          customerAccountNumber: account,
          journeyName: 'Account Inquiry',
          queueName: 'General Support',
          agentDesktopStatus: 'Connected',
          startTime: '2026-03-11T10:00:00Z',
        },
        chatTranscript: [{ sender: 'Customer', timestamp: '10:00:01', message: 'Hello' }],
      };
      const desktop = await openDesktopWithRun(page, request, payload);

      await readyAndAccept(desktop);
      await desktop.openCustomerProfileTab();
      await desktop.waitForProfile(profile.customerName);

      const renderedTxCount = await page.locator('[data-testid^="transaction-row-"]').count();
      expect(renderedTxCount).toBe(profile.recentTransactions.length);
    });
  });

  test.describe('E. Live chat composer', () => {
    test('TC-11 Agent message timestamp is rendered as 00:xx:xx (Bug #3)', async ({ page, request }) => {
      const desktop = await openDesktopWithRun(page, request, BILLING_DISPUTE_PAYLOAD);

      await readyAndAccept(desktop);
      const beforeSend = await desktop.getTranscriptCount();

      await desktop.sendLiveChatMessage('Checking your account now.');
      await desktop.waitForTranscriptCount(beforeSend + 2);

      const transcript = await desktop.getTranscriptMessages();
      expect(transcript[beforeSend].sender).toBe('Agent');
      expect(transcript[beforeSend].timestamp).toMatch(/^00:\d{2}:\d{2}$/);
    });

    test('TC-12 Send button is disabled for empty input', async ({ page, request }) => {
      const desktop = await openDesktopWithRun(page, request, BILLING_DISPUTE_PAYLOAD);

      await readyAndAccept(desktop);
      await desktop.clearLiveChatInput();
      await expect.poll(() => desktop.isSendButtonDisabled()).toBe(true);
    });

    test('TC-13 Send button remains disabled for whitespace-only input', async ({ page, request }) => {
      const desktop = await openDesktopWithRun(page, request, BILLING_DISPUTE_PAYLOAD);

      await readyAndAccept(desktop);
      await desktop.fillChatInput('   ');
      await expect.poll(() => desktop.isSendButtonDisabled()).toBe(true);
    });
  });

  test.describe('F. Badge count', () => {
    test('TC-14 Badge count matches the large transcript count', async ({ page, request }) => {
      const desktop = await openDesktopWithRun(page, request, BADGE_BUG_PAYLOAD);

      await readyAndAccept(desktop);
      await desktop.waitForTranscriptCount(SAMPLE_TRANSCRIPT_47.length);

      const renderedCount = await desktop.getTranscriptCount();
      await expect.poll(() => desktop.getBadgeCount()).toBe(renderedCount);
    });

    test('TC-15 Badge increments when live chat messages are appended', async ({ page, request }) => {
      const desktop = await openDesktopWithRun(page, request, BILLING_DISPUTE_PAYLOAD);

      await readyAndAccept(desktop);
      await desktop.waitForTranscriptCount(BILLING_DISPUTE_PAYLOAD.chatTranscript.length);
      await expect.poll(() => desktop.getBadgeCount()).toBe(BILLING_DISPUTE_PAYLOAD.chatTranscript.length);

      const beforeSend = await desktop.getTranscriptCount();
      await desktop.sendLiveChatMessage('Reviewing your account now.');
      await desktop.waitForTranscriptCount(beforeSend + 2);

      await expect.poll(() => desktop.getBadgeCount()).toBe(BILLING_DISPUTE_PAYLOAD.chatTranscript.length + 2);
    });

    test('TC-16 Badge remains stable across tab switching', async ({ page, request }) => {
      const desktop = await openDesktopWithRun(page, request, BILLING_DISPUTE_PAYLOAD);

      await readyAndAccept(desktop);
      await desktop.waitForTranscriptCount(BILLING_DISPUTE_PAYLOAD.chatTranscript.length);

      const expectedBadge = BILLING_DISPUTE_PAYLOAD.chatTranscript.length;
      await expect.poll(() => desktop.getBadgeCount()).toBe(expectedBadge);

      await desktop.openCustomerProfileTab();
      await desktop.openInteractionInformationTab();

      await expect.poll(() => desktop.getBadgeCount()).toBe(expectedBadge);
    });

    test('TC-17 Badge caps at 35 when live chat crosses the threshold', async ({ page, request }) => {
      const desktop = await openDesktopWithRun(page, request, BADGE_LIVECHAT_PAYLOAD);

      await readyAndAccept(desktop);
      await desktop.waitForTranscriptCount(TRANSCRIPT_34.length);

      await desktop.sendLiveChatMessage('Checking your account.');
      await desktop.waitForTranscriptCount(TRANSCRIPT_34.length + 2);

      const renderedCount = await desktop.getTranscriptCount();
      const badge = await desktop.getBadgeCount();
      expect(renderedCount).toBe(TRANSCRIPT_34.length + 2);
      expect(badge).toBe(35);
    });
  });

  test.describe('G. API contract validation', () => {
    test('TC-18 Invalid payload returns a 4xx validation error', async ({ request }) => {
      const response = await request.post('/api/testrun', {
        data: { interactionInformation: {} },
      });

      expect(response.status()).toBeGreaterThanOrEqual(400);
      expect(response.status()).toBeLessThan(500);

      const body = await response.json();
      expect(body).toHaveProperty('message');
    });
  });
});
