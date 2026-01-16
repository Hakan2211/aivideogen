/**
 * Remotion Module
 *
 * Exports for video composition and playback.
 */

// Main composition
export { VideoComposition } from './Composition'
export { RemotionRoot } from './Root'

// Types
export type {
  CompositionProps,
  ProjectManifest,
  VideoClipProps,
  AudioClipProps,
  ComponentOverlayProps,
  WordTimestampProps,
  ClipEffectProps,
  ComponentType,
  TransitionType,
  KaraokeTextProps,
  BigTitleProps,
  ImageOverlayProps,
  LowerThirdProps,
  PlayerState,
  TimelineTrack,
  TimelineClip,
  TimelineSelection,
} from './types'

// Utilities
export { createEmptyManifest } from './types'

// Overlay components
export { KaraokeText } from './components/overlays/KaraokeText'
export { BigTitle } from './components/overlays/BigTitle'
export { ImageOverlay } from './components/overlays/ImageOverlay'
export { LowerThird } from './components/overlays/LowerThird'
