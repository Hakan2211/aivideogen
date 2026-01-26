import { createServerFn } from '@tanstack/react-start'
import { getRequest } from '@tanstack/start-server-core'
import { z } from 'zod'
import { authMiddleware } from './middleware.server'

// NOTE: Server-only dependencies (prisma, auth) are dynamically imported
// inside handlers to prevent them from being bundled into the client during dev mode.
// TanStack Start transforms createServerFn to RPC calls, but static imports at the top
// level would still be resolved by Vite before the transformation.
//
// authMiddleware can be imported statically because middleware.server.ts itself
// uses dynamic imports internally for prisma and auth.

// Dynamic import helpers
async function getAuthInstance() {
  const { getAuth } = await import('../lib/auth.server')
  return getAuth()
}

async function getPrisma() {
  const { prisma } = await import('../db.server')
  return prisma
}

/**
 * Get current user session
 */
export const getSessionFn = createServerFn({ method: 'GET' }).handler(
  async () => {
    try {
      const request = getRequest()
      const auth = await getAuthInstance()
      const session = await auth.api.getSession({ headers: request.headers })
      return session
    } catch (error) {
      console.error('Get session error:', error)
      return null
    }
  },
)

/**
 * Update user profile
 */
const updateProfileSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  image: z.string().url().optional(),
})

export const updateProfileFn = createServerFn({ method: 'POST' })
  .middleware([authMiddleware])
  .inputValidator(updateProfileSchema)
  .handler(async ({ data, context }) => {
    const prisma = await getPrisma()
    const user = await prisma.user.update({
      where: { id: context.user.id },
      data: {
        name: data.name,
        image: data.image,
      },
    })

    return { success: true, user }
  })

/**
 * Get user by ID (admin only)
 */
const getUserSchema = z.object({ userId: z.string() })

export const getUserFn = createServerFn({ method: 'GET' })
  .middleware([authMiddleware])
  .inputValidator(getUserSchema)
  .handler(async ({ data, context }) => {
    // Only admins can view other users
    if (context.user.role !== 'admin' && context.user.id !== data.userId) {
      throw new Error('Forbidden')
    }

    const prisma = await getPrisma()
    const user = await prisma.user.findUnique({
      where: { id: data.userId },
      select: {
        id: true,
        email: true,
        name: true,
        image: true,
        role: true,
        emailVerified: true,
        createdAt: true,
      },
    })

    return user
  })

/**
 * List all users (admin only)
 */
export const listUsersFn = createServerFn({ method: 'GET' })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    if (context.user.role !== 'admin') {
      throw new Error('Forbidden: Admins only')
    }

    const prisma = await getPrisma()
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        emailVerified: true,
        createdAt: true,
        subscriptionStatus: true,
      },
      orderBy: { createdAt: 'desc' },
    })

    return users
  })

/**
 * Update user role (admin only)
 */
const updateRoleSchema = z.object({
  userId: z.string(),
  role: z.enum(['user', 'admin']),
})

export const updateUserRoleFn = createServerFn({ method: 'POST' })
  .middleware([authMiddleware])
  .inputValidator(updateRoleSchema)
  .handler(async ({ data, context }) => {
    if (context.user.role !== 'admin') {
      throw new Error('Forbidden: Admins only')
    }

    // Prevent self-demotion
    if (data.userId === context.user.id && data.role !== 'admin') {
      throw new Error('Cannot demote yourself')
    }

    const prisma = await getPrisma()
    const user = await prisma.user.update({
      where: { id: data.userId },
      data: { role: data.role },
    })

    return { success: true, user }
  })
