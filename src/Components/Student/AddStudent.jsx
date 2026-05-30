import React, { useState } from 'react'
import api from '../../Api/auth'
import { addStudent } from '../../Api/students'
import StudentPhotoAdjuster, {
  DEFAULT_PHOTO_ADJUSTMENT,
  createAdjustedStudentPhotoFile,
} from './StudentPhotoAdjuster'

const normalizeAlphaSpaceUpper = (value) =>
  value
    .toUpperCase()
    .replace(/[^A-Z\s]/g, '')
    .replace(/\s{2,}/g, ' ')
    .replace(/^\s+/g, '')

const normalizeClassValue = (value) => value.replace(/[^a-zA-Z0-9]/g, '')
const normalizeSectionValue = (value) => value.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 1)
const normalizeMobileValue = (value) => value.replace(/\D/g, '').slice(0, 10)
const normalizeAadhaarValue = (value) => value.replace(/\D/g, '').slice(0, 12)
const normalizePenValue = (value) => value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 32)
const normalizeAddressValue = (value) => value.slice(0, 50)

function AddStudent({ isOpen, onClose, onSuccess, fullPage = false }) {
  const [formData, setFormData] = useState({
    name: '',
    father_name: '',
    mother_name: '',
    gender: 'Male',
    class: '',
    roll_no: '',
    section: '',
    mobile: '',
    aadhaar_card: '',
    pen_number: '',
    photo_url: '',
    photoFile: null,
    address: '',
    uses_transport: false,
    transport_charge: null
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [fieldErrors, setFieldErrors] = useState({})
  const [photoAdjustment, setPhotoAdjustment] = useState(DEFAULT_PHOTO_ADJUSTMENT)

  const validateField = (fieldName, fieldValue) => {
    const value = (fieldValue ?? '').toString().trim()

    if (fieldName === 'name' || fieldName === 'father_name' || fieldName === 'mother_name') {
      if (!value) return 'This field is required.'
      if (!/^[A-Z ]+$/.test(value)) return 'Only alphabets and spaces are allowed.'
      return ''
    }

    if (fieldName === 'class') {
      if (!value) return 'Class is required.'
      if (!/^[a-zA-Z0-9]+$/.test(value)) return 'Class must contain only letters and numbers.'
      return ''
    }

    if (fieldName === 'section') {
      if (!value) return 'Section is required.'
      if (!/^[A-Z]$/.test(value)) return 'Section must be a single capital letter.'
      return ''
    }

    if (fieldName === 'mobile') {
      if (!value) return 'Mobile number is required.'
      if (!/^[6-9]\d{9}$/.test(value)) return 'Enter a valid 10-digit number starting with 6-9.'
      return ''
    }

    if (fieldName === 'aadhaar_card') {
      if (!value) return 'Aadhaar number is required.'
      if (!/^\d{12}$/.test(value)) return 'Aadhaar number must be 12 digits.'
      return ''
    }

    if (fieldName === 'pen_number') {
      if (!value) return ''
      if (!/^[A-Z0-9]+$/.test(value)) return 'PEN must contain only letters and numbers.'
      return ''
    }

    if (fieldName === 'photo_url') {
      return ''
    }

    if (fieldName === 'address') {
      if (!value) return 'Address is required.'
      if (value.length > 50) return 'Address cannot exceed 50 characters.'
      return ''
    }

    return ''
  }

  const handleChange = (e) => {
    const { name, value, type, checked, files } = e.target
    let nextValue = value

    if (type === 'file') {
      const file = files?.[0] || null
      setFormData((prev) => ({
        ...prev,
        photoFile: file,
        photo_url: file ? URL.createObjectURL(file) : prev.photo_url,
      }))
      setPhotoAdjustment(DEFAULT_PHOTO_ADJUSTMENT)
      setFieldErrors((prev) => ({
        ...prev,
        photoFile: file ? '' : prev.photoFile,
      }))
      setError('')
      return
    }

    if (type !== 'checkbox') {
      if (name === 'name' || name === 'father_name' || name === 'mother_name') {
        nextValue = normalizeAlphaSpaceUpper(value)
      }

      if (name === 'class') {
        nextValue = normalizeClassValue(value)
      }

      if (name === 'section') {
        nextValue = normalizeSectionValue(value)
      }

      if (name === 'mobile') {
        nextValue = normalizeMobileValue(value)
      }

      if (name === 'aadhaar_card') {
        nextValue = normalizeAadhaarValue(value)
      }

      if (name === 'pen_number') {
        nextValue = normalizePenValue(value)
      }

      if (name === 'address') {
        nextValue = normalizeAddressValue(value)
      }
    }

    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : nextValue
    }))

    if (type !== 'checkbox') {
      setFieldErrors(prev => ({
        ...prev,
        [name]: validateField(name, nextValue)
      }))
    }

    setError('')
  }

  const handleBlur = (e) => {
    const { name, value } = e.target
    if (
      name === 'name' ||
      name === 'father_name' ||
      name === 'mother_name' ||
      name === 'class' ||
      name === 'address' ||
      name === 'mobile' ||
      name === 'section' ||
      name === 'aadhaar_card' ||
      name === 'pen_number'
    ) {
      const trimmedValue = value.trim()
      setFormData(prev => ({
        ...prev,
        [name]: trimmedValue
      }))
      setFieldErrors(prev => ({
        ...prev,
        [name]: validateField(name, trimmedValue)
      }))
    }
  }

  const uploadStudentPhoto = async (file) => {
    const form = new FormData()
    form.append('image', file)
    const response = await api.post('/api/mega/images?public=true&provider=cloudinary&preset=student-photo-manual', form)
    return response?.data?.file?.url || null
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const normalizedFormData = {
        ...formData,
        name: normalizeAlphaSpaceUpper(formData.name).trim(),
        father_name: normalizeAlphaSpaceUpper(formData.father_name).trim(),
        mother_name: normalizeAlphaSpaceUpper(formData.mother_name).trim(),
        class: normalizeClassValue(formData.class).trim(),
        section: normalizeSectionValue(formData.section).trim(),
        mobile: normalizeMobileValue(formData.mobile).trim(),
        aadhaar_card: normalizeAadhaarValue(formData.aadhaar_card).trim(),
        pen_number: normalizePenValue(formData.pen_number).trim(),
        photo_url: formData.photo_url?.trim() || '',
        address: normalizeAddressValue(formData.address).trim(),
      }

      const nextFieldErrors = {
        name: validateField('name', normalizedFormData.name),
        father_name: validateField('father_name', normalizedFormData.father_name),
        mother_name: validateField('mother_name', normalizedFormData.mother_name),
        class: validateField('class', normalizedFormData.class),
        section: validateField('section', normalizedFormData.section),
        mobile: validateField('mobile', normalizedFormData.mobile),
        aadhaar_card: validateField('aadhaar_card', normalizedFormData.aadhaar_card),
        pen_number: validateField('pen_number', normalizedFormData.pen_number),
        address: validateField('address', normalizedFormData.address),
      }

      setFieldErrors(nextFieldErrors)
      const hasFieldErrors = Object.values(nextFieldErrors).some(Boolean)
      if (hasFieldErrors) {
        setError('Please fix the highlighted field errors.')
        return
      }

      if (formData.photoFile) {
        const adjustedPhotoFile = await createAdjustedStudentPhotoFile(formData.photoFile, photoAdjustment)
        const uploadedUrl = await uploadStudentPhoto(adjustedPhotoFile || formData.photoFile)
        if (!uploadedUrl) {
          throw new Error('Failed to upload student photo')
        }
        normalizedFormData.photo_url = uploadedUrl
      }

      const submitData = {
        ...normalizedFormData,
        roll_no: parseInt(normalizedFormData.roll_no, 10) || 0,
        transport_charge: normalizedFormData.uses_transport ? (normalizedFormData.transport_charge ? parseFloat(normalizedFormData.transport_charge) : null) : null,
      }
      
      const response = await addStudent(submitData)
      
      if (response.success) {
        setSuccess(true)
        setError('')
        setFieldErrors({})
        
        // Reset form
        setFormData({
          name: '',
          father_name: '',
          mother_name: '',
          gender: 'Male',
          class: '',
          roll_no: '',
          section: '',
          mobile: '',
          aadhaar_card: '',
          pen_number: '',
          photo_url: '',
          photoFile: null,
          address: '',
          uses_transport: false,
          transport_charge: null
        })
        setPhotoAdjustment(DEFAULT_PHOTO_ADJUSTMENT)
        
        // Show success message for 2 seconds then close
        setTimeout(() => {
          setSuccess(false)
          onSuccess?.()
          onClose()
        }, 2000)
      }
    } catch (err) {
      setError(err?.message || 'Failed to add student')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen && !fullPage) return null

  const formClass = fullPage ? 'px-6 py-6 sm:px-12 lg:px-24 lg:py-8 space-y-4' : 'p-5 space-y-4'
  const gridClass = 'grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2 lg:grid-cols-3'
  const fullRowClass = 'col-span-1 sm:col-span-2 lg:col-span-3'
  const labelClass = 'block text-[13px] font-black text-slate-900 dark:text-slate-100 mb-2'
  const fieldShellClass = 'flex min-h-11 items-center rounded-md border border-slate-300 bg-white shadow-sm focus-within:border-slate-500 focus-within:ring-1 focus-within:ring-slate-400 transition-all'
  const fieldIconClass = 'material-symbols-outlined shrink-0 pl-3 pr-2 text-black text-[22px]'
  const inputClass = 'w-full min-w-0 bg-transparent border-none focus:ring-0 py-2 px-2 text-sm font-medium text-slate-900 placeholder:text-slate-500'
  const siteInputClass = 'w-full min-h-11 rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-900 shadow-sm outline-none placeholder:text-slate-500 focus:border-slate-500 focus:ring-1 focus:ring-slate-400'

  const formContent = (
        <form onSubmit={handleSubmit} className={formClass}>
          {success && (
            <div className="p-2 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md flex items-center gap-2">
              <span className="material-symbols-outlined text-green-600 dark:text-green-400 text-base">check_circle</span>
              <p className="text-xs text-green-600 dark:text-green-400 font-medium">Student added successfully!</p>
            </div>
          )}
          
          {error && (
            <div className="p-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
              <p className="text-xs text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}

          <div className={gridClass}>
            {/* Name */}
            <div>
              <label className={labelClass}>
                Name <span className="text-red-500">*</span>
              </label>
              <div className={fieldShellClass}>
                <span className={fieldIconClass}>person</span>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className={inputClass}
                  placeholder="Enter student name"
                  required
                />
              </div>
              {fieldErrors.name ? (
                <p className="mt-1 text-xs text-red-500">{fieldErrors.name}</p>
              ) : null}
            </div>

            {/* Father Name */}
            <div>
              <label className={labelClass}>
                Father Name <span className="text-red-500">*</span>
              </label>
              <div className={fieldShellClass}>
                <span className={fieldIconClass}>family_restroom</span>
                <input
                  type="text"
                  name="father_name"
                  value={formData.father_name}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className={inputClass}
                  placeholder="Enter father name"
                  required
                />
              </div>
              {fieldErrors.father_name ? (
                <p className="mt-1 text-xs text-red-500">{fieldErrors.father_name}</p>
              ) : null}
            </div>

            {/* Mother Name */}
            <div>
              <label className={labelClass}>
                Mother Name <span className="text-red-500">*</span>
              </label>
              <div className={fieldShellClass}>
                <span className={fieldIconClass}>family_restroom</span>
                <input
                  type="text"
                  name="mother_name"
                  value={formData.mother_name}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className={inputClass}
                  placeholder="Enter mother name"
                  required
                />
              </div>
              {fieldErrors.mother_name ? (
                <p className="mt-1 text-xs text-red-500">{fieldErrors.mother_name}</p>
              ) : null}
            </div>

            {/* Gender */}
            <div>
              <label className={labelClass}>
                Gender <span className="text-red-500">*</span>
              </label>
              <div className={fieldShellClass}>
                <span className={fieldIconClass}>wc</span>
                <select
                  name="gender"
                  value={formData.gender}
                  onChange={handleChange}
                  className={inputClass}
                  required
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>

            {/* Class */}
            <div>
              <label className={labelClass}>
                Class <span className="text-red-500">*</span>
              </label>
              <div className={fieldShellClass}>
                <span className={fieldIconClass}>class</span>
                <input
                  type="text"
                  name="class"
                  value={formData.class}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className={inputClass}
                  placeholder="Enter class"
                  required
                />
              </div>
              {fieldErrors.class ? (
                <p className="mt-1 text-xs text-red-500">{fieldErrors.class}</p>
              ) : null}
            </div>

            {/* Roll Number */}
            <div>
              <label className={labelClass}>
                Roll Number <span className="text-red-500">*</span>
              </label>
              <div className={fieldShellClass}>
                <span className={fieldIconClass}>badge</span>
                <input
                  type="number"
                  name="roll_no"
                  value={formData.roll_no}
                  onChange={handleChange}
                  className={inputClass}
                  placeholder="Enter roll number"
                  required
                />
              </div>
            </div>

            {/* Section */}
            <div>
              <label className={labelClass}>
                Section <span className="text-red-500">*</span>
              </label>
              <div className={fieldShellClass}>
                <span className={fieldIconClass}>category</span>
                <input
                  type="text"
                  name="section"
                  value={formData.section}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  maxLength={1}
                  className={inputClass}
                  placeholder="Enter section (e.g., A, B)"
                  required
                />
              </div>
              {fieldErrors.section ? (
                <p className="mt-1 text-xs text-red-500">{fieldErrors.section}</p>
              ) : null}
            </div>

            {/* Mobile */}
            <div>
              <label className={labelClass}>
                Mobile <span className="text-red-500">*</span>
              </label>
              <div className={fieldShellClass}>
                <span className={fieldIconClass}>phone</span>
                <input
                  type="tel"
                  name="mobile"
                  value={formData.mobile}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  maxLength={10}
                  pattern="[6-9][0-9]{9}"
                  inputMode="numeric"
                  className={inputClass}
                  placeholder="Enter mobile number"
                  title="Enter a 10-digit mobile number starting with 6, 7, 8, or 9."
                  required
                />
              </div>
              {fieldErrors.mobile ? (
                <p className="mt-1 text-xs text-red-500">{fieldErrors.mobile}</p>
              ) : null}
            </div>

            {/* Aadhaar */}
            <div>
              <label className={labelClass}>
                Aadhaar Number <span className="text-red-500">*</span>
              </label>
              <div className={fieldShellClass}>
                <span className={fieldIconClass}>fingerprint</span>
                <input
                  type="text"
                  name="aadhaar_card"
                  value={formData.aadhaar_card}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  maxLength={12}
                  inputMode="numeric"
                  className={inputClass}
                  placeholder="Enter 12 digit Aadhaar"
                />
              </div>
              {fieldErrors.aadhaar_card ? (
                <p className="mt-1 text-xs text-red-500">{fieldErrors.aadhaar_card}</p>
              ) : null}
            </div>

            {/* PEN */}
            <div>
              <label className={labelClass}>
                PEN Number <span className="text-slate-500">(Optional)</span>
              </label>
              <div className={fieldShellClass}>
                <span className={fieldIconClass}>id_card</span>
                <input
                  type="text"
                  name="pen_number"
                  value={formData.pen_number}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  maxLength={32}
                  className={inputClass}
                  placeholder="Enter PEN number"
                />
              </div>
              {fieldErrors.pen_number ? (
                <p className="mt-1 text-xs text-red-500">{fieldErrors.pen_number}</p>
              ) : null}
            </div>

            <div className={`${fullRowClass} grid grid-cols-1 gap-x-8 gap-y-4 lg:grid-cols-2`}>
              {/* Photo Upload */}
              <div>
                <label className={labelClass}>
                  Student Photo
                </label>
                <input
                  type="file"
                  name="photoFile"
                  accept="image/*"
                  onChange={handleChange}
                  className={siteInputClass}
                />
                <p className="mt-1 text-xs text-slate-500">
                  Upload a student photo or paste a direct image URL.
                </p>
              </div>

              <div>
                <label className={labelClass}>
                  Photo URL
                </label>
                <div className={fieldShellClass}>
                  <span className={fieldIconClass}>link</span>
                  <input
                    type="text"
                    name="photo_url"
                    value={formData.photo_url}
                    onChange={handleChange}
                    className={inputClass}
                    placeholder="Direct image URL"
                  />
                </div>
              </div>
            </div>

            {formData.photoFile ? (
              <div className={fullRowClass}>
                <StudentPhotoAdjuster
                  previewUrl={formData.photo_url}
                  adjustment={photoAdjustment}
                  onChange={setPhotoAdjustment}
                />
              </div>
            ) : formData.photo_url ? (
              <div className={`${fullRowClass} rounded-md border border-slate-200 bg-slate-50 p-3`}>
                <p className="text-xs font-semibold text-slate-500 mb-2">Photo preview</p>
                <img
                  src={formData.photo_url}
                  alt="Student preview"
                  className="h-24 w-24 rounded-lg object-cover border border-slate-200"
                />
              </div>
            ) : null}
          </div>

          {/* Address */}
          <div>
            <label className={labelClass}>
              Address <span className="text-red-500">*</span>
            </label>
            <div className={fieldShellClass}>
              <span className={fieldIconClass}>home</span>
              <textarea
                name="address"
                value={formData.address}
                onChange={handleChange}
                onBlur={handleBlur}
                maxLength={50}
                rows="1"
                className={`${inputClass} h-10 resize-none leading-6`}
                placeholder="Enter student address"
                required
              ></textarea>
            </div>
            {fieldErrors.address ? (
              <p className="mt-1 text-xs text-red-500">{fieldErrors.address}</p>
            ) : null}
          </div>

          {/* Uses Transport */}
          <div className="flex items-center gap-2">
            {/* <input
              type="checkbox"
              name="uses_transport"
              checked={formData.uses_transport}
              onChange={handleChange}
            className="w-5 h-5 rounded border-slate-300 text-black focus:ring-slate-400"
              id="uses_transport"
            /> */}
            {/* <label htmlFor="uses_transport" className="text-sm font-bold text-slate-800 dark:text-slate-200 cursor-pointer">
              Uses Transport
            </label> */}
          </div>

          {/* Transport Charge (conditional) */}
          {formData.uses_transport && (
            <div>
              <label className={labelClass}>
                Transport Charge
              </label>
              <div className={fieldShellClass}>
                <span className={fieldIconClass}>local_shipping</span>
                <input
                  type="number"
                  name="transport_charge"
                  value={formData.transport_charge || ''}
                  onChange={handleChange}
                  className={inputClass}
                  placeholder="Enter transport charge"
                  step="0.01"
                />
              </div>
            </div>
          )}

          {/* Buttons */}
          <div className="flex items-center justify-end gap-8 pt-4 border-t border-slate-200 dark:border-slate-700">
            <button
              type="button"
              onClick={onClose}
              className="px-2 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 bg-transparent rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-3 text-sm font-bold text-white bg-black hover:bg-slate-900 rounded-md shadow-lg shadow-slate-900/15 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {loading ? (
                <>
                  <span className="material-symbols-outlined animate-spin text-base">sync</span>
                  <span>Adding...</span>
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-base">check</span> 
                  <span>Add Student</span>
                </>
              )}
            </button>
          </div>
        </form>
  )

  if (fullPage) {
    return (
      <div style={{ fontFamily: "'Lexend', sans-serif" }} className="w-full rounded-lg border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
        {formContent}
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4" style={{ fontFamily: "'Lexend', sans-serif" }}>
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm z-[9998]"
        onClick={onClose}
      ></div>

      <div className="relative z-[9999] flex max-h-[90vh] w-full max-w-5xl flex-col overflow-hidden rounded-lg bg-white shadow-2xl dark:bg-slate-800">
        <div className="bg-black text-white px-6 py-4 rounded-t-lg flex items-center justify-between shrink-0">
          <h2 className="text-xl font-black">Add New Student</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-white/20 rounded-lg transition-colors"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto scrollbar-cyan">
          {formContent}
        </div>
      </div>
    </div>
  )
}

export default AddStudent
