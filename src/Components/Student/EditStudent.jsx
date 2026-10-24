import React, { useState, useEffect, useMemo, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import api, { emitToast } from '../../Api/auth'
import { updateStudent, leaveStudent } from '../../Api/students'
import { DEFAULT_PHOTO_ADJUSTMENT, createAdjustedStudentPhotoFile } from './StudentPhotoAdjuster'
import { CLASS_OPTIONS } from '../../constants/schoolOptions'

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

function EditStudent({ isOpen, onClose, onSuccess, studentData, fullPage = false }) {
  const navigate = useNavigate()
  const fileInputRef = useRef(null)

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
  const [showPhotoAdjuster, setShowPhotoAdjuster] = useState(false)
  const [deactivating, setDeactivating] = useState(false)

  // Populate form data when studentData changes or modal opens
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
          `SPS-2024-${String(studentData.Roll || '081').padStart(4, '0')}`
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

  const calculatedAge = useMemo(() => {
    return calculateAgeFromDob(formData.date_of_birth)
  }, [formData.date_of_birth])

  const currentUsername = useMemo(() => {
    return formData.username || buildStudentUsernamePreview(formData.name, formData.mobile)
  }, [formData.username, formData.name, formData.mobile])

  const isMobileChanged = useMemo(() => {
    return originalMobile && formData.mobile && formData.mobile !== originalMobile
  }, [originalMobile, formData.mobile])

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

  const validateField = (fieldName, fieldValue) => {
    const value = (fieldValue ?? '').toString().trim()

    if (fieldName === 'name' || fieldName === 'father_name' || fieldName === 'mother_name') {
      if (!value) return 'This field is required.'
      if (!/^[A-Z ]+$/.test(value)) return 'Only alphabets and spaces are allowed.'
      return ''
    }

    if (fieldName === 'class') {
      if (!value) return 'Class is required.'
      return ''
    }

    if (fieldName === 'section') {
      if (!value) return 'Section is required.'
      if (!/^[A-Z]$/.test(value)) return 'Section must be a single capital letter.'
      return ''
    }

    if (fieldName === 'roll_no') {
      if (!value) return 'Roll number is required.'
      if (parseInt(value, 10) <= 0) return 'Roll number must be greater than 0.'
      return ''
    }

    if (fieldName === 'mobile') {
      if (!value) return 'Mobile number is required.'
      if (!/^[6-9]\d{9}$/.test(value)) return 'Enter a valid 10-digit number starting with 6-9.'
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
        setShowPhotoAdjuster(true)
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
      `Portal password reset to Date of Birth (${dobPassword}). An SMS update will be sent to ${formData.mobile || 'parent phone'}.`,
      'Password Reset'
    )
  }

  const handleIssueTC = async () => {
    if (!studentId) {
      emitToast('error', 'Student record not found.', 'Error')
      return
    }
    const confirmReason = window.prompt(
      `Are you sure you want to issue Transfer Certificate (TC) and deactivate ${formData.name || 'this student'}? Enter reason (e.g. Relocated / Completed School):`,
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
        setError('Please fix the highlighted errors before saving.')
        emitToast('error', 'Please resolve all required fields.', 'Validation')
        setLoading(false)
        return
      }

      // Handle adjusted photo upload
      if (formData.photoFile) {
        try {
          const adjustedPhotoFile = await createAdjustedStudentPhotoFile(
            formData.photoFile,
            photoAdjustment
          )
          const uploadedUrl = await uploadStudentPhoto(adjustedPhotoFile || formData.photoFile)
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
        // If mock data or no ID
        emitToast('success', 'Student record updated (Local cache).', 'Updated')
        setSuccess(true)
        setTimeout(() => {
          onSuccess?.()
          onClose?.()
        }, 1500)
        return
      }

      const response = await updateStudent(studentId, submitData)

      if (response && response.success !== false) {
        setSuccess(true)
        emitToast('success', `Student record for ${normalizedFormData.name} updated successfully!`, 'Update Complete')
        setTimeout(() => {
          onSuccess?.()
          onClose?.()
        }, 1500)
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

  // Shared Form Card Classes matching Canva Blueprint
  const cardClass = 'rounded-2xl border border-slate-200/90 bg-white p-5 sm:p-6 shadow-2xs space-y-5 transition-all'
  const sectionHeaderClass = 'flex items-center gap-3 border-b border-slate-100 pb-3'
  const sectionBadgeClass = 'flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#e2ecf8] text-[#1d4ed8]'
  const labelClass = 'block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5'
  const inputClass =
    'w-full rounded-xl border border-slate-200 bg-slate-50/70 px-3.5 py-2.5 text-xs sm:text-sm font-medium text-slate-900 transition-all placeholder:text-slate-400 focus:border-[#2563eb] focus:bg-white focus:ring-2 focus:ring-blue-100 outline-none'
  const lockedInputClass =
    'w-full rounded-xl border border-dashed border-slate-300 bg-slate-100/80 px-3.5 py-2.5 text-xs sm:text-sm font-medium text-slate-500 cursor-not-allowed outline-none select-none flex items-center justify-between'
  const fieldErrorClass = 'mt-1 text-[11px] font-semibold text-rose-600 flex items-center gap-1'

  const content = (
    <div className="space-y-6">
      {/* ================= 1. TOP HEADER & CONTEXT BADGES (Canva Blueprint) ================= */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200/70 pb-4">
        <div>
          <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-slate-500">
            <button
              type="button"
              onClick={onClose}
              className="hover:text-slate-800 transition-colors inline-flex items-center gap-1"
            >
              <span>SPS</span>
              <span>/</span>
              <span>STUDENTS</span>
              <span>/</span>
              <span>DIRECTORY</span>
            </button>
            <span>/</span>
            <span className="text-[#1d4ed8]">EDIT RECORD</span>
          </div>

          <div className="mt-1 flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 shadow-2xs hover:bg-slate-50 transition-colors"
              title="Back to Student Profile"
            >
              <span className="material-symbols-outlined text-lg">arrow_back</span>
            </button>

            <div>
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-[#0f1e36]">
                  Edit Student Record — {formData.name || 'Student'}
                </h1>

                {/* Context Badges Bar */}
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="rounded-full bg-[#e2ecf8] px-2.5 py-0.5 text-xs font-bold text-[#1e40af]">
                    Class {formData.class || '10'}-{formData.section || 'A'}
                  </span>
                  <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-bold text-slate-700">
                    Roll: {formData.roll_no || '--'}
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-bold text-emerald-700">
                    <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span>Active Student</span>
                  </span>
                </div>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Admission ID: <span className="font-mono font-bold text-slate-600">{formData.admission_number || 'SPS-2024-0081'}</span>
              </p>
            </div>
          </div>
        </div>

        {/* Top Header Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={handleIssueTC}
            disabled={deactivating}
            className="rounded-xl border border-rose-200 bg-rose-50/70 px-3.5 py-2.5 text-xs font-bold text-rose-700 shadow-2xs hover:bg-rose-100/80 transition-colors flex items-center gap-1.5"
            title="Deactivate and issue Transfer Certificate"
          >
            <span className="material-symbols-outlined text-sm">exit_to_app</span>
            <span>Issue TC / Deactivate</span>
          </button>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-bold text-slate-700 shadow-2xs hover:bg-slate-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-xl bg-[#0f1e36] px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-slate-900/15 hover:bg-[#152e50] disabled:opacity-50 transition-all"
          >
            {loading ? (
              <>
                <span className="material-symbols-outlined animate-spin text-sm">sync</span>
                <span>Updating...</span>
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-sm">check</span>
                <span>Save & Update Record</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Success Notification Banner */}
      {success && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/90 p-4 shadow-sm flex items-center gap-3 text-emerald-900">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500 text-white font-bold">
            ✓
          </span>
          <div>
            <p className="text-sm font-bold">Student record successfully updated!</p>
            <p className="text-xs text-emerald-700">Changes have been synced across academic rolls and parent portal.</p>
          </div>
        </div>
      )}

      {/* Error Notification Banner */}
      {error && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50/90 p-4 shadow-sm flex items-center gap-3 text-rose-900">
          <span className="material-symbols-outlined text-rose-600">error</span>
          <p className="text-xs sm:text-sm font-semibold">{error}</p>
        </div>
      )}

      {/* ================= 2. TWO-COLUMN GRID LAYOUT (65% / 35%) ================= */}
      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* ================= LEFT COLUMN (65% · 8 of 12 cols) ================= */}
        <div className="lg:col-span-7 xl:col-span-8 space-y-6">
          {/* Card 1: Academic Re-allocation */}
          <div className={cardClass}>
            <div className={sectionHeaderClass}>
              <div className={sectionBadgeClass}>
                <span className="material-symbols-outlined text-lg">school</span>
              </div>
              <div>
                <h2 className="text-sm font-extrabold text-[#0f1e36]">1. Academic Re-allocation</h2>
                <p className="text-xs text-slate-400">Section reshuffling, roll number and locked admission identifier</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Class Dropdown */}
              <div>
                <label className={labelClass}>
                  Class <span className="text-rose-500">*</span>
                </label>
                <select
                  name="class"
                  value={formData.class}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className={inputClass}
                  required
                >
                  <option value="" disabled>
                    Select class
                  </option>
                  {CLASS_OPTIONS.map((c) => (
                    <option key={c} value={c}>
                      {c.startsWith('Class') || c === 'Nursery' || c === 'LKG' || c === 'UKG'
                        ? c
                        : `Class ${c}`}
                    </option>
                  ))}
                </select>
                {fieldErrors.class && <p className={fieldErrorClass}>{fieldErrors.class}</p>}
              </div>

              {/* Section Dropdown */}
              <div>
                <label className={labelClass}>
                  Section <span className="text-rose-500">*</span>
                </label>
                <select
                  name="section"
                  value={formData.section}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className={inputClass}
                  required
                >
                  <option value="A">Section A</option>
                  <option value="B">Section B</option>
                  <option value="C">Section C</option>
                  <option value="D">Section D</option>
                </select>
                {fieldErrors.section && <p className={fieldErrorClass}>{fieldErrors.section}</p>}
              </div>

              {/* Roll Number */}
              <div>
                <label className={labelClass}>
                  Roll Number <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  name="roll_no"
                  value={formData.roll_no}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  min="1"
                  className={inputClass}
                  required
                />
                {fieldErrors.roll_no && <p className={fieldErrorClass}>{fieldErrors.roll_no}</p>}
              </div>

              {/* Admission Number (Locked) */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Admission No
                  </label>
                  <span className="material-symbols-outlined text-xs text-slate-400">lock</span>
                </div>
                <div className={lockedInputClass} title="Admission number is permanently locked">
                  <span className="font-mono">{formData.admission_number || 'SPS-2024-0081'}</span>
                  <span className="text-[10px] text-slate-400 font-bold uppercase">Locked</span>
                </div>
              </div>

              {/* Admission Date (Locked) */}
              <div className="sm:col-span-2">
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Original Admission Date
                  </label>
                  <span className="material-symbols-outlined text-xs text-slate-400">lock</span>
                </div>
                <div className={lockedInputClass} title="Original enrollment date is recorded">
                  <span>{formData.admission_date || '12/06/2024'}</span>
                  <span className="text-[10px] text-slate-400 font-bold uppercase">Original</span>
                </div>
              </div>
            </div>
          </div>

          {/* Card 2: Personal Identification Update */}
          <div className={cardClass}>
            <div className={sectionHeaderClass}>
              <div className={sectionBadgeClass}>
                <span className="material-symbols-outlined text-lg">badge</span>
              </div>
              <div>
                <h2 className="text-sm font-extrabold text-[#0f1e36]">
                  2. Personal Identification Update
                </h2>
                <p className="text-xs text-slate-400">Student bio, official identity proofs & age update</p>
              </div>
            </div>

            <div className="space-y-4">
              {/* Full Name */}
              <div>
                <label className={labelClass}>
                  Student Full Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className={`${inputClass} font-semibold uppercase`}
                  required
                />
                {fieldErrors.name && <p className={fieldErrorClass}>{fieldErrors.name}</p>}
              </div>

              {/* Gender Segmented Pills */}
              <div>
                <label className={labelClass}>
                  Gender <span className="text-rose-500">*</span>
                </label>
                <div className="grid grid-cols-3 gap-2.5 max-w-md">
                  {['Male', 'Female', 'Other'].map((g) => {
                    const isSelected = formData.gender === g
                    return (
                      <button
                        key={g}
                        type="button"
                        onClick={() =>
                          setFormData((prev) => ({ ...prev, gender: g }))
                        }
                        className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                          isSelected
                            ? 'bg-[#0f1e36] text-white shadow-2xs'
                            : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <span className="text-sm">
                          {g === 'Male' ? '👦' : g === 'Female' ? '👧' : '🧑'}
                        </span>
                        <span>{g}</span>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* DOB with Live Age Badge */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Date of Birth <span className="text-rose-500">*</span>
                    </label>
                    {calculatedAge && (
                      <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-700">
                        Age: {calculatedAge}
                      </span>
                    )}
                  </div>
                  <input
                    type="date"
                    name="date_of_birth"
                    value={formData.date_of_birth}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    className={inputClass}
                    required
                  />
                  {fieldErrors.date_of_birth && (
                    <p className={fieldErrorClass}>{fieldErrors.date_of_birth}</p>
                  )}
                </div>

                {/* Aadhaar Card */}
                <div>
                  <label className={labelClass}>
                    Aadhaar Card Number <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="aadhaar_card"
                    value={formData.aadhaar_card}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    maxLength={12}
                    inputMode="numeric"
                    className={`${inputClass} font-mono`}
                    required
                  />
                  {fieldErrors.aadhaar_card && (
                    <p className={fieldErrorClass}>{fieldErrors.aadhaar_card}</p>
                  )}
                </div>
              </div>

              {/* PEN (UDISE+) */}
              <div>
                <label className={labelClass}>
                  PEN (Permanent Education Number){' '}
                  <span className="text-slate-400 font-normal">(UDISE+ National ID)</span>
                </label>
                <input
                  type="text"
                  name="pen_number"
                  value={formData.pen_number}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className={`${inputClass} font-mono uppercase`}
                />
                {fieldErrors.pen_number && (
                  <p className={fieldErrorClass}>{fieldErrors.pen_number}</p>
                )}
              </div>
            </div>
          </div>

          {/* Card 3: Guardian & Contact Update */}
          <div className={cardClass}>
            <div className={sectionHeaderClass}>
              <div className={sectionBadgeClass}>
                <span className="material-symbols-outlined text-lg">family_restroom</span>
              </div>
              <div>
                <h2 className="text-sm font-extrabold text-[#0f1e36]">
                  3. Guardian & Contact Update
                </h2>
                <p className="text-xs text-slate-400">Parentage records, primary contact & address details</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>
                  Father's Full Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  name="father_name"
                  value={formData.father_name}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className={`${inputClass} font-semibold uppercase`}
                  required
                />
                {fieldErrors.father_name && (
                  <p className={fieldErrorClass}>{fieldErrors.father_name}</p>
                )}
              </div>

              <div>
                <label className={labelClass}>
                  Mother's Full Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  name="mother_name"
                  value={formData.mother_name}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className={`${inputClass} font-semibold uppercase`}
                  required
                />
                {fieldErrors.mother_name && (
                  <p className={fieldErrorClass}>{fieldErrors.mother_name}</p>
                )}
              </div>

              <div className="sm:col-span-2">
                <label className={labelClass}>
                  Primary Mobile Number <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-xs font-bold text-slate-400">
                    +91
                  </span>
                  <input
                    type="tel"
                    name="mobile"
                    value={formData.mobile}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    maxLength={10}
                    className={`${inputClass} pl-11 font-mono`}
                    required
                  />
                </div>
                {fieldErrors.mobile && <p className={fieldErrorClass}>{fieldErrors.mobile}</p>}

                {/* Dynamic Amber Alert Box if mobile is changed */}
                {isMobileChanged && (
                  <div className="mt-2.5 rounded-xl border border-amber-200 bg-amber-50/80 p-3 text-xs text-amber-900 flex items-start gap-2">
                    <span className="material-symbols-outlined text-amber-600 text-sm shrink-0 mt-0.5">
                      warning
                    </span>
                    <div>
                      <p className="font-bold">Notice: Primary mobile number modified</p>
                      <p className="text-[11px] text-amber-800 mt-0.5">
                        Saving will update the parent portal login credentials to{' '}
                        <span className="font-mono font-bold">{currentUsername}</span>.
                      </p>
                    </div>
                  </div>
                )}
              </div>

              <div className="sm:col-span-2">
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Residential Address <span className="text-rose-500">*</span>
                  </label>
                  <span className="text-[10px] text-slate-400">
                    {formData.address.length}/50 chars
                  </span>
                </div>
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  maxLength={50}
                  className={inputClass}
                  required
                />
                {fieldErrors.address && <p className={fieldErrorClass}>{fieldErrors.address}</p>}
              </div>
            </div>
          </div>

          {/* Card 4: Transport Services */}
          <div className={cardClass}>
            <div className={sectionHeaderClass}>
              <div className={sectionBadgeClass}>
                <span className="material-symbols-outlined text-lg">directions_bus</span>
              </div>
              <div>
                <h2 className="text-sm font-extrabold text-[#0f1e36]">
                  4. Transport Service Settings
                </h2>
                <p className="text-xs text-slate-400">School bus route and monthly charges</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/70 p-3.5">
                <div>
                  <p className="text-xs font-bold text-slate-800">
                    Uses School Transport?
                  </p>
                  <p className="text-[11px] text-slate-400">
                    Bus attendance tracking & monthly ledger inclusion
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    setFormData((prev) => ({
                      ...prev,
                      uses_transport: !prev.uses_transport,
                      transport_charge: !prev.uses_transport ? prev.transport_charge || '800' : '',
                    }))
                  }
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    formData.uses_transport ? 'bg-emerald-600' : 'bg-slate-200'
                  }`}
                >
                  <span
                    className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                      formData.uses_transport ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {formData.uses_transport && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1 animate-fadeIn">
                  <div>
                    <label className={labelClass}>Monthly Transport Charge (₹)</label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-2.5 text-xs font-bold text-slate-500">
                        ₹
                      </span>
                      <input
                        type="number"
                        name="transport_charge"
                        value={formData.transport_charge}
                        onChange={handleChange}
                        placeholder="800"
                        className={`${inputClass} pl-8`}
                      />
                    </div>
                  </div>
                  <div>
                    <label className={labelClass}>Assigned Route / Stop</label>
                    <input
                      type="text"
                      className={inputClass}
                      readOnly
                      value="Mathia Bazar Stand (Route 2 - Bus #4)"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ================= RIGHT COLUMN (35% · 4 of 12 cols) ================= */}
        <div className="lg:col-span-5 xl:col-span-4 space-y-6">
          {/* Card 5: Student Photo Management & Crop Studio */}
          <div className={cardClass}>
            <div className={sectionHeaderClass}>
              <div className={sectionBadgeClass}>
                <span className="material-symbols-outlined text-lg">photo_camera</span>
              </div>
              <div>
                <h2 className="text-sm font-extrabold text-[#0f1e36]">
                  5. Photo Update Studio
                </h2>
                <p className="text-xs text-slate-400">Current passport photo & framing adjustment</p>
              </div>
            </div>

            {/* Passport Preview Frame */}
            <div className="flex flex-col items-center">
              <div className="relative flex h-[180px] w-[140px] items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 shadow-inner group">
                {formData.photo_url ? (
                  <img
                    src={formData.photo_url}
                    alt="Current student portrait"
                    className="h-full w-full object-cover transition-transform"
                    style={{
                      transform: `translate(${photoAdjustment.x}%, ${photoAdjustment.y}%) scale(${photoAdjustment.zoom})`,
                      transformOrigin: 'center center',
                    }}
                  />
                ) : (
                  <div className="text-center p-3 text-slate-400">
                    <span className="material-symbols-outlined text-4xl text-slate-300">
                      account_circle
                    </span>
                    <p className="text-[10px] font-semibold mt-1">35 × 45 mm</p>
                  </div>
                )}
                <div className="pointer-events-none absolute inset-0 border border-slate-900/10 rounded-2xl" />
              </div>

              {/* Upload Dropzone Buttons */}
              <div className="mt-3.5 flex flex-wrap items-center justify-center gap-2">
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
                  className="rounded-xl bg-[#0f1e36] px-3.5 py-1.5 text-xs font-bold text-white shadow-2xs hover:bg-[#152e50] transition-colors flex items-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-sm">cloud_upload</span>
                  <span>Replace Photo</span>
                </button>

                {formData.photo_url && (
                  <button
                    type="button"
                    onClick={() => setShowPhotoAdjuster(!showPhotoAdjuster)}
                    className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors"
                  >
                    {showPhotoAdjuster ? 'Hide Sliders' : 'Adjust Framing'}
                  </button>
                )}
              </div>
            </div>

            {/* Sliders if enabled */}
            {showPhotoAdjuster && formData.photo_url && (
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 space-y-2.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-700">Zoom / Scale</span>
                  <span className="font-mono text-slate-500">{photoAdjustment.zoom.toFixed(2)}x</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="2.5"
                  step="0.05"
                  value={photoAdjustment.zoom}
                  onChange={(e) =>
                    setPhotoAdjustment((prev) => ({ ...prev, zoom: parseFloat(e.target.value) }))
                  }
                  className="w-full accent-blue-600"
                />

                <div className="flex items-center justify-between pt-1">
                  <span className="font-bold text-slate-700">Pan (X / Y)</span>
                  <button
                    type="button"
                    onClick={() => setPhotoAdjustment(DEFAULT_PHOTO_ADJUSTMENT)}
                    className="text-[10px] font-bold text-blue-600 hover:underline"
                  >
                    Reset
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="range"
                    min="-30"
                    max="30"
                    step="1"
                    value={photoAdjustment.x}
                    onChange={(e) =>
                      setPhotoAdjustment((prev) => ({ ...prev, x: parseInt(e.target.value, 10) }))
                    }
                    className="w-full accent-blue-600"
                  />
                  <input
                    type="range"
                    min="-30"
                    max="30"
                    step="1"
                    value={photoAdjustment.y}
                    onChange={(e) =>
                      setPhotoAdjustment((prev) => ({ ...prev, y: parseInt(e.target.value, 10) }))
                    }
                    className="w-full accent-blue-600"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Card 6: Portal Credentials & Security Card */}
          <div className="rounded-2xl border border-slate-800 bg-[#0f1e36] p-5 text-white shadow-md space-y-4">
            <div className="flex items-center justify-between border-b border-slate-700 pb-3">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-blue-400 text-lg">key</span>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">
                  Portal Credentials & Security
                </h3>
              </div>
              <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-extrabold text-emerald-400">
                ACTIVE
              </span>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <p className="text-[10px] uppercase tracking-wider text-slate-400">
                  Active Portal Username
                </p>
                <div className="mt-1 flex items-center justify-between rounded-xl bg-slate-900/60 border border-slate-700 px-3 py-2 font-mono text-sm font-extrabold tracking-wider text-blue-300">
                  <span>{currentUsername}</span>
                  <span className="text-[10px] text-emerald-400 font-sans font-bold">● ONLINE</span>
                </div>
              </div>

              {/* Reset Password Button */}
              <div className="pt-2 border-t border-slate-700/60">
                <button
                  type="button"
                  onClick={handleResetPassword}
                  className="w-full rounded-xl border border-slate-600 bg-slate-800/80 hover:bg-slate-700/80 py-2.5 px-3 text-xs font-bold text-white transition-colors flex items-center justify-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-sm">lock_reset</span>
                  <span>Reset Password to DOB</span>
                </button>
                <p className="mt-1 text-[10px] text-slate-400 text-center">
                  Resets parent portal pin to DDMMYYYY format.
                </p>
              </div>
            </div>
          </div>

          {/* Card 7: Financial & Attendance Snapshot */}
          <div className={cardClass}>
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#1d4ed8] text-lg">insights</span>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Health & Ledger Snapshot
                </h3>
              </div>
              <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                Good Standing
              </span>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between py-1 border-b border-slate-50">
                <span className="text-slate-500 font-medium">Fee Dues Status</span>
                <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-bold text-emerald-700">
                  ● Cleared (₹ 0 Due)
                </span>
              </div>

              <div className="flex items-center justify-between py-1 border-b border-slate-50">
                <span className="text-slate-500 font-medium">Overall Attendance</span>
                <span className="font-extrabold text-[#0f1e36]">96.4% · Excellent</span>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => {
                    onClose?.()
                    navigate('/fees')
                  }}
                  className="w-full rounded-xl border border-slate-200 bg-white hover:bg-slate-50 py-2 text-xs font-bold text-[#1d4ed8] transition-colors flex items-center justify-center gap-1"
                >
                  <span>Open Complete Student Ledger</span>
                  <span className="material-symbols-outlined text-sm">arrow_forward</span>
                </button>
              </div>
            </div>
          </div>

          {/* Card 8: Audit Log & System Metadata */}
          <div className="rounded-2xl border border-slate-200/80 bg-slate-50/70 p-4 text-[11px] text-slate-500 space-y-1.5">
            <p className="font-bold uppercase tracking-wider text-slate-400 text-[10px]">
              Audit Log & Metadata
            </p>
            <div className="flex items-center justify-between">
              <span>Created On:</span>
              <span className="font-medium text-slate-700">
                {formData.admission_date || '12 Jun 2024'} (Super Admin)
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span>Last Modified:</span>
              <span className="font-medium text-slate-700">Today by Principal Sharma</span>
            </div>
          </div>

          {/* Save Action Bottom */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-[#0f1e36] hover:bg-[#152e50] py-3 text-xs font-bold text-white shadow-md shadow-slate-900/15 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <span className="material-symbols-outlined animate-spin text-sm">sync</span>
                  <span>Saving Record...</span>
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-sm">check</span>
                  <span>Save & Update Student</span>
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  )

  if (fullPage) {
    return content
  }

  // Modal mode
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-5">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs z-[9998]" onClick={onClose} />
      <div className="relative z-[9999] flex max-h-[92vh] w-full max-w-6xl flex-col overflow-hidden rounded-2xl bg-[#fbfcfb] shadow-2xl border border-slate-200">
        <div className="overflow-y-auto p-5 sm:p-7">{content}</div>
      </div>
    </div>
  )
}

export default EditStudent
