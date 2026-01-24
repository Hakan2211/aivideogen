import { Link } from '@tanstack/react-router'
import { Key, ArrowRight } from 'lucide-react'
import { Button } from '../ui/button'

/**
 * Banner shown to users who have purchased BYOK access but haven't
 * connected their fal.ai API key yet.
 */
export function SetupBanner() {
  return (
    <div className="bg-gradient-to-r from-blue-500/10 via-indigo-500/10 to-blue-500/10 border-b border-blue-500/20">
      <div className="flex items-center justify-between px-4 py-2">
        <div className="flex items-center gap-2 text-sm">
          <Key className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          <span className="text-blue-800 dark:text-blue-200">
            <span className="font-medium">Almost there!</span>
            <span className="hidden sm:inline">
              {' '}
              - Connect your fal.ai API key to start generating
            </span>
          </span>
        </div>
        <Button
          size="sm"
          variant="default"
          className="bg-blue-600 hover:bg-blue-700 text-white h-7 text-xs"
          asChild
        >
          <Link to="/setup">
            Complete Setup
            <ArrowRight className="ml-1.5 h-3 w-3" />
          </Link>
        </Button>
      </div>
    </div>
  )
}
