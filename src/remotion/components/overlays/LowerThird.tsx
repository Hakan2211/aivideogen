/**
 * Lower Third Component
 *
 * Professional lower third graphics commonly used for names/titles.
 */

import {
  AbsoluteFill,
  useCurrentFrame,
  interpolate,
  spring,
  useVideoConfig,
} from 'remotion'
import type { LowerThirdProps } from '../../types'

export const LowerThird: React.FC<LowerThirdProps> = ({
  title,
  subtitle,
  backgroundColor = 'rgba(0, 0, 0, 0.8)',
  textColor = '#ffffff',
  position = 'left',
}) => {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()

  // Slide in animation
  const slideProgress = spring({
    frame,
    fps,
    config: { damping: 15, stiffness: 100 },
  })

  const slideX = interpolate(slideProgress, [0, 1], [-100, 0])

  // Get horizontal position
  const getHorizontalPosition = (): React.CSSProperties => {
    switch (position) {
      case 'right':
        return { right: '5%', left: 'auto' }
      case 'center':
        return {
          left: '50%',
          transform: `translateX(calc(-50% + ${slideX}px))`,
        }
      case 'left':
      default:
        return { left: '5%', right: 'auto' }
    }
  }

  const horizontalPos = getHorizontalPosition()
  const transformStyle =
    position === 'center' ? horizontalPos.transform : `translateX(${slideX}px)`

  return (
    <AbsoluteFill>
      <div
        style={{
          position: 'absolute',
          bottom: '10%',
          ...horizontalPos,
          transform: transformStyle,
          display: 'flex',
          flexDirection: 'column',
          gap: 4,
        }}
      >
        {/* Main title bar */}
        <div
          style={{
            backgroundColor,
            padding: '12px 24px',
            borderRadius: 4,
          }}
        >
          <h3
            style={{
              color: textColor,
              fontSize: 28,
              fontWeight: 'bold',
              margin: 0,
              fontFamily: 'Arial, sans-serif',
            }}
          >
            {title}
          </h3>
        </div>

        {/* Subtitle bar (optional) */}
        {subtitle && (
          <div
            style={{
              backgroundColor: `${backgroundColor}cc`, // Slightly more transparent
              padding: '8px 24px',
              borderRadius: 4,
              opacity: interpolate(frame, [10, 20], [0, 1], {
                extrapolateRight: 'clamp',
              }),
            }}
          >
            <p
              style={{
                color: textColor,
                fontSize: 18,
                margin: 0,
                fontFamily: 'Arial, sans-serif',
              }}
            >
              {subtitle}
            </p>
          </div>
        )}
      </div>
    </AbsoluteFill>
  )
}

export default LowerThird
