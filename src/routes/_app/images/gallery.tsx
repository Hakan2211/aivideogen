/**
 * Images Gallery Page
 *
 * Full gallery view of all user's generated images.
 */

import { Link, createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  ArrowLeft,
  Calendar,
  Download,
  Image as ImageIcon,
  Play,
  Plus,
  Sparkles,
  Trash2,
} from 'lucide-react'
import { deleteImageFn, listUserImagesFn } from '../../../server/image.fn'
import { Button } from '../../../components/ui/button'
import { Card } from '../../../components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '../../../components/ui/dialog'

export const Route = createFileRoute('/_app/images/gallery')({
  component: ImagesGalleryPage,
})

function ImagesGalleryPage() {
  const queryClient = useQueryClient()
  const [selectedImage, setSelectedImage] = useState<{
    id: string
    url: string
    prompt: string | null
    model: string | null
    metadata: { width?: number; height?: number } | null
    createdAt: Date
  } | null>(null)

  // Fetch images with pagination
  const [page, setPage] = useState(0)
  const limit = 20

  const { data, isLoading } = useQuery({
    queryKey: ['images', 'gallery', page],
    queryFn: () => listUserImagesFn({ data: { limit, offset: page * limit } }),
  })

  const deleteMutation = useMutation({
    mutationFn: deleteImageFn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['images'] })
      setSelectedImage(null)
    },
  })

  const images = data?.images || []
  const total = data?.total || 0
  const totalPages = Math.ceil(total / limit)

  const handleDelete = (imageId: string, e?: React.MouseEvent) => {
    e?.stopPropagation()
    if (confirm('Are you sure you want to delete this image?')) {
      deleteMutation.mutate({ data: { imageId } })
    }
  }

  const handleDownload = (url: string, e?: React.MouseEvent) => {
    e?.stopPropagation()
    const link = document.createElement('a')
    link.href = url
    link.download = `image-${Date.now()}.png`
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
          <Link to="/images">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">Image Gallery</h1>
            <p className="text-muted-foreground">
              {total} image{total !== 1 ? 's' : ''} in your library
            </p>
          </div>
        </div>
        <Link to="/images/create">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Create Image
          </Button>
        </Link>
      </div>

      {/* Gallery Grid */}
      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <Card key={i} className="aspect-square animate-pulse bg-muted" />
          ))}
        </div>
      ) : images.length === 0 ? (
        <Card className="flex flex-col items-center justify-center py-12">
          <ImageIcon className="h-12 w-12 text-muted-foreground" />
          <h3 className="mt-4 text-lg font-medium">No images yet</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Create your first AI-generated image
          </p>
          <Link to="/images/create">
            <Button className="mt-4">
              <Plus className="mr-2 h-4 w-4" />
              Create Image
            </Button>
          </Link>
        </Card>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {images.map((image) => (
              <Card
                key={image.id}
                className="group cursor-pointer overflow-hidden"
                onClick={() => setSelectedImage(image)}
              >
                <div className="relative aspect-square">
                  <img
                    src={image.url}
                    alt={image.prompt || 'Generated image'}
                    className="h-full w-full object-cover transition-transform group-hover:scale-105"
                  />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
                    <div className="flex gap-2">
                      <Button
                        size="icon"
                        variant="secondary"
                        onClick={(e) => handleDownload(image.url, e)}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="destructive"
                        onClick={(e) => handleDelete(image.id, e)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
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

      {/* Image Detail Dialog */}
      <Dialog
        open={!!selectedImage}
        onOpenChange={() => setSelectedImage(null)}
      >
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Image Details</DialogTitle>
          </DialogHeader>
          {selectedImage && (
            <div className="grid gap-6 md:grid-cols-2">
              {/* Image Preview */}
              <div className="relative overflow-hidden rounded-lg bg-muted">
                <img
                  src={selectedImage.url}
                  alt={selectedImage.prompt || 'Generated image'}
                  className="h-full w-full object-contain"
                />
              </div>

              {/* Details */}
              <div className="space-y-4">
                {selectedImage.prompt && (
                  <div>
                    <h4 className="mb-1 text-sm font-medium text-muted-foreground">
                      Prompt
                    </h4>
                    <p className="text-sm">{selectedImage.prompt}</p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  {selectedImage.model && (
                    <div>
                      <h4 className="mb-1 text-sm font-medium text-muted-foreground">
                        <Sparkles className="mr-1 inline h-3 w-3" />
                        Model
                      </h4>
                      <p className="text-sm">
                        {selectedImage.model.split('/').pop()}
                      </p>
                    </div>
                  )}

                  {selectedImage.metadata?.width && (
                    <div>
                      <h4 className="mb-1 text-sm font-medium text-muted-foreground">
                        Dimensions
                      </h4>
                      <p className="text-sm">
                        {selectedImage.metadata.width} x{' '}
                        {selectedImage.metadata.height}
                      </p>
                    </div>
                  )}

                  <div>
                    <h4 className="mb-1 text-sm font-medium text-muted-foreground">
                      <Calendar className="mr-1 inline h-3 w-3" />
                      Created
                    </h4>
                    <p className="text-sm">
                      {formatDate(selectedImage.createdAt)}
                    </p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-4">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => handleDownload(selectedImage.url)}
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Download
                  </Button>
                  <Link to="/videos/create" className="flex-1">
                    <Button className="w-full">
                      <Play className="mr-2 h-4 w-4" />
                      Animate
                    </Button>
                  </Link>
                  <Button
                    variant="destructive"
                    size="icon"
                    onClick={() => handleDelete(selectedImage.id)}
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
