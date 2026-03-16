import type { InteractionInfo } from '@src/api/testrun';

type ProfileFieldKey =
  | 'customerName'
  | 'accountNumber'
  | 'customerTier'
  | 'accountStatus'
  | 'lastPaymentDate'
  | 'preferredLanguage';

export const SELECTORS = {
  header: {
    root:              'desktop-header',
    connectionStatus:  'connection-status',
    agentStatusControl:'agent-status-control',
    agentStatusSelect: 'agent-status-select',
  },

  entryFlow: {
    agentStatus:       'agent-status',
    chatInvite:        'chat-invite',
    chatInviteAccept:  'accept-chat-invite',
    workspaceGated:    'workspace-gated',
  },

  tabs: {
    interactionInformation: 'tab-interaction-information',
    customerProfile:        'tab-customer-profile',
  },

  interactionInfo: {
    section: 'interaction-information',
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

  customerProfile: {
    root:        'customer-profile',
    unavailable: 'customer-profile-unavailable',
    // Scalar fields — keys match ProfileInfo field names for dynamic iteration
    fields: {
      customerName:      'customer-name',
      accountNumber:     'customer-account-number',
      customerTier:      'customer-tier',
      accountStatus:     'account-status',
      lastPaymentDate:   'last-payment-date',
      preferredLanguage: 'preferred-language',
    } satisfies Record<ProfileFieldKey, string>,
    // Transaction rows are indexed: transaction-row-0, transaction-row-1, ...
    // Individual cells have no testid — parsed from innerText by position (order must match the DOM)
    transactionRowPrefix: 'transaction-row',
    transactionRowFields: ['date', 'description', 'amount'] as const,
  },

  transcript: {
    section:       'chat-transcript',
    messagePrefix: 'transcript-message',
    // Fields are indexed: e.g. transcript-sender-0, transcript-text-0, ...
    // Keys match TranscriptEntry field names for dynamic iteration
    fields: {
      sender:    'transcript-sender',
      timestamp: 'transcript-timestamp',
      message:   'transcript-text',
    },
  },

  liveChat: {
    input:           'agent-chat-input',
    send:            'agent-chat-send',
    messageAgent:    'chat-message-agent',
    messageCustomer: 'chat-message-customer',
    disconnectMessageText: 'Chat disconnected unexpectedly.',
  },

  badge: {
    css: '.panel-badge',
  },
} as const;
