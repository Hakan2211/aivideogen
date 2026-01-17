/**
 * Image Creation Page
 *
 * Full interface for generating images with AI models.
 */

import { Link, createFileRoute } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  ArrowLeft,
  Check,
  Copy,
  Download,
  Image as ImageIcon,
  Loader2,
  Sparkles,
} from 'lucide-react'
import {
  generateImageFn,
  getImageJobStatusFn,
  getImageModelsFn,
} from '../../../server/image.fn'
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

export const Route = createFileRoute('/_app/images/create')({
  component: ImageCreatePage,
})

// Aspect ratio presets
const ASPECT_RATIOS = [
  { id: 'square', name: 'Square (1:1)', width: 1024, height: 1024 },
  { id: 'portrait', name: 'Portrait (3:4)', width: 768, height: 1024 },
  { id: 'landscape', name: 'Landscape (4:3)', width: 1024, height: 768 },
  { id: 'wide', name: 'Wide (16:9)', width: 1024, height: 576 },
  { id: 'tall', name: 'Tall (9:16)', width: 576, height: 1024 },
]

function ImageCreatePage() {
  const queryClient = useQueryClient()

  // Form state
  const [prompt, setPrompt] = useState('')
  const [negativePrompt, setNegativePrompt] = useState('')
  const [model, setModel] = useState('fal-ai/flux-pro/v1.1')
  const [aspectRatio, setAspectRatio] = useState('square')

  // Generation state
  const [currentJobId, setCurrentJobId] = useState<string | null>(null)
  const [generatedImage, setGeneratedImage] = useState<{
    url: string
    assetId: string
  } | null>(null)
  const [copied, setCopied] = useState(false)

  // Fetch models
  const { data: modelsData } = useQuery({
    queryKey: ['imageModels'],
    queryFn: () => getImageModelsFn(),
  })

  const models = modelsData?.models || []

  // Generate mutation
  const generateMutation = useMutation({
    mutationFn: generateImageFn,
    onSuccess: (result) => {
      setCurrentJobId(result.jobId)
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
      return 2000 // Poll every 2 seconds
    },
  })

  // Handle job completion
  useEffect(() => {
    if (jobStatus?.status === 'completed' && jobStatus.output) {
      setGeneratedImage({
        url: jobStatus.output.url,
        assetId: jobStatus.output.assetId,
      })
      setCurrentJobId(null)
      // Invalidate images list
      queryClient.invalidateQueries({ queryKey: ['images'] })
    }
  }, [jobStatus, queryClient])

  const handleGenerate = () => {
    if (!prompt.trim()) return

    const ratio =
      ASPECT_RATIOS.find((r) => r.id === aspectRatio) || ASPECT_RATIOS[0]

    setGeneratedImage(null)
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

  const handleCopyPrompt = async () => {
    await navigator.clipboard.writeText(prompt)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleDownload = () => {
    if (generatedImage) {
      const link = document.createElement('a')
      link.href = generatedImage.url
      link.download = `generated-${Date.now()}.png`
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
        <Link to="/images">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">Create Image</h1>
          <p className="text-muted-foreground">
            Generate images using AI models
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Left: Form */}
        <div className="space-y-6">
          {/* Prompt */}
          <Card className="p-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="prompt">Prompt</Label>
                <Textarea
                  id="prompt"
                  placeholder="Describe the image you want to create..."
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  rows={4}
                  className="resize-none"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="negativePrompt">
                  Negative Prompt{' '}
                  <span className="text-muted-foreground">(optional)</span>
                </Label>
                <Textarea
                  id="negativePrompt"
                  placeholder="What to avoid in the image..."
                  value={negativePrompt}
                  onChange={(e) => setNegativePrompt(e.target.value)}
                  rows={2}
                  className="resize-none"
                />
              </div>
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
                <Label>Aspect Ratio</Label>
                <Select value={aspectRatio} onValueChange={setAspectRatio}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ASPECT_RATIOS.map((ratio) => (
                      <SelectItem key={ratio.id} value={ratio.id}>
                        {ratio.name}
                      </SelectItem>
                    ))}
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
            disabled={!prompt.trim() || isGenerating}
          >
            {isGenerating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating... {progress > 0 && `${progress}%`}
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                Generate ({selectedModel?.credits || 5} credits)
              </>
            )}
          </Button>

          {generateMutation.isError && (
            <p className="text-center text-sm text-destructive">
              {generateMutation.error instanceof Error
                ? generateMutation.error.message
                : 'Failed to generate image'}
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
            <div className="relative aspect-square bg-muted">
              {isGenerating ? (
                <div className="flex h-full flex-col items-center justify-center">
                  <Loader2 className="h-12 w-12 animate-spin text-muted-foreground" />
                  <p className="mt-4 text-sm text-muted-foreground">
                    {jobStatus?.status === 'processing'
                      ? 'Creating your image...'
                      : 'Starting generation...'}
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
              ) : generatedImage ? (
                <img
                  src={generatedImage.url}
                  alt="Generated image"
                  className="h-full w-full object-contain"
                />
              ) : (
                <div className="flex h-full flex-col items-center justify-center">
                  <ImageIcon className="h-12 w-12 text-muted-foreground/50" />
                  <p className="mt-4 text-sm text-muted-foreground">
                    Your generated image will appear here
                  </p>
                </div>
              )}
            </div>
          </Card>

          {/* Actions for generated image */}
          {generatedImage && (
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={handleCopyPrompt}
              >
                {copied ? (
                  <>
                    <Check className="mr-2 h-4 w-4" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="mr-2 h-4 w-4" />
                    Copy Prompt
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                className="flex-1"
                onClick={handleDownload}
              >
                <Download className="mr-2 h-4 w-4" />
                Download
              </Button>
              <Link to="/videos/create" className="flex-1">
                <Button className="w-full">Animate</Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
