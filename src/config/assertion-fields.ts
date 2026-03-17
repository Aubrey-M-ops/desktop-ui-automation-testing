export const ASSERTION_FIELDS = {
  interactionInfoExact: [
    'interactionId',
    'channel',
    'authenticationStatus',
    'customerAccountNumber',
    'journeyName',
    'queueName',
    'agentDesktopStatus',
  ] as const,
  profileExact: [
    'customerName',
    'customerTier',
    'accountStatus',
    'lastPaymentDate',
    'preferredLanguage',
  ] as const,
} as const;
