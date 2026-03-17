import type { TestRunPayload } from '../../src/api/testrun';
import { UNAUTHENTICATED_TRANSCRIPT } from '../transcripts/unauthenticated';

export const PAYLOAD_UNAUTHENTICATED: TestRunPayload = {
  interactionInformation: {
    interactionId: 'CHAT-10002',
    channel: 'Chat',
    authenticationStatus: 'Not Authenticated',
    customerAccountNumber: '',
    journeyName: 'General Account Inquiry',
    queueName: 'Frontline Support',
    agentDesktopStatus: 'Connected',
    startTime: '2026-03-11T11:05:00Z',
  },
  chatTranscript: UNAUTHENTICATED_TRANSCRIPT,
};
