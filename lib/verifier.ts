type MinterPayload = {
  email: string | null;
  stripeSessionId: string;
  product: string;
};

export async function callVerifier(payload: MinterPayload) {
  const verifierUrl = process.env.VERIFIER_API_URL;

  if (!verifierUrl) {
    throw new Error("Missing VERIFIER_API_URL");
  }

  const response = await fetch(verifierUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(`Minter error: ${message}`);
  }

  return response.json();
}
