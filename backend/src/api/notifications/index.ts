// Import all notification API handlers

// Main notification routes
export { GET as GET_NOTIFICATIONS, POST as POST_NOTIFICATIONS } from "./route";

// Notification settings routes
export {
  GET as GET_NOTIFICATION_SETTINGS,
  PUT as PUT_NOTIFICATION_SETTINGS,
} from "./settings/route";

// Notification settings reset route
export { POST as POST_NOTIFICATION_SETTINGS_RESET } from "./settings/reset/route";

// Notification actions routes
export { POST as POST_NOTIFICATION_ACTIONS } from "./actions/route";

// Notification push routes
export {
  POST_REGISTER as POST_PUSH_REGISTER,
  POST_UNREGISTER as POST_PUSH_UNREGISTER,
  POST_TEST as POST_PUSH_TEST,
} from "./push/route";

// Notification bulk operations routes
export {
  POST_READ as POST_BULK_READ,
  POST_DELETE as POST_BULK_DELETE,
  POST_DISMISS as POST_BULK_DISMISS,
  POST_SNOOZE as POST_BULK_SNOOZE,
} from "./bulk/route";

// Notification test routes
export { POST as POST_TEST_NOTIFICATION } from "./test/route";
export { POST as POST_SEND_TEST_NOTIFICATION } from "./test/send-test-notification";

// Export the router as default
export { default } from "./router";
