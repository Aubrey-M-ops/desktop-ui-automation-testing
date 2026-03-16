import { expect, test } from '@playwright/test';
import { createTestRun } from '../src/api/testrun';
import { BILLING_DISPUTE_PAYLOAD } from '../src/data/payloads';
import { PRIMARY_PROFILE } from '../src/data/sampleProfiles';
import { DesktopPage } from '../src/pages/DesktopPage';

const DESKTOP_BASE = process.env.DESKTOP_PATH ?? '/desktop';

test.describe('01 - Happy path', () => {
  test('TC-01 gates the workspace until the agent switches to Ready and accepts the invite', async ({ page, request }) => {
    const { runId } = await createTestRun(request, BILLING_DISPUTE_PAYLOAD);
    const desktop = new DesktopPage(page);

    await desktop.goto(runId, DESKTOP_BASE);
    await desktop.waitForAgentStatus();
    await desktop.waitForWorkspaceGated();
    await desktop.setAgentStatusReady();
    await desktop.acceptChatInvite();
    await expect.poll(() => desktop.isWorkspaceGatedVisible()).toBe(false);
  });

  test('TC-02 loads the seeded interaction, resolved profile, transcript and badge count after accept', async ({ page, request }) => {
    const { runId } = await createTestRun(request, BILLING_DISPUTE_PAYLOAD);
    const desktop = new DesktopPage(page);

    await desktop.goto(runId, DESKTOP_BASE);
    await desktop.waitForAgentStatus();
    await desktop.waitForWorkspaceGated();
    await desktop.setAgentStatusReady();
    await desktop.acceptChatInvite();

    const interactionInfo = await desktop.getInteractionInfo();
    expect(interactionInfo.interactionId).toBe(BILLING_DISPUTE_PAYLOAD.interactionInformation.interactionId);
    expect(interactionInfo.channel).toBe(BILLING_DISPUTE_PAYLOAD.interactionInformation.channel);
    expect(interactionInfo.authenticationStatus).toBe(BILLING_DISPUTE_PAYLOAD.interactionInformation.authenticationStatus);
    expect(interactionInfo.customerAccountNumber).toBe(BILLING_DISPUTE_PAYLOAD.interactionInformation.customerAccountNumber);
    expect(interactionInfo.journeyName).toBe(BILLING_DISPUTE_PAYLOAD.interactionInformation.journeyName);
    expect(interactionInfo.queueName).toBe(BILLING_DISPUTE_PAYLOAD.interactionInformation.queueName);
    expect(interactionInfo.agentDesktopStatus).toBe(BILLING_DISPUTE_PAYLOAD.interactionInformation.agentDesktopStatus);
    expect(interactionInfo.startTime).toContain('10:30');

    await desktop.waitForProfile(PRIMARY_PROFILE.customerName);
    const profile = await desktop.getProfileData();
    expect(profile).toEqual(PRIMARY_PROFILE);

    await desktop.waitForTranscriptCount(BILLING_DISPUTE_PAYLOAD.chatTranscript.length);
    await expect.poll(() => desktop.getTranscriptMessages()).toEqual(BILLING_DISPUTE_PAYLOAD.chatTranscript);
    await expect.poll(() => desktop.getBadgeCount()).toBe(BILLING_DISPUTE_PAYLOAD.chatTranscript.length);
  });

  test('TC-03 sending an agent message produces the observed disconnect system echo', async ({ page, request }) => {
    const { runId } = await createTestRun(request, BILLING_DISPUTE_PAYLOAD);
    const desktop = new DesktopPage(page);

    await desktop.goto(runId, DESKTOP_BASE);
    await desktop.waitForAgentStatus();
    await desktop.waitForWorkspaceGated();
    await desktop.setAgentStatusReady();
    await desktop.acceptChatInvite();
    await desktop.waitForTranscriptCount(BILLING_DISPUTE_PAYLOAD.chatTranscript.length);

    const beforeSend = await desktop.getLiveChatCounts();
    const message = 'I am reviewing your billing history now.';

    await desktop.sendLiveChatMessage(message);
    await desktop.waitForEchoReply(beforeSend);

    await expect.poll(() => desktop.getLastAgentMessage()).toContain(message);
    await expect.poll(() => desktop.hasDisconnectSystemMessage()).toBe(true);
  });
});
