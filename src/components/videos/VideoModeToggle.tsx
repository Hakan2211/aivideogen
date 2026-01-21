/**
 * VideoModeToggle - Tab-style mode selector for video generation
 *
 * Modes:
 * - text-to-video: Generate videos from text prompts
 * - image-to-video: Animate an image (first frame)
 * - keyframes: Create transitions between first and last frame
 */

import { Film, Image, Layers } from 'lucide-react'
import { cn } from '@/lib/utils'

export type VideoMode = 'text-to-video' | 'image-to-video' | 'keyframes'

interface VideoModeToggleProps {
  mode: VideoMode
  onModeChange: (mode: VideoMode) => void
  className?: string
}

const modes: Array<{
  id: VideoMode
  label: string
  icon: React.ElementType
  description: string
}> = [
  {
    id: 'text-to-video',
    label: 'Text to Video',
    icon: Film,
    description: 'Generate from text prompt',
  },
  {
    id: 'image-to-video',
    label: 'Image to Video',
    icon: Image,
    description: 'Animate a starting image',
  },
  {
    id: 'keyframes',
    label: 'Keyframes',
    icon: Layers,
    description: 'Transition between images',
  },
]

export function VideoModeToggle({
  mode,
  onModeChange,
  className,
}: VideoModeToggleProps) {
  return (
    <div
      className={cn(
        'inline-flex items-center rounded-lg border bg-muted p-1',
        className,
      )}
    >
      {modes.map((m) => {
        const Icon = m.icon
        const isActive = mode === m.id

        return (
          <button
            key={m.id}
            onClick={() => onModeChange(m.id)}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-all',
              isActive
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground',
            )}
            title={m.description}
          >
            <Icon className="h-4 w-4" />
            <span className="hidden sm:inline">{m.label}</span>
          </button>
        )
      })}
    </div>
  )
}

export { modes as VIDEO_MODES }
