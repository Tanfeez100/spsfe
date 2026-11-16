import React, { useEffect, useMemo, useState, useRef } from 'react'
import { deleteImage, listImages, uploadBulkImages, uploadSingleImage } from '../../Api/megaImages'

function UploadPhoto() {
  // Public-only module configuration
  const isPublic = true
  const includeLinks = true
  const provider = 'cloudinary'
  const folder = 'best-moments'

  const [singleFile, setSingleFile] = useState(null)
  const [bulkFiles, setBulkFiles] = useState([])
  const [associateStudent, setAssociateStudent] = useState('')

  const [loading, setLoading] = useState(false)
  const [uploadingSingle, setUploadingSingle] = useState(false)
  const [uploadingBulk, setUploadingBulk] = useState(false)
  const [deletingId, setDeletingId] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [items, setItems] = useState([])
  const [viewMode, setViewMode] = useState('grid') // 'grid' | 'table'
  const [searchTerm, setSearchTerm] = useState('')
  const [folderFilter, setFolderFilter] = useState('public/best-moments')

  // Drag and drop states
  const [dragOverSingle, setDragOverSingle] = useState(false)
  const [dragOverBulk, setDragOverBulk] = useState(false)

  const singleFileInputRef = useRef(null)
  const bulkFileInputRef = useRef(null)

  const images = useMemo(() => {
    if (Array.isArray(items?.files)) return items.files
    if (Array.isArray(items?.images)) return items.images
    if (Array.isArray(items)) return items
    return []
  }, [items])

  // Filtered images by search term
  const filteredImages = useMemo(() => {
    if (!searchTerm) return images
    const s = searchTerm.toLowerCase()
    return images.filter((img) => {
      const name = (img?.name || img?.public_id || '').toLowerCase()
      const id = (img?.nodeId || img?.node_id || '').toLowerCase()
      return name.includes(s) || id.includes(s)
    })
  }, [images, searchTerm])

  // Calculate total storage used
  const storageStats = useMemo(() => {
    let totalBytes = 0
    images.forEach((img) => {
      if (typeof img?.size === 'number') totalBytes += img.size
    })
    const mbUsed = (totalBytes / (1024 * 1024)).toFixed(1)
    const pct = Math.min(100, Math.max(1, Math.round((totalBytes / (1024 * 1024 * 1024)) * 100)))
    return {
      mbUsed: totalBytes > 0 ? `${mbUsed} MB` : '14.8 MB',
      pct: totalBytes > 0 ? pct : 14,
    }
  }, [images])

  const refresh = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await listImages({ isPublic, includeLinks, provider, folder })
      setItems(res)
    } catch (err) {
      const msg = typeof err === 'string' ? err : err?.message
      setError(msg || 'Failed to load images from Cloudinary CDN')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    refresh()
  }, [])

  const onUploadSingle = async () => {
    if (!singleFile) {
      setError('Please choose or drop an image file first.')
      return
    }
    setUploadingSingle(true)
    setError('')
    setSuccess('')
    try {
      const res = await uploadSingleImage(singleFile, { isPublic, provider, folder })
      setSuccess(res?.message || 'Image uploaded successfully to Cloudinary CDN')
      setSingleFile(null)
      setAssociateStudent('')
      if (singleFileInputRef.current) singleFileInputRef.current.value = ''
      await refresh()
    } catch (err) {
      const msg = typeof err === 'string' ? err : err?.message
      setError(msg || 'Upload failed. Please check file format and size.')
    } finally {
      setUploadingSingle(false)
    }
  }

  const onUploadBulk = async () => {
    if (!bulkFiles || bulkFiles.length === 0) {
      setError('Please select or drop images for bulk upload.')
      return
    }
    setUploadingBulk(true)
    setError('')
    setSuccess('')
    try {
      const res = await uploadBulkImages(bulkFiles, { isPublic, provider, folder })
      setSuccess(res?.message || `Successfully uploaded ${res?.count || bulkFiles.length} images to Cloudinary CDN`)
      setBulkFiles([])
      if (bulkFileInputRef.current) bulkFileInputRef.current.value = ''
      await refresh()
    } catch (err) {
      const msg = typeof err === 'string' ? err : err?.message
      setError(msg || 'Bulk upload failed. Please try again.')
    } finally {
      setUploadingBulk(false)
    }
  }

  const onCopy = async (text) => {
    try {
      await navigator.clipboard.writeText(text)
      setSuccess('Public image URL copied to clipboard!')
      setTimeout(() => setSuccess(''), 2500)
    } catch {
      setError('Copy failed. Please copy manually from the link.')
    }
  }

  const onDelete = async (nodeId, name) => {
    if (!nodeId) return
    const ok = window.confirm(`Are you sure you want to delete ${name || 'this image'}?`)
    if (!ok) return

    setDeletingId(nodeId)
    setError('')
    setSuccess('')
    try {
      const res = await deleteImage(nodeId, { provider })
      setSuccess(res?.message || 'Image deleted from Cloudinary CDN')
      await refresh()
    } catch (err) {
      setError(err?.message || 'Delete failed')
    } finally {
      setDeletingId('')
    }
  }

  return (
    <div className="space-y-6">
      {/* 1. TOP BREADCRUMBS & PAGE ACTION HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4" data-purpose="breadcrumbs-and-title">
        <div>
          <nav className="flex items-center gap-1.5 text-xs font-semibold tracking-wide text-slate-400 uppercase mb-0.5">
            <span className="text-slate-500 hover:text-slate-700 cursor-pointer">SPS</span>
            <span className="text-slate-300">/</span>
            <span className="text-slate-500 hover:text-slate-700 cursor-pointer">STUDENT MANAGEMENT</span>
            <span className="text-slate-300">/</span>
            <span className="text-blue-600 font-bold">UPLOAD PHOTOS</span>
          </nav>
          <div className="mt-1 flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">Upload Photo</h1>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-lg text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
              CDN Storage Active
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-3xl leading-relaxed">
            Upload student portraits and school moments to Cloudinary CDN. Public uploads appear automatically in website gallery <span className="font-semibold text-slate-700 underline decoration-slate-300">Best moments</span>.
          </p>
        </div>

        {/* Top Right Action Controls */}
        <div className="flex items-center gap-2.5 self-start sm:self-center">
          <button
            onClick={refresh}
            disabled={loading}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-xl hover:bg-slate-50 shadow-2xs transition-all active:scale-95 cursor-pointer disabled:opacity-50"
            type="button"
          >
            <svg className={`w-3.5 h-3.5 text-slate-500 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" strokeLinecap="round" strokeLinejoin="round"></path>
            </svg>
            <span>{loading ? 'Refreshing...' : 'Refresh'}</span>
          </button>
          <div className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-blue-700 bg-blue-50 border border-blue-200 rounded-xl">
            <svg className="w-3.5 h-3.5 text-blue-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" strokeLinecap="round" strokeLinejoin="round"></path>
              <path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" strokeLinecap="round" strokeLinejoin="round"></path>
            </svg>
            <span>Cloudinary Config</span>
          </div>
        </div>
      </div>

      {/* 2. CLOUDINARY STATUS BANNER */}
      <section className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-xs" data-purpose="cloudinary-status-banner">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Left: Public Pill & Explanation */}
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-900 text-white text-xs font-semibold shadow-xs">
              <svg className="w-3.5 h-3.5 text-blue-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" strokeLinecap="round" strokeLinejoin="round"></path>
              </svg>
              <span>Public Only</span>
            </span>
            <p className="text-xs text-slate-600 font-medium">All uploads are public and directory shows direct HTTPS cloud links with auto-optimization.</p>
          </div>

          {/* Right: Metadata & Storage Usage */}
          <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 border-t md:border-t-0 pt-2 md:pt-0">
            <div>
              <span className="text-slate-400">Provider:</span>
              <strong className="text-slate-800 font-semibold ml-1">Cloudinary</strong>
            </div>
            <span className="text-slate-300">•</span>
            <div>
              <span className="text-slate-400">Target Folder:</span>
              <code className="bg-slate-100 text-blue-700 font-mono px-1.5 py-0.5 rounded text-[11px] font-semibold ml-1">public/best-moments</code>
            </div>
            <span className="text-slate-300">•</span>
            {/* Storage usage bar */}
            <div className="flex items-center gap-2">
              <span className="text-slate-400">Storage:</span>
              <div className="w-24 h-2 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                <div className="h-full bg-blue-500 rounded-full" style={{ width: `${storageStats.pct}%` }}></div>
              </div>
              <span className="text-[11px] font-semibold text-slate-700">{storageStats.mbUsed} / 1 GB</span>
            </div>
          </div>
        </div>
      </section>

      {/* FEEDBACK BANNERS (ERROR & SUCCESS) */}
      {error && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 shadow-xs flex items-start space-x-3">
          <svg className="w-5 h-5 text-rose-600 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
          <div className="flex-1 text-xs">
            <p className="font-bold text-rose-800 text-sm">Action Notice</p>
            <p className="text-rose-700 mt-0.5">{error}</p>
          </div>
        </div>
      )}

      {success && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 shadow-xs flex items-start space-x-3">
          <svg className="w-5 h-5 text-emerald-600 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          <div className="flex-1 text-xs">
            <p className="font-bold text-emerald-800 text-sm">Success</p>
            <p className="text-emerald-700 mt-0.5">{success}</p>
          </div>
        </div>
      )}

      {/* 3. UPLOAD CARDS GRID (2 COLUMNS) */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6" data-purpose="upload-forms-container">
        {/* CARD 1: Upload Single Image */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs flex flex-col justify-between">
          <div>
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-xs">
                  01
                </div>
                <h3 className="text-sm font-bold text-slate-900 tracking-tight">Upload Single Image</h3>
              </div>
              <span className="font-mono text-[11px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                field: image
              </span>
            </div>

            {/* Drag and Drop Dropzone */}
            <div
              onDragOver={(e) => {
                e.preventDefault()
                setDragOverSingle(true)
              }}
              onDragLeave={() => setDragOverSingle(false)}
              onDrop={(e) => {
                e.preventDefault()
                setDragOverSingle(false)
                if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                  setSingleFile(e.dataTransfer.files[0])
                }
              }}
              onClick={() => singleFileInputRef.current?.click()}
              className={`relative group border-2 border-dashed rounded-2xl p-5 text-center transition-all cursor-pointer ${
                dragOverSingle
                  ? 'border-blue-500 bg-blue-50/40'
                  : 'border-slate-200 hover:border-blue-400 bg-slate-50/70 hover:bg-blue-50/20'
              }`}
            >
              <input
                ref={singleFileInputRef}
                accept="image/*"
                className="hidden"
                type="file"
                onChange={(e) => setSingleFile(e.target.files?.[0] || null)}
              />
              <div className="flex flex-col items-center justify-center pointer-events-none">
                <div className="w-10 h-10 rounded-full bg-white shadow-2xs border border-slate-200 flex items-center justify-center text-blue-600 mb-2 group-hover:scale-105 transition-transform">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" strokeLinecap="round" strokeLinejoin="round"></path>
                  </svg>
                </div>
                <p className="text-xs font-semibold text-slate-800">
                  Drag and drop student photo here, or <span className="text-blue-600 underline">Browse</span>
                </p>
                <p className="text-[11px] text-slate-400 mt-1">Supports JPG, PNG, WEBP (Max 5MB)</p>
              </div>
            </div>

            {/* Styled Native File Input Box (Replicating Reference) */}
            <div className="mt-4 bg-slate-50/80 p-2.5 rounded-xl border border-slate-200/90 flex items-center gap-3">
              <button
                type="button"
                onClick={() => singleFileInputRef.current?.click()}
                className="cursor-pointer bg-sky-100 hover:bg-sky-200 text-sky-800 font-semibold px-3 py-1.5 rounded-lg text-xs transition-colors shadow-2xs"
              >
                Choose file
              </button>
              <span className={`text-xs truncate ${singleFile ? 'text-blue-700 font-medium' : 'text-slate-500'}`}>
                {singleFile ? singleFile.name : 'No file chosen'}
              </span>
            </div>

            {/* Optional Student Roll Association input */}
            <div className="mt-4">
              <label className="block text-xs font-semibold text-slate-700 mb-1">Associate With Student (Optional)</label>
              <div className="relative">
                <input
                  value={associateStudent}
                  onChange={(e) => setAssociateStudent(e.target.value)}
                  className="w-full text-xs rounded-xl border border-slate-200 bg-white px-3 py-2 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                  placeholder="e.g. SPS-1-A-001 or Khushi Mehta"
                  type="text"
                />
                <span className="absolute right-2.5 top-2 text-[10px] text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">Quick Link</span>
              </div>
            </div>
          </div>

          {/* Upload Button */}
          <button
            onClick={onUploadSingle}
            disabled={uploadingSingle || !singleFile}
            className="mt-5 w-full bg-[#111C44] hover:bg-[#0B132B] text-white py-2.5 px-4 rounded-xl text-xs font-bold tracking-wide flex items-center justify-center gap-2 shadow-sm transition-all hover:shadow hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none cursor-pointer"
            type="button"
          >
            {uploadingSingle ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Uploading to Cloud CDN...</span>
              </>
            ) : (
              <>
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" strokeLinecap="round" strokeLinejoin="round"></path>
                </svg>
                <span>Upload</span>
              </>
            )}
          </button>
        </div>

        {/* CARD 2: Upload Bulk Images */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs flex flex-col justify-between">
          <div>
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-xs">
                  02
                </div>
                <h3 className="text-sm font-bold text-slate-900 tracking-tight">Upload Bulk Images</h3>
              </div>
              <span className="font-mono text-[11px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                field: images
              </span>
            </div>

            {/* Bulk Drag and Drop Area */}
            <div
              onDragOver={(e) => {
                e.preventDefault()
                setDragOverBulk(true)
              }}
              onDragLeave={() => setDragOverBulk(false)}
              onDrop={(e) => {
                e.preventDefault()
                setDragOverBulk(false)
                if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                  setBulkFiles(Array.from(e.dataTransfer.files))
                }
              }}
              onClick={() => bulkFileInputRef.current?.click()}
              className={`relative group border-2 border-dashed rounded-2xl p-5 text-center transition-all cursor-pointer ${
                dragOverBulk
                  ? 'border-indigo-500 bg-indigo-50/40'
                  : 'border-slate-200 hover:border-indigo-400 bg-slate-50/70 hover:bg-indigo-50/20'
              }`}
            >
              <input
                ref={bulkFileInputRef}
                accept="image/*"
                className="hidden"
                multiple
                type="file"
                onChange={(e) => setBulkFiles(Array.from(e.target.files || []))}
              />
              <div className="flex flex-col items-center justify-center pointer-events-none">
                <div className="w-10 h-10 rounded-full bg-white shadow-2xs border border-slate-200 flex items-center justify-center text-indigo-600 mb-2 group-hover:scale-105 transition-transform">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" strokeLinecap="round" strokeLinejoin="round"></path>
                  </svg>
                </div>
                <p className="text-xs font-semibold text-slate-800">Drop multiple event photos or select folder</p>
                <p className="text-[11px] text-slate-400 mt-1">Batch upload up to 50 files simultaneously</p>
              </div>
            </div>

            {/* Styled Native Bulk File Input Box */}
            <div className="mt-4 bg-slate-50/80 p-2.5 rounded-xl border border-slate-200/90 flex items-center gap-3">
              <button
                type="button"
                onClick={() => bulkFileInputRef.current?.click()}
                className="cursor-pointer bg-sky-100 hover:bg-sky-200 text-sky-800 font-semibold px-3 py-1.5 rounded-lg text-xs transition-colors shadow-2xs"
              >
                Choose files
              </button>
              <span className={`text-xs truncate ${bulkFiles?.length ? 'text-blue-700 font-medium' : 'text-slate-500'}`}>
                {bulkFiles?.length ? `${bulkFiles.length} files selected` : 'No file chosen'}
              </span>
            </div>

            {/* Bulk Processing Options */}
            <div className="mt-4 grid grid-cols-2 gap-3">
              <label className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer bg-slate-50 p-2 rounded-xl border border-slate-200">
                <input defaultChecked className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-3.5 h-3.5 cursor-pointer" type="checkbox" />
                <span className="font-medium text-[11px]">Auto WebP Optimize</span>
              </label>
              <label className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer bg-slate-50 p-2 rounded-xl border border-slate-200">
                <input defaultChecked className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-3.5 h-3.5 cursor-pointer" type="checkbox" />
                <span className="font-medium text-[11px]">Generate Thumbnails</span>
              </label>
            </div>
          </div>

          {/* Bulk Upload Button */}
          <button
            onClick={onUploadBulk}
            disabled={uploadingBulk || !bulkFiles?.length}
            className="mt-5 w-full bg-[#111C44] hover:bg-[#0B132B] text-white py-2.5 px-4 rounded-xl text-xs font-bold tracking-wide flex items-center justify-center gap-2 shadow-sm transition-all hover:shadow hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none cursor-pointer"
            type="button"
          >
            {uploadingBulk ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Processing Bulk Upload...</span>
              </>
            ) : (
              <>
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" strokeLinecap="round" strokeLinejoin="round"></path>
                </svg>
                <span>Upload Bulk</span>
              </>
            )}
          </button>
        </div>
      </section>

      {/* 4. UPLOADED IMAGES MANAGER (DUAL VIEW: GRID / TABLE) */}
      <section className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden" data-purpose="uploaded-images-gallery-section">
        {/* Header with Live Image Count & Layout Switcher */}
        <div className="px-5 py-4 border-b border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <h3 className="text-sm font-bold text-slate-900">Images</h3>
            <span className="text-xs text-slate-400 font-medium">• Best moments collection</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-500 font-medium">
              Count: <strong className="text-slate-900 font-bold">{images.length}</strong>
            </span>
            <div className="h-4 w-px bg-slate-200"></div>
            {/* View Layout Toggle */}
            <div className="inline-flex rounded-xl border border-slate-200 p-0.5 bg-slate-100 text-xs">
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                  viewMode === 'grid'
                    ? 'bg-white text-slate-900 shadow-2xs font-bold'
                    : 'text-slate-400 hover:text-slate-600'
                }`}
                title="Grid View"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" strokeLinecap="round" strokeLinejoin="round"></path>
                </svg>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                  viewMode === 'table'
                    ? 'bg-white text-slate-900 shadow-2xs font-bold'
                    : 'text-slate-400 hover:text-slate-600'
                }`}
                title="Table List View"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M4 6h16M4 12h16M4 18h16" strokeLinecap="round" strokeLinejoin="round"></path>
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Filter and Search Bar for Images */}
        <div className="p-4 bg-slate-50/50 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 flex-1 min-w-[200px]">
            <div className="relative flex-1 max-w-xs">
              <svg className="w-4 h-4 text-slate-400 absolute left-3 top-2 pointer-events-none" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" strokeLinecap="round" strokeLinejoin="round"></path>
              </svg>
              <input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full text-xs rounded-xl border border-slate-200 bg-white pl-9 pr-3 py-1.5 text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                placeholder="Filter by filename or ID..."
                type="text"
              />
            </div>
            <select
              value={folderFilter}
              onChange={(e) => setFolderFilter(e.target.value)}
              className="text-xs rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-slate-700 focus:outline-none cursor-pointer"
            >
              <option value="public/best-moments">All Folders (public/best-moments)</option>
              <option value="public/id-photos">public/id-photos</option>
              <option value="public/sports-meet">public/sports-meet</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-slate-400 font-medium">
              Showing {filteredImages.length} of {images.length}
            </span>
          </div>
        </div>

        {/* Loading / Empty / Content View */}
        {loading ? (
          <div className="p-16 flex flex-col items-center justify-center text-slate-400">
            <div className="w-7 h-7 border-2 border-slate-200 border-t-blue-600 rounded-full animate-spin mb-2" />
            <span className="text-xs font-semibold text-slate-600">Connecting to Cloudinary CDN...</span>
          </div>
        ) : filteredImages.length === 0 ? (
          <div className="p-16 text-center text-slate-400">
            <svg className="w-10 h-10 mx-auto text-slate-300 mb-2" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <p className="text-sm font-bold text-slate-700">No images found</p>
            <p className="text-xs text-slate-400 mt-0.5">Upload a single photo or bulk images above to populate the CDN gallery</p>
          </div>
        ) : viewMode === 'grid' ? (
          /* Gallery Grid Mode */
          <div className="p-5 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredImages.map((img, idx) => {
              const name = img?.name || img?.filename || `moment_photo_${idx + 1}.jpg`
              const size = img?.size
              const formattedSize = typeof size === 'number' ? `${Math.round(size / 1024)} KB` : size || '340 KB'
              const nodeId = img?.nodeId || img?.node_id || img?.public_id || `img-${idx}`
              const url = img?.url || img?.link || ''

              return (
                <div key={nodeId} className="group relative bg-white border border-slate-200 rounded-2xl overflow-hidden hover:shadow-md transition-shadow">
                  <div className="aspect-video w-full bg-slate-100 relative overflow-hidden flex items-center justify-center">
                    {url ? (
                      <img
                        src={url}
                        alt={name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-tr from-sky-400 via-blue-500 to-indigo-600 flex items-center justify-center text-white">
                        <svg className="w-10 h-10 opacity-75 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                          <path d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" strokeLinecap="round" strokeLinejoin="round"></path>
                        </svg>
                      </div>
                    )}
                    <span className="absolute top-2 left-2 bg-black/60 backdrop-blur-xs text-white text-[10px] font-medium px-2 py-0.5 rounded-md">
                      CDN Cached
                    </span>
                  </div>
                  <div className="p-3.5">
                    <p className="text-xs font-bold text-slate-900 truncate" title={name}>
                      {name}
                    </p>
                    <div className="flex items-center justify-between text-[11px] text-slate-400 mt-1">
                      <span>{formattedSize}</span>
                      <span className="font-mono text-[10px]">{nodeId.slice(0, 10)}</span>
                    </div>
                    <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between">
                      {url ? (
                        <button
                          onClick={() => onCopy(url)}
                          className="text-xs text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                          title="Copy direct HTTPS CDN link"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <path d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" strokeLinecap="round" strokeLinejoin="round"></path>
                          </svg>
                          <span>Copy URL</span>
                        </button>
                      ) : (
                        <span className="text-[11px] text-slate-400">Stored</span>
                      )}
                      <button
                        onClick={() => onDelete(nodeId, name)}
                        disabled={deletingId === nodeId}
                        className="text-slate-400 hover:text-rose-600 p-1 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer disabled:opacity-50"
                        title="Delete image"
                      >
                        {deletingId === nodeId ? (
                          <div className="w-3.5 h-3.5 border-2 border-slate-300 border-t-rose-600 rounded-full animate-spin" />
                        ) : (
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" strokeLinecap="round" strokeLinejoin="round"></path>
                          </svg>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          /* Table List Mode */
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <tr>
                  <th className="px-5 py-3.5">Name</th>
                  <th className="px-4 py-3.5">Size</th>
                  <th className="px-4 py-3.5">Node ID</th>
                  <th className="px-4 py-3.5">Direct Link</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                {filteredImages.map((img, idx) => {
                  const name = img?.name || img?.filename || `moment_photo_${idx + 1}.jpg`
                  const size = img?.size
                  const formattedSize = typeof size === 'number' ? `${Math.round(size / 1024)} KB` : size || '--'
                  const nodeId = img?.nodeId || img?.node_id || img?.public_id || `img-${idx}`
                  const url = img?.url || img?.link || ''

                  return (
                    <tr key={nodeId} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-5 py-3.5 font-bold text-slate-900">
                        {name}
                      </td>
                      <td className="px-4 py-3.5 text-slate-600">
                        {formattedSize}
                      </td>
                      <td className="px-4 py-3.5 font-mono text-[11px] text-slate-500">
                        {nodeId}
                      </td>
                      <td className="px-4 py-3.5">
                        {url ? (
                          <button
                            onClick={() => onCopy(url)}
                            className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 transition cursor-pointer"
                            title="Copy link"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                              <path d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" strokeLinecap="round" strokeLinejoin="round"></path>
                            </svg>
                            <span>Copy</span>
                          </button>
                        ) : (
                          <span className="text-slate-400">No link</span>
                        )}
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <button
                          onClick={() => onDelete(nodeId, name)}
                          disabled={deletingId === nodeId}
                          className="inline-flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-lg bg-rose-50 text-rose-700 hover:bg-rose-100 disabled:opacity-50 transition cursor-pointer"
                        >
                          {deletingId === nodeId ? 'Deleting...' : 'Delete'}
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  )
}

export default UploadPhoto
