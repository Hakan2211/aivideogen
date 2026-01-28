/**
 * QuickActions Component
 *
 * Grid of buttons to quickly navigate to creation pages
 */

import { Link } from '@tanstack/react-router'
import { Image, Video, Box, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'

const ACTIONS = [
  {
    label: 'Generate Image',
    icon: Image,
    href: '/images' as const,
    search: { mode: 'generate' as const },
    color: 'hover:bg-blue-500/10 hover:border-blue-500/30 hover:text-blue-500',
  },
  {
    label: 'Create Video',
    icon: Video,
    href: '/videos' as const,
    search: undefined,
    color:
      'hover:bg-purple-500/10 hover:border-purple-500/30 hover:text-purple-500',
  },
  {
    label: 'Generate 3D Model',
    icon: Box,
    href: '/3d-models' as const,
    search: { mode: 'text-to-3d' as const },
    color:
      'hover:bg-orange-500/10 hover:border-orange-500/30 hover:text-orange-500',
  },
]

export function QuickActions() {
  return (
    <div className="rounded-xl border border-border/30 bg-card/50 p-6">
      <div className="flex items-center gap-2 mb-4">
        <Sparkles className="h-5 w-5 text-primary" />
        <h2 className="text-lg font-semibold">Quick Actions</h2>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {ACTIONS.map((action) => (
          <Link key={action.label} to={action.href} search={action.search}>
            <Button
              variant="outline"
              className={`w-full h-auto py-4 flex-col gap-2 rounded-xl border-border/50 transition-all duration-200 ${action.color}`}
            >
              <action.icon className="h-6 w-6" />
              <span className="text-sm font-medium">{action.label}</span>
            </Button>
          </Link>
        ))}
      </div>
    </div>
  )
}
