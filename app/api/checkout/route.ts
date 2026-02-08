import { NextResponse } from "next/server";
import { getAppUrl, getStripe } from "../../../lib/stripe";

export const runtime = "nodejs";

export async function POST() {
  const priceId = process.env.STRIPE_PRICE_ID;
  if (!priceId) {
    return NextResponse.json({ error: "Missing STRIPE_PRICE_ID" }, { status: 500 });
  }

  const stripe = getStripe();
  const appUrl = getAppUrl();

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${appUrl}/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${appUrl}/?canceled=1`,
    metadata: {
      product: "patchnote-pro"
    }
  });

  return NextResponse.json({ id: session.id, url: session.url });
}
