import { Request, Response } from "express";
import Stripe from "stripe";
import { Resend } from "resend";
import { prisma } from "../config/db.js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string);
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET as string;
const resend = new Resend(process.env.RESEND_API_KEY as string);

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
      const treeCount = await getTreeCountFromSession(session.id);
      await incrementActiveCyclePaidCount(treeCount);
      const email = session.customer_details?.email;
      const name = session.customer_details?.name;
      if (email) {
        await sendPaymentConfirmationEmail(email, name, treeCount);
      }
    }
  }

  res.json({ received: true });
}

async function getTreeCountFromSession(sessionId: string): Promise<number> {
  const lineItems = await stripe.checkout.sessions.listLineItems(sessionId, {
    expand: ["data.price.product"],
  });

  let totalTrees = 0;
  for (const item of lineItems.data) {
    const product = item.price?.product as Stripe.Product;
    const treeCount = parseInt(product.metadata.tree_count || "1", 10);
    totalTrees += treeCount * (item.quantity ?? 1);
  }

  return totalTrees;
}

async function sendPaymentConfirmationEmail(email: string, name: string | null | undefined, treeCount: number) {
  const treePlural = treeCount === 1 ? "tree" : "trees";
  await resend.emails.send({
    from: "TagaTree <noreply@mail.tagatree.com>",
    to: email,
    subject: "Payment Confirmed",
    html: `
      <h2>Thank you${name ? `, ${name}` : ""}!</h2>
      <p>Your payment has been confirmed. You've adopted ${treeCount} ${treePlural}. Welcome to TagaTree.</p>
    `,
  });
}

async function incrementActiveCyclePaidCount(treeCount: number) {
  const activeCycle = await prisma.cycle.findFirst({ where: { active: true } });
  if (!activeCycle) {
    console.warn("Stripe webhook: no active cycle found, skipping paidCount update");
    return;
  }
  await prisma.cycle.update({
    where: { id: activeCycle.id },
    data: { paidCount: { increment: treeCount } },
  });
}
