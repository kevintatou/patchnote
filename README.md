# diff-explainer

Micro app: paste a git diff and get a calm, file-grouped summary of changes.

## Local Dev

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Environment Variables

Required:
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `STRIPE_PRICE_ID`
- `MINTER_API_URL`
- `MINTER_API_TOKEN`
- `NEXT_PUBLIC_APP_URL`

Optional:
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` (only needed if you switch to Stripe.js)

## Stripe Webhook Testing (Stripe CLI)

```bash
stripe login
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

Then trigger a test event:

```bash
stripe trigger checkout.session.completed
```

Set `STRIPE_WEBHOOK_SECRET` to the signing secret printed by `stripe listen`.

## Notes

- No database. Entitlement is fetched from the minter on-demand.
- Pro unlock is stored in `localStorage` using the license key.
