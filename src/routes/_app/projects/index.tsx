/**
 * Projects List Page
 *
 * Displays user's video projects with create/edit/delete options.
 */

import { Link, createFileRoute, useNavigate } from '@tanstack/react-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { Calendar, Layers, Play, Plus, Trash2, Video } from 'lucide-react'
// NOTE: Server functions are dynamically imported in queryFn/mutationFn
// to prevent Prisma and other server-only code from being bundled into the client.
// See: https://tanstack.com/router/latest/docs/framework/react/start/server-functions
import { Button } from '../../../components/ui/button'
import { Card } from '../../../components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../../../components/ui/dialog'
import { Input } from '../../../components/ui/input'
import { Label } from '../../../components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../../components/ui/select'
import { ConfirmDialog } from '../../../components/ui/confirm-dialog'

export const Route = createFileRoute('/_app/projects/')({
  component: ProjectsPage,
})

// Aspect ratio presets
const ASPECT_RATIOS = [
  { id: 'vertical', name: 'Vertical (9:16)', width: 1080, height: 1920 },
  { id: 'horizontal', name: 'Horizontal (16:9)', width: 1920, height: 1080 },
  { id: 'square', name: 'Square (1:1)', width: 1080, height: 1080 },
]

function ProjectsPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [newProjectName, setNewProjectName] = useState('')
  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean
    projectId: string | null
  }>({ open: false, projectId: null })
  const [aspectRatio, setAspectRatio] = useState('vertical')

  // Fetch projects
  const { data, isLoading, error } = useQuery({
    queryKey: ['projects'],
    queryFn: async () => {
      const { listProjectsFn } = await import('../../../server/project.server')
      return listProjectsFn({ data: {} })
    },
  })

  // Create project mutation
  const createMutation = useMutation({
    mutationFn: async (input: {
      data: { name: string; width: number; height: number }
    }) => {
      const { createProjectFn } = await import('../../../server/project.server')
      return createProjectFn(input as never)
    },
    onSuccess: (project) => {
      queryClient.invalidateQueries({ queryKey: ['projects'] })
      setIsCreateOpen(false)
      setNewProjectName('')
      // Navigate to the new project
      navigate({
        to: '/projects/$projectId',
        params: { projectId: project.id },
      })
    },
  })

  // Delete project mutation
  const deleteMutation = useMutation({
    mutationFn: async (input: { data: { projectId: string } }) => {
      const { deleteProjectFn } = await import('../../../server/project.server')
      return deleteProjectFn(input as never)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] })
    },
  })

  const handleCreateProject = () => {
    if (!newProjectName.trim()) return

    const ratio =
      ASPECT_RATIOS.find((r) => r.id === aspectRatio) || ASPECT_RATIOS[0]
    createMutation.mutate({
      data: {
        name: newProjectName,
        width: ratio.width,
        height: ratio.height,
      },
    })
  }

  const handleDeleteProject = (projectId: string, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDeleteDialog({ open: true, projectId })
  }

  const handleConfirmDelete = () => {
    if (!deleteDialog.projectId) return
    deleteMutation.mutate({ data: { projectId: deleteDialog.projectId } })
  }

  const formatDuration = (frames: number, fps: number = 30) => {
    const seconds = Math.floor(frames / fps)
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
  }

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Projects</h1>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="h-64 animate-pulse bg-muted" />
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <p className="text-destructive">Failed to load projects</p>
        <Button
          variant="outline"
          className="mt-4"
          onClick={() =>
            queryClient.invalidateQueries({ queryKey: ['projects'] })
          }
        >
          Retry
        </Button>
      </div>
    )
  }

  const projects = data?.projects || []

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Projects</h1>
          <p className="text-muted-foreground">
            Create and manage your video projects
          </p>
        </div>

        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New Project
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Project</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Project Name</Label>
                <Input
                  id="name"
                  placeholder="My Awesome Video"
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleCreateProject()
                  }}
                />
              </div>
              <div className="space-y-2">
                <Label>Aspect Ratio</Label>
                <Select value={aspectRatio} onValueChange={setAspectRatio}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ASPECT_RATIOS.map((ratio) => (
                      <SelectItem key={ratio.id} value={ratio.id}>
                        {ratio.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button
                className="w-full"
                onClick={handleCreateProject}
                disabled={!newProjectName.trim() || createMutation.isPending}
              >
                {createMutation.isPending ? 'Creating...' : 'Create Project'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Projects Grid */}
      {projects.length === 0 ? (
        <Card className="flex flex-col items-center justify-center py-12">
          <Video className="h-12 w-12 text-muted-foreground" />
          <h3 className="mt-4 text-lg font-medium">No projects yet</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Create your first video project to get started
          </p>
          <Button className="mt-4" onClick={() => setIsCreateOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Create Project
          </Button>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <Link
              key={project.id}
              to="/projects/$projectId"
              params={{ projectId: project.id }}
              className="group"
            >
              <Card className="overflow-hidden transition-shadow hover:shadow-lg">
                {/* Thumbnail */}
                <div
                  className="relative aspect-video bg-muted"
                  style={{
                    aspectRatio:
                      project.width > project.height
                        ? '16/9'
                        : project.width === project.height
                          ? '1/1'
                          : '9/16',
                  }}
                >
                  {project.thumbnailUrl ? (
                    <img
                      src={project.thumbnailUrl}
                      alt={project.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center">
                      <Video className="h-12 w-12 text-muted-foreground/50" />
                    </div>
                  )}

                  {/* Status badge */}
                  <div className="absolute left-2 top-2">
                    <span
                      className={`rounded-full px-2 py-1 text-xs font-medium ${
                        project.status === 'completed'
                          ? 'bg-green-500/90 text-white'
                          : project.status === 'rendering'
                            ? 'bg-yellow-500/90 text-white'
                            : 'bg-gray-500/90 text-white'
                      }`}
                    >
                      {project.status}
                    </span>
                  </div>

                  {/* Hover overlay */}
                  <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
                    <Play className="h-12 w-12 text-white" />
                  </div>

                  {/* Delete button */}
                  <button
                    onClick={(e) => handleDeleteProject(project.id, e)}
                    className="absolute right-2 top-2 rounded-full bg-red-500/90 p-1.5 text-white opacity-0 transition-opacity hover:bg-red-600 group-hover:opacity-100"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>

                {/* Info */}
                <div className="p-4">
                  <h3 className="font-medium truncate">{project.name}</h3>
                  <div className="mt-2 flex items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {formatDate(project.updatedAt)}
                    </span>
                    <span className="flex items-center gap-1">
                      <Layers className="h-3 w-3" />
                      {project.assetCount} assets
                    </span>
                    {project.duration > 0 && (
                      <span>{formatDuration(project.duration)}</span>
                    )}
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={deleteDialog.open}
        onOpenChange={(open) => setDeleteDialog((prev) => ({ ...prev, open }))}
        title="Delete Project?"
        description="This action cannot be undone. The project and all its contents will be permanently removed."
        confirmText="Delete"
        variant="destructive"
        onConfirm={handleConfirmDelete}
        isLoading={deleteMutation.isPending}
      />
    </div>
  )
}
