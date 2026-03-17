import { Page, Locator, expect } from '@playwright/test';
import { InteractionInfo } from '@src/api/testrun';
import { SELECTORS } from '@src/config/selectors';

export { InteractionInfo };

/** Converts a testid string to a CSS attribute selector. */
function testIdToSelector(testId: string): string {
  return `[data-testid="${testId}"]`;
}

export interface TranscriptEntry {
  sender: string;
  timestamp: string;
  message: string;
}

export interface ProfileInfo {
  customerName: string;
  customerTier: string;
  accountStatus: string;
  lastPaymentDate: string;
  preferredLanguage: string;
  recentTransactions: Array<{ date: string; description: string; amount: string }>;
}

export class DesktopPage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  private byTestId(testId: string): Locator {
    return this.page.locator(testIdToSelector(testId));
  }

  private byTestIdPrefix(prefix: string): Locator {
    return this.page.locator(`[data-testid^="${prefix}-"]`);
  }

  private byCss(selector: string): Locator {
    return this.page.locator(selector);
  }

  // ── Navigation ────────────────────────────────────────────────────────────

  /**
   * Navigates to the desktop page for the given test run.
   * @param runId - The run ID returned by createTestRun; appended to desktopBase to form the URL
   * @param desktopBase - Base path for the desktop, defaults to "/desktop"; pass "/desktopv2" to test against the bug-fixed version
   */
  async goto(runId: string, desktopBase = '/desktop') {
    await this.page.goto(`${desktopBase}/${runId}`);
  }

  // ── Entry flow ────────────────────────────────────────────────────────────

  /** Wait for the initial agent-status element to become visible. */
  async waitForAgentStatus() {
    const statusSelect = this.byTestId(SELECTORS.header.agentStatusSelect);
    await expect(statusSelect).toBeVisible();
    await expect(statusSelect.locator('option')).toHaveCount(3);
  }

  async setAgentStatus(label: 'Ready' | 'Not Ready' | 'Offline') {
    const statusSelect = this.byTestId(SELECTORS.header.agentStatusSelect);
    await expect(statusSelect).toBeVisible();
    await statusSelect.selectOption({ label });
  }

  async setAgentStatusReady() {
    await this.setAgentStatus('Ready');
  }

  async waitForWorkspaceGated() {
    await expect(this.byTestId(SELECTORS.entryFlow.workspaceGated)).toBeVisible();
  }

  async isWorkspaceGatedVisible(): Promise<boolean> {
    return this.byTestId(SELECTORS.entryFlow.workspaceGated).isVisible();
  }

  async isChatInviteVisible(): Promise<boolean> {
    return this.byTestId(SELECTORS.entryFlow.chatInvite).isVisible();
  }

  /** Wait for the chat invite banner and click "Accept". */
  async acceptChatInvite() {
    await expect(this.byTestId(SELECTORS.entryFlow.chatInvite)).toBeVisible();
    await this.byTestId(SELECTORS.entryFlow.chatInviteAccept).click();
  }

  // ── Interaction Information (UI Text)───────────────────────────────────────────────

  /** Locates an element by its data-testid attribute and returns its visible text content. */
  private fieldText(testId: string): Promise<string> {
    return this.byTestId(testId).innerText();
  }

  /** Reads each field defined in SELECTORS.interactionInfo.fields from the page, returning their innerText as a structured object. */
  async getInteractionInfo(): Promise<InteractionInfo> {
    // Read all fields from the page in parallel, then combine into a single object.
    const entries = await Promise.all(
      Object.entries(SELECTORS.interactionInfo.fields).map(async ([key, testId]) =>
        [key, await this.fieldText(testId)] as const
      )
    );
    return Object.fromEntries(entries) as unknown as InteractionInfo;
  }

  // ── Customer Profile ──────────────────────────────────────────────────────

  async isProfileVisible(): Promise<boolean> {
    return this.byTestId(SELECTORS.customerProfile.root).isVisible();
  }

  async isProfilePlaceholderVisible(): Promise<boolean> {
    return this.byTestId(SELECTORS.customerProfile.unavailable).isVisible();
  }

  async openInteractionInformationTab() {
    await this.byTestId(SELECTORS.tabs.interactionInformation).click();
  }

  async openCustomerProfileTab() {
    await this.byTestId(SELECTORS.tabs.customerProfile).click();
  }

  async isInteractionInformationVisible(): Promise<boolean> {
    return this.byTestId(SELECTORS.interactionInfo.section).isVisible();
  }

  async getProfileData(): Promise<ProfileInfo> {
    const sp = SELECTORS.customerProfile;

    // Read scalar fields from the page in parallel, then combine into a single object.
    const fieldEntries = await Promise.all(
      Object.entries(sp.fields).map(async ([key, testId]) =>
        [key, await this.fieldText(testId)] as const
      )
    );

    // Transaction rows are indexed (transaction-row-0, …); cells have no testid — parse by position
    const recentTransactions: ProfileInfo['recentTransactions'] = [];
    let i = 0;
    while (true) {
      const row = this.byTestId(`${sp.transactionRowPrefix}-${i}`);
      if (await row.count() === 0) break;
      const parts = (await row.innerText()).split('\n');
      const entry = Object.fromEntries(sp.transactionRowFields.map((field, i) => [field, parts[i]]));
      recentTransactions.push(entry as ProfileInfo['recentTransactions'][number]);
      i++;
    }

    return {
      ...Object.fromEntries(fieldEntries) as Omit<ProfileInfo, 'recentTransactions'>,
      recentTransactions,
    };
  }

  // ── Transcript ────────────────────────────────────────────────────────────

  async getTranscriptMessages(): Promise<TranscriptEntry[]> {
    const st = SELECTORS.transcript;
    const messages: TranscriptEntry[] = [];

    // Messages are indexed (transcript-message-0, transcript-message-1, …)
    let i = 0;
    while (true) {
      const msg = this.byTestId(`${st.messagePrefix}-${i}`);
      if (await msg.count() === 0) break;
      const fieldEntries = await Promise.all(
        Object.entries(st.fields).map(async ([key, prefix]) =>
          [key, await this.byTestId(`${prefix}-${i}`).innerText()] as const
        )
      );
      messages.push(Object.fromEntries(fieldEntries) as unknown as TranscriptEntry);
      i++;
    }

    return messages;
  }

  async getTranscriptCount(): Promise<number> {
    return this.byTestIdPrefix(SELECTORS.transcript.messagePrefix).count();
  }

  // ── Live Chat ─────────────────────────────────────────────────────────────

  async sendLiveChatMessage(text: string) {
    const sc = SELECTORS.liveChat;
    await this.byTestId(sc.input).fill(text);
    await this.byTestId(sc.send).click();
  }

  async fillChatInput(text: string) {
    await this.byTestId(SELECTORS.liveChat.input).fill(text);
  }

  async clearLiveChatInput() {
    await this.byTestId(SELECTORS.liveChat.input).fill('');
  }

  async isSendButtonDisabled(): Promise<boolean> {
    return this.byTestId(SELECTORS.liveChat.send).isDisabled();
  }

  async getLastAgentMessage(): Promise<string> {
    const agentMessages = this.byTestId(SELECTORS.liveChat.messageAgent);
    const count = await agentMessages.count();
    return agentMessages.nth(count - 1).innerText();
  }

  async getLastCustomerMessage(): Promise<string> {
    const customerMessages = this.byTestId(SELECTORS.liveChat.messageCustomer);
    const count = await customerMessages.count();
    return customerMessages.nth(count - 1).innerText();
  }

  async waitForDisconnectSystemMessage() {
    await expect(this.page.getByText(SELECTORS.liveChat.disconnectMessageText)).toBeVisible();
  }

  async hasDisconnectSystemMessage(): Promise<boolean> {
    return this.page.getByText(SELECTORS.liveChat.disconnectMessageText).isVisible();
  }

  async getLastAgentTimestamp(): Promise<string> {
    const lastAgentMessageText = await this.getLastAgentMessage();
    const matches = lastAgentMessageText.match(/\b\d{2}:\d{2}:\d{2}\b/g);
    return matches?.at(-1) ?? '';
  }

  async getLiveChatCounts(): Promise<{ agent: number; customer: number }> {
    const [agent, customer] = await Promise.all([
      this.byTestId(SELECTORS.liveChat.messageAgent).count(),
      this.byTestId(SELECTORS.liveChat.messageCustomer).count(),
    ]);

    return { agent, customer };
  }

  // ── Badge ─────────────────────────────────────────────────────────────────

  async getBadgeCount(): Promise<number> {
    const badge = this.byCss(SELECTORS.badge.css).first();
    const text = await badge.innerText();
    return parseInt(text.trim(), 10);
  }

  // ── Waiting helpers ───────────────────────────────────────────────────────

  /** Wait until the transcript shows exactly `n` messages. */
  async waitForTranscriptCount(n: number) {
    await expect(this.byTestIdPrefix(SELECTORS.transcript.messagePrefix)).toHaveCount(n);
  }

  /** Wait for the profile panel to show the expected customer name. */
  async waitForProfile(expectedName: string) {
    await expect(this.byTestId(SELECTORS.customerProfile.fields.customerName)).toContainText(expectedName);
  }

  /**
   * After the agent sends a message, the system generates one echo customer
   * reply. Wait until the live-chat area reaches prevCount + 2.
   */
  async waitForEchoReply(previousCounts: { agent: number; customer: number }) {
    await expect(this.byTestId(SELECTORS.liveChat.messageAgent)).toHaveCount(previousCounts.agent + 1);
    await expect(this.byTestId(SELECTORS.liveChat.messageCustomer)).toHaveCount(previousCounts.customer + 1);
  }
}
