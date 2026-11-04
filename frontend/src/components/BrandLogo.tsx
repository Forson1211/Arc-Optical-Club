type Props = { className?: string; variant?: 'light' | 'color' }

export default function BrandLogo({ className = '', variant = 'light' }: Props) {
  const isColor = variant === 'color'

  return (
    <svg
      viewBox={isColor ? '52 68 369 135' : '73 95 455 180'}
      width={160}
      height={58}
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      {/* Frame the supplied artwork without its transparent canvas padding. */}
      <image
        href={isColor ? '/images/arc-optical-club-logo-color.png' : '/images/arc-optical-club-logo-light.png'}
        x={0}
        y={0}
        width={isColor ? 486 : 607}
        height={isColor ? 261 : 355}
      />
    </svg>
  )
}
