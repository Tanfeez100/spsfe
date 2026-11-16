import React from 'react'

/**
 * School Theme Animated Page Loader
 * Renders a spinning branded circle with soft glow and school emblem.
 */
function PageLoader({ message = 'Loading...', fullScreen = true }) {
  const content = (
    <div className="relative flex flex-col items-center justify-center">
      {/* Spinning circle in school theme */}
      <div className="relative flex items-center justify-center">
        <div className="h-14 w-14 rounded-full border-[3.5px] border-sky-200/60 border-t-[#1d7ff2] border-r-[#0f3f99] animate-spin" />
        <div className="absolute flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-[#0f3f99] to-[#1d7ff2] text-white shadow-sm">
          <span className="material-symbols-outlined text-sm">school</span>
        </div>
      </div>

      {/* Loading text */}
      <p className="mt-4 text-xs font-black uppercase tracking-[0.2em] text-[#1d5fb8]">
        {message}
      </p>
    </div>
  )

  if (!fullScreen) return content

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-[#f0f7ff] via-[#f8fbff] to-[#e8f4ff] px-4">
      {content}
    </div>
  )
}

export default PageLoader

