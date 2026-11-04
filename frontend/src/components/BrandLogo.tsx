type Props = { className?: string; variant?: 'light' | 'color' }

export default function BrandLogo({ className = '', variant = 'light' }: Props) {
  const isColor = variant === 'color'

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
        viewBox={isColor ? '52 68 369 135' : '73 95 455 180'}
        preserveAspectRatio="none"
      >
        <image
          href={isColor ? '/images/arc-optical-club-logo-color.png' : '/images/arc-optical-club-logo-light.png'}
          x={0}
          y={0}
          width={isColor ? 486 : 607}
          height={isColor ? 261 : 355}
        />
      </svg>
    </svg>
  )
}
