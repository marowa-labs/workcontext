import { Router } from "express";
import {
  UPLOAD_PDF,
  CHAT_PDF,
  GET_PDFS,
  GET_PDF,
  GET_PDF_DOWNLOAD,
  GET_PDF_RELATED,
} from "./route";
import multer from "multer";
import { authenticateExpressRequest } from "../../middleware/auth";

const router = Router();
const upload = multer(); // Memory storage by default

// Apply auth middleware to all routes or specific ones?
// UPLOAD_PDF handles its own fallback, but ideally we want auth.
// Let's apply it to GET routes for sure.

// GET /api/pdf - List PDFs
router.get("/", authenticateExpressRequest, GET_PDFS);

// GET /api/pdf/:id - Get single PDF
router.get("/:id", authenticateExpressRequest, GET_PDF);

// POST /api/pdf/upload
// Note: We might want to add authMiddleware here too if we remove the fallback logic later.
// For now, allow fallback logic inside UPLOAD_PDF to run if middleware is skipped?
// But authenticateExpressRequest blocks if no token.
// If valid dev env, we might want to skip it?
// Let's try adding it. It safer.
router.post(
  "/upload",
  authenticateExpressRequest,
  upload.single("file"),
  UPLOAD_PDF,
);

// POST /api/pdf/chat
router.post("/chat", authenticateExpressRequest, CHAT_PDF);

// GET /api/pdf/:id/download
router.get("/:id/download", authenticateExpressRequest, GET_PDF_DOWNLOAD);

// GET /api/pdf/:id/related
// @ts-ignore
router.get("/:id/related", authenticateExpressRequest, GET_PDF_RELATED);

export default router;
