/**
 * Project Workspace Page
 *
 * The main video editing workspace with 3-column layout:
 * - Left: Chat/AI Director panel
 * - Center: Video preview + Timeline
 * - Right: Asset Library + Generate panel
 */

import { createFileRoute } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { getProjectFn } from '../../../server/project.fn'
import { Workspace } from '../../../components/studio/Workspace'

export const Route = createFileRoute('/_app/projects/$projectId')({
  component: ProjectWorkspacePage,
})

function ProjectWorkspacePage() {
  const { projectId } = Route.useParams()

  // Fetch project data
  const {
    data: project,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['project', projectId],
    queryFn: () => getProjectFn({ data: { projectId } }),
  })

  if (isLoading) {
    return (
      <div className="flex h-[calc(100vh-8rem)] items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto" />
          <p className="mt-4 text-muted-foreground">Loading project...</p>
        </div>
      </div>
    )
  }

  if (error || !project) {
    return (
      <div className="flex h-[calc(100vh-8rem)] items-center justify-center">
        <div className="text-center">
          <p className="text-destructive">Failed to load project</p>
          <p className="mt-2 text-sm text-muted-foreground">
            {error instanceof Error ? error.message : 'Project not found'}
          </p>
        </div>
      </div>
    )
  }

  return <Workspace project={project} />
}
