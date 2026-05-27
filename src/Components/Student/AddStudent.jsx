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
const normalizeAddressValue = (value) => value.slice(0, 50)

function AddStudent({ isOpen, onClose, onSuccess }) {
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
      name === 'aadhaar_card'
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

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[9999] flex items-start justify-center p-4 pt-20" style={{ fontFamily: "'Lexend', sans-serif" }}>
      {/* Blurred Background */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm z-[9998]"
        onClick={onClose}
      ></div>

      {/* Modal */}
      <div className="relative bg-white dark:bg-slate-800 rounded-lg shadow-2xl w-full max-w-2xl max-h-[calc(90vh-5rem)] overflow-hidden z-[9999]">
        <style>{`
          .scrollbar-cyan::-webkit-scrollbar {
            width: 8px;
          }
          .scrollbar-cyan::-webkit-scrollbar-track {
            background: rgb(224, 242, 254);
            border-radius: 4px;
          }
          .scrollbar-cyan::-webkit-scrollbar-thumb {
            background: rgb(99, 126, 153);
            border-radius: 4px;
          }
          .scrollbar-cyan::-webkit-scrollbar-thumb:hover {
            background: rgb(71, 85, 105);
          }
          .dark .scrollbar-cyan::-webkit-scrollbar-track {
            background: rgb(224, 242, 254);
          }
          .dark .scrollbar-cyan::-webkit-scrollbar-thumb {
            background: rgb(99, 126, 153);
          }
          .dark .scrollbar-cyan::-webkit-scrollbar-thumb:hover {
            background: rgb(71, 85, 105);
          }
          @media (prefers-color-scheme: dark) {
            .scrollbar-cyan::-webkit-scrollbar-track {
              background: rgb(224, 242, 254);
            }
            .scrollbar-cyan::-webkit-scrollbar-thumb {
              background: rgb(99, 126, 153);
            }
            .scrollbar-cyan::-webkit-scrollbar-thumb:hover {
              background: rgb(71, 85, 105);
            }
          }
        `}</style>
        {/* Header */}
        <div className="bg-cyan-500 text-white px-6 py-4 rounded-t-lg flex items-center justify-between">
          <h2 className="text-xl font-black">Add New Student</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-white/20 rounded-lg transition-colors"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto max-h-[calc(90vh-12rem)] scrollbar-cyan" style={{
          scrollbarWidth: 'thin',
          scrollbarColor: 'rgb(99, 126, 153) rgb(224, 242, 254)'
        }}>
          {success && (
            <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg flex items-center gap-2">
              <span className="material-symbols-outlined text-green-600 dark:text-green-400">check_circle</span>
              <p className="text-sm text-green-600 dark:text-green-400 font-medium">Student added successfully!</p>
            </div>
          )}
          
          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Name */}
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Name <span className="text-red-500">*</span>
              </label>
              <div className="flex items-center border border-cyan-200/30 dark:border-cyan-700/50 rounded-lg bg-cyan-50/30 dark:bg-cyan-900/10 focus-within:border-cyan-400 focus-within:ring-1 focus-within:ring-cyan-400/50 transition-all">
                <span className="material-symbols-outlined pl-2 text-cyan-200 text-base">person</span>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className="w-full bg-transparent border-none focus:ring-0 py-1.5 px-2 text-sm text-slate-900 dark:text-white placeholder:text-slate-400"
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
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Father Name <span className="text-red-500">*</span>
              </label>
              <div className="flex items-center border border-cyan-200/30 dark:border-cyan-700/50 rounded-lg bg-cyan-50/30 dark:bg-cyan-900/10 focus-within:border-cyan-400 focus-within:ring-1 focus-within:ring-cyan-400/50 transition-all">
                <span className="material-symbols-outlined pl-2 text-cyan-200 text-base">family_restroom</span>
                <input
                  type="text"
                  name="father_name"
                  value={formData.father_name}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className="w-full bg-transparent border-none focus:ring-0 py-1.5 px-2 text-sm text-slate-900 dark:text-white placeholder:text-slate-400"
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
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Mother Name <span className="text-red-500">*</span>
              </label>
              <div className="flex items-center border border-cyan-200/30 dark:border-cyan-700/50 rounded-lg bg-cyan-50/30 dark:bg-cyan-900/10 focus-within:border-cyan-400 focus-within:ring-1 focus-within:ring-cyan-400/50 transition-all">
                <span className="material-symbols-outlined pl-2 text-cyan-200 text-base">family_restroom</span>
                <input
                  type="text"
                  name="mother_name"
                  value={formData.mother_name}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className="w-full bg-transparent border-none focus:ring-0 py-1.5 px-2 text-sm text-slate-900 dark:text-white placeholder:text-slate-400"
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
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Gender <span className="text-red-500">*</span>
              </label>
              <div className="flex items-center border border-cyan-200/30 dark:border-cyan-700/50 rounded-lg bg-cyan-50/30 dark:bg-cyan-900/10 focus-within:border-cyan-400 focus-within:ring-1 focus-within:ring-cyan-400/50 transition-all">
                <span className="material-symbols-outlined pl-2 text-cyan-200 text-base">wc</span>
                <select
                  name="gender"
                  value={formData.gender}
                  onChange={handleChange}
                  className="w-full bg-transparent border-none focus:ring-0 py-1.5 px-2 text-sm text-slate-900 dark:text-white"
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
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Class <span className="text-red-500">*</span>
              </label>
              <div className="flex items-center border border-cyan-200/30 dark:border-cyan-700/50 rounded-lg bg-cyan-50/30 dark:bg-cyan-900/10 focus-within:border-cyan-400 focus-within:ring-1 focus-within:ring-cyan-400/50 transition-all">
                <span className="material-symbols-outlined pl-2 text-cyan-200 text-base">class</span>
                <input
                  type="text"
                  name="class"
                  value={formData.class}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className="w-full bg-transparent border-none focus:ring-0 py-1.5 px-2 text-sm text-slate-900 dark:text-white placeholder:text-slate-400"
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
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Roll Number <span className="text-red-500">*</span>
              </label>
              <div className="flex items-center border border-cyan-200/30 dark:border-cyan-700/50 rounded-lg bg-cyan-50/30 dark:bg-cyan-900/10 focus-within:border-cyan-400 focus-within:ring-1 focus-within:ring-cyan-400/50 transition-all">
                <span className="material-symbols-outlined pl-2 text-cyan-200 text-base">badge</span>
                <input
                  type="number"
                  name="roll_no"
                  value={formData.roll_no}
                  onChange={handleChange}
                  className="w-full bg-transparent border-none focus:ring-0 py-1.5 px-2 text-sm text-slate-900 dark:text-white placeholder:text-slate-400"
                  placeholder="Enter roll number"
                  required
                />
              </div>
            </div>

            {/* Section */}
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Section <span className="text-red-500">*</span>
              </label>
              <div className="flex items-center border border-cyan-200/30 dark:border-cyan-700/50 rounded-lg bg-cyan-50/30 dark:bg-cyan-900/10 focus-within:border-cyan-400 focus-within:ring-1 focus-within:ring-cyan-400/50 transition-all">
                <span className="material-symbols-outlined pl-2 text-cyan-200 text-base">category</span>
                <input
                  type="text"
                  name="section"
                  value={formData.section}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  maxLength={1}
                  className="w-full bg-transparent border-none focus:ring-0 py-1.5 px-2 text-sm text-slate-900 dark:text-white placeholder:text-slate-400"
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
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Mobile <span className="text-red-500">*</span>
              </label>
              <div className="flex items-center border border-cyan-200/30 dark:border-cyan-700/50 rounded-lg bg-cyan-50/30 dark:bg-cyan-900/10 focus-within:border-cyan-400 focus-within:ring-1 focus-within:ring-cyan-400/50 transition-all">
                <span className="material-symbols-outlined pl-2 text-cyan-200 text-base">phone</span>
                <input
                  type="tel"
                  name="mobile"
                  value={formData.mobile}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  maxLength={10}
                  pattern="[6-9][0-9]{9}"
                  inputMode="numeric"
                  className="w-full bg-transparent border-none focus:ring-0 py-1.5 px-2 text-sm text-slate-900 dark:text-white placeholder:text-slate-400"
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
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Aadhaar Number <span className="text-red-500">*</span>
              </label>
              <div className="flex items-center border border-cyan-200/30 dark:border-cyan-700/50 rounded-lg bg-cyan-50/30 dark:bg-cyan-900/10 focus-within:border-cyan-400 focus-within:ring-1 focus-within:ring-cyan-400/50 transition-all">
                <span className="material-symbols-outlined pl-2 text-cyan-200 text-base">fingerprint</span>
                <input
                  type="text"
                  name="aadhaar_card"
                  value={formData.aadhaar_card}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  maxLength={12}
                  inputMode="numeric"
                  className="w-full bg-transparent border-none focus:ring-0 py-1.5 px-2 text-sm text-slate-900 dark:text-white placeholder:text-slate-400"
                  placeholder="Enter 12 digit Aadhaar"
                />
              </div>
              {fieldErrors.aadhaar_card ? (
                <p className="mt-1 text-xs text-red-500">{fieldErrors.aadhaar_card}</p>
              ) : null}
            </div>

            {/* Photo Upload */}
            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Student Photo
              </label>
              <input
                type="file"
                name="photoFile"
                accept="image/*"
                onChange={handleChange}
                className="gps-site-input"
              />
              <p className="mt-1 text-xs text-slate-500">
                Upload a student photo or paste a direct image URL below.
              </p>
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Photo URL
              </label>
              <input
                type="text"
                name="photo_url"
                value={formData.photo_url}
                onChange={handleChange}
                className="gps-site-input"
                placeholder="Direct image URL"
              />
            </div>

            {formData.photoFile ? (
              <StudentPhotoAdjuster
                previewUrl={formData.photo_url}
                adjustment={photoAdjustment}
                onChange={setPhotoAdjustment}
              />
            ) : formData.photo_url ? (
              <div className="md:col-span-2 rounded-xl border border-slate-200 bg-slate-50 p-3">
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
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Address <span className="text-red-500">*</span>
            </label>
            <div className="flex items-start border border-cyan-200/30 dark:border-cyan-700/50 rounded-lg bg-cyan-50/30 dark:bg-cyan-900/10 focus-within:border-cyan-400 focus-within:ring-1 focus-within:ring-cyan-400/50 transition-all">
              <span className="material-symbols-outlined pl-2 pt-2 text-cyan-200 text-base">home</span>
              <textarea
                name="address"
                value={formData.address}
                onChange={handleChange}
                onBlur={handleBlur}
                maxLength={50}
                rows="3"
                className="w-full bg-transparent border-none focus:ring-0 py-1.5 px-2 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 resize-none"
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
            <input
              type="checkbox"
              name="uses_transport"
              checked={formData.uses_transport}
              onChange={handleChange}
              className="w-4 h-4 rounded border-cyan-300 text-cyan-500 focus:ring-cyan-400"
              id="uses_transport"
            />
            <label htmlFor="uses_transport" className="text-sm font-medium text-slate-700 dark:text-slate-300 cursor-pointer">
              Uses Transport
            </label>
          </div>

          {/* Transport Charge (conditional) */}
          {formData.uses_transport && (
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Transport Charge
              </label>
              <div className="flex items-center border border-cyan-200/30 dark:border-cyan-700/50 rounded-lg bg-cyan-50/30 dark:bg-cyan-900/10 focus-within:border-cyan-400 focus-within:ring-1 focus-within:ring-cyan-400/50 transition-all">
                <span className="material-symbols-outlined pl-2 text-cyan-200 text-base">local_shipping</span>
                <input
                  type="number"
                  name="transport_charge"
                  value={formData.transport_charge || ''}
                  onChange={handleChange}
                  className="w-full bg-transparent border-none focus:ring-0 py-1.5 px-2 text-sm text-slate-900 dark:text-white placeholder:text-slate-400"
                  placeholder="Enter transport charge"
                  step="0.01"
                />
              </div>
            </div>
          )}

          {/* Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 text-sm font-bold text-white bg-cyan-500 hover:bg-cyan-500/90 rounded-lg shadow-lg shadow-cyan-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
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
      </div>
    </div>
  )
}

export default AddStudent
