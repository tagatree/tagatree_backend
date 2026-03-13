import { Request, Response } from "express";
import Stripe from "stripe";
import { prisma } from "../config/db.js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string);
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET as string;

export async function handleStripeWebhook(req: Request, res: Response) {
  const sig = req.headers["stripe-signature"] as string;

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(req.body as Buffer, sig, webhookSecret);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("Stripe webhook signature verification failed:", message);
    res.status(400).send(`Webhook Error: ${message}`);
    return;
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    if (session.payment_status === "paid") {
      await incrementActiveCyclePaidCount();
    }
  }

  res.json({ received: true });
}

async function incrementActiveCyclePaidCount() {
  const activeCycle = await prisma.cycle.findFirst({ where: { active: true } });
  if (!activeCycle) {
    console.warn("Stripe webhook: no active cycle found, skipping paidCount update");
    return;
  }
  await prisma.cycle.update({
    where: { id: activeCycle.id },
    data: { paidCount: { increment: 1 } },
  });
}
