/**
 * Videos Hub Page
 *
 * Main hub for AI video generation with quick create action and recent videos.
 */

import { Link, createFileRoute } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { Grid, Play, Plus, Video, Wand2 } from 'lucide-react'
import { listUserVideosFn } from '../../../server/video.fn'
import { Button } from '../../../components/ui/button'
import { Card } from '../../../components/ui/card'

export const Route = createFileRoute('/_app/videos/')({
  component: VideosPage,
})

function VideosPage() {
  // Fetch recent videos
  const { data, isLoading } = useQuery({
    queryKey: ['videos', 'recent'],
    queryFn: () => listUserVideosFn({ data: { limit: 6 } }),
  })

  const videos = data?.videos || []

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Videos</h1>
          <p className="text-muted-foreground">
            Animate images and create stunning AI videos
          </p>
        </div>
        <Link to="/videos/create">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Create Video
          </Button>
        </Link>
      </div>

      {/* Quick Actions */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Link to="/videos/create" className="group">
          <Card className="flex h-32 flex-col items-center justify-center border-dashed transition-colors hover:border-primary hover:bg-accent/50">
            <Wand2 className="h-8 w-8 text-muted-foreground group-hover:text-primary" />
            <span className="mt-2 font-medium">Image to Video</span>
            <span className="text-xs text-muted-foreground">
              Animate any image
            </span>
          </Card>
        </Link>

        <Link to="/videos/gallery" className="group">
          <Card className="flex h-32 flex-col items-center justify-center transition-colors hover:bg-accent/50">
            <Grid className="h-8 w-8 text-muted-foreground group-hover:text-primary" />
            <span className="mt-2 font-medium">Gallery</span>
            <span className="text-xs text-muted-foreground">
              View all videos
            </span>
          </Card>
        </Link>

        <Card className="flex h-32 flex-col items-center justify-center bg-muted/30">
          <Video className="h-8 w-8 text-muted-foreground/50" />
          <span className="mt-2 font-medium text-muted-foreground">
            Text to Video
          </span>
          <span className="text-xs text-muted-foreground">Coming soon</span>
        </Card>
      </div>

      {/* Recent Videos */}
      <div>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold">Recent Videos</h2>
          {videos.length > 0 && (
            <Link
              to="/videos/gallery"
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              View all
            </Link>
          )}
        </div>

        {isLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="aspect-video animate-pulse bg-muted" />
            ))}
          </div>
        ) : videos.length === 0 ? (
          <Card className="flex flex-col items-center justify-center py-12">
            <Video className="h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-medium">No videos yet</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Create your first AI-generated video
            </p>
            <Link to="/videos/create">
              <Button className="mt-4">
                <Plus className="mr-2 h-4 w-4" />
                Create Video
              </Button>
            </Link>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {videos.map((video) => (
              <VideoCard key={video.id} video={video} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

interface VideoCardProps {
  video: {
    id: string
    url: string
    prompt: string | null
    model: string | null
    durationSeconds: number | null
    createdAt: Date
  }
}

function VideoCard({ video }: VideoCardProps) {
  return (
    <Card className="group overflow-hidden">
      <div className="relative aspect-video bg-muted">
        <video
          src={video.url}
          className="h-full w-full object-cover"
          muted
          loop
          playsInline
          onMouseEnter={(e) => e.currentTarget.play()}
          onMouseLeave={(e) => {
            e.currentTarget.pause()
            e.currentTarget.currentTime = 0
          }}
        />
        <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-100 transition-opacity group-hover:opacity-0">
          <Play className="h-12 w-12 text-white" />
        </div>
        <div className="absolute inset-0 flex items-end bg-gradient-to-t from-black/60 to-transparent opacity-0 transition-opacity group-hover:opacity-100">
          <div className="w-full p-3">
            <p className="line-clamp-2 text-sm text-white">
              {video.prompt || 'No prompt'}
            </p>
            {video.durationSeconds && (
              <p className="mt-1 text-xs text-white/80">
                {video.durationSeconds}s
              </p>
            )}
          </div>
        </div>
      </div>
    </Card>
  )
}
