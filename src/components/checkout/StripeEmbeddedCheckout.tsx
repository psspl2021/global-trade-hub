import { EmbeddedCheckoutProvider, EmbeddedCheckout } from "@stripe/react-stripe-js";
import { getStripe, createGlobalPlanCheckout } from "@/lib/stripe";

interface Props {
  priceId: string;
  customerEmail?: string;
  userId?: string;
  returnUrl?: string;
}

export function StripeEmbeddedCheckout({ priceId, customerEmail, userId, returnUrl }: Props) {
  const fetchClientSecret = () =>
    createGlobalPlanCheckout({ priceId, customerEmail, userId, returnUrl });

  return (
    <div id="checkout" className="rounded-lg overflow-hidden border border-border">
      <EmbeddedCheckoutProvider stripe={getStripe()} options={{ fetchClientSecret }}>
        <EmbeddedCheckout />
      </EmbeddedCheckoutProvider>
    </div>
  );
}
