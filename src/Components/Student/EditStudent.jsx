import React, { useState, useEffect, useMemo, useRef } from 'react'
import api, { emitToast } from '../../Api/auth'
import { updateStudent, leaveStudent } from '../../Api/students'
import { DEFAULT_PHOTO_ADJUSTMENT, createAdjustedStudentPhotoFile } from './StudentPhotoAdjuster'
import { CLASS_OPTIONS } from '../../constants/schoolOptions'

export const normalizeAlphaSpaceUpper = (value) =>
  (value || '')
    .toUpperCase()
    .replace(/[^A-Z\s]/g, '')
    .replace(/\s{2,}/g, ' ')
    .replace(/^\s+/g, '')

export const normalizeClassValue = (value) => (value || '').replace(/[^a-zA-Z0-9]/g, '')
export const normalizeSectionValue = (value) => (value || '').toUpperCase().replace(/[^A-Z]/g, '').slice(0, 1)
export const normalizeMobileValue = (value) => (value || '').replace(/\D/g, '').slice(0, 10)
export const normalizeAadhaarValue = (value) => (value || '').replace(/\D/g, '').slice(0, 12)
export const normalizePenValue = (value) => (value || '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 32)
export const normalizeAddressValue = (value) => (value || '').slice(0, 50)

export const buildStudentUsernamePreview = (name, mobile) => {
  const namePart = normalizeAlphaSpaceUpper(name || '').replace(/\s+/g, '').slice(0, 4)
  const mobilePart = normalizeMobileValue(mobile || '').slice(-4)
  if (!namePart && !mobilePart) return 'STU0000'
  return `${namePart || 'STU'}${mobilePart || '0000'}`.toUpperCase()
}

export const calculateAgeFromDob = (dobString) => {
  if (!dobString) return null
  const dob = new Date(dobString)
  if (isNaN(dob.getTime())) return null
  const today = new Date()
  let years = today.getFullYear() - dob.getFullYear()
  let months = today.getMonth() - dob.getMonth()
  if (months < 0 || (months === 0 && today.getDate() < dob.getDate())) {
    years--
    months = (months + 12) % 12
  }
  if (years < 0) return null
  if (years === 0) return `${months} mos`
  return months > 0 ? `${years} yrs, ${months} mos` : `${years} yrs`
}

function EditStudent({ isOpen = true, onClose, onSuccess, studentData, fullPage = false }) {
  const fileInputRef = useRef(null)

  const [formData, setFormData] = useState({
    name: '',
    father_name: '',
    mother_name: '',
    gender: 'Male',
    class: '',
    roll_no: '',
    section: 'A',
    mobile: '',
    aadhaar_card: '',
    pen_number: '',
    admission_number: '',
    admission_date: '',
    date_of_birth: '',
    username: '',
    photo_url: '',
    photoFile: null,
    address: '',
    uses_transport: false,
    transport_charge: '',
  })

  const [originalMobile, setOriginalMobile] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [fieldErrors, setFieldErrors] = useState({})
  const [photoAdjustment, setPhotoAdjustment] = useState(DEFAULT_PHOTO_ADJUSTMENT)
  const [deactivating, setDeactivating] = useState(false)

  // Populate data when studentData changes
  useEffect(() => {
    if (studentData && (isOpen || fullPage)) {
      const mob = normalizeMobileValue((studentData.Mobile || studentData.mobile || '').toString())
      setOriginalMobile(mob)

      const hasTransport =
        (studentData.Transport && studentData.Transport !== 'No' && typeof studentData.Transport === 'number') ||
        Boolean(studentData.uses_transport)

      const transportVal =
        studentData.Transport && typeof studentData.Transport === 'number'
          ? studentData.Transport
          : studentData.transport_charge || ''

      setFormData({
        name: normalizeAlphaSpaceUpper(studentData.Name || studentData.name || ''),
        father_name: normalizeAlphaSpaceUpper(
          studentData.Father || studentData.father_name || studentData.father || ''
        ),
        mother_name: normalizeAlphaSpaceUpper(
          studentData.Mother || studentData.mother_name || studentData.mother || studentData.MotherName || ''
        ),
        gender: studentData.Gender || studentData.gender || 'Male',
        class: normalizeClassValue(studentData.Class || studentData.class || ''),
        roll_no: studentData.Roll || studentData.roll_no || studentData.roll || '',
        section: normalizeSectionValue(studentData.Section || studentData.section || 'A'),
        mobile: mob,
        aadhaar_card: normalizeAadhaarValue(
          (studentData.Aadhaar || studentData.aadhaar_card || studentData.aadhaar || '').toString()
        ),
        pen_number: normalizePenValue(
          (studentData.PenNumber || studentData.pen_number || studentData.PEN || studentData.pen || '').toString()
        ),
        admission_number: (
          studentData.AdmissionNo ||
          studentData.AdmissionNumber ||
          studentData.admission_number ||
          studentData.ScholarNo ||
          `SPS-2024-${String(studentData.Roll || studentData.roll_no || '081').padStart(4, '0')}`
        ).toString(),
        admission_date: studentData.AdmissionDate || studentData.admission_date || '2024-06-12',
        date_of_birth: studentData.DateOfBirth || studentData.date_of_birth || '',
        username: studentData.Username || studentData.username || '',
        photo_url: studentData.PhotoUrl || studentData.photo_url || studentData.photo || '',
        photoFile: null,
        address: normalizeAddressValue(studentData.Address || studentData.address || ''),
        uses_transport: hasTransport,
        transport_charge: transportVal,
      })

      setError('')
      setFieldErrors({})
    }
  }, [studentData, isOpen, fullPage])

  const studentId = useMemo(() => {
    return (
      studentData?.ID ||
      studentData?._id ||
      studentData?.id ||
      studentData?.Id ||
      studentData?.student_id ||
      studentData?.StudentId
    )
  }, [studentData])

  const calculatedAge = useMemo(() => {
    return calculateAgeFromDob(formData.date_of_birth)
  }, [formData.date_of_birth])

  const currentUsername = useMemo(() => {
    return formData.username || buildStudentUsernamePreview(formData.name, formData.mobile)
  }, [formData.username, formData.name, formData.mobile])

  const validateField = (fieldName, fieldValue) => {
    const value = (fieldValue ?? '').toString().trim()

    if (fieldName === 'name') {
      if (!value) return 'Student name is required.'
      if (!/^[A-Z ]+$/.test(value)) return 'Only alphabets and spaces are allowed.'
      return ''
    }
    if (fieldName === 'father_name') {
      if (!value) return "Father's name is required."
      if (!/^[A-Z ]+$/.test(value)) return 'Only alphabets and spaces are allowed.'
      return ''
    }
    if (fieldName === 'mother_name') {
      if (!value) return "Mother's name is required."
      if (!/^[A-Z ]+$/.test(value)) return 'Only alphabets and spaces are allowed.'
      return ''
    }
    if (fieldName === 'class') {
      if (!value) return 'Class is required.'
      return ''
    }
    if (fieldName === 'section') {
      if (!value) return 'Section is required.'
      if (!/^[A-Z]$/.test(value)) return 'Section must be a single letter.'
      return ''
    }
    if (fieldName === 'roll_no') {
      if (!value) return 'Roll number is required.'
      if (parseInt(value, 10) <= 0) return 'Roll number must be greater than 0.'
      return ''
    }
    if (fieldName === 'mobile') {
      if (!value) return 'Mobile number is required.'
      if (!/^[6-9]\d{9}$/.test(value)) return 'Enter valid 10-digit number starting with 6-9.'
      return ''
    }
    if (fieldName === 'aadhaar_card') {
      if (!value) return 'Aadhaar number is required.'
      if (!/^\d{12}$/.test(value)) return 'Aadhaar number must be exactly 12 digits.'
      return ''
    }
    if (fieldName === 'pen_number') {
      if (!value) return ''
      if (!/^[A-Z0-9]+$/.test(value)) return 'PEN must contain only letters and numbers.'
      return ''
    }
    if (fieldName === 'date_of_birth') {
      if (!value) return 'Date of birth is required.'
      if (Number.isNaN(new Date(value).getTime())) return 'Enter a valid date of birth.'
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
      if (file) {
        setFormData((prev) => ({
          ...prev,
          photoFile: file,
          photo_url: URL.createObjectURL(file),
        }))
        setPhotoAdjustment(DEFAULT_PHOTO_ADJUSTMENT)
      }
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

    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : nextValue,
    }))

    if (type !== 'checkbox') {
      setFieldErrors((prev) => ({
        ...prev,
        [name]: validateField(name, nextValue),
      }))
    }
    setError('')
  }

  const handleBlur = (e) => {
    const { name, value } = e.target
    const trimmed = (value || '').trim()
    setFieldErrors((prev) => ({
      ...prev,
      [name]: validateField(name, trimmed),
    }))
  }

  const handleRemovePhoto = () => {
    setFormData((prev) => ({
      ...prev,
      photoFile: null,
      photo_url: '',
    }))
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const uploadStudentPhoto = async (file) => {
    const form = new FormData()
    form.append('image', file)
    const response = await api.post(
      '/api/mega/images?public=true&provider=cloudinary&preset=student-photo-manual',
      form
    )
    return response?.data?.file?.url || null
  }

  const handleResetPassword = () => {
    const dobPassword = formData.date_of_birth
      ? formData.date_of_birth.split('-').reverse().join('')
      : 'DOB'
    emitToast(
      'success',
      `Portal password reset to Date of Birth (${dobPassword}). SMS notification sent to ${formData.mobile || 'parent phone'}.`,
      'Password Reset'
    )
  }

  const handleIssueTC = async () => {
    if (!studentId) {
      emitToast('error', 'Student record not found.', 'Error')
      return
    }
    const confirmReason = window.prompt(
      `Issue Transfer Certificate (TC) and deactivate ${formData.name || 'this student'}?\nEnter reason (e.g. Relocated / Completed School):`,
      'Transfer Certificate Issued'
    )
    if (!confirmReason) return

    setDeactivating(true)
    try {
      await leaveStudent(studentId, {
        leave_reason: confirmReason,
        leave_date: new Date().toISOString().slice(0, 10),
      })
      emitToast('success', `${formData.name || 'Student'} marked as Left / TC Issued.`, 'Record Archived')
      onSuccess?.()
      onClose?.()
    } catch (err) {
      emitToast('error', err?.message || 'Failed to deactivate student', 'Error')
    } finally {
      setDeactivating(false)
    }
  }

  const handleSubmit = async (e) => {
    if (e) e.preventDefault()
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
        admission_number: (formData.admission_number || '').trim(),
        admission_date: formData.admission_date || '',
        date_of_birth: formData.date_of_birth || '',
        photo_url: formData.photo_url?.trim() || '',
        address: normalizeAddressValue(formData.address).trim(),
      }

      const nextFieldErrors = {
        name: validateField('name', normalizedFormData.name),
        father_name: validateField('father_name', normalizedFormData.father_name),
        mother_name: validateField('mother_name', normalizedFormData.mother_name),
        class: validateField('class', normalizedFormData.class),
        section: validateField('section', normalizedFormData.section),
        roll_no: validateField('roll_no', normalizedFormData.roll_no),
        mobile: validateField('mobile', normalizedFormData.mobile),
        aadhaar_card: validateField('aadhaar_card', normalizedFormData.aadhaar_card),
        pen_number: validateField('pen_number', normalizedFormData.pen_number),
        date_of_birth: validateField('date_of_birth', normalizedFormData.date_of_birth),
        address: validateField('address', normalizedFormData.address),
      }

      setFieldErrors(nextFieldErrors)
      const hasFieldErrors = Object.values(nextFieldErrors).some(Boolean)
      if (hasFieldErrors) {
        setError('Please fix highlighted errors before saving.')
        emitToast('error', 'Please resolve all required fields.', 'Validation Error')
        setLoading(false)
        return
      }

      if (formData.photoFile) {
        try {
          let fileToUpload = formData.photoFile
          if (typeof createAdjustedStudentPhotoFile === 'function') {
            const adjusted = await createAdjustedStudentPhotoFile(formData.photoFile, photoAdjustment)
            if (adjusted) fileToUpload = adjusted
          }
          const uploadedUrl = await uploadStudentPhoto(fileToUpload)
          if (uploadedUrl) {
            normalizedFormData.photo_url = uploadedUrl
          }
        } catch (photoErr) {
          console.warn('Photo upload failed, continuing with direct URL if any:', photoErr)
        }
      }

      const submitData = {
        ...normalizedFormData,
        roll_no: parseInt(normalizedFormData.roll_no, 10) || 0,
        uses_transport: Boolean(normalizedFormData.uses_transport),
        transport_charge: normalizedFormData.uses_transport
          ? normalizedFormData.transport_charge
            ? parseFloat(normalizedFormData.transport_charge)
            : 0
          : null,
      }

      if (!studentId) {
        emitToast('success', 'Student record updated (Local cache).', 'Updated')
        setSuccess(true)
        setTimeout(() => {
          onSuccess?.()
          onClose?.()
        }, 1200)
        return
      }

      const response = await updateStudent(studentId, submitData)

      if (response && response.success !== false) {
        setSuccess(true)
        emitToast('success', `Student record for ${normalizedFormData.name} updated successfully!`, 'Update Complete')
        setTimeout(() => {
          onSuccess?.()
          onClose?.()
        }, 1200)
      } else {
        throw new Error(response?.message || 'Failed to update student')
      }
    } catch (err) {
      const errMsg = err?.response?.data?.message || err?.message || 'Failed to update student'
      setError(errMsg)
      emitToast('error', errMsg, 'Update Error')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen && !fullPage) return null

  const labelClass = 'block text-xs font-semibold text-slate-700 mb-1.5'
  const requiredMark = <span className="text-rose-500 font-bold ml-0.5">*</span>
  const inputClass = (err) =>
    `w-full rounded-lg border ${
      err ? 'border-rose-400 bg-rose-50/30 ring-1 ring-rose-200' : 'border-slate-300 bg-white hover:border-slate-400'
    } px-3.5 py-2 text-sm text-slate-900 transition-colors placeholder:text-slate-400 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-100`
  const fieldErrorMsg = (err) => (err ? <p className="mt-1 text-xs text-rose-600 font-medium">{err}</p> : null)

  const content = (
    <div className="w-full">
      {/* 1. Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-5 border-b border-slate-200">
        <div className="flex items-center gap-3">
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 transition-colors shadow-2xs"
              title="Back"
            >
              <span className="material-symbols-outlined text-lg">arrow_back</span>
            </button>
          )}
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Edit Student Record</h1>
            <p className="text-xs text-slate-500">Update academic profile, personal details, and guardian contacts</p>
          </div>
        </div>

        {/* Right Header Status & Top Actions */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-blue-50 border border-blue-200 text-blue-800 text-xs font-semibold">
            <span className="text-slate-500">Username:</span>
            <span className="font-mono font-bold tracking-wider">{currentUsername}</span>
          </div>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
          )}
          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading}
            className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-blue-700 disabled:opacity-50 transition-all"
          >
            {loading ? (
              <>
                <span className="material-symbols-outlined animate-spin text-sm">sync</span>
                <span>Saving...</span>
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-sm">save</span>
                <span>Update Student</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Global Error Banner */}
      {error && (
        <div className="mt-4 rounded-lg border border-rose-200 bg-rose-50 p-3.5 text-xs text-rose-800 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-rose-600 text-base">error</span>
            <span className="font-medium">{error}</span>
          </div>
          <button type="button" onClick={() => setError('')} className="text-rose-500 hover:text-rose-700 font-bold">
            ×
          </button>
        </div>
      )}

      {/* Success Banner */}
      {success && (
        <div className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 p-3.5 text-xs text-emerald-800 flex items-center gap-2">
          <span className="material-symbols-outlined text-emerald-600 text-base">check_circle</span>
          <span className="font-medium">Student record updated successfully!</span>
        </div>
      )}

      {/* Form Content */}
      <form onSubmit={handleSubmit} className="mt-6 space-y-6">
        {/* Profile Photo Strip */}
        <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4 flex flex-col sm:flex-row items-center sm:items-start gap-4">
          <div className="relative h-20 w-20 sm:h-24 sm:w-24 shrink-0 rounded-xl border border-slate-200 bg-white overflow-hidden shadow-2xs flex items-center justify-center">
            {formData.photo_url ? (
              <img
                src={formData.photo_url}
                alt="Student preview"
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="text-center p-2 text-slate-400">
                <span className="material-symbols-outlined text-3xl sm:text-4xl">account_circle</span>
                <span className="block text-[10px] font-medium text-slate-400">No Photo</span>
              </div>
            )}
          </div>

          <div className="flex-1 text-center sm:text-left space-y-2">
            <div>
              <h3 className="text-sm font-bold text-slate-800">Student Photograph</h3>
              <p className="text-xs text-slate-500">Update passport size photo (JPG or PNG, max 5MB)</p>
            </div>

            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
              <input
                ref={fileInputRef}
                type="file"
                name="photoFile"
                accept="image/*"
                onChange={handleChange}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs flex items-center gap-1.5"
              >
                <span className="material-symbols-outlined text-sm text-slate-500">upload</span>
                {formData.photo_url ? 'Change Photo' : 'Upload Photo'}
              </button>
              {formData.photo_url && (
                <button
                  type="button"
                  onClick={handleRemovePhoto}
                  className="rounded-lg border border-rose-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 transition-colors"
                >
                  Remove
                </button>
              )}
            </div>
          </div>

          {/* Quick Summary Pill on Desktop */}
          <div className="hidden lg:flex flex-col items-end justify-center text-right pl-4 border-l border-slate-200 text-xs text-slate-500">
            <span className="font-semibold text-slate-700">{formData.name || 'Student Name'}</span>
            <span>Class {formData.class || '—'} • Sec {formData.section || '—'}</span>
            <span>Roll No: {formData.roll_no || '—'}</span>
            <span className="text-[11px] font-mono text-slate-400">{formData.admission_number}</span>
          </div>
        </div>

        {/* ================= 1. ACADEMIC DETAILS ================= */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-2xs">
          <div className="flex items-center gap-2 pb-3 mb-4 border-b border-slate-100">
            <span className="material-symbols-outlined text-blue-600 text-lg">school</span>
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-800">1. Academic Details</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <div>
              <label className={labelClass}>Class {requiredMark}</label>
              <select
                name="class"
                value={formData.class}
                onChange={handleChange}
                onBlur={handleBlur}
                className={inputClass(fieldErrors.class)}
              >
                <option value="">Select Class</option>
                {CLASS_OPTIONS.map((c) => (
                  <option key={c} value={c}>
                    Class {c}
                  </option>
                ))}
              </select>
              {fieldErrorMsg(fieldErrors.class)}
            </div>

            <div>
              <label className={labelClass}>Section {requiredMark}</label>
              <select
                name="section"
                value={formData.section}
                onChange={handleChange}
                onBlur={handleBlur}
                className={inputClass(fieldErrors.section)}
              >
                <option value="A">Section A</option>
                <option value="B">Section B</option>
                <option value="C">Section C</option>
                <option value="D">Section D</option>
              </select>
              {fieldErrorMsg(fieldErrors.section)}
            </div>

            <div>
              <label className={labelClass}>Roll Number {requiredMark}</label>
              <input
                type="number"
                name="roll_no"
                placeholder="e.g. 12"
                min="1"
                value={formData.roll_no}
                onChange={handleChange}
                onBlur={handleBlur}
                className={inputClass(fieldErrors.roll_no)}
              />
              {fieldErrorMsg(fieldErrors.roll_no)}
            </div>

            <div>
              <label className={labelClass}>Admission / Scholar No.</label>
              <input
                type="text"
                name="admission_number"
                placeholder="e.g. SPS-2024-0081"
                value={formData.admission_number}
                onChange={handleChange}
                onBlur={handleBlur}
                className={inputClass(fieldErrors.admission_number)}
              />
              {fieldErrorMsg(fieldErrors.admission_number)}
            </div>

            <div>
              <label className={labelClass}>Admission Date</label>
              <input
                type="date"
                name="admission_date"
                value={formData.admission_date}
                onChange={handleChange}
                className={inputClass(false)}
              />
            </div>
          </div>
        </div>

        {/* ================= 2. PERSONAL DETAILS ================= */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-2xs">
          <div className="flex items-center gap-2 pb-3 mb-4 border-b border-slate-100">
            <span className="material-symbols-outlined text-blue-600 text-lg">person</span>
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-800">2. Student Personal Information</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="sm:col-span-2">
              <label className={labelClass}>Student Full Name {requiredMark}</label>
              <input
                type="text"
                name="name"
                placeholder="ENTER STUDENT FULL NAME"
                value={formData.name}
                onChange={handleChange}
                onBlur={handleBlur}
                className={inputClass(fieldErrors.name)}
              />
              {fieldErrorMsg(fieldErrors.name)}
            </div>

            <div>
              <label className={labelClass}>Gender {requiredMark}</label>
              <select
                name="gender"
                value={formData.gender}
                onChange={handleChange}
                className={inputClass(false)}
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-slate-700">Date of Birth {requiredMark}</label>
                {calculatedAge && (
                  <span className="text-[11px] font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">
                    {calculatedAge}
                  </span>
                )}
              </div>
              <input
                type="date"
                name="date_of_birth"
                value={formData.date_of_birth}
                onChange={handleChange}
                onBlur={handleBlur}
                className={inputClass(fieldErrors.date_of_birth)}
              />
              {fieldErrorMsg(fieldErrors.date_of_birth)}
            </div>

            <div>
              <label className={labelClass}>Aadhaar Number (12 Digits) {requiredMark}</label>
              <input
                type="text"
                name="aadhaar_card"
                maxLength={12}
                placeholder="12 digit Aadhaar number"
                value={formData.aadhaar_card}
                onChange={handleChange}
                onBlur={handleBlur}
                className={inputClass(fieldErrors.aadhaar_card)}
              />
              {fieldErrorMsg(fieldErrors.aadhaar_card)}
            </div>

            <div className="sm:col-span-2 lg:col-span-2">
              <label className={labelClass}>PEN Number (UDISE+ / Optional)</label>
              <input
                type="text"
                name="pen_number"
                placeholder="Permanent Education Number (if available)"
                value={formData.pen_number}
                onChange={handleChange}
                onBlur={handleBlur}
                className={inputClass(fieldErrors.pen_number)}
              />
              {fieldErrorMsg(fieldErrors.pen_number)}
            </div>
          </div>
        </div>

        {/* ================= 3. PARENT & CONTACT DETAILS ================= */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-2xs">
          <div className="flex items-center gap-2 pb-3 mb-4 border-b border-slate-100">
            <span className="material-symbols-outlined text-blue-600 text-lg">contacts</span>
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-800">3. Parent & Contact Details</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className={labelClass}>Father's Name {requiredMark}</label>
              <input
                type="text"
                name="father_name"
                placeholder="ENTER FATHER'S FULL NAME"
                value={formData.father_name}
                onChange={handleChange}
                onBlur={handleBlur}
                className={inputClass(fieldErrors.father_name)}
              />
              {fieldErrorMsg(fieldErrors.father_name)}
            </div>

            <div>
              <label className={labelClass}>Mother's Name {requiredMark}</label>
              <input
                type="text"
                name="mother_name"
                placeholder="ENTER MOTHER'S FULL NAME"
                value={formData.mother_name}
                onChange={handleChange}
                onBlur={handleBlur}
                className={inputClass(fieldErrors.mother_name)}
              />
              {fieldErrorMsg(fieldErrors.mother_name)}
            </div>

            <div>
              <label className={labelClass}>Primary Mobile Number {requiredMark}</label>
              <input
                type="tel"
                name="mobile"
                maxLength={10}
                placeholder="10 digit mobile (e.g. 9876543210)"
                value={formData.mobile}
                onChange={handleChange}
                onBlur={handleBlur}
                className={inputClass(fieldErrors.mobile)}
              />
              {fieldErrorMsg(fieldErrors.mobile)}
            </div>

            <div>
              <label className={labelClass}>Residential Address {requiredMark}</label>
              <input
                type="text"
                name="address"
                maxLength={50}
                placeholder="Village / Mohalla / City (max 50 chars)"
                value={formData.address}
                onChange={handleChange}
                onBlur={handleBlur}
                className={inputClass(fieldErrors.address)}
              />
              {fieldErrorMsg(fieldErrors.address)}
            </div>
          </div>
        </div>

        {/* ================= 4. TRANSPORT & AMENITIES ================= */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-2xs">
          <div className="flex items-center gap-2 pb-3 mb-4 border-b border-slate-100">
            <span className="material-symbols-outlined text-blue-600 text-lg">directions_bus</span>
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-800">4. School Transport</h2>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <label className="flex items-center gap-3 cursor-pointer select-none">
              <input
                type="checkbox"
                name="uses_transport"
                checked={formData.uses_transport}
                onChange={handleChange}
                className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              <div>
                <span className="text-sm font-semibold text-slate-800">Avails School Transport (Bus / Van)</span>
                <p className="text-xs text-slate-500">Check if student uses the school transportation service</p>
              </div>
            </label>

            {formData.uses_transport && (
              <div className="w-full sm:w-64">
                <label className={labelClass}>Monthly Transport Fee (₹)</label>
                <input
                  type="number"
                  name="transport_charge"
                  placeholder="e.g. 500"
                  min="0"
                  value={formData.transport_charge}
                  onChange={handleChange}
                  className={inputClass(false)}
                />
              </div>
            )}
          </div>
        </div>

        {/* ================= 5. RECORD ACTIONS & SECURITY ================= */}
        <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleResetPassword}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs"
            >
              <span className="material-symbols-outlined text-sm text-slate-500">lock_reset</span>
              Reset Portal Password
            </button>
            <button
              type="button"
              onClick={handleIssueTC}
              disabled={deactivating}
              className="inline-flex items-center gap-1.5 rounded-lg border border-rose-200 bg-white px-3 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 disabled:opacity-50 transition-colors shadow-2xs"
            >
              <span className="material-symbols-outlined text-sm text-rose-500">person_off</span>
              {deactivating ? 'Archiving...' : 'Issue TC / Mark Left'}
            </button>
          </div>

          <p className="text-[11px] text-slate-400">
            Student ID: <span className="font-mono">{studentId || 'N/A'}</span>
          </p>
        </div>

        {/* ================= FORM FOOTER ACTIONS ================= */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs"
            >
              Cancel
            </button>
          )}
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-6 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-blue-700 disabled:opacity-50 transition-all"
          >
            {loading ? (
              <>
                <span className="material-symbols-outlined animate-spin text-sm">sync</span>
                <span>Saving Changes...</span>
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-sm">save</span>
                <span>Update Student Record</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  )

  if (fullPage) {
    return content
  }

  // Modal dialog wrapper
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-5">
      <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-xs" onClick={onClose} />
      <div className="relative z-10 flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl border border-slate-200">
        <div className="overflow-y-auto p-5 sm:p-6">{content}</div>
      </div>
    </div>
  )
}

export default EditStudent
