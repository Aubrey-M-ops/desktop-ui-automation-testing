import { expect, test, type APIRequestContext, type Page } from '@playwright/test';
import { createTestRun, type TestRunPayload } from '../src/api/testrun';
import { PAYLOAD_HAPPY_PATH } from '../test-data';
import { DesktopPage } from '../src/pages/DesktopPage';
import { profile10001 } from '../test-data/profiles';

const DESKTOP_BASE = process.env.DESKTOP_PATH ?? '/desktop';

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
    const expectedProfile = profile10001;
    const desktop = await openAcceptedDesktop(page, request, PAYLOAD_HAPPY_PATH);

    await expect.poll(() => desktop.isWorkspaceGatedVisible()).toBe(false);

    // Verify all interaction information fields
    const interactionInfo = await desktop.getInteractionInfo();
    const expectedInteractionInfo = PAYLOAD_HAPPY_PATH.interactionInformation;
    
    // Verify each field except startTime (which needs partial match)
    const fieldsToVerify = [
      'interactionId',
      'channel', 
      'authenticationStatus',
      'customerAccountNumber',
      'journeyName',
      'queueName',
      'agentDesktopStatus',
    ] as const;

    for (const field of fieldsToVerify) {
      expect(interactionInfo[field]).toBe(expectedInteractionInfo[field]);
    }
    expect(interactionInfo.startTime).toContain('10:30');

    // Verify customer profile
    await desktop.openCustomerProfileTab();
    await desktop.waitForProfile(expectedProfile.customerName);

    const profile = await desktop.getProfileData();
    
    // Verify all profile fields dynamically
    const profileFieldsToVerify = [
      'customerName',
      'customerTier',
      'accountStatus',
      'lastPaymentDate',
      'preferredLanguage',
    ] as const;

    for (const field of profileFieldsToVerify) {
      expect(profile[field]).toBe(expectedProfile[field]);
    }
    
    // Verify transactions separately (array comparison)
    expect(profile.recentTransactions).toEqual(expectedProfile.recentTransactions);

    // Verify transcript
    await desktop.openInteractionInformationTab();
    await desktop.waitForTranscriptCount(PAYLOAD_HAPPY_PATH.chatTranscript.length);
    await expect.poll(() => desktop.getTranscriptMessages()).toEqual(PAYLOAD_HAPPY_PATH.chatTranscript);
    await expect.poll(() => desktop.getBadgeCount()).toBe(PAYLOAD_HAPPY_PATH.chatTranscript.length);

    // Verify live chat
    const beforeSend = await desktop.getTranscriptCount();
    await desktop.sendLiveChatMessage('I am reviewing your billing history now.');
    await desktop.waitForTranscriptCount(beforeSend + 2);

    const transcriptAfterSend = await desktop.getTranscriptMessages();
    expect(transcriptAfterSend[beforeSend].sender).toBe('Agent');
    expect(transcriptAfterSend[beforeSend].message).toBe('I am reviewing your billing history now.');
    // App sends a Customer echo reply simulating a live conversation response
    expect(transcriptAfterSend[beforeSend + 1].sender).toBe('Customer');
  });
});
