import type { TranscriptMessage } from '../../src/api/testrun';

export const HAPPY_PATH_TRANSCRIPT: TranscriptMessage[] = [
  { sender: 'Customer', timestamp: '14:31:01', message: 'I was charged twice this month.' },
  { sender: 'Bot', timestamp: '14:31:09', message: 'I can help with billing issues.' },
  { sender: 'System', timestamp: '14:31:50', message: 'Handoff to Billing Tier 1' },
];
