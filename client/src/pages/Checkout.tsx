import { useEffect, useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { apiRequest } from '@/lib/queryClient';
import { Button } from '@/components/ui/button';
import BossManCharacter from "../components/BossManCharacter";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

// Make sure to call loadStripe outside of a component's render to avoid
// recreating the Stripe object on every render.
// This is your test publishable API key.
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

// CheckoutForm component handles the payment form submission
const CheckoutForm = ({ amount, onSuccess, onError }: { 
  amount: number;
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
      // Stripe.js hasn't loaded yet. Make sure to disable form submission until Stripe.js has loaded.
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    // Confirm the payment
    const { error } = await stripe.confirmPayment({
      // `elements` instance used to create a Payment Element
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/payment-success`,
      },
    });

    if (error) {
      // Show error to your customer
      setErrorMessage(error.message || 'An unexpected error occurred.');
      onError(error.message || 'Payment failed');
    } else {
      // Your customer will be redirected to your return_url
      onSuccess();
    }

    setIsLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <PaymentElement />
      
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
        {isLoading ? 'Processing...' : `Pay $${amount.toFixed(2)}`}
      </Button>
    </form>
  );
};

// Main Checkout component that sets up Stripe Elements
const Checkout = () => {
  const [clientSecret, setClientSecret] = useState('');
  const [amount, setAmount] = useState(25);
  const [isLoading, setIsLoading] = useState(true);
  const [paymentComplete, setPaymentComplete] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Create PaymentIntent as soon as the page loads
    const createPaymentIntent = async () => {
      try {
        setIsLoading(true);
        const response = await apiRequest('POST', '/api/create-payment-intent', { 
          amount, 
          currency: 'usd' 
        });
        
        const data = await response.json();
        
        if (response.ok) {
          setClientSecret(data.clientSecret);
        } else {
          throw new Error(data.message || 'Failed to create payment intent');
        }
      } catch (err: any) {
        setError(err.message || 'An error occurred while setting up payment');
        console.error('Payment intent error:', err);
      } finally {
        setIsLoading(false);
      }
    };

    createPaymentIntent();
  }, [amount]);

  const handleSuccess = () => {
    setPaymentComplete(true);
  };

  const handleError = (message: string) => {
    setError(message);
  };

  if (paymentComplete) {
    return (
      <div className="max-w-md mx-auto my-12 p-8">
        <Card>
          <CardHeader>
            <div className="flex justify-center mb-4">
              <BossManCharacter mood="happy" size="md" />
            </div>
            <CardTitle>Payment Successful!</CardTitle>
            <CardDescription>
              Thank you for your payment. Your transaction has been completed successfully.
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
          <CardTitle>Complete Your Payment</CardTitle>
          <CardDescription>
            Secure payment for your handyman service
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
            </div>
          ) : error ? (
            <div className="text-red-500 text-sm font-medium p-4 bg-red-50 rounded-md border border-red-200">
              <p>Error: {error}</p>
              <Button 
                variant="outline"
                className="mt-4 w-full"
                onClick={() => window.location.reload()}
              >
                Try Again
              </Button>
            </div>
          ) : (
            clientSecret && (
              <Elements stripe={stripePromise} options={{ clientSecret }}>
                <CheckoutForm 
                  amount={amount} 
                  onSuccess={handleSuccess} 
                  onError={handleError} 
                />
              </Elements>
            )
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Checkout;