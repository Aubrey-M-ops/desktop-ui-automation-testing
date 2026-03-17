import { buildAuthenticatedPayload } from '@test-data/builders';

const SINGLE_MESSAGE_TRANSCRIPT = [
  { sender: 'Customer' as const, timestamp: '10:00:01', message: 'Hello' },
];

export const PAYLOAD_TRANSACTION_PROFILE_10012 = buildAuthenticatedPayload({
  interactionId: 'CHAT-TX-TRUNC',
  customerAccountNumber: '10012',
  journeyName: 'Account Inquiry',
  queueName: 'General Support',
  chatTranscript: SINGLE_MESSAGE_TRANSCRIPT,
});

export const PAYLOAD_MINIMAL_PROFILE_10001 = buildAuthenticatedPayload({
  interactionId: 'CHAT-MINIMAL-PROFILE',
  customerAccountNumber: '10001',
  chatTranscript: SINGLE_MESSAGE_TRANSCRIPT,
});

export const PAYLOAD_BOUNDARY_ACCOUNT_10050 = buildAuthenticatedPayload({
  interactionId: 'CHAT-BOUNDARY-10050',
  customerAccountNumber: '10050',
  chatTranscript: SINGLE_MESSAGE_TRANSCRIPT,
});

export const PAYLOAD_OUT_OF_RANGE_ACCOUNT_10051 = buildAuthenticatedPayload({
  interactionId: 'CHAT-OUT-OF-RANGE-10051',
  customerAccountNumber: '10051',
  chatTranscript: SINGLE_MESSAGE_TRANSCRIPT,
});

export const PAYLOAD_EMPTY_TRANSCRIPT_10001 = buildAuthenticatedPayload({
  interactionId: 'CHAT-EMPTY-TRANSCRIPT',
  customerAccountNumber: '10001',
  chatTranscript: [],
});

export const INVALID_INTERACTION_INFO_PAYLOAD = {
  interactionInformation: {},
};
