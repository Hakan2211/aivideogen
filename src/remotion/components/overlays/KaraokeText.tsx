/**
 * Karaoke Text Component
 *
 * Displays text with word-by-word highlighting synchronized to audio timestamps.
 */

import { AbsoluteFill, useCurrentFrame, useVideoConfig } from 'remotion'
import type { KaraokeTextProps } from '../../types'

export const KaraokeText: React.FC<KaraokeTextProps> = ({
  wordTimestamps,
  fontSize = 48,
  fontFamily = 'Arial, sans-serif',
  color = '#ffffff',
  highlightColor = '#ffff00',
  backgroundColor = 'rgba(0, 0, 0, 0.5)',
  position = 'bottom',
}) => {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()

  // Convert frame to seconds
  const currentTime = frame / fps

  // Get position styles based on position prop
  const getPositionStyles = (): React.CSSProperties => {
    switch (position) {
      case 'top':
        return { top: '10%', bottom: 'auto' }
      case 'center':
        return { top: '50%', transform: 'translateY(-50%)' }
      case 'bottom':
      default:
        return { bottom: '10%', top: 'auto' }
    }
  }

  return (
    <AbsoluteFill
      style={{
        justifyContent: 'center',
        alignItems: 'center',
        ...getPositionStyles(),
      }}
    >
      <div
        style={{
          backgroundColor,
          padding: '16px 32px',
          borderRadius: 8,
          maxWidth: '80%',
          textAlign: 'center',
        }}
      >
        <p
          style={{
            fontSize,
            fontFamily,
            margin: 0,
            lineHeight: 1.4,
          }}
        >
          {wordTimestamps.map((wordData, index) => {
            const isActive =
              currentTime >= wordData.start && currentTime <= wordData.end
            const isPast = currentTime > wordData.end

            return (
              <span
                key={index}
                style={{
                  color: isActive || isPast ? highlightColor : color,
                  fontWeight: isActive ? 'bold' : 'normal',
                  transition: 'color 0.1s ease',
                  textShadow: isActive
                    ? `0 0 10px ${highlightColor}, 0 0 20px ${highlightColor}`
                    : 'none',
                }}
              >
                {wordData.word}
                {index < wordTimestamps.length - 1 ? ' ' : ''}
              </span>
            )
          })}
        </p>
      </div>
    </AbsoluteFill>
  )
}

export default KaraokeText
