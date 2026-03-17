/**
 * Wraps POST /api/testrun.
 * Call createTestRun(request, payload) to create a deterministic test run.
 * Returns { runId, createdAt, desktopPath } on success, or fails the test immediately if the response is not OK.
 */
import { APIRequestContext, expect } from '@playwright/test';
import type { TestRunPayload, TestRunResponse, TranscriptMessage, InteractionInfo } from '@src/types';

export type { TestRunPayload, TestRunResponse, TranscriptMessage, InteractionInfo };

const HTTP_TOO_MANY_REQUESTS = 429;
/** Milliseconds to wait after a 429 before retrying, giving the rate-limit window time to reset. */
const RATE_LIMIT_RETRY_DELAY_MS = 2_000;

/**
 * Sends POST /api/testrun and returns the parsed response.
 * Fails the test immediately if the response is not OK.
 * @param request - Playwright APIRequestContext, injected via test fixture
 * @param payload - Interaction information and chat transcript to seed the run
 * @returns Parsed response containing runId, createdAt, and desktopPath
 */
export async function createTestRun(
  request: APIRequestContext,
  payload: TestRunPayload,
): Promise<TestRunResponse> {
  let response = await request.post('/api/testrun', { data: payload });
  /*
   * The server enforces a rate limit on /api/testrun. When consecutive tests
   * run back-to-back and finish quickly, the next createTestRun call can arrive
   * before the rate-limit window resets, returning 429. A single 2-second wait
   * is enough for the limit to clear before retrying.
   */
  if (response.status() === HTTP_TOO_MANY_REQUESTS) {
    await new Promise((r) => setTimeout(r, RATE_LIMIT_RETRY_DELAY_MS));
    response = await request.post('/api/testrun', { data: payload });
  }
  expect(response.ok()).toBeTruthy();
  return response.json() as Promise<TestRunResponse>;
}
