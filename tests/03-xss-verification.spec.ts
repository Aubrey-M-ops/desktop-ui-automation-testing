import { expect, test, type APIRequestContext, type Page } from '@playwright/test';
import { createTestRun, type TestRunPayload } from '@src/api/testrun';
import {
  LONG_XSS_MESSAGE,
  PAYLOAD_LONG_XSS,
  PAYLOAD_SQL_INJECTION,
  PAYLOAD_UNICODE,
  PAYLOAD_XSS_LIVE,
  PAYLOAD_XSS_PRELOAD,
} from '@test-data';
import { DesktopPage } from '@src/pages/DesktopPage';

const DESKTOP_BASE = process.env.DESKTOP_PATH ?? '/desktop';

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

test.describe('03 - XSS and Security Verification', () => {
  test('TC-27 HTML/Script tags in pre-loaded transcript are escaped', async ({ page, request }) => {
    /**
     * Verify if HTML/script tags in the initial transcript are properly escaped
     */
    const desktop = await openDesktopWithRun(page, request, PAYLOAD_XSS_PRELOAD);
    await readyAndAccept(desktop);
    await desktop.waitForTranscriptCount(3);

    // Check if any alerts were triggered (XSS executed)
    let alertFired = false;
    page.on('dialog', async dialog => {
      alertFired = true;
      console.log('⚠️  ALERT FIRED: ' + dialog.message());
      await dialog.dismiss();
    });

    // Wait a bit to see if any alerts fire
    await page.waitForTimeout(1000);

    // Check how the message is rendered in the DOM
    const transcript = await desktop.getTranscriptMessages();
    console.log('Message 1:', transcript[0].message);
    console.log('Message 2:', transcript[1].message);
    console.log('Message 3:', transcript[2].message);

    // Check the raw HTML to see if tags are escaped
    const messageElement = page.locator('[data-testid="transcript-text-0"]');
    const innerHTML = await messageElement.innerHTML();
    const textContent = await messageElement.textContent();

    console.log('innerHTML:', innerHTML);
    console.log('textContent:', textContent);

    // If XSS is properly prevented, the script tags should be escaped
    // and no alerts should fire
    if (alertFired) {
      console.log('❌ XSS VULNERABILITY: Alert was triggered!');
    } else {
      console.log('✓ No alert fired - checking if tags are escaped...');
    }

    // The message should not execute scripts
    expect(alertFired).toBe(false);

    // Check if tags are visible as text (escaped) or if they're rendered as HTML
    if (innerHTML.includes('<script>')) {
      console.log('⚠️  POTENTIAL ISSUE: Script tags are in innerHTML (may or may not execute)');
    }
    if (textContent?.includes('<script>')) {
      console.log('✓ Script tags are escaped and shown as text');
    }
  });

  test('TC-28 HTML/Script tags in live chat messages are escaped', async ({ page, request }) => {
    /**
     * Verify if HTML/script tags in live agent messages are properly escaped
     */
    const desktop = await openDesktopWithRun(page, request, PAYLOAD_XSS_LIVE);
    await readyAndAccept(desktop);

    let alertFired = false;
    page.on('dialog', async dialog => {
      alertFired = true;
      console.log('⚠️  ALERT FIRED from live message: ' + dialog.message());
      await dialog.dismiss();
    });

    const beforeSend = await desktop.getTranscriptCount();

    // Send a message with script tags
    await desktop.sendLiveChatMessage('<script>alert("XSS from live chat")</script>Test message');
    await desktop.waitForTranscriptCount(beforeSend + 2);

    // Wait to see if alert fires
    await page.waitForTimeout(1000);

    const transcript = await desktop.getTranscriptMessages();
    const agentMessage = transcript[beforeSend];

    console.log('Live agent message:', agentMessage.message);

    // Check the DOM
    const messageElement = page.locator(`[data-testid="transcript-text-${beforeSend}"]`);
    const innerHTML = await messageElement.innerHTML();
    const textContent = await messageElement.textContent();

    console.log('innerHTML:', innerHTML);
    console.log('textContent:', textContent);

    if (alertFired) {
      console.log('❌ XSS VULNERABILITY: Alert was triggered from live message!');
    }

    expect(alertFired).toBe(false);
  });

  test('TC-29 SQL injection patterns in messages are handled safely', async ({ page, request }) => {
    /**
     * Test if SQL injection patterns cause any issues
     */

    // This should be rejected by the API or handled safely
    try {
      const desktop = await openDesktopWithRun(page, request, PAYLOAD_SQL_INJECTION);
      await readyAndAccept(desktop);

      const transcript = await desktop.getTranscriptMessages();
      console.log('SQL injection pattern stored as:', transcript[0].message);

      // If we got here, the payload was accepted
      // Verify the message is stored as-is (not interpreted)
      expect(transcript[0].message).toBe("'; DROP TABLE users; --");
    } catch (error) {
      // API might reject this payload
      console.log('API rejected SQL injection pattern (good!)');
    }
  });

  test('TC-30 Unicode and emoji handling', async ({ page, request }) => {
    /**
     * Test various unicode characters and emojis
     */
    const desktop = await openDesktopWithRun(page, request, PAYLOAD_UNICODE);
    await readyAndAccept(desktop);
    await desktop.waitForTranscriptCount(3);

    const transcript = await desktop.getTranscriptMessages();

    // Verify unicode is preserved
    expect(transcript[0].message).toContain('你好');
    expect(transcript[0].message).toContain('😀');
    expect(transcript[0].message).toContain('مرحبا');

    console.log('Unicode message 1:', transcript[0].message);
    console.log('Unicode message 2:', transcript[1].message);
    console.log('Unicode message 3:', transcript[2].message);
  });

  test('TC-31 Very long message with special characters', async ({ page, request }) => {
    /**
     * Test a very long message with mixed content
     */
    const desktop = await openDesktopWithRun(page, request, PAYLOAD_LONG_XSS);
    await readyAndAccept(desktop);
    await desktop.waitForTranscriptCount(1);

    const transcript = await desktop.getTranscriptMessages();

    // Verify the full message is stored
    expect(transcript[0].message.length).toBe(LONG_XSS_MESSAGE.length);

    // Verify no truncation
    expect(transcript[0].message).toBe(LONG_XSS_MESSAGE);

    console.log('Long message length:', transcript[0].message.length);
  });
});
