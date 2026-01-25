# Stripe Integration Guide for El Seibo Mission

To add a Stripe payment gateway for donations, you will need to implement both a backend handler and a frontend trigger. Here is the breakdown of what is required.

## 1. Prerequisites
- Create a [Stripe Account](https://stripe.com).
- Get your **Publishable Key** and **Secret Key** from the Stripe Dashboard (Developers > API Keys).

## 2. Backend Implementation (Node.js/Express)

### Install Dependency
```bash
npm install stripe
```

### Server Code (`server/index.js`)
You would add an endpoint to create a "Checkout Session":

```javascript
import Stripe from 'stripe';
const stripe = new Stripe('your_stripe_secret_key_here');

app.post('/api/create-checkout-session', async (req, res) => {
  const { amount } = req.body; // Amount in dollars

  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: 'Donation to El Seibo Mission',
            },
            unit_amount: amount * 100, // Stripe uses cents
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: 'http://localhost:5173/success', // Where to go after payment
      cancel_url: 'http://localhost:5173/donate',  // Where to go if they cancel
    });

    res.json({ id: session.id, url: session.url });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

## 3. Frontend Implementation (React)

### Install Dependencies
```bash
npm install @stripe/stripe-js @stripe/react-stripe-js
```

### Component Code (`src/components/DonateSection.tsx`)
Update your donation button to call the backend:

```tsx
import { loadStripe } from '@stripe/stripe-js';

const stripePromise = loadStripe('your_stripe_publishable_key_here');

const handleDonate = async (amount) => {
  const stripe = await stripePromise;

  const response = await fetch('http://localhost:5000/api/create-checkout-session', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ amount }),
  });

  const session = await response.json();

  // Redirect to Stripe Checkout
  if (session.url) {
    window.location.href = session.url;
  }
};
```

## 4. Security Note
> [!IMPORTANT]
> Never put your **Secret Key** in the frontend code. It should stay strictly on the server (backend). Use `.env` files to store these keys securely.
