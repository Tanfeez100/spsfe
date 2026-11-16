import React, { useEffect, useRef, useState } from 'react'

/**
 * Reusable Theme-Styled Custom Select Dropdown
 * Replaces native OS select dropdown with school branded UI.
 */
function ThemeSelect({
  value = '',
  onChange,
  options = [],
  placeholder = 'Select an option...',
  className = '',
  name,
  required = false,
  disabled = false,
}) {
  const [open, setOpen] = useState(false)
  const containerRef = useRef(null)

  // Normalize options to [{ value, label }]
  const normalizedOptions = options.map((opt) => {
    if (typeof opt === 'string') {
      return { value: opt, label: opt }
    }
    return opt
  })

  const selectedOption = normalizedOptions.find((opt) => opt.value === value)

  // Close dropdown on outside click or escape
  useEffect(() => {
    if (!open) return

    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false)
      }
    }

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('touchstart', handleClickOutside)
    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('touchstart', handleClickOutside)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [open])

  const handleSelect = (optValue) => {
    if (onChange) {
      onChange(optValue)
    }
    setOpen(false)
  }

  return (
    <div ref={containerRef} className="relative w-full">
      {/* Hidden input for form submissions */}
      {name && <input type="hidden" name={name} value={value} required={required} />}

      {/* Trigger button */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((prev) => !prev)}
        className={`w-full flex items-center justify-between rounded-xl border bg-white px-4 py-3 text-sm font-semibold transition-all duration-200 outline-none text-left cursor-pointer shadow-xs ${
          open
            ? 'border-[#1d7ff2] ring-4 ring-[#1d7ff2]/15 shadow-md shadow-blue-900/5'
            : 'border-sky-200/90 hover:border-[#1d7ff2]/70'
        } ${disabled ? 'opacity-50 cursor-not-allowed bg-slate-50' : ''} ${className}`}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className={selectedOption ? 'text-slate-900 font-bold truncate' : 'text-slate-400 font-normal truncate'}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>

        <span
          className={`material-symbols-outlined text-2xl text-[#1d7ff2] transition-transform duration-200 shrink-0 ml-2 ${
            open ? 'rotate-180' : ''
          }`}
        >
          expand_more
        </span>
      </button>

      {/* Custom Dropdown Menu with School Theme */}
      {open && (
        <div className="absolute left-0 right-0 top-full z-50 mt-1.5 max-h-60 overflow-y-auto rounded-2xl border border-sky-100 bg-white/95 p-1.5 shadow-2xl shadow-blue-950/15 backdrop-blur-md">
          <div className="space-y-1" role="listbox">
            {normalizedOptions.map((opt) => {
              const isSelected = opt.value === value
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => handleSelect(opt.value)}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-150 text-left ${
                    isSelected
                      ? 'bg-[#eaf4ff] text-[#0f3f99] font-black'
                      : 'text-slate-700 hover:bg-sky-50/80 hover:text-[#0f3f99]'
                  }`}
                  role="option"
                  aria-selected={isSelected}
                >
                  <span className="truncate">{opt.label}</span>
                  {isSelected && (
                    <span className="material-symbols-outlined text-base text-[#1d7ff2] shrink-0 ml-2">check</span>
                  )}
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

export default ThemeSelect

