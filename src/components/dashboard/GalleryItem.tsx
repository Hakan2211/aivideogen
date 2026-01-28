/**
 * GalleryItem Component
 *
 * Displays a single creation (image/video/3D model) with:
 * - Thumbnail preview (hover-to-play for videos)
 * - Type badge (Image, Video, 3D)
 * - Prompt preview on hover
 * - Click to navigate to detail page
 */

import { useRef } from 'react'
import { Link } from '@tanstack/react-router'
import { Image, Video, Box, Clock } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { GalleryItem as GalleryItemType } from '@/server/dashboard.server'

interface GalleryItemProps {
  item: GalleryItemType
}

const TYPE_CONFIG = {
  image: {
    icon: Image,
    label: 'Image',
    route: '/images' as const,
    search: { mode: 'generate' as const },
    color: 'bg-blue-500/80',
  },
  video: {
    icon: Video,
    label: 'Video',
    route: '/videos' as const,
    search: undefined,
    color: 'bg-purple-500/80',
  },
  '3d-model': {
    icon: Box,
    label: '3D',
    route: '/3d-models' as const,
    search: { mode: 'text-to-3d' as const },
    color: 'bg-orange-500/80',
  },
}

export function GalleryItem({ item }: GalleryItemProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const config = TYPE_CONFIG[item.type]
  const Icon = config.icon

  const handleMouseEnter = () => {
    if (item.type === 'video' && videoRef.current) {
      videoRef.current.play()
    }
  }

  const handleMouseLeave = () => {
    if (item.type === 'video' && videoRef.current) {
      videoRef.current.pause()
      videoRef.current.currentTime = 0
    }
  }

  return (
    <Link to={config.route} search={config.search} className="block">
      <Card
        className="group cursor-pointer overflow-hidden rounded-2xl border-border/30 bg-card/30 p-0 transition-all duration-300 hover:border-primary/30 hover:shadow-xl hover:shadow-primary/5"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <div className="relative aspect-square overflow-hidden">
          {/* Thumbnail or Video */}
          {item.type === 'video' ? (
            <video
              ref={videoRef}
              src={item.thumbnailUrl}
              className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
              muted
              loop
              playsInline
            />
          ) : (
            <img
              src={item.thumbnailUrl}
              alt={item.prompt || 'Creation'}
              className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
              loading="lazy"
            />
          )}

          {/* Type Badge - Top Left */}
          <div className="absolute top-3 left-3 z-10">
            <Badge
              className={`${config.color} text-white border-none backdrop-blur-sm`}
            >
              <Icon className="h-3 w-3 mr-1" />
              {config.label}
            </Badge>
          </div>

          {/* Duration Badge for Videos - Bottom Left */}
          {item.type === 'video' && item.metadata?.duration && (
            <div className="absolute bottom-3 left-3 z-10">
              <Badge
                variant="secondary"
                className="bg-black/60 text-white border-none backdrop-blur-sm"
              >
                <Clock className="h-3 w-3 mr-1" />
                {Math.round(item.metadata.duration)}s
              </Badge>
            </div>
          )}

          {/* Hover Overlay with Prompt */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 transition-all duration-300 group-hover:opacity-100">
            {item.prompt && (
              <div className="absolute bottom-0 left-0 right-0 p-4 translate-y-2 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
                <p className="line-clamp-3 text-sm text-white/90 leading-relaxed">
                  {item.prompt}
                </p>
              </div>
            )}
          </div>
        </div>
      </Card>
    </Link>
  )
}
