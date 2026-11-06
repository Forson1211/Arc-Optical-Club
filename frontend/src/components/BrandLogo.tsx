import { optimizedImageSrc } from '../lib/images'

type Props = { className?: string; variant?: 'light' | 'color' | 'white'; alt?: string }

export default function BrandLogo({ className = '', variant = 'light' }: Props) {
  const isColor = variant === 'color'
  const isWhite = variant === 'white'

  // Standardized 2.608 aspect ratio for all variants so color and light match in size identically
  const viewBox = isColor
    ? '56 66 360 138'
    : isWhite
      ? '65 85 437 156'
      : '77 99 446 171'

  const imageSrc = optimizedImageSrc(
    isColor
      ? '/images/arc-optical-club-logo-color.png'
      : isWhite
        ? '/images/arc-optical-club-logo-white.png'
        : '/images/arc-optical-club-logo-light.png'
  )

  const width = isColor ? 486 : isWhite ? 583 : 607
  const height = isColor ? 261 : isWhite ? 313 : 355

  return (
    <svg
      viewBox="0 0 446 171"
      className={className}
      aria-hidden="true"
      focusable="false"
      preserveAspectRatio="xMinYMid meet"
    >
      <svg
        x={0}
        y={0}
        width={446}
        height={171}
        viewBox={viewBox}
        preserveAspectRatio="xMinYMid meet"
      >
        <image
          href={imageSrc}
          x={0}
          y={0}
          width={width}
          height={height}
        />
      </svg>
    </svg>
  )
}
