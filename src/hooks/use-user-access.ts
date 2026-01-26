import { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useSession } from '@/lib/auth-client'

/**
 * Hook to get user authentication and platform access status
 * Used by landing page components to show different CTAs based on user state
 *
 * Handles SSR hydration by defaulting to "not logged in" state until
 * the client has hydrated, preventing hydration mismatches.
 */
export function useUserAccess() {
  // Track if we've hydrated on the client
  const [isHydrated, setIsHydrated] = useState(false)

  const { data: session, isPending: sessionLoading } = useSession()
  const actuallyLoggedIn = !!session?.user

  const { data: platformStatus, isLoading: platformLoading } = useQuery({
    queryKey: ['platform-status'],
    queryFn: async () => {
      const { getPlatformStatusFn } = await import('@/server/billing.server')
      return getPlatformStatusFn()
    },
    enabled: actuallyLoggedIn,
  })

  // Set hydrated to true after first client render
  useEffect(() => {
    setIsHydrated(true)
  }, [])

  // During SSR and initial client render, return "not logged in" state
  // to match what the server rendered and avoid hydration mismatch
  const isLoggedIn = isHydrated ? actuallyLoggedIn : false
  const hasPlatformAccess = isHydrated
    ? (platformStatus?.hasPlatformAccess ?? false)
    : false

  return {
    isLoggedIn,
    hasPlatformAccess,
    isLoading:
      !isHydrated || sessionLoading || (actuallyLoggedIn && platformLoading),
    isHydrated,
    user: session?.user ?? null,
  }
}
