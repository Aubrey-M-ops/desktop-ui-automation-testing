/**
 * Shared domain types used across the API layer, Page Objects, and test fixtures.
 */

// ── API request / response types ─────────────────────────────────────────────

/** Shape of a single chat message (sender / timestamp / message) */
export interface TranscriptMessage {
  /** Who sent this message. */
  sender: 'Customer' | 'Bot' | 'System';
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
  authenticationStatus: 'Authenticated' | 'Not Authenticated';
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
  /** Current agent desktop connection state, e.g. "Connected". */
  agentDesktopStatus: string;
  /** ISO 8601 timestamp when the interaction started, e.g. "2026-03-11T10:30:00Z". */
  startTime: string;
}

/** Request body type (interaction info + chat transcript) */
export interface TestRunPayload {
  /** Interaction metadata shown in the Interaction Information panel. */
  interactionInformation: InteractionInfo;
  /** Pre-existing conversation history to display after chat acceptance. */
  chatTranscript: TranscriptMessage[];
}

/** Successful response from POST /api/testrun */
export interface TestRunResponse {
  /** Unique identifier for this test run; used to construct the desktop URL. */
  runId: string;
  /** ISO 8601 timestamp when this run was created by the backend. */
  createdAt: string;
  /** Relative path to the desktop page for this run, e.g. "/desktop/abc-123". */
  desktopPath: string;
}

// ── Page Object types ─────────────────────────────────────────────────────────

/** A single row read from the chat transcript panel. */
export interface TranscriptEntry {
  /** Display name of the message sender, e.g. "Agent", "Customer", "System". */
  sender: string;
  /** Timestamp shown next to the message, e.g. "14:31:01". */
  timestamp: string;
  /** Raw text content of the message. */
  message: string;
}

/** Scalar fields and transaction rows read from the Customer Profile panel. */
export interface ProfileInfo {
  /** Full name of the customer, e.g. "Olivia Carter". */
  customerName: string;
  /** Loyalty or service tier, e.g. "Gold". */
  customerTier: string;
  /** Current account standing, e.g. "Active". */
  accountStatus: string;
  /** Date of the most recent payment, e.g. "2026-02-15". */
  lastPaymentDate: string;
  /** Customer's preferred contact language, e.g. "English". */
  preferredLanguage: string;
  /** Transaction history rows rendered in the profile panel. */
  recentTransactions: Array<{
    /** Transaction date. */
    date: string;
    /** Short description of the transaction. */
    description: string;
    /** Transaction amount as a formatted string, e.g. "$120.00". */
    amount: string;
  }>;
}
