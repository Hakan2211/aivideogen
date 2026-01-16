/**
 * Remotion Root
 *
 * Entry point for Remotion compositions.
 * This file registers all available compositions.
 */

import { Composition } from 'remotion'
import { VideoComposition } from './Composition'
import { createEmptyManifest } from './types'

// Default composition settings
const DEFAULT_FPS = 30
const DEFAULT_WIDTH = 1080
const DEFAULT_HEIGHT = 1920
const DEFAULT_DURATION_SECONDS = 30

export const RemotionRoot: React.FC = () => {
  const emptyManifest = createEmptyManifest()

  return (
    <>
      {/* Main Video Composition (9:16 Vertical) */}
      <Composition
        id="VideoComposition"
        component={VideoComposition}
        durationInFrames={DEFAULT_DURATION_SECONDS * DEFAULT_FPS}
        fps={DEFAULT_FPS}
        width={DEFAULT_WIDTH}
        height={DEFAULT_HEIGHT}
        defaultProps={{
          manifest: emptyManifest,
        }}
      />

      {/* Horizontal variant (16:9) */}
      <Composition
        id="VideoComposition-Horizontal"
        component={VideoComposition}
        durationInFrames={DEFAULT_DURATION_SECONDS * DEFAULT_FPS}
        fps={DEFAULT_FPS}
        width={1920}
        height={1080}
        defaultProps={{
          manifest: emptyManifest,
        }}
      />

      {/* Square variant (1:1) */}
      <Composition
        id="VideoComposition-Square"
        component={VideoComposition}
        durationInFrames={DEFAULT_DURATION_SECONDS * DEFAULT_FPS}
        fps={DEFAULT_FPS}
        width={1080}
        height={1080}
        defaultProps={{
          manifest: emptyManifest,
        }}
      />
    </>
  )
}

export default RemotionRoot
