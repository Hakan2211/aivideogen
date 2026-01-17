/**
 * Images Page - Unified Create & Gallery
 *
 * Professional image generation interface with:
 * - Fixed bottom prompt bar
 * - Uniform grid with skeleton placeholders
 * - Hover actions (download, animate, copy, delete)
 * - Slide-out detail panel
 * - Keyboard shortcuts (Enter to generate, Esc to close)
 */

import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useState, useEffect, useRef, useCallback } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  generateImageFn,
  getImageJobStatusFn,
  getImageModelsFn,
  listUserImagesFn,
  deleteImageFn,
} from '../../../server/image.fn'
import { Button } from '../../../components/ui/button'
import { Card } from '../../../components/ui/card'
import { Textarea } from '../../../components/ui/textarea'
import { Skeleton } from '../../../components/ui/skeleton'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../../components/ui/select'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '../../../components/ui/sheet'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '../../../components/ui/tooltip'
import {
  Sparkles,
  Loader2,
  Image as ImageIcon,
  Download,
  Copy,
  Trash2,
  Play,
  Check,
  Wand2,
} from 'lucide-react'

export const Route = createFileRoute('/_app/images/')({
  component: ImagesPage,
})

// Aspect ratio presets
const ASPECT_RATIOS = [
  { id: '1:1', name: '1:1', width: 1024, height: 1024 },
  { id: '3:4', name: '3:4', width: 768, height: 1024 },
  { id: '4:3', name: '4:3', width: 1024, height: 768 },
  { id: '16:9', name: '16:9', width: 1024, height: 576 },
  { id: '9:16', name: '9:16', width: 576, height: 1024 },
]

interface GeneratedImage {
  id: string
  url: string
  prompt: string | null
  model: string | null
  metadata: { width?: number; height?: number; seed?: number } | null
  createdAt: Date
}

function ImagesPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Form state
  const [prompt, setPrompt] = useState('')
  const [model, setModel] = useState('fal-ai/flux-pro/v1.1')
  const [aspectRatio, setAspectRatio] = useState('1:1')
  const [showNegativePrompt, setShowNegativePrompt] = useState(false)
  const [negativePrompt, setNegativePrompt] = useState('')

  // UI state
  const [selectedImage, setSelectedImage] = useState<GeneratedImage | null>(
    null,
  )
  const [copiedPrompt, setCopiedPrompt] = useState(false)

  // Generation state
  const [currentJobId, setCurrentJobId] = useState<string | null>(null)

  // Pagination
  const [page, setPage] = useState(0)
  const limit = 20

  // Fetch models
  const { data: modelsData } = useQuery({
    queryKey: ['imageModels'],
    queryFn: () => getImageModelsFn(),
  })

  // Fetch images
  const { data: imagesData, isLoading: imagesLoading } = useQuery({
    queryKey: ['images', page],
    queryFn: () => listUserImagesFn({ data: { limit, offset: page * limit } }),
  })

  const models = modelsData?.models || []
  const images = imagesData?.images || []
  const total = imagesData?.total || 0
  const hasMore = images.length + page * limit < total

  // Generate mutation
  const generateMutation = useMutation({
    mutationFn: generateImageFn,
    onSuccess: (result) => {
      setCurrentJobId(result.jobId)
    },
  })

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: deleteImageFn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['images'] })
      setSelectedImage(null)
    },
  })

  // Poll job status
  const { data: jobStatus } = useQuery({
    queryKey: ['imageJob', currentJobId],
    queryFn: () => getImageJobStatusFn({ data: { jobId: currentJobId! } }),
    enabled: !!currentJobId,
    refetchInterval: (query) => {
      const status = query.state.data?.status
      if (status === 'completed' || status === 'failed') {
        return false
      }
      return 2000
    },
  })

  // Handle job completion
  useEffect(() => {
    if (jobStatus?.status === 'completed') {
      setCurrentJobId(null)
      queryClient.invalidateQueries({ queryKey: ['images'] })
    }
  }, [jobStatus, queryClient])

  // Auto-resize textarea
  const adjustTextareaHeight = useCallback(() => {
    const textarea = textareaRef.current
    if (textarea) {
      textarea.style.height = 'auto'
      const maxHeight = 120 // ~4 lines
      textarea.style.height = `${Math.min(textarea.scrollHeight, maxHeight)}px`
    }
  }, [])

  useEffect(() => {
    adjustTextareaHeight()
  }, [prompt, adjustTextareaHeight])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Enter to generate (without shift)
      if (
        e.key === 'Enter' &&
        !e.shiftKey &&
        document.activeElement === textareaRef.current
      ) {
        e.preventDefault()
        handleGenerate()
      }
      // Escape to close panel
      if (e.key === 'Escape') {
        setSelectedImage(null)
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [prompt, model, aspectRatio, negativePrompt])

  const handleGenerate = () => {
    if (!prompt.trim() || isGenerating) return

    const ratio =
      ASPECT_RATIOS.find((r) => r.id === aspectRatio) || ASPECT_RATIOS[0]

    generateMutation.mutate({
      data: {
        prompt: prompt.trim(),
        model,
        width: ratio.width,
        height: ratio.height,
        negativePrompt: negativePrompt.trim() || undefined,
      },
    })
  }

  const handleCopyPrompt = async (text: string) => {
    await navigator.clipboard.writeText(text)
    setCopiedPrompt(true)
    setTimeout(() => setCopiedPrompt(false), 2000)
  }

  const handleDownload = (url: string, filename?: string) => {
    const link = document.createElement('a')
    link.href = url
    link.download = filename || `image-${Date.now()}.png`
    link.click()
  }

  const handleDelete = (imageId: string) => {
    if (confirm('Delete this image?')) {
      deleteMutation.mutate({ data: { imageId } })
    }
  }

  const handleAnimate = (image: GeneratedImage) => {
    // Navigate to videos - we'll handle image selection there
    // Store in sessionStorage for now (will be picked up by videos page)
    sessionStorage.setItem(
      'animateImage',
      JSON.stringify({ url: image.url, id: image.id }),
    )
    navigate({ to: '/videos' })
  }

  const isGenerating =
    generateMutation.isPending ||
    !!(
      currentJobId &&
      jobStatus?.status !== 'completed' &&
      jobStatus?.status !== 'failed'
    )

  const selectedModel = models.find((m) => m.id === model)
  const progress = jobStatus?.progress || 0

  return (
    <div className="flex h-[calc(100vh-theme(spacing.16))] flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-1 pb-4">
        <div>
          <h1 className="text-2xl font-bold">Images</h1>
          <p className="text-sm text-muted-foreground">
            {total} image{total !== 1 ? 's' : ''} in your library
          </p>
        </div>
      </div>

      {/* Main Grid Area - Scrollable */}
      <div className="flex-1 overflow-y-auto pb-48">
        {imagesLoading && images.length === 0 ? (
          <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <Skeleton key={i} className="aspect-square rounded-lg" />
            ))}
          </div>
        ) : images.length === 0 && !isGenerating ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="rounded-full bg-muted p-6">
              <ImageIcon className="h-12 w-12 text-muted-foreground" />
            </div>
            <h3 className="mt-6 text-lg font-medium">No images yet</h3>
            <p className="mt-2 text-sm text-muted-foreground text-center max-w-sm">
              Type a prompt below and press Enter to create your first
              AI-generated image
            </p>
          </div>
        ) : (
          <>
            <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {/* Generating placeholder */}
              {isGenerating && (
                <Card className="aspect-square overflow-hidden">
                  <div className="relative h-full w-full bg-muted">
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                      <p className="mt-3 text-sm text-muted-foreground">
                        {jobStatus?.status === 'processing'
                          ? 'Creating...'
                          : 'Starting...'}
                      </p>
                      {progress > 0 && (
                        <div className="mt-3 w-24">
                          <div className="h-1.5 overflow-hidden rounded-full bg-muted-foreground/20">
                            <div
                              className="h-full bg-primary transition-all duration-300"
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                    {/* Shimmer effect */}
                    <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                  </div>
                </Card>
              )}

              {/* Image cards */}
              {images.map((image) => (
                <ImageCard
                  key={image.id}
                  image={image}
                  onSelect={() => setSelectedImage(image)}
                  onDownload={() => handleDownload(image.url)}
                  onAnimate={() => handleAnimate(image)}
                  onCopyPrompt={() =>
                    image.prompt && handleCopyPrompt(image.prompt)
                  }
                  onDelete={() => handleDelete(image.id)}
                />
              ))}
            </div>

            {/* Load more */}
            {hasMore && (
              <div className="mt-6 flex justify-center">
                <Button
                  variant="outline"
                  onClick={() => setPage((p) => p + 1)}
                  disabled={imagesLoading}
                >
                  {imagesLoading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : null}
                  Load more
                </Button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Fixed Bottom Prompt Bar */}
      <div className="fixed bottom-0 left-0 right-0 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 md:left-64">
        <div className="mx-auto max-w-4xl p-4">
          {/* Prompt Input */}
          <div className="relative">
            <Textarea
              ref={textareaRef}
              placeholder="Describe the image you want to create... (Press Enter to generate)"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="min-h-[52px] resize-none pr-24 text-base"
              rows={1}
            />
            <Button
              size="sm"
              className="absolute bottom-2 right-2"
              onClick={handleGenerate}
              disabled={!prompt.trim() || isGenerating}
            >
              {isGenerating ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <Sparkles className="mr-1.5 h-4 w-4" />
                  Generate
                </>
              )}
            </Button>
          </div>

          {/* Inline Settings */}
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <Select value={model} onValueChange={setModel}>
              <SelectTrigger className="h-8 w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {models.map((m) => (
                  <SelectItem key={m.id} value={m.id}>
                    <span className="flex items-center gap-2">
                      {m.name}
                      <span className="text-xs text-muted-foreground">
                        {m.credits}cr
                      </span>
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="flex rounded-md border">
              {ASPECT_RATIOS.map((ratio) => (
                <button
                  key={ratio.id}
                  onClick={() => setAspectRatio(ratio.id)}
                  className={`px-2.5 py-1 text-xs font-medium transition-colors first:rounded-l-md last:rounded-r-md ${
                    aspectRatio === ratio.id
                      ? 'bg-primary text-primary-foreground'
                      : 'hover:bg-muted'
                  }`}
                >
                  {ratio.name}
                </button>
              ))}
            </div>

            <button
              onClick={() => setShowNegativePrompt(!showNegativePrompt)}
              className={`text-xs font-medium transition-colors ${
                showNegativePrompt
                  ? 'text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {showNegativePrompt ? '- Hide negative' : '+ Negative prompt'}
            </button>

            <div className="ml-auto text-xs text-muted-foreground">
              {selectedModel?.credits || 5} credits
            </div>
          </div>

          {/* Negative Prompt */}
          {showNegativePrompt && (
            <div className="mt-3">
              <Textarea
                placeholder="What to avoid in the image..."
                value={negativePrompt}
                onChange={(e) => setNegativePrompt(e.target.value)}
                className="h-16 resize-none text-sm"
              />
            </div>
          )}

          {/* Error message */}
          {(generateMutation.isError || jobStatus?.status === 'failed') && (
            <p className="mt-2 text-sm text-destructive">
              {generateMutation.error instanceof Error
                ? generateMutation.error.message
                : jobStatus?.error || 'Generation failed'}
            </p>
          )}
        </div>
      </div>

      {/* Detail Panel */}
      <Sheet open={!!selectedImage} onOpenChange={() => setSelectedImage(null)}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Image Details</SheetTitle>
          </SheetHeader>
          {selectedImage && (
            <div className="mt-6 space-y-6">
              {/* Image Preview */}
              <div className="overflow-hidden rounded-lg bg-muted">
                <img
                  src={selectedImage.url}
                  alt={selectedImage.prompt || 'Generated image'}
                  className="w-full object-contain"
                />
              </div>

              {/* Prompt */}
              {selectedImage.prompt && (
                <div>
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-medium text-muted-foreground">
                      Prompt
                    </h4>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleCopyPrompt(selectedImage.prompt!)}
                    >
                      {copiedPrompt ? (
                        <Check className="mr-1.5 h-3 w-3" />
                      ) : (
                        <Copy className="mr-1.5 h-3 w-3" />
                      )}
                      {copiedPrompt ? 'Copied!' : 'Copy'}
                    </Button>
                  </div>
                  <p className="mt-1 text-sm">{selectedImage.prompt}</p>
                </div>
              )}

              {/* Metadata */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                {selectedImage.model && (
                  <div>
                    <span className="text-muted-foreground">Model</span>
                    <p className="font-medium">
                      {selectedImage.model.split('/').pop()}
                    </p>
                  </div>
                )}
                {selectedImage.metadata?.width && (
                  <div>
                    <span className="text-muted-foreground">Dimensions</span>
                    <p className="font-medium">
                      {selectedImage.metadata.width} x{' '}
                      {selectedImage.metadata.height}
                    </p>
                  </div>
                )}
                <div>
                  <span className="text-muted-foreground">Created</span>
                  <p className="font-medium">
                    {new Date(selectedImage.createdAt).toLocaleDateString(
                      'en-US',
                      {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      },
                    )}
                  </p>
                </div>
                {selectedImage.metadata?.seed && (
                  <div>
                    <span className="text-muted-foreground">Seed</span>
                    <p className="font-medium">{selectedImage.metadata.seed}</p>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex flex-col gap-2">
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant="outline"
                    onClick={() => handleDownload(selectedImage.url)}
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Download
                  </Button>
                  <Button onClick={() => handleAnimate(selectedImage)}>
                    <Play className="mr-2 h-4 w-4" />
                    Animate
                  </Button>
                </div>
                <Button
                  variant="outline"
                  className="text-destructive hover:bg-destructive hover:text-destructive-foreground"
                  onClick={() => handleDelete(selectedImage.id)}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </Button>
              </div>

              {/* Use prompt button */}
              {selectedImage.prompt && (
                <Button
                  variant="secondary"
                  className="w-full"
                  onClick={() => {
                    setPrompt(selectedImage.prompt!)
                    setSelectedImage(null)
                    textareaRef.current?.focus()
                  }}
                >
                  <Wand2 className="mr-2 h-4 w-4" />
                  Use this prompt
                </Button>
              )}
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  )
}

// Image Card Component
interface ImageCardProps {
  image: GeneratedImage
  onSelect: () => void
  onDownload: () => void
  onAnimate: () => void
  onCopyPrompt: () => void
  onDelete: () => void
}

function ImageCard({
  image,
  onSelect,
  onDownload,
  onAnimate,
  onCopyPrompt,
  onDelete,
}: ImageCardProps) {
  return (
    <TooltipProvider delayDuration={300}>
      <Card className="group cursor-pointer overflow-hidden" onClick={onSelect}>
        <div className="relative aspect-square">
          <img
            src={image.url}
            alt={image.prompt || 'Generated image'}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
          />

          {/* Hover overlay with actions */}
          <div className="absolute inset-0 bg-black/60 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
            {/* Action buttons */}
            <div className="absolute right-2 top-2 flex gap-1">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="icon"
                    variant="secondary"
                    className="h-8 w-8"
                    onClick={(e) => {
                      e.stopPropagation()
                      onDownload()
                    }}
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Download</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="icon"
                    variant="secondary"
                    className="h-8 w-8"
                    onClick={(e) => {
                      e.stopPropagation()
                      onAnimate()
                    }}
                  >
                    <Play className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Animate</TooltipContent>
              </Tooltip>

              {image.prompt && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      size="icon"
                      variant="secondary"
                      className="h-8 w-8"
                      onClick={(e) => {
                        e.stopPropagation()
                        onCopyPrompt()
                      }}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Copy prompt</TooltipContent>
                </Tooltip>
              )}

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="icon"
                    variant="secondary"
                    className="h-8 w-8 hover:bg-destructive hover:text-destructive-foreground"
                    onClick={(e) => {
                      e.stopPropagation()
                      onDelete()
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Delete</TooltipContent>
              </Tooltip>
            </div>

            {/* Prompt preview at bottom */}
            {image.prompt && (
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-3 pt-8">
                <p className="line-clamp-2 text-sm text-white">
                  {image.prompt}
                </p>
              </div>
            )}
          </div>
        </div>
      </Card>
    </TooltipProvider>
  )
}
