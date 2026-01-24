import { motion } from 'framer-motion'
import { Box, Image, Video, Zap } from 'lucide-react'
import { cn } from '@/lib/utils'

const modelCategories = [
  {
    title: 'Image Generation',
    icon: Image,
    color: 'text-violet-500',
    bgColor: 'bg-violet-500/10',
    models: [
      {
        name: 'FLUX Pro',
        provider: 'Black Forest Labs',
        description: 'Ultra-realistic images',
      },
      {
        name: 'GPT-4o Image',
        provider: 'OpenAI',
        description: 'Creative & versatile',
      },
      {
        name: 'Recraft V3',
        provider: 'Recraft',
        description: 'Design-focused generation',
      },
      {
        name: 'ImagineArt',
        provider: 'Imagine',
        description: 'Artistic styles',
      },
      { name: 'Ideogram', provider: 'Ideogram', description: 'Text in images' },
    ],
  },
  {
    title: 'Video Generation',
    icon: Video,
    color: 'text-blue-500',
    bgColor: 'bg-blue-500/10',
    models: [
      {
        name: 'Kling 1.6',
        provider: 'Kuaishou',
        description: 'High-quality video',
      },
      {
        name: 'Pika 2.0',
        provider: 'Pika Labs',
        description: 'Creative animations',
      },
      { name: 'Wan 2.1', provider: 'Alibaba', description: 'Fast generation' },
      {
        name: 'Luma Ray2',
        provider: 'Luma AI',
        description: 'Cinematic quality',
      },
      { name: 'Veo 2', provider: 'Google', description: 'Realistic motion' },
    ],
  },
  {
    title: '3D Models',
    icon: Box,
    color: 'text-emerald-500',
    bgColor: 'bg-emerald-500/10',
    models: [
      {
        name: 'Meshy',
        provider: 'Meshy AI',
        description: 'Text & image to 3D',
      },
      {
        name: 'Tripo AI',
        provider: 'Tripo',
        description: 'Fast 3D generation',
      },
      {
        name: 'Rodin',
        provider: 'Microsoft',
        description: 'High-detail models',
      },
    ],
  },
  {
    title: 'Upscaling',
    icon: Zap,
    color: 'text-amber-500',
    bgColor: 'bg-amber-500/10',
    models: [
      { name: 'SeedVR', provider: 'fal.ai', description: 'AI video upscale' },
      {
        name: 'Topaz',
        provider: 'Topaz Labs',
        description: 'Professional quality',
      },
      {
        name: 'Bytedance',
        provider: 'ByteDance',
        description: 'Fast enhancement',
      },
    ],
  },
]

export function ModelsSection() {
  return (
    <section id="models" className="py-24 lg:py-32 bg-muted/30">
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
            Powered by the best AI models
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Access cutting-edge AI from leading providers. We integrate the
            latest models so you always have the best tools at your fingertips.
          </p>
        </motion.div>

        {/* Model Categories Grid */}
        <div className="grid md:grid-cols-2 gap-8">
          {modelCategories.map((category, categoryIndex) => (
            <motion.div
              key={category.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: categoryIndex * 0.1 }}
              className="rounded-2xl border border-border/50 bg-card p-6"
            >
              {/* Category Header */}
              <div className="flex items-center gap-3 mb-6">
                <div
                  className={cn(
                    'h-10 w-10 rounded-lg flex items-center justify-center',
                    category.bgColor,
                  )}
                >
                  <category.icon className={cn('h-5 w-5', category.color)} />
                </div>
                <h3 className="text-xl font-semibold">{category.title}</h3>
              </div>

              {/* Models List */}
              <div className="space-y-3">
                {category.models.map((model, modelIndex) => (
                  <motion.div
                    key={model.name}
                    initial={{ opacity: 0, x: -10 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{
                      duration: 0.3,
                      delay: categoryIndex * 0.1 + modelIndex * 0.05,
                    }}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                  >
                    <div>
                      <p className="font-medium text-sm">{model.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {model.provider}
                      </p>
                    </div>
                    <span className="text-xs text-muted-foreground bg-background px-2 py-1 rounded-full">
                      {model.description}
                    </span>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Bottom note */}
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="text-center text-sm text-muted-foreground mt-8"
        >
          New models added regularly. All models accessed through your fal.ai
          API key.
        </motion.p>
      </div>
    </section>
  )
}
