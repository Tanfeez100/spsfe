import React, { useState, useEffect } from 'react'
import { getAllSubjects, getSubjectsForClass } from '../../Api/subjects'
import { getAllClasses } from '../../Api/classes'
import { submitMarks } from '../../Api/marks'
import { getAllStudents } from '../../Api/students'

function SubmitMarks() {
  const [formData, setFormData] = useState({
    class: '',
    section: '',
    terminal: '',
    roll_no: '',
    marks: []
  })
  const [subjectsData, setSubjectsData] = useState(null)
  const [availableSubjects, setAvailableSubjects] = useState([])
  const [availableClasses, setAvailableClasses] = useState([])
  const [availableSections, setAvailableSections] = useState([])
  const [loading, setLoading] = useState(false)
  const [loadingSubjects, setLoadingSubjects] = useState(false)
  const [loadingSections, setLoadingSections] = useState(false)
  const [loadingStudentPreview, setLoadingStudentPreview] = useState(false)
  const [studentPreview, setStudentPreview] = useState(null)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [markFieldErrors, setMarkFieldErrors] = useState({})

  const terminals = ['First', 'Second', 'Third', 'Annual']

  const getNonEmptyString = (...values) => {
    for (const value of values) {
      if (typeof value === 'string' && value.trim()) {
        return value.trim()
      }
    }
    return ''
  }

  const getSubjectId = (subject) => {
    return (
      subject?.subject_id ||
      subject?.subjectId ||
      subject?.id ||
      subject?._id ||
      subject?.subject?.id ||
      subject?.subject?._id ||
      ''
    )
  }

  const buildSubjectLookup = () => {
    const allSubjects = subjectsData?.all_subjects || subjectsData?.subjects || []
    if (!Array.isArray(allSubjects) || allSubjects.length === 0) return {}

    return allSubjects.reduce((acc, subject) => {
      const id =
        subject?.id ||
        subject?._id ||
        subject?.subject_id ||
        subject?.subjectId
      if (id) {
        acc[String(id)] = subject
      }
      return acc
    }, {})
  }

  const normalizeSubject = (subject, index = 0, subjectLookup = {}) => {
    if (typeof subject === 'string') {
      return {
        raw_subject: subject,
        subject_id: '',
        subject_name: getNonEmptyString(subject) || `Subject ${index + 1}`,
        subject_code: '',
        subject_label: `Subject ${index + 1}`,
      }
    }

    const subjectId = getSubjectId(subject)
    const linkedSubject = subjectId ? subjectLookup[String(subjectId)] : null

    const subjectName =
      getNonEmptyString(
        subject?.subject_name,
        subject?.name,
        subject?.subjectName,
        subject?.title,
        subject?.subject?.subject_name,
        subject?.subject?.name,
        linkedSubject?.subject_name,
        linkedSubject?.name
      ) || `Subject ${index + 1}`

    const subjectCode = getNonEmptyString(
      subject?.subject_code,
      subject?.code,
      subject?.subjectCode,
      subject?.subject?.subject_code,
      subject?.subject?.code,
      linkedSubject?.subject_code,
      linkedSubject?.code
    )

    return {
      ...(subject || {}),
      subject_id: subjectId || '',
      subject_name: subjectName,
      subject_code: subjectCode,
      subject_label: `Subject ${index + 1}`,
    }
  }

  const isDrawingSubject = (subjectName = '') => {
    const normalizedName = String(subjectName).trim().toLowerCase()
    return normalizedName.includes('drawing')
  }

  const getSubjectRules = (subjectName = '') => {
    const drawing = isDrawingSubject(subjectName)
    return {
      isDrawing: drawing,
      externalMax: drawing ? 50 : 80,
      internalMax: 20,
      internalAllowed: !drawing,
    }
  }

  const getSubjectNameByIndex = (index) => {
    const mark = formData.marks[index]
    const subject = availableSubjects[index]
    return (
      getNonEmptyString(
        mark?.subject_name,
        subject?.subject_name,
        subject?.name
      ) || `Subject ${index + 1}`
    )
  }

  useEffect(() => {
    fetchSubjects()
  }, [])

  useEffect(() => {
    if (formData.class) {
      loadSectionsForClass()
    } else {
      setAvailableSections([])
      setAvailableSubjects([])
      setMarkFieldErrors({})
      setFormData(prev => ({ ...prev, section: '', marks: [] }))
    }
  }, [formData.class, subjectsData])

  useEffect(() => {
    if (formData.class && formData.section) {
      loadSubjectsForClassSection()
    } else {
      setAvailableSubjects([])
      setMarkFieldErrors({})
      setFormData(prev => ({ ...prev, marks: [] }))
    }
  }, [formData.class, formData.section, subjectsData])

  useEffect(() => {
    if (formData.class && formData.section && formData.roll_no) {
      loadStudentPreview()
    } else {
      setStudentPreview(null)
    }
  }, [formData.class, formData.section, formData.roll_no])

  const fetchSubjects = async () => {
    setLoadingSubjects(true)
    setError('')
    try {
      const [subjectsResponse, classesResponse] = await Promise.all([
        getAllSubjects(),
        getAllClasses()
      ])
      
      if (subjectsResponse.success) {
        setSubjectsData(subjectsResponse)
      }
      
      if (classesResponse && classesResponse.length > 0) {
        // Sort by class property (numeric sort)
        const sorted = classesResponse.sort((a, b) => {
          const classA = typeof a === 'string' ? a : a.class;
          const classB = typeof b === 'string' ? b : b.class;
          return parseInt(classA) - parseInt(classB);
        });
        setAvailableClasses(sorted)
      }
    } catch (err) {
      setError(err?.message || 'Failed to fetch subjects and classes')
    } finally {
      setLoadingSubjects(false)
    }
  }

  const loadSectionsForClass = async () => {
    if (!formData.class) return

    setLoadingSections(true)
    try {
      const sections = []

      if (subjectsData?.classes) {
        const selectedClassData = subjectsData.classes.find(cls => cls.class === formData.class)
        if (selectedClassData?.sections && selectedClassData.sections.length > 0) {
          selectedClassData.sections.forEach(sec => {
            if (sec?.section) sections.push(sec.section)
          })
        }
      }

      // Fallback: section list from students so marks flow can remain class+section based.
      if (sections.length === 0) {
        const studentsResponse = await getAllStudents({ class: formData.class })
        const studentsList = studentsResponse?.students || studentsResponse?.data || []
        studentsList.forEach(student => {
          const section = student.Section || student.section
          if (section) sections.push(section)
        })
      }

      const uniqueSections = [...new Set(sections)].sort()
      setAvailableSections(uniqueSections)

      if (formData.section && !uniqueSections.includes(formData.section)) {
        setFormData(prev => ({ ...prev, section: '', marks: [] }))
      }
    } catch {
      setAvailableSections([])
    } finally {
      setLoadingSections(false)
    }
  }

  const extractSubjects = (response, selectedSection) => {
    if (Array.isArray(response?.subjects)) return response.subjects
    if (Array.isArray(response?.data?.subjects)) return response.data.subjects
    if (Array.isArray(response?.class?.subjects)) return response.class.subjects
    if (Array.isArray(response?.section?.subjects)) return response.section.subjects
    if (Array.isArray(response?.sections) && selectedSection) {
      const sectionRow = response.sections.find(sec => sec?.section === selectedSection)
      if (Array.isArray(sectionRow?.subjects)) return sectionRow.subjects
    }
    return []
  }

  const loadSubjectsForClassSection = async () => {
    if (!formData.class || !formData.section) return

    let subjects = []

    // 1) Try section-specific fetch
    try {
      const sectionResponse = await getSubjectsForClass(formData.class, formData.section)
      subjects = extractSubjects(sectionResponse, formData.section)
    } catch {
      subjects = []
    }

    // 2) Fallback to class-level subjects if section-specific is empty
    if (!subjects || subjects.length === 0) {
      try {
        const classOnlyResponse = await getSubjectsForClass(formData.class)
        subjects = extractSubjects(classOnlyResponse, formData.section)
      } catch {
        subjects = []
      }
    }

    // 3) Final fallback using cached subjectsData already loaded on page
    if ((!subjects || subjects.length === 0) && subjectsData?.classes) {
      const selectedClassData = subjectsData.classes.find(cls => cls.class === formData.class)
      if (selectedClassData) {
        if (selectedClassData.sections?.length > 0) {
          const selectedSectionData = selectedClassData.sections.find(sec => sec.section === formData.section)
          if (selectedSectionData?.subjects?.length > 0) {
            subjects = selectedSectionData.subjects
          }
        }

        if ((!subjects || subjects.length === 0) && selectedClassData.subjects?.length > 0) {
          subjects = selectedClassData.subjects
        }
      }
    }

    const subjectLookup = buildSubjectLookup()
    const normalizedSubjects = (subjects || []).map((subject, index) =>
      normalizeSubject(subject, index, subjectLookup)
    )
    setAvailableSubjects(normalizedSubjects)
    setMarkFieldErrors({})
    setFormData(prev => ({
      ...prev,
      marks: normalizedSubjects.map((subject, index) => ({
        subject_name: subject.subject_name || '',
        subject_id: subject.subject_id || '',
        subject_label: `Subject ${index + 1}`,
        external_marks: '',
        internal_marks: ''
      }))
    }))
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    setError('')
    if (success) {
      setSuccess(false)
    }
  }

  const handleMarksChange = (index, field, value, subjectName) => {
    const fieldKey = `${index}_${field}`
    const rules = getSubjectRules(subjectName)

    if (field === 'internal_marks' && !rules.internalAllowed) {
      setMarkFieldErrors(prev => ({
        ...prev,
        [fieldKey]: `${subjectName}: internal marks allowed nahi hain.`
      }))
      return
    }

    if (value === '') {
      setMarkFieldErrors(prev => {
        const nextErrors = { ...prev }
        delete nextErrors[fieldKey]
        return nextErrors
      })

      const newMarks = [...formData.marks]
      newMarks[index] = {
        ...newMarks[index],
        [field]: ''
      }
      setFormData(prev => ({
        ...prev,
        marks: newMarks
      }))
      return
    }

    const parsedValue = Number(value)
    if (Number.isNaN(parsedValue)) return

    const maxAllowed = field === 'external_marks' ? rules.externalMax : rules.internalMax
    if (parsedValue < 0) {
      setMarkFieldErrors(prev => ({
        ...prev,
        [fieldKey]: `${subjectName}: minimum marks 0 hona chahiye.`
      }))
      return
    }

    if (parsedValue > maxAllowed) {
      setMarkFieldErrors(prev => ({
        ...prev,
        [fieldKey]: `${subjectName}: ${field === 'external_marks' ? 'external' : 'internal'} marks ${maxAllowed} se zyada allowed nahi hain.`
      }))
      return
    }

    setMarkFieldErrors(prev => {
      const nextErrors = { ...prev }
      delete nextErrors[fieldKey]
      return nextErrors
    })

    const newMarks = [...formData.marks]
    newMarks[index] = {
      ...newMarks[index],
      [field]: parsedValue
    }
    setFormData(prev => ({
      ...prev,
      marks: newMarks
    }))
  }

  const validateMarksBeforeSubmit = () => {
    const nextFieldErrors = {}

    formData.marks.forEach((mark, index) => {
      const subjectName = getSubjectNameByIndex(index)
      const rules = getSubjectRules(subjectName)

      const externalValue = mark.external_marks === '' ? '' : Number(mark.external_marks)
      const internalValue = mark.internal_marks === '' ? '' : Number(mark.internal_marks)

      if (externalValue !== '') {
        if (Number.isNaN(externalValue) || externalValue < 0 || externalValue > rules.externalMax) {
          nextFieldErrors[`${index}_external_marks`] = `${subjectName}: external marks 0 se ${rules.externalMax} ke beech hone chahiye.`
        }
      }

      if (rules.internalAllowed) {
        if (internalValue !== '') {
          if (Number.isNaN(internalValue) || internalValue < 0 || internalValue > rules.internalMax) {
            nextFieldErrors[`${index}_internal_marks`] = `${subjectName}: internal marks 0 se ${rules.internalMax} ke beech hone chahiye.`
          }
        }
      } else if (internalValue !== '' && !Number.isNaN(internalValue) && internalValue > 0) {
        nextFieldErrors[`${index}_internal_marks`] = `${subjectName}: Drawing subject me internal marks allowed nahi hain.`
      }
    })

    setMarkFieldErrors(nextFieldErrors)

    if (Object.keys(nextFieldErrors).length > 0) {
      setError(Object.values(nextFieldErrors)[0])
      return false
    }
    return true
  }

  const getStudentPreviewId = (student) => {
    return student?.ID || student?._id || student?.id || student?.Id || student?.student_id || student?.StudentId || '--'
  }

  const loadStudentPreview = async () => {
    const parsedRollNo = parseInt(formData.roll_no)
    if (!formData.class || !formData.section || !parsedRollNo || parsedRollNo < 1) {
      setStudentPreview(null)
      return
    }

    setLoadingStudentPreview(true)
    try {
      const response = await getAllStudents({
        class: formData.class,
        section: formData.section,
        roll_no: parsedRollNo,
        status: 'active',
      })
      const studentsList = response?.students || response?.data || []
      const matchedStudent = (Array.isArray(studentsList) ? studentsList : []).find((student) => {
        const studentRoll = parseInt(student?.Roll || student?.roll_no)
        const studentSection = (student?.Section || student?.section || '').toString().toLowerCase()
        return studentRoll === parsedRollNo && studentSection === formData.section.toLowerCase()
      })

      setStudentPreview(matchedStudent || null)
    } catch {
      setStudentPreview(null)
    } finally {
      setLoadingStudentPreview(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      // Validation
      if (!formData.class || !formData.section || !formData.terminal || !formData.roll_no) {
        setError('Please fill all required fields')
        setLoading(false)
        return
      }

      const parsedRollNo = parseInt(formData.roll_no)
      if (!parsedRollNo || parsedRollNo < 1) {
        setError('Please enter a valid roll number')
        setLoading(false)
        return
      }

      if (!formData.marks || formData.marks.length === 0) {
        setError('No subjects found for the selected class and section')
        setLoading(false)
        return
      }

      if (!validateMarksBeforeSubmit()) {
        setLoading(false)
        return
      }

      // Prepare marks data - submit with subject_name only
      const marksData = formData.marks.map((mark, index) => {
        const subjectName = getSubjectNameByIndex(index)
        const rules = getSubjectRules(subjectName)
        const markObj = {}
        if (mark.subject_name) {
          markObj.subject_name = mark.subject_name
        }
        markObj.external_marks = Number(mark.external_marks) || 0
        if (rules.internalAllowed) {
          markObj.internal_marks = Number(mark.internal_marks) || 0
        }
        return markObj
      }).filter(mark => mark.external_marks > 0 || mark.internal_marks > 0) // Only include marks that have values

      if (marksData.length === 0) {
        setError('Please enter at least one mark')
        setLoading(false)
        return
      }

      const submitData = {
        class: formData.class,
        section: formData.section,
        terminal: formData.terminal,
        roll_no: parsedRollNo,
        marks: marksData
      }

      const response = await submitMarks(submitData)

      if (response.success) {
        setSuccess(true)
        setError('')
        // Reset form
        setFormData({
          class: '',
          section: '',
          terminal: '',
          roll_no: '',
          marks: []
        })
        setMarkFieldErrors({})
        setAvailableSubjects([])
        setTimeout(() => {
          setSuccess(false)
        }, 3000)
      }
    } catch (err) {
      let errorMessage = 'Failed to submit marks'
      if (err?.status === 409) {
        errorMessage =
          err?.message ||
          `Marks already exist for Class ${formData.class}, Section ${formData.section}, Roll ${formData.roll_no}, Terminal ${formData.terminal}.`
      } else if (Array.isArray(err?.data?.errors) && err.data.errors.length > 0) {
        errorMessage = err.data.errors[0]
      } else if (err?.message) {
        errorMessage = err.message
      } else if (err?.error) {
        errorMessage = err.error
      }
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4" style={{ fontFamily: "'Lexend', sans-serif" }}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-black text-[#0d141b] dark:text-white">Submit Marks</h2>
      </div>

      {/* Success Message */}
      {success && (
        <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg flex items-center gap-2">
          <span className="material-symbols-outlined text-green-600 dark:text-green-400">check_circle</span>
          <p className="text-sm text-green-600 dark:text-green-400 font-medium">
            Marks submitted successfully!
          </p>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-700 space-y-6">
        {/* Basic Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Class */}
          <div className="min-w-0">
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-2">
              Class <span className="text-red-500">*</span>
            </label>
            <div className="relative flex min-w-0 overflow-hidden items-center border border-cyan-200/30 dark:border-cyan-700/50 rounded-lg bg-cyan-50/30 dark:bg-cyan-900/10 focus-within:border-cyan-400 focus-within:ring-2 focus-within:ring-cyan-400/50 transition-all">
              <span className="material-symbols-outlined pl-3 text-slate-500 dark:text-slate-400 text-base">class</span>
              {loadingSubjects ? (
                <div className="min-w-0 w-full py-2.5 px-2 text-sm text-slate-500 dark:text-slate-400">
                  Loading...
                </div>
              ) : (
                <select
                  name="class"
                  value={formData.class}
                  onChange={handleChange}
                  className="min-w-0 w-full appearance-none bg-transparent border-none focus:ring-0 py-2.5 pl-2 pr-9 text-sm text-slate-900 dark:text-white"
                  required
                >
                  <option value="">Select Class</option>
                  {availableClasses.map((cls) => (
                    <option key={cls.class || cls} value={cls.class || cls}>
                      Class {cls.class || cls}
                    </option>
                  ))}
                </select>
              )}
              {!loadingSubjects ? (
                <span className="pointer-events-none absolute right-2 text-slate-700 dark:text-slate-300 material-symbols-outlined text-base">
                  expand_more
                </span>
              ) : null}
            </div>
          </div>

          {/* Section */}
          <div className="min-w-0">
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-2">
              Section <span className="text-red-500">*</span>
            </label>
            <div className="relative flex min-w-0 overflow-hidden items-center border border-cyan-200/30 dark:border-cyan-700/50 rounded-lg bg-cyan-50/30 dark:bg-cyan-900/10 focus-within:border-cyan-400 focus-within:ring-2 focus-within:ring-cyan-400/50 transition-all">
              <span className="material-symbols-outlined pl-3 text-slate-500 dark:text-slate-400 text-base">category</span>
              <select
                name="section"
                value={formData.section}
                onChange={handleChange}
                className="min-w-0 w-full appearance-none bg-transparent border-none focus:ring-0 py-2.5 pl-2 pr-9 text-sm text-slate-900 dark:text-white"
                required
                disabled={!formData.class || loadingSections}
              >
                <option value="">
                  {loadingSections ? 'Loading sections...' : 'Select Section'}
                </option>
                {availableSections.map((section) => (
                  <option key={section} value={section}>
                    Section {section}
                  </option>
                ))}
              </select>
              <span className="pointer-events-none absolute right-2 text-slate-700 dark:text-slate-300 material-symbols-outlined text-base">
                expand_more
              </span>
            </div>
            {formData.class && !loadingSections && availableSections.length === 0 && (
              <p className="mt-1 text-xs text-amber-600 dark:text-amber-400">
                No section found for this class. Please ensure students exist with section values.
              </p>
            )}
          </div>

          {/* Terminal */}
          <div className="min-w-0">
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-2">
              Terminal <span className="text-red-500">*</span>
            </label>
            <div className="relative flex min-w-0 overflow-hidden items-center border border-cyan-200/30 dark:border-cyan-700/50 rounded-lg bg-cyan-50/30 dark:bg-cyan-900/10 focus-within:border-cyan-400 focus-within:ring-2 focus-within:ring-cyan-400/50 transition-all">
              <span className="material-symbols-outlined pl-3 text-slate-500 dark:text-slate-400 text-base">calendar_today</span>
              <select
                name="terminal"
                value={formData.terminal}
                onChange={handleChange}
                className="min-w-0 w-full appearance-none bg-transparent border-none focus:ring-0 py-2.5 pl-2 pr-9 text-sm text-slate-900 dark:text-white"
                required
              >
                <option value="">Select Terminal</option>
                {terminals.map((terminal) => (
                  <option key={terminal} value={terminal}>
                    {terminal}
                  </option>
                ))}
              </select>
              <span className="pointer-events-none absolute right-2 text-slate-700 dark:text-slate-300 material-symbols-outlined text-base">
                expand_more
              </span>
            </div>
          </div>

          {/* Roll Number */}
          <div className="min-w-0">
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-2">
              Roll Number <span className="text-red-500">*</span>
            </label>
            <div className="flex min-w-0 overflow-hidden items-center border border-cyan-200/30 dark:border-cyan-700/50 rounded-lg bg-cyan-50/30 dark:bg-cyan-900/10 focus-within:border-cyan-400 focus-within:ring-2 focus-within:ring-cyan-400/50 transition-all">
              <span className="material-symbols-outlined pl-3 text-slate-500 dark:text-slate-400 text-base">badge</span>
              <input
                type="number"
                name="roll_no"
                value={formData.roll_no}
                onChange={handleChange}
                className="min-w-0 w-full bg-transparent border-none focus:ring-0 py-2.5 px-2 text-sm text-slate-900 dark:text-white placeholder:text-slate-400"
                placeholder="Enter roll number"
                min="1"
                required
              />
            </div>
          </div>
        </div>

        {/* Subjects and Marks */}
        {formData.class && formData.section && formData.roll_no && (
          <div className="bg-cyan-50/30 dark:bg-cyan-900/10 rounded-lg p-4 border border-cyan-200/30 dark:border-cyan-700/50">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Student Verification</h3>
              {studentPreview && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300">
                  Verified
                </span>
              )}
            </div>

            {loadingStudentPreview ? (
              <div className="space-y-2">
                <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded animate-pulse"></div>
                <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded animate-pulse"></div>
              </div>
            ) : studentPreview ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs sm:text-sm">
                <div>
                  <p className="text-slate-500 dark:text-slate-400">Name</p>
                  <p className="font-semibold text-slate-900 dark:text-white">{studentPreview.Name || studentPreview.name || '--'}</p>
                </div>
                <div>
                  <p className="text-slate-500 dark:text-slate-400">Father</p>
                  <p className="font-semibold text-slate-900 dark:text-white">{studentPreview.Father || studentPreview.father_name || '--'}</p>
                </div>
                <div>
                  <p className="text-slate-500 dark:text-slate-400">UUID</p>
                  <p className="font-semibold text-slate-900 dark:text-white break-all">{getStudentPreviewId(studentPreview)}</p>
                </div>
                <div>
                  <p className="text-slate-500 dark:text-slate-400">Class-Section</p>
                  <p className="font-semibold text-slate-900 dark:text-white">
                    {studentPreview.Class || studentPreview.class || '--'} - {studentPreview.Section || studentPreview.section || '--'}
                  </p>
                </div>
                <div>
                  <p className="text-slate-500 dark:text-slate-400">Roll No</p>
                  <p className="font-semibold text-slate-900 dark:text-white">{studentPreview.Roll || studentPreview.roll_no || '--'}</p>
                </div>
                <div>
                  <p className="text-slate-500 dark:text-slate-400">Mobile</p>
                  <p className="font-semibold text-slate-900 dark:text-white">{studentPreview.Mobile || studentPreview.mobile || '--'}</p>
                </div>
              </div>
            ) : (
              <p className="text-xs sm:text-sm text-amber-700 dark:text-amber-300">
                No active student found for selected Class, Section and Roll Number.
              </p>
            )}
          </div>
        )}

        {/* Subjects and Marks */}
        {formData.class && formData.section && availableSubjects.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-700">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                Enter Marks for Subjects
              </h3>
              <span className="text-sm text-slate-500 dark:text-slate-400">
                {availableSubjects.length} Subject{availableSubjects.length !== 1 ? 's' : ''}
              </span>
            </div>

            <div className="rounded-xl border border-cyan-200/30 dark:border-cyan-700/50 bg-transparent px-4 py-3">
              <p className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-cyan-200">
                Rules: External max 80, Internal max 20, Drawing subject me sirf External allowed (max 50). Negative marks allowed nahi hain.
              </p>
            </div>

            <div className="space-y-3">
              {formData.marks.map((mark, index) => {
                const subject = availableSubjects[index]
                const subjectName =
                  getNonEmptyString(
                    mark.subject_name,
                    subject?.subject_name,
                    subject?.name
                  ) || `Subject ${index + 1}`
                const rules = getSubjectRules(subjectName)
                const externalError = markFieldErrors[`${index}_external_marks`]
                const internalError = markFieldErrors[`${index}_internal_marks`]
                return (
                  <div
                    key={index}
                    className="bg-gradient-to-br from-white to-slate-50 dark:from-slate-700 dark:to-slate-800 rounded-xl p-4 sm:p-5 border border-slate-200 dark:border-slate-600 shadow-sm hover:shadow-md transition-all"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
                      <div className="flex items-center gap-2 min-w-0">
                        <p className="shrink-0 text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                          {mark.subject_label || `Subject ${index + 1}`}
                        </p>
                        <span className="text-slate-300 dark:text-slate-600">|</span>
                        <h4 className="truncate text-base font-bold text-slate-900 dark:text-white">
                          {subjectName}
                        </h4>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="inline-flex items-center rounded-full bg-cyan-300/15 text-cyan-200 border border-cyan-400/30 px-2 py-0.5 text-[11px] font-bold">
                          Ext Max {rules.externalMax}
                        </span>
                        {rules.internalAllowed ? (
                          <span className="inline-flex items-center rounded-full bg-emerald-100 text-black dark:bg-emerald-900/30 dark:text-black px-2 py-0.5 text-[11px] font-bold">
                            Int Max {rules.internalMax}
                          </span>
                        ) : (
                          <span className="inline-flex items-center rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300 px-2 py-0.5 text-[11px] font-bold">
                            Drawing Rule
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {/* External Marks */}
                      <div>
                        <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                          External Marks
                        </label>
                          <div className="flex items-center border border-cyan-200/30 dark:border-cyan-700/50 rounded-lg bg-cyan-50/30 dark:bg-cyan-900/10 focus-within:border-cyan-400 focus-within:ring-2 focus-within:ring-cyan-400/50 transition-all">
                            <span className="material-symbols-outlined pl-3 text-slate-500 dark:text-slate-400 text-base">assessment</span>
                            <input
                            type="text"
                            inputMode="decimal"
                            autoComplete="off"
                            value={mark.external_marks || ''}
                            onChange={(e) => handleMarksChange(index, 'external_marks', e.target.value, subjectName)}
                            className="w-full bg-transparent border-none focus:ring-0 py-2 px-2 text-sm text-slate-900 dark:text-white placeholder:text-slate-400"
                            placeholder={`0 to ${rules.externalMax}`}
                          />
                        </div>
                        {externalError && (
                          <p className="mt-1 text-xs font-medium text-red-600 dark:text-red-400">
                            {externalError}
                          </p>
                        )}
                      </div>

                      {/* Internal Marks */}
                      {rules.internalAllowed ? (
                        <div>
                          <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                            Internal Marks
                          </label>
                          <div className="flex items-center border border-cyan-200/30 dark:border-cyan-700/50 rounded-lg bg-cyan-50/30 dark:bg-cyan-900/10 focus-within:border-cyan-400 focus-within:ring-2 focus-within:ring-cyan-400/50 transition-all">
                            <span className="material-symbols-outlined pl-3 text-slate-500 dark:text-slate-400 text-base">grade</span>
                            <input
                              type="text"
                              inputMode="decimal"
                              autoComplete="off"
                              value={mark.internal_marks || ''}
                              onChange={(e) => handleMarksChange(index, 'internal_marks', e.target.value, subjectName)}
                              className="w-full bg-transparent border-none focus:ring-0 py-2 px-2 text-sm text-slate-900 dark:text-white placeholder:text-slate-400"
                              placeholder={`0 to ${rules.internalMax}`}
                            />
                          </div>
                          {internalError && (
                            <p className="mt-1 text-xs font-medium text-red-600 dark:text-red-400">
                              {internalError}
                            </p>
                          )}
                        </div>
                      ) : (
                        <div className="rounded-lg border border-dashed border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-900/20 px-3 py-2.5 flex items-center gap-2">
                          <span className="material-symbols-outlined text-amber-600 dark:text-amber-300 text-base">info</span>
                          <p className="text-xs sm:text-sm font-medium text-amber-700 dark:text-amber-300">
                            Drawing subject me internal marks nahi hote. Sirf external (max 50) enter karein.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* No Subjects Message */}
        {formData.class && formData.section && availableSubjects.length === 0 && !loadingSubjects && (
          <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-6 text-center border-2 border-dashed border-slate-300 dark:border-slate-600">
            <span className="material-symbols-outlined text-4xl text-slate-400 mb-2">book</span>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
              No subjects found for Class {formData.class}, Section {formData.section}
            </p>
          </div>
        )}

        {/* Submit Button */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
          <button
            type="submit"
            disabled={
              loading ||
              loadingStudentPreview ||
              !formData.class ||
              !formData.section ||
              !formData.terminal ||
              !formData.roll_no ||
              availableSubjects.length === 0 ||
              Object.keys(markFieldErrors).length > 0
            }
            className="px-6 py-2.5 text-sm font-bold text-white bg-cyan-500 hover:bg-cyan-500/90 rounded-lg shadow-lg shadow-cyan-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {loading ? (
              <>
                <span className="material-symbols-outlined animate-spin text-base">sync</span>
                <span>Submitting...</span>
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-base">check</span>
                <span>Submit Marks</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}

export default SubmitMarks
