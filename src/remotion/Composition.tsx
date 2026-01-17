/**
 * Main Video Composition
 *
 * This component reads the ProjectManifest and renders all tracks:
 * - Video clips with transitions
 * - Audio clips with volume control
 * - Component overlays (text, titles, images)
 */

import {
  AbsoluteFill,
  Audio,
  Sequence,
  Video,
  interpolate,
  useCurrentFrame,
} from 'remotion'
import { KaraokeText } from './components/overlays/KaraokeText'
import { BigTitle } from './components/overlays/BigTitle'
import { ImageOverlay } from './components/overlays/ImageOverlay'
import { LowerThird } from './components/overlays/LowerThird'
import type {
  BigTitleProps,
  ComponentOverlayProps,
  CompositionProps,
  ImageOverlayProps,
  KaraokeTextProps,
  LowerThirdProps,
  TransitionType,
  VideoClipProps,
} from './types'

// =============================================================================
// Main Composition
// =============================================================================

export const VideoComposition: React.FC<CompositionProps> = ({ manifest }) => {
  // Use empty manifest if not provided
  const safeManifest = manifest || {
    version: 1,
    tracks: { video: [], audio: [], components: [] },
    globalSettings: { backgroundColor: '#000000' },
  }

  // Sort clips by layer for proper z-ordering
  const sortedVideoClips = [...safeManifest.tracks.video].sort(
    (a, b) => a.layer - b.layer,
  )
  const sortedComponents = [...safeManifest.tracks.components].sort(
    (a, b) => a.layer - b.layer,
  )

  return (
    <AbsoluteFill
      style={{ backgroundColor: safeManifest.globalSettings.backgroundColor }}
    >
      {/* Video Track */}
      {sortedVideoClips.map((clip) => (
        <Sequence
          key={clip.id}
          from={clip.startFrame}
          durationInFrames={clip.durationFrames}
        >
          <VideoClipComponent clip={clip} />
        </Sequence>
      ))}

      {/* Component Overlays */}
      {sortedComponents.map((comp) => (
        <Sequence
          key={comp.id}
          from={comp.startFrame}
          durationInFrames={comp.durationFrames}
        >
          <ComponentRenderer component={comp} />
        </Sequence>
      ))}

      {/* Audio Track */}
      {safeManifest.tracks.audio.map((audio) => (
        <Sequence
          key={audio.id}
          from={audio.startFrame}
          durationInFrames={audio.durationFrames}
        >
          <Audio src={audio.url} volume={audio.volume} />
        </Sequence>
      ))}
    </AbsoluteFill>
  )
}

// =============================================================================
// Video Clip with Transitions
// =============================================================================

interface VideoClipComponentProps {
  clip: VideoClipProps
}

const VideoClipComponent: React.FC<VideoClipComponentProps> = ({ clip }) => {
  const frame = useCurrentFrame()

  // Calculate transition
  const transitionDuration = 15 // frames for transition
  const transitionStart = clip.durationFrames - transitionDuration

  // Apply effects
  let filterStyle = ''
  if (clip.effects) {
    for (const effect of clip.effects) {
      switch (effect.type) {
        case 'brightness':
          filterStyle += `brightness(${effect.value}) `
          break
        case 'contrast':
          filterStyle += `contrast(${effect.value}) `
          break
        case 'saturation':
          filterStyle += `saturate(${effect.value}) `
          break
        case 'blur':
          filterStyle += `blur(${effect.value}px) `
          break
        case 'grayscale':
          filterStyle += `grayscale(${effect.value}) `
          break
      }
    }
  }

  // Calculate transition opacity/transform
  const transitionStyle = calculateTransition(
    clip.transition || 'cut',
    frame,
    transitionStart,
    clip.durationFrames,
  )

  return (
    <AbsoluteFill
      style={{
        ...transitionStyle,
        filter: filterStyle || undefined,
      }}
    >
      <Video
        src={clip.url}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
        }}
      />
    </AbsoluteFill>
  )
}

// =============================================================================
// Transition Calculator
// =============================================================================

function calculateTransition(
  transition: TransitionType,
  frame: number,
  transitionStart: number,
  totalFrames: number,
): React.CSSProperties {
  if (frame < transitionStart) {
    return { opacity: 1 }
  }

  const progress = interpolate(frame, [transitionStart, totalFrames], [0, 1], {
    extrapolateRight: 'clamp',
  })

  switch (transition) {
    case 'fade':
      return {
        opacity: interpolate(progress, [0, 1], [1, 0]),
      }

    case 'slide-left':
      return {
        transform: `translateX(${interpolate(progress, [0, 1], [0, -100])}%)`,
      }

    case 'slide-right':
      return {
        transform: `translateX(${interpolate(progress, [0, 1], [0, 100])}%)`,
      }

    case 'zoom':
      return {
        transform: `scale(${interpolate(progress, [0, 1], [1, 1.5])})`,
        opacity: interpolate(progress, [0, 1], [1, 0]),
      }

    case 'glitch': {
      // Simple glitch effect using random offsets
      const glitchOffset = Math.sin(frame * 10) * 5
      return {
        transform: `translateX(${glitchOffset}px)`,
        filter: progress > 0.5 ? 'hue-rotate(90deg)' : undefined,
      }
    }

    case 'cut':
    default:
      return { opacity: 1 }
  }
}

// =============================================================================
// Component Renderer
// =============================================================================

interface ComponentRendererProps {
  component: ComponentOverlayProps
}

const ComponentRenderer: React.FC<ComponentRendererProps> = ({ component }) => {
  const props = component.props

  switch (component.component) {
    case 'KaraokeText':
      return <KaraokeText {...(props as KaraokeTextProps)} />

    case 'BigTitle':
      return <BigTitle {...(props as BigTitleProps)} />

    case 'ImageOverlay':
      return <ImageOverlay {...(props as ImageOverlayProps)} />

    case 'LowerThird':
      return <LowerThird {...(props as LowerThirdProps)} />

    default:
      console.warn(`Unknown component type: ${component.component}`)
      return null
  }
}

// =============================================================================
// Default Export
// =============================================================================

export default VideoComposition
