import Stripe from 'stripe';
import { log } from '../vite';

// Check if we have the Stripe secret key
if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('Missing required Stripe secret: STRIPE_SECRET_KEY');
}

// Initialize Stripe with the secret key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2023-10-16" as any, // Using a compatible API version
});

/**
 * Create a payment intent for a one-time payment
 * 
 * @param amount The amount to charge in dollars (will be converted to cents)
 * @param currency The currency to use (default: usd)
 * @param metadata Optional metadata to include with the payment
 * @returns The payment intent client secret
 */
export async function createPaymentIntent(
  amount: number, 
  currency: string = 'usd',
  metadata: Record<string, string> = {}
): Promise<Stripe.PaymentIntent> {
  try {
    // Convert amount from dollars to cents and ensure it's an integer
    const amountInCents = Math.round(amount * 100);
    
    // Create the payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountInCents,
      currency,
      metadata,
      // You can add additional options here like payment_method_types, etc.
    });
    
    // Return the payment intent object which includes the client secret
    return paymentIntent;
  } catch (error) {
    log(`Error creating Stripe payment intent: ${error}`, 'stripe');
    throw error;
  }
}

/**
 * Create a subscription for a user
 * 
 * @param customerId The Stripe customer ID
 * @param priceId The Stripe price ID for the subscription
 * @returns The subscription object
 */
export async function createSubscription(
  customerId: string,
  priceId: string,
  metadata: Record<string, string> = {}
): Promise<Stripe.Subscription> {
  try {
    const subscription = await stripe.subscriptions.create({
      customer: customerId,
      items: [{ price: priceId }],
      payment_behavior: 'default_incomplete',
      expand: ['latest_invoice.payment_intent'],
      metadata
    });
    
    return subscription;
  } catch (error) {
    log(`Error creating Stripe subscription: ${error}`, 'stripe');
    throw error;
  }
}

/**
 * Create a Stripe customer
 * 
 * @param email Customer email
 * @param name Optional customer name
 * @param metadata Optional metadata
 * @returns The customer object
 */
export async function createCustomer(
  email: string,
  name?: string,
  metadata?: Record<string, string>
): Promise<Stripe.Customer> {
  try {
    const customer = await stripe.customers.create({
      email,
      name,
      metadata,
    });
    
    return customer;
  } catch (error) {
    log(`Error creating Stripe customer: ${error}`, 'stripe');
    throw error;
  }
}

/**
 * Retrieve a customer by ID
 * 
 * @param customerId The Stripe customer ID
 * @returns The customer object
 */
export async function getCustomer(customerId: string): Promise<Stripe.Customer> {
  try {
    const customer = await stripe.customers.retrieve(customerId);
    if (customer.deleted) {
      throw new Error('Customer has been deleted');
    }
    return customer as Stripe.Customer;
  } catch (error) {
    log(`Error retrieving Stripe customer: ${error}`, 'stripe');
    throw error;
  }
}

/**
 * Get subscription details
 * 
 * @param subscriptionId The Stripe subscription ID
 * @returns The subscription object
 */
export async function getSubscription(subscriptionId: string): Promise<Stripe.Subscription> {
  try {
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    return subscription;
  } catch (error) {
    log(`Error retrieving Stripe subscription: ${error}`, 'stripe');
    throw error;
  }
}