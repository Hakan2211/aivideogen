/**
 * Video Creation Page
 *
 * Full interface for generating videos from images using AI models.
 */

import { Link, createFileRoute } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  ArrowLeft,
  Check,
  Download,
  Image as ImageIcon,
  Loader2,
  Plus,
  Video,
  Wand2,
} from 'lucide-react'
import {
  generateVideoFn,
  getVideoJobStatusFn,
  getVideoModelsFn,
} from '../../../server/video.fn'
import { listUserImagesFn } from '../../../server/image.fn'
import { Button } from '../../../components/ui/button'
import { Card } from '../../../components/ui/card'
import { Textarea } from '../../../components/ui/textarea'
import { Label } from '../../../components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../../components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../../../components/ui/dialog'

export const Route = createFileRoute('/_app/videos/create')({
  component: VideoCreatePage,
})

function VideoCreatePage() {
  const queryClient = useQueryClient()

  // Form state
  const [selectedImage, setSelectedImage] = useState<{
    id: string
    url: string
    prompt: string | null
  } | null>(null)
  const [prompt, setPrompt] = useState('')
  const [model, setModel] = useState(
    'fal-ai/kling-video/v1.5/pro/image-to-video',
  )
  const [duration, setDuration] = useState<5 | 10>(5)
  const [imagePickerOpen, setImagePickerOpen] = useState(false)

  // Generation state
  const [currentJobId, setCurrentJobId] = useState<string | null>(null)
  const [generatedVideo, setGeneratedVideo] = useState<{
    url: string
    assetId: string
  } | null>(null)

  // Fetch models
  const { data: modelsData } = useQuery({
    queryKey: ['videoModels'],
    queryFn: () => getVideoModelsFn(),
  })

  // Fetch user's images for selection
  const { data: imagesData, isLoading: imagesLoading } = useQuery({
    queryKey: ['images', 'forVideo'],
    queryFn: () => listUserImagesFn({ data: { limit: 50 } }),
  })

  const models = modelsData?.models || []
  const images = imagesData?.images || []

  // Generate mutation
  const generateMutation = useMutation({
    mutationFn: generateVideoFn,
    onSuccess: (result) => {
      setCurrentJobId(result.jobId)
    },
  })

  // Poll job status
  const { data: jobStatus } = useQuery({
    queryKey: ['videoJob', currentJobId],
    queryFn: () => getVideoJobStatusFn({ data: { jobId: currentJobId! } }),
    enabled: !!currentJobId,
    refetchInterval: (query) => {
      const status = query.state.data?.status
      if (status === 'completed' || status === 'failed') {
        return false
      }
      return 3000 // Poll every 3 seconds (videos take longer)
    },
  })

  // Handle job completion
  useEffect(() => {
    if (jobStatus?.status === 'completed' && jobStatus.output) {
      setGeneratedVideo({
        url: jobStatus.output.url,
        assetId: jobStatus.output.assetId,
      })
      setCurrentJobId(null)
      // Invalidate videos list
      queryClient.invalidateQueries({ queryKey: ['videos'] })
    }
  }, [jobStatus, queryClient])

  const handleGenerate = () => {
    if (!selectedImage || !prompt.trim()) return

    setGeneratedVideo(null)
    generateMutation.mutate({
      data: {
        imageUrl: selectedImage.url,
        prompt: prompt.trim(),
        model,
        duration,
        sourceImageId: selectedImage.id,
      },
    })
  }

  const handleImageSelect = (image: {
    id: string
    url: string
    prompt: string | null
  }) => {
    setSelectedImage(image)
    // Pre-fill prompt if the image has one
    if (image.prompt && !prompt) {
      setPrompt(`Animate: ${image.prompt}`)
    }
    setImagePickerOpen(false)
  }

  const handleDownload = () => {
    if (generatedVideo) {
      const link = document.createElement('a')
      link.href = generatedVideo.url
      link.download = `video-${Date.now()}.mp4`
      link.click()
    }
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link to="/videos">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">Create Video</h1>
          <p className="text-muted-foreground">
            Animate images using AI video models
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Left: Form */}
        <div className="space-y-6">
          {/* Image Selection */}
          <Card className="p-6">
            <Label className="mb-4 block">Source Image</Label>
            {selectedImage ? (
              <div className="relative">
                <img
                  src={selectedImage.url}
                  alt="Selected image"
                  className="h-48 w-full rounded-lg object-cover"
                />
                <Button
                  variant="secondary"
                  size="sm"
                  className="absolute right-2 top-2"
                  onClick={() => setImagePickerOpen(true)}
                >
                  Change
                </Button>
              </div>
            ) : (
              <Dialog open={imagePickerOpen} onOpenChange={setImagePickerOpen}>
                <DialogTrigger asChild>
                  <button className="flex h-48 w-full flex-col items-center justify-center rounded-lg border-2 border-dashed transition-colors hover:border-primary hover:bg-accent/50">
                    <ImageIcon className="h-8 w-8 text-muted-foreground" />
                    <span className="mt-2 font-medium">Select an image</span>
                    <span className="text-xs text-muted-foreground">
                      Choose from your library
                    </span>
                  </button>
                </DialogTrigger>
                <DialogContent className="max-w-3xl">
                  <DialogHeader>
                    <DialogTitle>Select Image</DialogTitle>
                  </DialogHeader>
                  {imagesLoading ? (
                    <div className="flex h-64 items-center justify-center">
                      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                  ) : images.length === 0 ? (
                    <div className="flex h-64 flex-col items-center justify-center">
                      <ImageIcon className="h-12 w-12 text-muted-foreground" />
                      <p className="mt-4 text-muted-foreground">
                        No images yet
                      </p>
                      <Link to="/images/create">
                        <Button className="mt-4">
                          <Plus className="mr-2 h-4 w-4" />
                          Create Image
                        </Button>
                      </Link>
                    </div>
                  ) : (
                    <div className="grid max-h-96 gap-4 overflow-y-auto sm:grid-cols-3">
                      {images.map((image) => (
                        <button
                          key={image.id}
                          className="group relative overflow-hidden rounded-lg"
                          onClick={() => handleImageSelect(image)}
                        >
                          <img
                            src={image.url}
                            alt={image.prompt || 'Image'}
                            className="aspect-square w-full object-cover transition-transform group-hover:scale-105"
                          />
                          <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
                            <Check className="h-8 w-8 text-white" />
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </DialogContent>
              </Dialog>
            )}

            {/* Picker dialog when changing */}
            {selectedImage && (
              <Dialog open={imagePickerOpen} onOpenChange={setImagePickerOpen}>
                <DialogContent className="max-w-3xl">
                  <DialogHeader>
                    <DialogTitle>Select Image</DialogTitle>
                  </DialogHeader>
                  {imagesLoading ? (
                    <div className="flex h-64 items-center justify-center">
                      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                  ) : images.length === 0 ? (
                    <div className="flex h-64 flex-col items-center justify-center">
                      <ImageIcon className="h-12 w-12 text-muted-foreground" />
                      <p className="mt-4 text-muted-foreground">
                        No images yet
                      </p>
                      <Link to="/images/create">
                        <Button className="mt-4">
                          <Plus className="mr-2 h-4 w-4" />
                          Create Image
                        </Button>
                      </Link>
                    </div>
                  ) : (
                    <div className="grid max-h-96 gap-4 overflow-y-auto sm:grid-cols-3">
                      {images.map((image) => (
                        <button
                          key={image.id}
                          className="group relative overflow-hidden rounded-lg"
                          onClick={() => handleImageSelect(image)}
                        >
                          <img
                            src={image.url}
                            alt={image.prompt || 'Image'}
                            className="aspect-square w-full object-cover transition-transform group-hover:scale-105"
                          />
                          <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
                            <Check className="h-8 w-8 text-white" />
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </DialogContent>
              </Dialog>
            )}
          </Card>

          {/* Motion Prompt */}
          <Card className="p-6">
            <div className="space-y-2">
              <Label htmlFor="prompt">Motion Prompt</Label>
              <Textarea
                id="prompt"
                placeholder="Describe how you want the image to move..."
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                rows={3}
                className="resize-none"
              />
              <p className="text-xs text-muted-foreground">
                Describe the motion, camera movement, or action you want
              </p>
            </div>
          </Card>

          {/* Settings */}
          <Card className="p-6">
            <h3 className="mb-4 font-semibold">Settings</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Model</Label>
                <Select value={model} onValueChange={setModel}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {models.map((m) => (
                      <SelectItem key={m.id} value={m.id}>
                        <div className="flex items-center justify-between gap-2">
                          <span>{m.name}</span>
                          <span className="text-xs text-muted-foreground">
                            {m.credits} credits
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedModel && (
                  <p className="text-xs text-muted-foreground">
                    {selectedModel.description}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label>Duration</Label>
                <Select
                  value={String(duration)}
                  onValueChange={(v) => setDuration(Number(v) as 5 | 10)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5">5 seconds</SelectItem>
                    <SelectItem value="10">10 seconds</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </Card>

          {/* Generate Button */}
          <Button
            size="lg"
            className="w-full"
            onClick={handleGenerate}
            disabled={!selectedImage || !prompt.trim() || isGenerating}
          >
            {isGenerating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating... {progress > 0 && `${progress}%`}
              </>
            ) : (
              <>
                <Wand2 className="mr-2 h-4 w-4" />
                Generate ({selectedModel?.credits || 20} credits)
              </>
            )}
          </Button>

          {generateMutation.isError && (
            <p className="text-center text-sm text-destructive">
              {generateMutation.error instanceof Error
                ? generateMutation.error.message
                : 'Failed to generate video'}
            </p>
          )}

          {jobStatus?.status === 'failed' && (
            <p className="text-center text-sm text-destructive">
              {jobStatus.error || 'Generation failed'}
            </p>
          )}
        </div>

        {/* Right: Preview */}
        <div className="space-y-4">
          <Card className="overflow-hidden">
            <div className="relative aspect-video bg-muted">
              {isGenerating ? (
                <div className="flex h-full flex-col items-center justify-center">
                  <Loader2 className="h-12 w-12 animate-spin text-muted-foreground" />
                  <p className="mt-4 text-sm text-muted-foreground">
                    {jobStatus?.status === 'processing'
                      ? 'Creating your video...'
                      : 'Starting generation...'}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    This may take 1-3 minutes
                  </p>
                  {progress > 0 && (
                    <div className="mt-4 w-48">
                      <div className="h-2 overflow-hidden rounded-full bg-muted-foreground/20">
                        <div
                          className="h-full bg-primary transition-all"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              ) : generatedVideo ? (
                <video
                  src={generatedVideo.url}
                  className="h-full w-full object-contain"
                  controls
                  autoPlay
                  loop
                />
              ) : (
                <div className="flex h-full flex-col items-center justify-center">
                  <Video className="h-12 w-12 text-muted-foreground/50" />
                  <p className="mt-4 text-sm text-muted-foreground">
                    Your generated video will appear here
                  </p>
                </div>
              )}
            </div>
          </Card>

          {/* Actions for generated video */}
          {generatedVideo && (
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={handleDownload}
              >
                <Download className="mr-2 h-4 w-4" />
                Download
              </Button>
              <Link to="/projects" className="flex-1">
                <Button className="w-full">Add to Project</Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
