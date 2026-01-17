/**
 * Images Hub Page
 *
 * Main hub for AI image generation with quick create action and recent images.
 */

import { Link, createFileRoute } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { Grid, Image as ImageIcon, Plus, Sparkles } from 'lucide-react'
import { listUserImagesFn } from '../../../server/image.fn'
import { Button } from '../../../components/ui/button'
import { Card } from '../../../components/ui/card'

export const Route = createFileRoute('/_app/images/')({
  component: ImagesPage,
})

function ImagesPage() {
  // Fetch recent images
  const { data, isLoading } = useQuery({
    queryKey: ['images', 'recent'],
    queryFn: () => listUserImagesFn({ data: { limit: 8 } }),
  })

  const images = data?.images || []

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Images</h1>
          <p className="text-muted-foreground">
            Create stunning AI-generated images with text prompts
          </p>
        </div>
        <Link to="/images/create">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Create Image
          </Button>
        </Link>
      </div>

      {/* Quick Actions */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Link to="/images/create" className="group">
          <Card className="flex h-32 flex-col items-center justify-center border-dashed transition-colors hover:border-primary hover:bg-accent/50">
            <Sparkles className="h-8 w-8 text-muted-foreground group-hover:text-primary" />
            <span className="mt-2 font-medium">Text to Image</span>
            <span className="text-xs text-muted-foreground">
              Generate from prompt
            </span>
          </Card>
        </Link>

        <Link to="/images/gallery" className="group">
          <Card className="flex h-32 flex-col items-center justify-center transition-colors hover:bg-accent/50">
            <Grid className="h-8 w-8 text-muted-foreground group-hover:text-primary" />
            <span className="mt-2 font-medium">Gallery</span>
            <span className="text-xs text-muted-foreground">
              View all images
            </span>
          </Card>
        </Link>

        <Card className="flex h-32 flex-col items-center justify-center bg-muted/30">
          <ImageIcon className="h-8 w-8 text-muted-foreground/50" />
          <span className="mt-2 font-medium text-muted-foreground">
            Edit Image
          </span>
          <span className="text-xs text-muted-foreground">Coming soon</span>
        </Card>
      </div>

      {/* Recent Images */}
      <div>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold">Recent Images</h2>
          {images.length > 0 && (
            <Link
              to="/images/gallery"
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              View all
            </Link>
          )}
        </div>

        {isLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
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
          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {images.map((image) => (
              <ImageCard key={image.id} image={image} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

interface ImageCardProps {
  image: {
    id: string
    url: string
    prompt: string | null
    model: string | null
    createdAt: Date
  }
}

function ImageCard({ image }: ImageCardProps) {
  return (
    <Card className="group overflow-hidden">
      <div className="relative aspect-square">
        <img
          src={image.url}
          alt={image.prompt || 'Generated image'}
          className="h-full w-full object-cover transition-transform group-hover:scale-105"
        />
        <div className="absolute inset-0 flex items-end bg-gradient-to-t from-black/60 to-transparent opacity-0 transition-opacity group-hover:opacity-100">
          <div className="w-full p-3">
            <p className="line-clamp-2 text-sm text-white">
              {image.prompt || 'No prompt'}
            </p>
          </div>
        </div>
      </div>
    </Card>
  )
}
