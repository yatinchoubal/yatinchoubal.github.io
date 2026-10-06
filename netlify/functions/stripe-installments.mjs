// OPTIONAL. Stripe webhook that limits an installment plan to a fixed number of payments.
//
// Problem: a Stripe Payment Link in subscription mode bills every month until it is canceled.
// For "3 payments of $333" the subscription must stop after the 3rd payment.
// This function receives `checkout.session.completed`, converts the new subscription into a
// subscription schedule with `iterations = N` and `end_behavior = cancel`, so billing stops automatically.
//
// The number of payments comes from metadata `installment_count` on the recurring Price
// (Dashboard > Product catalog > price > Metadata), or from subscription metadata.
//
// STATUS: written against Stripe's documented REST API, but NOT yet tested against a Stripe account.
// Test it in Stripe test mode first (docs/INTEGRATIONS.md). Without it, add a schedule manually
// in the Dashboard after each installment purchase.
//
// Environment variables (Netlify > Site configuration > Environment variables):
//   STRIPE_SECRET_KEY      restricted key with write access to Subscriptions and Subscription schedules
//   STRIPE_WEBHOOK_SECRET  signing secret (whsec_...) for this endpoint
//
// Endpoint URL: https://YOUR-DOMAIN/.netlify/functions/stripe-installments
import { createHmac, timingSafeEqual } from 'node:crypto';

const TOLERANCE_SECONDS = 300;

function verifySignature(rawBody, header, secret) {
  if (!header || !secret) return false;
  const parts = Object.fromEntries(
    header.split(',').map((kv) => {
      const i = kv.indexOf('=');
      return [kv.slice(0, i), kv.slice(i + 1)];
    }),
  );
  const timestamp = Number(parts.t);
  if (!timestamp || Math.abs(Date.now() / 1000 - timestamp) > TOLERANCE_SECONDS) return false;
  const expected = createHmac('sha256', secret).update(`${timestamp}.${rawBody}`).digest();
  // Stripe can send more than one v1 signature during secret rotation.
  return header
    .split(',')
    .filter((kv) => kv.startsWith('v1='))
    .some((kv) => {
      const sig = Buffer.from(kv.slice(3), 'hex');
      return sig.length === expected.length && timingSafeEqual(sig, expected);
    });
}

async function stripe(path, { method = 'GET', body } = {}) {
  const res = await fetch(`https://api.stripe.com/v1/${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${process.env.STRIPE_SECRET_KEY}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: body ? new URLSearchParams(body).toString() : undefined,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(`Stripe ${method} ${path} failed: ${data?.error?.message ?? res.status}`);
  return data;
}

export default async (req) => {
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 });

  const rawBody = await req.text();
  if (!verifySignature(rawBody, req.headers.get('stripe-signature'), process.env.STRIPE_WEBHOOK_SECRET)) {
    return new Response('Invalid signature', { status: 400 });
  }

  const event = JSON.parse(rawBody);
  if (event.type !== 'checkout.session.completed') return new Response('Ignored', { status: 200 });

  const session = event.data.object;
  if (session.mode !== 'subscription' || !session.subscription) return new Response('Not a subscription', { status: 200 });

  try {
    const sub = await stripe(`subscriptions/${session.subscription}`);
    if (sub.schedule) return new Response('Already scheduled', { status: 200 }); // retried event

    const item = sub.items.data[0];
    const count = Number(sub.metadata?.installment_count || item.price.metadata?.installment_count);
    if (!Number.isInteger(count) || count < 2) {
      // Not an installment plan, or metadata missing. Leave it alone; the owner must handle it manually.
      console.warn(`stripe-installments: no valid installment_count for ${sub.id}`);
      return new Response('No installment_count', { status: 200 });
    }

    const schedule = await stripe('subscription_schedules', { method: 'POST', body: { from_subscription: sub.id } });
    const phase = schedule.phases[0];
    await stripe(`subscription_schedules/${schedule.id}`, {
      method: 'POST',
      body: {
        end_behavior: 'cancel',
        'phases[0][start_date]': String(phase.start_date),
        'phases[0][items][0][price]': item.price.id,
        'phases[0][items][0][quantity]': String(item.quantity ?? 1),
        'phases[0][iterations]': String(count),
        'metadata[order_ref]': session.client_reference_id ?? '',
      },
    });
    return new Response('Scheduled', { status: 200 });
  } catch (err) {
    console.error('stripe-installments:', err.message);
    // 500 makes Stripe retry the webhook.
    return new Response('Error', { status: 500 });
  }
};
