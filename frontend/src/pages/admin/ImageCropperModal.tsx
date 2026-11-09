import { useEffect, useRef, useState } from 'react'
import { Check, RotateCcw, RotateCw, X, ZoomIn, ZoomOut } from 'lucide-react'

type ImageCropperModalProps = {
  file: File
  aspectRatio?: number
  onCrop: (croppedBlob: Blob) => void
  onCancel: () => void
}

const VIEW_SIZE = 340
const OUTPUT_SIZE = 800

export default function ImageCropperModal({
  file,
  aspectRatio = 1,
  onCrop,
  onCancel,
}: ImageCropperModalProps) {
  const [image, setImage] = useState<HTMLImageElement | null>(null)
  const [zoom, setZoom] = useState(1)
  const [rotation, setRotation] = useState(0)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0, panX: 0, panY: 0 })
  const canvasRef = useRef<HTMLCanvasElement | null>(null)

  // Load image object URL
  useEffect(() => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.decoding = 'async'
    img.onload = () => setImage(img)
    img.src = url
    return () => URL.revokeObjectURL(url)
  }, [file])

  // Reset transforms
  const handleReset = () => {
    setZoom(1)
    setRotation(0)
    setPan({ x: 0, y: 0 })
  }

  // Draw preview canvas
  useEffect(() => {
    if (!image || !canvasRef.current) return
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // DPR handling for crisp display
    const dpr = window.devicePixelRatio || 1
    canvas.width = VIEW_SIZE * dpr
    canvas.height = VIEW_SIZE * dpr
    ctx.scale(dpr, dpr)

    const isFlipped = rotation === 90 || rotation === 270
    const effW = isFlipped ? image.naturalHeight : image.naturalWidth
    const effH = isFlipped ? image.naturalWidth : image.naturalHeight
    const baseScale = Math.max(VIEW_SIZE / effW, VIEW_SIZE / effH)
    const scale = baseScale * zoom

    const dispW = effW * scale
    const dispH = effH * scale
    const maxPanX = Math.max(0, (dispW - VIEW_SIZE) / 2)
    const maxPanY = Math.max(0, (dispH - VIEW_SIZE) / 2)
    const clampedX = Math.max(-maxPanX, Math.min(maxPanX, pan.x))
    const clampedY = Math.max(-maxPanY, Math.min(maxPanY, pan.y))

    // Clear background
    ctx.fillStyle = '#0f171d'
    ctx.fillRect(0, 0, VIEW_SIZE, VIEW_SIZE)

    // Draw rotated and scaled image
    ctx.save()
    ctx.translate(VIEW_SIZE / 2 + clampedX, VIEW_SIZE / 2 + clampedY)
    ctx.rotate((rotation * Math.PI) / 180)
    ctx.drawImage(
      image,
      (-image.naturalWidth * scale) / 2,
      (-image.naturalHeight * scale) / 2,
      image.naturalWidth * scale,
      image.naturalHeight * scale
    )
    ctx.restore()

    // Draw crop guidelines (rule-of-thirds grid)
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.28)'
    ctx.lineWidth = 1
    // Vertical grid
    ctx.beginPath()
    ctx.moveTo(VIEW_SIZE / 3, 0)
    ctx.lineTo(VIEW_SIZE / 3, VIEW_SIZE)
    ctx.moveTo((VIEW_SIZE * 2) / 3, 0)
    ctx.lineTo((VIEW_SIZE * 2) / 3, VIEW_SIZE)
    // Horizontal grid
    ctx.moveTo(0, VIEW_SIZE / 3)
    ctx.lineTo(VIEW_SIZE, VIEW_SIZE / 3)
    ctx.moveTo(0, (VIEW_SIZE * 2) / 3)
    ctx.lineTo(VIEW_SIZE, (VIEW_SIZE * 2) / 3)
    ctx.stroke()

    // Outer border
    ctx.strokeStyle = '#FEBE01'
    ctx.lineWidth = 2
    ctx.strokeRect(1, 1, VIEW_SIZE - 2, VIEW_SIZE - 2)

    // Circular overlay preview
    ctx.strokeStyle = 'rgba(254, 190, 1, 0.45)'
    ctx.beginPath()
    ctx.arc(VIEW_SIZE / 2, VIEW_SIZE / 2, VIEW_SIZE / 2 - 4, 0, Math.PI * 2)
    ctx.stroke()
  }, [image, zoom, rotation, pan])

  // Mouse / Pointer handlers
  const handlePointerDown = (e: React.PointerEvent) => {
    setIsDragging(true)
    setDragStart({ x: e.clientX, y: e.clientY, panX: pan.x, panY: pan.y })
    ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
  }

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging || !image) return
    const isFlipped = rotation === 90 || rotation === 270
    const effW = isFlipped ? image.naturalHeight : image.naturalWidth
    const effH = isFlipped ? image.naturalWidth : image.naturalHeight
    const baseScale = Math.max(VIEW_SIZE / effW, VIEW_SIZE / effH)
    const scale = baseScale * zoom
    const maxPanX = Math.max(0, (effW * scale - VIEW_SIZE) / 2)
    const maxPanY = Math.max(0, (effH * scale - VIEW_SIZE) / 2)

    const deltaX = e.clientX - dragStart.x
    const deltaY = e.clientY - dragStart.y
    const nextX = dragStart.panX + deltaX
    const nextY = dragStart.panY + deltaY

    setPan({
      x: Math.max(-maxPanX, Math.min(maxPanX, nextX)),
      y: Math.max(-maxPanY, Math.min(maxPanY, nextY)),
    })
  }

  const handlePointerUp = (e: React.PointerEvent) => {
    setIsDragging(false)
    try {
      ;(e.target as HTMLElement).releasePointerCapture(e.pointerId)
    } catch {}
  }

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault()
    const delta = e.deltaY > 0 ? -0.1 : 0.1
    setZoom(current => Math.max(1, Math.min(3.5, current + delta)))
  }

  // Export cropped Blob
  const handleApply = () => {
    if (!image) return
    const isFlipped = rotation === 90 || rotation === 270
    const effW = isFlipped ? image.naturalHeight : image.naturalWidth
    const effH = isFlipped ? image.naturalWidth : image.naturalHeight
    const baseScale = Math.max(VIEW_SIZE / effW, VIEW_SIZE / effH)
    const scale = baseScale * zoom

    const maxPanX = Math.max(0, (effW * scale - VIEW_SIZE) / 2)
    const maxPanY = Math.max(0, (effH * scale - VIEW_SIZE) / 2)
    const clampedX = Math.max(-maxPanX, Math.min(maxPanX, pan.x))
    const clampedY = Math.max(-maxPanY, Math.min(maxPanY, pan.y))

    const outCanvas = document.createElement('canvas')
    outCanvas.width = OUTPUT_SIZE
    outCanvas.height = Math.round(OUTPUT_SIZE / aspectRatio)
    const ctx = outCanvas.getContext('2d')
    if (!ctx) return

    const ratio = OUTPUT_SIZE / VIEW_SIZE
    ctx.translate(OUTPUT_SIZE / 2 + clampedX * ratio, outCanvas.height / 2 + clampedY * ratio)
    ctx.rotate((rotation * Math.PI) / 180)
    const outScale = scale * ratio

    ctx.drawImage(
      image,
      (-image.naturalWidth * outScale) / 2,
      (-image.naturalHeight * outScale) / 2,
      image.naturalWidth * outScale,
      image.naturalHeight * outScale
    )

    outCanvas.toBlob(
      blob => {
        if (blob) {
          onCrop(blob)
        }
      },
      'image/webp',
      0.88
    )
  }

  return (
    <div className="a-crop-modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="crop-title">
      <div className="a-crop-modal-dialog">
        <div className="a-dialog-head">
          <div>
            <h2 id="crop-title" style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800 }}>
              Crop Profile Photo
            </h2>
            <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: '#5c7281' }}>
              Drag to reposition, use the slider to zoom, or rotate to frame the face.
            </p>
          </div>
          <button type="button" className="a-icon-button" onClick={onCancel} aria-label="Close crop dialog">
            <X size={18} />
          </button>
        </div>

        <div
          className="a-crop-viewport"
          style={{
            width: VIEW_SIZE,
            height: VIEW_SIZE,
            margin: '0 auto',
            borderRadius: 12,
            overflow: 'hidden',
            cursor: isDragging ? 'grabbing' : 'grab',
            touchAction: 'none',
            boxShadow: '0 8px 30px rgba(0, 0, 0, 0.25)',
          }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          onWheel={handleWheel}
        >
          <canvas
            ref={canvasRef}
            style={{
              width: VIEW_SIZE,
              height: VIEW_SIZE,
              display: 'block',
            }}
          />
        </div>

        {/* Controls */}
        <div style={{ marginTop: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Zoom Slider */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, paddingInline: 8 }}>
            <ZoomOut size={16} style={{ color: '#5c7281', flexShrink: 0 }} />
            <input
              type="range"
              min={1}
              max={3}
              step={0.02}
              value={zoom}
              onChange={e => setZoom(Number(e.target.value))}
              aria-label="Zoom photo"
              style={{ flex: 1, accentColor: '#0874ad', cursor: 'pointer' }}
            />
            <ZoomIn size={16} style={{ color: '#5c7281', flexShrink: 0 }} />
            <span style={{ fontSize: '0.8rem', fontWeight: 700, minWidth: 38, textAlign: 'right', color: '#5c7281' }}>
              {Math.round(zoom * 100)}%
            </span>
          </div>

          {/* Action buttons */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: 10 }}>
            <button
              type="button"
              className="a-button secondary"
              style={{ fontSize: '0.8rem', padding: '6px 14px' }}
              onClick={() => setRotation(r => (r + 90) % 360)}
            >
              <RotateCw size={14} /> Rotate 90°
            </button>
            <button
              type="button"
              className="a-button secondary"
              style={{ fontSize: '0.8rem', padding: '6px 14px' }}
              onClick={handleReset}
            >
              <RotateCcw size={14} /> Reset
            </button>
          </div>
        </div>

        {/* Dialog footer */}
        <div
          style={{
            marginTop: 24,
            display: 'flex',
            justifyContent: 'flex-end',
            gap: 10,
            borderTop: '1px solid #e1ebef',
            paddingTop: 16,
          }}
        >
          <button type="button" className="a-button secondary" onClick={onCancel}>
            Cancel
          </button>
          <button type="button" className="a-button primary" onClick={handleApply}>
            <Check size={16} /> Apply &amp; Upload
          </button>
        </div>
      </div>
    </div>
  )
}
