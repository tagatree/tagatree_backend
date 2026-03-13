import express, { Router } from "express";
import { handleStripeWebhook } from "../controllers/webhook.controller.js";

const router = Router();

// Raw body required for Stripe signature verification
router.post("/stripe", express.raw({ type: "application/json" }), handleStripeWebhook);

export default router;
