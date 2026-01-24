import { motion } from 'framer-motion'
import { Download, Key, MousePointerClick, Wand2 } from 'lucide-react'

const steps = [
  {
    icon: Key,
    title: 'Connect Your Key',
    description:
      'Add your fal.ai API key in settings. New users get free starting credits to try everything out.',
    step: '01',
    color: 'text-violet-500',
    bgColor: 'bg-violet-500/10',
  },
  {
    icon: MousePointerClick,
    title: 'Choose Your Mode',
    description:
      'Pick from Images, Videos, or 3D Models. Each mode has multiple AI models to choose from.',
    step: '02',
    color: 'text-blue-500',
    bgColor: 'bg-blue-500/10',
  },
  {
    icon: Wand2,
    title: 'Describe & Generate',
    description:
      'Type a prompt describing what you want. Watch AI bring your vision to life in seconds.',
    step: '03',
    color: 'text-emerald-500',
    bgColor: 'bg-emerald-500/10',
  },
  {
    icon: Download,
    title: 'Edit & Export',
    description:
      'Refine your creations with editing tools. Download in any format or use in your projects.',
    step: '04',
    color: 'text-amber-500',
    bgColor: 'bg-amber-500/10',
  },
]

export function HowItWorksSection() {
  return (
    <section id="how-it-works" className="py-24 lg:py-32">
      <div className="container mx-auto px-4 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
            How it works
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            From API key to stunning creations in four simple steps. No complex
            setup, no learning curve.
          </p>
        </motion.div>

        {/* Steps */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-6">
          {steps.map((step, index) => (
            <motion.div
              key={step.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.15 }}
              className="relative"
            >
              <StepCard step={step} isLast={index === steps.length - 1} />
            </motion.div>
          ))}
        </div>

        {/* Bottom CTA hint */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="text-center mt-12"
        >
          <p className="text-muted-foreground">
            Ready to start?{' '}
            <a
              href="https://fal.ai"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline font-medium"
            >
              Get your free fal.ai API key
            </a>{' '}
            and create your first generation in under 2 minutes.
          </p>
        </motion.div>
      </div>
    </section>
  )
}

function StepCard({
  step,
  isLast,
}: {
  step: (typeof steps)[0]
  isLast: boolean
}) {
  const Icon = step.icon

  return (
    <div className="relative text-center lg:text-left">
      {/* Connector line (hidden on mobile and last item) */}
      {!isLast && (
        <div className="hidden lg:block absolute top-12 left-[calc(50%+40px)] w-[calc(100%-80px)] h-0.5 bg-gradient-to-r from-border to-border/50" />
      )}

      {/* Step number badge */}
      <div className="relative z-10 mb-6 flex justify-center lg:justify-start">
        <div
          className={`inline-flex items-center justify-center w-24 h-24 rounded-full ${step.bgColor} border-4 border-background shadow-lg`}
        >
          <Icon className={`h-10 w-10 ${step.color}`} />
        </div>
        <span
          className={`absolute -top-2 -right-2 lg:left-16 flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm font-bold shadow-md`}
        >
          {step.step}
        </span>
      </div>

      {/* Content */}
      <h3 className="text-xl font-semibold mb-3">{step.title}</h3>
      <p className="text-muted-foreground">{step.description}</p>
    </div>
  )
}
