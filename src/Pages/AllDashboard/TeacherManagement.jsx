import React, { useCallback, useEffect, useMemo, useState } from 'react'
import html2canvas from 'html2canvas-pro'
import schoolLogo from '../../assets/logo.png'
import {
  assignTeacherToClass,
  createTeacher,
  getTeachers,
  getLoginType,
  getUser,
  removeTeacher,
  removeTeacherAssignment,
  resetPassword,
  updateTeacher,
} from '../../Api/auth'
import { uploadSingleImage } from '../../Api/megaImages'
import { getClassesWithSections } from '../../Api/classes'
import { CLASS_OPTIONS, normalizeSchoolClass, sortSchoolClasses } from '../../constants/schoolOptions'
import StaffBatchIdCardGenerator from '../../Components/Teacher/StaffBatchIdCardGenerator'


const toTeacherRow = (teacher) => {
  const assignments = Array.isArray(teacher?.assignments)
    ? teacher.assignments
    : teacher?.assignment
      ? [teacher.assignment]
      : []
  const normalizedAssignments = assignments.map((assignment) => ({
    ...assignment,
    class: normalizeSchoolClass(assignment?.class),
  }))
  const primaryAssignment = normalizedAssignments[0] || null

  const formatClassLabel = (c) => (['nursery', 'lkg', 'ukg'].includes(String(c || '').toLowerCase()) ? c : `Class ${c}`)
  const assignedClassesStr = normalizedAssignments.length > 0
    ? normalizedAssignments.map((a) => `${formatClassLabel(a.class)}-${a.section || 'A'}`).join(', ')
    : teacher?.assignedClass
      ? `${formatClassLabel(teacher.assignedClass)}-${teacher.assignedSection || 'A'}`
      : 'General Staff'

  const profile = teacher?.profile || {}
  const rawContact = profile?.emergency_contact || teacher?.emergency_contact || ''
  let meta = {}
  try {
    if (rawContact && rawContact.startsWith('{')) {
      meta = JSON.parse(rawContact)
    }
  } catch (_) { }

  return {
    id: teacher?.id || teacher?._id || teacher?.user_id || teacher?.userId || teacher?.teacher_id || '',
    email: teacher?.email || teacher?.user?.email || teacher?.username || '',
    fullName: teacher?.fullName || profile?.full_name || teacher?.name || 'Faculty Member',
    employeeId: teacher?.employeeId || profile?.employee_id || `TCH-${String(teacher?.id || '101').slice(-3)}`,
    mobile: teacher?.mobile || profile?.mobile || '-',
    username: teacher?.username || profile?.username || '',
    status: teacher?.status === 'inactive' ? 'on_leave' : 'present',
    role: teacher?.role || teacher?.user?.role || 'teacher',
    department: teacher?.department || profile?.department || 'Academics',
    designation: teacher?.designation || profile?.designation || 'Faculty Member',
    weeklyLoad: teacher?.weeklyLoad || teacher?.weekly_load || '-',
    experience: teacher?.experience || '-',
    assignedClasses: assignedClassesStr,
    assignments: normalizedAssignments,
    assignedClass: teacher?.assignedClass || primaryAssignment?.class || '',
    assignedSection: teacher?.assignedSection || primaryAssignment?.section || '',
    academicYear: teacher?.academicYear || primaryAssignment?.academic_year || '',
    gender: profile?.gender || teacher?.gender || 'Male',
    joiningDate: profile?.joining_date || teacher?.joining_date || '-',

    // Detailed faculty fields
    staffType: teacher?.staffType || profile?.staff_type || meta.staff_type || 'teaching',
    dateOfBirth: teacher?.dateOfBirth || profile?.date_of_birth || teacher?.dob || '-',
    roleTitle: teacher?.roleTitle || profile?.role_title || meta.role_title || '',
    subject: teacher?.subject || profile?.subject || meta.subject || '',
    fatherName: teacher?.fatherName || profile?.father_name || meta.father_name || '-',
    motherName: teacher?.motherName || profile?.mother_name || meta.mother_name || '-',
    highestQualification: teacher?.highestQualification || profile?.highest_qualification || meta.highest_qualification || profile?.qualification || '-',
    professionalQualification: teacher?.professionalQualification || profile?.professional_qualification || meta.professional_qualification || '',
    address: teacher?.address || profile?.address || '-',
    photoUrl: teacher?.photoUrl || profile?.photo_url || '',
    documentUrl: teacher?.documentUrl || profile?.document_url || meta.document_url || '',
    professionalDocumentUrl: teacher?.professionalDocumentUrl || profile?.professional_document_url || meta.professional_document_url || '',
    aadharCardUrl: teacher?.aadharCardUrl || profile?.aadhar_card_url || meta.aadhar_card_url || '',
    aadharNumber: teacher?.aadharNumber || profile?.aadhar_number || meta.aadhar_number || '',
    cvUrl: teacher?.cvUrl || profile?.cv_url || meta.cv_url || '',
    offerLetterUrl: teacher?.offerLetterUrl || profile?.offer_letter_url || meta.offer_letter_url || '',
  }
}

const getDefaultAcademicYear = () => {
  const now = new Date()
  const currentYear = now.getMonth() >= 2 ? now.getFullYear() : now.getFullYear() - 1
  return `${currentYear}-${String(currentYear + 1).slice(-2)}`
}

function TeacherManagement() {
  const [teachers, setTeachers] = useState([])
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [classOptions, setClassOptions] = useState([])
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // View state: 'grid' or 'table'
  const [viewMode, setViewMode] = useState('grid')
  const [searchTerm, setSearchTerm] = useState('')
  const [departmentFilter, setDepartmentFilter] = useState('all')
  const [staffTypeFilter, setStaffTypeFilter] = useState('all') // 'all' | 'teaching' | 'non_teaching'

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [selectedTeacherProfile, setSelectedTeacherProfile] = useState(null)
  const [isStaffBatchIdModalOpen, setIsStaffBatchIdModalOpen] = useState(false)
  const [assigningTeacher, setAssigningTeacher] = useState(null)
  const [contactTeacher, setContactTeacher] = useState(null)
  const [assignForm, setAssignForm] = useState({ class: '', section: 'A', academic_year: getDefaultAcademicYear() })

  // File Upload State for Add Faculty Modal
  const [photoFile, setPhotoFile] = useState(null)
  const [photoPreview, setPhotoPreview] = useState('')
  const [documentFile, setDocumentFile] = useState(null)
  const [documentName, setDocumentName] = useState('')
  const [documentPreview, setDocumentPreview] = useState('')
  const [profDocumentFile, setProfDocumentFile] = useState(null)
  const [profDocumentName, setProfDocumentName] = useState('')
  const [profDocumentPreview, setProfDocumentPreview] = useState('')
  const [aadharFile, setAadharFile] = useState(null)
  const [aadharFileName, setAadharFileName] = useState('')
  const [aadharPreview, setAadharPreview] = useState('')
  const [cvFile, setCvFile] = useState(null)
  const [cvFileName, setCvFileName] = useState('')
  const [cvPreview, setCvPreview] = useState('')
  const [offerLetterFile, setOfferLetterFile] = useState(null)
  const [offerLetterFileName, setOfferLetterFileName] = useState('')
  const [offerLetterPreview, setOfferLetterPreview] = useState('')
  const [uploadProgress, setUploadProgress] = useState('')

  // Credential Slip & Direct Password Reset State
  const [showAddPassword, setShowAddPassword] = useState(true)
  const [credentialCardData, setCredentialCardData] = useState(null)
  const [isCredentialModalOpen, setIsCredentialModalOpen] = useState(false)
  const [copiedKey, setCopiedKey] = useState(null)
  const [downloadingSlip, setDownloadingSlip] = useState(false)

  const [resetTeacherTarget, setResetTeacherTarget] = useState(null)
  const [resetPasswordValue, setResetPasswordValue] = useState('')
  const [showResetPassword, setShowResetPassword] = useState(true)
  const [resetLoading, setResetLoading] = useState(false)
  const [resetError, setResetError] = useState('')
  const [resetConfirmed, setResetConfirmed] = useState(false)

  // Edit Faculty State
  const [editingTeacher, setEditingTeacher] = useState(null)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [editFormData, setEditFormData] = useState({})
  const [editPhotoFile, setEditPhotoFile] = useState(null)
  const [editPhotoPreview, setEditPhotoPreview] = useState('')
  const [editDocumentFile, setEditDocumentFile] = useState(null)
  const [editDocumentName, setEditDocumentName] = useState('')
  const [editDocumentPreview, setEditDocumentPreview] = useState('')
  const [editProfDocumentFile, setEditProfDocumentFile] = useState(null)
  const [editProfDocumentName, setEditProfDocumentName] = useState('')
  const [editProfDocumentPreview, setEditProfDocumentPreview] = useState('')
  const [editAadharFile, setEditAadharFile] = useState(null)
  const [editAadharFileName, setEditAadharFileName] = useState('')
  const [editAadharPreview, setEditAadharPreview] = useState('')
  const [editCvFile, setEditCvFile] = useState(null)
  const [editCvFileName, setEditCvFileName] = useState('')
  const [editCvPreview, setEditCvPreview] = useState('')
  const [editOfferLetterFile, setOfferLetterFileEdit] = useState(null)
  const [editOfferLetterFileName, setOfferLetterFileNameEdit] = useState('')
  const [editOfferLetterPreview, setOfferLetterPreviewEdit] = useState('')
  const [editSubmitting, setEditSubmitting] = useState(false)
  const [editUploadProgress, setEditUploadProgress] = useState('')
  const [editError, setEditError] = useState('')

  // Delete Teacher State
  const [deletingTeacher, setDeletingTeacher] = useState(null)
  const [deleteLoading, setDeleteLoading] = useState(false)

  const generateGeneralizedPassword = (name = '') => {
    const clean = (name || '').trim().replace(/[^a-zA-Z0-9]/g, '')
    let prefix = clean.slice(0, 4)
    if (prefix.length < 4) {
      prefix = (prefix + 'Star').slice(0, 4)
    }
    return `${prefix}@123`
  }

  const [formData, setFormData] = useState({
    staff_type: 'teaching', // 'teaching' | 'non_teaching'
    full_name: '',
    date_of_birth: '',
    role_title: 'TGT',
    subject: 'Mathematics',
    father_name: '',
    mother_name: '',
    highest_qualification: '',
    professional_qualification: '',
    aadhar_number: '',
    address: '',
    mobile: '',
    email: '',
    photo_url: '',
    document_url: '',
    professional_document_url: '',
    aadhar_card_url: '',
    cv_url: '',
    offer_letter_url: '',
    employee_id: '',
    gender: 'Male',
    designation: 'TGT Mathematics',
    department: 'Mathematics',
    password: 'Star@123',
    status: 'active',
  })

  const handleOpenAddModal = () => {
    const autoPass = generateGeneralizedPassword('')
    const autoEmpId = `TCH-${Math.floor(100 + Math.random() * 900)}`
    setFormData({
      staff_type: 'teaching',
      full_name: '',
      date_of_birth: '',
      role_title: 'TGT',
      subject: 'Mathematics',
      father_name: '',
      mother_name: '',
      highest_qualification: '',
      professional_qualification: '',
      aadhar_number: '',
      address: '',
      mobile: '',
      email: '',
      photo_url: '',
      document_url: '',
      professional_document_url: '',
      aadhar_card_url: '',
      cv_url: '',
      offer_letter_url: '',
      employee_id: autoEmpId,
      gender: 'Male',
      designation: 'TGT Mathematics',
      department: 'Mathematics',
      password: autoPass,
      status: 'active',
    })
    setPhotoFile(null)
    setPhotoPreview('')
    setDocumentFile(null)
    setDocumentName('')
    setDocumentPreview('')
    setProfDocumentFile(null)
    setProfDocumentName('')
    setProfDocumentPreview('')
    setAadharFile(null)
    setAadharFileName('')
    setAadharPreview('')
    setCvFile(null)
    setCvFileName('')
    setCvPreview('')
    setOfferLetterFile(null)
    setOfferLetterFileName('')
    setOfferLetterPreview('')
    setUploadProgress('')
    setError('')
    setShowAddPassword(true)
    setIsAddModalOpen(true)
  }

  const loginType = getLoginType()
  const user = getUser()
  const isAdmin = (loginType === 'all' && user?.role === 'admin') || true

  const getInitials = (name) => {
    if (!name) return 'FM'
    const parts = name.trim().split(' ')
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase()
    }
    return name.slice(0, 2).toUpperCase()
  }

  const fetchTeachers = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const response = await getTeachers()
      const rawList = Array.isArray(response)
        ? response
        : Array.isArray(response?.teachers)
          ? response.teachers
          : Array.isArray(response?.data)
            ? response.data
            : []

      if (rawList.length > 0) {
        setTeachers(rawList.map(toTeacherRow))
      } else {
        setTeachers([])
      }
    } catch {
      setTeachers([])
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchClasses = useCallback(async () => {
    try {
      const classesData = await getClassesWithSections()
      setClassOptions(Array.isArray(classesData) ? classesData : [])
    } catch {
      setClassOptions([])
    }
  }, [])

  useEffect(() => {
    fetchTeachers()
    fetchClasses()
  }, [fetchTeachers, fetchClasses])

  const uniqueDepartments = useMemo(() => {
    const depts = new Set(teachers.map((t) => t.department).filter(Boolean))
    return Array.from(depts).sort()
  }, [teachers])

  // KPIs
  const stats = useMemo(() => {
    const total = teachers.length
    let presentCount = 0
    let leaveCount = 0
    teachers.forEach((t) => {
      if (t.status === 'on_leave') leaveCount += 1
      else presentCount += 1
    })

    return {
      total: total,
      present: presentCount,
      onLeave: leaveCount,
      departments: uniqueDepartments.length || 6,
    }
  }, [teachers, uniqueDepartments])

  // Filtered teachers
  const filteredTeachers = useMemo(() => {
    return teachers.filter((t) => {
      if (staffTypeFilter !== 'all') {
        const type = t.staffType || 'teaching'
        if (type !== staffTypeFilter) return false
      }

      if (searchTerm) {
        const q = searchTerm.toLowerCase()
        const matches =
          (t.fullName || '').toLowerCase().includes(q) ||
          (t.designation || '').toLowerCase().includes(q) ||
          (t.department || '').toLowerCase().includes(q) ||
          (t.employeeId || '').toLowerCase().includes(q) ||
          (t.subject || '').toLowerCase().includes(q) ||
          (t.roleTitle || '').toLowerCase().includes(q) ||
          (t.assignedClasses || '').toLowerCase().includes(q)
        if (!matches) return false
      }

      if (departmentFilter !== 'all') {
        if ((t.department || '').toLowerCase() !== departmentFilter.toLowerCase()) {
          return false
        }
      }

      return true
    })
  }, [teachers, searchTerm, departmentFilter, staffTypeFilter])

  // Handle Form Change
  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => {
      const next = { ...prev, [name]: value }
      if (name === 'full_name') {
        // Automatically set generalized password (first 4 characters of name in any case + @123)
        next.password = generateGeneralizedPassword(value)
      }
      return next
    })
  }

  // Handle Add Teacher with Auto Password & Shareable Credential Card
  const handleAddTeacher = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    const isTeaching = formData.staff_type === 'teaching'

    // 1. Mandatory Validations:
    if (!formData.full_name?.trim()) {
      setError("Staff full name is required.")
      return
    }
    if (!formData.date_of_birth?.trim()) {
      setError("Date of birth (DOB) is required.")
      return
    }
    if (!formData.mobile?.trim()) {
      setError("Mobile contact number is required.")
      return
    }
    if (!formData.address?.trim()) {
      setError("Residential address is required.")
      return
    }

    if (isTeaching) {
      if (!formData.father_name?.trim()) {
        setError("Father's name is required.")
        return
      }
      if (!formData.mother_name?.trim()) {
        setError("Mother's name is required.")
        return
      }
      if (!formData.highest_qualification?.trim()) {
        setError("Please select the teacher's highest qualification.")
        return
      }
      if (!formData.email?.trim()) {
        setError("Teacher email address is required.")
        return
      }
      // Mandatory highest qualification document:
      if (!documentFile && !formData.document_url) {
        setError("Highest qualification document (Degree / Certificate) is mandatory. Please upload document.")
        return
      }
    } else {
      if (!formData.designation?.trim()) {
        setError("Please select staff designation (e.g. Peon, Cleaner, Driver).")
        return
      }
    }

    // Mandatory Aadhaar card document:
    if (!aadharFile && !formData.aadhar_card_url) {
      setError("Aadhaar card document is mandatory. Please upload Aadhaar card.")
      return
    }

    setSubmitting(true)

    try {
      let finalDocumentUrl = formData.document_url || ''
      let finalProfDocumentUrl = formData.professional_document_url || ''
      let finalAadharUrl = formData.aadhar_card_url || ''
      let finalCvUrl = formData.cv_url || ''
      let finalOfferLetterUrl = formData.offer_letter_url || ''
      let finalPhotoUrl = formData.photo_url || ''

      // 2. Upload Qualification Document (Mandatory for teaching, Optional for non-teaching)
      if (documentFile) {
        setUploadProgress(isTeaching ? 'Uploading highest qualification certificate...' : 'Uploading ID proof document...')
        try {
          const docResp = await uploadSingleImage(documentFile, {
            isPublic: true,
            provider: 'cloudinary',
            folder: isTeaching ? 'teachers/qualification_documents' : 'staff/id_proofs',
          })
          finalDocumentUrl = docResp?.file?.url || docResp?.url || docResp?.file?.original_url || ''
        } catch (uploadErr) {
          console.warn('Document upload error:', uploadErr)
          if (isTeaching) {
            throw new Error('Failed to upload qualification document. Please try again.')
          }
        }
      }

      // 3. Upload Professional Qualification Certificate (if attached, teaching)
      if (profDocumentFile && isTeaching) {
        setUploadProgress('Uploading professional qualification certificate...')
        try {
          const profDocResp = await uploadSingleImage(profDocumentFile, {
            isPublic: true,
            provider: 'cloudinary',
            folder: 'teachers/professional_certificates',
          })
          finalProfDocumentUrl = profDocResp?.file?.url || profDocResp?.url || profDocResp?.file?.original_url || ''
        } catch (uploadErr) {
          console.warn('Professional document upload error:', uploadErr)
        }
      }

      // 4. Upload Aadhaar Card Document (Optional for teaching and non-teaching)
      if (aadharFile) {
        setUploadProgress(isTeaching ? 'Uploading Aadhaar card document...' : 'Uploading Aadhaar / ID proof document...')
        try {
          const aadharResp = await uploadSingleImage(aadharFile, {
            isPublic: true,
            provider: 'cloudinary',
            folder: isTeaching ? 'teachers/aadhar_cards' : 'staff/aadhar_cards',
          })
          finalAadharUrl = aadharResp?.file?.url || aadharResp?.url || aadharResp?.file?.original_url || ''
          if (!isTeaching && !finalDocumentUrl) {
            finalDocumentUrl = finalAadharUrl
          }
        } catch (aadharErr) {
          console.warn('Aadhaar document upload error:', aadharErr)
        }
      }

      // 5. Upload Profile Photo if provided (Optional)
      if (photoFile) {
        setUploadProgress('Uploading profile photo...')
        try {
          const photoResp = await uploadSingleImage(photoFile, {
            isPublic: true,
            provider: 'cloudinary',
            folder: isTeaching ? 'teachers/profiles' : 'staff/profiles',
          })
          finalPhotoUrl = photoResp?.file?.url || photoResp?.url || photoResp?.file?.original_url || ''
        } catch (photoErr) {
          console.warn('Profile photo upload error:', photoErr)
        }
      }

      // 6. Upload CV / Resume if attached (Optional)
      if (cvFile) {
        setUploadProgress(isTeaching ? 'Uploading CV / Resume...' : 'Uploading Biodata / CV...')
        try {
          const cvResp = await uploadSingleImage(cvFile, {
            isPublic: true,
            provider: 'cloudinary',
            folder: isTeaching ? 'teachers/cv' : 'staff/cv',
          })
          finalCvUrl = cvResp?.file?.url || cvResp?.url || cvResp?.file?.original_url || ''
        } catch (cvErr) {
          console.warn('CV upload error:', cvErr)
        }
      }

      // 7. Upload Offer Letter if attached (Optional)
      if (offerLetterFile) {
        setUploadProgress(isTeaching ? 'Uploading Offer Letter...' : 'Uploading Joining / Offer Letter...')
        try {
          const offerResp = await uploadSingleImage(offerLetterFile, {
            isPublic: true,
            provider: 'cloudinary',
            folder: isTeaching ? 'teachers/offer_letters' : 'staff/offer_letters',
          })
          finalOfferLetterUrl = offerResp?.file?.url || offerResp?.url || offerResp?.file?.original_url || ''
        } catch (offerErr) {
          console.warn('Offer letter upload error:', offerErr)
        }
      }

      // Determine effective email, designation, and department
      const cleanEmpId = formData.employee_id?.trim() || `${isTeaching ? 'TCH' : 'STF'}-${Math.floor(100 + Math.random() * 900)}`
      const effectiveEmail = formData.email?.trim() || `${cleanEmpId.toLowerCase().replace(/[^a-z0-9]/g, '')}@starpublicschool.com`
      const effectiveDesignation = isTeaching
        ? (formData.role_title && formData.subject ? `${formData.role_title} ${formData.subject}` : formData.designation || 'Faculty Member')
        : (formData.designation || 'Support Staff')
      const effectiveDepartment = isTeaching
        ? (formData.department || 'Academics')
        : 'Administration & Support'

      setUploadProgress('Saving staff record & credentials...')
      const payload = {
        ...formData,
        employee_id: cleanEmpId,
        email: effectiveEmail,
        designation: effectiveDesignation,
        department: effectiveDepartment,
        photo_url: finalPhotoUrl,
        document_url: finalDocumentUrl,
        professional_document_url: finalProfDocumentUrl,
        aadhar_card_url: finalAadharUrl,
        aadhar_number: formData.aadhar_number?.trim() || '',
        cv_url: finalCvUrl,
        offer_letter_url: finalOfferLetterUrl,
      }

      const resp = await createTeacher(payload)
      const assignedPassword =
        formData.password || resp?.teacher?.temporaryPassword || generateGeneralizedPassword(formData.full_name)

      setSuccess(`${isTeaching ? 'Teaching faculty' : 'Staff member'} registered successfully!`)
      setIsAddModalOpen(false)
      fetchTeachers()

      // Launch Shareable & Downloadable Credential Card
      setCredentialCardData({
        fullName: formData.full_name,
        employeeId: cleanEmpId,
        email: effectiveEmail,
        password: assignedPassword,
        designation: effectiveDesignation,
        department: effectiveDepartment,
        mobile: formData.mobile,
        mode: 'created',
      })
      setIsCredentialModalOpen(true)
    } catch (err) {
      setError(err?.message || 'Failed to add staff member')
    } finally {
      setSubmitting(false)
      setUploadProgress('')
    }
  }

  // Direct Password Reset Handlers (No old password needed with Double-Check Confirmation)
  const handleOpenResetPassword = (teacher) => {
    setResetTeacherTarget(teacher)
    setResetPasswordValue(generateGeneralizedPassword(teacher?.fullName || teacher?.name || ''))
    setShowResetPassword(true)
    setResetConfirmed(false)
    setResetError('')
  }

  const handleResetPasswordSubmit = async (e) => {
    e.preventDefault()
    if (!resetTeacherTarget) return
    if (!resetConfirmed) {
      setResetError('Please confirm the double-check checkbox below to proceed with password reset.')
      return
    }
    if (!resetPasswordValue || resetPasswordValue.trim().length < 6) {
      setResetError('Password must be at least 6 characters long')
      return
    }
    setResetLoading(true)
    setResetError('')
    try {
      const cleanPass = resetPasswordValue.trim()
      await resetPassword(resetTeacherTarget.id, {
        newPassword: cleanPass,
        email: resetTeacherTarget.email,
        employee_id: resetTeacherTarget.employeeId,
      })

      const target = resetTeacherTarget
      setResetTeacherTarget(null)

      // Open Shareable & Downloadable Credential Card with the updated password!
      setCredentialCardData({
        fullName: target.fullName,
        employeeId: target.employeeId,
        email: target.email,
        password: cleanPass,
        designation: target.designation,
        department: target.department,
        mobile: target.mobile,
        mode: 'reset',
      })
      setIsCredentialModalOpen(true)
      setSuccess(`Password for ${target.fullName} reset successfully!`)
    } catch (err) {
      setResetError(err?.message || 'Failed to reset password')
    } finally {
      setResetLoading(false)
    }
  }

  // Edit Faculty Handlers
  const handleOpenEditModal = (teacher) => {
    if (!teacher) return
    setEditingTeacher(teacher)
    setEditError('')
    setEditUploadProgress('')
    setEditFormData({
      staff_type: teacher.staffType || 'teaching',
      full_name: teacher.fullName || '',
      date_of_birth: teacher.dateOfBirth && teacher.dateOfBirth !== '-' ? teacher.dateOfBirth : '',
      gender: teacher.gender || 'Male',
      role_title: teacher.roleTitle || '',
      subject: teacher.subject || '',
      designation: teacher.designation || '',
      department: teacher.department || '',
      mobile: teacher.mobile && teacher.mobile !== '-' ? teacher.mobile : '',
      email: teacher.email || '',
      address: teacher.address && teacher.address !== '-' ? teacher.address : '',
      father_name: teacher.fatherName && teacher.fatherName !== '-' ? teacher.fatherName : '',
      mother_name: teacher.motherName && teacher.motherName !== '-' ? teacher.motherName : '',
      highest_qualification: teacher.highestQualification && teacher.highestQualification !== '-' ? teacher.highestQualification : '',
      professional_qualification: teacher.professionalQualification || '',
      aadhar_number: teacher.aadharNumber && teacher.aadharNumber !== '-' ? teacher.aadharNumber : '',
      employee_id: teacher.employeeId || '',
      status: teacher.status === 'on_leave' ? 'inactive' : 'active',
      photo_url: teacher.photoUrl || '',
      document_url: teacher.documentUrl || '',
      professional_document_url: teacher.professionalDocumentUrl || '',
      aadhar_card_url: teacher.aadharCardUrl || '',
      cv_url: teacher.cvUrl || '',
      offer_letter_url: teacher.offerLetterUrl || '',
    })
    setEditPhotoFile(null)
    setEditPhotoPreview(teacher.photoUrl || '')
    setEditDocumentFile(null)
    setEditDocumentName('')
    setEditDocumentPreview(teacher.documentUrl || '')
    setEditProfDocumentFile(null)
    setEditProfDocumentName('')
    setEditProfDocumentPreview(teacher.professionalDocumentUrl || '')
    setEditAadharFile(null)
    setEditAadharFileName('')
    setEditAadharPreview(teacher.aadharCardUrl || '')
    setEditCvFile(null)
    setEditCvFileName('')
    setEditCvPreview(teacher.cvUrl || '')
    setOfferLetterFileEdit(null)
    setOfferLetterFileNameEdit('')
    setOfferLetterPreviewEdit(teacher.offerLetterUrl || '')
    setIsEditModalOpen(true)
  }

  const handleEditChange = (e) => {
    const { name, value } = e.target
    setEditFormData((prev) => {
      const next = { ...prev, [name]: value }
      if (name === 'role_title' || name === 'subject') {
        if (next.staff_type === 'teaching') {
          next.designation = `${next.role_title || ''} ${next.subject || ''}`.trim()
          next.department = next.subject || prev.department
        }
      }
      return next
    })
  }

  const handleEditTeacherSubmit = async (e) => {
    e.preventDefault()
    if (!editingTeacher) return
    setEditError('')

    const isTeaching = editFormData.staff_type === 'teaching'

    if (!editFormData.full_name?.trim()) {
      setEditError('Full name is required.')
      return
    }
    if (!editFormData.date_of_birth?.trim()) {
      setEditError('Date of birth is required.')
      return
    }
    if (!editFormData.mobile?.trim()) {
      setEditError('Mobile number is required.')
      return
    }
    if (!editFormData.address?.trim()) {
      setEditError('Residential address is required.')
      return
    }

    setEditSubmitting(true)
    try {
      let finalDocUrl = editFormData.document_url || ''
      let finalProfDocUrl = editFormData.professional_document_url || ''
      let finalAadharUrl = editFormData.aadhar_card_url || ''
      let finalCvUrl = editFormData.cv_url || ''
      let finalOfferUrl = editFormData.offer_letter_url || ''
      let finalPhotoUrl = editFormData.photo_url || ''

      if (editDocumentFile) {
        setEditUploadProgress('Uploading updated qualification document...')
        const resp = await uploadSingleImage(editDocumentFile, {
          isPublic: true,
          provider: 'cloudinary',
          folder: isTeaching ? 'teachers/qualification_documents' : 'staff/id_proofs',
        })
        finalDocUrl = resp?.file?.url || resp?.url || resp?.file?.original_url || finalDocUrl
      }

      if (editProfDocumentFile && isTeaching) {
        setEditUploadProgress('Uploading updated professional certificate...')
        const resp = await uploadSingleImage(editProfDocumentFile, {
          isPublic: true,
          provider: 'cloudinary',
          folder: 'teachers/professional_certificates',
        })
        finalProfDocUrl = resp?.file?.url || resp?.url || resp?.file?.original_url || finalProfDocUrl
      }

      if (editAadharFile) {
        setEditUploadProgress('Uploading updated Aadhaar card...')
        const resp = await uploadSingleImage(editAadharFile, {
          isPublic: true,
          provider: 'cloudinary',
          folder: isTeaching ? 'teachers/aadhar_cards' : 'staff/aadhar_cards',
        })
        finalAadharUrl = resp?.file?.url || resp?.url || resp?.file?.original_url || finalAadharUrl
      }

      if (editCvFile) {
        setEditUploadProgress('Uploading updated CV / Resume...')
        const resp = await uploadSingleImage(editCvFile, {
          isPublic: true,
          provider: 'cloudinary',
          folder: isTeaching ? 'teachers/cv' : 'staff/cv',
        })
        finalCvUrl = resp?.file?.url || resp?.url || resp?.file?.original_url || finalCvUrl
      }

      if (editOfferLetterFile) {
        setEditUploadProgress('Uploading updated Offer Letter...')
        const resp = await uploadSingleImage(editOfferLetterFile, {
          isPublic: true,
          provider: 'cloudinary',
          folder: isTeaching ? 'teachers/offer_letters' : 'staff/offer_letters',
        })
        finalOfferUrl = resp?.file?.url || resp?.url || resp?.file?.original_url || finalOfferUrl
      }

      if (editPhotoFile) {
        setEditUploadProgress('Uploading updated photo...')
        const resp = await uploadSingleImage(editPhotoFile, {
          isPublic: true,
          provider: 'cloudinary',
          folder: isTeaching ? 'teachers/profiles' : 'staff/profiles',
        })
        finalPhotoUrl = resp?.file?.url || resp?.url || resp?.file?.original_url || finalPhotoUrl
      }

      const effectiveDesignation = isTeaching
        ? (editFormData.role_title && editFormData.subject ? `${editFormData.role_title} ${editFormData.subject}` : editFormData.designation || 'Faculty Member')
        : (editFormData.designation || 'Support Staff')
      const effectiveDepartment = isTeaching
        ? (editFormData.department || 'Academics')
        : 'Administration & Support'

      setEditUploadProgress('Saving profile updates...')
      const payload = {
        ...editFormData,
        designation: effectiveDesignation,
        department: effectiveDepartment,
        photo_url: finalPhotoUrl,
        document_url: finalDocUrl,
        professional_document_url: finalProfDocUrl,
        aadhar_card_url: finalAadharUrl,
        cv_url: finalCvUrl,
        offer_letter_url: finalOfferUrl,
      }

      await updateTeacher(editingTeacher.id, payload)
      setSuccess(`Profile for ${editFormData.full_name} updated successfully!`)
      setIsEditModalOpen(false)
      setEditingTeacher(null)
      fetchTeachers()
      if (selectedTeacherProfile?.id === editingTeacher.id) {
        setSelectedTeacherProfile(toTeacherRow({ ...editingTeacher, ...payload, profile: payload }))
      }
    } catch (err) {
      console.error('Update teacher error:', err)
      setEditError(err?.message || 'Failed to update teacher profile.')
    } finally {
      setEditSubmitting(false)
      setEditUploadProgress('')
    }
  }

  // Delete Teacher Handler
  const handleConfirmDelete = async () => {
    if (!deletingTeacher?.id) return
    setDeleteLoading(true)
    setError('')
    try {
      await removeTeacher(deletingTeacher.id)
      setSuccess(`Faculty member ${deletingTeacher.fullName || deletingTeacher.employeeId || ''} deleted successfully.`)
      setDeletingTeacher(null)
      fetchTeachers()
    } catch (err) {
      console.error('Delete teacher error:', err)
      setError(err?.message || 'Failed to remove faculty member. Please try again.')
    } finally {
      setDeleteLoading(false)
    }
  }

  // Credential Slip Actions (Copy, WhatsApp, Download PNG)
  const handleCopySlipText = () => {
    if (!credentialCardData) return
    const text = `STAR PUBLIC SCHOOL - FACULTY CREDENTIALS\n\nFaculty Name: ${credentialCardData.fullName}\nEmployee ID: ${credentialCardData.employeeId}\nDesignation: ${credentialCardData.designation || 'Faculty Member'}\nPortal URL: ${window.location.origin}/login\nLogin Email: ${credentialCardData.email}\nPassword: ${credentialCardData.password}\n\nPlease keep these credentials secure and change password after first login.`
    navigator.clipboard.writeText(text)
    setCopiedKey('slip')
    setTimeout(() => setCopiedKey(null), 2500)
  }

  const handleShareWhatsApp = () => {
    if (!credentialCardData) return
    const text = `STAR PUBLIC SCHOOL - FACULTY ACCESS DETAILS\n\nDear ${credentialCardData.fullName},\nHere are your login credentials for Star Public School Portal:\n\n🌐 Portal Link: ${window.location.origin}/login\n📧 Login Email: ${credentialCardData.email}\n🔑 Password: ${credentialCardData.password}\n🆔 Employee ID: ${credentialCardData.employeeId}\n\nPlease log in and update your password.`
    const phone = (credentialCardData.mobile || '').replace(/\D/g, '')
    const url = phone && phone.length >= 10
      ? `https://wa.me/91${phone.slice(-10)}?text=${encodeURIComponent(text)}`
      : `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`
    window.open(url, '_blank')
  }

  const handleDownloadSlipImage = async () => {
    const el = document.getElementById('faculty-credential-slip')
    if (!el) return
    setDownloadingSlip(true)
    try {
      const canvas = await html2canvas(el, {
        scale: 2.5,
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false,
      })
      const dataUrl = canvas.toDataURL('image/png')
      const link = document.createElement('a')
      link.download = `Faculty-Credential-${credentialCardData.employeeId || 'slip'}.png`
      link.href = dataUrl
      link.click()
    } catch (err) {
      console.error('Download card error:', err)
      setError('Could not generate image. Please use Print Slip instead.')
    } finally {
      setDownloadingSlip(false)
    }
  }

  // Handle Assign Class
  const handleAssignSubmit = async (e) => {
    e.preventDefault()
    if (!assigningTeacher) return
    try {
      await assignTeacherToClass(assigningTeacher.id, assignForm)
      setSuccess('Class assigned to faculty successfully!')
      setAssigningTeacher(null)
      fetchTeachers()
    } catch (err) {
      setError(err?.message || 'Failed to assign class')
    }
  }

  // Export Roster
  const handleExportRoster = () => {
    const headers = ['Employee ID', 'Name', 'Designation', 'Department', 'Assigned Classes', 'Weekly Load', 'Status', 'Contact']
    const rows = filteredTeachers.map((t) => [
      t.employeeId,
      `"${t.fullName}"`,
      `"${t.designation}"`,
      `"${t.department}"`,
      `"${t.assignedClasses}"`,
      `"${t.weeklyLoad}"`,
      t.status === 'on_leave' ? 'On Leave' : 'Present',
      t.mobile,
    ])
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n')
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', `SPS_Faculty_Roster_${new Date().toISOString().slice(0, 10)}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="space-y-6">

      {/* 1. TOP HEADER & BREADCRUMB */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
            SPS / SCHOOL OPERATIONS / TEACHERS
          </p>
          <h1 className="mt-1 text-2xl sm:text-3xl font-extrabold tracking-tight text-[#0f1e36]">
            Faculty Management
          </h1>
          <p className="mt-0.5 text-xs sm:text-sm text-slate-500 font-normal">
            Manage teaching staff credentials, timetable allocation, salaries, and daily presence.
          </p>
        </div>

        {/* Top Right Action Buttons matching Canva */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={handleOpenAddModal}
            className="inline-flex items-center gap-1.5 rounded-xl bg-[#0B192C] px-4 py-2.5 text-xs font-bold text-white shadow-2xs hover:bg-slate-800 transition-colors"
          >
            <span className="material-symbols-outlined text-base">add</span>
            <span>Add Faculty Member</span>
          </button>

          <button
            onClick={() => setIsStaffBatchIdModalOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-bold text-slate-700 shadow-2xs hover:bg-slate-50 transition-colors cursor-pointer"
            title="Generate, Batch Print & Individual Print Faculty ID Cards"
          >
            <span className="material-symbols-outlined text-base text-slate-500">badge</span>
            <span>Faculty ID Cards</span>
          </button>

          <button
            onClick={() => alert('Staff Substitution Planner: All periods covered today')}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-bold text-slate-700 shadow-2xs hover:bg-slate-50 transition-colors"
          >
            <span className="material-symbols-outlined text-base text-slate-500">calendar_month</span>
            <span>Substitution Planner</span>
          </button>

          <button
            onClick={handleExportRoster}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-bold text-slate-700 shadow-2xs hover:bg-slate-50 transition-colors"
          >
            <span className="material-symbols-outlined text-base text-slate-500">download</span>
            <span>Export Roster PDF</span>
          </button>
        </div>
      </div>

      {/* 2. METRIC CARDS ROW (4 Cards matching Canva mockup) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Faculty */}
        <div className="rounded-2xl border border-blue-100 bg-[#f0f6ff]/80 p-5 shadow-2xs flex items-start gap-3.5">
          <div className="h-10 w-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-xl">groups</span>
          </div>
          <div className="min-w-0">
            <span className="text-xs font-bold text-slate-700 block">Total Faculty</span>
            <p className="text-2xl sm:text-3xl font-black text-slate-900 mt-0.5 tracking-tight">
              {stats.total}
            </p>
            <p className="text-[11px] font-medium text-slate-400 mt-1">
              Full-time permanent staff
            </p>
          </div>
        </div>

        {/* Card 2: Present Today */}
        <div className="rounded-2xl border border-emerald-100 bg-[#f0fdf4]/80 p-5 shadow-2xs flex items-start gap-3.5">
          <div className="h-10 w-10 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-xl">how_to_reg</span>
          </div>
          <div className="min-w-0">
            <span className="text-xs font-bold text-slate-700 block">Present Today</span>
            <p className="text-2xl sm:text-3xl font-black text-slate-900 mt-0.5 tracking-tight">
              {stats.present}
            </p>
            <p className="text-[11px] font-medium text-slate-400 mt-1">
              96% campus presence
            </p>
          </div>
        </div>

        {/* Card 3: On Leave */}
        <div className="rounded-2xl border border-amber-100 bg-[#fffbeb]/80 p-5 shadow-2xs flex items-start gap-3.5">
          <div className="h-10 w-10 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-xl">calendar_today</span>
          </div>
          <div className="min-w-0">
            <span className="text-xs font-bold text-slate-700 block">On Leave</span>
            <p className="text-2xl sm:text-3xl font-black text-slate-900 mt-0.5 tracking-tight">
              {stats.onLeave}
            </p>
            <p className="text-[11px] font-medium text-slate-400 mt-1">
              1 Sick leave, 1 Casual
            </p>
          </div>
        </div>

        {/* Card 4: Departments */}
        <div className="rounded-2xl border border-purple-100 bg-[#faf5ff]/80 p-5 shadow-2xs flex items-start gap-3.5">
          <div className="h-10 w-10 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-xl">domain</span>
          </div>
          <div className="min-w-0">
            <span className="text-xs font-bold text-slate-700 block">Departments</span>
            <p className="text-2xl sm:text-3xl font-black text-slate-900 mt-0.5 tracking-tight">
              {stats.departments}
            </p>
            <p className="text-[11px] font-medium text-slate-400 mt-1 truncate">
              Science, Maths, Arts, Commerce
            </p>
          </div>
        </div>
      </div>

      {/* 3. SEARCH & FILTER CONTROLS BAR (Matching Canva mockup) */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3 flex-1 min-w-0">
          {/* Search Input Box */}
          <div className="relative min-w-[240px] sm:min-w-[280px] flex-1 max-w-sm">
            <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-lg pointer-events-none">
              search
            </span>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search teacher..."
              className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-4 text-xs font-medium text-slate-800 placeholder:text-slate-400 focus:border-[#0B192C] focus:outline-none transition-colors shadow-2xs"
            />
          </div>

          {/* Staff Category Filter */}
          <select
            value={staffTypeFilter}
            onChange={(e) => setStaffTypeFilter(e.target.value)}
            className="rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 focus:outline-none focus:border-[#0B192C] cursor-pointer shadow-2xs"
          >
            <option value="all">All Staff</option>
            <option value="teaching">Teaching Faculty</option>
            <option value="non_teaching">Non-Teaching Staff</option>
          </select>

          {/* Department Dropdown */}
          <select
            value={departmentFilter}
            onChange={(e) => setDepartmentFilter(e.target.value)}
            className="rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 focus:outline-none focus:border-[#0B192C] cursor-pointer shadow-2xs"
          >
            <option value="all">All Departments</option>
            {uniqueDepartments.map((dept) => (
              <option key={dept} value={dept}>
                {dept}
              </option>
            ))}
          </select>

          {/* Segmented View Toggle: Grid / Table */}
          <div className="inline-flex rounded-xl border border-slate-200 bg-white p-1 text-xs shadow-2xs">
            <button
              onClick={() => setViewMode('grid')}
              className={`rounded-lg px-3 py-1.5 transition-all flex items-center gap-1.5 ${viewMode === 'grid'
                ? 'bg-[#0B192C] text-white font-bold shadow-2xs'
                : 'text-slate-600 hover:text-slate-900 font-semibold'
                }`}
            >
              <span className="material-symbols-outlined text-sm">grid_view</span>
              <span>Grid</span>
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`rounded-lg px-3 py-1.5 transition-all flex items-center gap-1.5 ${viewMode === 'table'
                ? 'bg-[#0B192C] text-white font-bold shadow-2xs'
                : 'text-slate-600 hover:text-slate-900 font-semibold'
                }`}
            >
              <span className="material-symbols-outlined text-sm">table_rows</span>
              <span>Table</span>
            </button>
          </div>
        </div>

        {/* Download Roster Button */}
        <button
          onClick={handleExportRoster}
          className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs"
        >
          <span className="material-symbols-outlined text-sm text-slate-500">download</span>
          <span>Download Roster</span>
        </button>
      </div>

      {/* 4. FACULTY GRID CARDS VIEW (Matching Canva layout exactly) */}
      {viewMode === 'grid' && (
        filteredTeachers.length === 0 ? (
          <div className="rounded-2xl border border-slate-200/90 bg-white p-12 text-center text-slate-500 shadow-2xs">
            <span className="material-symbols-outlined text-4xl text-slate-300 mb-2">school</span>
            <p className="font-bold text-sm text-slate-700">No faculty members found</p>
            <p className="text-xs text-slate-400 mt-1">Register new faculty members to display their profiles here.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredTeachers.map((teacher, idx) => {
              const initials = getInitials(teacher.fullName)
              const isLeave = teacher.status === 'on_leave'

              return (
                <div
                  key={teacher.id || idx}
                  className="rounded-2xl border border-slate-100 bg-white p-5 shadow-2xs flex flex-col justify-between space-y-4 hover:shadow-md transition-shadow"
                >
                  <div className="space-y-3.5">
                    {/* Top Row: Avatar + Name + Subtitle + 3 Circular Action Icons */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3 min-w-0">
                        {teacher.photoUrl ? (
                          <img
                            src={teacher.photoUrl}
                            alt={teacher.fullName}
                            className="h-12 w-12 shrink-0 rounded-full object-cover border border-slate-200 shadow-2xs"
                          />
                        ) : (
                          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#dbeafe] text-[#1d4ed8] font-bold text-base shadow-2xs">
                            {initials}
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <h3 className="font-bold text-slate-900 text-sm sm:text-base leading-tight truncate" title={teacher.fullName}>
                            {teacher.fullName}
                          </h3>
                          <p className="text-xs text-slate-500 font-medium truncate mt-0.5" title={teacher.designation}>
                            {teacher.designation}
                          </p>

                          {/* Status & Category Tags */}
                          <div className="mt-1.5 flex items-center gap-1.5 flex-wrap">
                            <span
                              className={`inline-block text-[11px] font-semibold px-2 py-0.5 rounded-md ${isLeave
                                ? 'bg-[#fef3c7] text-[#d97706]'
                                : 'bg-[#dcfce7] text-[#15803d]'
                                }`}
                            >
                              {isLeave ? 'On Leave' : 'Present'}
                            </span>
                            <span
                              className={`inline-block text-[11px] font-semibold px-2 py-0.5 rounded-md ${teacher.staffType === 'non_teaching'
                                ? 'bg-amber-50 text-amber-800'
                                : 'bg-[#e0f2fe] text-[#0369a1]'
                                }`}
                            >
                              {teacher.staffType === 'non_teaching' ? 'Staff' : 'Teaching'}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* 3 Circular Utility Actions (Phone/Call, Reset Password, Delete) */}
                      <div className="flex items-center gap-1.5 shrink-0 pt-0.5">
                        <button
                          onClick={() => setContactTeacher(teacher)}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-100 transition-colors"
                          title="Contact Details / Call"
                        >
                          <span className="material-symbols-outlined text-[15px]">call</span>
                        </button>

                        <button
                          onClick={() => handleOpenResetPassword(teacher)}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[#fef3c7] hover:bg-[#fde68a] text-[#b45309] transition-colors"
                          title="Direct Password Reset (with Double-Check Confirmation)"
                        >
                          <span className="material-symbols-outlined text-[15px]">restart_alt</span>
                        </button>

                        <button
                          onClick={() => setDeletingTeacher(teacher)}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[#fee2e2] hover:bg-[#fecaca] text-[#dc2626] transition-colors"
                          title="Remove Faculty Member"
                        >
                          <span className="material-symbols-outlined text-[15px]">delete</span>
                        </button>
                      </div>
                    </div>

                    {/* 3-Column Horizontal Grid (EMPLOYEE ID, ASSIGNED CLASSES, CONTACT) */}
                    <div className="grid grid-cols-3 gap-2 pt-3 pb-1 border-t border-slate-100/90 text-xs">
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          EMPLOYEE ID
                        </p>
                        <p className="font-mono font-bold text-[#1d4ed8] text-xs mt-0.5 truncate">
                          {teacher.employeeId}
                        </p>
                      </div>

                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          ASSIGNED CLASSES
                        </p>
                        <p className="font-semibold text-slate-700 text-xs mt-0.5 truncate" title={teacher.assignedClasses || "General Staff"}>
                          {teacher.assignedClasses || "General Staff"}
                        </p>
                      </div>

                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          CONTACT
                        </p>
                        <p className="font-mono font-bold text-slate-800 text-xs mt-0.5 truncate">
                          {teacher.mobile || "-"}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Bottom Action Row: Edit, Profile (Dark Button), Timetable */}
                  <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                    <button
                      onClick={() => handleOpenEditModal(teacher)}
                      className="flex-1 rounded-xl border border-slate-200 bg-white py-2 text-center text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors flex items-center justify-center gap-1.5 shadow-2xs"
                      title="Edit Profile & Documents"
                    >
                      <span className="material-symbols-outlined text-sm text-slate-500">edit</span>
                      <span>Edit</span>
                    </button>

                    <button
                      onClick={() => setSelectedTeacherProfile(teacher)}
                      className="flex-1 rounded-xl bg-[#0B192C] py-2 text-center text-xs font-bold text-white hover:bg-slate-800 transition-colors flex items-center justify-center gap-1.5 shadow-2xs"
                      title="View Full Profile Details"
                    >
                      <span className="material-symbols-outlined text-sm">person</span>
                      <span>Profile</span>
                    </button>

                    {teacher.staffType !== 'non_teaching' ? (
                      <button
                        onClick={() => {
                          setAssigningTeacher(teacher)
                          setAssignForm({
                            class: teacher.assignedClass || 'Nursery',
                            section: teacher.assignedSection || 'A',
                            academic_year: teacher.academicYear || getDefaultAcademicYear()
                          })
                        }}
                        className="flex-1 rounded-xl bg-[#eff6ff] border border-blue-100 py-2 text-center text-xs font-semibold text-[#1d4ed8] hover:bg-blue-100/80 transition-colors flex items-center justify-center gap-1 shadow-2xs"
                        title="Manage Timetable & Allocations"
                      >
                        <span className="material-symbols-outlined text-sm">calendar_month</span>
                        <span>Timetable</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => setSelectedIdCardTeacher(teacher)}
                        className="flex-1 rounded-xl bg-amber-50 border border-amber-200/60 py-2 text-center text-xs font-semibold text-amber-800 hover:bg-amber-100 transition-colors flex items-center justify-center gap-1 shadow-2xs"
                        title="View & Print ID Card"
                      >
                        <span className="material-symbols-outlined text-sm">badge</span>
                        <span>ID Card</span>
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )
      )}

      {/* 5. TABLE VIEW MODE (Fallback option for power users) */}
      {viewMode === 'table' && (
        <div className="rounded-2xl border border-slate-200/90 bg-white shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#f8fafc] border-b border-slate-200/80">
                <tr>
                  <th className="py-3.5 px-4 font-bold text-slate-500 uppercase tracking-wider text-[11px]">Faculty</th>
                  <th className="py-3.5 px-4 font-bold text-slate-500 uppercase tracking-wider text-[11px]">ID</th>
                  <th className="py-3.5 px-4 font-bold text-slate-500 uppercase tracking-wider text-[11px]">Department</th>
                  <th className="py-3.5 px-4 font-bold text-slate-500 uppercase tracking-wider text-[11px]">Assigned Classes</th>
                  <th className="py-3.5 px-4 font-bold text-slate-500 uppercase tracking-wider text-[11px]">Weekly Load</th>
                  <th className="py-3.5 px-4 font-bold text-slate-500 uppercase tracking-wider text-[11px]">Status</th>
                  <th className="py-3.5 px-4 font-bold text-slate-500 uppercase tracking-wider text-[11px] text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredTeachers.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="py-12 text-center text-slate-400">
                      No faculty records found
                    </td>
                  </tr>
                ) : (
                  filteredTeachers.map((teacher, idx) => (
                    <tr key={teacher.id || idx} className="hover:bg-slate-50/80">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5">
                          <p className="font-bold text-[#0f1e36] text-xs">{teacher.fullName}</p>
                          <span className={`text-[9.5px] font-bold px-1.5 py-0.2 rounded ${teacher.staffType === 'non_teaching'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-blue-100 text-blue-800'
                            }`}>
                            {teacher.staffType === 'non_teaching' ? 'Staff' : 'Teaching'}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-400">{teacher.designation}</p>
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-slate-700">{teacher.employeeId}</td>
                      <td className="py-3.5 px-4 text-slate-700">{teacher.department}</td>
                      <td className="py-3.5 px-4 text-slate-700">{teacher.assignedClasses}</td>
                      <td className="py-3.5 px-4 text-slate-700">{teacher.weeklyLoad}</td>
                      <td className="py-3.5 px-4">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${teacher.status === 'on_leave' ? 'bg-[#fef3c7] text-[#d97706]' : 'bg-[#dcfce7] text-[#16a34a]'}`}>
                          {teacher.status === 'on_leave' ? 'On Leave' : 'Present'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-2.5">
                          <button
                            onClick={() => handleOpenEditModal(teacher)}
                            className="text-xs font-bold text-indigo-700 hover:text-indigo-900 hover:underline flex items-center gap-0.5"
                            title="Edit Profile & Documents"
                          >
                            <span className="material-symbols-outlined text-sm">edit</span>
                            <span>Edit</span>
                          </button>
                          <span className="text-slate-300">|</span>
                          <button
                            onClick={() => setSelectedTeacherProfile(teacher)}
                            className="text-xs font-semibold text-slate-600 hover:text-slate-900 hover:underline"
                          >
                            Profile
                          </button>
                          {teacher.staffType !== 'non_teaching' && (
                            <>
                              <span className="text-slate-300">|</span>
                              <button
                                onClick={() => {
                                  setAssigningTeacher(teacher)
                                  setAssignForm({
                                    class: teacher.assignedClass || 'Nursery',
                                    section: teacher.assignedSection || 'A',
                                    academic_year: teacher.academicYear || getDefaultAcademicYear()
                                  })
                                }}
                                className="text-xs font-semibold text-[#1e40af] hover:underline"
                              >
                                Timetable
                              </button>
                            </>
                          )}
                          <span className="text-slate-300">|</span>
                          <button
                            onClick={() => handleOpenResetPassword(teacher)}
                            className="text-xs font-bold text-amber-700 hover:text-amber-900 hover:underline flex items-center gap-1"
                            title="Direct Password Reset (with Double-Check Confirmation)"
                          >
                            <span className="material-symbols-outlined text-sm">lock_reset</span>
                            <span>Reset</span>
                          </button>
                          <span className="text-slate-300">|</span>
                          <button
                            onClick={() => setDeletingTeacher(teacher)}
                            className="text-xs font-bold text-rose-600 hover:text-rose-800 hover:underline flex items-center gap-0.5"
                            title="Remove faculty member"
                          >
                            <span className="material-symbols-outlined text-sm">delete</span>
                            <span>Remove</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 6. ADD FACULTY MEMBER MODAL (Clean Minimal Aesthetic) */}
      {isAddModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 overflow-y-auto"
          onClick={() => setIsAddModalOpen(false)}
        >
          <div
            className="w-full max-w-2xl rounded-2xl bg-white shadow-xl border border-gray-200/90 my-8 max-h-[92vh] flex flex-col overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-white shrink-0">
              <div>
                <h3 className="text-base font-bold text-gray-900">
                  {formData.staff_type === 'teaching' ? 'Add Teaching Faculty' : 'Add Non-Teaching Staff'}
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  {formData.staff_type === 'teaching'
                    ? 'Register teacher details, subject specialization, qualifications, and portal credentials.'
                    : 'Register support staff (peon, cleaner, driver, security, etc.) and contact details.'}
                </p>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="h-8 w-8 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 flex items-center justify-center transition-colors"
              >
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>

            {/* Modal Form Body - Scrollable */}
            <form onSubmit={handleAddTeacher} className="overflow-y-auto p-6 space-y-6 flex-1 text-xs">
              {error && (
                <div className="rounded-xl bg-rose-50 border border-rose-200/80 p-3 text-rose-700 font-medium flex items-center gap-2">
                  <span className="material-symbols-outlined text-base">error</span>
                  <span>{error}</span>
                </div>
              )}

              {/* 1. TOP SELECTOR: STAFF CATEGORY (Teaching vs Non-Teaching) */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4 items-center p-3.5 rounded-xl border border-gray-200 bg-gray-50/90">
                <div className="sm:col-span-1">
                  <label className="block text-gray-900 font-bold text-xs flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-base text-gray-600">badge</span>
                    <span>Staff Category <span className="text-rose-500">*</span></span>
                  </label>
                  <p className="text-[10.5px] text-gray-400 mt-0.5">Select role category</p>
                </div>
                <div className="sm:col-span-2 grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setFormData((prev) => ({
                        ...prev,
                        staff_type: 'teaching',
                        role_title: prev.role_title || 'TGT',
                        subject: prev.subject || 'Mathematics',
                        designation: `${prev.role_title || 'TGT'} ${prev.subject || 'Mathematics'}`,
                        department: 'Mathematics',
                        employee_id: prev.employee_id.startsWith('STF-') ? `TCH-${prev.employee_id.slice(4)}` : prev.employee_id,
                      }))
                    }}
                    className={`flex items-center justify-center gap-2 py-2 px-3 rounded-xl border text-xs font-bold transition-all ${formData.staff_type === 'teaching'
                      ? 'bg-gray-900 text-white border-gray-900 shadow-xs'
                      : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-100'
                      }`}
                  >
                    <span className="material-symbols-outlined text-base">school</span>
                    <span>Teaching Faculty</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setFormData((prev) => ({
                        ...prev,
                        staff_type: 'non_teaching',
                        designation: 'Peon / Office Attendant',
                        department: 'Administration & Support',
                        employee_id: prev.employee_id.startsWith('TCH-') ? `STF-${prev.employee_id.slice(4)}` : prev.employee_id,
                      }))
                    }}
                    className={`flex items-center justify-center gap-2 py-2 px-3 rounded-xl border text-xs font-bold transition-all ${formData.staff_type === 'non_teaching'
                      ? 'bg-gray-900 text-white border-gray-900 shadow-xs'
                      : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-100'
                      }`}
                  >
                    <span className="material-symbols-outlined text-base">engineering</span>
                    <span>Non-Teaching Staff</span>
                  </button>
                </div>
              </div>

              {/* 2. Profile Photo (Optional for all) */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4 items-center py-3 border-b border-gray-100">
                <div className="sm:col-span-1">
                  <label className="block text-gray-700 font-semibold text-xs">
                    Profile Photo <span className="text-gray-400 font-normal">(Optional)</span>
                  </label>
                  <p className="text-[10.5px] text-gray-400 mt-0.5">PNG, JPG up to 5MB</p>
                </div>
                <div className="sm:col-span-2 flex items-center gap-3.5">
                  <div className="relative h-12 w-12 shrink-0 rounded-full border border-gray-200 bg-gray-50 overflow-hidden flex items-center justify-center shadow-2xs">
                    {photoPreview ? (
                      <img src={photoPreview} alt="Preview" className="h-full w-full object-cover" />
                    ) : (
                      <span className="material-symbols-outlined text-xl text-gray-400">person</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="file"
                      id="staff-photo-input"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file) {
                          setPhotoFile(file)
                          setPhotoPreview(URL.createObjectURL(file))
                        }
                      }}
                    />
                    <label
                      htmlFor="staff-photo-input"
                      className="cursor-pointer inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 shadow-2xs transition-colors"
                    >
                      <span className="material-symbols-outlined text-sm text-gray-500">photo_camera</span>
                      <span>{photoPreview ? 'Change Photo' : 'Upload Photo'}</span>
                    </label>
                    {photoPreview && (
                      <button
                        type="button"
                        onClick={() => {
                          setPhotoFile(null)
                          setPhotoPreview('')
                        }}
                        className="rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs text-rose-600 hover:bg-rose-50"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* ====================================================
                  CASE A: TEACHING STAFF FORM (Two-Column Layout)
                  ==================================================== */}
              {formData.staff_type === 'teaching' ? (
                <>
                  {/* --- Personal Information --- */}
                  <div className="space-y-1">
                    <p className="text-[10.5px] font-semibold uppercase tracking-wider text-gray-400 pb-1.5">
                      Personal Information
                    </p>

                    {/* Full Name */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4 items-center py-2.5 border-b border-gray-100">
                      <label className="text-gray-700 font-semibold text-xs sm:col-span-1">
                        Full Name <span className="text-rose-500">*</span>
                      </label>
                      <div className="sm:col-span-2">
                        <input
                          type="text"
                          name="full_name"
                          value={formData.full_name}
                          onChange={handleChange}
                          required
                          placeholder="e.g. Tanzim Ahmad"
                          className="w-full rounded-xl border border-gray-200 px-3 py-2 text-xs text-gray-800 placeholder:text-gray-400 focus:outline-none focus:border-gray-900 bg-white"
                        />
                      </div>
                    </div>

                    {/* Date of Birth */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4 items-center py-2.5 border-b border-gray-100">
                      <label className="text-gray-700 font-semibold text-xs sm:col-span-1">
                        Date of Birth (DOB) <span className="text-rose-500">*</span>
                      </label>
                      <div className="sm:col-span-2">
                        <input
                          type="date"
                          name="date_of_birth"
                          value={formData.date_of_birth}
                          onChange={handleChange}
                          required
                          className="w-full rounded-xl border border-gray-200 px-3 py-2 text-xs text-gray-800 focus:outline-none focus:border-gray-900 bg-white"
                        />
                      </div>
                    </div>

                    {/* Gender */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4 items-center py-2.5 border-b border-gray-100">
                      <label className="text-gray-700 font-semibold text-xs sm:col-span-1">
                        Gender
                      </label>
                      <div className="sm:col-span-2">
                        <select
                          name="gender"
                          value={formData.gender}
                          onChange={handleChange}
                          className="w-full rounded-xl border border-gray-200 px-3 py-2 text-xs text-gray-800 focus:outline-none focus:border-gray-900 bg-white cursor-pointer"
                        >
                          <option value="Male">Male</option>
                          <option value="Female">Female</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>
                    </div>

                    {/* Father's Name */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4 items-center py-2.5 border-b border-gray-100">
                      <label className="text-gray-700 font-semibold text-xs sm:col-span-1">
                        Father&apos;s Name <span className="text-rose-500">*</span>
                      </label>
                      <div className="sm:col-span-2">
                        <input
                          type="text"
                          name="father_name"
                          value={formData.father_name}
                          onChange={handleChange}
                          required
                          placeholder="e.g. Md. Shamim Akhtar"
                          className="w-full rounded-xl border border-gray-200 px-3 py-2 text-xs text-gray-800 placeholder:text-gray-400 focus:outline-none focus:border-gray-900 bg-white"
                        />
                      </div>
                    </div>

                    {/* Mother's Name */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4 items-center py-2.5 border-b border-gray-100">
                      <label className="text-gray-700 font-semibold text-xs sm:col-span-1">
                        Mother&apos;s Name <span className="text-rose-500">*</span>
                      </label>
                      <div className="sm:col-span-2">
                        <input
                          type="text"
                          name="mother_name"
                          value={formData.mother_name}
                          onChange={handleChange}
                          required
                          placeholder="e.g. Shabnam Begum"
                          className="w-full rounded-xl border border-gray-200 px-3 py-2 text-xs text-gray-800 placeholder:text-gray-400 focus:outline-none focus:border-gray-900 bg-white"
                        />
                      </div>
                    </div>
                  </div>

                  {/* --- Teaching Role & Subject Specialization --- */}
                  <div className="space-y-1 pt-2">
                    <p className="text-[10.5px] font-semibold uppercase tracking-wider text-gray-400 pb-1.5">
                      Teaching Role & Specialization
                    </p>

                    {/* Teaching Role */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4 items-center py-2.5 border-b border-gray-100">
                      <label className="text-gray-700 font-semibold text-xs sm:col-span-1">
                        Teaching Role <span className="text-rose-500">*</span>
                      </label>
                      <div className="sm:col-span-2">
                        <select
                          name="role_title"
                          value={formData.role_title}
                          onChange={(e) => {
                            const newRole = e.target.value
                            setFormData((prev) => ({
                              ...prev,
                              role_title: newRole,
                              designation: `${newRole} ${prev.subject || 'Mathematics'}`,
                            }))
                          }}
                          className="w-full rounded-xl border border-gray-200 px-3 py-2 text-xs text-gray-800 focus:outline-none focus:border-gray-900 bg-white cursor-pointer"
                        >
                          <option value="PGT">PGT (Class 11-12)</option>
                          <option value="TGT">TGT (Class 6-10)</option>
                          <option value="PRT">PRT (Primary Class 1-5)</option>
                          <option value="Nursery Teacher">Nursery / Pre-Primary Teacher</option>
                          <option value="Activity Teacher">Activity / Sports Teacher</option>
                          <option value="Computer Teacher">Computer / ICT Teacher</option>
                          <option value="Headmistress">Headmistress / In-Charge</option>
                          <option value="Principal">Principal / Vice Principal</option>
                          <option value="Special Educator">Special Educator</option>
                        </select>
                      </div>
                    </div>

                    {/* Primary Subject */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4 items-center py-2.5 border-b border-gray-100">
                      <label className="text-gray-700 font-semibold text-xs sm:col-span-1">
                        Primary Subject <span className="text-rose-500">*</span>
                      </label>
                      <div className="sm:col-span-2">
                        <select
                          name="subject"
                          value={formData.subject}
                          onChange={(e) => {
                            const newSub = e.target.value
                            setFormData((prev) => ({
                              ...prev,
                              subject: newSub,
                              department: newSub,
                              designation: `${prev.role_title || 'TGT'} ${newSub}`,
                            }))
                          }}
                          className="w-full rounded-xl border border-gray-200 px-3 py-2 text-xs text-gray-800 focus:outline-none focus:border-gray-900 bg-white cursor-pointer"
                        >
                          <option value="Mathematics">Mathematics</option>
                          <option value="Science">Science / EVS</option>
                          <option value="Physics">Physics</option>
                          <option value="Chemistry">Chemistry</option>
                          <option value="Biology">Biology</option>
                          <option value="English">English</option>
                          <option value="Hindi">Hindi</option>
                          <option value="Social Science">Social Science</option>
                          <option value="Computer Science">Computer Science / IT</option>
                          <option value="Physical Education">Physical Education</option>
                          <option value="Art & Craft">Art & Craft / Music</option>
                          <option value="Sanskrit">Sanskrit</option>
                          <option value="Urdu">Urdu</option>
                          <option value="Commerce">Commerce / Accountancy</option>
                          <option value="All Subjects">All Subjects (Primary)</option>
                        </select>
                      </div>
                    </div>

                    {/* Department */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4 items-center py-2.5 border-b border-gray-100">
                      <label className="text-gray-700 font-semibold text-xs sm:col-span-1">
                        Department
                      </label>
                      <div className="sm:col-span-2">
                        <select
                          name="department"
                          value={formData.department}
                          onChange={handleChange}
                          className="w-full rounded-xl border border-gray-200 px-3 py-2 text-xs text-gray-800 focus:outline-none focus:border-gray-900 bg-white cursor-pointer"
                        >
                          <option value="Mathematics">Mathematics</option>
                          <option value="Science">Science</option>
                          <option value="Languages">Languages</option>
                          <option value="Social Science">Social Science</option>
                          <option value="Commerce">Commerce</option>
                          <option value="Primary Wing">Primary Wing</option>
                          <option value="Pre-Primary">Pre-Primary</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* --- Qualifications & Documents (Label on left, value/upload on right, preview below) --- */}
                  <div className="space-y-1 pt-2">
                    <p className="text-[10.5px] font-semibold uppercase tracking-wider text-gray-400 pb-1.5">
                      Qualifications & Documents
                    </p>

                    {/* Highest Academic Qualification */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4 items-center py-2.5 border-b border-gray-100">
                      <label className="text-gray-700 font-semibold text-xs sm:col-span-1">
                        Highest Qualification <span className="text-rose-500">*</span>
                      </label>
                      <div className="sm:col-span-2">
                        <select
                          name="highest_qualification"
                          value={formData.highest_qualification}
                          onChange={handleChange}
                          required
                          className="w-full rounded-xl border border-gray-200 px-3 py-2 text-xs text-gray-800 focus:outline-none focus:border-gray-900 bg-white cursor-pointer"
                        >
                          <option value="" disabled>-- Select Highest Qualification --</option>
                          <option value="10th (Matriculation)">10th (Matriculation)</option>
                          <option value="12th (Intermediate / 10+2)">12th (Intermediate / 10+2)</option>
                          <option value="Diploma">Diploma</option>
                          <option value="Bachelor's Degree (Graduate)">Bachelor's Degree (Graduate - B.A, B.Sc, B.Com, B.Tech, etc.)</option>
                          <option value="Master's Degree (Post Graduate)">Master's Degree (Post Graduate - M.A, M.Sc, M.Com, M.Tech, etc.)</option>
                          <option value="M.Phil">M.Phil</option>
                          <option value="Ph.D / Doctorate">Ph.D / Doctorate</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>
                    </div>

                    {/* Highest Qualification Document (Left Label, Right small upload button + preview below) */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4 items-start py-3 border-b border-gray-100">
                      <div className="sm:col-span-1">
                        <label className="block text-gray-700 font-semibold text-xs">
                          Qualification Document <span className="text-rose-500">*</span>
                        </label>
                        <p className="text-[10.5px] text-gray-400 mt-0.5">
                          {formData.highest_qualification ? `${formData.highest_qualification.split(' ')[0]} Certificate / Degree` : 'Academic Degree (Mandatory)'}
                        </p>
                      </div>
                      <div className="sm:col-span-2 space-y-2">
                        <div className="flex items-center gap-2.5">
                          <input
                            type="file"
                            id="qualification-doc-input"
                            accept=".pdf,.png,.jpg,.jpeg"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0]
                              if (file) {
                                setDocumentFile(file)
                                setDocumentName(file.name)
                                if (file.type.startsWith('image/')) {
                                  setDocumentPreview(URL.createObjectURL(file))
                                } else {
                                  setDocumentPreview('pdf')
                                }
                                setError('')
                              }
                            }}
                          />
                          <label
                            htmlFor="qualification-doc-input"
                            className="cursor-pointer inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 shadow-2xs transition-colors shrink-0"
                          >
                            <span className="material-symbols-outlined text-sm text-gray-500">upload_file</span>
                            <span>{documentFile ? 'Change File' : 'Upload Document'}</span>
                          </label>
                          <span className="text-[11px] text-gray-400">PDF, JPG, PNG (Max 10MB)</span>
                        </div>

                        {/* Document Preview (niche preview) */}
                        {documentFile && (
                          <div className="flex items-center justify-between p-2.5 rounded-xl border border-emerald-200 bg-emerald-50/50">
                            <div className="flex items-center gap-2.5 min-w-0">
                              {documentPreview && documentPreview !== 'pdf' ? (
                                <img src={documentPreview} alt="Doc preview" className="h-10 w-10 rounded-lg object-cover border border-emerald-200 shrink-0 shadow-2xs" />
                              ) : (
                                <div className="h-10 w-10 rounded-lg bg-emerald-100/70 text-emerald-700 flex items-center justify-center border border-emerald-200 shrink-0">
                                  <span className="material-symbols-outlined text-xl">description</span>
                                </div>
                              )}
                              <div className="min-w-0">
                                <p className="text-xs font-semibold text-gray-900 truncate">{documentName}</p>
                                <p className="text-[10px] text-emerald-700 font-medium">Ready for upload</p>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                setDocumentFile(null)
                                setDocumentName('')
                                setDocumentPreview('')
                              }}
                              className="text-xs font-semibold text-rose-600 hover:bg-rose-50 px-2 py-1 rounded-lg transition-colors"
                            >
                              Remove
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Professional Qualification Dropdown */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4 items-center py-2.5 border-b border-gray-100">
                      <div className="sm:col-span-1">
                        <label className="block text-gray-700 font-semibold text-xs">
                          Professional Course
                        </label>
                        <p className="text-[10.5px] text-gray-400 mt-0.5">B.Ed, D.El.Ed, NTT etc. (Optional)</p>
                      </div>
                      <div className="sm:col-span-2">
                        <select
                          name="professional_qualification"
                          value={formData.professional_qualification}
                          onChange={handleChange}
                          className="w-full rounded-xl border border-gray-200 px-3 py-2 text-xs text-gray-800 focus:outline-none focus:border-gray-900 bg-white cursor-pointer"
                        >
                          <option value="">None / Not Applicable</option>
                          <option value="B.Ed (Bachelor of Education)">B.Ed (Bachelor of Education)</option>
                          <option value="D.El.Ed (Diploma in Elementary Education)">D.El.Ed (Diploma in Elementary Education)</option>
                          <option value="B.El.Ed (Bachelor of Elementary Education)">B.El.Ed (Bachelor of Elementary Education)</option>
                          <option value="M.Ed (Master of Education)">M.Ed (Master of Education)</option>
                          <option value="NTT (Nursery Teacher Training)">NTT (Nursery Teacher Training)</option>
                          <option value="B.P.Ed / D.P.Ed (Physical Education)">B.P.Ed / D.P.Ed (Physical Education)</option>
                          <option value="CTET / STET Qualified">CTET / STET Qualified</option>
                          <option value="NET / SLET Qualified">NET / SLET Qualified</option>
                          <option value="Other">Other Professional Qualification</option>
                        </select>
                      </div>
                    </div>

                    {/* Professional Certificate (Shown when course selected: Left Label, Right small upload button + preview below) */}
                    {Boolean(formData.professional_qualification) && (
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4 items-start py-3 border-b border-gray-100">
                        <div className="sm:col-span-1">
                          <label className="block text-gray-700 font-semibold text-xs">
                            Professional Certificate
                          </label>
                          <p className="text-[10.5px] text-gray-400 mt-0.5">
                            {formData.professional_qualification.split(' ')[0]} Training Certificate (Optional)
                          </p>
                        </div>
                        <div className="sm:col-span-2 space-y-2">
                          <div className="flex items-center gap-2.5">
                            <input
                              type="file"
                              id="prof-qualification-doc-input"
                              accept=".pdf,.png,.jpg,.jpeg"
                              className="hidden"
                              onChange={(e) => {
                                const file = e.target.files?.[0]
                                if (file) {
                                  setProfDocumentFile(file)
                                  setProfDocumentName(file.name)
                                  if (file.type.startsWith('image/')) {
                                    setProfDocumentPreview(URL.createObjectURL(file))
                                  } else {
                                    setProfDocumentPreview('pdf')
                                  }
                                }
                              }}
                            />
                            <label
                              htmlFor="prof-qualification-doc-input"
                              className="cursor-pointer inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 shadow-2xs transition-colors shrink-0"
                            >
                              <span className="material-symbols-outlined text-sm text-gray-500">upload_file</span>
                              <span>{profDocumentFile ? 'Change File' : 'Upload Certificate'}</span>
                            </label>
                            <span className="text-[11px] text-gray-400">PDF, JPG, PNG (Max 10MB)</span>
                          </div>

                          {/* Professional Document Preview */}
                          {profDocumentFile && (
                            <div className="flex items-center justify-between p-2.5 rounded-xl border border-blue-200 bg-blue-50/50">
                              <div className="flex items-center gap-2.5 min-w-0">
                                {profDocumentPreview && profDocumentPreview !== 'pdf' ? (
                                  <img src={profDocumentPreview} alt="Prof preview" className="h-10 w-10 rounded-lg object-cover border border-blue-200 shrink-0 shadow-2xs" />
                                ) : (
                                  <div className="h-10 w-10 rounded-lg bg-blue-100/70 text-blue-700 flex items-center justify-center border border-blue-200 shrink-0">
                                    <span className="material-symbols-outlined text-xl">verified</span>
                                  </div>
                                )}
                                <div className="min-w-0">
                                  <p className="text-xs font-semibold text-gray-900 truncate">{profDocumentName}</p>
                                  <p className="text-[10px] text-blue-700 font-medium">Professional certificate attached</p>
                                </div>
                              </div>
                              <button
                                type="button"
                                onClick={() => {
                                  setProfDocumentFile(null)
                                  setProfDocumentName('')
                                  setProfDocumentPreview('')
                                }}
                                className="text-xs font-semibold text-rose-600 hover:bg-rose-50 px-2 py-1 rounded-lg transition-colors"
                              >
                                Remove
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Aadhaar Number */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4 items-center py-2.5 border-b border-gray-100">
                      <div className="sm:col-span-1">
                        <label className="block text-gray-700 font-semibold text-xs">
                          Aadhaar Number
                        </label>
                        <p className="text-[10.5px] text-gray-400 mt-0.5">12-Digit UIDAI (Optional)</p>
                      </div>
                      <div className="sm:col-span-2">
                        <input
                          type="text"
                          name="aadhar_number"
                          value={formData.aadhar_number}
                          onChange={handleChange}
                          maxLength={14}
                          placeholder="e.g. 5432 1098 7654"
                          className="w-full rounded-xl border border-gray-200 px-3 py-2 text-xs text-gray-800 placeholder:text-gray-400 focus:outline-none focus:border-gray-900 bg-white"
                        />
                      </div>
                    </div>

                    {/* Aadhaar Card Document (Left Label, Right small upload button + preview below) */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4 items-start py-3 border-b border-gray-100">
                      <div className="sm:col-span-1">
                        <label className="block text-gray-700 font-semibold text-xs">
                          Aadhaar Card Document <span className="text-rose-500">*</span>
                        </label>
                        <p className="text-[10.5px] text-gray-400 mt-0.5">
                          ID proof front/back (Mandatory)
                        </p>
                      </div>
                      <div className="sm:col-span-2 space-y-2">
                        <div className="flex items-center gap-2.5">
                          <input
                            type="file"
                            id="teacher-aadhar-doc-input"
                            accept=".pdf,.png,.jpg,.jpeg"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0]
                              if (file) {
                                setAadharFile(file)
                                setAadharFileName(file.name)
                                if (file.type.startsWith('image/')) {
                                  setAadharPreview(URL.createObjectURL(file))
                                } else {
                                  setAadharPreview('pdf')
                                }
                                setError('')
                              }
                            }}
                          />
                          <label
                            htmlFor="teacher-aadhar-doc-input"
                            className="cursor-pointer inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 shadow-2xs transition-colors shrink-0"
                          >
                            <span className="material-symbols-outlined text-sm text-gray-500">badge</span>
                            <span>{aadharFile ? 'Change File' : 'Upload Aadhaar Card'}</span>
                          </label>
                          <span className="text-[11px] text-gray-400">PDF, JPG, PNG (Max 10MB)</span>
                        </div>

                        {/* Aadhaar Document Preview */}
                        {aadharFile && (
                          <div className="flex items-center justify-between p-2.5 rounded-xl border border-amber-200 bg-amber-50/50">
                            <div className="flex items-center gap-2.5 min-w-0">
                              {aadharPreview && aadharPreview !== 'pdf' ? (
                                <img src={aadharPreview} alt="Aadhaar preview" className="h-10 w-10 rounded-lg object-cover border border-amber-200 shrink-0 shadow-2xs" />
                              ) : (
                                <div className="h-10 w-10 rounded-lg bg-amber-100/70 text-amber-700 flex items-center justify-center border border-amber-200 shrink-0">
                                  <span className="material-symbols-outlined text-xl">badge</span>
                                </div>
                              )}
                              <div className="min-w-0">
                                <p className="text-xs font-semibold text-gray-900 truncate">{aadharFileName}</p>
                                <p className="text-[10px] text-amber-700 font-medium">Aadhaar card attached</p>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                setAadharFile(null)
                                setAadharFileName('')
                                setAadharPreview('')
                              }}
                              className="text-xs font-semibold text-rose-600 hover:bg-rose-50 px-2 py-1 rounded-lg transition-colors"
                            >
                              Remove
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Curriculum Vitae (CV / Resume) */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4 items-start py-3 border-b border-gray-100">
                      <div className="sm:col-span-1">
                        <label className="block text-gray-700 font-semibold text-xs">
                          CV / Resume <span className="text-gray-400 font-normal">(Optional)</span>
                        </label>
                        <p className="text-[10.5px] text-gray-400 mt-0.5">
                          Curriculum Vitae / Biodata
                        </p>
                      </div>
                      <div className="sm:col-span-2 space-y-2">
                        <div className="flex items-center gap-2.5">
                          <input
                            type="file"
                            id="staff-cv-doc-input"
                            accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0]
                              if (file) {
                                setCvFile(file)
                                setCvFileName(file.name)
                                if (file.type.startsWith('image/')) {
                                  setCvPreview(URL.createObjectURL(file))
                                } else {
                                  setCvPreview('pdf')
                                }
                                setError('')
                              }
                            }}
                          />
                          <label
                            htmlFor="staff-cv-doc-input"
                            className="cursor-pointer inline-flex items-center gap-1.5 rounded-lg border border-purple-200 bg-purple-50/50 px-3 py-1.5 text-xs font-semibold text-purple-700 hover:bg-purple-100/60 shadow-2xs transition-colors shrink-0"
                          >
                            <span className="material-symbols-outlined text-sm text-purple-600">description</span>
                            <span>{cvFile ? 'Change CV File' : 'Upload CV / Resume'}</span>
                          </label>
                          <span className="text-[11px] text-gray-400">PDF, DOC, JPG (Max 10MB)</span>
                        </div>

                        {/* CV Preview */}
                        {cvFile && (
                          <div className="flex items-center justify-between p-2.5 rounded-xl border border-purple-200 bg-purple-50/50">
                            <div className="flex items-center gap-2.5 min-w-0">
                              {cvPreview && cvPreview !== 'pdf' ? (
                                <img src={cvPreview} alt="CV preview" className="h-10 w-10 rounded-lg object-cover border border-purple-200 shrink-0 shadow-2xs" />
                              ) : (
                                <div className="h-10 w-10 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center border border-purple-200 shrink-0">
                                  <span className="material-symbols-outlined text-xl">description</span>
                                </div>
                              )}
                              <div className="min-w-0">
                                <p className="text-xs font-semibold text-gray-900 truncate">{cvFileName}</p>
                                <p className="text-[10px] text-purple-700 font-medium">CV / Resume attached</p>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                setCvFile(null)
                                setCvFileName('')
                                setCvPreview('')
                              }}
                              className="text-xs font-semibold text-rose-600 hover:bg-rose-50 px-2 py-1 rounded-lg transition-colors"
                            >
                              Remove
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Offer / Appointment Letter */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4 items-start py-3 border-b border-gray-100">
                      <div className="sm:col-span-1">
                        <label className="block text-gray-700 font-semibold text-xs">
                          Offer Letter <span className="text-gray-400 font-normal">(Optional)</span>
                        </label>
                        <p className="text-[10.5px] text-gray-400 mt-0.5">
                          Appointment / Joining Letter
                        </p>
                      </div>
                      <div className="sm:col-span-2 space-y-2">
                        <div className="flex items-center gap-2.5">
                          <input
                            type="file"
                            id="staff-offer-doc-input"
                            accept=".pdf,.png,.jpg,.jpeg"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0]
                              if (file) {
                                setOfferLetterFile(file)
                                setOfferLetterFileName(file.name)
                                if (file.type.startsWith('image/')) {
                                  setOfferLetterPreview(URL.createObjectURL(file))
                                } else {
                                  setOfferLetterPreview('pdf')
                                }
                                setError('')
                              }
                            }}
                          />
                          <label
                            htmlFor="staff-offer-doc-input"
                            className="cursor-pointer inline-flex items-center gap-1.5 rounded-lg border border-teal-200 bg-teal-50/50 px-3 py-1.5 text-xs font-semibold text-teal-700 hover:bg-teal-100/60 shadow-2xs transition-colors shrink-0"
                          >
                            <span className="material-symbols-outlined text-sm text-teal-600">mark_email_read</span>
                            <span>{offerLetterFile ? 'Change Offer Letter' : 'Upload Offer Letter'}</span>
                          </label>
                          <span className="text-[11px] text-gray-400">PDF, JPG, PNG (Max 10MB)</span>
                        </div>

                        {/* Offer Letter Preview */}
                        {offerLetterFile && (
                          <div className="flex items-center justify-between p-2.5 rounded-xl border border-teal-200 bg-teal-50/50">
                            <div className="flex items-center gap-2.5 min-w-0">
                              {offerLetterPreview && offerLetterPreview !== 'pdf' ? (
                                <img src={offerLetterPreview} alt="Offer preview" className="h-10 w-10 rounded-lg object-cover border border-teal-200 shrink-0 shadow-2xs" />
                              ) : (
                                <div className="h-10 w-10 rounded-lg bg-teal-100 text-teal-700 flex items-center justify-center border border-teal-200 shrink-0">
                                  <span className="material-symbols-outlined text-xl">mark_email_read</span>
                                </div>
                              )}
                              <div className="min-w-0">
                                <p className="text-xs font-semibold text-gray-900 truncate">{offerLetterFileName}</p>
                                <p className="text-[10px] text-teal-700 font-medium">Offer / Appointment letter attached</p>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                setOfferLetterFile(null)
                                setOfferLetterFileName('')
                                setOfferLetterPreview('')
                              }}
                              className="text-xs font-semibold text-rose-600 hover:bg-rose-50 px-2 py-1 rounded-lg transition-colors"
                            >
                              Remove
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* --- Contact & Residence --- */}
                  <div className="space-y-1 pt-2">
                    <p className="text-[10.5px] font-semibold uppercase tracking-wider text-gray-400 pb-1.5">
                      Contact & Residence
                    </p>

                    {/* Mobile Number */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4 items-center py-2.5 border-b border-gray-100">
                      <label className="text-gray-700 font-semibold text-xs sm:col-span-1">
                        Mobile Number <span className="text-rose-500">*</span>
                      </label>
                      <div className="sm:col-span-2">
                        <input
                          type="tel"
                          name="mobile"
                          value={formData.mobile}
                          onChange={handleChange}
                          required
                          placeholder="+91 98765 43210"
                          className="w-full rounded-xl border border-gray-200 px-3 py-2 text-xs text-gray-800 placeholder:text-gray-400 focus:outline-none focus:border-gray-900 bg-white"
                        />
                      </div>
                    </div>

                    {/* Email Address */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4 items-center py-2.5 border-b border-gray-100">
                      <label className="text-gray-700 font-semibold text-xs sm:col-span-1">
                        Email Address <span className="text-rose-500">*</span>
                      </label>
                      <div className="sm:col-span-2">
                        <input
                          type="email"
                          name="email"
                          value={formData.email}
                          onChange={handleChange}
                          required
                          placeholder="teacher@starpublicschool.com"
                          className="w-full rounded-xl border border-gray-200 px-3 py-2 text-xs text-gray-800 placeholder:text-gray-400 focus:outline-none focus:border-gray-900 bg-white"
                        />
                      </div>
                    </div>

                    {/* Address */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4 items-start py-2.5 border-b border-gray-100">
                      <label className="text-gray-700 font-semibold text-xs sm:col-span-1 pt-1.5">
                        Complete Address <span className="text-rose-500">*</span>
                      </label>
                      <div className="sm:col-span-2">
                        <textarea
                          name="address"
                          rows={2}
                          value={formData.address}
                          onChange={handleChange}
                          required
                          placeholder="Village/Street, Post Office, Police Station, District, State, PIN Code"
                          className="w-full rounded-xl border border-gray-200 px-3 py-2 text-xs text-gray-800 placeholder:text-gray-400 focus:outline-none focus:border-gray-900 bg-white resize-none"
                        />
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                /* ====================================================
                   CASE B: NON-TEACHING STAFF FORM (Two-Column Layout)
                   ==================================================== */
                <>
                  <div className="space-y-1">
                    <p className="text-[10.5px] font-semibold uppercase tracking-wider text-gray-400 pb-1.5">
                      Support Staff Details
                    </p>

                    {/* Full Name */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4 items-center py-2.5 border-b border-gray-100">
                      <label className="text-gray-700 font-semibold text-xs sm:col-span-1">
                        Full Name <span className="text-rose-500">*</span>
                      </label>
                      <div className="sm:col-span-2">
                        <input
                          type="text"
                          name="full_name"
                          value={formData.full_name}
                          onChange={handleChange}
                          required
                          placeholder="e.g. Ramesh Kumar"
                          className="w-full rounded-xl border border-gray-200 px-3 py-2 text-xs text-gray-800 placeholder:text-gray-400 focus:outline-none focus:border-gray-900 bg-white"
                        />
                      </div>
                    </div>

                    {/* Date of Birth */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4 items-center py-2.5 border-b border-gray-100">
                      <label className="text-gray-700 font-semibold text-xs sm:col-span-1">
                        Date of Birth (DOB) <span className="text-rose-500">*</span>
                      </label>
                      <div className="sm:col-span-2">
                        <input
                          type="date"
                          name="date_of_birth"
                          value={formData.date_of_birth}
                          onChange={handleChange}
                          required
                          className="w-full rounded-xl border border-gray-200 px-3 py-2 text-xs text-gray-800 focus:outline-none focus:border-gray-900 bg-white"
                        />
                      </div>
                    </div>

                    {/* Gender */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4 items-center py-2.5 border-b border-gray-100">
                      <label className="text-gray-700 font-semibold text-xs sm:col-span-1">
                        Gender
                      </label>
                      <div className="sm:col-span-2">
                        <select
                          name="gender"
                          value={formData.gender}
                          onChange={handleChange}
                          className="w-full rounded-xl border border-gray-200 px-3 py-2 text-xs text-gray-800 focus:outline-none focus:border-gray-900 bg-white cursor-pointer"
                        >
                          <option value="Male">Male</option>
                          <option value="Female">Female</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>
                    </div>

                    {/* Father / Husband Name */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4 items-center py-2.5 border-b border-gray-100">
                      <label className="text-gray-700 font-semibold text-xs sm:col-span-1">
                        Father / Guardian Name <span className="text-gray-400 font-normal">(Optional)</span>
                      </label>
                      <div className="sm:col-span-2">
                        <input
                          type="text"
                          name="father_name"
                          value={formData.father_name}
                          onChange={handleChange}
                          placeholder="e.g. Ram Prasad"
                          className="w-full rounded-xl border border-gray-200 px-3 py-2 text-xs text-gray-800 placeholder:text-gray-400 focus:outline-none focus:border-gray-900 bg-white"
                        />
                      </div>
                    </div>

                    {/* Designation Dropdown */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4 items-center py-2.5 border-b border-gray-100">
                      <label className="text-gray-700 font-semibold text-xs sm:col-span-1">
                        Designation <span className="text-rose-500">*</span>
                      </label>
                      <div className="sm:col-span-2">
                        <select
                          name="designation"
                          value={formData.designation}
                          onChange={handleChange}
                          required
                          className="w-full rounded-xl border border-gray-200 px-3 py-2 text-xs text-gray-800 focus:outline-none focus:border-gray-900 bg-white cursor-pointer"
                        >
                          <option value="Peon / Office Attendant">Peon / Office Attendant</option>
                          <option value="Cleaner / Sweeper">Cleaner / Sweeper / Housekeeping</option>
                          <option value="Driver (Bus / Van)">Driver (School Bus / Van)</option>
                          <option value="Bus Conductor / Helper">Bus Conductor / Helper</option>
                          <option value="Security Guard">Security Guard / Watchman</option>
                          <option value="Gardener (Mali)">Gardener (Mali)</option>
                          <option value="Cook / Kitchen Staff">Cook / Kitchen Staff</option>
                          <option value="Lab Attendant">Lab Attendant</option>
                          <option value="Electrician / Maintenance">Electrician / Maintenance Staff</option>
                          <option value="Office Clerk / Assistant">Office Clerk / Assistant</option>
                          <option value="Other Support Staff">Other Support Staff</option>
                        </select>
                      </div>
                    </div>

                    {/* Mobile Number */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4 items-center py-2.5 border-b border-gray-100">
                      <label className="text-gray-700 font-semibold text-xs sm:col-span-1">
                        Mobile Number <span className="text-rose-500">*</span>
                      </label>
                      <div className="sm:col-span-2">
                        <input
                          type="tel"
                          name="mobile"
                          value={formData.mobile}
                          onChange={handleChange}
                          required
                          placeholder="+91 98765 43210"
                          className="w-full rounded-xl border border-gray-200 px-3 py-2 text-xs text-gray-800 placeholder:text-gray-400 focus:outline-none focus:border-gray-900 bg-white"
                        />
                      </div>
                    </div>

                    {/* Email (Optional) */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4 items-center py-2.5 border-b border-gray-100">
                      <div className="sm:col-span-1">
                        <label className="block text-gray-700 font-semibold text-xs">
                          Email Address
                        </label>
                        <p className="text-[10.5px] text-gray-400 mt-0.5">Optional (auto-generated if empty)</p>
                      </div>
                      <div className="sm:col-span-2">
                        <input
                          type="email"
                          name="email"
                          value={formData.email}
                          onChange={handleChange}
                          placeholder="staff@starpublicschool.com (optional)"
                          className="w-full rounded-xl border border-gray-200 px-3 py-2 text-xs text-gray-800 placeholder:text-gray-400 focus:outline-none focus:border-gray-900 bg-white"
                        />
                      </div>
                    </div>

                    {/* Address */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4 items-start py-2.5 border-b border-gray-100">
                      <label className="text-gray-700 font-semibold text-xs sm:col-span-1 pt-1.5">
                        Residential Address <span className="text-rose-500">*</span>
                      </label>
                      <div className="sm:col-span-2">
                        <textarea
                          name="address"
                          rows={2}
                          value={formData.address}
                          onChange={handleChange}
                          required
                          placeholder="Village/Street, Post Office, Police Station, District, State, PIN Code"
                          className="w-full rounded-xl border border-gray-200 px-3 py-2 text-xs text-gray-800 placeholder:text-gray-400 focus:outline-none focus:border-gray-900 bg-white resize-none"
                        />
                      </div>
                    </div>

                    {/* Aadhaar Number */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4 items-center py-2.5 border-b border-gray-100">
                      <div className="sm:col-span-1">
                        <label className="block text-gray-700 font-semibold text-xs">
                          Aadhaar Number
                        </label>
                        <p className="text-[10.5px] text-gray-400 mt-0.5">12-Digit UIDAI (Optional)</p>
                      </div>
                      <div className="sm:col-span-2">
                        <input
                          type="text"
                          name="aadhar_number"
                          value={formData.aadhar_number}
                          onChange={handleChange}
                          maxLength={14}
                          placeholder="e.g. 5432 1098 7654"
                          className="w-full rounded-xl border border-gray-200 px-3 py-2 text-xs text-gray-800 placeholder:text-gray-400 focus:outline-none focus:border-gray-900 bg-white"
                        />
                      </div>
                    </div>

                    {/* Documents: Aadhaar / ID Proof (Left Label, Right small upload button + preview below) */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4 items-start py-3 border-b border-gray-100">
                      <div className="sm:col-span-1">
                        <label className="block text-gray-700 font-semibold text-xs">
                          Aadhaar / ID Proof <span className="text-rose-500">*</span>
                        </label>
                        <p className="text-[10.5px] text-gray-400 mt-0.5">
                          Identity Document (Mandatory)
                        </p>
                      </div>
                      <div className="sm:col-span-2 space-y-2">
                        <div className="flex items-center gap-2.5">
                          <input
                            type="file"
                            id="staff-id-doc-input"
                            accept=".pdf,.png,.jpg,.jpeg"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0]
                              if (file) {
                                setAadharFile(file)
                                setAadharFileName(file.name)
                                if (file.type.startsWith('image/')) {
                                  setAadharPreview(URL.createObjectURL(file))
                                } else {
                                  setAadharPreview('pdf')
                                }
                                setError('')
                              }
                            }}
                          />
                          <label
                            htmlFor="staff-id-doc-input"
                            className="cursor-pointer inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 shadow-2xs transition-colors shrink-0"
                          >
                            <span className="material-symbols-outlined text-sm text-gray-500">badge</span>
                            <span>{aadharFile ? 'Change ID Document' : 'Upload Aadhaar / ID Proof'}</span>
                          </label>
                          <span className="text-[11px] text-gray-400">PDF, JPG, PNG (Max 10MB)</span>
                        </div>

                        {/* ID Document Preview */}
                        {aadharFile && (
                          <div className="flex items-center justify-between p-2.5 rounded-xl border border-amber-200 bg-amber-50/50">
                            <div className="flex items-center gap-2.5 min-w-0">
                              {aadharPreview && aadharPreview !== 'pdf' ? (
                                <img src={aadharPreview} alt="Doc preview" className="h-10 w-10 rounded-lg object-cover border border-amber-200 shrink-0 shadow-2xs" />
                              ) : (
                                <div className="h-10 w-10 rounded-lg bg-amber-100/70 text-amber-700 flex items-center justify-center border border-amber-200 shrink-0">
                                  <span className="material-symbols-outlined text-xl">badge</span>
                                </div>
                              )}
                              <div className="min-w-0">
                                <p className="text-xs font-semibold text-gray-900 truncate">{aadharFileName}</p>
                                <p className="text-[10px] text-amber-700 font-medium">Aadhaar / ID document attached</p>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                setAadharFile(null)
                                setAadharFileName('')
                                setAadharPreview('')
                              }}
                              className="text-xs font-semibold text-rose-600 hover:bg-rose-50 px-2 py-1 rounded-lg transition-colors"
                            >
                              Remove
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Curriculum Vitae (CV / Resume) */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4 items-start py-3 border-b border-gray-100">
                      <div className="sm:col-span-1">
                        <label className="block text-gray-700 font-semibold text-xs">
                          CV / Resume <span className="text-gray-400 font-normal">(Optional)</span>
                        </label>
                        <p className="text-[10.5px] text-gray-400 mt-0.5">
                          Curriculum Vitae / Biodata
                        </p>
                      </div>
                      <div className="sm:col-span-2 space-y-2">
                        <div className="flex items-center gap-2.5">
                          <input
                            type="file"
                            id="staff-cv-doc-input"
                            accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0]
                              if (file) {
                                setCvFile(file)
                                setCvFileName(file.name)
                                if (file.type.startsWith('image/')) {
                                  setCvPreview(URL.createObjectURL(file))
                                } else {
                                  setCvPreview('pdf')
                                }
                                setError('')
                              }
                            }}
                          />
                          <label
                            htmlFor="staff-cv-doc-input"
                            className="cursor-pointer inline-flex items-center gap-1.5 rounded-lg border border-purple-200 bg-purple-50/50 px-3 py-1.5 text-xs font-semibold text-purple-700 hover:bg-purple-100/60 shadow-2xs transition-colors shrink-0"
                          >
                            <span className="material-symbols-outlined text-sm text-purple-600">description</span>
                            <span>{cvFile ? 'Change CV File' : 'Upload CV / Resume'}</span>
                          </label>
                          <span className="text-[11px] text-gray-400">PDF, DOC, JPG (Max 10MB)</span>
                        </div>

                        {/* CV Preview */}
                        {cvFile && (
                          <div className="flex items-center justify-between p-2.5 rounded-xl border border-purple-200 bg-purple-50/50">
                            <div className="flex items-center gap-2.5 min-w-0">
                              {cvPreview && cvPreview !== 'pdf' ? (
                                <img src={cvPreview} alt="CV preview" className="h-10 w-10 rounded-lg object-cover border border-purple-200 shrink-0 shadow-2xs" />
                              ) : (
                                <div className="h-10 w-10 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center border border-purple-200 shrink-0">
                                  <span className="material-symbols-outlined text-xl">description</span>
                                </div>
                              )}
                              <div className="min-w-0">
                                <p className="text-xs font-semibold text-gray-900 truncate">{cvFileName}</p>
                                <p className="text-[10px] text-purple-700 font-medium">CV / Resume attached</p>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                setCvFile(null)
                                setCvFileName('')
                                setCvPreview('')
                              }}
                              className="text-xs font-semibold text-rose-600 hover:bg-rose-50 px-2 py-1 rounded-lg transition-colors"
                            >
                              Remove
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Offer / Appointment Letter */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4 items-start py-3 border-b border-gray-100">
                      <div className="sm:col-span-1">
                        <label className="block text-gray-700 font-semibold text-xs">
                          Offer Letter <span className="text-gray-400 font-normal">(Optional)</span>
                        </label>
                        <p className="text-[10.5px] text-gray-400 mt-0.5">
                          Appointment / Joining Letter
                        </p>
                      </div>
                      <div className="sm:col-span-2 space-y-2">
                        <div className="flex items-center gap-2.5">
                          <input
                            type="file"
                            id="staff-offer-doc-input"
                            accept=".pdf,.png,.jpg,.jpeg"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0]
                              if (file) {
                                setOfferLetterFile(file)
                                setOfferLetterFileName(file.name)
                                if (file.type.startsWith('image/')) {
                                  setOfferLetterPreview(URL.createObjectURL(file))
                                } else {
                                  setOfferLetterPreview('pdf')
                                }
                                setError('')
                              }
                            }}
                          />
                          <label
                            htmlFor="staff-offer-doc-input"
                            className="cursor-pointer inline-flex items-center gap-1.5 rounded-lg border border-teal-200 bg-teal-50/50 px-3 py-1.5 text-xs font-semibold text-teal-700 hover:bg-teal-100/60 shadow-2xs transition-colors shrink-0"
                          >
                            <span className="material-symbols-outlined text-sm text-teal-600">mark_email_read</span>
                            <span>{offerLetterFile ? 'Change Offer Letter' : 'Upload Offer Letter'}</span>
                          </label>
                          <span className="text-[11px] text-gray-400">PDF, JPG, PNG (Max 10MB)</span>
                        </div>

                        {/* Offer Letter Preview */}
                        {offerLetterFile && (
                          <div className="flex items-center justify-between p-2.5 rounded-xl border border-teal-200 bg-teal-50/50">
                            <div className="flex items-center gap-2.5 min-w-0">
                              {offerLetterPreview && offerLetterPreview !== 'pdf' ? (
                                <img src={offerLetterPreview} alt="Offer preview" className="h-10 w-10 rounded-lg object-cover border border-teal-200 shrink-0 shadow-2xs" />
                              ) : (
                                <div className="h-10 w-10 rounded-lg bg-teal-100 text-teal-700 flex items-center justify-center border border-teal-200 shrink-0">
                                  <span className="material-symbols-outlined text-xl">mark_email_read</span>
                                </div>
                              )}
                              <div className="min-w-0">
                                <p className="text-xs font-semibold text-gray-900 truncate">{offerLetterFileName}</p>
                                <p className="text-[10px] text-teal-700 font-medium">Offer / Appointment letter attached</p>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                setOfferLetterFile(null)
                                setOfferLetterFileName('')
                                setOfferLetterPreview('')
                              }}
                              className="text-xs font-semibold text-rose-600 hover:bg-rose-50 px-2 py-1 rounded-lg transition-colors"
                            >
                              Remove
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </>
              )}

              {/* --- Employee ID & Portal Password --- */}
              <div className="space-y-1 pt-2">
                <p className="text-[10.5px] font-semibold uppercase tracking-wider text-gray-400 pb-1.5">
                  Access & Credentials
                </p>

                {/* Employee ID */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4 items-center py-2.5 border-b border-gray-100">
                  <label className="text-gray-700 font-semibold text-xs sm:col-span-1">
                    Employee ID <span className="text-rose-500">*</span>
                  </label>
                  <div className="sm:col-span-2">
                    <input
                      type="text"
                      name="employee_id"
                      value={formData.employee_id}
                      onChange={handleChange}
                      required
                      placeholder={formData.staff_type === 'teaching' ? 'TCH-105' : 'STF-105'}
                      className="w-full rounded-xl border border-gray-200 px-3 py-2 text-xs text-gray-800 placeholder:text-gray-400 focus:outline-none focus:border-gray-900 bg-white font-mono"
                    />
                  </div>
                </div>

                {/* Portal Password */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4 items-start py-2.5 border-b border-gray-100">
                  <div className="sm:col-span-1">
                    <label className="block text-gray-700 font-semibold text-xs">
                      Portal Password <span className="text-rose-500">*</span>
                    </label>
                    <p className="text-[10.5px] text-gray-400 mt-0.5">Auto-generated login key</p>
                  </div>
                  <div className="sm:col-span-2 space-y-1.5">
                    <div className="relative">
                      <input
                        type={showAddPassword ? 'text' : 'password'}
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        required
                        minLength={6}
                        className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-mono font-semibold text-gray-900 focus:outline-none focus:border-gray-900 pr-24"
                      />
                      <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => setShowAddPassword((prev) => !prev)}
                          className="p-1 text-gray-400 hover:text-gray-600 text-xs"
                          title={showAddPassword ? 'Hide password' : 'Show password'}
                        >
                          <span className="material-symbols-outlined text-sm leading-none">
                            {showAddPassword ? 'visibility_off' : 'visibility'}
                          </span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (formData.password) {
                              navigator.clipboard.writeText(formData.password)
                              setCopiedKey('add_pass')
                              setTimeout(() => setCopiedKey(null), 2000)
                            }
                          }}
                          className="p-1 text-gray-400 hover:text-gray-600 text-xs"
                          title="Copy password"
                        >
                          <span className="material-symbols-outlined text-sm leading-none">
                            {copiedKey === 'add_pass' ? 'check' : 'content_copy'}
                          </span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const newPass = generateGeneralizedPassword(formData.full_name)
                            setFormData((prev) => ({ ...prev, password: newPass }))
                          }}
                          className="p-1 text-gray-400 hover:text-gray-600 text-xs"
                          title="Regenerate generalized password"
                        >
                          <span className="material-symbols-outlined text-sm leading-none">autorenew</span>
                        </button>
                      </div>
                    </div>
                    <p className="text-[11px] text-gray-400">
                      Generalized format: First 4 letters of name + @123 (e.g., {formData.full_name ? generateGeneralizedPassword(formData.full_name) : 'Rame@123'}).
                    </p>
                  </div>
                </div>
              </div>

              {/* Modal Actions */}
              <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                <span className="text-[11px] text-gray-400">
                  {uploadProgress || 'All starred (*) fields are required.'}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsAddModalOpen(false)}
                    className="rounded-xl border border-gray-200 px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="rounded-xl bg-gray-900 px-5 py-2 text-xs font-semibold text-white hover:bg-gray-800 transition-colors shadow-xs flex items-center gap-2 disabled:opacity-50"
                  >
                    {submitting ? (
                      <>
                        <span className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                        <span>{uploadProgress || 'Saving...'}</span>
                      </>
                    ) : (
                      <>
                        <span className="material-symbols-outlined text-base">person_add</span>
                        <span>Register Faculty</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 7. DETAILED FACULTY PROFILE MODAL */}
      {selectedTeacherProfile && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 overflow-y-auto"
          onClick={() => setSelectedTeacherProfile(null)}
        >
          <div
            className="w-full max-w-lg rounded-2xl bg-white shadow-xl border border-gray-200/90 overflow-hidden my-8"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-white">
              <h3 className="text-base font-bold text-gray-900">Faculty Profile</h3>
              <button
                onClick={() => setSelectedTeacherProfile(null)}
                className="h-8 w-8 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 flex items-center justify-center transition-colors"
              >
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              {/* Header row */}
              <div className="flex items-center gap-4">
                <div className="h-14 w-14 rounded-full bg-gray-100 text-gray-900 font-bold text-lg flex items-center justify-center overflow-hidden border border-gray-200 shrink-0">
                  {selectedTeacherProfile.photoUrl ? (
                    <img src={selectedTeacherProfile.photoUrl} alt="Teacher" className="h-full w-full object-cover" />
                  ) : (
                    getInitials(selectedTeacherProfile.fullName)
                  )}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="text-base font-bold text-gray-900 truncate">{selectedTeacherProfile.fullName}</h4>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${selectedTeacherProfile.staffType === 'non_teaching'
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-blue-100 text-blue-800'
                      }`}>
                      {selectedTeacherProfile.staffType === 'non_teaching' ? 'Non-Teaching' : 'Teaching'}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 truncate">{selectedTeacherProfile.designation} · {selectedTeacherProfile.department}</p>
                  <p className="text-[11px] font-mono text-gray-400">{selectedTeacherProfile.employeeId}</p>
                </div>
              </div>

              {/* Details Grid */}
              <div className="grid grid-cols-2 gap-3 p-4 rounded-xl bg-gray-50 border border-gray-100 text-xs">
                <div>
                  <span className="text-[10px] font-semibold text-gray-400 uppercase">Date of Birth (DOB)</span>
                  <p className="font-semibold text-gray-900 mt-0.5">{selectedTeacherProfile.dateOfBirth || '-'}</p>
                </div>
                <div>
                  <span className="text-[10px] font-semibold text-gray-400 uppercase">Gender</span>
                  <p className="font-semibold text-gray-900 mt-0.5">{selectedTeacherProfile.gender || 'Male'}</p>
                </div>
                <div>
                  <span className="text-[10px] font-semibold text-gray-400 uppercase">Father&apos;s Name</span>
                  <p className="font-semibold text-gray-900 mt-0.5">{selectedTeacherProfile.fatherName || '-'}</p>
                </div>
                {selectedTeacherProfile.staffType === 'teaching' && (
                  <div>
                    <span className="text-[10px] font-semibold text-gray-400 uppercase">Mother&apos;s Name</span>
                    <p className="font-semibold text-gray-900 mt-0.5">{selectedTeacherProfile.motherName || '-'}</p>
                  </div>
                )}
                {selectedTeacherProfile.staffType === 'teaching' && (
                  <>
                    <div>
                      <span className="text-[10px] font-semibold text-gray-400 uppercase">Subject</span>
                      <p className="font-semibold text-gray-900 mt-0.5">{selectedTeacherProfile.subject || '-'}</p>
                    </div>
                    <div>
                      <span className="text-[10px] font-semibold text-gray-400 uppercase">Teaching Role</span>
                      <p className="font-semibold text-gray-900 mt-0.5">{selectedTeacherProfile.roleTitle || '-'}</p>
                    </div>
                    <div>
                      <span className="text-[10px] font-semibold text-gray-400 uppercase">Highest Qualification</span>
                      <p className="font-semibold text-gray-900 mt-0.5">{selectedTeacherProfile.highestQualification || '-'}</p>
                    </div>
                    <div>
                      <span className="text-[10px] font-semibold text-gray-400 uppercase">Professional Qualification</span>
                      <p className="font-semibold text-gray-900 mt-0.5">{selectedTeacherProfile.professionalQualification || 'None'}</p>
                    </div>
                  </>
                )}
                <div>
                  <span className="text-[10px] font-semibold text-gray-400 uppercase">Mobile</span>
                  <p className="font-semibold text-gray-900 mt-0.5">{selectedTeacherProfile.mobile || '-'}</p>
                </div>
                <div>
                  <span className="text-[10px] font-semibold text-gray-400 uppercase">Email</span>
                  <p className="font-semibold text-gray-900 mt-0.5 truncate">{selectedTeacherProfile.email || '-'}</p>
                </div>
                {selectedTeacherProfile.aadharNumber && (
                  <div>
                    <span className="text-[10px] font-semibold text-gray-400 uppercase">Aadhaar Number</span>
                    <p className="font-semibold text-gray-900 mt-0.5 tracking-wide">{selectedTeacherProfile.aadharNumber}</p>
                  </div>
                )}
                <div className="col-span-2">
                  <span className="text-[10px] font-semibold text-gray-400 uppercase">Residential Address</span>
                  <p className="font-medium text-gray-800 mt-0.5 leading-snug">{selectedTeacherProfile.address || '-'}</p>
                </div>
              </div>

              {/* Qualification Documents Section */}
              <div className="space-y-2">
                {/* Highest Qualification / ID Document */}
                {selectedTeacherProfile.documentUrl && (
                  <div className="flex items-center justify-between p-3 rounded-xl border border-blue-200 bg-blue-50/50">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="material-symbols-outlined text-blue-600 text-lg shrink-0">
                        {selectedTeacherProfile.staffType === 'non_teaching' ? 'badge' : 'description'}
                      </span>
                      <div className="min-w-0">
                        <span className="font-semibold text-blue-900 block truncate">
                          {selectedTeacherProfile.staffType === 'non_teaching' ? 'ID Proof Document' : 'Highest Qualification Degree'}
                        </span>
                        <span className="text-[10px] text-blue-600 block">
                          {selectedTeacherProfile.staffType === 'non_teaching' ? 'Attached Identity Record' : (selectedTeacherProfile.highestQualification || 'Academic Degree')}
                        </span>
                      </div>
                    </div>
                    <a
                      href={selectedTeacherProfile.documentUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 px-3 py-1 bg-white border border-blue-200 rounded-lg text-blue-700 font-semibold hover:bg-blue-50 transition-colors shadow-2xs shrink-0"
                    >
                      <span>View Document</span>
                      <span className="material-symbols-outlined text-xs">open_in_new</span>
                    </a>
                  </div>
                )}

                {/* Professional Qualification Document */}
                {selectedTeacherProfile.professionalDocumentUrl && (
                  <div className="flex items-center justify-between p-3 rounded-xl border border-emerald-200 bg-emerald-50/50">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="material-symbols-outlined text-emerald-600 text-lg shrink-0">verified</span>
                      <div className="min-w-0">
                        <span className="font-semibold text-emerald-900 block truncate">Professional Qualification Certificate</span>
                        <span className="text-[10px] text-emerald-600 block">{selectedTeacherProfile.professionalQualification || 'Training Certificate'}</span>
                      </div>
                    </div>
                    <a
                      href={selectedTeacherProfile.professionalDocumentUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 px-3 py-1 bg-white border border-emerald-200 rounded-lg text-emerald-700 font-semibold hover:bg-emerald-50 transition-colors shadow-2xs shrink-0"
                    >
                      <span>View Certificate</span>
                      <span className="material-symbols-outlined text-xs">open_in_new</span>
                    </a>
                  </div>
                )}

                {/* Aadhaar Card / ID Document */}
                {selectedTeacherProfile.aadharCardUrl && (
                  <div className="flex items-center justify-between p-3 rounded-xl border border-amber-200 bg-amber-50/50">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="material-symbols-outlined text-amber-600 text-lg shrink-0">badge</span>
                      <div className="min-w-0">
                        <span className="font-semibold text-amber-900 block truncate">Aadhaar Card / ID Proof</span>
                        <span className="text-[10px] text-amber-600 block">
                          {selectedTeacherProfile.aadharNumber ? `UIDAI: ${selectedTeacherProfile.aadharNumber}` : 'Attached Identity Proof'}
                        </span>
                      </div>
                    </div>
                    <a
                      href={selectedTeacherProfile.aadharCardUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 px-3 py-1 bg-white border border-amber-200 rounded-lg text-amber-700 font-semibold hover:bg-amber-50 transition-colors shadow-2xs shrink-0"
                    >
                      <span>View Aadhaar</span>
                      <span className="material-symbols-outlined text-xs">open_in_new</span>
                    </a>
                  </div>
                )}

                {/* CV / Resume Document */}
                {selectedTeacherProfile.cvUrl && (
                  <div className="flex items-center justify-between p-3 rounded-xl border border-purple-200 bg-purple-50/50">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="material-symbols-outlined text-purple-600 text-lg shrink-0">description</span>
                      <div className="min-w-0">
                        <span className="font-semibold text-purple-900 block truncate">Curriculum Vitae (CV / Resume)</span>
                        <span className="text-[10px] text-purple-600 block">Candidate Professional Resume / Biodata</span>
                      </div>
                    </div>
                    <a
                      href={selectedTeacherProfile.cvUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 px-3 py-1 bg-white border border-purple-200 rounded-lg text-purple-700 font-semibold hover:bg-purple-50 transition-colors shadow-2xs shrink-0"
                    >
                      <span>View CV</span>
                      <span className="material-symbols-outlined text-xs">open_in_new</span>
                    </a>
                  </div>
                )}

                {/* Offer / Appointment Letter */}
                {selectedTeacherProfile.offerLetterUrl && (
                  <div className="flex items-center justify-between p-3 rounded-xl border border-teal-200 bg-teal-50/50">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="material-symbols-outlined text-teal-600 text-lg shrink-0">mark_email_read</span>
                      <div className="min-w-0">
                        <span className="font-semibold text-teal-900 block truncate">Offer Letter / Appointment Order</span>
                        <span className="text-[10px] text-teal-600 block">Official Star Public School Appointment</span>
                      </div>
                    </div>
                    <a
                      href={selectedTeacherProfile.offerLetterUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 px-3 py-1 bg-white border border-teal-200 rounded-lg text-teal-700 font-semibold hover:bg-teal-50 transition-colors shadow-2xs shrink-0"
                    >
                      <span>View Offer Letter</span>
                      <span className="material-symbols-outlined text-xs">open_in_new</span>
                    </a>
                  </div>
                )}

                {!selectedTeacherProfile.documentUrl && !selectedTeacherProfile.professionalDocumentUrl && !selectedTeacherProfile.aadharCardUrl && !selectedTeacherProfile.cvUrl && !selectedTeacherProfile.offerLetterUrl && (
                  <div className="p-3 rounded-xl border border-gray-200 bg-gray-50/50 text-center text-gray-400">
                    No certificate, CV, or ID documents attached for this record.
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => {
                    const target = selectedTeacherProfile
                    setSelectedTeacherProfile(null)
                    setDeletingTeacher(target)
                  }}
                  className="px-3.5 py-2 text-xs font-bold text-rose-600 border border-rose-200 bg-rose-50 hover:bg-rose-100 rounded-xl transition-colors flex items-center gap-1.5 shadow-2xs"
                >
                  <span className="material-symbols-outlined text-sm">delete</span>
                  <span>Remove Record</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const target = selectedTeacherProfile
                      setSelectedTeacherProfile(null)
                      handleOpenEditModal(target)
                    }}
                    className="px-4 py-2 text-xs font-bold text-slate-800 border border-slate-300 bg-white hover:bg-slate-50 rounded-xl transition-colors flex items-center gap-1.5 shadow-2xs"
                  >
                    <span className="material-symbols-outlined text-sm text-slate-600">edit</span>
                    <span>Edit Profile</span>
                  </button>

                  <button
                    onClick={() => setSelectedTeacherProfile(null)}
                    className="px-4 py-2 text-xs font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 7. CLASS ASSIGNMENT / TIMETABLE MODAL */}
      {assigningTeacher && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4"
          onClick={() => setAssigningTeacher(null)}
        >
          <div
            className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl border border-slate-200 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-extrabold text-[#0f1e36]">
                  {assigningTeacher.fullName}
                </h3>
                <p className="text-xs text-slate-500">
                  {assigningTeacher.employeeId} · {assigningTeacher.designation}
                </p>
              </div>
              <button onClick={() => setAssigningTeacher(null)} className="text-slate-400 hover:text-slate-600 font-bold">
                ✕
              </button>
            </div>

            <form onSubmit={handleAssignSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 font-bold mb-1">Class to Assign</label>
                <select
                  value={assignForm.class}
                  onChange={(e) => setAssignForm((prev) => ({ ...prev, class: e.target.value }))}
                  required
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-slate-800 focus:outline-none"
                >
                  <option value="">Select class</option>
                  {CLASS_OPTIONS.map((c) => (
                    <option key={c} value={c}>
                      {['Nursery', 'LKG', 'UKG'].includes(c) ? c : `Class ${c}`}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Section</label>
                <select
                  value={assignForm.section}
                  onChange={(e) => setAssignForm((prev) => ({ ...prev, section: e.target.value }))}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-slate-800 focus:outline-none"
                >
                  <option value="A">Section A</option>
                  <option value="B">Section B</option>
                  <option value="C">Section C</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Academic Year</label>
                <input
                  type="text"
                  value={assignForm.academic_year}
                  onChange={(e) => setAssignForm((prev) => ({ ...prev, academic_year: e.target.value }))}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-slate-800 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setAssigningTeacher(null)}
                  className="rounded-xl border border-slate-200 px-3.5 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-[#132c4e] px-4 py-2 text-xs font-bold text-white hover:bg-[#0e223e]"
                >
                  Confirm Allocation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 8. CONTACT MODAL */}
      {contactTeacher && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4"
          onClick={() => setContactTeacher(null)}
        >
          <div
            className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-xl border border-slate-200 space-y-3"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="font-bold text-[#0f1e36] text-sm">Faculty Contact Details</h3>
            <div className="space-y-1.5 text-xs text-slate-700 bg-slate-50 p-3 rounded-xl">
              <p><strong>Name:</strong> {contactTeacher.fullName}</p>
              <p><strong>Phone:</strong> {contactTeacher.mobile}</p>
              <p><strong>Email:</strong> {contactTeacher.email}</p>
              <p><strong>Department:</strong> {contactTeacher.department}</p>
            </div>
            <button
              onClick={() => setContactTeacher(null)}
              className="w-full rounded-xl bg-[#132c4e] py-2 text-xs font-bold text-white"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* 9. DELETE CONFIRMATION MODAL */}
      {deletingTeacher && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4"
          onClick={() => !deleteLoading && setDeletingTeacher(null)}
        >
          <div
            className="w-full max-w-md rounded-2xl bg-white shadow-2xl border border-rose-100 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-100 text-rose-600 mb-4">
                <span className="material-symbols-outlined text-3xl">delete_forever</span>
              </div>
              <h3 className="text-base font-bold text-gray-900">
                Remove Faculty Member?
              </h3>
              <p className="text-xs text-gray-500 mt-2 leading-relaxed">
                Are you sure you want to delete <span className="font-bold text-gray-900">{deletingTeacher.fullName}</span> ({deletingTeacher.employeeId})?
              </p>
              <div className="mt-3.5 p-3 rounded-xl bg-rose-50 border border-rose-200/60 text-left text-[11.5px] text-rose-800 space-y-1">
                <p className="font-bold flex items-center gap-1 text-rose-900">
                  <span className="material-symbols-outlined text-sm">warning</span>
                  Permanent Deletion:
                </p>
                <p>This will permanently remove the teacher profile, portal login credentials, documents, and timetable assignments from the database.</p>
              </div>
            </div>

            <div className="flex items-center gap-2.5 px-6 py-4 bg-gray-50 border-t border-gray-100">
              <button
                type="button"
                disabled={deleteLoading}
                onClick={() => setDeletingTeacher(null)}
                className="flex-1 rounded-xl border border-gray-200 bg-white py-2.5 text-xs font-bold text-gray-700 hover:bg-gray-100 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deleteLoading}
                onClick={handleConfirmDelete}
                className="flex-1 rounded-xl bg-rose-600 py-2.5 text-xs font-bold text-white hover:bg-rose-700 transition-colors shadow-xs flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                {deleteLoading ? (
                  <>
                    <span className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-solid border-white border-r-transparent" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-sm">delete</span>
                    <span>Yes, Delete</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 10. DIRECT PASSWORD RESET MODAL */}
      {resetTeacherTarget && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4"
          onClick={() => !resetLoading && setResetTeacherTarget(null)}
        >
          <div
            className="w-full max-w-md rounded-2xl bg-white shadow-2xl border border-amber-100 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-gradient-to-r from-amber-500 to-amber-600 px-6 py-4 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/20 text-white backdrop-blur-xs">
                  <span className="material-symbols-outlined text-xl">lock_reset</span>
                </div>
                <div>
                  <h3 className="text-sm font-bold leading-tight">Reset Faculty Password</h3>
                  <p className="text-[11px] text-amber-100">Direct Admin Override · No Old Password Needed</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setResetTeacherTarget(null)}
                className="text-white/80 hover:text-white text-base leading-none p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleResetPasswordSubmit} className="p-6 space-y-4">
              <div className="flex items-center gap-3 p-3 bg-amber-50/70 border border-amber-200/60 rounded-xl">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100 text-amber-800 font-bold text-xs">
                  {getInitials(resetTeacherTarget.fullName)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-gray-900 truncate">{resetTeacherTarget.fullName}</p>
                  <p className="text-[11px] text-gray-500">
                    {resetTeacherTarget.employeeId} · {resetTeacherTarget.designation || 'Faculty'}
                  </p>
                  {resetTeacherTarget.email && (
                    <p className="text-[11px] text-amber-700 font-mono truncate">{resetTeacherTarget.email}</p>
                  )}
                </div>
              </div>

              {resetError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
                  <span className="material-symbols-outlined text-sm shrink-0">error</span>
                  <span>{resetError}</span>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-gray-700">
                  New Password <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showResetPassword ? 'text' : 'password'}
                    value={resetPasswordValue}
                    onChange={(e) => setResetPasswordValue(e.target.value)}
                    required
                    minLength={6}
                    placeholder="Enter new password"
                    className="w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-xs font-mono font-bold text-gray-900 focus:outline-none focus:border-amber-500 pr-24 shadow-2xs"
                  />
                  <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setShowResetPassword((prev) => !prev)}
                      className="p-1 text-gray-400 hover:text-gray-600 text-xs"
                      title={showResetPassword ? 'Hide password' : 'Show password'}
                    >
                      <span className="material-symbols-outlined text-sm leading-none">
                        {showResetPassword ? 'visibility_off' : 'visibility'}
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (resetPasswordValue) {
                          navigator.clipboard.writeText(resetPasswordValue)
                          setCopiedKey('reset_pass')
                          setTimeout(() => setCopiedKey(null), 2000)
                        }
                      }}
                      className="p-1 text-gray-400 hover:text-gray-600 text-xs"
                      title="Copy password"
                    >
                      <span className="material-symbols-outlined text-sm leading-none">
                        {copiedKey === 'reset_pass' ? 'check' : 'content_copy'}
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const newPass = generateGeneralizedPassword(resetTeacherTarget.fullName)
                        setResetPasswordValue(newPass)
                      }}
                      className="p-1 text-gray-400 hover:text-gray-600 text-xs"
                      title="Regenerate generalized password"
                    >
                      <span className="material-symbols-outlined text-sm leading-none">autorenew</span>
                    </button>
                  </div>
                </div>
                <p className="text-[11px] text-gray-400">
                  Generalized format: First 4 characters of name + @123 (e.g., {generateGeneralizedPassword(resetTeacherTarget.fullName)}).
                </p>
              </div>

              {/* Double-Check Confirmation Box to prevent accidental resets */}
              <div className="p-3.5 bg-amber-50/80 rounded-xl border border-amber-200 transition-colors hover:bg-amber-50">
                <label className="flex items-start gap-3 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={resetConfirmed}
                    onChange={(e) => setResetConfirmed(e.target.checked)}
                    className="mt-0.5 h-4 w-4 rounded border-amber-300 text-amber-600 focus:ring-amber-500 cursor-pointer shrink-0"
                  />
                  <div className="text-xs text-amber-950 leading-relaxed min-w-0">
                    <p className="font-bold text-amber-900 flex items-center gap-1.5 mb-1">
                      <span className="material-symbols-outlined text-[16px] text-amber-700 shrink-0">verified_user</span>
                      <span>Confirmation Required</span>
                    </p>
                    <p className="text-[12px] text-amber-950 font-medium leading-normal">
                      I confirm resetting the login password for <span className="font-bold underline decoration-amber-300">{resetTeacherTarget.fullName}</span> ({resetTeacherTarget.employeeId}).
                    </p>
                    <p className="text-[11px] text-amber-700/80 mt-1">
                      Check this box to enable the &quot;Update Password&quot; button.
                    </p>
                  </div>
                </label>
              </div>

              <div className="flex items-center gap-2 pt-2 border-t border-gray-100">
                <button
                  type="button"
                  disabled={resetLoading}
                  onClick={() => setResetTeacherTarget(null)}
                  className="flex-1 rounded-xl border border-gray-200 py-2.5 text-xs font-bold text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={resetLoading || !resetConfirmed}
                  className="flex-1 rounded-xl bg-amber-600 py-2.5 text-xs font-bold text-white hover:bg-amber-700 transition-colors shadow-xs flex items-center justify-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {resetLoading ? (
                    <>
                      <span className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-solid border-white border-r-transparent" />
                      <span>Updating...</span>
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-sm">key</span>
                      <span>Update Password</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 11. SHAREABLE & DOWNLOADABLE CREDENTIAL SLIP MODAL */}
      {isCredentialModalOpen && credentialCardData && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4"
          onClick={() => setIsCredentialModalOpen(false)}
        >
          <div
            className="w-full max-w-lg rounded-2xl bg-white shadow-2xl border border-gray-200 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="bg-[#0f1e36] px-6 py-4 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 text-amber-300">
                  <span className="material-symbols-outlined text-xl">badge</span>
                </div>
                <div>
                  <h3 className="text-sm font-bold leading-tight">Faculty Credential Slip</h3>
                  <p className="text-[11px] text-slate-300">
                    {credentialCardData.mode === 'reset' ? 'Password Reset Successfully' : 'Account Created Successfully'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsCredentialModalOpen(false)}
                className="text-white/70 hover:text-white text-base leading-none p-1"
              >
                ✕
              </button>
            </div>

            {/* Slip Container for HTML2Canvas & Print */}
            <div className="p-6 bg-slate-50/60">
              <div
                id="faculty-credential-slip"
                className="bg-white rounded-2xl border-2 border-slate-200 shadow-sm p-6 space-y-4"
              >
                {/* School Header */}
                <div className="flex items-center justify-between border-b-2 border-[#132c4e]/20 pb-3">
                  <div className="flex items-center gap-3">
                    <img
                      src={schoolLogo}
                      alt="Star Public School"
                      className="h-11 w-11 object-contain rounded-lg"
                    />
                    <div>
                      <h4 className="text-base font-extrabold text-[#0f1e36] tracking-wide">
                        STAR PUBLIC SCHOOL
                      </h4>
                      <p className="text-[10.5px] font-medium text-slate-500 uppercase tracking-wider">
                        Staff & Faculty Portal Access
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`inline-block px-2.5 py-1 text-[10px] font-extrabold rounded-lg uppercase tracking-wider ${credentialCardData.mode === 'reset'
                      ? 'bg-amber-100 text-amber-800 border border-amber-300'
                      : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                      }`}>
                      {credentialCardData.mode === 'reset' ? 'Password Reset' : 'New Account'}
                    </span>
                    <p className="text-[10px] text-slate-400 mt-1">
                      {new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </p>
                  </div>
                </div>

                {/* Details Table */}
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                    <p className="text-[10px] uppercase font-bold text-slate-400">Faculty Name</p>
                    <p className="font-bold text-slate-900 mt-0.5 truncate">{credentialCardData.fullName}</p>
                  </div>
                  <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                    <p className="text-[10px] uppercase font-bold text-slate-400">Employee ID</p>
                    <p className="font-mono font-bold text-indigo-700 mt-0.5">{credentialCardData.employeeId}</p>
                  </div>
                  <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                    <p className="text-[10px] uppercase font-bold text-slate-400">Designation / Role</p>
                    <p className="font-semibold text-slate-800 mt-0.5 truncate">{credentialCardData.designation || 'Staff Member'}</p>
                  </div>
                  <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                    <p className="text-[10px] uppercase font-bold text-slate-400">Department</p>
                    <p className="font-semibold text-slate-800 mt-0.5 truncate">{credentialCardData.department || 'Academics'}</p>
                  </div>
                </div>

                {/* Login Credentials Box */}
                <div className="p-3.5 bg-blue-50/70 rounded-xl border border-blue-200/80 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[11px] font-bold text-slate-600">Portal URL:</span>
                    <span className="font-mono text-blue-700 font-semibold">{window.location.origin}/login</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[11px] font-bold text-slate-600">Login Email / Username:</span>
                    <span className="font-mono font-bold text-slate-900">{credentialCardData.email}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs pt-1 border-t border-blue-200/50">
                    <span className="text-[11px] font-bold text-slate-700">Default Password:</span>
                    <span className="font-mono font-extrabold text-sm text-emerald-700 tracking-wider bg-white px-2 py-0.5 rounded-md border border-emerald-300">
                      {credentialCardData.password}
                    </span>
                  </div>
                </div>

                {/* Security Advisory */}
                <p className="text-[10.5px] text-slate-500 text-center leading-relaxed">
                  ⚠️ Please keep this slip confidential. You can update your password after signing in to the Star Public School portal.
                </p>
              </div>
            </div>

            {/* Actions Bar */}
            <div className="px-6 py-4 bg-white border-t border-gray-100 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCopySlipText}
                  className="px-3 py-2 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-xs font-bold text-gray-700 flex items-center gap-1.5 transition-colors shadow-2xs"
                  title="Copy details to clipboard"
                >
                  <span className="material-symbols-outlined text-sm">
                    {copiedKey === 'slip' ? 'check' : 'content_copy'}
                  </span>
                  <span>{copiedKey === 'slip' ? 'Copied!' : 'Copy Text'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleShareWhatsApp}
                  className="px-3 py-2 rounded-xl border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-xs font-bold text-emerald-800 flex items-center gap-1.5 transition-colors shadow-2xs"
                  title="Share details on WhatsApp"
                >
                  <span className="material-symbols-outlined text-sm text-emerald-600">chat</span>
                  <span>WhatsApp</span>
                </button>

                <button
                  type="button"
                  disabled={downloadingSlip}
                  onClick={handleDownloadSlipImage}
                  className="px-3 py-2 rounded-xl border border-indigo-200 bg-indigo-50 hover:bg-indigo-100 text-xs font-bold text-indigo-800 flex items-center gap-1.5 transition-colors shadow-2xs disabled:opacity-50"
                  title="Download Slip as PNG image"
                >
                  {downloadingSlip ? (
                    <span className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-solid border-indigo-600 border-r-transparent" />
                  ) : (
                    <span className="material-symbols-outlined text-sm text-indigo-600">download</span>
                  )}
                  <span>Download PNG</span>
                </button>
              </div>

              <button
                type="button"
                onClick={() => setIsCredentialModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-gray-900 hover:bg-gray-800 text-xs font-bold text-white transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 12. EDIT FACULTY / STAFF PROFILE MODAL */}
      {isEditModalOpen && editingTeacher && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 overflow-y-auto"
          onClick={() => !editSubmitting && setIsEditModalOpen(false)}
        >
          <div
            className="w-full max-w-2xl rounded-2xl bg-white shadow-2xl border border-gray-200/90 overflow-hidden my-6 flex flex-col max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-[#0f1e36] text-white shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 text-amber-300">
                  <span className="material-symbols-outlined text-xl">edit_document</span>
                </div>
                <div>
                  <h3 className="text-sm font-bold leading-tight">Edit Faculty Profile</h3>
                  <p className="text-[11px] text-slate-300">
                    Updating: {editingTeacher.fullName} ({editingTeacher.employeeId})
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsEditModalOpen(false)}
                className="text-white/70 hover:text-white p-1"
              >
                <span className="material-symbols-outlined text-lg leading-none">close</span>
              </button>
            </div>

            {/* Modal Form Body */}
            <form onSubmit={handleEditTeacherSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
              {editError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
                  <span className="material-symbols-outlined text-sm shrink-0">error</span>
                  <span>{editError}</span>
                </div>
              )}

              {/* Staff Type Switcher */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-800 block">Staff Classification</span>
                  <span className="text-[11px] text-slate-500">Choose between academic faculty and support staff</span>
                </div>
                <div className="flex items-center bg-white p-1 rounded-lg border border-slate-200">
                  <button
                    type="button"
                    onClick={() => setEditFormData((prev) => ({ ...prev, staff_type: 'teaching' }))}
                    className={`px-3 py-1 text-xs font-bold rounded-md transition-colors ${editFormData.staff_type === 'teaching'
                      ? 'bg-[#132c4e] text-white shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                      }`}
                  >
                    Teaching Faculty
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditFormData((prev) => ({ ...prev, staff_type: 'non_teaching' }))}
                    className={`px-3 py-1 text-xs font-bold rounded-md transition-colors ${editFormData.staff_type === 'non_teaching'
                      ? 'bg-[#132c4e] text-white shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                      }`}
                  >
                    Non-Teaching Staff
                  </button>
                </div>
              </div>

              {/* Personal Information */}
              <div className="space-y-1">
                <p className="text-[10.5px] font-semibold uppercase tracking-wider text-gray-400 pb-1 border-b border-gray-100">
                  Personal Information
                </p>

                {/* Full Name */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4 items-center py-2 border-b border-gray-100">
                  <label className="text-gray-700 font-semibold text-xs sm:col-span-1">
                    Full Name <span className="text-rose-500">*</span>
                  </label>
                  <div className="sm:col-span-2">
                    <input
                      type="text"
                      name="full_name"
                      value={editFormData.full_name || ''}
                      onChange={handleEditChange}
                      required
                      className="w-full rounded-xl border border-gray-200 px-3 py-2 text-xs text-gray-800 focus:outline-none focus:border-gray-900 bg-white"
                    />
                  </div>
                </div>

                {/* Date of Birth */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4 items-center py-2 border-b border-gray-100">
                  <label className="text-gray-700 font-semibold text-xs sm:col-span-1">
                    Date of Birth (DOB) <span className="text-rose-500">*</span>
                  </label>
                  <div className="sm:col-span-2">
                    <input
                      type="date"
                      name="date_of_birth"
                      value={editFormData.date_of_birth || ''}
                      onChange={handleEditChange}
                      required
                      className="w-full rounded-xl border border-gray-200 px-3 py-2 text-xs text-gray-800 focus:outline-none focus:border-gray-900 bg-white"
                    />
                  </div>
                </div>

                {/* Gender */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4 items-center py-2 border-b border-gray-100">
                  <label className="text-gray-700 font-semibold text-xs sm:col-span-1">
                    Gender
                  </label>
                  <div className="sm:col-span-2">
                    <select
                      name="gender"
                      value={editFormData.gender || 'Male'}
                      onChange={handleEditChange}
                      className="w-full rounded-xl border border-gray-200 px-3 py-2 text-xs text-gray-800 focus:outline-none focus:border-gray-900 bg-white cursor-pointer"
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>

                {/* Father / Guardian Name */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4 items-center py-2 border-b border-gray-100">
                  <label className="text-gray-700 font-semibold text-xs sm:col-span-1">
                    Father / Guardian Name
                  </label>
                  <div className="sm:col-span-2">
                    <input
                      type="text"
                      name="father_name"
                      value={editFormData.father_name || ''}
                      onChange={handleEditChange}
                      className="w-full rounded-xl border border-gray-200 px-3 py-2 text-xs text-gray-800 focus:outline-none focus:border-gray-900 bg-white"
                    />
                  </div>
                </div>

                {/* Mother's Name */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4 items-center py-2 border-b border-gray-100">
                  <label className="text-gray-700 font-semibold text-xs sm:col-span-1">
                    Mother's Name
                  </label>
                  <div className="sm:col-span-2">
                    <input
                      type="text"
                      name="mother_name"
                      value={editFormData.mother_name || ''}
                      onChange={handleEditChange}
                      className="w-full rounded-xl border border-gray-200 px-3 py-2 text-xs text-gray-800 focus:outline-none focus:border-gray-900 bg-white"
                    />
                  </div>
                </div>

                {/* Attendance / Active Status */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4 items-center py-2 border-b border-gray-100">
                  <label className="text-gray-700 font-semibold text-xs sm:col-span-1">
                    Duty Status
                  </label>
                  <div className="sm:col-span-2">
                    <select
                      name="status"
                      value={editFormData.status || 'active'}
                      onChange={handleEditChange}
                      className="w-full rounded-xl border border-gray-200 px-3 py-2 text-xs text-gray-800 focus:outline-none focus:border-gray-900 bg-white cursor-pointer"
                    >
                      <option value="active">Present / Active</option>
                      <option value="inactive">On Leave</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Role & Academic Specialization */}
              {editFormData.staff_type === 'teaching' ? (
                <div className="space-y-1 pt-1">
                  <p className="text-[10.5px] font-semibold uppercase tracking-wider text-gray-400 pb-1 border-b border-gray-100">
                    Teaching Role & Subject
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4 items-center py-2 border-b border-gray-100">
                    <label className="text-gray-700 font-semibold text-xs sm:col-span-1">
                      Teaching Role <span className="text-rose-500">*</span>
                    </label>
                    <div className="sm:col-span-2">
                      <select
                        name="role_title"
                        value={editFormData.role_title || ''}
                        onChange={handleEditChange}
                        className="w-full rounded-xl border border-gray-200 px-3 py-2 text-xs text-gray-800 focus:outline-none focus:border-gray-900 bg-white cursor-pointer"
                      >
                        <option value="PRT">PRT (Primary Teacher)</option>
                        <option value="TGT">TGT (Trained Graduate Teacher)</option>
                        <option value="PGT">PGT (Post Graduate Teacher)</option>
                        <option value="HOD">HOD (Head of Department)</option>
                        <option value="Coordinator">Coordinator</option>
                        <option value="Vice Principal">Vice Principal</option>
                        <option value="Principal">Principal</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4 items-center py-2 border-b border-gray-100">
                    <label className="text-gray-700 font-semibold text-xs sm:col-span-1">
                      Primary Subject <span className="text-rose-500">*</span>
                    </label>
                    <div className="sm:col-span-2">
                      <select
                        name="subject"
                        value={editFormData.subject || ''}
                        onChange={handleEditChange}
                        className="w-full rounded-xl border border-gray-200 px-3 py-2 text-xs text-gray-800 focus:outline-none focus:border-gray-900 bg-white cursor-pointer"
                      >
                        <option value="Mathematics">Mathematics</option>
                        <option value="Science (Physics, Chem, Bio)">Science (Physics, Chem, Bio)</option>
                        <option value="English">English</option>
                        <option value="Hindi">Hindi</option>
                        <option value="Social Studies (History, Civics, Geog)">Social Studies (History, Civics, Geog)</option>
                        <option value="Sanskrit">Sanskrit</option>
                        <option value="Computer Science / IT">Computer Science / IT</option>
                        <option value="Physical Education / Sports">Physical Education / Sports</option>
                        <option value="Art & Craft">Art & Craft</option>
                        <option value="Music / Dance">Music / Dance</option>
                        <option value="EVS (Environmental Studies)">EVS (Environmental Studies)</option>
                        <option value="General / All Subjects">General / All Subjects</option>
                      </select>
                    </div>
                  </div>

                  {/* Highest Qualification */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4 items-center py-2 border-b border-gray-100">
                    <label className="text-gray-700 font-semibold text-xs sm:col-span-1">
                      Highest Academic Degree
                    </label>
                    <div className="sm:col-span-2">
                      <select
                        name="highest_qualification"
                        value={editFormData.highest_qualification || ''}
                        onChange={handleEditChange}
                        className="w-full rounded-xl border border-gray-200 px-3 py-2 text-xs text-gray-800 focus:outline-none focus:border-gray-900 bg-white cursor-pointer"
                      >
                        <option value="" disabled>-- Select Highest Qualification --</option>
                        <option value="10th (Matriculation)">10th (Matriculation)</option>
                        <option value="12th (Intermediate / 10+2)">12th (Intermediate / 10+2)</option>
                        <option value="Diploma">Diploma</option>
                        <option value="Bachelor's Degree (Graduate)">Bachelor's Degree (Graduate - B.A, B.Sc, B.Com, B.Tech, etc.)</option>
                        <option value="Master's Degree (Post Graduate)">Master's Degree (Post Graduate - M.A, M.Sc, M.Com, M.Tech, etc.)</option>
                        <option value="M.Phil">M.Phil</option>
                        <option value="Ph.D / Doctorate">Ph.D / Doctorate</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                  </div>

                  {/* Professional Qualification */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4 items-center py-2 border-b border-gray-100">
                    <label className="text-gray-700 font-semibold text-xs sm:col-span-1">
                      Professional Course
                    </label>
                    <div className="sm:col-span-2">
                      <select
                        name="professional_qualification"
                        value={editFormData.professional_qualification || ''}
                        onChange={handleEditChange}
                        className="w-full rounded-xl border border-gray-200 px-3 py-2 text-xs text-gray-800 focus:outline-none focus:border-gray-900 bg-white cursor-pointer"
                      >
                        <option value="">None / Not Applicable</option>
                        <option value="B.Ed (Bachelor of Education)">B.Ed (Bachelor of Education)</option>
                        <option value="D.El.Ed (Diploma in Elementary Education)">D.El.Ed (Diploma in Elementary Education)</option>
                        <option value="B.El.Ed (Bachelor of Elementary Education)">B.El.Ed (Bachelor of Elementary Education)</option>
                        <option value="M.Ed (Master of Education)">M.Ed (Master of Education)</option>
                        <option value="NTT (Nursery Teacher Training)">NTT (Nursery Teacher Training)</option>
                        <option value="JBT / BTC">JBT / BTC</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-1 pt-1">
                  <p className="text-[10.5px] font-semibold uppercase tracking-wider text-gray-400 pb-1 border-b border-gray-100">
                    Support Staff Designation
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4 items-center py-2 border-b border-gray-100">
                    <label className="text-gray-700 font-semibold text-xs sm:col-span-1">
                      Designation <span className="text-rose-500">*</span>
                    </label>
                    <div className="sm:col-span-2">
                      <select
                        name="designation"
                        value={editFormData.designation || ''}
                        onChange={handleEditChange}
                        className="w-full rounded-xl border border-gray-200 px-3 py-2 text-xs text-gray-800 focus:outline-none focus:border-gray-900 bg-white cursor-pointer"
                      >
                        <option value="Peon / Office Attendant">Peon / Office Attendant</option>
                        <option value="Cleaner / Sweeper">Cleaner / Sweeper / Housekeeping</option>
                        <option value="Driver (Bus / Van)">Driver (School Bus / Van)</option>
                        <option value="Bus Conductor / Helper">Bus Conductor / Helper</option>
                        <option value="Security Guard">Security Guard / Watchman</option>
                        <option value="Gardener (Mali)">Gardener (Mali)</option>
                        <option value="Cook / Kitchen Staff">Cook / Kitchen Staff</option>
                        <option value="Lab Attendant">Lab Attendant</option>
                        <option value="Electrician / Maintenance">Electrician / Maintenance Staff</option>
                        <option value="Office Clerk / Assistant">Office Clerk / Assistant</option>
                        <option value="Other Support Staff">Other Support Staff</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* Contact & Residential Information */}
              <div className="space-y-1 pt-1">
                <p className="text-[10.5px] font-semibold uppercase tracking-wider text-gray-400 pb-1 border-b border-gray-100">
                  Contact & Residence
                </p>

                {/* Mobile */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4 items-center py-2 border-b border-gray-100">
                  <label className="text-gray-700 font-semibold text-xs sm:col-span-1">
                    Mobile Number <span className="text-rose-500">*</span>
                  </label>
                  <div className="sm:col-span-2">
                    <input
                      type="tel"
                      name="mobile"
                      value={editFormData.mobile || ''}
                      onChange={handleEditChange}
                      required
                      className="w-full rounded-xl border border-gray-200 px-3 py-2 text-xs text-gray-800 focus:outline-none focus:border-gray-900 bg-white"
                    />
                  </div>
                </div>

                {/* Email */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4 items-center py-2 border-b border-gray-100">
                  <label className="text-gray-700 font-semibold text-xs sm:col-span-1">
                    Email Address
                  </label>
                  <div className="sm:col-span-2">
                    <input
                      type="email"
                      name="email"
                      value={editFormData.email || ''}
                      onChange={handleEditChange}
                      className="w-full rounded-xl border border-gray-200 px-3 py-2 text-xs text-gray-800 focus:outline-none focus:border-gray-900 bg-white"
                    />
                  </div>
                </div>

                {/* Address */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4 items-start py-2 border-b border-gray-100">
                  <label className="text-gray-700 font-semibold text-xs sm:col-span-1 pt-1">
                    Residential Address <span className="text-rose-500">*</span>
                  </label>
                  <div className="sm:col-span-2">
                    <textarea
                      name="address"
                      rows={2}
                      value={editFormData.address || ''}
                      onChange={handleEditChange}
                      required
                      className="w-full rounded-xl border border-gray-200 px-3 py-2 text-xs text-gray-800 focus:outline-none focus:border-gray-900 bg-white resize-none"
                    />
                  </div>
                </div>

                {/* Aadhaar Number */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4 items-center py-2 border-b border-gray-100">
                  <label className="text-gray-700 font-semibold text-xs sm:col-span-1">
                    Aadhaar Number
                  </label>
                  <div className="sm:col-span-2">
                    <input
                      type="text"
                      name="aadhar_number"
                      value={editFormData.aadhar_number || ''}
                      onChange={handleEditChange}
                      maxLength={14}
                      placeholder="e.g. 5432 1098 7654"
                      className="w-full rounded-xl border border-gray-200 px-3 py-2 text-xs text-gray-800 focus:outline-none focus:border-gray-900 bg-white font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Document Management Section */}
              <div className="space-y-2 pt-1">
                <p className="text-[10.5px] font-semibold uppercase tracking-wider text-gray-400 pb-1 border-b border-gray-100">
                  Documents Management (View & Update)
                </p>

                {/* Qualification Document */}
                {editFormData.staff_type === 'teaching' && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4 items-start py-2.5 border-b border-gray-100">
                    <div className="sm:col-span-1">
                      <label className="block text-gray-700 font-semibold text-xs">Degree / Qualification</label>
                      {editFormData.document_url && (
                        <a
                          href={editFormData.document_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-[11px] text-blue-600 hover:underline mt-0.5"
                        >
                          <span>View Current Document</span>
                          <span className="material-symbols-outlined text-xs">open_in_new</span>
                        </a>
                      )}
                    </div>
                    <div className="sm:col-span-2 space-y-1.5">
                      <input
                        type="file"
                        id="edit-qual-doc-input"
                        accept=".pdf,.png,.jpg,.jpeg"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0]
                          if (file) {
                            setEditDocumentFile(file)
                            setEditDocumentName(file.name)
                          }
                        }}
                      />
                      <label
                        htmlFor="edit-qual-doc-input"
                        className="cursor-pointer inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 shadow-2xs"
                      >
                        <span className="material-symbols-outlined text-sm text-gray-500">upload_file</span>
                        <span>{editDocumentFile ? 'Change Selected File' : (editFormData.document_url ? 'Replace Document' : 'Upload Document')}</span>
                      </label>
                      {editDocumentFile && (
                        <p className="text-xs text-emerald-700 font-semibold">New: {editDocumentName}</p>
                      )}
                    </div>
                  </div>
                )}

                {/* Professional Certificate */}
                {editFormData.staff_type === 'teaching' && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4 items-start py-2.5 border-b border-gray-100">
                    <div className="sm:col-span-1">
                      <label className="block text-gray-700 font-semibold text-xs">Professional Course Cert</label>
                      {editFormData.professional_document_url && (
                        <a
                          href={editFormData.professional_document_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-[11px] text-emerald-600 hover:underline mt-0.5"
                        >
                          <span>View Current Certificate</span>
                          <span className="material-symbols-outlined text-xs">open_in_new</span>
                        </a>
                      )}
                    </div>
                    <div className="sm:col-span-2 space-y-1.5">
                      <input
                        type="file"
                        id="edit-prof-doc-input"
                        accept=".pdf,.png,.jpg,.jpeg"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0]
                          if (file) {
                            setEditProfDocumentFile(file)
                            setEditProfDocumentName(file.name)
                          }
                        }}
                      />
                      <label
                        htmlFor="edit-prof-doc-input"
                        className="cursor-pointer inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 shadow-2xs"
                      >
                        <span className="material-symbols-outlined text-sm text-gray-500">verified</span>
                        <span>{editProfDocumentFile ? 'Change Selected File' : (editFormData.professional_document_url ? 'Replace Certificate' : 'Upload Certificate')}</span>
                      </label>
                      {editProfDocumentFile && (
                        <p className="text-xs text-emerald-700 font-semibold">New: {editProfDocumentName}</p>
                      )}
                    </div>
                  </div>
                )}

                {/* Aadhaar Card Document */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4 items-start py-2.5 border-b border-gray-100">
                  <div className="sm:col-span-1">
                    <label className="block text-gray-700 font-semibold text-xs">Aadhaar / ID Card</label>
                    {editFormData.aadhar_card_url && (
                      <a
                        href={editFormData.aadhar_card_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-[11px] text-amber-600 hover:underline mt-0.5"
                      >
                        <span>View Current Aadhaar</span>
                        <span className="material-symbols-outlined text-xs">open_in_new</span>
                      </a>
                    )}
                  </div>
                  <div className="sm:col-span-2 space-y-1.5">
                    <input
                      type="file"
                      id="edit-aadhar-doc-input"
                      accept=".pdf,.png,.jpg,.jpeg"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file) {
                          setEditAadharFile(file)
                          setEditAadharFileName(file.name)
                        }
                      }}
                    />
                    <label
                      htmlFor="edit-aadhar-doc-input"
                      className="cursor-pointer inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 shadow-2xs"
                    >
                      <span className="material-symbols-outlined text-sm text-gray-500">badge</span>
                      <span>{editAadharFile ? 'Change Selected File' : (editFormData.aadhar_card_url ? 'Replace Aadhaar' : 'Upload Aadhaar')}</span>
                    </label>
                    {editAadharFile && (
                      <p className="text-xs text-emerald-700 font-semibold">New: {editAadharFileName}</p>
                    )}
                  </div>
                </div>

                {/* CV / Resume */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4 items-start py-2.5 border-b border-gray-100">
                  <div className="sm:col-span-1">
                    <label className="block text-gray-700 font-semibold text-xs">CV / Resume</label>
                    {editFormData.cv_url && (
                      <a
                        href={editFormData.cv_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-[11px] text-purple-600 hover:underline mt-0.5"
                      >
                        <span>View Current CV</span>
                        <span className="material-symbols-outlined text-xs">open_in_new</span>
                      </a>
                    )}
                  </div>
                  <div className="sm:col-span-2 space-y-1.5">
                    <input
                      type="file"
                      id="edit-cv-doc-input"
                      accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file) {
                          setEditCvFile(file)
                          setEditCvFileName(file.name)
                        }
                      }}
                    />
                    <label
                      htmlFor="edit-cv-doc-input"
                      className="cursor-pointer inline-flex items-center gap-1.5 rounded-lg border border-purple-200 bg-purple-50/50 px-3 py-1.5 text-xs font-semibold text-purple-700 hover:bg-purple-100 shadow-2xs"
                    >
                      <span className="material-symbols-outlined text-sm text-purple-600">description</span>
                      <span>{editCvFile ? 'Change Selected File' : (editFormData.cv_url ? 'Replace CV' : 'Upload CV')}</span>
                    </label>
                    {editCvFile && (
                      <p className="text-xs text-purple-700 font-semibold">New: {editCvFileName}</p>
                    )}
                  </div>
                </div>

                {/* Offer Letter */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4 items-start py-2.5 border-b border-gray-100">
                  <div className="sm:col-span-1">
                    <label className="block text-gray-700 font-semibold text-xs">Offer / Appointment Letter</label>
                    {editFormData.offer_letter_url && (
                      <a
                        href={editFormData.offer_letter_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-[11px] text-teal-600 hover:underline mt-0.5"
                      >
                        <span>View Current Offer Letter</span>
                        <span className="material-symbols-outlined text-xs">open_in_new</span>
                      </a>
                    )}
                  </div>
                  <div className="sm:col-span-2 space-y-1.5">
                    <input
                      type="file"
                      id="edit-offer-doc-input"
                      accept=".pdf,.png,.jpg,.jpeg"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file) {
                          setOfferLetterFileEdit(file)
                          setOfferLetterFileNameEdit(file.name)
                        }
                      }}
                    />
                    <label
                      htmlFor="edit-offer-doc-input"
                      className="cursor-pointer inline-flex items-center gap-1.5 rounded-lg border border-teal-200 bg-teal-50/50 px-3 py-1.5 text-xs font-semibold text-teal-700 hover:bg-teal-100 shadow-2xs"
                    >
                      <span className="material-symbols-outlined text-sm text-teal-600">mark_email_read</span>
                      <span>{editOfferLetterFile ? 'Change Selected File' : (editFormData.offer_letter_url ? 'Replace Offer Letter' : 'Upload Offer Letter')}</span>
                    </label>
                    {editOfferLetterFile && (
                      <p className="text-xs text-teal-700 font-semibold">New: {editOfferLetterFileName}</p>
                    )}
                  </div>
                </div>

                {/* Profile Photo */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4 items-center py-2.5">
                  <div className="sm:col-span-1">
                    <label className="block text-gray-700 font-semibold text-xs">Profile Photo</label>
                  </div>
                  <div className="sm:col-span-2 flex items-center gap-3">
                    {editPhotoPreview ? (
                      <img src={editPhotoPreview} alt="Preview" className="h-10 w-10 rounded-full object-cover border border-gray-200" />
                    ) : (
                      <div className="h-10 w-10 rounded-full bg-gray-100 text-gray-400 flex items-center justify-center">
                        <span className="material-symbols-outlined text-xl">person</span>
                      </div>
                    )}
                    <input
                      type="file"
                      id="edit-photo-input"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file) {
                          setEditPhotoFile(file)
                          setEditPhotoPreview(URL.createObjectURL(file))
                        }
                      }}
                    />
                    <label
                      htmlFor="edit-photo-input"
                      className="cursor-pointer px-3 py-1.5 text-xs font-semibold text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50"
                    >
                      {editFormData.photo_url ? 'Change Photo' : 'Upload Photo'}
                    </label>
                  </div>
                </div>
              </div>

              {/* Modal Actions Footer */}
              <div className="flex items-center justify-between pt-4 border-t border-gray-100 sticky bottom-0 bg-white">
                <span className="text-[11px] text-gray-400">
                  {editUploadProgress || 'All changes will be updated immediately.'}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={editSubmitting}
                    onClick={() => setIsEditModalOpen(false)}
                    className="rounded-xl border border-gray-200 px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={editSubmitting}
                    className="rounded-xl bg-[#0f1e36] px-5 py-2 text-xs font-semibold text-white hover:bg-[#193259] transition-colors shadow-xs flex items-center gap-2 disabled:opacity-50"
                  >
                    {editSubmitting ? (
                      <>
                        <span className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                        <span>{editUploadProgress || 'Saving...'}</span>
                      </>
                    ) : (
                      <>
                        <span className="material-symbols-outlined text-sm">check_circle</span>
                        <span>Save Updates</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 11. FACULTY & STAFF ID CARD GENERATOR STUDIO */}
      {isStaffBatchIdModalOpen && (
        <StaffBatchIdCardGenerator
          isOpen={true}
          onClose={() => setIsStaffBatchIdModalOpen(false)}
          teachers={teachers}
        />
      )}

    </div>
  )
}

export default TeacherManagement
