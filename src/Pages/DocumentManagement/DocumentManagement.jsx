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

  return (
    <>
      <SEO
        title="Document Management System | Star Public School"
        description="Manage official school document designs, customize branding, and print or download student documents."
        canonicalPath="/document-management"
      />

      <div className="w-full space-y-6 pb-16">
        {/* ================= 1. EXECUTIVE TOP HEADER ================= */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-2xl text-blue-700">source</span>
              <h1 className="text-xl font-black text-slate-900 tracking-tight">
                Document Management System
              </h1>
              <span className="bg-blue-100 text-blue-900 text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase">
                Centralized Suite
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Select and customize official templates for ID cards, Admit cards, Transfer Certificates, and Marksheets.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => handleOpenCustomize(activeCategory)}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 shadow-2xs hover:bg-slate-50 transition-colors"
            >
              <span className="material-symbols-outlined text-sm text-slate-500">palette</span>
              <span>Customize Branding</span>
            </button>
            <button
              onClick={() => {
                const activeT = DOCUMENT_TEMPLATES[activeCategory].find((t) => t.id === activeTemplateId) || DOCUMENT_TEMPLATES[activeCategory][0]
                handleOpenPreview(activeT)
              }}
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#071d3f] px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-[#0c2e63] transition-colors"
            >
              <span className="material-symbols-outlined text-sm">visibility</span>
              <span>Preview Active Design</span>
            </button>
          </div>
        </div>

        {/* ================= 2. ACTIVE SYSTEM STATUS SNAPSHOT ================= */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {DOCUMENT_CATEGORIES.map((cat) => {
            const currentTId = getActiveTemplateId(cat.id)
            const templateObj = DOCUMENT_TEMPLATES[cat.id]?.find((t) => t.id === currentTId) || DOCUMENT_TEMPLATES[cat.id]?.[0]
            const isCurrentCat = activeCategory === cat.id

            return (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`text-left p-4 rounded-xl border transition-all relative overflow-hidden ${
                  isCurrentCat
                    ? 'border-blue-700 bg-blue-50/70 shadow-sm ring-2 ring-blue-500/20'
                    : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-2xs'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="material-symbols-outlined text-xl text-blue-700">{cat.icon}</span>
                  <span className="text-[10px] font-mono text-slate-400 font-semibold">{cat.paperSize.split(' ')[0]}</span>
                </div>
                <h3 className="text-xs font-black text-slate-900 mt-2">{cat.name}</h3>
                <div className="mt-1 flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-[11px] font-bold text-blue-900 truncate">
                    {templateObj?.name || 'Standard'}
                  </span>
                </div>
              </button>
            )
          })}
        </div>

        {/* ================= 3. TEMPLATE GALLERY SECTION ================= */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
                <span>{DOCUMENT_CATEGORIES.find((c) => c.id === activeCategory)?.name} Gallery</span>
                <span className="text-xs font-medium text-slate-400">· 5 Unique Designs</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Choose the template to be used across all student print previews, downloads, and school portals.
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <span className="text-slate-500 font-medium">Currently Active:</span>
              <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 px-2.5 py-0.5 rounded-full font-bold">
                {DOCUMENT_TEMPLATES[activeCategory].find((t) => t.id === activeTemplateId)?.name || DOCUMENT_TEMPLATES[activeCategory]?.[0]?.name}
              </span>
            </div>
          </div>

          {/* Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-6 gap-4 pt-2">
            {DOCUMENT_TEMPLATES[activeCategory].map((template) => {
              const isActive = activeTemplateId === template.id

              return (
                <div
                  key={template.id}
                  className={`rounded-xl border flex flex-col justify-between overflow-hidden transition-all bg-white ${
                    isActive
                      ? 'border-blue-600 shadow-md ring-2 ring-blue-500/20'
                      : 'border-slate-200 hover:border-slate-300 hover:shadow-xs'
                  }`}
                >
                  {/* Card Visual Header Mockup */}
                  <div className={`h-36 bg-gradient-to-br ${template.previewBg} p-3 flex flex-col justify-between text-white relative overflow-hidden select-none`}>
                    <div className="flex items-center justify-between z-10">
                      <span className="text-[9px] font-bold uppercase tracking-wider bg-black/30 backdrop-blur-xs px-2 py-0.5 rounded">
                        {template.badge}
                      </span>
                      {isActive && (
                        <span className="inline-flex items-center gap-1 bg-emerald-500 text-slate-950 font-black text-[9px] uppercase px-2 py-0.5 rounded-full shadow-xs">
                          <span className="material-symbols-outlined text-xs">check_circle</span>
                          ACTIVE
                        </span>
                      )}
                    </div>

                    <div className="z-10">
                      <h4 className="text-xs font-black uppercase tracking-tight drop-shadow-sm leading-tight">
                        {template.name}
                      </h4>
                      <p className="text-[9px] opacity-80 mt-0.5 font-mono">{template.layout}</p>
                    </div>

                    {/* Faint Decorative Backdrop */}
                    <div className="absolute -right-4 -bottom-4 opacity-15">
                      <span className="material-symbols-outlined text-7xl">description</span>
                    </div>
                  </div>

                  {/* Card Details Body */}
                  <div className="p-3.5 flex-1 flex flex-col justify-between space-y-3">
                    <p className="text-[11px] text-slate-600 leading-relaxed line-clamp-3">
                      {template.description}
                    </p>

                    <div className="pt-2 border-t border-slate-100 flex flex-col gap-2">
                      <button
                        onClick={() => handleOpenPreview(template)}
                        className="w-full inline-flex items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors"
                      >
                        <span className="material-symbols-outlined text-sm text-slate-500">fullscreen</span>
                        <span>Preview Full</span>
                      </button>

                      {isActive ? (
                        <div className="w-full py-1.5 rounded-lg bg-emerald-50 border border-emerald-200 text-center text-xs font-bold text-emerald-800 flex items-center justify-center gap-1">
                          <span className="material-symbols-outlined text-xs">verified</span>
                          <span>Active System Design</span>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleRequestSelect(activeCategory, template)}
                          className="w-full py-1.5 rounded-lg bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs transition-colors shadow-2xs"
                        >
                          Select As Active
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* ================= 4. DOCUMENT GENERATION & PRINT STUDIO ================= */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
                <span className="material-symbols-outlined text-lg text-blue-700">print</span>
                <span>Document Generation Studio</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Generate real student documents using the currently active template.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handlePrintDocument}
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3.5 py-1.5 text-xs font-bold text-slate-700 shadow-2xs hover:bg-slate-50"
              >
                <span className="material-symbols-outlined text-sm">print</span>
                <span>Print Document</span>
              </button>
              <button
                disabled={isExporting}
                onClick={() =>
                  handleDownloadPdf(
                    `studio-doc-${activeCategory}`,
                    `Star_Public_School_${activeCategory}_${currentStudent.name?.replace(/\s+/g, '_')}`
                  )
                }
                className="inline-flex items-center gap-1.5 rounded-xl bg-blue-700 hover:bg-blue-800 text-white px-4 py-1.5 text-xs font-bold shadow-xs disabled:opacity-50"
              >
                <span className="material-symbols-outlined text-sm">download</span>
                <span>{isExporting ? 'Exporting...' : 'Download PDF'}</span>
              </button>
            </div>
          </div>

          {/* Student Filter Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs">
            <div>
              <label className="text-[10px] font-bold uppercase text-slate-500 block mb-1">Filter Class</label>
              <select
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none"
              >
                <option value="all">All Classes ({realStudents.length} Students)</option>
                {classList.map((c) => (
                  <option key={c} value={c}>Class {c}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[10px] font-bold uppercase text-slate-500 block mb-1">Filter Section</label>
              <select
                value={selectedSection}
                onChange={(e) => setSelectedSection(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none"
              >
                <option value="all">All Sections</option>
                <option value="A">Section A</option>
                <option value="B">Section B</option>
                <option value="C">Section C</option>
              </select>
            </div>

            <div>
              <label className="text-[10px] font-bold uppercase text-slate-500 block mb-1">Search Student</label>
              <input
                type="text"
                placeholder="Name or roll no..."
                value={studentSearchTerm}
                onChange={(e) => setStudentSearchTerm(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none"
              />
            </div>

            <div>
              <label className="text-[10px] font-bold uppercase text-slate-500 block mb-1">Select Student</label>
              <select
                value={selectedStudentId || ''}
                onChange={(e) => {
                  setSelectedStudentId(e.target.value)
                  setPreviewUseRealData(true)
                }}
                className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none"
              >
                {filteredStudents.length > 0 ? (
                  filteredStudents.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.Name || s.name} (Roll #{s.Roll || s.roll_no} - Class {s.Class || s.class})
                    </option>
                  ))
                ) : (
                  <option value="">No students found in filter</option>
                )}
              </select>
            </div>
          </div>

          {/* Live Studio Document Render Preview Area */}
          <div className="bg-slate-100/70 p-4 sm:p-6 rounded-xl border border-slate-200 flex flex-col items-center justify-center overflow-hidden">
            <div className="w-full flex flex-wrap items-center justify-between gap-3 pb-3 mb-3 border-b border-slate-200 text-xs">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-slate-700 font-bold">
                  Live Preview: <strong>{DOCUMENT_CATEGORIES.find((c) => c.id === activeCategory)?.name}</strong> · <span className="text-blue-700">{DOCUMENT_TEMPLATES[activeCategory].find((t) => t.id === activeTemplateId)?.name}</span>
                </span>
              </div>

              {/* Data Mode Toggle & Zoom Controls */}
              <div className="flex items-center gap-2">
                {/* Live Real Data Indicator */}
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg border border-emerald-300 bg-emerald-50 text-emerald-800 text-xs font-bold shadow-2xs">
                  <span className="material-symbols-outlined text-[15px] text-emerald-600">database</span>
                  <span>Database Student Record</span>
                </div>

                {/* Studio Zoom Controls */}
                <div className="inline-flex rounded-lg border border-slate-300 bg-white p-0.5 text-xs font-bold">
                  {[75, 100, 125].map((z) => (
                    <button
                      key={z}
                      type="button"
                      onClick={() => setStudioZoom(z)}
                      className={`px-2 py-0.5 rounded cursor-pointer transition-colors ${
                        studioZoom === z ? 'bg-slate-900 text-white' : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      {z}%
                    </button>
                  ))}
                </div>

                {/* Inspect Full Resolution Button */}
                <button
                  type="button"
                  onClick={() => {
                    const t = DOCUMENT_TEMPLATES[activeCategory].find((item) => item.id === activeTemplateId)
                    if (t) handleOpenPreview(t)
                  }}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-slate-300 bg-white text-slate-700 text-xs font-bold hover:bg-slate-50 cursor-pointer"
                  title="Inspect at full resolution in pop-up modal"
                >
                  <span className="material-symbols-outlined text-sm">open_in_full</span>
                  <span className="hidden sm:inline">Inspect Full</span>
                </button>
              </div>
            </div>

            {/* Scaled Render Container */}
            <div className="w-full flex justify-center overflow-x-auto py-2">
              <div
                style={{
                  transform: studioZoom === 100 ? 'none' : `scale(${studioZoom / 100})`,
                  transformOrigin: 'top center',
                  transition: 'transform 0.15s ease',
                  marginBottom: studioZoom > 100 ? `${(studioZoom - 100) * 4}px` : '0',
                }}
                className="sps-document-capture-root bg-white p-3 rounded-2xl shadow-xl border border-slate-200/90 flex items-center justify-center"
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
          </div>
        </div>
      </div>

      {/* ================= 5. FULL-SIZE PREVIEW MODAL ================= */}
      {previewModalOpen && previewTemplate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-xs p-3 sm:p-5 overflow-y-auto">
          <div className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl border border-slate-200 p-5 sm:p-6 flex flex-col max-h-[94vh]">
            <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-200">
              <div>
                <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                  <span>{previewTemplate.name}</span>
                  <span className="text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">Full Resolution Preview</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">{previewTemplate.description}</p>
              </div>

              <div className="flex items-center gap-2">
                {/* Modal Zoom Selector */}
                <div className="inline-flex rounded-lg border border-slate-300 bg-slate-100 p-0.5 text-xs font-bold">
                  {[75, 100, 125, 150].map((z) => (
                    <button
                      key={z}
                      type="button"
                      onClick={() => setModalZoom(z)}
                      className={`px-2 py-0.5 rounded cursor-pointer transition-colors ${
                        modalZoom === z ? 'bg-blue-700 text-white' : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      {z}%
                    </button>
                  ))}
                </div>

                <div className="px-3 py-1 text-xs font-bold rounded-lg border border-emerald-300 bg-emerald-50 text-emerald-800">
                  Database Record
                </div>

                <button
                  type="button"
                  onClick={() => setPreviewModalOpen(false)}
                  className="h-8 w-8 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center font-bold cursor-pointer"
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
                className="bg-white p-2 rounded-xl shadow-md border border-slate-200 flex items-center justify-center"
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
                Paper: <strong>{DOCUMENT_CATEGORIES.find((c) => c.id === activeCategory)?.paperSize}</strong>
              </span>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleDownloadPdf('modal-preview-doc', previewTemplate.name)}
                  className="px-3 py-1.5 text-xs font-bold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50"
                >
                  Download Test PDF
                </button>
                {activeTemplateId !== previewTemplate.id && (
                  <button
                    onClick={() => {
                      setPreviewModalOpen(false)
                      handleRequestSelect(activeCategory, previewTemplate)
                    }}
                    className="px-4 py-1.5 text-xs font-bold text-white bg-blue-700 hover:bg-blue-800 rounded-lg shadow-xs"
                  >
                    Activate This Design
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= 6. CUSTOMIZATION DRAWER / MODAL ================= */}
      {customizerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 backdrop-blur-xs p-4">
          <div className="relative w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-slate-200 p-6 max-h-[90vh] overflow-y-auto space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div>
                <h3 className="text-base font-black text-slate-900">
                  Customize {DOCUMENT_CATEGORIES.find((c) => c.id === customizerCategory)?.name}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">Edit colors, labels, and header text for this document category.</p>
              </div>
              <button
                onClick={() => setCustomizerOpen(false)}
                className="h-8 w-8 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">School Name Heading</label>
                <input
                  type="text"
                  value={customForm.schoolName || ''}
                  onChange={(e) => setCustomForm({ ...customForm, schoolName: e.target.value })}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-slate-900 font-bold"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Tagline / Affiliation Info</label>
                <input
                  type="text"
                  value={customForm.tagline || ''}
                  onChange={(e) => setCustomForm({ ...customForm, tagline: e.target.value })}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-slate-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Primary Brand Color</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={customForm.primaryColor || '#071d3f'}
                      onChange={(e) => setCustomForm({ ...customForm, primaryColor: e.target.value })}
                      className="w-9 h-9 rounded cursor-pointer border border-slate-300 p-0.5"
                    />
                    <input
                      type="text"
                      value={customForm.primaryColor || '#071d3f'}
                      onChange={(e) => setCustomForm({ ...customForm, primaryColor: e.target.value })}
                      className="flex-1 rounded-lg border border-slate-200 px-2 py-1.5 font-mono text-xs uppercase"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Secondary / Gold Accent</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={customForm.secondaryColor || '#d4af37'}
                      onChange={(e) => setCustomForm({ ...customForm, secondaryColor: e.target.value })}
                      className="w-9 h-9 rounded cursor-pointer border border-slate-300 p-0.5"
                    />
                    <input
                      type="text"
                      value={customForm.secondaryColor || '#d4af37'}
                      onChange={(e) => setCustomForm({ ...customForm, secondaryColor: e.target.value })}
                      className="flex-1 rounded-lg border border-slate-200 px-2 py-1.5 font-mono text-xs uppercase"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Principal Signature Label</label>
                  <input
                    type="text"
                    value={customForm.principalSignLabel || ''}
                    onChange={(e) => setCustomForm({ ...customForm, principalSignLabel: e.target.value })}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-slate-800"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Valid Till / Academic Year</label>
                  <input
                    type="text"
                    value={customForm.validTill || customForm.session || ''}
                    onChange={(e) => setCustomForm({ ...customForm, validTill: e.target.value, session: e.target.value })}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-slate-800"
                  />
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-200 flex items-center justify-between">
              <button
                type="button"
                onClick={handleResetCustomization}
                className="text-xs font-bold text-rose-600 hover:underline"
              >
                Reset to Defaults
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setCustomizerOpen(false)}
                  className="px-3 py-1.5 text-xs font-bold text-slate-500 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isSaving}
                  onClick={handleSaveCustomization}
                  className="px-4 py-1.5 text-xs font-bold text-white bg-blue-700 hover:bg-blue-800 rounded-lg shadow-xs"
                >
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= 7. CONFIRMATION MODAL ================= */}
      {confirmModalOpen && pendingSelection && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-200 p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold">
                <span className="material-symbols-outlined text-xl">sync_alt</span>
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-900">Confirm Active Design Switch</h3>
                <p className="text-xs text-slate-500">Apply globally across school management software.</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Are you sure you want to set <strong className="text-slate-900">{pendingSelection.template.name}</strong> as the official active design for{' '}
              <strong className="text-slate-900">{DOCUMENT_CATEGORIES.find((c) => c.id === pendingSelection.category)?.name}</strong>?
              <br /><br />
              This will update student ID downloads, admit card generation, report cards, and print workflows immediately for all administrators and teachers.
            </p>

            <div className="pt-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setConfirmModalOpen(false)}
                className="px-3.5 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmSelect}
                className="px-4 py-1.5 text-xs font-bold text-white bg-blue-700 hover:bg-blue-800 rounded-lg shadow-xs"
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
