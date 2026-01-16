/**
 * Fal.ai Service
 *
 * Handles AI image and video generation via Fal.ai API.
 * Supports multiple models for both image and video generation.
 *
 * Environment variables required:
 * - FAL_KEY: Fal.ai API key
 */

import { IMAGE_MODELS, VIDEO_MODELS, getModelById } from './types'

const MOCK_FAL = process.env.MOCK_GENERATION === 'true'
const FAL_API_URL = 'https://queue.fal.run'

// =============================================================================
// Types
// =============================================================================

export interface ImageGenerationInput {
  prompt: string
  model?: string // defaults to flux-pro
  width?: number
  height?: number
  numImages?: number
  negativePrompt?: string
  seed?: number
}

export interface VideoGenerationInput {
  imageUrl: string
  prompt: string
  model?: string // defaults to kling-1.5
  duration?: number // seconds (5 or 10)
  seed?: number
}

export interface FalQueueResponse {
  request_id: string
  status: 'IN_QUEUE' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED'
  response_url?: string
}

export interface FalStatusResponse {
  status: 'IN_QUEUE' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED'
  logs?: Array<{ message: string; timestamp: string }>
  response_url?: string
}

export interface FalImageResult {
  images: Array<{
    url: string
    width: number
    height: number
    content_type: string
  }>
  seed: number
  prompt: string
}

export interface FalVideoResult {
  video: {
    url: string
    content_type: string
    file_name: string
    file_size: number
  }
}

export interface GenerationJob {
  requestId: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  model: string
  provider: 'fal'
}

// =============================================================================
// Main Service Functions
// =============================================================================

/**
 * Start an image generation job (queued)
 * Returns a request ID for polling status
 */
export async function generateImage(
  input: ImageGenerationInput,
): Promise<GenerationJob> {
  const modelId = input.model || 'fal-ai/flux-pro/v1.1'
  // Validate model exists (throws if not found)
  getModelById(modelId, IMAGE_MODELS)

  if (MOCK_FAL) {
    return mockGenerateJob(modelId)
  }

  const apiKey = process.env.FAL_KEY
  if (!apiKey) {
    throw new Error('FAL_KEY not configured')
  }

  // Build the request payload based on the model
  const payload = buildImagePayload(input, modelId)

  const response = await fetch(`${FAL_API_URL}/${modelId}`, {
    method: 'POST',
    headers: {
      Authorization: `Key ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Fal.ai error: ${response.status} - ${error}`)
  }

  const data: FalQueueResponse = await response.json()

  return {
    requestId: data.request_id,
    status: 'pending',
    model: modelId,
    provider: 'fal',
  }
}

/**
 * Start a video generation job (queued)
 * Converts an image to video using specified model
 */
export async function generateVideo(
  input: VideoGenerationInput,
): Promise<GenerationJob> {
  const modelId = input.model || 'fal-ai/kling-video/v1.5/pro/image-to-video'
  // Validate model exists (throws if not found)
  getModelById(modelId, VIDEO_MODELS)

  if (MOCK_FAL) {
    return mockGenerateJob(modelId)
  }

  const apiKey = process.env.FAL_KEY
  if (!apiKey) {
    throw new Error('FAL_KEY not configured')
  }

  // Build the request payload
  const payload = buildVideoPayload(input, modelId)

  const response = await fetch(`${FAL_API_URL}/${modelId}`, {
    method: 'POST',
    headers: {
      Authorization: `Key ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Fal.ai error: ${response.status} - ${error}`)
  }

  const data: FalQueueResponse = await response.json()

  return {
    requestId: data.request_id,
    status: 'pending',
    model: modelId,
    provider: 'fal',
  }
}

/**
 * Check the status of a generation job
 */
export async function getJobStatus(
  requestId: string,
  modelId: string,
): Promise<{
  status: 'pending' | 'processing' | 'completed' | 'failed'
  progress?: number
  result?: FalImageResult | FalVideoResult
  error?: string
}> {
  if (MOCK_FAL) {
    return mockGetStatus(requestId, modelId)
  }

  const apiKey = process.env.FAL_KEY
  if (!apiKey) {
    throw new Error('FAL_KEY not configured')
  }

  // Check status
  const statusResponse = await fetch(
    `${FAL_API_URL}/${modelId}/requests/${requestId}/status`,
    {
      headers: {
        Authorization: `Key ${apiKey}`,
      },
    },
  )

  if (!statusResponse.ok) {
    throw new Error(`Failed to get status: ${statusResponse.status}`)
  }

  const statusData: FalStatusResponse = await statusResponse.json()

  // Map Fal status to our status
  const statusMap: Record<
    string,
    'pending' | 'processing' | 'completed' | 'failed'
  > = {
    IN_QUEUE: 'pending',
    IN_PROGRESS: 'processing',
    COMPLETED: 'completed',
    FAILED: 'failed',
  }

  const status = statusMap[statusData.status] || 'pending'

  // If completed, fetch the result
  if (status === 'completed') {
    const resultResponse = await fetch(
      `${FAL_API_URL}/${modelId}/requests/${requestId}`,
      {
        headers: {
          Authorization: `Key ${apiKey}`,
        },
      },
    )

    if (!resultResponse.ok) {
      throw new Error(`Failed to get result: ${resultResponse.status}`)
    }

    const result = await resultResponse.json()
    return { status, result }
  }

  return { status }
}

/**
 * Cancel a pending job
 */
export async function cancelJob(
  requestId: string,
  modelId: string,
): Promise<boolean> {
  if (MOCK_FAL) {
    return true
  }

  const apiKey = process.env.FAL_KEY
  if (!apiKey) {
    throw new Error('FAL_KEY not configured')
  }

  const response = await fetch(
    `${FAL_API_URL}/${modelId}/requests/${requestId}/cancel`,
    {
      method: 'PUT',
      headers: {
        Authorization: `Key ${apiKey}`,
      },
    },
  )

  return response.ok
}

/**
 * Check if Fal.ai is configured
 */
export function isFalConfigured(): boolean {
  if (MOCK_FAL) return true
  return !!process.env.FAL_KEY
}

/**
 * Get available image models
 */
export function getImageModels() {
  return IMAGE_MODELS
}

/**
 * Get available video models
 */
export function getVideoModels() {
  return VIDEO_MODELS
}

// =============================================================================
// Payload Builders
// =============================================================================

function buildImagePayload(input: ImageGenerationInput, modelId: string) {
  // Base payload that works for most models
  const payload: Record<string, unknown> = {
    prompt: input.prompt,
    image_size: {
      width: input.width || 1024,
      height: input.height || 1024,
    },
    num_images: input.numImages || 1,
  }

  if (input.negativePrompt) {
    payload.negative_prompt = input.negativePrompt
  }

  if (input.seed !== undefined) {
    payload.seed = input.seed
  }

  // Model-specific adjustments
  if (modelId.includes('flux')) {
    payload.num_inference_steps = 28
    payload.guidance_scale = 3.5
  }

  return payload
}

function buildVideoPayload(input: VideoGenerationInput, modelId: string) {
  const payload: Record<string, unknown> = {
    image_url: input.imageUrl,
    prompt: input.prompt,
  }

  // Kling-specific settings
  if (modelId.includes('kling')) {
    payload.duration = input.duration === 10 ? '10' : '5'
  }

  // Luma-specific settings
  if (modelId.includes('luma')) {
    payload.aspect_ratio = '9:16' // vertical by default
  }

  if (input.seed !== undefined) {
    payload.seed = input.seed
  }

  return payload
}

// =============================================================================
// Mock Implementation
// =============================================================================

// Store for tracking mock job progress
const mockJobs = new Map<
  string,
  { startTime: number; type: 'image' | 'video' }
>()

function mockGenerateJob(modelId: string): GenerationJob {
  const requestId = `mock-${Date.now()}-${Math.random().toString(36).slice(2)}`
  const type =
    modelId.includes('video') ||
    modelId.includes('kling') ||
    modelId.includes('luma')
      ? 'video'
      : 'image'

  mockJobs.set(requestId, { startTime: Date.now(), type })

  return {
    requestId,
    status: 'pending',
    model: modelId,
    provider: 'fal',
  }
}

function mockGetStatus(
  requestId: string,
  _modelId: string,
): {
  status: 'pending' | 'processing' | 'completed' | 'failed'
  progress?: number
  result?: FalImageResult | FalVideoResult
} {
  const job = mockJobs.get(requestId)
  if (!job) {
    return { status: 'failed' }
  }

  const elapsed = Date.now() - job.startTime
  const processingTime = job.type === 'video' ? 5000 : 2000 // 5s for video, 2s for image

  if (elapsed < processingTime * 0.3) {
    return { status: 'pending', progress: 10 }
  }

  if (elapsed < processingTime) {
    const progress = Math.min(90, Math.floor((elapsed / processingTime) * 100))
    return { status: 'processing', progress }
  }

  // Completed
  mockJobs.delete(requestId)

  if (job.type === 'image') {
    return {
      status: 'completed',
      result: {
        images: [
          {
            url: 'https://placehold.co/1024x1024/1a1a2e/ffffff?text=Generated+Image',
            width: 1024,
            height: 1024,
            content_type: 'image/png',
          },
        ],
        seed: 12345,
        prompt: 'mock prompt',
      } as FalImageResult,
    }
  }

  return {
    status: 'completed',
    result: {
      video: {
        url: 'https://placehold.co/1080x1920.mp4',
        content_type: 'video/mp4',
        file_name: 'mock-video.mp4',
        file_size: 1024000,
      },
    } as FalVideoResult,
  }
}
