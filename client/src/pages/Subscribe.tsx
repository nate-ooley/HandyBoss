import { useEffect, useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { apiRequest } from '@/lib/queryClient';
import { Button } from '@/components/ui/button';
import BossManCharacter from "./BossManCharacter"';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';

// Load Stripe outside of a component to avoid recreating the Stripe object
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

// Subscription plans
interface Plan {
  id: string;
  name: string;
  description: string;
  price: number | 'Free';
  interval: 'month' | 'year' | null;
  features: string[];
  limitations?: string[];
  recommended?: boolean;
  priceId: string; // Stripe Price ID (empty for free plan)
}

const plans: Plan[] = [
  {
    id: 'free',
    name: 'Free Plan',
    description: 'Try out basic features with limitations',
    price: 'Free',
    interval: null,
    features: [
      'Up to 3 team members',
      'Basic job scheduling',
      'Simple voice commands',
      'Limited English-Spanish translations'
    ],
    limitations: [
      'Limited to 50 messages per month',
      'Only 1 jobsite at a time',
      'No weather alerts',
      'No premium features'
    ],
    priceId: '' // No price ID for free plan
  },
  {
    id: 'basic',
    name: 'Basic Plan',
    description: 'For small teams or individual contractors',
    price: 29.99,
    interval: 'month',
    features: [
      'Up to 5 team members',
      'Unlimited messages',
      'Basic job scheduling',
      'Voice commands',
      'English-Spanish translations',
      'Standard customer support',
      'Up to 3 jobsites'
    ],
    priceId: 'price_1Og8f8JMYTj8PK3rQKfYhLW2' // Replace with your actual Stripe Price ID
  },
  {
    id: 'pro',
    name: 'Pro Plan',
    description: 'For established contractors with growing teams',
    price: 49.99,
    interval: 'month',
    recommended: true,
    features: [
      'Up to 15 team members',
      'Unlimited messages',
      'Advanced scheduling and reporting',
      'Enhanced voice translation',
      'Multiple job sites management (up to 10)',
      'Weather alerts and notifications',
      'Priority customer support',
      'Team progress analytics'
    ],
    priceId: 'price_1Og8f8JMYTj8PK3rQKfYhLW2' // Replace with your actual Stripe Price ID
  },
  {
    id: 'bigboss',
    name: 'Big Boss Plan',
    description: 'For large construction businesses with multiple teams',
    price: 99.99,
    interval: 'month',
    features: [
      'Unlimited team members',
      'Unlimited messages',
      'Enterprise scheduling and reporting',
      'Priority voice translation',
      'Unlimited job sites management',
      'Advanced weather alerts and notifications',
      'Dedicated customer support',
      'Advanced analytics and reporting',
      'Custom integrations available'
    ],
    priceId: 'price_1Og8f8JMYTj8PK3rQKfYhLW2' // Replace with your actual Stripe Price ID
  }
];

// Subscription form component
const SubscriptionForm = ({ 
  clientSecret, 
  plan,
  onSuccess, 
  onError 
}: { 
  clientSecret: string;
  plan: Plan;
  onSuccess: () => void;
  onError: (message: string) => void;
}) => {
  const stripe = useStripe();
  const elements = useElements();
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/subscription-success`,
      },
    });

    if (error) {
      setErrorMessage(error.message || 'An unexpected error occurred.');
      onError(error.message || 'Subscription payment failed');
    } else {
      onSuccess();
    }

    setIsLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="rounded-lg border p-4 bg-muted/20">
        <h3 className="font-medium text-lg flex items-center">
          {plan.name}
          {plan.price !== 'Free' ? (
            <span> - ${plan.price}/{plan.interval}</span>
          ) : (
            <span className="ml-2 text-green-600 font-bold"> FREE</span>
          )}
          {plan.recommended && (
            <span className="ml-2 bg-primary text-white text-xs px-2 py-1 rounded-full">RECOMMENDED</span>
          )}
        </h3>
        <p className="text-sm text-muted-foreground mb-4">{plan.description}</p>
        <Separator className="my-2" />
        <ul className="space-y-2 text-sm">
          {plan.features.map((feature, index) => (
            <li key={index} className="flex items-center">
              <span className="mr-2 text-green-500">✓</span>
              {feature}
            </li>
          ))}
        </ul>
        
        {plan.limitations && (
          <div className="mt-3 pt-3 border-t border-gray-200">
            <p className="font-medium text-amber-600 mb-1">Limitations:</p>
            <ul className="space-y-1">
              {plan.limitations.map((limitation, index) => (
                <li key={index} className="flex items-center">
                  <span className="mr-2 text-amber-600">⚠</span>
                  {limitation}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <div className="mt-6">
        <PaymentElement />
      </div>
      
      {errorMessage && (
        <div className="text-red-500 text-sm font-medium p-2 bg-red-50 rounded-md border border-red-200">
          {errorMessage}
        </div>
      )}
      
      <Button 
        type="submit" 
        className="w-full"
        disabled={!stripe || isLoading}
      >
        {isLoading ? 'Processing...' : (plan.price === 'Free' ? 'Activate Free Plan' : `Subscribe for $${plan.price}/${plan.interval}`)}
      </Button>
    </form>
  );
};

// Main Subscribe component
const Subscribe = () => {
  const [clientSecret, setClientSecret] = useState('');
  const [selectedPlanId, setSelectedPlanId] = useState(plans[0].id);
  const [isLoading, setIsLoading] = useState(false);
  const [isCreatingCustomer, setIsCreatingCustomer] = useState(false);
  const [currentStep, setCurrentStep] = useState<'select-plan' | 'payment'>('select-plan');
  const [subscriptionComplete, setSubscriptionComplete] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [customerId, setCustomerId] = useState<string | null>(null);

  const selectedPlan = plans.find(plan => plan.id === selectedPlanId) || plans[0];

  // Create customer and initiate subscription
  const createSubscription = async () => {
    try {
      // Handle free plan differently
      if (selectedPlan.id === 'free') {
        // For free plan, just simulate success
        setSubscriptionComplete(true);
        return;
      }
      
      setIsCreatingCustomer(true);
      setError(null);
      
      // First create a customer
      const customerResponse = await apiRequest('POST', '/api/create-customer', {
        email: 'customer@example.com', // In a real app, get from user input or auth
        name: 'Demo Customer'  // In a real app, get from user input or auth
      });
      
      if (!customerResponse.ok) {
        const errorData = await customerResponse.json();
        throw new Error(errorData.message || 'Failed to create customer');
      }
      
      const customerData = await customerResponse.json();
      setCustomerId(customerData.customerId);
      
      // Then create a subscription
      const subscriptionResponse = await apiRequest('POST', '/api/create-subscription', {
        customerId: customerData.customerId,
        priceId: selectedPlan.priceId
      });
      
      if (!subscriptionResponse.ok) {
        const errorData = await subscriptionResponse.json();
        throw new Error(errorData.message || 'Failed to create subscription');
      }
      
      const subscriptionData = await subscriptionResponse.json();
      
      if (subscriptionData.clientSecret) {
        setClientSecret(subscriptionData.clientSecret);
        setCurrentStep('payment');
      } else {
        throw new Error('No client secret returned from subscription creation');
      }
      
    } catch (err: any) {
      setError(err.message || 'Failed to set up subscription');
      console.error('Subscription setup error:', err);
    } finally {
      setIsCreatingCustomer(false);
    }
  };

  const handleSuccess = () => {
    setSubscriptionComplete(true);
  };

  const handleError = (message: string) => {
    setError(message);
  };

  if (subscriptionComplete) {
    return (
      <div className="max-w-md mx-auto my-12 p-8">
        <Card>
          <CardHeader>
            <div className="flex justify-center mb-4">
              <BossManCharacter mood="happy" size="md" />
            </div>
            <CardTitle>Subscription Successful!</CardTitle>
            <CardDescription>
              Thank you for subscribing to the {selectedPlan.name}. Your subscription is now active.
            </CardDescription>
          </CardHeader>
          <CardFooter>
            <Button onClick={() => window.location.href = '/'} className="w-full">
              Return to Dashboard
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto my-12 p-4">
      <Card>
        <CardHeader>
          <div className="flex justify-center mb-4">
            <BossManCharacter mood="neutral" size="md" />
          </div>
          <CardTitle>BossMan Subscription</CardTitle>
          <CardDescription>
            Choose a plan that works for your team
          </CardDescription>
        </CardHeader>
        <CardContent>
          {currentStep === 'select-plan' ? (
            <div className="space-y-6">
              <RadioGroup 
                defaultValue={selectedPlanId}
                value={selectedPlanId}
                onValueChange={setSelectedPlanId}
                className="space-y-4"
              >
                {plans.map(plan => (
                  <div key={plan.id} className="flex items-start space-x-3">
                    <RadioGroupItem value={plan.id} id={plan.id} className="mt-1" />
                    <div className="w-full">
                      <Label htmlFor={plan.id} className="text-base font-medium flex items-center">
                        {plan.name} 
                        {plan.price !== 'Free' ? (
                          <span> - ${plan.price}/{plan.interval}</span>
                        ) : (
                          <span className="ml-2 text-green-600 font-bold"> FREE</span>
                        )}
                        {plan.recommended && (
                          <span className="ml-2 bg-primary text-white text-xs px-2 py-1 rounded-full">RECOMMENDED</span>
                        )}
                      </Label>
                      <p className="text-sm text-muted-foreground">{plan.description}</p>
                      <div className="mt-2 text-sm">
                        <ul className="space-y-1">
                          {plan.features.map((feature, index) => (
                            <li key={index} className="flex items-center">
                              <span className="mr-2 text-green-500">✓</span>
                              {feature}
                            </li>
                          ))}
                        </ul>
                        
                        {plan.limitations && (
                          <div className="mt-3 pt-3 border-t border-gray-200">
                            <p className="font-medium text-amber-600 mb-1">Limitations:</p>
                            <ul className="space-y-1">
                              {plan.limitations.map((limitation, index) => (
                                <li key={index} className="flex items-center">
                                  <span className="mr-2 text-amber-600">⚠</span>
                                  {limitation}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </RadioGroup>
              
              <Button 
                onClick={createSubscription} 
                className="w-full mt-6"
                disabled={isCreatingCustomer}
              >
                {isCreatingCustomer ? (
                  <span className="flex items-center">
                    <span className="mr-2 h-4 w-4 border-2 border-current border-t-transparent animate-spin rounded-full"></span>
                    Processing...
                  </span>
                ) : (
                  selectedPlan.id === 'free' ? 'Start Free Plan' : 'Continue to Payment'
                )}
              </Button>
              
              {error && (
                <div className="text-red-500 text-sm font-medium p-2 bg-red-50 rounded-md border border-red-200 mt-4">
                  {error}
                </div>
              )}
            </div>
          ) : (
            <>
              {clientSecret ? (
                <Elements stripe={stripePromise} options={{ clientSecret }}>
                  <SubscriptionForm 
                    clientSecret={clientSecret}
                    plan={selectedPlan}
                    onSuccess={handleSuccess} 
                    onError={handleError} 
                  />
                </Elements>
              ) : (
                <div className="flex justify-center py-8">
                  <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
                </div>
              )}
              
              {error && (
                <div className="text-red-500 text-sm font-medium p-4 bg-red-50 rounded-md border border-red-200 mt-4">
                  <p>{error}</p>
                  <Button 
                    variant="outline"
                    className="mt-4 w-full"
                    onClick={() => {
                      setError(null);
                      setCurrentStep('select-plan');
                    }}
                  >
                    Back to Plan Selection
                  </Button>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Subscribe;