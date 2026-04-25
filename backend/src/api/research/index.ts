import { Router } from "express";
import {
  SEARCH_PAPERS,
  GET_PAPER_DETAILS,
  SAVE_TO_LIBRARY,
  GET_LIBRARY,
  DELETE_FROM_LIBRARY,
} from "./route";
import { GET_GRAPH } from "./graph-route";
import {
  POST_CHAT,
  GET_CHAT_HISTORY,
  GET_CHAT_SESSIONS,
  GET_CHAT_SESSION,
  POST_SUMMARIZE,
} from "./chat-route";
import { authenticateExpressRequest } from "../../middleware/auth";

import { ANALYZE_PAPERS } from "./analyze-route";
import { GET_CONSENSUS } from "./consensus-route";
import { GET_CONCEPT_MAP } from "./concept-map-route";
import { GENERATE_STUDIO_ITEM } from "./studio-route";
import guideRouter from "./guide-route";
import {
  GET_NOTES,
  CREATE_NOTE,
  UPDATE_NOTE,
  DELETE_NOTE,
} from "./notes-route";
import languageCheckRouter from "./languageCheck";

const router = Router();

// Public Routes
router.use("/", guideRouter); // Mount guide routes
router.get("/search", SEARCH_PAPERS); // Public search
router.post("/analyze", ANALYZE_PAPERS); // Public analysis (quota managed by API key limits)
router.post("/consensus", GET_CONSENSUS); // Consensus analysis
router.post("/map", GET_CONCEPT_MAP); // Concept Map Generation
router.post("/studio", GENERATE_STUDIO_ITEM); // Studio Item Generation

// Protected Routes
router.get(
  "/chat/sessions/:projectId",
  authenticateExpressRequest,
  GET_CHAT_SESSIONS,
);
router.get(
  "/chat/session/:sessionId",
  authenticateExpressRequest,
  GET_CHAT_SESSION,
);
router.get("/chat/:projectId", authenticateExpressRequest, GET_CHAT_HISTORY);
router.post("/chat", authenticateExpressRequest, POST_CHAT);
router.post("/summarize", authenticateExpressRequest, POST_SUMMARIZE);
router.use("/language-check", languageCheckRouter);
router.get("/graph", authenticateExpressRequest, GET_GRAPH);
router.get("/library", authenticateExpressRequest, GET_LIBRARY);
router.post("/library/save", authenticateExpressRequest, SAVE_TO_LIBRARY);
router.delete(
  "/library/:paperId",
  authenticateExpressRequest,
  DELETE_FROM_LIBRARY,
);

// Notes Routes
router.get("/notes", authenticateExpressRequest, GET_NOTES);
router.post("/notes", authenticateExpressRequest, CREATE_NOTE);
router.put("/notes/:id", authenticateExpressRequest, UPDATE_NOTE);
router.delete("/notes/:id", authenticateExpressRequest, DELETE_NOTE);

// Specific routes must come before parameterized routes
router.get("/:paperId", GET_PAPER_DETAILS); // Public details

export default router;
