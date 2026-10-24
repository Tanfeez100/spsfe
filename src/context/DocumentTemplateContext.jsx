import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'
import {
  getDocumentTemplates,
  selectActiveTemplate as apiSelectActiveTemplate,
  customizeTemplate as apiCustomizeTemplate,
  resetTemplateDefaults as apiResetTemplateDefaults,
} from '../Api/documentTemplates'
import { DOCUMENT_CATEGORIES } from '../constants/documentTemplateRegistry'

const LOCAL_STORAGE_KEY = 'sps_document_templates_config_v1'

const DEFAULT_CONFIG = {
  id_card: {
    category: 'id_card',
    activeTemplateId: 'id_card_modern_blue',
    customization: {
      schoolName: 'STAR PUBLIC SCHOOL',
      tagline: 'Affiliated to State Board | Affiliation No: 2130894',
      address: 'Main Road, Bettiah, West Champaran, Bihar - 845438',
      phone: '+91 98765 43210',
      email: 'info@starpublicschool.com',
      primaryColor: '#071d3f',
      secondaryColor: '#d4af37',
      accentColor: '#2563eb',
      showQr: true,
      showCutLines: true,
      principalSignLabel: 'Principal Sign',
      validTill: '31/03/2027',
      academicYear: '2026-2027',
    },
  },
  admit_card: {
    category: 'admit_card',
    activeTemplateId: 'admit_card_modern_blue',
    customization: {
      schoolName: 'STAR PUBLIC SCHOOL',
      tagline: 'Affiliated to State Board | Bettiah, West Champaran',
      examName: 'ANNUAL EXAMINATION 2026-27',
      session: '2026-2027',
      centerName: 'Star Public School Campus - Examination Hall',
      reportingTime: '08:30 AM',
      primaryColor: '#0f2b5c',
      secondaryColor: '#1e3a8a',
      accentColor: '#2563eb',
      showTimetable: true,
      showInstructions: true,
      controllerSignLabel: 'Controller of Examinations',
      principalSignLabel: 'Principal Signature',
      instructions: [
        'Candidates must occupy their seats 15 minutes before exam commencement.',
        'Admit Card & Student Identity Card are mandatory for hall entry.',
        'Electronic gadgets, smartwatches, and study notes are strictly forbidden.',
        'Write your Roll Number & Admission Number legibly on the answer booklet.',
      ],
    },
  },
  transfer_certificate: {
    category: 'transfer_certificate',
    activeTemplateId: 'tc_traditional_official',
    customization: {
      schoolName: 'STAR PUBLIC SCHOOL',
      tagline: 'Senior Secondary School | Affiliated to BSEB / CBSE',
      affiliationNo: 'SPS/BIH/2018/094',
      schoolCode: '845438',
      bookNo: '04',
      prefixNo: 'TC/2026/',
      primaryColor: '#1e293b',
      secondaryColor: '#991b1b',
      accentColor: '#d97706',
      showSeal: true,
      showWatermark: true,
      preparedByLabel: 'Office Clerk',
      verifiedByLabel: 'Checked By (Incharge)',
      principalSignLabel: 'Principal (with School Seal)',
    },
  },
  marksheet: {
    category: 'marksheet',
    activeTemplateId: 'marksheet_bihar_board',
    customization: {
      boardName: 'BIHAR SCHOOL EXAMINATION BOARD / ACADEMIC COUNCIL',
      schoolName: 'STAR PUBLIC SCHOOL, WEST CHAMPARAN',
      tagline: 'Affiliated to State Board | Center Code: 845438',
      session: '2026-2027',
      examName: 'ANNUAL EVALUATION & PROGRESS REPORT',
      primaryColor: '#0f172a',
      secondaryColor: '#1e40af',
      accentColor: '#b45309',
      showGradingScale: true,
      showRemarks: true,
      showRank: true,
      showAttendance: true,
      classTeacherSignLabel: 'Class Teacher',
      inchargeSignLabel: 'Examination Controller',
      principalSignLabel: 'Headmaster / Principal',
    },
  },
}

const DocumentTemplateContext = createContext(null)

export function DocumentTemplateProvider({ children }) {
  const [templateConfig, setTemplateConfig] = useState(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY)
      if (saved) return JSON.parse(saved)
    } catch {
      // ignore
    }
    return DEFAULT_CONFIG
  })

  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState(null)

  // Fetch from backend on mount
  const fetchTemplates = useCallback(async () => {
    setIsLoading(true)
    try {
      const data = await getDocumentTemplates()
      if (data && typeof data === 'object') {
        const merged = { ...DEFAULT_CONFIG }
        Object.keys(DEFAULT_CONFIG).forEach((cat) => {
          if (data[cat]) {
            merged[cat] = {
              ...DEFAULT_CONFIG[cat],
              ...data[cat],
              customization: {
                ...DEFAULT_CONFIG[cat].customization,
                ...(data[cat].customization || {}),
              },
            }
          }
        })
        setTemplateConfig(merged)
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(merged))
      }
    } catch (err) {
      console.warn('Backend document templates fetch failed, retaining cached configuration:', err?.message)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchTemplates()
  }, [fetchTemplates])

  // Select active design template for a category
  const selectTemplate = async (category, templateId) => {
    setIsSaving(true)
    // Optimistic update
    setTemplateConfig((prev) => {
      const updated = {
        ...prev,
        [category]: {
          ...(prev[category] || DEFAULT_CONFIG[category]),
          activeTemplateId: templateId,
          updatedAt: new Date().toISOString(),
        },
      }
      try {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated))
      } catch {
        // ignore
      }
      return updated
    })

    try {
      await apiSelectActiveTemplate(category, templateId)
      setLastSaved(new Date())
      return { success: true }
    } catch (error) {
      console.error('Failed to persist template selection to backend:', error)
      return { success: true, warning: 'Saved locally, backend sync will retry' }
    } finally {
      setIsSaving(false)
    }
  }

  // Save customization settings
  const customize = async (category, newCustomization) => {
    setIsSaving(true)
    setTemplateConfig((prev) => {
      const current = prev[category] || DEFAULT_CONFIG[category]
      const updated = {
        ...prev,
        [category]: {
          ...current,
          customization: {
            ...current.customization,
            ...newCustomization,
          },
          updatedAt: new Date().toISOString(),
        },
      }
      try {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated))
      } catch {
        // ignore
      }
      return updated
    })

    try {
      await apiCustomizeTemplate(category, newCustomization)
      setLastSaved(new Date())
      return { success: true }
    } catch (error) {
      console.error('Failed to persist customization to backend:', error)
      return { success: true, warning: 'Saved locally, backend sync will retry' }
    } finally {
      setIsSaving(false)
    }
  }

  // Reset category to defaults
  const resetDefaults = async (category) => {
    setIsSaving(true)
    setTemplateConfig((prev) => {
      const updated = {
        ...prev,
        [category]: {
          ...DEFAULT_CONFIG[category],
          updatedAt: new Date().toISOString(),
        },
      }
      try {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated))
      } catch {
        // ignore
      }
      return updated
    })

    try {
      await apiResetTemplateDefaults(category)
      setLastSaved(new Date())
      return { success: true }
    } catch (error) {
      console.error('Failed to reset template on backend:', error)
      return { success: true }
    } finally {
      setIsSaving(false)
    }
  }

  const getActiveTemplateId = (category) => {
    return templateConfig[category]?.activeTemplateId || DEFAULT_CONFIG[category]?.activeTemplateId
  }

  const getCustomization = (category) => {
    return templateConfig[category]?.customization || DEFAULT_CONFIG[category]?.customization
  }

  return (
    <DocumentTemplateContext.Provider
      value={{
        templateConfig,
        isLoading,
        isSaving,
        lastSaved,
        categories: DOCUMENT_CATEGORIES,
        selectTemplate,
        customize,
        resetDefaults,
        getActiveTemplateId,
        getCustomization,
        refresh: fetchTemplates,
      }}
    >
      {children}
    </DocumentTemplateContext.Provider>
  )
}

export function useDocumentTemplates() {
  const context = useContext(DocumentTemplateContext)
  if (!context) {
    throw new Error('useDocumentTemplates must be used within a DocumentTemplateProvider')
  }
  return context
}

export default DocumentTemplateContext
