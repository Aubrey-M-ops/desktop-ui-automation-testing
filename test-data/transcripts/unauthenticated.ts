import type { TranscriptMessage } from '../../src/api/testrun';

export const UNAUTHENTICATED_TRANSCRIPT: TranscriptMessage[] = [
  {
    sender: 'Customer',
    timestamp: '11:05:02',
    message: 'I want to check my current balance but I have not verified yet.',
  },
  {
    sender: 'Bot',
    timestamp: '11:05:12',
    message: 'Please complete authentication to access your account profile.',
  },
  {
    sender: 'System',
    timestamp: '11:05:38',
    message: 'Customer profile remains hidden until verified.',
  },
];
