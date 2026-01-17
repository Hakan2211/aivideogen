/**
 * Asset Panel Component
 *
 * Shows user's assets and provides generation controls.
 */

import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  ChevronLeft,
  ChevronRight,
  Image,
  Loader2,
  Music,
  Plus,
  Upload,
  Video,
} from 'lucide-react'
import {
  createAudioJobFn,
  createImageJobFn,
  createVideoJobFn,
  getAvailableModelsFn,
} from '../../server/generation.fn'
import { Button } from '../ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs'
import type { ProjectManifest } from '../../remotion/types'

interface Asset {
  id: string
  type: string
  url: string
  filename: string
  prompt: string | null
  metadata: unknown
  durationSeconds: number | null
  createdAt: Date
}

interface AssetPanelProps {
  projectId: string
  assets: Array<Asset>
  manifest: ProjectManifest
  onManifestChange: (manifest: ProjectManifest) => void
  collapsed: boolean
  onToggleCollapse: () => void
}

export function AssetPanel({
  projectId,
  assets,
  manifest,
  onManifestChange,
  collapsed,
  onToggleCollapse,
}: AssetPanelProps) {
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState<'library' | 'generate'>('library')
  const [generateTab, setGenerateTab] = useState<'image' | 'video' | 'audio'>(
    'image',
  )

  // Generation form state
  const [imagePrompt, setImagePrompt] = useState('')
  const [videoPrompt, setVideoPrompt] = useState('')
  const [selectedImageUrl, setSelectedImageUrl] = useState('')
  const [audioText, setAudioText] = useState('')

  // Mutations
  const createImageMutation = useMutation({
    mutationFn: createImageJobFn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project', projectId] })
      setImagePrompt('')
    },
  })

  const createVideoMutation = useMutation({
    mutationFn: createVideoJobFn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project', projectId] })
      setVideoPrompt('')
      setSelectedImageUrl('')
    },
  })

  const createAudioMutation = useMutation({
    mutationFn: createAudioJobFn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project', projectId] })
      setAudioText('')
    },
  })

  const handleGenerateImage = () => {
    if (!imagePrompt.trim()) return
    createImageMutation.mutate({
      data: {
        prompt: imagePrompt,
        projectId,
      },
    })
  }

  const handleGenerateVideo = () => {
    if (!videoPrompt.trim() || !selectedImageUrl) return
    createVideoMutation.mutate({
      data: {
        prompt: videoPrompt,
        imageUrl: selectedImageUrl,
        projectId,
      },
    })
  }

  const handleGenerateAudio = () => {
    if (!audioText.trim()) return
    createAudioMutation.mutate({
      data: {
        text: audioText,
        voiceId: '21m00Tcm4TlvDq8ikWAM', // Rachel voice
        projectId,
      },
    })
  }

  // Filter assets by type
  const imageAssets = assets.filter((a) => a.type === 'image')
  const videoAssets = assets.filter((a) => a.type === 'video')
  const audioAssets = assets.filter((a) => a.type === 'audio')

  if (collapsed) {
    return (
      <div className="flex h-full flex-col items-center py-4">
        <button
          onClick={onToggleCollapse}
          className="rounded-full p-2 hover:bg-muted"
          title="Expand assets"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <div className="mt-4 flex flex-col items-center gap-3">
          <Image className="h-5 w-5 text-muted-foreground" />
          <Video className="h-5 w-5 text-muted-foreground" />
          <Music className="h-5 w-5 text-muted-foreground" />
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b px-4 py-3">
        <span className="font-medium">Assets</span>
        <button
          onClick={onToggleCollapse}
          className="rounded-full p-1 hover:bg-muted"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      {/* Main Tabs */}
      <Tabs
        value={activeTab}
        onValueChange={(v) => setActiveTab(v as 'library' | 'generate')}
        className="flex-1 flex flex-col"
      >
        <TabsList className="w-full justify-start rounded-none border-b bg-transparent px-4">
          <TabsTrigger value="library" className="data-[state=active]:bg-muted">
            Library
          </TabsTrigger>
          <TabsTrigger
            value="generate"
            className="data-[state=active]:bg-muted"
          >
            Generate
          </TabsTrigger>
        </TabsList>

        {/* Library Tab */}
        <TabsContent
          value="library"
          className="flex-1 overflow-y-auto p-4 mt-0"
        >
          {assets.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Image className="h-10 w-10 text-muted-foreground/50" />
              <p className="mt-4 text-sm text-muted-foreground">
                No assets yet. Generate some using the Generate tab!
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Images */}
              {imageAssets.length > 0 && (
                <div>
                  <h4 className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1">
                    <Image className="h-3 w-3" />
                    Images ({imageAssets.length})
                  </h4>
                  <div className="grid grid-cols-2 gap-2">
                    {imageAssets.map((asset) => (
                      <AssetThumbnail
                        key={asset.id}
                        asset={asset}
                        onSelect={() => setSelectedImageUrl(asset.url)}
                        isSelected={selectedImageUrl === asset.url}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Videos */}
              {videoAssets.length > 0 && (
                <div>
                  <h4 className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1">
                    <Video className="h-3 w-3" />
                    Videos ({videoAssets.length})
                  </h4>
                  <div className="grid grid-cols-2 gap-2">
                    {videoAssets.map((asset) => (
                      <AssetThumbnail key={asset.id} asset={asset} />
                    ))}
                  </div>
                </div>
              )}

              {/* Audio */}
              {audioAssets.length > 0 && (
                <div>
                  <h4 className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1">
                    <Music className="h-3 w-3" />
                    Audio ({audioAssets.length})
                  </h4>
                  <div className="space-y-2">
                    {audioAssets.map((asset) => (
                      <div
                        key={asset.id}
                        className="flex items-center gap-2 rounded bg-muted/50 p-2 text-xs"
                      >
                        <Music className="h-4 w-4 text-muted-foreground" />
                        <span className="flex-1 truncate">
                          {asset.filename}
                        </span>
                        {asset.durationSeconds && (
                          <span className="text-muted-foreground">
                            {Math.floor(asset.durationSeconds)}s
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </TabsContent>

        {/* Generate Tab */}
        <TabsContent
          value="generate"
          className="flex-1 overflow-y-auto p-4 mt-0"
        >
          <Tabs
            value={generateTab}
            onValueChange={(v) =>
              setGenerateTab(v as 'image' | 'video' | 'audio')
            }
          >
            <TabsList className="w-full">
              <TabsTrigger value="image" className="flex-1">
                <Image className="h-3 w-3 mr-1" />
                Image
              </TabsTrigger>
              <TabsTrigger value="video" className="flex-1">
                <Video className="h-3 w-3 mr-1" />
                Video
              </TabsTrigger>
              <TabsTrigger value="audio" className="flex-1">
                <Music className="h-3 w-3 mr-1" />
                Audio
              </TabsTrigger>
            </TabsList>

            {/* Image Generation */}
            <TabsContent value="image" className="mt-4 space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-medium">Prompt</label>
                <textarea
                  value={imagePrompt}
                  onChange={(e) => setImagePrompt(e.target.value)}
                  placeholder="Describe the image you want to generate..."
                  className="w-full rounded-md border bg-background px-3 py-2 text-sm min-h-[80px] resize-none"
                />
              </div>
              <Button
                className="w-full"
                onClick={handleGenerateImage}
                disabled={!imagePrompt.trim() || createImageMutation.isPending}
              >
                {createImageMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4 mr-2" />
                    Generate Image (~5 credits)
                  </>
                )}
              </Button>
            </TabsContent>

            {/* Video Generation */}
            <TabsContent value="video" className="mt-4 space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-medium">Source Image</label>
                {selectedImageUrl ? (
                  <div className="relative aspect-video bg-muted rounded overflow-hidden">
                    <img
                      src={selectedImageUrl}
                      alt="Selected"
                      className="w-full h-full object-cover"
                    />
                    <button
                      onClick={() => setSelectedImageUrl('')}
                      className="absolute top-1 right-1 bg-black/50 text-white rounded px-2 py-0.5 text-xs"
                    >
                      Change
                    </button>
                  </div>
                ) : (
                  <div className="aspect-video bg-muted rounded flex items-center justify-center text-sm text-muted-foreground">
                    Select an image from the Library tab
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <label className="text-xs font-medium">Motion Prompt</label>
                <textarea
                  value={videoPrompt}
                  onChange={(e) => setVideoPrompt(e.target.value)}
                  placeholder="Describe the motion/animation..."
                  className="w-full rounded-md border bg-background px-3 py-2 text-sm min-h-[60px] resize-none"
                />
              </div>
              <Button
                className="w-full"
                onClick={handleGenerateVideo}
                disabled={
                  !videoPrompt.trim() ||
                  !selectedImageUrl ||
                  createVideoMutation.isPending
                }
              >
                {createVideoMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4 mr-2" />
                    Generate Video (~20 credits)
                  </>
                )}
              </Button>
            </TabsContent>

            {/* Audio Generation */}
            <TabsContent value="audio" className="mt-4 space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-medium">Script / Text</label>
                <textarea
                  value={audioText}
                  onChange={(e) => setAudioText(e.target.value)}
                  placeholder="Enter the text for voiceover..."
                  className="w-full rounded-md border bg-background px-3 py-2 text-sm min-h-[100px] resize-none"
                />
              </div>
              <Button
                className="w-full"
                onClick={handleGenerateAudio}
                disabled={!audioText.trim() || createAudioMutation.isPending}
              >
                {createAudioMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4 mr-2" />
                    Generate Voiceover (~3 credits)
                  </>
                )}
              </Button>
            </TabsContent>
          </Tabs>
        </TabsContent>
      </Tabs>
    </div>
  )
}

// =============================================================================
// Sub-components
// =============================================================================

interface AssetThumbnailProps {
  asset: Asset
  onSelect?: () => void
  isSelected?: boolean
}

function AssetThumbnail({ asset, onSelect, isSelected }: AssetThumbnailProps) {
  return (
    <button
      onClick={onSelect}
      className={`relative aspect-square bg-muted rounded overflow-hidden hover:ring-2 hover:ring-primary transition-all ${
        isSelected ? 'ring-2 ring-primary' : ''
      }`}
    >
      {asset.type === 'image' ? (
        <img
          src={asset.url}
          alt={asset.filename}
          className="w-full h-full object-cover"
        />
      ) : asset.type === 'video' ? (
        <video src={asset.url} className="w-full h-full object-cover" muted />
      ) : null}

      {asset.type === 'video' && (
        <div className="absolute bottom-1 right-1 bg-black/70 text-white text-[10px] px-1 rounded">
          {asset.durationSeconds
            ? `${Math.floor(asset.durationSeconds)}s`
            : 'Video'}
        </div>
      )}
    </button>
  )
}
