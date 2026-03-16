import { expect, test, type APIRequestContext, type Page } from '@playwright/test';
import { createTestRun, type TestRunPayload } from '../src/api/testrun';
import { BILLING_DISPUTE_PAYLOAD } from '../src/data/payloads';
import { DesktopPage } from '../src/pages/DesktopPage';

const DESKTOP_BASE = process.env.DESKTOP_PATH ?? '/desktop';

interface ProfileFixture {
  customerName: string;
  accountNumber: string;
  customerTier: string;
  accountStatus: string;
  lastPaymentDate: string;
  preferredLanguage: string;
  recentTransactions: Array<{ date: string; description: string; amount: string }>;
}

async function fetchJson<T>(request: APIRequestContext, path: string): Promise<T> {
  const response = await request.get(path);
  expect(response.ok()).toBeTruthy();
  return response.json() as Promise<T>;
}

async function openAcceptedDesktop(
  page: Page,
  request: APIRequestContext,
  payload: TestRunPayload,
): Promise<DesktopPage> {
  const { runId } = await createTestRun(request, payload);
  const desktop = new DesktopPage(page);

  await desktop.goto(runId, DESKTOP_BASE);
  await desktop.waitForAgentStatus();
  await desktop.waitForWorkspaceGated();
  await desktop.setAgentStatusReady();
  await desktop.acceptChatInvite();

  return desktop;
}

test.describe('01 - Happy path', () => {
  test('TC-01 Billing Dispute - Full end-to-end flow (account 10001)', async ({ page, request }) => {
    const expectedProfile = await fetchJson<ProfileFixture>(request, '/sampleprofile/10001.json');
    const desktop = await openAcceptedDesktop(page, request, BILLING_DISPUTE_PAYLOAD);

    await expect.poll(() => desktop.isWorkspaceGatedVisible()).toBe(false);

    const interactionInfo = await desktop.getInteractionInfo();
    expect(interactionInfo.interactionId).toBe(BILLING_DISPUTE_PAYLOAD.interactionInformation.interactionId);
    expect(interactionInfo.channel).toBe(BILLING_DISPUTE_PAYLOAD.interactionInformation.channel);
    expect(interactionInfo.authenticationStatus).toBe(BILLING_DISPUTE_PAYLOAD.interactionInformation.authenticationStatus);
    expect(interactionInfo.customerAccountNumber).toBe(BILLING_DISPUTE_PAYLOAD.interactionInformation.customerAccountNumber);
    expect(interactionInfo.journeyName).toBe(BILLING_DISPUTE_PAYLOAD.interactionInformation.journeyName);
    expect(interactionInfo.queueName).toBe(BILLING_DISPUTE_PAYLOAD.interactionInformation.queueName);
    expect(interactionInfo.agentDesktopStatus).toBe(BILLING_DISPUTE_PAYLOAD.interactionInformation.agentDesktopStatus);
    expect(interactionInfo.startTime).toContain('10:30');

    await desktop.openCustomerProfileTab();
    await desktop.waitForProfile(expectedProfile.customerName);

    const profile = await desktop.getProfileData();
    expect(profile.customerName).toBe(expectedProfile.customerName);
    expect(profile.accountNumber).toBe(expectedProfile.accountNumber);
    expect(profile.customerTier).toBe(expectedProfile.customerTier);
    expect(profile.accountStatus).toBe(expectedProfile.accountStatus);
    expect(profile.lastPaymentDate).toBe(expectedProfile.lastPaymentDate);
    expect(profile.preferredLanguage).toBe(expectedProfile.preferredLanguage);
    expect(profile.recentTransactions).toEqual(expectedProfile.recentTransactions);

    await desktop.openInteractionInformationTab();
    await desktop.waitForTranscriptCount(BILLING_DISPUTE_PAYLOAD.chatTranscript.length);
    await expect.poll(() => desktop.getTranscriptMessages()).toEqual(BILLING_DISPUTE_PAYLOAD.chatTranscript);
    await expect.poll(() => desktop.getBadgeCount()).toBe(BILLING_DISPUTE_PAYLOAD.chatTranscript.length);

    const beforeSend = await desktop.getTranscriptCount();
    await desktop.sendLiveChatMessage('I am reviewing your billing history now.');
    await desktop.waitForTranscriptCount(beforeSend + 2);

    const transcriptAfterSend = await desktop.getTranscriptMessages();
    expect(transcriptAfterSend[beforeSend].sender).toBe('Agent');
    expect(transcriptAfterSend[beforeSend].message).toBe('I am reviewing your billing history now.');
    expect(transcriptAfterSend[beforeSend + 1].sender).toBe('System');
    expect(transcriptAfterSend[beforeSend + 1].message).toBe('Chat disconnected unexpectedly.');
  });
});
