/**
 * Big Title Component
 *
 * Animated title overlay with various entrance animations.
 */

import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion'
import type { BigTitleProps } from '../../types'

export const BigTitle: React.FC<BigTitleProps> = ({
  text,
  fontSize = 72,
  fontFamily = 'Arial Black, sans-serif',
  color = '#ffffff',
  animation = 'fade',
  position = 'center',
}) => {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()

  // Get position styles
  const getPositionStyles = (): React.CSSProperties => {
    switch (position) {
      case 'top':
        return { top: '15%', bottom: 'auto' }
      case 'bottom':
        return { bottom: '15%', top: 'auto' }
      case 'center':
      default:
        return { top: '50%', transform: 'translateY(-50%)' }
    }
  }

  // Calculate animation values
  const getAnimationStyles = (): React.CSSProperties => {
    const entranceDuration = 20 // frames

    switch (animation) {
      case 'fade': {
        const opacity = interpolate(frame, [0, entranceDuration], [0, 1], {
          extrapolateRight: 'clamp',
        })
        return { opacity }
      }

      case 'slide-up': {
        const progress = spring({
          frame,
          fps,
          config: { damping: 12, stiffness: 100 },
        })
        const translateY = interpolate(progress, [0, 1], [100, 0])
        const opacity = interpolate(frame, [0, 10], [0, 1], {
          extrapolateRight: 'clamp',
        })
        return {
          transform: `translateY(${translateY}px)`,
          opacity,
        }
      }

      case 'scale': {
        const progress = spring({
          frame,
          fps,
          config: { damping: 10, stiffness: 80 },
        })
        const scale = interpolate(progress, [0, 1], [0.5, 1])
        const opacity = interpolate(frame, [0, 10], [0, 1], {
          extrapolateRight: 'clamp',
        })
        return {
          transform: `scale(${scale})`,
          opacity,
        }
      }

      case 'typewriter': {
        const charsToShow = Math.floor(
          interpolate(frame, [0, text.length * 3], [0, text.length], {
            extrapolateRight: 'clamp',
          }),
        )
        // Return empty style, text will be handled separately
        return { '--chars-to-show': charsToShow } as React.CSSProperties
      }

      default:
        return { opacity: 1 }
    }
  }

  const animationStyles = getAnimationStyles()

  // Handle typewriter animation differently
  const displayText =
    animation === 'typewriter'
      ? text.slice(
          0,
          (animationStyles as { '--chars-to-show'?: number })[
            '--chars-to-show'
          ] || 0,
        )
      : text

  return (
    <AbsoluteFill
      style={{
        justifyContent: 'center',
        alignItems: 'center',
        ...getPositionStyles(),
      }}
    >
      <h1
        style={{
          fontSize,
          fontFamily,
          color,
          margin: 0,
          textAlign: 'center',
          textShadow: '2px 2px 4px rgba(0, 0, 0, 0.5)',
          ...animationStyles,
        }}
      >
        {displayText}
      </h1>
    </AbsoluteFill>
  )
}

export default BigTitle
