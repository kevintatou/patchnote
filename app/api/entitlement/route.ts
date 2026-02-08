import { NextResponse } from "next/server";
import { callMinter } from "../../../lib/minter";
import { getStripe } from "../../../lib/stripe";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const sessionId = searchParams.get("session_id");

  if (!sessionId) {
    return NextResponse.json({ error: "Missing session_id" }, { status: 400 });
  }

  try {
    const stripe = getStripe();
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ["customer_details"]
    });

    const email = session.customer_details?.email ?? session.customer_email ?? null;

    const minterResponse = (await callMinter({
      email,
      stripeSessionId: sessionId,
      product: "diff-explainer-pro"
    })) as { licenseKey?: string; entitlementId?: string };

    return NextResponse.json({
      licenseKey: minterResponse.licenseKey ?? minterResponse.entitlementId ?? null
    });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch entitlement" }, { status: 500 });
  }
}
