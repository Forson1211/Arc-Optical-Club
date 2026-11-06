import type { ImgHTMLAttributes } from 'react'
import { imageVariant } from '../lib/images'

export default function SiteImage({ src = '', sizes = '100vw', srcSet, width, height, loading = 'lazy', decoding = 'async', fetchPriority = 'auto', ...props }: ImgHTMLAttributes<HTMLImageElement>) {
  const variant = imageVariant(src)
  return <img {...props} {...{ fetchpriority: fetchPriority }} src={variant?.src || src} srcSet={srcSet || variant?.srcSet} sizes={srcSet || variant?.srcSet ? sizes : undefined} width={width ?? variant?.width} height={height ?? variant?.height} loading={loading} decoding={decoding}/>
}
