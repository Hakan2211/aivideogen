/**
 * Image Overlay Component
 *
 * Displays an image (logo, watermark, etc.) at a specific position.
 */

import { AbsoluteFill, Img, interpolate, useCurrentFrame } from 'remotion'
import type { ImageOverlayProps } from '../../types'

export const ImageOverlay: React.FC<ImageOverlayProps> = ({
  src,
  width = 200,
  height,
  x = 50,
  y = 50,
  opacity = 1,
}) => {
  const frame = useCurrentFrame()

  // Fade in animation
  const fadeIn = interpolate(frame, [0, 15], [0, opacity], {
    extrapolateRight: 'clamp',
  })

  return (
    <AbsoluteFill>
      <div
        style={{
          position: 'absolute',
          left: `${x}%`,
          top: `${y}%`,
          transform: 'translate(-50%, -50%)',
          opacity: fadeIn,
        }}
      >
        <Img
          src={src}
          style={{
            width,
            height: height || 'auto',
            objectFit: 'contain',
          }}
        />
      </div>
    </AbsoluteFill>
  )
}

export default ImageOverlay
