import React, { useState, useEffect, useMemo, useRef } from 'react'
import SEO from '../../Components/SEO/SEO'
import { useDocumentTemplates } from '../../context/DocumentTemplateContext'
import {
  DOCUMENT_CATEGORIES,
  DOCUMENT_TEMPLATES,
  SAMPLE_STUDENT_DATA,
  SAMPLE_EXAM_TIMETABLE,
  SAMPLE_MARKS_DATA,
  SAMPLE_TC_DATA,
} from '../../constants/documentTemplateRegistry'
import UniversalIdCard from '../../Components/DocumentTemplates/IdCards/UniversalIdCard'
import UniversalAdmitCard from '../../Components/DocumentTemplates/AdmitCards/UniversalAdmitCard'
import UniversalTransferCertificate from '../../Components/DocumentTemplates/TransferCertificates/UniversalTransferCertificate'
import UniversalMarksheet from '../../Components/DocumentTemplates/Marksheets/UniversalMarksheet'
import { getAllStudents } from '../../Api/students'
import { normalizeSchoolClass, sortSchoolClasses } from '../../constants/schoolOptions'
import { exportDocumentToPdf } from '../../utils/documentPdfExporter'

export default function DocumentManagement() {
  const {
    getActiveTemplateId,
    getCustomization,
    selectTemplate,
    customize,
    resetDefaults,
    isSaving,
    lastSaved,
  } = useDocumentTemplates()

  // Active Category tab: 'id_card' | 'admit_card' | 'transfer_certificate' | 'marksheet'
  const [activeCategory, setActiveCategory] = useState('id_card')

  // Real students loaded from Supabase database
  const [realStudents, setRealStudents] = useState([])
  const [loadingStudents, setLoadingStudents] = useState(false)
  const [selectedClass, setSelectedClass] = useState('all')
  const [selectedSection, setSelectedSection] = useState('all')
  const [selectedStudentId, setSelectedStudentId] = useState(null)
  const [studentSearchTerm, setStudentSearchTerm] = useState('')

  // Preview Modal state
  const [previewModalOpen, setPreviewModalOpen] = useState(false)
  const [previewTemplate, setPreviewTemplate] = useState(null)
  const [previewUseRealData, setPreviewUseRealData] = useState(true)
  const [studioZoom, setStudioZoom] = useState(100)
  const [modalZoom, setModalZoom] = useState(100)

  // Customization Modal state
  const [customizerOpen, setCustomizerOpen] = useState(false)
  const [customizerCategory, setCustomizerCategory] = useState('id_card')
  const [customForm, setCustomForm] = useState({})

  // Confirmation Modal
  const [confirmModalOpen, setConfirmModalOpen] = useState(false)
  const [pendingSelection, setPendingSelection] = useState(null)

  // Export / Print state
  const [isExporting, setIsExporting] = useState(false)
  const printableRef = useRef(null)

  // Toast emitter helper
  const emitToast = (type, message, title = '') => {
    window.dispatchEvent(
      new CustomEvent('app:toast', {
        detail: { type, title, message },
      })
    )
  }

  // Load real students on mount
  useEffect(() => {
    async function loadData() {
      setLoadingStudents(true)
      try {
        const data = await getAllStudents()
        const studentsList = Array.isArray(data) ? data : data?.students || []
        setRealStudents(studentsList)
        if (studentsList.length > 0 && !selectedStudentId) {
          setSelectedStudentId(studentsList[0].id)
        }
      } catch (err) {
        console.warn('Could not fetch students for Document Management:', err?.message)
      } finally {
        setLoadingStudents(false)
      }
    }
    loadData()
  }, [])

  // Class list options
  const classList = useMemo(() => {
    const set = new Set()
    realStudents.forEach((s) => {
      const c = (s.Class || s.class || '').toString().trim()
      if (c) set.add(c)
    })
    return sortSchoolClasses(Array.from(set))
  }, [realStudents])

  // Filtered students
  const filteredStudents = useMemo(() => {
    return realStudents.filter((s) => {
      const sClass = (s.Class || s.class || '').toString().trim()
      const normSClass = normalizeSchoolClass(sClass) || sClass
      const normSelected = normalizeSchoolClass(selectedClass) || selectedClass
      const matchClass = selectedClass === 'all' || normSClass.toLowerCase() === normSelected.toLowerCase()

      const sSec = (s.Section || s.section || 'A').toString().trim().toUpperCase()
      const matchSec = selectedSection === 'all' || sSec === selectedSection.toUpperCase()

      const sName = (s.Name || s.name || '').toLowerCase()
      const sRoll = (s.Roll || s.roll_no || '').toString()
      const matchSearch = !studentSearchTerm || sName.includes(studentSearchTerm.toLowerCase()) || sRoll.includes(studentSearchTerm)

      return matchClass && matchSec && matchSearch
    })
  }, [realStudents, selectedClass, selectedSection, studentSearchTerm])

  // Current selected student (Strictly Real Data from DB)
  const currentStudent = useMemo(() => {
    if (filteredStudents.length > 0) {
      return filteredStudents.find((s) => s.id === selectedStudentId) || filteredStudents[0]
    }
    if (realStudents.length > 0) {
      return realStudents[0]
    }
    return {}
  }, [filteredStudents, selectedStudentId, realStudents])

  // Current active template ID for category
  const activeTemplateId = getActiveTemplateId(activeCategory)
  const currentCustomization = getCustomization(activeCategory)

  // Open Preview Modal
  const handleOpenPreview = (template) => {
    setPreviewTemplate(template)
    setPreviewModalOpen(true)
  }

  // Open Customize Drawer
  const handleOpenCustomize = (category) => {
    setCustomizerCategory(category)
    setCustomForm({ ...getCustomization(category) })
    setCustomizerOpen(true)
  }

  // Save Customization
  const handleSaveCustomization = async () => {
    const res = await customize(customizerCategory, customForm)
    if (res?.success) {
      emitToast('success', `Branding and settings updated for ${customizerCategory.replace('_', ' ').toUpperCase()}`, 'Settings Saved')
      setCustomizerOpen(false)
    }
  }

  // Reset Customization
  const handleResetCustomization = async () => {
    if (window.confirm('Reset this document category back to factory defaults?')) {
      await resetDefaults(customizerCategory)
      setCustomForm({ ...getCustomization(customizerCategory) })
      emitToast('info', 'Reset to factory defaults', 'Default Restored')
    }
  }

  // Confirm selection
  const handleRequestSelect = (category, template) => {
    if (getActiveTemplateId(category) === template.id) {
      emitToast('info', 'This design is already active for this document category.', 'Already Active')
      return
    }
    setPendingSelection({ category, template })
    setConfirmModalOpen(true)
  }

  const handleConfirmSelect = async () => {
    if (!pendingSelection) return
    const { category, template } = pendingSelection
    const res = await selectTemplate(category, template.id)
    if (res?.success) {
      emitToast('success', `Active design set to "${template.name}". Applied across the entire system!`, 'Design Activated')
    }
    setConfirmModalOpen(false)
    setPendingSelection(null)
  }

  // Print current document
  const handlePrintDocument = () => {
    window.print()
  }

  // Download PDF
  const handleDownloadPdf = async (elemId, docName) => {
    setIsExporting(true)
    emitToast('info', 'Rendering high-definition document PDF...', 'Please wait')
    try {
      await exportDocumentToPdf({
        elementId: elemId,
        filename: `${docName}_${Date.now()}.pdf`,
        paperFormat: activeCategory === 'id_card' ? 'id_card' : 'a4',
      })
      emitToast('success', `${docName}.pdf saved successfully!`, 'Downloaded')
    } catch (err) {
      console.error('PDF generation error:', err)
      emitToast('error', `Failed to generate PDF: ${err?.message || 'Error'}`, 'Download Failed')
    } finally {
      setIsExporting(false)
    }
  }

  // Zoom handlers
  const handleZoomIn = () => {
    setStudioZoom((prev) => Math.min(prev + 15, 150))
  }
  const handleZoomOut = () => {
    setStudioZoom((prev) => Math.max(prev - 15, 60))
  }

  // Render document component
  const renderDocument = (category, templateId, studentData, customSettings, containerId) => {
    switch (category) {
      case 'id_card':
        return (
          <UniversalIdCard
            id={containerId}
            templateId={templateId}
            student={studentData}
            customization={customSettings}
          />
        )
      case 'admit_card':
        return (
          <UniversalAdmitCard
            id={containerId}
            templateId={templateId}
            student={studentData}
            timetable={SAMPLE_EXAM_TIMETABLE}
            customization={customSettings}
          />
        )
      case 'transfer_certificate':
        return (
          <UniversalTransferCertificate
            id={containerId}
            templateId={templateId}
            student={studentData}
            tcData={SAMPLE_TC_DATA}
            customization={customSettings}
          />
        )
      case 'marksheet':
      default:
        return (
          <UniversalMarksheet
            id={containerId}
            templateId={templateId}
            student={studentData}
            marksData={SAMPLE_MARKS_DATA}
            customization={customSettings}
          />
        )
    }
  }

  // Category config helper for Stitch UI badges and icons
  const getCategoryMeta = (catId) => {
    switch (catId) {
      case 'id_card':
        return {
          icon: 'badge',
          badgeColor: 'bg-blue-600 text-white shadow-md shadow-blue-500/30',
          activeTag: 'Active Category',
          spec: 'CR-80 Standard • RFID / NFC Sync',
          leftSub: `${DOCUMENT_TEMPLATES.id_card?.length || 3} Variants Available`,
          actionLabel: 'Ready',
          formatLabel: 'CR-80 Front Aspect (54mm × 85.6mm)',
          formatSpec: 'Spec: ISO/IEC 7810 ID-1',
        }
      case 'admit_card':
        return {
          icon: 'assignment_turned_in',
          badgeColor: 'bg-amber-500 text-white shadow-md shadow-amber-500/20',
          activeTag: 'Annual Exams 2026 Ready',
          spec: 'A4 Examination Board Standard',
          leftSub: 'CBSE Timetable Matched',
          actionLabel: 'Select',
          formatLabel: 'CBSE Annual Board Examination Hall Ticket 2026 (A4 Scale)',
          formatSpec: 'Spec: CBSE-EXAM-STD-A4',
        }
      case 'transfer_certificate':
        return {
          icon: 'receipt_long',
          badgeColor: 'bg-slate-900 text-slate-100 shadow-xs',
          activeTag: 'Available',
          spec: 'Official School Leaving Record',
          leftSub: 'Counter-Sign Verification',
          actionLabel: 'Queue',
          formatLabel: 'Official Transfer Certificate Tenured Record (A4 Portrait)',
          formatSpec: 'Spec: State Dept Legal Form 16-A',
        }
      case 'marksheet':
      default:
        return {
          icon: 'workspace_premium',
          badgeColor: 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20',
          activeTag: 'Available',
          spec: 'CBSE Term 1 & Term 2 Grading',
          leftSub: 'GPA 10-Point Scale',
          actionLabel: 'Inspect',
          formatLabel: 'Consolidated Marksheet & Cumulative Grade Card (A4 Scale)',
          formatSpec: 'Spec: CCE Continuous Evaluation',
        }
    }
  }

  return (
    <>
      <SEO
        title="Document Management Studio | Star Public School"
        description="Produce, customize, and batch-print security-compliant student credentials, RFID smart identity cards, and CBSE board examination admit passes with live ERP sync."
        canonicalPath="/document-management"
      />

      <div className="w-full space-y-8 pb-16">
        {/* ================= 1. TOP WORKSPACE ACTION HEADER ================= */}
        <section className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 text-[11px] font-bold tracking-wider uppercase bg-blue-50 text-blue-700 rounded-full shadow-2xs">
                Centralized Suite
              </span>
              <span className="text-xs text-slate-400 font-medium">
                Doc Engine v4.8 • Affiliation Sync Active
              </span>
            </div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              Document Management Studio
            </h1>
            <p className="text-xs text-slate-500 max-w-2xl leading-relaxed">
              Produce, customize, and batch-print security-compliant student credentials, RFID smart identity cards, and CBSE board examination admit passes with live ERP sync.
            </p>
          </div>

          {/* Right Controls */}
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => handleOpenCustomize(activeCategory)}
              className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg bg-white text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-all shadow-xs border border-slate-200 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[17px]">palette</span>
              <span>Customize Branding</span>
            </button>

            {/* Quick Category Toggle Pills */}
            <div className="inline-flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl">
              <button
                type="button"
                onClick={() => setActiveCategory('id_card')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                  activeCategory === 'id_card'
                    ? 'bg-white text-blue-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span className="material-symbols-outlined text-[15px]">badge</span>
                <span>Student ID Card</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveCategory('admit_card')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                  activeCategory === 'admit_card'
                    ? 'bg-white text-amber-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span className="material-symbols-outlined text-[15px]">confirmation_number</span>
                <span>Admit Card</span>
              </button>
            </div>

            <button
              onClick={handlePrintDocument}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg bg-blue-600 text-white hover:bg-blue-700 shadow-md shadow-blue-500/20 transition-all cursor-pointer"
            >
              <span className="material-symbols-outlined text-[17px]">bolt</span>
              <span>Quick Print Roll</span>
            </button>
          </div>
        </section>

        {/* ================= 2. TOP 4 CATEGORY SWITCHER CARDS ================= */}
        <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {DOCUMENT_CATEGORIES.map((cat) => {
            const meta = getCategoryMeta(cat.id)
            const currentTId = getActiveTemplateId(cat.id)
            const templateObj =
              DOCUMENT_TEMPLATES[cat.id]?.find((t) => t.id === currentTId) || DOCUMENT_TEMPLATES[cat.id]?.[0]
            const isCurrentCat = activeCategory === cat.id

            return (
              <div
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`cursor-pointer group relative p-4 rounded-xl bg-white transition-all duration-200 ${
                  isCurrentCat
                    ? 'shadow-md ring-2 ring-blue-600 border border-blue-100'
                    : 'shadow-xs hover:shadow-md border border-slate-200'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                      isCurrentCat
                        ? 'bg-blue-600 text-white shadow-md shadow-blue-500/30'
                        : meta.badgeColor
                    }`}
                  >
                    <span className="material-symbols-outlined text-[20px]">{meta.icon}</span>
                  </div>

                  {isCurrentCat ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse" />
                      Active Category
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-600">
                      {meta.activeTag}
                    </span>
                  )}
                </div>

                <div className="mt-3">
                  <h3
                    className={`text-sm font-bold transition-colors ${
                      isCurrentCat
                        ? 'text-blue-900'
                        : 'text-slate-900 group-hover:text-blue-600'
                    }`}
                  >
                    {cat.name}
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5 truncate">{meta.spec}</p>
                </div>

                <div className="mt-3 pt-3 flex items-center justify-between text-[11px] text-slate-400 border-t border-slate-100">
                  <span>{meta.leftSub}</span>
                  <span
                    className={`font-semibold flex items-center gap-0.5 ${
                      isCurrentCat
                        ? 'text-blue-600 font-bold'
                        : 'text-slate-600 group-hover:text-blue-600'
                    }`}
                  >
                    {meta.actionLabel}{' '}
                    <span className="material-symbols-outlined text-[14px]">chevron_right</span>
                  </span>
                </div>
              </div>
            )
          })}
        </section>

        {/* ================= 3. LAYOUT & DESIGN PRESETS (INTERACTIVE TEMPLATE VARIANT SHOWCASE) ================= */}
        <section className="space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <h3 className="text-sm font-bold text-slate-900 tracking-tight">
                Layout &amp; Design Presets
              </h3>
              <p className="text-xs text-slate-400">
                Select pre-approved standard layouts for high-speed batch thermal printing
              </p>
            </div>
            <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-md border border-blue-200 self-start sm:self-auto">
              Preset: {DOCUMENT_TEMPLATES[activeCategory].find((t) => t.id === activeTemplateId)?.name || 'Default'} (Active)
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {DOCUMENT_TEMPLATES[activeCategory].map((template) => {
              const isActive = activeTemplateId === template.id

              return (
                <div
                  key={template.id}
                  onClick={() => handleRequestSelect(activeCategory, template)}
                  className={`cursor-pointer group p-3.5 rounded-xl bg-white shadow-xs transition-all duration-200 relative overflow-hidden ${
                    isActive
                      ? 'ring-2 ring-blue-600 shadow-md'
                      : 'border border-slate-200 hover:shadow-md hover:-translate-y-0.5'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span
                      className={`text-[10px] font-bold uppercase tracking-wider ${
                        isActive ? 'text-blue-600' : 'text-slate-400'
                      }`}
                    >
                      {template.layout || template.badge}
                    </span>
                    <span
                      className={`w-2 h-2 rounded-full ${
                        isActive ? 'bg-blue-600 animate-pulse' : 'bg-slate-300'
                      }`}
                    />
                  </div>

                  {/* Visual Mock Canvas */}
                  <div
                    className={`h-28 rounded-lg bg-gradient-to-br ${template.previewBg} p-2 text-white flex flex-col justify-between relative shadow-inner overflow-hidden`}
                  >
                    <div className="flex items-center justify-between z-10">
                      <span className="text-[9px] font-bold tracking-tight text-amber-300 truncate max-w-[120px]">
                        STAR PUBLIC SCHOOL
                      </span>
                      <span className="text-[8px] bg-amber-400/20 text-amber-300 px-1 py-0.5 rounded font-mono">
                        {template.badge?.split(' ')[0] || 'SMART'}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 z-10">
                      <div className="w-8 h-10 rounded bg-slate-700/80 border border-white/10 flex items-center justify-center text-[9px] font-bold text-white/90">
                        PIC
                      </div>
                      <div className="text-[9px]">
                        <div className="font-bold text-slate-100 uppercase truncate max-w-[110px]">
                          {currentStudent.Name || currentStudent.name || 'Student Name'}
                        </div>
                        <div className="text-blue-300 text-[8px]">
                          Class {currentStudent.Class || currentStudent.class || '10'} • #{currentStudent.Roll || currentStudent.roll_no || '1024'}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-[7px] text-slate-400 pt-1 border-t border-white/10 z-10">
                      <span>CBSE AFF. 2130894</span>
                      <span className="font-mono text-amber-200">#4012</span>
                    </div>

                    <div className="absolute inset-0 bg-black/10 pointer-events-none" />
                  </div>

                  <div className="mt-2.5">
                    <h4 className="text-xs font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                      {template.name}
                    </h4>
                    <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-2">
                      {template.description}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        </section>

        {/* ================= 4. LIVE GENERATION STUDIO BAR & FILTER CONTROLS ================= */}
        <section className="bg-white rounded-2xl p-4 lg:p-5 shadow-xs border border-slate-200 space-y-4">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            {/* Filter Selectors */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 flex-1">
              <div>
                <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
                  Target Class
                </label>
                <div className="relative">
                  <select
                    value={selectedClass}
                    onChange={(e) => setSelectedClass(e.target.value)}
                    className="w-full text-xs font-semibold bg-slate-50 text-slate-800 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all appearance-none cursor-pointer border border-slate-200/60"
                  >
                    <option value="all">All Classes ({realStudents.length} Students)</option>
                    {classList.map((c) => (
                      <option key={c} value={c}>
                        Class {c} (CBSE Board Batch)
                      </option>
                    ))}
                  </select>
                  <span className="material-symbols-outlined absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-[18px] pointer-events-none">
                    expand_more
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
                  Section Filter
                </label>
                <div className="relative">
                  <select
                    value={selectedSection}
                    onChange={(e) => setSelectedSection(e.target.value)}
                    className="w-full text-xs font-semibold bg-slate-50 text-slate-800 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all appearance-none cursor-pointer border border-slate-200/60"
                  >
                    <option value="all">Section All • Enrolled ({filteredStudents.length})</option>
                    <option value="A">Section A</option>
                    <option value="B">Section B</option>
                    <option value="C">Section C</option>
                  </select>
                  <span className="material-symbols-outlined absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-[18px] pointer-events-none">
                    expand_more
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
                  Active Candidate
                </label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-[18px]">
                    person_search
                  </span>
                  <select
                    value={selectedStudentId || ''}
                    onChange={(e) => {
                      setSelectedStudentId(e.target.value)
                      setPreviewUseRealData(true)
                    }}
                    className="w-full text-xs font-semibold bg-slate-50 text-slate-800 rounded-lg pl-9 pr-8 p-2.5 focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all appearance-none cursor-pointer border border-slate-200/60"
                  >
                    {filteredStudents.length > 0 ? (
                      filteredStudents.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.Name || s.name} (Roll #{s.Roll || s.roll_no || '1024'} · Class {s.Class || s.class})
                        </option>
                      ))
                    ) : (
                      <option value="">No students in filter</option>
                    )}
                  </select>
                  <span className="material-symbols-outlined absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-[18px] pointer-events-none">
                    expand_more
                  </span>
                </div>
              </div>
            </div>

            {/* Action Buttons & Zoom */}
            <div className="flex flex-wrap items-center gap-2 pt-2 lg:pt-0">
              <button
                onClick={handlePrintDocument}
                className="inline-flex items-center gap-2 px-3.5 py-2.5 text-xs font-bold rounded-lg bg-blue-600 text-white hover:bg-blue-700 shadow-xs transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-[17px]">print</span>
                <span>Print Batch ({filteredStudents.length || 42})</span>
              </button>

              <button
                disabled={isExporting}
                onClick={() =>
                  handleDownloadPdf(
                    `studio-doc-${activeCategory}`,
                    `Star_Public_School_${activeCategory}_${(currentStudent.Name || currentStudent.name || 'Student').replace(/\s+/g, '_')}`
                  )
                }
                className="inline-flex items-center gap-2 px-3.5 py-2.5 text-xs font-bold rounded-lg bg-slate-900 text-white hover:bg-slate-800 shadow-xs transition-colors cursor-pointer disabled:opacity-50"
              >
                <span className="material-symbols-outlined text-[17px]">download</span>
                <span>{isExporting ? 'Exporting...' : 'Download PDF'}</span>
              </button>

              <button
                type="button"
                className="inline-flex items-center gap-1.5 px-3 py-2.5 text-xs font-semibold rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors"
              >
                <span className="material-symbols-outlined text-[17px]">layers</span>
                <span>CMYK 300 DPI</span>
              </button>

              {/* Canvas Zoom Controls */}
              <div className="flex items-center bg-slate-100 rounded-lg p-1 text-slate-600 text-xs">
                <button
                  type="button"
                  onClick={handleZoomOut}
                  className="p-1.5 hover:text-slate-950 rounded transition-colors cursor-pointer"
                  title="Zoom Out"
                >
                  <span className="material-symbols-outlined text-[16px]">remove</span>
                </button>
                <span className="px-2 font-mono font-bold text-[11px]">{studioZoom}%</span>
                <button
                  type="button"
                  onClick={handleZoomIn}
                  className="p-1.5 hover:text-slate-950 rounded transition-colors cursor-pointer"
                  title="Zoom In"
                >
                  <span className="material-symbols-outlined text-[16px]">add</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const t = DOCUMENT_TEMPLATES[activeCategory].find((item) => item.id === activeTemplateId)
                    if (t) handleOpenPreview(t)
                  }}
                  className="p-1.5 hover:text-slate-950 rounded transition-colors ml-1 cursor-pointer"
                  title="Fullscreen Preview"
                >
                  <span className="material-symbols-outlined text-[16px]">fullscreen</span>
                </button>
              </div>
            </div>
          </div>

          {/* Active Document Mode Switch Tabs */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-slate-100">
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setActiveCategory('id_card')}
                className={`px-4 py-2 text-xs font-bold rounded-lg flex items-center gap-2 transition-all cursor-pointer ${
                  activeCategory === 'id_card'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-700 hover:text-slate-950 hover:bg-slate-200'
                }`}
              >
                <span className="material-symbols-outlined text-[16px]">credit_card</span>
                <span>Student ID Card (Front &amp; Back View)</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveCategory('admit_card')}
                className={`px-4 py-2 text-xs font-semibold rounded-lg flex items-center gap-2 transition-all cursor-pointer ${
                  activeCategory === 'admit_card'
                    ? 'bg-amber-600 text-white shadow-xs font-bold'
                    : 'bg-slate-100 text-slate-700 hover:text-slate-950 hover:bg-slate-200'
                }`}
              >
                <span className="material-symbols-outlined text-[16px]">description</span>
                <span>Annual Admit Card / Hall Ticket (CBSE A4)</span>
              </button>
            </div>

            <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>
                Candidate Database: <strong className="text-slate-800">Synced Real-Time</strong>
              </span>
            </div>
          </div>
        </section>

        {/* ================= 5. LIVE DOCUMENT PREVIEW CANVAS ================= */}
        <section className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-bold tracking-wider text-slate-500 uppercase flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-blue-600" />
              {getCategoryMeta(activeCategory).formatLabel}
            </span>
            <span className="text-[11px] font-mono font-semibold text-slate-400">
              {getCategoryMeta(activeCategory).formatSpec}
            </span>
          </div>

          {/* Render Frame with Zoom applied */}
          <div className="bg-slate-200/70 p-6 md:p-10 rounded-2xl flex justify-center items-center overflow-x-auto border border-slate-300/80 min-h-[480px]">
            <div
              style={{
                transform: studioZoom === 100 ? 'none' : `scale(${studioZoom / 100})`,
                transformOrigin: 'top center',
                transition: 'transform 0.15s ease',
                marginBottom: studioZoom > 100 ? `${(studioZoom - 100) * 4}px` : '0',
              }}
              className="sps-document-capture-root bg-white p-4 md:p-8 rounded-2xl shadow-2xl border border-slate-200/90 flex items-center justify-center transition-all duration-300"
            >
              {renderDocument(
                activeCategory,
                activeTemplateId,
                currentStudent,
                currentCustomization,
                `studio-doc-${activeCategory}`
              )}
            </div>
          </div>
        </section>

        {/* ================= 6. BATCH EXPORT & PRINT SUMMARY STRIP ================= */}
        <section className="p-4 bg-white rounded-xl shadow-xs border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shadow-2xs">
              <span className="material-symbols-outlined text-[20px]">verified</span>
            </div>
            <div>
              <p className="font-bold text-slate-900">
                {filteredStudents.length} Records Loaded from {selectedClass === 'all' ? 'All Classes' : `Class ${selectedClass}`} (CBSE 2026 Batch)
              </p>
              <p className="text-[11px] text-slate-400">
                All photos verified 300 DPI • QR payload encrypted • RFID card IDs pre-assigned
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            <span className="text-slate-400 text-[11px] hidden md:inline">
              Printer: <strong className="text-slate-700">Zebra ZC300 Dual-Sided RFID</strong>
            </span>
            <button
              onClick={handlePrintDocument}
              className="px-4 py-2 font-bold text-xs bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors shadow-xs cursor-pointer"
            >
              Start Print Queue
            </button>
          </div>
        </section>
      </div>

      {/* ================= 7. FULL-SIZE PREVIEW MODAL ================= */}
      {previewModalOpen && previewTemplate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-xs p-3 sm:p-5 overflow-y-auto">
          <div className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl border border-slate-200 p-5 sm:p-6 flex flex-col max-h-[94vh]">
            <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-200">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <span>{previewTemplate.name}</span>
                  <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
                    Full Resolution Preview
                  </span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">{previewTemplate.description}</p>
              </div>

              <div className="flex items-center gap-2">
                {/* Modal Zoom Selector */}
                <div className="flex items-center bg-slate-100 rounded-lg p-0.5 border border-slate-200 text-xs font-semibold">
                  {[75, 100, 125, 150].map((z) => (
                    <button
                      key={z}
                      type="button"
                      onClick={() => setModalZoom(z)}
                      className={`px-2 py-1 rounded transition-colors cursor-pointer ${
                        modalZoom === z ? 'bg-blue-600 text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      {z}%
                    </button>
                  ))}
                </div>

                <div className="flex items-center space-x-1.5 px-2.5 py-1 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-300 rounded-lg">
                  <span className="material-symbols-outlined text-sm text-emerald-600">database</span>
                  <span>Database Record</span>
                </div>

                <button
                  type="button"
                  onClick={() => setPreviewModalOpen(false)}
                  className="h-8 w-8 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center font-bold text-sm cursor-pointer transition-colors"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Modal Body: Rendered Document with Zoom */}
            <div className="flex-1 overflow-auto p-4 bg-slate-100/70 rounded-xl my-4 flex items-center justify-center min-h-[350px]">
              <div
                style={{
                  transform: modalZoom === 100 ? 'none' : `scale(${modalZoom / 100})`,
                  transformOrigin: 'center center',
                  transition: 'transform 0.15s ease',
                }}
                className="bg-white p-3 rounded-xl shadow-md border border-slate-200 flex items-center justify-center"
              >
                {renderDocument(
                  activeCategory,
                  previewTemplate.id,
                  currentStudent,
                  currentCustomization,
                  'modal-preview-doc'
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="pt-3 border-t border-slate-200 flex items-center justify-between">
              <span className="text-xs text-slate-500">
                Paper: <strong className="text-slate-800">{DOCUMENT_CATEGORIES.find((c) => c.id === activeCategory)?.paperSize}</strong>
              </span>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleDownloadPdf('modal-preview-doc', previewTemplate.name)}
                  className="px-3.5 py-2 text-xs font-bold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 shadow-2xs transition-all cursor-pointer"
                >
                  Download Test PDF
                </button>
                {activeTemplateId !== previewTemplate.id && (
                  <button
                    onClick={() => {
                      setPreviewModalOpen(false)
                      handleRequestSelect(activeCategory, previewTemplate)
                    }}
                    className="px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-md shadow-blue-500/20 transition-all cursor-pointer"
                  >
                    Activate This Design
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= 8. CUSTOMIZATION DRAWER / MODAL ================= */}
      {customizerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 backdrop-blur-xs p-4">
          <div className="relative w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-slate-200 p-6 max-h-[90vh] overflow-y-auto space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Customize {DOCUMENT_CATEGORIES.find((c) => c.id === customizerCategory)?.name}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Edit colors, labels, and header text for this document category.
                </p>
              </div>
              <button
                onClick={() => setCustomizerOpen(false)}
                className="h-8 w-8 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center font-bold text-sm cursor-pointer transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3.5 text-xs">
              <div>
                <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block mb-1">
                  School Name Heading
                </label>
                <input
                  type="text"
                  value={customForm.schoolName || ''}
                  onChange={(e) => setCustomForm({ ...customForm, schoolName: e.target.value })}
                  className="w-full text-xs font-medium bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-2xs font-bold"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block mb-1">
                  Tagline / Affiliation Info
                </label>
                <input
                  type="text"
                  value={customForm.tagline || ''}
                  onChange={(e) => setCustomForm({ ...customForm, tagline: e.target.value })}
                  className="w-full text-xs font-medium bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-2xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block mb-1">
                    Primary Brand Color
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={customForm.primaryColor || '#071d3f'}
                      onChange={(e) => setCustomForm({ ...customForm, primaryColor: e.target.value })}
                      className="w-9 h-9 rounded cursor-pointer border border-slate-300 p-0.5 shadow-2xs"
                    />
                    <input
                      type="text"
                      value={customForm.primaryColor || '#071d3f'}
                      onChange={(e) => setCustomForm({ ...customForm, primaryColor: e.target.value })}
                      className="flex-1 rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 font-mono text-xs uppercase text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block mb-1">
                    Secondary Accent Color
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={customForm.secondaryColor || '#d4af37'}
                      onChange={(e) => setCustomForm({ ...customForm, secondaryColor: e.target.value })}
                      className="w-9 h-9 rounded cursor-pointer border border-slate-300 p-0.5 shadow-2xs"
                    />
                    <input
                      type="text"
                      value={customForm.secondaryColor || '#d4af37'}
                      onChange={(e) => setCustomForm({ ...customForm, secondaryColor: e.target.value })}
                      className="flex-1 rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 font-mono text-xs uppercase text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block mb-1">
                    Principal Signature Label
                  </label>
                  <input
                    type="text"
                    value={customForm.principalSignLabel || ''}
                    onChange={(e) => setCustomForm({ ...customForm, principalSignLabel: e.target.value })}
                    className="w-full text-xs font-medium bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-2xs"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block mb-1">
                    Valid Till / Academic Year
                  </label>
                  <input
                    type="text"
                    value={customForm.validTill || customForm.session || ''}
                    onChange={(e) =>
                      setCustomForm({ ...customForm, validTill: e.target.value, session: e.target.value })
                    }
                    className="w-full text-xs font-medium bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-2xs"
                  />
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-200 flex items-center justify-between">
              <button
                type="button"
                onClick={handleResetCustomization}
                className="text-xs font-bold text-rose-600 hover:underline cursor-pointer"
              >
                Reset to Defaults
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setCustomizerOpen(false)}
                  className="px-3.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isSaving}
                  onClick={handleSaveCustomization}
                  className="px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-md shadow-blue-500/20 transition-all cursor-pointer disabled:opacity-50"
                >
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= 9. CONFIRMATION MODAL ================= */}
      {confirmModalOpen && pendingSelection && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600 font-bold shadow-2xs">
                <span className="material-symbols-outlined text-xl">swap_horiz</span>
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Confirm Active Design Switch</h3>
                <p className="text-xs text-slate-500">Apply globally across school management software.</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Are you sure you want to set <strong className="text-slate-900">{pendingSelection.template.name}</strong>{' '}
              as the official active design for{' '}
              <strong className="text-slate-900">
                {DOCUMENT_CATEGORIES.find((c) => c.id === pendingSelection.category)?.name}
              </strong>
              ?
              <br />
              <br />
              This will update student ID downloads, admit card generation, report cards, and print workflows immediately
              for all administrators and teachers.
            </p>

            <div className="pt-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setConfirmModalOpen(false)}
                className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmSelect}
                className="px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-md shadow-blue-500/20 transition-all cursor-pointer"
              >
                Confirm & Apply
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
