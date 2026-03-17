import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { expect, test, type APIRequestContext, type Page } from '@playwright/test';
import { createTestRun, type TestRunPayload } from '../src/api/testrun';
import { PAYLOAD_HAPPY_PATH } from '../test-data';
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

async function readLocalJson<T>(relativePath: string): Promise<T> {
  const filePath = path.resolve(__dirname, '..', relativePath);
  return JSON.parse(await readFile(filePath, 'utf8')) as T;
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
    const expectedProfile = await readLocalJson<ProfileFixture>('test-data/profiles/10001.json');
    const desktop = await openAcceptedDesktop(page, request, PAYLOAD_HAPPY_PATH);

    await expect.poll(() => desktop.isWorkspaceGatedVisible()).toBe(false);

    const interactionInfo = await desktop.getInteractionInfo();
    expect(interactionInfo.interactionId).toBe(PAYLOAD_HAPPY_PATH.interactionInformation.interactionId);
    expect(interactionInfo.channel).toBe(PAYLOAD_HAPPY_PATH.interactionInformation.channel);
    expect(interactionInfo.authenticationStatus).toBe(PAYLOAD_HAPPY_PATH.interactionInformation.authenticationStatus);
    expect(interactionInfo.customerAccountNumber).toBe(PAYLOAD_HAPPY_PATH.interactionInformation.customerAccountNumber);
    expect(interactionInfo.journeyName).toBe(PAYLOAD_HAPPY_PATH.interactionInformation.journeyName);
    expect(interactionInfo.queueName).toBe(PAYLOAD_HAPPY_PATH.interactionInformation.queueName);
    expect(interactionInfo.agentDesktopStatus).toBe(PAYLOAD_HAPPY_PATH.interactionInformation.agentDesktopStatus);
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
    await desktop.waitForTranscriptCount(PAYLOAD_HAPPY_PATH.chatTranscript.length);
    await expect.poll(() => desktop.getTranscriptMessages()).toEqual(PAYLOAD_HAPPY_PATH.chatTranscript);
    await expect.poll(() => desktop.getBadgeCount()).toBe(PAYLOAD_HAPPY_PATH.chatTranscript.length);

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
