import { Router } from "express";
import * as hybridRoute from "./hybrid-route";
import * as sendOtpRoute from "./send-otp";
import * as verifyOtpRoute from "./verify-otp";
import * as mfaRoute from "./mfa";
import { authenticateExpressRequest } from "../../middleware/auth";

const router: Router = Router();

// Hybrid auth routes
router.post("/hybrid/signup", hybridRoute.POST);
router.put("/hybrid/signin", hybridRoute.PUT_SIGNIN);
router.post("/hybrid/send-otp", sendOtpRoute.POST);
router.post("/hybrid/verify-otp", verifyOtpRoute.POST);
router.post("/hybrid/complete-signup", hybridRoute.POST_COMPLETE_SIGNUP);
router.post("/hybrid/check-email", hybridRoute.POST_CHECK_EMAIL);
router.post("/hybrid/oauth-signup", hybridRoute.POST_OAUTH_SIGNUP);

// Get current user (requires authentication)
router.get("/me", authenticateExpressRequest, hybridRoute.GET_ME);

// MFA routes
router.post("/mfa/enroll", mfaRoute.POST_ENROLL);
router.post("/mfa/verify", mfaRoute.POST_VERIFY);
router.post("/mfa/unenroll", mfaRoute.POST_UNENROLL);
router.get("/mfa/factors", mfaRoute.GET_FACTORS);
router.post("/mfa/challenge", mfaRoute.POST_CHALLENGE);

export default router;
