// Product analytics for the AI chat surfaces.
//
// Events never carry message text, prompts, AI responses, or raw error
// messages. They only carry enums, booleans, and timings, so they are safe to
// send whenever the user has allowed analytics. posthog-js drops them while
// capturing is opted out.
//
// Event taxonomy:
// - ai_message_sent        The user sent a message to the AI.
// - ai_response_received   The AI returned a response (chat, action, or confirmation request).
// - ai_response_failed     The request failed or the AI returned an error.
// - ai_action_completed    An AI action finished. `outcome` is success, failure, or cancelled.
// - ai_feedback_submitted  The user rated an AI response (thumbs up or thumbs down).

import posthog from "posthog-js";

export type AIChatSurface =
  | "ai_page"
  | "dashboard_drawer"
  | "editor_panel"
  | "editor_suggestion";

// "action" goes through the AI action service. "chat" and "synthesis" are the
// editor panel's direct chat and synthesis endpoints.
export type AIRequestType = "action" | "chat" | "synthesis";

export type AIActionOutcome = "success" | "failure" | "cancelled";

export function trackAIMessageSent(props: {
  surface: AIChatSurface;
  request_type: AIRequestType;
  chat_mode?: string;
}) {
  posthog.capture("ai_message_sent", props);
}

export function trackAIResponseReceived(props: {
  surface: AIChatSurface;
  request_type: AIRequestType;
  response_type?: string;
  action_type?: string;
  latency_ms: number;
}) {
  posthog.capture("ai_response_received", props);
}

export function trackAIResponseFailed(props: {
  surface: AIChatSurface;
  request_type: AIRequestType;
  latency_ms: number;
}) {
  posthog.capture("ai_response_failed", props);
}

export function trackAIActionCompleted(props: {
  surface: AIChatSurface;
  action_type?: string;
  outcome: AIActionOutcome;
  required_confirmation: boolean;
}) {
  posthog.capture("ai_action_completed", props);
}

export function trackAIFeedbackSubmitted(props: {
  surface: AIChatSurface;
  is_helpful: boolean;
  has_comment: boolean;
  ai_action?: string;
}) {
  posthog.capture("ai_feedback_submitted", props);
}
