type Props = { eyebrow?: string; title: string; description?: string; centered?: boolean }

export default function SectionHeading({ eyebrow, title, description, centered = false }: Props) {
  return (
    <div className={centered ? 'mx-auto max-w-2xl text-center' : 'max-w-2xl'}>
      {eyebrow && <p className="eyebrow mb-4 !text-arc-yellow">{eyebrow}</p>}
      <h2 className="section-title !text-white">{title}</h2>
      {description && <p className="mt-5 text-base leading-6 sm:leading-8 text-white/75">{description}</p>}
    </div>
  )
}
