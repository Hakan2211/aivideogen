import { createFileRoute } from '@tanstack/react-router'
import { handleWebhook } from '../../../lib/stripe.server'

/**
 * Stripe Webhook Handler
 *
 * This endpoint receives webhook events from Stripe when payments are completed.
 * It's critical for granting platform access after successful checkout.
 *
 * Events handled:
 * - checkout.session.completed: Primary handler for platform access
 * - payment_intent.succeeded: Fallback handler
 * - payment_intent.payment_failed: Error logging
 *
 * Setup:
 * 1. Add webhook in Stripe Dashboard: https://dashboard.stripe.com/webhooks
 * 2. Set endpoint URL: https://yourdomain.com/api/stripe/webhook
 * 3. Select events: checkout.session.completed, payment_intent.succeeded, payment_intent.payment_failed
 * 4. Copy signing secret to STRIPE_WEBHOOK_SECRET env variable
 *
 * For local development:
 * 1. Install Stripe CLI: https://stripe.com/docs/stripe-cli
 * 2. Run: stripe listen --forward-to localhost:3000/api/stripe/webhook
 * 3. Copy the webhook signing secret to .env.local
 */
export const Route = createFileRoute('/api/stripe/webhook')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          // Get raw body for signature verification
          const body = await request.text()
          const signature = request.headers.get('stripe-signature')

          if (!signature) {
            console.error('[STRIPE WEBHOOK] Missing stripe-signature header')
            return new Response(
              JSON.stringify({ error: 'Missing stripe-signature header' }),
              {
                status: 400,
                headers: { 'Content-Type': 'application/json' },
              },
            )
          }

          // Process the webhook
          const result = await handleWebhook(body, signature)

          return new Response(JSON.stringify(result), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          })
        } catch (error) {
          console.error('[STRIPE WEBHOOK] Error processing webhook:', error)

          // Return 400 for signature verification errors
          // This tells Stripe to not retry the webhook
          const errorMessage =
            error instanceof Error ? error.message : 'Unknown error'

          return new Response(JSON.stringify({ error: errorMessage }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
          })
        }
      },
    },
  },
})
