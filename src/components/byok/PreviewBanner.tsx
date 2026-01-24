import { Link } from '@tanstack/react-router'
import { Eye, Sparkles } from 'lucide-react'
import { Button } from '../ui/button'

interface PreviewBannerProps {
  onUnlock?: () => void
}

/**
 * Banner shown to users who haven't purchased BYOK access yet.
 * Displays in preview mode at the top of the app layout.
 */
export function PreviewBanner({ onUnlock }: PreviewBannerProps) {
  return (
    <div className="bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-amber-500/10 border-b border-amber-500/20">
      <div className="flex items-center justify-between px-4 py-2">
        <div className="flex items-center gap-2 text-sm">
          <Eye className="h-4 w-4 text-amber-600 dark:text-amber-400" />
          <span className="text-amber-800 dark:text-amber-200">
            <span className="font-medium">Preview Mode</span>
            <span className="hidden sm:inline">
              {' '}
              - Unlock full access for $99 one-time
            </span>
          </span>
        </div>
        <Button
          size="sm"
          variant="default"
          className="bg-amber-600 hover:bg-amber-700 text-white h-7 text-xs"
          onClick={onUnlock}
          asChild={!onUnlock}
        >
          {onUnlock ? (
            <>
              <Sparkles className="mr-1.5 h-3 w-3" />
              Unlock Now
            </>
          ) : (
            <Link to="/pricing">
              <Sparkles className="mr-1.5 h-3 w-3" />
              Unlock Now
            </Link>
          )}
        </Button>
      </div>
    </div>
  )
}
