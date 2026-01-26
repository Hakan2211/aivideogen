import { Link } from '@tanstack/react-router'
import { motion } from 'framer-motion'
import { Building2, Check, Key, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useUserAccess } from '@/hooks/use-user-access'

interface Plan {
  name: string
  price: string
  period?: string
  description: string
  features: Array<string>
  cta: string
  href: string
  popular: boolean
  icon: typeof Key | typeof Building2
}

const getPlans = (
  isLoggedIn: boolean,
  hasPlatformAccess: boolean,
): Array<Plan> => [
  {
    name: 'Lifetime Access',
    price: '€149',
    period: 'one-time',
    description: 'Full lifetime access with your own API key',
    features: [
      'All AI models unlocked',
      'Unlimited generations',
      'Connect your fal.ai key',
      'Pay fal.ai directly for usage',
      'No subscription fees ever',
      'All editing & upscale tools',
      'Export in any format',
      'Lifetime updates included',
    ],
    cta: hasPlatformAccess ? 'Go to Dashboard' : 'Buy Now for €149',
    href: hasPlatformAccess
      ? '/dashboard'
      : isLoggedIn
        ? '/pricing?auto_checkout=true'
        : '/signup?redirect=checkout',
    popular: true,
    icon: Key,
  },
  {
    name: 'Team / Enterprise',
    price: 'Custom',
    description: 'For teams and organizations',
    features: [
      'Everything in Lifetime Access',
      'Multi-user workspaces',
      'Shared asset library',
      'Team API key management',
      'Priority support',
      'Custom integrations',
      'API access',
      'Dedicated account manager',
    ],
    cta: 'Contact Sales',
    href: '/pricing',
    popular: false,
    icon: Building2,
  },
]

export function PricingSection() {
  const { isLoggedIn, hasPlatformAccess } = useUserAccess()
  const plans = getPlans(isLoggedIn, hasPlatformAccess)

  return (
    <section id="pricing" className="py-24 lg:py-32 bg-muted/30">
      <div className="container mx-auto px-4 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <span className="inline-flex items-center gap-2 rounded-full border bg-background px-4 py-1.5 text-sm font-medium shadow-sm mb-6">
            <Sparkles className="h-4 w-4 text-primary" />
            Transparent Pricing
          </span>
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
            One-time payment. Lifetime access.
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Pay $149 once for lifetime access. Connect your fal.ai API key and
            pay them directly for AI generations. No monthly fees, no hidden
            costs.
          </p>
        </motion.div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {plans.map((plan, index) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <PricingCard plan={plan} />
            </motion.div>
          ))}
        </div>

        {/* API Cost Reference */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="mt-16 text-center"
        >
          <div className="inline-flex flex-col sm:flex-row items-center gap-4 rounded-2xl border bg-card/50 backdrop-blur px-8 py-6">
            <div className="text-left">
              <p className="font-semibold mb-1">Example API Costs (fal.ai)</p>
              <p className="text-sm text-muted-foreground">
                Actual costs vary by model and resolution
              </p>
            </div>
            <div className="h-px w-full sm:h-12 sm:w-px bg-border" />
            <div className="grid grid-cols-3 gap-6 text-center">
              <div>
                <p className="text-2xl font-bold text-primary">~$0.02</p>
                <p className="text-xs text-muted-foreground">per image</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-primary">~$0.10</p>
                <p className="text-xs text-muted-foreground">per video</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-primary">~$0.05</p>
                <p className="text-xs text-muted-foreground">per 3D model</p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}

function PricingCard({ plan }: { plan: Plan }) {
  const Icon = plan.icon

  return (
    <div
      className={cn(
        'relative h-full rounded-2xl border bg-card p-8 shadow-sm transition-all duration-300 hover:shadow-lg',
        plan.popular && 'border-primary shadow-lg ring-1 ring-primary/20',
      )}
    >
      {/* Popular badge */}
      {plan.popular && (
        <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-4 py-1 text-xs font-semibold text-primary-foreground">
          Recommended
        </span>
      )}

      {/* Icon */}
      <div
        className={cn(
          'mb-6 inline-flex h-14 w-14 items-center justify-center rounded-xl',
          plan.popular ? 'bg-primary/10' : 'bg-muted',
        )}
      >
        <Icon
          className={cn(
            'h-7 w-7',
            plan.popular ? 'text-primary' : 'text-muted-foreground',
          )}
        />
      </div>

      {/* Header */}
      <div className="mb-6">
        <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
        <div className="flex items-baseline gap-1">
          <span className="text-4xl font-bold">{plan.price}</span>
          {plan.period && (
            <span className="text-muted-foreground">{plan.period}</span>
          )}
        </div>
        <p className="text-sm text-muted-foreground mt-2">{plan.description}</p>
      </div>

      {/* Features */}
      <ul className="space-y-3 mb-8">
        {plan.features.map((feature) => (
          <li key={feature} className="flex items-center gap-3">
            <div
              className={cn(
                'flex h-5 w-5 items-center justify-center rounded-full',
                plan.popular ? 'bg-primary/10' : 'bg-muted',
              )}
            >
              <Check
                className={cn(
                  'h-3 w-3',
                  plan.popular ? 'text-primary' : 'text-muted-foreground',
                )}
              />
            </div>
            <span className="text-sm">{feature}</span>
          </li>
        ))}
      </ul>

      {/* CTA */}
      <Link to={plan.href} className="block">
        <Button
          className="w-full"
          size="lg"
          variant={plan.popular ? 'default' : 'outline'}
        >
          {plan.cta}
        </Button>
      </Link>
    </div>
  )
}
