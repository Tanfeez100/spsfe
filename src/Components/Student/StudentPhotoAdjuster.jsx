import React from 'react'

export const DEFAULT_PHOTO_ADJUSTMENT = {
  zoom: 1,
  x: 0,
  y: 0,
}

const OUTPUT_WIDTH = 318
const OUTPUT_HEIGHT = 414

const loadImageFromFile = (file) => (
  new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const image = new Image()
    image.onload = () => {
      URL.revokeObjectURL(url)
      resolve(image)
    }
    image.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Unable to load selected photo'))
    }
    image.src = url
  })
)

export const createAdjustedStudentPhotoFile = async (file, adjustment = DEFAULT_PHOTO_ADJUSTMENT) => {
  if (!file) return null

  const image = await loadImageFromFile(file)
  const canvas = document.createElement('canvas')
  canvas.width = OUTPUT_WIDTH
  canvas.height = OUTPUT_HEIGHT

  const context = canvas.getContext('2d')
  context.fillStyle = '#ffffff'
  context.fillRect(0, 0, OUTPUT_WIDTH, OUTPUT_HEIGHT)
  context.imageSmoothingEnabled = true
  context.imageSmoothingQuality = 'high'

  const baseScale = Math.min(OUTPUT_WIDTH / image.naturalWidth, OUTPUT_HEIGHT / image.naturalHeight)
  const scale = baseScale * Number(adjustment.zoom || 1)
  const drawWidth = image.naturalWidth * scale
  const drawHeight = image.naturalHeight * scale
  const offsetX = (Number(adjustment.x || 0) / 100) * (OUTPUT_WIDTH / 2)
  const offsetY = (Number(adjustment.y || 0) / 100) * (OUTPUT_HEIGHT / 2)
  const drawX = (OUTPUT_WIDTH - drawWidth) / 2 + offsetX
  const drawY = (OUTPUT_HEIGHT - drawHeight) / 2 + offsetY

  context.drawImage(image, drawX, drawY, drawWidth, drawHeight)

  const blob = await new Promise((resolve, reject) => {
    canvas.toBlob((nextBlob) => {
      if (nextBlob) resolve(nextBlob)
      else reject(new Error('Unable to prepare adjusted photo'))
    }, 'image/jpeg', 0.92)
  })

  const baseName = String(file.name || 'student-photo').replace(/\.[^.]+$/, '')
  return new File([blob], `${baseName}-passport.jpg`, { type: 'image/jpeg' })
}

function StudentPhotoAdjuster({ previewUrl, adjustment, onChange }) {
  if (!previewUrl) return null

  const current = {
    ...DEFAULT_PHOTO_ADJUSTMENT,
    ...(adjustment || {}),
  }

  const update = (key, value) => {
    onChange?.({
      ...current,
      [key]: Number(value),
    })
  }

  const reset = () => onChange?.(DEFAULT_PHOTO_ADJUSTMENT)

  return (
    <div className="md:col-span-2 rounded-xl border border-slate-200 bg-slate-50 p-3">
      <div className="flex flex-col gap-4 sm:flex-row">
        <div className="mx-auto flex h-[207px] w-[159px] shrink-0 items-center justify-center overflow-hidden rounded-lg border border-slate-300 bg-white">
          <img
            src={previewUrl}
            alt="Adjusted student preview"
            className="h-full w-full object-contain"
            style={{
              transform: `translate(${current.x}%, ${current.y}%) scale(${current.zoom})`,
              transformOrigin: 'center center',
            }}
          />
        </div>

        <div className="min-w-0 flex-1 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs font-bold uppercase tracking-[0.08em] text-slate-600">Adjust Photo</p>
            <div className="flex gap-1.5">
              <button
                type="button"
                onClick={reset}
                className="rounded-lg border border-slate-300 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-100"
              >
                Original
              </button>
              <button
                type="button"
                onClick={() => onChange?.({ ...DEFAULT_PHOTO_ADJUSTMENT, zoom: 1.35 })}
                className="rounded-lg border border-cyan-200 bg-cyan-50 px-2.5 py-1 text-xs font-semibold text-cyan-700 hover:bg-cyan-100"
              >
                Fill
              </button>
            </div>
          </div>
          <p className="text-xs text-slate-500">
            Original full photo pehle dikhegi. Passport box fill karna ho toh zoom badhayein ya Fill dabayein.
          </p>

          <div className="space-y-3">
            <label className="block text-xs font-semibold text-slate-600">
              Zoom
              <input
                type="range"
                min="1"
                max="2.8"
                step="0.01"
                value={current.zoom}
                onChange={(event) => update('zoom', event.target.value)}
                className="mt-1 w-full accent-cyan-500"
              />
            </label>

            <label className="block text-xs font-semibold text-slate-600">
              Left / Right
              <input
                type="range"
                min="-35"
                max="35"
                step="1"
                value={current.x}
                onChange={(event) => update('x', event.target.value)}
                className="mt-1 w-full accent-cyan-500"
              />
            </label>

            <label className="block text-xs font-semibold text-slate-600">
              Up / Down
              <input
                type="range"
                min="-35"
                max="35"
                step="1"
                value={current.y}
                onChange={(event) => update('y', event.target.value)}
                className="mt-1 w-full accent-cyan-500"
              />
            </label>
          </div>
        </div>
      </div>
    </div>
  )
}

export default StudentPhotoAdjuster
