import { imageManifest } from '../data/image-manifest'

export function imageVariant(src: string) {
  try { return imageManifest[decodeURIComponent(src)] } catch { return undefined }
}

export const optimizedImageSrc = (src: string) => imageVariant(src)?.src || src

// Prepare future admin photos before uploading; no original file is modified.
export async function optimizeImageUpload(file: File): Promise<Blob> {
  const url = URL.createObjectURL(file)
  try {
    const image = new Image()
    image.decoding = 'async'; image.src = url
    await image.decode()
    const scale = Math.min(1, 1600 / Math.max(image.naturalWidth, image.naturalHeight))
    const canvas = document.createElement('canvas')
    canvas.width = Math.max(1, Math.round(image.naturalWidth * scale))
    canvas.height = Math.max(1, Math.round(image.naturalHeight * scale))
    const context = canvas.getContext('2d')
    if (!context) return file
    context.drawImage(image, 0, 0, canvas.width, canvas.height)
    const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, 'image/webp', .82))
    return blob && blob.size < file.size ? blob : file
  } catch { return file }
  finally { URL.revokeObjectURL(url) }
}
