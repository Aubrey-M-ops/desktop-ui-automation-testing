/**
 * Centralised data-testid map for the agent desktop application.
 *
 * All locator keys used in DesktopPage.ts are defined here so that
 * a testid rename only requires a single change in one place.
 *
 * Convention: string values are data-testid attribute values.
 * Exception: badge.css is a plain CSS class selector (the badge has no testid).
 */
import type { InteractionInfo } from '@src/api/testrun';

type ProfileFieldKey =
  | 'customerName'
  | 'customerTier'
  | 'accountStatus'
  | 'lastPaymentDate'
  | 'preferredLanguage';

export const SELECTORS = {
  /**
   * Top bar containing the agent status dropdown and connection indicator.
   */
  header: {
    /** Root element of the page header. */
    root:              'desktop-header',
    /** Displays the current WebSocket / API connection state. */
    connectionStatus:  'connection-status',
    /** Wrapper around the status dropdown control. */
    agentStatusControl:'agent-status-control',
    /** `<select>` element for agent status; options: Ready / Not Ready / Offline. */
    agentStatusSelect: 'agent-status-select',
  },

  /**
   * Elements visible before and during the chat acceptance step.
   * `workspaceGated` overlays the workspace until the agent accepts an invite.
   */
  entryFlow: {
    /** Current agent status indicator shown in the entry area. */
    agentStatus:       'agent-status',
    /** Banner shown when a new chat invite arrives. */
    chatInvite:        'chat-invite',
    /** "Accept" button inside the chat invite banner. */
    chatInviteAccept:  'accept-chat-invite',
    /** Full-page overlay; hidden once the invite is accepted. */
    workspaceGated:    'workspace-gated',
  },

  /**
   * Tabs that toggle between the two side-panel views.
   */
  tabs: {
    /** Tab that shows the Interaction Information panel. */
    interactionInformation: 'tab-interaction-information',
    /** Tab that shows the Customer Profile panel. */
    customerProfile:        'tab-customer-profile',
  },

  /**
   * Interaction Information panel.
   * Displays the metadata submitted in `TestRunPayload.interactionInformation`.
   * `fields` keys match the `InteractionInfo` interface so they can be iterated dynamically.
   */
  interactionInfo: {
    /** Root element of the Interaction Information panel. */
    section: 'interaction-information',
    /**
     * Testid for each scalar field.
     * Keys are typed against `InteractionInfo` so a missing field is a compile error.
     */
    fields: {
      interactionId:         'interaction-id',
      channel:               'channel',
      authenticationStatus:  'auth-status',
      customerAccountNumber: 'customer-account-number',
      journeyName:           'journey-name',
      queueName:             'queue-name',
      agentDesktopStatus:    'desktop-status',
      startTime:             'start-time',
    } satisfies Record<keyof InteractionInfo, string>,
  },

  /**
   * Customer Profile panel.
   * Shows the resolved profile for authenticated customers.
   * Transaction rows use an indexed testid pattern: `transaction-row-0`, `transaction-row-1`, …
   * Individual cells within a row have no testid and are parsed from `innerText` by column position.
   */
  customerProfile: {
    /** Root element of the Customer Profile panel. */
    root:        'customer-profile',
    /** Placeholder element shown when the customer is not authenticated. */
    unavailable: 'customer-profile-unavailable',
    /**
     * Testid for each scalar profile field.
     * Keys are typed against `ProfileFieldKey` so a missing field is a compile error.
     */
    fields: {
      customerName:      'customer-name',
      customerTier:      'customer-tier',
      accountStatus:     'account-status',
      lastPaymentDate:   'last-payment-date',
      preferredLanguage: 'preferred-language',
    } satisfies Record<ProfileFieldKey, string>,
    /** Base testid for transaction rows; combined with row index: `transaction-row-{i}`. */
    transactionRowPrefix: 'transaction-row',
    /** Column names in DOM order; used to map `innerText` parts to field names. */
    transactionRowFields: ['date', 'description', 'amount'] as const,
  },

  /**
   * Chat transcript panel.
   * Displays pre-loaded messages from `TestRunPayload.chatTranscript`.
   * Rows use indexed testids: `transcript-message-0`, `transcript-message-1`, …
   * Sub-fields also use the index: `transcript-sender-0`, `transcript-timestamp-0`, `transcript-text-0`.
   */
  transcript: {
    /** Root element of the chat transcript section. */
    section:       'chat-transcript',
    /** Base testid for transcript rows; combined with index: `transcript-message-{i}`. */
    messagePrefix: 'transcript-message',
    /**
     * Base testids for the sub-fields of each row.
     * Keys match `TranscriptEntry` field names for dynamic iteration.
     */
    fields: {
      sender:    'transcript-sender',
      timestamp: 'transcript-timestamp',
      message:   'transcript-text',
    },
  },

  /**
   * Live chat composer.
   * Input and send controls for the agent.
   * After the agent sends a message, the app automatically appends a Customer echo reply.
   */
  liveChat: {
    /** Text input where the agent types a message. */
    input:           'agent-chat-input',
    /** Send button; disabled when the input is empty or whitespace-only. */
    send:            'agent-chat-send',
    /** Rendered agent message bubbles (one per sent message). */
    messageAgent:    'chat-message-agent',
    /** Rendered customer message bubbles (transcript + echo replies). */
    messageCustomer: 'chat-message-customer',
    /** Exact text of the system message shown when the chat disconnects unexpectedly. */
    disconnectMessageText: 'Chat disconnected unexpectedly.',
  },

  /**
   * Message count badge in the chat panel header.
   * Uses a CSS class selector because no `data-testid` is present on the badge element.
   */
  badge: {
    /** CSS selector for the badge element. */
    css: '.panel-badge',
  },
} as const;
