import React, { useEffect, useMemo, useState } from 'react'
import { deleteImage, listImages, uploadBulkImages, uploadSingleImage } from '../../Api/megaImages'

function UploadPhoto() {
  // Public-only module (as per requirement)
  const isPublic = true
  const includeLinks = true
  const provider = 'cloudinary'
  const folder = 'best-moments'

  const [singleFile, setSingleFile] = useState(null)
  const [bulkFiles, setBulkFiles] = useState([])

  const [loading, setLoading] = useState(false)
  const [uploadingSingle, setUploadingSingle] = useState(false)
  const [uploadingBulk, setUploadingBulk] = useState(false)
  const [deletingId, setDeletingId] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [items, setItems] = useState([])

  const images = useMemo(() => {
    // API shape varies: sometimes { files: [] }, sometimes { images: [] }
    if (Array.isArray(items?.files)) return items.files
    if (Array.isArray(items?.images)) return items.images
    if (Array.isArray(items)) return items
    return []
  }, [items])

  const refresh = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await listImages({ isPublic, includeLinks, provider, folder })
      setItems(res)
    } catch (err) {
      const msg = typeof err === 'string' ? err : err?.message
      setError(msg || 'Failed to load images')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    refresh()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const onUploadSingle = async () => {
    if (!singleFile) {
      setError('Please choose one image first.')
      return
    }
    setUploadingSingle(true)
    setError('')
    setSuccess('')
    try {
      const res = await uploadSingleImage(singleFile, { isPublic, provider, folder })
      setSuccess(res?.message || 'Image uploaded successfully')
      setSingleFile(null)
      await refresh()
    } catch (err) {
      const msg = typeof err === 'string' ? err : err?.message
      setError(msg || 'Upload failed')
    } finally {
      setUploadingSingle(false)
    }
  }

  const onUploadBulk = async () => {
    if (!bulkFiles || bulkFiles.length === 0) {
      setError('Please choose images first.')
      return
    }
    setUploadingBulk(true)
    setError('')
    setSuccess('')
    try {
      const res = await uploadBulkImages(bulkFiles, { isPublic, provider, folder })
      setSuccess(res?.message || `Uploaded ${res?.count || bulkFiles.length} images`)
      setBulkFiles([])
      await refresh()
    } catch (err) {
      const msg = typeof err === 'string' ? err : err?.message
      setError(msg || 'Bulk upload failed')
    } finally {
      setUploadingBulk(false)
    }
  }

  const onCopy = async (text) => {
    try {
      await navigator.clipboard.writeText(text)
      setSuccess('Link copied!')
      setTimeout(() => setSuccess(''), 1500)
    } catch {
      setError('Copy failed. Please copy manually.')
    }
  }

  const onDelete = async (nodeId) => {
    if (!nodeId) return
    const ok = window.confirm('Delete this image?')
    if (!ok) return

    setDeletingId(nodeId)
    setError('')
    setSuccess('')
    try {
      const res = await deleteImage(nodeId, { provider })
      setSuccess(res?.message || 'Deleted')
      await refresh()
    } catch (err) {
      setError(err?.message || 'Delete failed')
    } finally {
      setDeletingId('')
    }
  }

  return (
    <div className="space-y-4" style={{ fontFamily: "'Lexend', sans-serif" }}>
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-2xl font-black text-[#0d141b] dark:text-white">Upload Photo</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Upload images to Cloudinary. Public uploads appear automatically in website gallery Best moments.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={refresh}
            className="inline-flex items-center gap-2 text-xs font-black px-3 py-2 rounded-xl border border-cyan-200/30 dark:border-cyan-700/50 hover:bg-cyan-50/30 dark:hover:bg-cyan-900/10 text-cyan-200"
          >
            <span className="material-symbols-outlined text-base">refresh</span>
            Refresh
          </button>
        </div>
      </div>

      {/* Toggles */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1 text-xs font-black px-3 py-1 rounded-full bg-cyan-300/15 text-cyan-200 border border-cyan-400/30">
            <span className="material-symbols-outlined text-sm">public</span>
            Public Only
          </span>
          <span className="text-xs text-slate-500 dark:text-slate-400">
            All uploads are public and list shows public images with links.
          </span>
        </div>
        <div className="text-xs text-slate-500 dark:text-slate-400">
          Provider: <span className="font-black">Cloudinary</span> · Folder: <span className="font-black">public/best-moments</span>
        </div>
      </div>

      {error ? (
        <div className="bg-red-50 dark:bg-red-900/20 rounded-2xl border border-red-200 dark:border-red-800 p-4">
          <p className="text-sm font-bold text-red-700 dark:text-red-300">{error}</p>
        </div>
      ) : null}
      {success ? (
        <div className="bg-green-50 dark:bg-green-900/20 rounded-2xl border border-green-200 dark:border-green-800 p-4">
          <p className="text-sm font-bold text-green-700 dark:text-green-300">{success}</p>
        </div>
      ) : null}

      {/* Upload cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm font-black">Upload Single Image</p>
            <span className="text-xs text-slate-500 dark:text-slate-400">field: image</span>
          </div>

          <div className="mt-3">
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setSingleFile(e.target.files?.[0] || null)}
              className="block w-full text-sm text-slate-600 dark:text-slate-300 file:mr-3 file:py-2 file:px-3 file:rounded-xl file:border-0 file:bg-cyan-300/15 file:text-cyan-200 file:font-black hover:file:bg-cyan-300/20 file:border file:border-cyan-400/30"
            />
            {singleFile ? (
              <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                Selected: <span className="font-bold">{singleFile.name}</span>
              </p>
            ) : null}
          </div>

          <button
            onClick={onUploadSingle}
            disabled={uploadingSingle}
            className="mt-4 w-full inline-flex items-center justify-center gap-2 font-black px-4 py-3 rounded-xl bg-cyan-500 text-white hover:bg-cyan-500/90 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-cyan-500/20"
          >
            {uploadingSingle ? (
              <>
                <span className="material-symbols-outlined animate-spin">sync</span>
                Uploading...
              </>
            ) : (
              <>
                <span className="material-symbols-outlined">upload</span>
                Upload
              </>
            )}
          </button>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm font-black">Upload Bulk Images</p>
            <span className="text-xs text-slate-500 dark:text-slate-400">field: images</span>
          </div>

          <div className="mt-3">
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={(e) => setBulkFiles(Array.from(e.target.files || []))}
              className="block w-full text-sm text-slate-600 dark:text-slate-300 file:mr-3 file:py-2 file:px-3 file:rounded-xl file:border-0 file:bg-cyan-300/15 file:text-cyan-200 file:font-black hover:file:bg-cyan-300/20 file:border file:border-cyan-400/30"
            />
            {bulkFiles?.length ? (
              <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                Selected: <span className="font-bold">{bulkFiles.length}</span> files
              </p>
            ) : null}
          </div>

          <button
            onClick={onUploadBulk}
            disabled={uploadingBulk}
            className="mt-4 w-full inline-flex items-center justify-center gap-2 font-black px-4 py-3 rounded-xl bg-cyan-500 text-white hover:bg-cyan-500/90 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-cyan-500/20"
          >
            {uploadingBulk ? (
              <>
                <span className="material-symbols-outlined animate-spin">sync</span>
                Uploading...
              </>
            ) : (
              <>
                <span className="material-symbols-outlined">upload</span>
                Upload Bulk
              </>
            )}
          </button>
        </div>
      </div>

      {/* List */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between gap-2">
          <p className="text-sm font-black">Images</p>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Count: <span className="font-black">{images.length}</span>
          </p>
        </div>

        {loading ? (
          <div className="p-6 flex items-center gap-2 text-cyan-200">
            <span className="material-symbols-outlined animate-spin">sync</span>
            <span className="text-sm font-bold">Loading...</span>
          </div>
        ) : images.length === 0 ? (
          <div className="p-6 text-sm text-slate-600 dark:text-slate-300">No images found.</div>
        ) : (
          <div className="overflow-x-auto table-scrollbar" style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgb(99, 126, 153) rgb(224, 242, 254)' }}>
            <table className="w-full">
              <thead className="bg-cyan-500 dark:bg-cyan-500">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-white">
                    Name
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-white">
                    Size
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-white">
                    NodeId
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-white">
                    Link
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-bold uppercase tracking-wider text-white">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                {images.map((img) => {
                  const name = img?.name || '--'
                  const size = img?.size ?? '--'
                  const nodeId = img?.nodeId || img?.node_id || '--'
                  const url = img?.url || img?.link || ''
                  return (
                    <tr key={nodeId} className="hover:bg-cyan-50/30 dark:hover:bg-cyan-900/10 border-b border-cyan-200/30 dark:border-cyan-700/50">
                      <td className="px-4 py-3 text-sm font-bold text-slate-900 dark:text-white">
                        {name}
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-300">
                        {typeof size === 'number' ? `${Math.round(size / 1024)} KB` : size}
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-300">
                        <span className="font-mono text-xs">{nodeId}</span>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {url ? (
                          <button
                            onClick={() => onCopy(url)}
                            className="inline-flex items-center gap-1 text-xs font-black px-2.5 py-1 rounded-full bg-cyan-300/15 text-cyan-200 hover:bg-cyan-300/20 border border-cyan-400/30"
                            title="Copy link"
                          >
                            <span className="material-symbols-outlined text-sm">content_copy</span>
                            Copy
                          </button>
                        ) : (
                          <span className="text-xs text-slate-400">No link</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => onDelete(nodeId)}
                          disabled={deletingId === nodeId}
                          className="inline-flex items-center justify-center gap-1 text-xs font-black px-3 py-1.5 rounded-xl bg-red-50 text-red-700 hover:bg-red-100 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-red-900/20 dark:text-red-300 dark:hover:bg-red-900/30"
                        >
                          {deletingId === nodeId ? (
                            <>
                              <span className="material-symbols-outlined animate-spin text-sm">sync</span>
                              Deleting
                            </>
                          ) : (
                            <>
                              <span className="material-symbols-outlined text-sm">delete</span>
                              Delete
                            </>
                          )}
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

export default UploadPhoto


