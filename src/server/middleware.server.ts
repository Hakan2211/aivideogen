import { createMiddleware } from '@tanstack/react-start'
import { getRequest } from '@tanstack/start-server-core'

// NOTE: Server-only dependencies (prisma, auth) are dynamically imported
// inside middleware handlers to prevent them from being bundled into the client.

async function getAuthInstance() {
  const { getAuth } = await import('../lib/auth.server')
  return getAuth()
}

async function getPrisma() {
  const { prisma } = await import('../db.server')
  return prisma
}

// Define user type based on Better-Auth with our custom fields
export interface AuthUser {
  id: string
  email: string
  name: string | null
  image?: string | null
  emailVerified: boolean
  role: string
  stripeCustomerId?: string | null
  subscriptionStatus?: string | null
  createdAt: Date
  updatedAt: Date
}

export interface AuthSession {
  id: string
  userId: string
  expiresAt: Date
  token: string
  ipAddress?: string | null
  userAgent?: string | null
}

/**
 * Authentication Middleware
 * Validates session via Better-Auth and adds user context
 */
export const authMiddleware = createMiddleware().server(async ({ next }) => {
  const request = getRequest()
  const auth = await getAuthInstance()
  const session = await auth.api.getSession({ headers: request.headers })

  if (!session) {
    throw new Error('Unauthorized')
  }

  return next({
    context: {
      user: session.user as AuthUser,
      session: session.session as AuthSession,
    },
  })
})

/**
 * Admin Middleware
 * Extends authMiddleware to check for admin role
 */
export const adminMiddleware = createMiddleware()
  .middleware([authMiddleware])
  .server(async ({ next, context }) => {
    if (context.user.role !== 'admin') {
      throw new Error('Forbidden: Admins only')
    }
    return next()
  })

/**
 * Optional Auth Middleware
 * Adds user context if authenticated, but doesn't require it
 */
export const optionalAuthMiddleware = createMiddleware().server(
  async ({ next }) => {
    const request = getRequest()
    const auth = await getAuthInstance()
    const session = await auth.api.getSession({ headers: request.headers })

    return next({
      context: {
        user: (session?.user as AuthUser | undefined) ?? null,
        session: (session?.session as AuthSession | undefined) ?? null,
      },
    })
  },
)

/**
 * Platform Access Middleware
 * Extends authMiddleware to check for platform access (paid $149 one-time)
 * Admins bypass this check automatically
 */
export const platformAccessMiddleware = createMiddleware()
  .middleware([authMiddleware])
  .server(async ({ next, context }) => {
    // Admin users always have platform access
    if (context.user.role === 'admin') {
      return next({ context: { ...context, hasPlatformAccess: true } })
    }

    // Check if user has platform access
    const prisma = await getPrisma()
    const user = await prisma.user.findUnique({
      where: { id: context.user.id },
      select: { hasPlatformAccess: true },
    })

    if (!user?.hasPlatformAccess) {
      throw new Error(
        'Platform access required. Please purchase access at /pricing',
      )
    }

    return next({ context: { ...context, hasPlatformAccess: true } })
  })
