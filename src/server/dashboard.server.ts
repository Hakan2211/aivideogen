/**
 * Dashboard Server Functions
 *
 * Aggregates recent user creations (images, videos, 3D models) for dashboard display.
 */

import { createServerFn } from '@tanstack/react-start'
import { prisma } from '../db.server'
import { authMiddleware } from './middleware.server'

// Unified type for gallery items
export interface GalleryItem {
  id: string
  type: 'image' | 'video' | '3d-model'
  thumbnailUrl: string
  prompt: string | null
  model: string | null
  createdAt: Date
  metadata?: {
    width?: number
    height?: number
    duration?: number
  }
}

/**
 * Fetch recent creations across all asset types
 * Returns a unified list sorted by creation date
 */
export const getRecentCreationsFn = createServerFn({ method: 'GET' })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const limit = 12
    const fetchLimit = Math.ceil(limit / 2) + 4 // Fetch more to account for filtering

    // Fetch images, videos, and 3D models in parallel
    const [images, videos, model3ds] = await Promise.all([
      prisma.asset.findMany({
        where: { userId: context.user.id, type: 'image' },
        orderBy: { createdAt: 'desc' },
        take: fetchLimit,
        select: {
          id: true,
          storageUrl: true,
          prompt: true,
          model: true,
          metadata: true,
          createdAt: true,
        },
      }),
      prisma.asset.findMany({
        where: { userId: context.user.id, type: 'video' },
        orderBy: { createdAt: 'desc' },
        take: fetchLimit,
        select: {
          id: true,
          storageUrl: true,
          prompt: true,
          model: true,
          metadata: true,
          durationSeconds: true,
          createdAt: true,
        },
      }),
      prisma.model3DAsset.findMany({
        where: {
          userId: context.user.id,
          status: 'completed', // Only show completed 3D models
        },
        orderBy: { createdAt: 'desc' },
        take: fetchLimit,
        select: {
          id: true,
          thumbnailUrl: true,
          prompt: true,
          modelId: true,
          createdAt: true,
        },
      }),
    ])

    // Transform to unified GalleryItem format
    const items: GalleryItem[] = [
      ...images.map((img) => ({
        id: img.id,
        type: 'image' as const,
        thumbnailUrl: img.storageUrl,
        prompt: img.prompt,
        model: img.model,
        createdAt: img.createdAt,
        metadata: img.metadata ? JSON.parse(img.metadata) : undefined,
      })),
      ...videos.map((vid) => ({
        id: vid.id,
        type: 'video' as const,
        thumbnailUrl: vid.storageUrl, // Videos serve as their own preview
        prompt: vid.prompt,
        model: vid.model,
        createdAt: vid.createdAt,
        metadata: {
          ...(vid.metadata ? JSON.parse(vid.metadata) : {}),
          duration: vid.durationSeconds || undefined,
        },
      })),
      ...model3ds
        .filter((m) => m.thumbnailUrl) // Only include if has thumbnail
        .map((m) => ({
          id: m.id,
          type: '3d-model' as const,
          thumbnailUrl: m.thumbnailUrl!,
          prompt: m.prompt,
          model: m.modelId,
          createdAt: m.createdAt,
        })),
    ]

    // Sort by createdAt descending and limit
    items.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())

    // Get counts in parallel
    const [imageCount, videoCount, model3dCount] = await Promise.all([
      prisma.asset.count({
        where: { userId: context.user.id, type: 'image' },
      }),
      prisma.asset.count({
        where: { userId: context.user.id, type: 'video' },
      }),
      prisma.model3DAsset.count({
        where: { userId: context.user.id, status: 'completed' },
      }),
    ])

    return {
      items: items.slice(0, limit),
      counts: {
        images: imageCount,
        videos: videoCount,
        model3ds: model3dCount,
      },
    }
  })
