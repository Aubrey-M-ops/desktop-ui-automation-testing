/**
 * Wraps POST /api/testrun.
 * Call createTestRun(request, payload) to create a deterministic test run.
 * Returns { runId, createdAt, desktopPath } on success, or fails the test immediately if the response is not OK.
 */
import { APIRequestContext, expect } from "@playwright/test";

/** Shape of a single chat message (sender / timestamp / message) */
export interface TranscriptMessage {
  /** Who sent this message. */
  sender: "Customer" | "Bot" | "System";
  /** Display time shown in the chat window, e.g. "14:31:01". */
  timestamp: string;
  /** The raw text content of the message. */
  message: string;
}

/** Interaction metadata submitted in the payload and displayed on the desktop. */
export interface InteractionInfo {
  /** Unique identifier for this chat interaction, e.g. "CHAT-10001". */
  interactionId: string;
  /** Communication channel, e.g. "Chat". */
  channel: string;
  /**
   * Whether the customer has been verified.
   * Use "Authenticated" to trigger automatic profile resolution;
   * "Not Authenticated" renders a profile placeholder instead.
   */
  authenticationStatus: "Authenticated" | "Not Authenticated";
  /**
   * Sample account number used to resolve the customer profile.
   * Must be in the range 10001–10050 for authenticated runs.
   * Leave empty string for unauthenticated runs.
   */
  customerAccountNumber: string;
  /** Name of the customer journey that routed this interaction, e.g. "Billing Support". */
  journeyName: string;
  /** Name of the queue the interaction was assigned to, e.g. "Billing Tier 1". */
  queueName: string;
  //TODO: any enum for connection state?
  /** Current agent desktop connection state, e.g. "Connected". */
  agentDesktopStatus: string;
  /** ISO 8601 timestamp when the interaction started, e.g. "2026-03-11T10:30:00Z". */
  startTime: string;
}

/** Request body type (interaction info + chat transcript) */
export interface TestRunPayload {
  interactionInformation: InteractionInfo;
  /** Pre-existing conversation history to display after chat acceptance. */
  chatTranscript: TranscriptMessage[];
}

/** successful response type (runId / createdAt / desktopPath) */
export interface TestRunResponse {
  /** Unique identifier for this test run; used to construct the desktop URL. */
  runId: string;
  /** ISO 8601 timestamp when this run was created by the backend. */
  createdAt: string;
  /** Relative path to the desktop page for this run, e.g. "/desktop/abc-123". */
  desktopPath: string;
}

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
  let response = await request.post("/api/testrun", { data: payload });
  /*
   * The server enforces a rate limit on /api/testrun. When consecutive tests
   * run back-to-back and finish quickly, the next createTestRun call can arrive
   * before the rate-limit window resets, returning 429. A single 2-second wait
   * is enough for the limit to clear before retrying.
   */
  if (response.status() === 429) {
    await new Promise((r) => setTimeout(r, 2000));
    response = await request.post("/api/testrun", { data: payload });
  }
  expect(response.ok()).toBeTruthy();
  return response.json() as Promise<TestRunResponse>;
}
