import type { TestRunPayload, TranscriptMessage } from '@src/api/testrun';

const BASE_AUTHENTICATED_INTERACTION = {
  channel: 'Chat',
  authenticationStatus: 'Authenticated' as const,
  journeyName: 'General Support',
  queueName: 'General',
  agentDesktopStatus: 'Connected',
  startTime: '2026-03-11T10:00:00Z',
};

export function buildAuthenticatedPayload(params: {
  interactionId: string;
  customerAccountNumber: string;
  chatTranscript: TranscriptMessage[];
  journeyName?: string;
  queueName?: string;
}): TestRunPayload {
  return {
    interactionInformation: {
      ...BASE_AUTHENTICATED_INTERACTION,
      interactionId: params.interactionId,
      customerAccountNumber: params.customerAccountNumber,
      journeyName: params.journeyName ?? BASE_AUTHENTICATED_INTERACTION.journeyName,
      queueName: params.queueName ?? BASE_AUTHENTICATED_INTERACTION.queueName,
    },
    chatTranscript: params.chatTranscript,
  };
}

export function buildAccountTranscriptPayload(
  account: string,
  chatTranscript: TranscriptMessage[],
): TestRunPayload {
  return buildAuthenticatedPayload({
    interactionId: `CHAT-TRANSCRIPT-${account}`,
    customerAccountNumber: account,
    chatTranscript,
  });
}

export function buildDefaultTranscriptPayload(
  account: string,
  chatTranscript: TranscriptMessage[],
): TestRunPayload {
  return buildAuthenticatedPayload({
    interactionId: `CHAT-TRANSCRIPT-DEFAULT-${account}`,
    customerAccountNumber: account,
    chatTranscript,
  });
}
