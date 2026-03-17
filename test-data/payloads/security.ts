import type { TestRunPayload } from '@src/api/testrun';

const SECURITY_INTERACTION_BASE = {
  channel: 'Chat',
  authenticationStatus: 'Authenticated' as const,
  customerAccountNumber: '10001',
  queueName: 'General',
  agentDesktopStatus: 'Connected',
  startTime: '2026-03-11T10:00:00Z',
};

// TC-27: HTML/script tags in pre-loaded transcript
export const PAYLOAD_XSS_PRELOAD: TestRunPayload = {
  interactionInformation: {
    ...SECURITY_INTERACTION_BASE,
    interactionId: 'CHAT-XSS-PRELOAD',
    journeyName: 'Security Test',
  },
  chatTranscript: [
    { sender: 'Customer', timestamp: '10:00:01', message: '<script>alert("XSS from preload")</script>Malicious content' },
    { sender: 'Customer', timestamp: '10:00:02', message: '<img src=x onerror="alert(\'XSS\')">Image tag injection' },
    { sender: 'Customer', timestamp: '10:00:03', message: '<a href="javascript:alert(\'XSS\')">Click me</a>' },
  ],
};

// TC-28: XSS via live chat messages (minimal preload; XSS sent as live message in test)
export const PAYLOAD_XSS_LIVE: TestRunPayload = {
  interactionInformation: {
    ...SECURITY_INTERACTION_BASE,
    interactionId: 'CHAT-XSS-LIVE',
    journeyName: 'Security Test',
  },
  chatTranscript: [
    { sender: 'Customer', timestamp: '10:00:01', message: 'Hello' },
  ],
};

// TC-29: SQL injection patterns
export const PAYLOAD_SQL_INJECTION: TestRunPayload = {
  interactionInformation: {
    ...SECURITY_INTERACTION_BASE,
    interactionId: 'CHAT-SQL-INJECTION',
    customerAccountNumber: "10001' OR '1'='1",
    journeyName: 'Security Test',
  },
  chatTranscript: [
    { sender: 'Customer', timestamp: '10:00:01', message: "'; DROP TABLE users; --" },
  ],
};

// TC-30: Unicode and emoji handling
export const PAYLOAD_UNICODE: TestRunPayload = {
  interactionInformation: {
    ...SECURITY_INTERACTION_BASE,
    interactionId: 'CHAT-UNICODE',
    journeyName: 'Unicode Test',
  },
  chatTranscript: [
    { sender: 'Customer', timestamp: '10:00:01', message: '你好 😀 مرحبا 🎉 Здравствуй' },
    { sender: 'Customer', timestamp: '10:00:02', message: '𝕌𝕟𝕚𝕔𝕠𝕕𝕖 𝕋𝕖𝕤𝕥' },
    { sender: 'Customer', timestamp: '10:00:03', message: '™️ © ® ¯\\_(ツ)_/¯' },
  ],
};

// TC-31: Very long message with embedded XSS
export const LONG_XSS_MESSAGE = 'A'.repeat(1000) + '<script>alert("xss")</script>' + '😀'.repeat(100);

export const PAYLOAD_LONG_XSS: TestRunPayload = {
  interactionInformation: {
    ...SECURITY_INTERACTION_BASE,
    interactionId: 'CHAT-LONG-XSS',
    journeyName: 'Long Message Test',
  },
  chatTranscript: [
    { sender: 'Customer', timestamp: '10:00:01', message: LONG_XSS_MESSAGE },
  ],
};
