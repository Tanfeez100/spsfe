import React, { useEffect, useMemo, useState } from 'react'
import * as XLSX from 'xlsx'
import { getAllStudents } from '../../Api/students'
import { getLoginType, getUser, emitToast } from '../../Api/auth'
import { migrateFromExcel, cancelMigration } from '../../Api/fees'

const STORAGE_KEY = 'fees_opening_balance_migration_v1'

const REQUIRED_COLUMNS = [
  'roll_no',
  'current_month_total',
  'pending_due',
  'advance',
  'class',
  'section',
]

const REQUIRED_COLUMN_MAP = {
  rollNo: 'roll_no',
  currentMonthTotal: 'current_month_total',
  pendingDue: 'pending_due',
  advance: 'advance',
  class: 'class',
  section: 'section',
}

const normalizeText = (value) => String(value ?? '').trim()
const normalizeHeader = (value) => normalizeText(value).toLowerCase().replace(/[^a-z0-9]/g, '')
const normalizeClassValue = (value) => normalizeText(value).toUpperCase()
const normalizeSectionValue = (value) => normalizeText(value).toUpperCase()

const normalizeRollValue = (value) => {
  const raw = normalizeText(value)
  if (!raw) return ''
  if (/^\d+(\.0+)?$/.test(raw)) {
    return String(parseInt(raw, 10))
  }
  return raw.toUpperCase()
}

const parseAmount = (value) => {
  const raw = normalizeText(value).replace(/,/g, '')
  if (!raw) return null
  const numeric = Number(raw)
  return Number.isFinite(numeric) ? numeric : null
}

const formatAmount = (value) =>
  `Rs. ${Number(value || 0).toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`

const formatDateTime = (isoString) => {
  if (!isoString) return '--'
  const date = new Date(isoString)
  if (Number.isNaN(date.getTime())) return '--'
  return date.toLocaleString('en-IN')
}

const validateYYYYMMFormat = (dateString) => {
  const regex = /^\d{4}-\d{2}$/
  return regex.test(dateString)
}

// Validate month format YYYY-MM
const validateMonthFormat = (month) => {
  if (!month) return false
  const monthRegex = /^\d{4}-(0[1-9]|1[0-2])$/
  return monthRegex.test(month)
}

// Format month value from input (YYYY-MM format)
const formatMonthForAPI = (monthInput) => {
  if (!monthInput || typeof monthInput !== 'string') return null
  const trimmed = monthInput.trim()
  return validateMonthFormat(trimmed) ? trimmed : null
}

function OpeningBalanceMigration() {
  const [migrationMonth, setMigrationMonth] = useState('')
  const [uploadedFileName, setUploadedFileName] = useState('')
  const [uploadedRows, setUploadedRows] = useState([])
  const [parseError, setParseError] = useState('')
  const [selectedFile, setSelectedFile] = useState(null)

  const [students, setStudents] = useState([])
  const [loadingStudents, setLoadingStudents] = useState(false)
  const [studentLoadError, setStudentLoadError] = useState('')

  const [isMigrating, setIsMigrating] = useState(false)
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [isConfirmedByAdmin, setIsConfirmedByAdmin] = useState(false)
  const [migrationHistory, setMigrationHistory] = useState([])

  const user = getUser()
  const loginType = getLoginType()
  const isAdmin = user?.role !== 'teacher' && user?.role !== 'student'

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const parsed = Array.isArray(JSON.parse(stored)) ? JSON.parse(stored) : []
        setMigrationHistory(parsed)
      }
    } catch {
      setMigrationHistory([])
    }
  }, [])

  useEffect(() => {
    if (!isAdmin) return

    let mounted = true
    const run = async () => {
      setLoadingStudents(true)
      setStudentLoadError('')
      try {
        const response = await getAllStudents()
        const records = response?.students || response?.data || []
        if (mounted) {
          setStudents(Array.isArray(records) ? records : [])
        }
      } catch (error) {
        if (mounted) {
          setStudentLoadError(error?.message || 'Failed to load student master data for validation.')
          setStudents([])
        }
      } finally {
        if (mounted) {
          setLoadingStudents(false)
        }
      }
    }

    run()
    return () => {
      mounted = false
    }
  }, [isAdmin])

  const studentLookup = useMemo(() => {
    const classSet = new Set()
    const sectionSet = new Set()
    const rollSet = new Set()
    const classSectionMap = new Map()
    const studentKeySet = new Set()

    students.forEach((student) => {
      const classValue = normalizeClassValue(student?.class ?? student?.Class)
      const sectionValue = normalizeSectionValue(student?.section ?? student?.Section)
      const rollValue = normalizeRollValue(student?.roll_no ?? student?.rollNo ?? student?.Roll)

      if (classValue) classSet.add(classValue)
      if (sectionValue) sectionSet.add(sectionValue)
      if (rollValue) rollSet.add(rollValue)

      if (classValue && sectionValue) {
        if (!classSectionMap.has(classValue)) {
          classSectionMap.set(classValue, new Set())
        }
        classSectionMap.get(classValue).add(sectionValue)
      }

      if (classValue && sectionValue && rollValue) {
        studentKeySet.add(`${classValue}|${sectionValue}|${rollValue}`)
      }
    })

    return { classSet, sectionSet, rollSet, classSectionMap, studentKeySet }
  }, [students])

  const validationRows = useMemo(() => {
    if (!uploadedRows.length) return []

    const duplicateCounter = new Map()
    uploadedRows.forEach((row) => {
      const classValue = normalizeClassValue(row.class)
      const sectionValue = normalizeSectionValue(row.section)
      const rollValue = normalizeRollValue(row.rollNo)
      if (!classValue || !sectionValue || !rollValue) return
      const duplicateKey = `${classValue}|${sectionValue}|${rollValue}`
      duplicateCounter.set(duplicateKey, (duplicateCounter.get(duplicateKey) || 0) + 1)
    })

    return uploadedRows.map((row) => {
      const errors = []
      const classValue = normalizeClassValue(row.class)
      const sectionValue = normalizeSectionValue(row.section)
      const rollValue = normalizeRollValue(row.rollNo)
      const duplicateKey = classValue && sectionValue && rollValue ? `${classValue}|${sectionValue}|${rollValue}` : ''

      if (!classValue) {
        errors.push('Class is required.')
      } else if (!studentLookup.classSet.has(classValue)) {
        errors.push('Class does not exist.')
      }

      if (!sectionValue) {
        errors.push('Section is required.')
      } else {
        const sectionSetForClass = studentLookup.classSectionMap.get(classValue)
        const sectionExists = sectionSetForClass
          ? sectionSetForClass.has(sectionValue)
          : studentLookup.sectionSet.has(sectionValue)

        if (!sectionExists) {
          errors.push('Section does not exist.')
        }
      }

      if (!rollValue) {
        errors.push('Roll No is required.')
      } else if (!studentLookup.rollSet.has(rollValue)) {
        errors.push('Roll does not exist.')
      }

      if (classValue && sectionValue && rollValue && !studentLookup.studentKeySet.has(`${classValue}|${sectionValue}|${rollValue}`)) {
        errors.push('Student match not found for Class + Section + Roll.')
      }

      if (duplicateKey && duplicateCounter.get(duplicateKey) > 1) {
        errors.push('Duplicate roll row found in uploaded file.')
      }

      const currentMonthTotal = parseAmount(row.currentMonthTotal)
      const pendingDue = parseAmount(row.pendingDue)
      const advance = parseAmount(row.advance)

      if (currentMonthTotal === null) {
        errors.push('Current Month Total must be a valid number.')
      } else if (currentMonthTotal < 0) {
        errors.push('Current Month Total cannot be negative.')
      }

      if (pendingDue === null) {
        errors.push('Pending Due must be a valid number.')
      } else if (pendingDue < 0) {
        errors.push('Pending Due cannot be negative.')
      }

      if (advance === null) {
        errors.push('Advance must be a valid number.')
      } else if (advance < 0) {
        errors.push('Advance cannot be negative.')
      }

      return {
        ...row,
        class: normalizeText(row.class),
        section: normalizeText(row.section),
        rollNo: normalizeText(row.rollNo),
        currentMonthTotal: currentMonthTotal ?? row.currentMonthTotal,
        pendingDue: pendingDue ?? row.pendingDue,
        advance: advance ?? row.advance,
        errors,
        isValid: errors.length === 0,
      }
    })
  }, [uploadedRows, studentLookup])

  const validRows = useMemo(() => validationRows.filter((row) => row.isValid), [validationRows])
  const invalidRows = useMemo(() => validationRows.filter((row) => !row.isValid), [validationRows])

  const totalPendingDue = useMemo(
    () => validRows.reduce((sum, row) => sum + (Number(row.pendingDue) || 0), 0),
    [validRows]
  )
  const totalAdvance = useMemo(
    () => validRows.reduce((sum, row) => sum + (Number(row.advance) || 0), 0),
    [validRows]
  )

  const canMigrate =
    migrationMonth &&
    validRows.length > 0 &&
    invalidRows.length === 0 &&
    !loadingStudents &&
    !studentLoadError &&
    !isMigrating

  const handleFileUpload = async (event) => {
    const file = event.target.files?.[0]
    if (!file) return

    setParseError('')
    setUploadedRows([])
    setUploadedFileName(file.name)

    try {
      const fileBuffer = await file.arrayBuffer()
      const workbook = XLSX.read(fileBuffer, { type: 'array' })
      
      if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
        setParseError('No worksheet found in uploaded file.')
        return
      }

      // Process all sheets
      let allRawRows = []
      let headerLookup = null
      
      for (const sheetName of workbook.SheetNames) {
        const worksheet = workbook.Sheets[sheetName]
        const rawRows = XLSX.utils.sheet_to_json(worksheet, { defval: '' })

        if (rawRows.length === 0) {
          continue // Skip empty sheets
        }

        // Get headers from first sheet with data
        if (!headerLookup) {
          const headers = Object.keys(rawRows[0] || {})
          headerLookup = headers.reduce((acc, header) => {
            acc[normalizeHeader(header)] = header
            return acc
          }, {})

          // Check for required columns only on first sheet with data
          const missingColumns = Object.entries(REQUIRED_COLUMN_MAP)
            .filter(([, normalized]) => !headerLookup[normalizeHeader(normalized)])
            .map(([field]) => field)

          if (missingColumns.length > 0) {
            setParseError(`Missing required columns: ${missingColumns.join(', ')}`)
            return
          }
        }

        // Add all rows from this sheet
        allRawRows = allRawRows.concat(rawRows)
      }

      if (allRawRows.length === 0) {
        setParseError('All sheets are empty. Please upload a valid Excel file with data.')
        return
      }

      // Normalize all rows
      const normalizedRows = allRawRows.map((row, index) => ({
        rowNumber: index + 2,
        class: row[headerLookup[normalizeHeader(REQUIRED_COLUMN_MAP.class)]],
        section: row[headerLookup[normalizeHeader(REQUIRED_COLUMN_MAP.section)]],
        rollNo: row[headerLookup[normalizeHeader(REQUIRED_COLUMN_MAP.rollNo)]],
        currentMonthTotal: row[headerLookup[normalizeHeader(REQUIRED_COLUMN_MAP.currentMonthTotal)]],
        pendingDue: row[headerLookup[normalizeHeader(REQUIRED_COLUMN_MAP.pendingDue)]],
        advance: row[headerLookup[normalizeHeader(REQUIRED_COLUMN_MAP.advance)]],
      }))

      setUploadedRows(normalizedRows)
      setSelectedFile(file)
    } catch (error) {
      setParseError(error?.message || 'Failed to parse uploaded file. Please upload a valid Excel file.')
    } finally {
      event.target.value = ''
    }
  }

  const handleDownloadSampleExcel = () => {
    try {
      const sampleData = [
        { class: '1', section: 'A', roll_no: 1, student_name: 'Rahul Kumar', pending_due: 1200, advance: 0, current_month_total: 0 },
        { class: '1', section: 'A', roll_no: 2, student_name: 'Pooja Sharma', pending_due: 0, advance: 500, current_month_total: 0 },
        { class: '1', section: 'B', roll_no: 1, student_name: 'Amit Patel', pending_due: 850, advance: 0, current_month_total: 0 },
        { class: '2', section: 'A', roll_no: 1, student_name: 'Neha Singh', pending_due: 0, advance: 0, current_month_total: 0 },
        { class: '2', section: 'A', roll_no: 2, student_name: 'Vikas Yadav', pending_due: 1500, advance: 0, current_month_total: 0 },
        { class: '3', section: 'A', roll_no: 1, student_name: 'Anjali Verma', pending_due: 600, advance: 0, current_month_total: 0 },
      ]

      const ws = XLSX.utils.json_to_sheet(sampleData)
      ws['!cols'] = [
        { wch: 10 },
        { wch: 10 },
        { wch: 10 },
        { wch: 22 },
        { wch: 16 },
        { wch: 14 },
        { wch: 22 },
      ]

      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, 'Sample_Fee_Migration')
      XLSX.writeFile(wb, 'sample_fee_opening_balance_template.xlsx')
      emitToast('success', 'Sample Excel template downloaded successfully!', 'Template Ready')
    } catch (err) {
      console.error('Failed to generate sample Excel:', err)
      const link = document.createElement('a')
      link.href = '/sample_fee_opening_balance.xlsx'
      link.download = 'sample_fee_opening_balance.xlsx'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    }
  }

  const handleDownloadActiveStudentsTemplate = () => {
    if (!students || students.length === 0) {
      emitToast('warning', 'No active students found in the database.', 'Warning')
      return
    }

    try {
      const sortedStudents = [...students].sort((a, b) => {
        const classCmp = String(a.class || '').localeCompare(String(b.class || ''), undefined, { numeric: true })
        if (classCmp !== 0) return classCmp
        const secCmp = String(a.section || '').localeCompare(String(b.section || ''))
        if (secCmp !== 0) return secCmp
        return Number(a.roll_no || 0) - Number(b.roll_no || 0)
      })

      const rosterData = sortedStudents.map((s) => ({
        class: s.class || '',
        section: s.section || '',
        roll_no: s.roll_no || '',
        student_name: s.name || '',
        pending_due: 0,
        advance: 0,
        current_month_total: 0,
      }))

      const ws = XLSX.utils.json_to_sheet(rosterData)
      ws['!cols'] = [
        { wch: 10 },
        { wch: 10 },
        { wch: 10 },
        { wch: 25 },
        { wch: 16 },
        { wch: 14 },
        { wch: 22 },
      ]

      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, 'Active_Students_Balances')
      const fileName = `active_students_fee_template_${migrationMonth || 'current'}.xlsx`
      XLSX.writeFile(wb, fileName)
      emitToast('success', `Exported template with ${rosterData.length} students from database!`, 'Roster Exported')
    } catch (err) {
      console.error('Failed to export students template:', err)
      emitToast('error', 'Failed to generate pre-filled template.', 'Error')
    }
  }

  const handleConfirmMigration = async () => {
    if (!canMigrate || !isConfirmedByAdmin) return

    setIsMigrating(true)
    setParseError('')

    try {
      // Validate month format (YYYY-MM)
      if (!validateYYYYMMFormat(migrationMonth)) {
        const errorMsg = 'Migration month must be in YYYY-MM format (e.g., 2026-03)'
        setParseError(errorMsg)
        emitToast('error', errorMsg, 'Invalid Format')
        setIsMigrating(false)
        return
      }

      if (!selectedFile) {
        const errorMsg = 'No file selected. Please upload an Excel file.'
        setParseError(errorMsg)
        emitToast('error', errorMsg, 'File Missing')
        setIsMigrating(false)
        return
      }

      // Send Excel file with FormData to batch migration endpoint
      emitToast('info', 'Starting batch migration from Excel...', 'Processing')
      const response = await migrateFromExcel(selectedFile, migrationMonth)

      if (response.success) {
        // Log detailed results
        console.log('Migration Results:', response.results)

        // Create migration report with batch results
        const report = {
          id: Date.now(),
          month: migrationMonth,
          completedAt: new Date().toISOString(),
          uploadedFileName,
          sheets_processed: response.sheets_processed,
          class_sections_processed: response.class_sections_processed,
          total_migrated: response.total_migrated,
          total_errors: response.total_errors,
          results: response.results,
          serverResponse: response,
        }

        const updatedHistory = [...migrationHistory, report]
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedHistory))
        setMigrationHistory(updatedHistory)

        // Reset form
        setShowConfirmModal(false)
        setIsConfirmedByAdmin(false)
        setUploadedRows([])
        setUploadedFileName('')
        setMigrationMonth('')
        setSelectedFile(null)

        // Show success with details
        const successMsg = `Migration completed!\n\n✅ Sheets: ${response.sheets_processed}\n✅ Classes/Sections: ${response.class_sections_processed}\n✅ Total Migrated: ${response.total_migrated}`
        emitToast('success', successMsg, 'Migration Complete')
      } else {
        setParseError(response.message || 'Migration failed. Please try again.')
        emitToast('error', response.message || 'Migration failed', 'Error')
      }
    } catch (error) {
      let errorMessage = error?.message || 'Migration failed. Please try again.'
      let errorTitle = 'Migration Error'
      let isConflictError = false

      // Handle 409 conflict - migration already in progress
      if (error?.response?.status === 409) {
        isConflictError = true
        const conflictMessage = error?.response?.data?.message || 'Migration already in progress'

        if (conflictMessage.includes('already in progress')) {
          const shouldRetry = window.confirm(
            `${conflictMessage}\n\nDo you want to cancel the existing migration and retry?\n\n(This will clear the previous migration lock and start fresh)`
          )

          if (shouldRetry && selectedFile) {
            try {
              setIsMigrating(true)
              emitToast('info', 'Cancelling existing migration...', 'Processing')

              // Cancel the existing migration
              await cancelMigration(migrationMonth)
              emitToast('success', 'Previous migration cancelled', 'Success')

              // Small delay to ensure backend state is updated
              await new Promise((resolve) => setTimeout(resolve, 500))

              // Retry the migration
              emitToast('info', 'Retrying migration...', 'Processing')
              const retryResponse = await migrateFromExcel(selectedFile, migrationMonth)

              if (retryResponse.success) {
                console.log('Retry Migration Results:', retryResponse.results)

                const report = {
                  id: Date.now(),
                  month: migrationMonth,
                  completedAt: new Date().toISOString(),
                  uploadedFileName,
                  sheets_processed: retryResponse.sheets_processed,
                  class_sections_processed: retryResponse.class_sections_processed,
                  total_migrated: retryResponse.total_migrated,
                  total_errors: retryResponse.total_errors,
                  results: retryResponse.results,
                  serverResponse: retryResponse,
                }

                const updatedHistory = [...migrationHistory, report]
                localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedHistory))
                setMigrationHistory(updatedHistory)

                setShowConfirmModal(false)
                setIsConfirmedByAdmin(false)
                setUploadedRows([])
                setUploadedFileName('')
                setMigrationMonth('')
                setSelectedFile(null)

                const successMsg = `Migration completed after retry!\n\n✅ Sheets: ${retryResponse.sheets_processed}\n✅ Classes/Sections: ${retryResponse.class_sections_processed}\n✅ Total Migrated: ${retryResponse.total_migrated}`
                emitToast('success', successMsg, 'Migration Complete')
                setIsMigrating(false)
                return
              } else {
                errorMessage = retryResponse.message || 'Migration failed after retry'
                errorTitle = 'Retry Failed'
              }
            } catch (retryError) {
              errorMessage =
                retryError?.response?.data?.message ||
                retryError?.message ||
                'Retry failed. Please try again.'
              errorTitle = 'Retry Error'
              console.error('Migration retry error:', retryError)
            }
          } else if (shouldRetry && !selectedFile) {
            errorMessage = 'File not available. Please re-upload and try again.'
            errorTitle = 'File Lost'
          } else {
            errorMessage = `${conflictMessage}\n\nPlease wait for the previous migration to complete or contact admin to unlock.`
            errorTitle = 'Migration In Progress'
          }
        } else {
          errorMessage = conflictMessage || 'Migration conflict. Please try again later.'
          errorTitle = 'Conflict'
        }
      } else if (error?.response?.status === 400) {
        errorMessage =
          error?.response?.data?.message ||
          'Invalid file or format. Please check Excel file and month format.'
        errorTitle = 'Bad Request'
      }

      console.error('Migration error:', error)
      setParseError(errorMessage)
      emitToast('error', errorMessage, errorTitle)
    } finally {
      setIsMigrating(false)
    }
  }

  if (!isAdmin) {
    return (
      <div className="space-y-4">
        <h3 className="text-base font-bold text-slate-900">Opening Balance Migration</h3>
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4">
          <p className="text-sm font-semibold text-rose-700">Admin-only access</p>
          <p className="text-xs text-rose-600 mt-1">
            You do not have permission to access Fees Migration Setup.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header & Status */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            Migration Setup
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Opening Balance Migration for Fees module
          </p>
        </div>
        {migrationHistory.length > 0 && (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 px-3 py-1 text-xs font-bold shadow-2xs">
            <span className="material-symbols-outlined text-[15px]">check_circle</span>
            {migrationHistory.length} Migration{migrationHistory.length !== 1 ? 's' : ''} Completed
          </span>
        )}
      </div>

      {/* Blue Guidance Box */}
      <div className="bg-blue-50/80 border border-blue-200/80 rounded-xl p-3.5 flex items-start gap-3">
        <div className="p-1 bg-blue-100 text-blue-700 rounded-full shrink-0 mt-0.5">
          <span className="material-symbols-outlined text-[16px] block">info</span>
        </div>
        <div className="text-xs text-blue-900">
          <span className="font-bold text-blue-950">Multiple uploads are allowed.</span>
          <span className="text-blue-700 ml-1">
            Review the uploaded data carefully. Migration history is saved for reference.
          </span>
        </div>
      </div>

      {/* Migration History (if available) */}
      {migrationHistory.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px] text-slate-500">history</span>
              Recent Migrations History
            </h3>
            <span className="text-xs text-slate-400 font-medium">
              {migrationHistory.length} record{migrationHistory.length !== 1 ? 's' : ''}
            </span>
          </div>
          <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
            {migrationHistory.map((report) => (
              <div
                key={report.id}
                className="rounded-xl border border-emerald-100 bg-emerald-50/40 p-3 hover:bg-emerald-50/70 transition flex flex-col sm:flex-row sm:items-center justify-between gap-2"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-emerald-800">{report.month}</span>
                    <span className="text-[10px] font-semibold text-slate-400">·</span>
                    <span className="text-[11px] text-slate-500 font-medium">
                      {formatDateTime(report.completedAt)}
                    </span>
                  </div>
                  {report.uploadedFileName && (
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      File: <span className="font-medium text-slate-700">{report.uploadedFileName}</span>
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-xs font-bold text-emerald-700 bg-emerald-100/70 px-2.5 py-0.5 rounded-full">
                    {report.total_migrated || report.totalStudents || 0} students migrated
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Step by Step Workflow Cards */}
      <div className="space-y-4">
        {/* Step 1: Select Migration Month */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-3">
          <div className="flex items-center gap-2.5">
            <div className="w-6 h-6 rounded-full bg-slate-900 text-white font-bold text-xs flex items-center justify-center shrink-0">
              1
            </div>
            <h3 className="text-sm font-bold text-slate-800">Select Migration Month</h3>
          </div>
          <div className="max-w-xs space-y-1.5 pl-8.5">
            <label className="block text-xs font-semibold text-slate-700">
              Migration Month (YYYY-MM)
            </label>
            <div className="relative">
              <input
                type="month"
                value={migrationMonth}
                onChange={(event) => setMigrationMonth(event.target.value)}
                className="w-full text-xs font-medium text-slate-800 bg-white border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-100 focus:border-blue-600 outline-none transition shadow-2xs cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Step 2: Upload Excel */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-4">
          <div className="flex items-center gap-2.5">
            <div className="w-6 h-6 rounded-full bg-slate-900 text-white font-bold text-xs flex items-center justify-center shrink-0">
              2
            </div>
            <h3 className="text-sm font-bold text-slate-800">Upload Excel</h3>
          </div>

          <div className="pl-8.5 space-y-4">
            {/* Required Columns Specification */}
            <div className="space-y-1.5">
              <span className="text-xs font-semibold text-slate-600 block">
                Required Columns:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {REQUIRED_COLUMNS.map((column) => (
                  <span
                    key={column}
                    className="text-[11px] font-mono font-medium px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200"
                  >
                    {column}
                  </span>
                ))}
              </div>
            </div>

            {/* Download Sample Excel Templates Card */}
            <div className="bg-slate-50/80 border border-slate-200 rounded-xl p-3.5 flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-emerald-100 text-emerald-700 rounded-lg shrink-0">
                  <span className="material-symbols-outlined text-[20px] block">table_chart</span>
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900">Download Sample Excel Templates</div>
                  <div className="text-[11px] text-slate-500">
                    Download a sample template with dummy examples, or export all current active students ready to fill dues.
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={handleDownloadSampleExcel}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 text-xs font-semibold rounded-lg shadow-2xs transition-colors cursor-pointer"
                  title="Download blank sample Excel template with realistic dummy examples"
                >
                  <span className="material-symbols-outlined text-[15px] text-emerald-600">download</span>
                  Sample Excel (.xlsx)
                </button>

                <button
                  type="button"
                  onClick={handleDownloadActiveStudentsTemplate}
                  disabled={loadingStudents || students.length === 0}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 border border-slate-900 text-white hover:bg-slate-800 text-xs font-semibold rounded-lg shadow-2xs transition-colors cursor-pointer disabled:opacity-50"
                  title="Export active students from database pre-filled with class, section, roll number and name"
                >
                  <span className="material-symbols-outlined text-[15px] text-indigo-300">group</span>
                  Pre-filled Students ({students.length})
                </button>
              </div>
            </div>

            {/* File Upload Dropzone */}
            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-3">
                <label className={`cursor-pointer inline-flex items-center px-4 py-2 border text-xs font-semibold rounded-lg transition-colors shadow-2xs ${
                  migrationMonth
                    ? 'bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100'
                    : 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed'
                }`}>
                  <span className="material-symbols-outlined text-[16px] mr-1.5">upload_file</span>
                  <span>Choose file</span>
                  <input
                    type="file"
                    accept=".xlsx,.xls,.csv"
                    onChange={handleFileUpload}
                    disabled={!migrationMonth}
                    className="hidden"
                  />
                </label>
                <span className="text-xs text-slate-600 font-medium">
                  {uploadedFileName ? (
                    <span className="font-bold text-slate-900">{uploadedFileName}</span>
                  ) : (
                    'No file chosen'
                  )}
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                {migrationMonth
                  ? 'Supported formats: .xlsx, .xls, .csv'
                  : 'Select migration month first in Step 1 to enable upload.'}
              </p>
            </div>
          </div>
        </div>

        {/* Step 3: Preview and Validation */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-6 h-6 rounded-full bg-slate-900 text-white font-bold text-xs flex items-center justify-center shrink-0">
                3
              </div>
              <h3 className="text-sm font-bold text-slate-800">Preview and Validation</h3>
            </div>
            <span className="text-xs font-medium text-slate-400">
              {validationRows.length} rows detected
            </span>
          </div>

          <div className="pl-8.5 space-y-4">
            {loadingStudents && (
              <div className="rounded-xl border border-blue-200 bg-blue-50/60 p-3 flex items-center gap-2">
                <span className="material-symbols-outlined animate-spin text-blue-600 text-[18px]">sync</span>
                <p className="text-xs text-blue-800 font-medium">Loading student master data for validation...</p>
              </div>
            )}

            {studentLoadError && (
              <div className="rounded-xl border border-red-200 bg-red-50 p-3 flex items-center gap-2">
                <span className="material-symbols-outlined text-red-600 text-[18px]">error</span>
                <p className="text-xs text-red-700 font-medium">{studentLoadError}</p>
              </div>
            )}

            {parseError && (
              <div className="rounded-xl border border-red-200 bg-red-50 p-3 flex items-center gap-2">
                <span className="material-symbols-outlined text-red-600 text-[18px]">error</span>
                <p className="text-xs text-red-700 font-medium">{parseError}</p>
              </div>
            )}

            {/* When no file is uploaded */}
            {uploadedRows.length === 0 && !parseError && (
              <div className="border border-dashed border-slate-300 rounded-xl p-8 bg-slate-50/50 flex flex-col items-center justify-center text-center">
                <div className="w-10 h-10 rounded-full bg-slate-200/80 text-slate-400 flex items-center justify-center mb-2">
                  <span className="material-symbols-outlined text-[20px]">table_chart</span>
                </div>
                <div className="text-xs font-semibold text-slate-700">
                  Upload file to preview valid and invalid rows.
                </div>
                <p className="text-[11px] text-slate-400 max-w-sm mt-1">
                  Data verification checks student IDs, ensures non-negative dues, and validates class/section mappings before committal.
                </p>
              </div>
            )}

            {/* When rows are detected */}
            {validationRows.length > 0 && (
              <>
                {/* 5-Metric Summary Cards */}
                <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
                  <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-3 shadow-2xs">
                    <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Total Uploaded</p>
                    <p className="text-lg font-bold text-slate-900 mt-0.5">{validationRows.length}</p>
                  </div>
                  <div className="rounded-xl border border-emerald-200 bg-emerald-50/80 p-3 shadow-2xs">
                    <p className="text-[11px] font-semibold text-emerald-700 uppercase tracking-wider">Valid Records</p>
                    <p className="text-lg font-bold text-emerald-700 mt-0.5">{validRows.length}</p>
                  </div>
                  <div className="rounded-xl border border-rose-200 bg-rose-50/80 p-3 shadow-2xs">
                    <p className="text-[11px] font-semibold text-rose-700 uppercase tracking-wider">Invalid Records</p>
                    <p className="text-lg font-bold text-rose-700 mt-0.5">{invalidRows.length}</p>
                  </div>
                  <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-3 shadow-2xs">
                    <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Total Pending Due</p>
                    <p className="text-lg font-bold text-slate-900 mt-0.5">{formatAmount(totalPendingDue)}</p>
                  </div>
                  <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-3 shadow-2xs">
                    <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Total Advance</p>
                    <p className="text-lg font-bold text-slate-900 mt-0.5">{formatAmount(totalAdvance)}</p>
                  </div>
                </div>

                {/* Valid Records Table */}
                {validRows.length > 0 && (
                  <div className="rounded-xl border border-emerald-200 overflow-hidden shadow-2xs">
                    <div className="px-3.5 py-2.5 bg-emerald-50 border-b border-emerald-200 flex items-center justify-between">
                      <p className="text-xs font-bold text-emerald-800 flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-[16px] text-emerald-600">check_circle</span>
                        Valid Records ({validRows.length})
                      </p>
                      {validRows.length > 50 && (
                        <span className="text-[11px] text-emerald-700 font-medium">
                          Showing first 50 rows
                        </span>
                      )}
                    </div>
                    <div className="overflow-x-auto max-h-72">
                      <table className="w-full text-xs text-left border-collapse">
                        <thead className="bg-emerald-100/50 text-[11px] font-bold text-emerald-900 uppercase tracking-wider sticky top-0">
                          <tr>
                            <th className="px-3 py-2">#</th>
                            <th className="px-3 py-2">Class</th>
                            <th className="px-3 py-2">Section</th>
                            <th className="px-3 py-2">Roll No</th>
                            <th className="px-3 py-2 text-right">Current Month Total</th>
                            <th className="px-3 py-2 text-right">Pending Due</th>
                            <th className="px-3 py-2 text-right">Advance</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-emerald-50 bg-white">
                          {validRows.slice(0, 50).map((row) => (
                            <tr key={`valid-${row.rowNumber}`} className="hover:bg-emerald-50/40 transition-colors">
                              <td className="px-3 py-2 font-mono text-slate-500">{row.rowNumber}</td>
                              <td className="px-3 py-2 font-semibold text-slate-800">{row.class}</td>
                              <td className="px-3 py-2 font-semibold text-slate-800">{row.section}</td>
                              <td className="px-3 py-2 font-semibold text-slate-800">{row.rollNo}</td>
                              <td className="px-3 py-2 text-right text-slate-700">{formatAmount(row.currentMonthTotal)}</td>
                              <td className="px-3 py-2 text-right font-semibold text-amber-700">{formatAmount(row.pendingDue)}</td>
                              <td className="px-3 py-2 text-right font-semibold text-emerald-700">{formatAmount(row.advance)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Invalid Records Table */}
                {invalidRows.length > 0 && (
                  <div className="rounded-xl border border-rose-200 overflow-hidden shadow-2xs">
                    <div className="px-3.5 py-2.5 bg-rose-50 border-b border-rose-200">
                      <p className="text-xs font-bold text-rose-800 flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-[16px] text-rose-600">error</span>
                        Invalid Records with Validation Errors ({invalidRows.length})
                      </p>
                    </div>
                    <div className="overflow-x-auto max-h-72">
                      <table className="w-full text-xs text-left border-collapse">
                        <thead className="bg-rose-100/50 text-[11px] font-bold text-rose-900 uppercase tracking-wider sticky top-0">
                          <tr>
                            <th className="px-3 py-2">#</th>
                            <th className="px-3 py-2">Class</th>
                            <th className="px-3 py-2">Section</th>
                            <th className="px-3 py-2">Roll No</th>
                            <th className="px-3 py-2">Validation Errors</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-rose-50 bg-white">
                          {invalidRows.map((row) => (
                            <tr key={`invalid-${row.rowNumber}`} className="hover:bg-rose-50/40 transition-colors">
                              <td className="px-3 py-2 font-mono text-slate-500">{row.rowNumber}</td>
                              <td className="px-3 py-2 font-semibold text-slate-800">{row.class}</td>
                              <td className="px-3 py-2 font-semibold text-slate-800">{row.section}</td>
                              <td className="px-3 py-2 font-semibold text-slate-800">{row.rollNo}</td>
                              <td className="px-3 py-2 text-rose-700 font-medium">
                                <ul className="list-disc list-inside space-y-0.5">
                                  {row.errors.map((err, i) => (
                                    <li key={i}>{err}</li>
                                  ))}
                                </ul>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Step 4: Confirm Migration */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-3">
          <div className="flex items-center gap-2.5">
            <div className="w-6 h-6 rounded-full bg-slate-900 text-white font-bold text-xs flex items-center justify-center shrink-0">
              4
            </div>
            <h3 className="text-sm font-bold text-slate-800">Confirm Migration</h3>
          </div>
          <div className="pl-8.5 space-y-3">
            <p className="text-xs text-slate-500">
              Migration is allowed only when all rows are valid and no errors remain.
            </p>
            <button
              type="button"
              onClick={() => setShowConfirmModal(true)}
              disabled={!canMigrate}
              className={`inline-flex items-center gap-2 px-5 py-2.5 text-xs font-bold rounded-xl transition-all shadow-2xs ${
                canMigrate
                  ? 'bg-slate-900 hover:bg-slate-800 text-white cursor-pointer active:scale-98'
                  : 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed'
              }`}
            >
              {isMigrating ? (
                <>
                  <span className="material-symbols-outlined animate-spin text-[16px]">sync</span>
                  Migrating...
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[16px] text-emerald-400">bolt</span>
                  Run Migration
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white border border-slate-200 shadow-2xl p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
              <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-[20px]">drive_folder_upload</span>
              </div>
              <div>
                <h4 className="text-base font-bold text-slate-900">Confirm Opening Balance Migration</h4>
                <p className="text-xs text-slate-400">Month: {migrationMonth || '--'}</p>
              </div>
            </div>

            <div className="rounded-xl border border-blue-200 bg-blue-50/70 p-3.5 space-y-1">
              <p className="text-xs font-bold text-blue-900">
                Please verify the data before confirming.
              </p>
              <p className="text-[11px] text-blue-700">
                Opening balance migration for {migrationMonth || '--'} will be sent to the server for processing. Multiple uploads are allowed.
              </p>
            </div>

            <label className="flex items-start gap-2.5 cursor-pointer p-2.5 rounded-xl hover:bg-slate-50 transition border border-transparent hover:border-slate-200">
              <input
                type="checkbox"
                checked={isConfirmedByAdmin}
                onChange={(event) => setIsConfirmedByAdmin(event.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
              />
              <span className="text-xs font-semibold text-slate-700">
                I confirm this migration is correct and verified.
              </span>
            </label>

            <div className="pt-3 border-t border-slate-100 flex flex-col-reverse sm:flex-row sm:justify-end gap-2.5">
              <button
                type="button"
                onClick={() => {
                  setShowConfirmModal(false)
                  setIsConfirmedByAdmin(false)
                }}
                className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 text-xs font-bold transition cursor-pointer"
                disabled={isMigrating}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmMigration}
                disabled={!isConfirmedByAdmin || isMigrating}
                className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2 shadow-2xs transition active:scale-98 cursor-pointer"
              >
                {isMigrating ? (
                  <>
                    <span className="material-symbols-outlined animate-spin text-[16px]">sync</span>
                    Processing...
                  </>
                ) : (
                  'Confirm and Migrate'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default OpeningBalanceMigration

