import { expect, test } from '@playwright/test';
import { createTestRun } from '../src/api/testrun';
import {
  BADGE_BUG_PAYLOAD,
  BILLING_DISPUTE_PAYLOAD,
  SAMPLE_TRANSCRIPT_47,
  UNAUTHENTICATED_PAYLOAD,
} from '../src/data/payloads';
import { DesktopPage } from '../src/pages/DesktopPage';

const DESKTOP_BASE = process.env.DESKTOP_PATH ?? '/desktop';

test.describe('02 - Edge cases', () => {
  test('TC-03 agent status must be Ready before chat invite appears', async ({ page, request }) => {
    const { runId } = await createTestRun(request, BILLING_DISPUTE_PAYLOAD);
    const desktop = new DesktopPage(page);

    await desktop.goto(runId, DESKTOP_BASE);
    await desktop.waitForAgentStatus();
    await expect.poll(() => desktop.isChatInviteVisible()).toBe(false);

    await desktop.setAgentStatus('Not Ready');
    await expect.poll(() => desktop.isChatInviteVisible()).toBe(false);

    await desktop.setAgentStatusReady();
    await expect.poll(() => desktop.isChatInviteVisible()).toBe(true);

    await desktop.acceptChatInvite();
    await expect.poll(() => desktop.isWorkspaceGatedVisible()).toBe(false);
  });

  test('TC-04 keeps the workspace gated and hides the profile for an unauthenticated interaction', async ({ page, request }) => {
    const { runId } = await createTestRun(request, UNAUTHENTICATED_PAYLOAD);
    const desktop = new DesktopPage(page);

    await desktop.goto(runId, DESKTOP_BASE);
    await desktop.waitForAgentStatus();
    await desktop.waitForWorkspaceGated();
    await desktop.setAgentStatusReady();
    await desktop.acceptChatInvite();

    await expect.poll(() => desktop.isWorkspaceGatedVisible()).toBe(false);
    await expect.poll(() => desktop.isProfileVisible()).toBe(false);

    const interactionInfo = await desktop.getInteractionInfo();
    expect(interactionInfo.authenticationStatus).toBe('Not Authenticated');
    expect(interactionInfo.customerAccountNumber).toBeFalsy();
  });

  test('TC-05 switching tabs keeps interaction info and customer profile mutually exclusive', async ({ page, request }) => {
    const { runId } = await createTestRun(request, BILLING_DISPUTE_PAYLOAD);
    const desktop = new DesktopPage(page);

    await desktop.goto(runId, DESKTOP_BASE);
    await desktop.waitForAgentStatus();
    await desktop.setAgentStatusReady();
    await desktop.acceptChatInvite();
    await desktop.waitForProfile('Olivia Carter');

    await desktop.openInteractionInformationTab();
    await expect.poll(() => desktop.isInteractionInformationVisible()).toBe(true);
    await expect.poll(() => desktop.isProfileVisible()).toBe(false);

    await desktop.openCustomerProfileTab();
    await expect.poll(() => desktop.isProfileVisible()).toBe(true);
    await expect.poll(() => desktop.isInteractionInformationVisible()).toBe(false);
  });

  test('TC-06 preserves submission order for the baseline transcript', async ({ page, request }) => {
    const { runId } = await createTestRun(request, BILLING_DISPUTE_PAYLOAD);
    const desktop = new DesktopPage(page);

    await desktop.goto(runId, DESKTOP_BASE);
    await desktop.waitForAgentStatus();
    await desktop.setAgentStatusReady();
    await desktop.acceptChatInvite();
    await desktop.waitForTranscriptCount(BILLING_DISPUTE_PAYLOAD.chatTranscript.length);

    await expect.poll(() => desktop.getTranscriptMessages()).toEqual(BILLING_DISPUTE_PAYLOAD.chatTranscript);
  });

  test('TC-07 preserves submission order even when timestamps are out of order', async ({ page, request }) => {
    const { runId } = await createTestRun(request, BADGE_BUG_PAYLOAD);
    const desktop = new DesktopPage(page);

    await desktop.goto(runId, DESKTOP_BASE);
    await desktop.waitForAgentStatus();
    await desktop.setAgentStatusReady();
    await desktop.acceptChatInvite();
    await desktop.waitForTranscriptCount(SAMPLE_TRANSCRIPT_47.length);

    const rendered = await desktop.getTranscriptMessages();
    expect(rendered[4]).toEqual(SAMPLE_TRANSCRIPT_47[4]);
    expect(rendered[5]).toEqual(SAMPLE_TRANSCRIPT_47[5]);
  });

  test('TC-08 badge count equals transcript count for a large transcript', async ({ page, request }) => {
    const EXPECTED_COUNT = SAMPLE_TRANSCRIPT_47.length;
    const { runId } = await createTestRun(request, BADGE_BUG_PAYLOAD);
    const desktop = new DesktopPage(page);

    await desktop.goto(runId, DESKTOP_BASE);
    await desktop.waitForAgentStatus();
    await desktop.setAgentStatusReady();
    await desktop.acceptChatInvite();
    await desktop.waitForTranscriptCount(EXPECTED_COUNT);

    const renderedCount = await desktop.getTranscriptCount();
    await expect.poll(() => desktop.getBadgeCount()).toBe(renderedCount);
  });

  test('TC-09 captures the agent timestamp formatting bug after sending a live message', async ({ page, request }) => {
    const { runId } = await createTestRun(request, BILLING_DISPUTE_PAYLOAD);
    const desktop = new DesktopPage(page);

    await desktop.goto(runId, DESKTOP_BASE);
    await desktop.waitForAgentStatus();
    await desktop.setAgentStatusReady();
    await desktop.acceptChatInvite();

    await desktop.sendLiveChatMessage('Checking your account now.');
    await expect.poll(() => desktop.getLastAgentTimestamp()).toMatch(/^00:\d{2}:\d{2}$/);
  });

  test('TC-10 disables the send button when the input is empty', async ({ page, request }) => {
    const { runId } = await createTestRun(request, BILLING_DISPUTE_PAYLOAD);
    const desktop = new DesktopPage(page);

    await desktop.goto(runId, DESKTOP_BASE);
    await desktop.waitForAgentStatus();
    await desktop.setAgentStatusReady();
    await desktop.acceptChatInvite();

    await desktop.clearLiveChatInput();
    await expect.poll(() => desktop.isSendButtonDisabled()).toBe(true);
  });

  test('TC-11 returns a validation error for an invalid API payload', async ({ request }) => {
    const response = await request.post('/api/testrun', {
      data: { interactionInformation: {} },
    });

    expect(response.status()).toBeGreaterThanOrEqual(400);
    expect(response.status()).toBeLessThan(500);

    const body = await response.json();
    expect(body).toHaveProperty('message');
  });
});
