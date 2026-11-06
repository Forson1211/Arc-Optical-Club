import { optimizedImageSrc } from '../lib/images'

type Props = { className?: string; variant?: 'light' | 'color' | 'white' }

export default function BrandLogo({ className = '', variant = 'light' }: Props) {
  const isColor = variant === 'color'
  const isWhite = variant === 'white'

  return (
    <svg
      viewBox="0 0 369 135"
      width={160}
      height={58}
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      {/* Normalize both source crops to the same visible frame when variants swap. */}
      <svg
        x={0}
        y={0}
        width={369}
        height={135}
        viewBox={isColor ? '52 68 369 135' : isWhite ? '62 82 443 162' : '73 95 455 180'}
        preserveAspectRatio="none"
      >
        <image
          href={optimizedImageSrc(isColor ? '/images/arc-optical-club-logo-color.png' : isWhite ? '/images/arc-optical-club-logo-white.png' : '/images/arc-optical-club-logo-light.png')}
          x={0}
          y={0}
          width={isColor ? 486 : isWhite ? 583 : 607}
          height={isColor ? 261 : isWhite ? 313 : 355}
        />
      </svg>
    </svg>
  )
}
