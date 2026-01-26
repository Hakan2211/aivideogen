import { Outlet, createFileRoute, redirect } from '@tanstack/react-router'

// NOTE: Server functions are dynamically imported in beforeLoad
// to prevent Prisma and other server-only code from being bundled into the client.
// See: https://tanstack.com/router/latest/docs/framework/react/start/server-functions

/**
 * Auth Layout
 * Centered layout for authentication pages (login, signup)
 * Redirects to dashboard if already authenticated
 */
export const Route = createFileRoute('/_auth')({
  beforeLoad: async ({ search }) => {
    const { getSessionFn } = await import('../server/auth.server')
    const session = await getSessionFn()
    if (session?.user) {
      const searchParams = search as { redirect?: string }

      // If user is trying to checkout, check if they already have platform access
      if (searchParams?.redirect === 'checkout') {
        // Check platform access
        const { getPlatformStatusFn } = await import('../server/billing.server')
        const platformStatus = await getPlatformStatusFn()

        if (platformStatus.hasPlatformAccess) {
          // Already has access - go directly to dashboard
          throw redirect({ to: '/dashboard' })
        }

        // No access yet - go to checkout
        throw redirect({ to: '/pricing', search: { auto_checkout: 'true' } })
      }

      // Default: go to dashboard
      throw redirect({ to: '/dashboard' })
    }
  },
  component: AuthLayout,
})

function AuthLayout() {
  return (
    <div className="grid min-h-screen place-items-center bg-muted/40 px-4">
      <Outlet />
    </div>
  )
}
