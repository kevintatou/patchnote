type MinterPayload = {
  email: string | null;
  stripeSessionId: string;
  product: string;
};

export async function callMinter(payload: MinterPayload) {
  const minterUrl = process.env.MINTER_API_URL;
  const minterToken = process.env.MINTER_API_TOKEN;

  if (!minterUrl || !minterToken) {
    throw new Error("Missing MINTER_API_URL or MINTER_API_TOKEN");
  }

  // TODO: Confirm exact Scrubby/minter headers and payload shape.
  const response = await fetch(minterUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${minterToken}`
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(`Minter error: ${message}`);
  }

  return response.json();
}
