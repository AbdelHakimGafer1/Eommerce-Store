import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import { checkoutSuccess, createCheckoutSession } from "../controllers/payment.controller.js";

const router = express.Router();

router.post("/payments/create-checkout-session", protectRoute, createCheckoutSession);
router.post("/payments/checkout-success", protectRoute, checkoutSuccess);

export default router;
