import { Router } from "express";
import feedbackRouter from "./route";

const router: Router = Router();

// Mount the feedback routes
router.use("/", feedbackRouter);

export default router;
