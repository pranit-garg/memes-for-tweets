import Stripe from 'stripe';

let stripeInstance: Stripe | null = null;

function getStripe(): Stripe {
  if (!stripeInstance) {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error('STRIPE_SECRET_KEY is not set');
    }
    stripeInstance = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2025-12-15.clover',
    });
  }
  return stripeInstance;
}

export async function createCheckoutSession(
  email: string,
  origin: string
): Promise<string> {
  const priceId = process.env.STRIPE_PRICE_ID;

  if (!priceId) {
    throw new Error('STRIPE_PRICE_ID is not set');
  }

  const session = await getStripe().checkout.sessions.create({
    mode: 'subscription',
    payment_method_types: ['card'],
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    customer_email: email,
    success_url: `${origin}/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}/upgrade`,
    metadata: {
      source: 'memes-for-tweets',
    },
  });

  if (!session.url) {
    throw new Error('Failed to create checkout session');
  }

  return session.url;
}

export async function getSubscriptionStatus(
  sessionId: string
): Promise<{ active: boolean; email: string | null }> {
  const session = await getStripe().checkout.sessions.retrieve(sessionId);

  if (session.payment_status === 'paid' && session.subscription) {
    const subscription = await getStripe().subscriptions.retrieve(
      session.subscription as string
    );

    return {
      active: subscription.status === 'active',
      email: session.customer_email,
    };
  }

  return { active: false, email: null };
}

export function constructWebhookEvent(
  payload: string | Buffer,
  signature: string
): Stripe.Event {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    throw new Error('STRIPE_WEBHOOK_SECRET is not set');
  }

  return getStripe().webhooks.constructEvent(payload, signature, webhookSecret);
}
