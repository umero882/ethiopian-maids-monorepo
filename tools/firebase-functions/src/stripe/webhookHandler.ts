/**
 * Stripe Webhook Handler - Firebase/Hasura Only
 */

import * as functions from 'firebase-functions';
import Stripe from 'stripe';
import { GraphQLClient, gql } from 'graphql-request';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2023-10-16',
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || '';

const getHasuraClient = () => new GraphQLClient(
  process.env.HASURA_GRAPHQL_ENDPOINT || 'https://ethio-maids-01.hasura.app/v1/graphql',
  {
    headers: {
      'x-hasura-admin-secret': process.env.HASURA_ADMIN_SECRET || '',
    },
  }
);

// Note: start_date and end_date are 'date' type (YYYY-MM-DD format), amount is 'numeric'
const UPSERT_SUBSCRIPTION = gql`
  mutation UpsertSubscription(
    $userId: String!
    $stripeSubscriptionId: String!
    $stripeCustomerId: String!
    $status: String!
    $planName: String
    $planType: String
    $userType: String
    $amount: numeric
    $currency: String
    $billingPeriod: String
    $startDate: date
    $endDate: date
  ) {
    insert_subscriptions_one(
      object: {
        user_id: $userId
        stripe_subscription_id: $stripeSubscriptionId
        stripe_customer_id: $stripeCustomerId
        status: $status
        plan_name: $planName
        plan_type: $planType
        user_type: $userType
        amount: $amount
        currency: $currency
        billing_period: $billingPeriod
        start_date: $startDate
        end_date: $endDate
      }
      on_conflict: {
        constraint: idx_subscriptions_stripe_sub_id
        update_columns: [
          status
          plan_name
          plan_type
          user_type
          amount
          currency
          billing_period
          start_date
          end_date
          updated_at
        ]
      }
    ) {
      id
      user_id
      status
    }
  }
`;

const UPDATE_SUBSCRIPTION_STATUS = gql`
  mutation UpdateSubscriptionStatus($stripeSubscriptionId: String!, $status: String!) {
    update_subscriptions(
      where: { stripe_subscription_id: { _eq: $stripeSubscriptionId } }
      _set: { status: $status, updated_at: "now()" }
    ) {
      affected_rows
    }
  }
`;

const INSERT_PAYMENT = gql`
  mutation InsertPayment(
    $userId: String!
    $stripePaymentIntentId: String!
    $amount: Int!
    $currency: String!
    $status: String!
    $paymentMethod: String
  ) {
    insert_payments_one(
      object: {
        user_id: $userId
        stripe_payment_intent_id: $stripePaymentIntentId
        amount: $amount
        currency: $currency
        status: $status
        payment_method: $paymentMethod
      }
    ) {
      id
    }
  }
`;

// Get Firebase user ID from metadata
function getUserIdFromMetadata(metadata: Stripe.Metadata | null): string | null {
  if (!metadata) return null;
  return metadata.userId || metadata.firebaseUid || null;
}

export async function handleStripeWebhook(
  req: functions.https.Request,
  res: functions.Response
): Promise<void> {
  const sig = req.headers['stripe-signature'] as string;

  if (!sig) {
    console.error('Missing stripe-signature header');
    res.status(400).send('Missing stripe-signature header');
    return;
  }

  if (!webhookSecret) {
    console.error('STRIPE_WEBHOOK_SECRET not configured');
    res.status(500).send('Webhook secret not configured');
    return;
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(req.rawBody, sig, webhookSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    res.status(400).send(`Webhook Error: ${(err as Error).message}`);
    return;
  }

  console.log(`Received Stripe webhook: ${event.type}`);

  try {
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
        break;

      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
        break;

      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;

      case 'invoice.paid':
        await handleInvoicePaid(event.data.object as Stripe.Invoice);
        break;

      case 'invoice.payment_failed':
        await handleInvoicePaymentFailed(event.data.object as Stripe.Invoice);
        break;

      case 'payment_intent.succeeded':
        await handlePaymentIntentSucceeded(event.data.object as Stripe.PaymentIntent);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    res.status(200).json({ received: true });
  } catch (error) {
    // Log the error but still return 200 to acknowledge receipt
    // This prevents Stripe from retrying when the issue is on our side
    console.error('Error processing webhook:', error);
    console.error('Event type:', event.type);
    console.error('Event ID:', event.id);

    // Return 200 to acknowledge receipt - we've logged the error for debugging
    // Returning 500 causes Stripe to retry, which won't help if the error is a code/data issue
    res.status(200).json({
      received: true,
      warning: 'Event received but processing had an error - check logs'
    });
  }
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session): Promise<void> {
  console.log('Checkout completed:', session.id);
  console.log('Session mode:', session.mode);
  console.log('Session metadata:', JSON.stringify(session.metadata));

  const userId = getUserIdFromMetadata(session.metadata);

  if (!userId) {
    console.log('No userId in session metadata, checking customer...');
    if (session.customer) {
      try {
        const customer = await stripe.customers.retrieve(session.customer as string);
        if (customer && !customer.deleted) {
          const customerUserId = getUserIdFromMetadata(customer.metadata);
          if (customerUserId) {
            console.log(`Found userId ${customerUserId} from customer`);
          }
        }
      } catch (e) {
        console.error('Error fetching customer:', e);
      }
    }
    return;
  }

  // If this was a subscription checkout, sync the subscription
  if (session.mode === 'subscription' && session.subscription) {
    console.log(`Subscription checkout completed for user ${userId}, subscription: ${session.subscription}`);
    try {
      const subscription = await stripe.subscriptions.retrieve(session.subscription as string);
      await syncSubscription(subscription, userId);
    } catch (e) {
      console.error('Error syncing subscription from checkout:', e);
    }
  }

  console.log(`Checkout completed for user ${userId}`);
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription): Promise<void> {
  console.log('Subscription updated:', subscription.id);
  console.log('Subscription metadata:', JSON.stringify(subscription.metadata));

  const userId = getUserIdFromMetadata(subscription.metadata);

  if (!userId) {
    console.error('No userId in subscription metadata');
    // Try to get userId from customer metadata
    try {
      const customer = await stripe.customers.retrieve(subscription.customer as string);
      if (customer && !customer.deleted) {
        const customerUserId = getUserIdFromMetadata(customer.metadata);
        if (customerUserId) {
          console.log(`Found userId ${customerUserId} from customer metadata`);
          await syncSubscription(subscription, customerUserId);
          return;
        }
      }
    } catch (e) {
      console.error('Error fetching customer:', e);
    }
    return;
  }

  await syncSubscription(subscription, userId);
}

async function syncSubscription(subscription: Stripe.Subscription, userId: string): Promise<void> {
  const hasuraClient = getHasuraClient();

  const priceId = subscription.items.data[0]?.price.id;
  const amount = subscription.items.data[0]?.price.unit_amount || 0;
  const currency = subscription.items.data[0]?.price.currency || 'aed';
  const interval = subscription.items.data[0]?.price.recurring?.interval || 'month';

  // Get plan details from metadata
  const planName = subscription.metadata?.planName || subscription.metadata?.plan_tier || priceId;
  const userType = subscription.metadata?.userType || subscription.metadata?.user_type || null;
  const planTier = subscription.metadata?.planTier || subscription.metadata?.plan_tier || null;

  // Determine plan_type from planTier or price ID
  let planType = planTier || 'subscription';
  if (!planTier && priceId) {
    // Try to infer plan type from price ID
    if (priceId.includes('premium')) planType = 'premium';
    else if (priceId.includes('pro')) planType = 'pro';
    else if (priceId.includes('basic')) planType = 'basic';
  }

  // Format date as YYYY-MM-DD for GraphQL 'date' type
  const formatDate = (timestamp: number): string => {
    return new Date(timestamp * 1000).toISOString().split('T')[0];
  };

  console.log(`Syncing subscription for user ${userId}:`, {
    subscriptionId: subscription.id,
    planName,
    planType,
    userType,
    status: subscription.status,
  });

  try {
    await hasuraClient.request(UPSERT_SUBSCRIPTION, {
      userId,
      stripeSubscriptionId: subscription.id,
      stripeCustomerId: subscription.customer as string,
      status: subscription.status,
      planName,
      planType,
      userType,
      amount,
      currency,
      billingPeriod: interval,
      startDate: formatDate(subscription.current_period_start),
      endDate: formatDate(subscription.current_period_end),
    });

    console.log(`Subscription ${subscription.id} synced for user ${userId}, status: ${subscription.status}`);
  } catch (error: unknown) {
    // Log the error with details but don't throw - we want to acknowledge receipt
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('Error syncing subscription to Hasura:', {
      error: errorMessage,
      subscriptionId: subscription.id,
      userId,
      status: subscription.status,
    });
    // Don't throw - we want to acknowledge the webhook was received
  }
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription): Promise<void> {
  console.log('Subscription deleted:', subscription.id);

  const hasuraClient = getHasuraClient();

  try {
    await hasuraClient.request(UPDATE_SUBSCRIPTION_STATUS, {
      stripeSubscriptionId: subscription.id,
      status: 'canceled',
    });

    console.log(`Subscription ${subscription.id} marked as canceled`);
  } catch (error: unknown) {
    // Log the error but don't throw - we want to acknowledge receipt
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('Error updating subscription status:', {
      error: errorMessage,
      subscriptionId: subscription.id,
    });
    // Don't throw - we want to acknowledge the webhook was received
  }
}

async function handleInvoicePaid(invoice: Stripe.Invoice): Promise<void> {
  console.log('Invoice paid:', invoice.id);

  if (invoice.subscription) {
    try {
      const subscription = await stripe.subscriptions.retrieve(invoice.subscription as string);
      const userId = getUserIdFromMetadata(subscription.metadata);
      if (userId) {
        await syncSubscription(subscription, userId);
        console.log(`Refreshed subscription ${subscription.id} after invoice paid`);
      }
    } catch (e) {
      console.error('Error refreshing subscription after invoice paid:', e);
    }
  }
}

async function handleInvoicePaymentFailed(invoice: Stripe.Invoice): Promise<void> {
  console.log('Invoice payment failed:', invoice.id);
}

async function handlePaymentIntentSucceeded(paymentIntent: Stripe.PaymentIntent): Promise<void> {
  console.log('PaymentIntent succeeded:', paymentIntent.id);
  console.log('PaymentIntent metadata:', JSON.stringify(paymentIntent.metadata));

  const userId = getUserIdFromMetadata(paymentIntent.metadata);

  if (!userId) {
    console.log('No userId in payment intent metadata - Payment Link without user context');
    return;
  }

  const hasuraClient = getHasuraClient();

  try {
    await hasuraClient.request(INSERT_PAYMENT, {
      userId,
      stripePaymentIntentId: paymentIntent.id,
      amount: paymentIntent.amount,
      currency: paymentIntent.currency,
      status: 'succeeded',
      paymentMethod: paymentIntent.payment_method_types[0] || 'card',
    });

    console.log(`Payment ${paymentIntent.id} recorded for user ${userId}`);
  } catch (error) {
    console.error('Error recording payment:', error);
  }
}
