import type { TestRunPayload } from '../../src/api/testrun';
import { LARGE_CONVERSATION_TRANSCRIPT } from '../transcripts/large-conversation';

export const PAYLOAD_LARGE_CONVERSATION: TestRunPayload = {
  interactionInformation: {
    interactionId: 'CHAT-BADGE-TEST',
    channel: 'Chat',
    authenticationStatus: 'Authenticated',
    customerAccountNumber: '10001',
    journeyName: 'Billing Support',
    queueName: 'Billing Tier 1',
    agentDesktopStatus: 'Connected',
    startTime: '2026-03-11T10:30:00Z',
  },
  chatTranscript: LARGE_CONVERSATION_TRANSCRIPT,
};
