import type { TestRunPayload } from '../../src/api/testrun';
import { HAPPY_PATH_TRANSCRIPT } from '../transcripts/happy-path';

export const PAYLOAD_HAPPY_PATH: TestRunPayload = {
  interactionInformation: {
    interactionId: 'CHAT-10001',
    channel: 'Chat',
    authenticationStatus: 'Authenticated',
    customerAccountNumber: '10001',
    journeyName: 'Billing Support',
    queueName: 'Billing Tier 1',
    agentDesktopStatus: 'Connected',
    startTime: '2026-03-11T10:30:00Z',
  },
  chatTranscript: HAPPY_PATH_TRANSCRIPT,
};
