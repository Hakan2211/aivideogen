import { Link, createFileRoute, redirect } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { z } from 'zod'
import {
  ArrowRight,
  CheckCircle2,
  ExternalLink,
  Key,
  Loader2,
  Sparkles,
} from 'lucide-react'
import { Button } from '../../components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../../components/ui/card'

// Search params validation
const searchSchema = z.object({
  success: z.string().optional(),
  session_id: z.string().optional(),
})

export const Route = createFileRoute('/_app/purchase-success')({
  validateSearch: searchSchema,
  beforeLoad: async ({ search }) => {
    // If not coming from a successful payment, redirect to pricing
    if (!search.success && !search.session_id) {
      throw redirect({ to: '/pricing' })
    }

    // Try to verify and activate access (fallback for webhook)
    try {
      const { verifyPlatformAccessFn } = await import('../../server/billing.fn')
      await verifyPlatformAccessFn()
    } catch {
      // Ignore errors - webhook might have already handled it
    }

    return {}
  },
  component: PurchaseSuccessPage,
})

function PurchaseSuccessPage() {
  // Check current BYOK status to see if they need to add API key
  const { data: byokStatus, isLoading } = useQuery({
    queryKey: ['byok-status'],
    queryFn: async () => {
      const { getByokStatusFn } = await import('../../server/byok.fn')
      return getByokStatusFn()
    },
  })

  const hasApiKey = byokStatus?.hasApiKey

  if (isLoading) {
    return (
      <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center p-4">
      <Card className="max-w-lg w-full border-2 border-green-500/30">
        <CardHeader className="text-center pb-4">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-500/10">
            <CheckCircle2 className="h-8 w-8 text-green-500" />
          </div>
          <CardTitle className="text-2xl">Payment Successful!</CardTitle>
          <CardDescription className="text-base">
            Welcome to DirectorAI. Your lifetime access is now active.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Celebration */}
          <div className="rounded-lg bg-gradient-to-r from-primary/10 via-primary/5 to-primary/10 p-4 text-center">
            <Sparkles className="h-6 w-6 mx-auto mb-2 text-primary" />
            <p className="text-sm font-medium">
              You now have lifetime access to all DirectorAI features!
            </p>
          </div>

          {/* Next Steps */}
          <div className="space-y-3">
            <h3 className="font-semibold flex items-center gap-2">
              <Key className="h-4 w-4" />
              Next Step: Connect fal.ai
            </h3>
            <p className="text-sm text-muted-foreground">
              To start generating AI content, you'll need to connect your fal.ai
              account. This is where the AI models run, and you pay them
              directly for usage (typically $0.01-0.20 per generation).
            </p>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3 pt-2">
            {hasApiKey ? (
              // User already has API key, go to dashboard
              <Button asChild className="w-full" size="lg">
                <Link to="/dashboard">
                  Go to Dashboard
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            ) : (
              // User needs to set up API key
              <>
                <Button asChild className="w-full" size="lg">
                  <Link to="/setup">
                    Set Up fal.ai Connection
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <div className="text-center">
                  <Link
                    to="/dashboard"
                    className="text-sm text-muted-foreground hover:text-foreground"
                  >
                    Skip for now (you can set this up later)
                  </Link>
                </div>
              </>
            )}
          </div>

          {/* Help link */}
          <div className="pt-4 border-t text-center">
            <p className="text-xs text-muted-foreground">
              Need a fal.ai account?{' '}
              <a
                href="https://fal.ai"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline inline-flex items-center gap-1"
              >
                Create one free
                <ExternalLink className="h-3 w-3" />
              </a>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
