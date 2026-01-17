/**
 * Videos Gallery Page
 *
 * Full gallery view of all user's generated videos.
 */

import { Link, createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  ArrowLeft,
  Calendar,
  Clock,
  Download,
  Play,
  Plus,
  Sparkles,
  Trash2,
  Video,
} from 'lucide-react'
import { deleteVideoFn, listUserVideosFn } from '../../../server/video.fn'
import { Button } from '../../../components/ui/button'
import { Card } from '../../../components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '../../../components/ui/dialog'

export const Route = createFileRoute('/_app/videos/gallery')({
  component: VideosGalleryPage,
})

function VideosGalleryPage() {
  const queryClient = useQueryClient()
  const [selectedVideo, setSelectedVideo] = useState<{
    id: string
    url: string
    prompt: string | null
    model: string | null
    durationSeconds: number | null
    createdAt: Date
  } | null>(null)

  // Fetch videos with pagination
  const [page, setPage] = useState(0)
  const limit = 12

  const { data, isLoading } = useQuery({
    queryKey: ['videos', 'gallery', page],
    queryFn: () => listUserVideosFn({ data: { limit, offset: page * limit } }),
  })

  const deleteMutation = useMutation({
    mutationFn: deleteVideoFn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['videos'] })
      setSelectedVideo(null)
    },
  })

  const videos = data?.videos || []
  const total = data?.total || 0
  const totalPages = Math.ceil(total / limit)

  const handleDelete = (videoId: string, e?: React.MouseEvent) => {
    e?.stopPropagation()
    if (confirm('Are you sure you want to delete this video?')) {
      deleteMutation.mutate({ data: { videoId } })
    }
  }

  const handleDownload = (url: string, e?: React.MouseEvent) => {
    e?.stopPropagation()
    const link = document.createElement('a')
    link.href = url
    link.download = `video-${Date.now()}.mp4`
    link.click()
  }

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/videos">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">Video Gallery</h1>
            <p className="text-muted-foreground">
              {total} video{total !== 1 ? 's' : ''} in your library
            </p>
          </div>
        </div>
        <Link to="/videos/create">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Create Video
          </Button>
        </Link>
      </div>

      {/* Gallery Grid */}
      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
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
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {videos.map((video) => (
              <Card
                key={video.id}
                className="group cursor-pointer overflow-hidden"
                onClick={() => setSelectedVideo(video)}
              >
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
                  <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
                    <div className="flex gap-2">
                      <Button
                        size="icon"
                        variant="secondary"
                        onClick={(e) => handleDownload(video.url, e)}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="destructive"
                        onClick={(e) => handleDelete(video.id, e)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  {video.durationSeconds && (
                    <div className="absolute bottom-2 right-2 rounded bg-black/70 px-2 py-1 text-xs text-white">
                      {video.durationSeconds}s
                    </div>
                  )}
                </div>
              </Card>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0}
              >
                Previous
              </Button>
              <span className="text-sm text-muted-foreground">
                Page {page + 1} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                disabled={page >= totalPages - 1}
              >
                Next
              </Button>
            </div>
          )}
        </>
      )}

      {/* Video Detail Dialog */}
      <Dialog
        open={!!selectedVideo}
        onOpenChange={() => setSelectedVideo(null)}
      >
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Video Details</DialogTitle>
          </DialogHeader>
          {selectedVideo && (
            <div className="grid gap-6 md:grid-cols-2">
              {/* Video Preview */}
              <div className="relative overflow-hidden rounded-lg bg-black">
                <video
                  src={selectedVideo.url}
                  className="h-full w-full object-contain"
                  controls
                  autoPlay
                  loop
                />
              </div>

              {/* Details */}
              <div className="space-y-4">
                {selectedVideo.prompt && (
                  <div>
                    <h4 className="mb-1 text-sm font-medium text-muted-foreground">
                      Motion Prompt
                    </h4>
                    <p className="text-sm">{selectedVideo.prompt}</p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  {selectedVideo.model && (
                    <div>
                      <h4 className="mb-1 text-sm font-medium text-muted-foreground">
                        <Sparkles className="mr-1 inline h-3 w-3" />
                        Model
                      </h4>
                      <p className="text-sm">
                        {selectedVideo.model.split('/').pop()}
                      </p>
                    </div>
                  )}

                  {selectedVideo.durationSeconds && (
                    <div>
                      <h4 className="mb-1 text-sm font-medium text-muted-foreground">
                        <Clock className="mr-1 inline h-3 w-3" />
                        Duration
                      </h4>
                      <p className="text-sm">
                        {selectedVideo.durationSeconds} seconds
                      </p>
                    </div>
                  )}

                  <div>
                    <h4 className="mb-1 text-sm font-medium text-muted-foreground">
                      <Calendar className="mr-1 inline h-3 w-3" />
                      Created
                    </h4>
                    <p className="text-sm">
                      {formatDate(selectedVideo.createdAt)}
                    </p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-4">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => handleDownload(selectedVideo.url)}
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Download
                  </Button>
                  <Link to="/projects" className="flex-1">
                    <Button className="w-full">Add to Project</Button>
                  </Link>
                  <Button
                    variant="destructive"
                    size="icon"
                    onClick={() => handleDelete(selectedVideo.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
