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
        <h3 className="text-lg font-bold text-slate-900 dark:text-white">Opening Balance Migration</h3>
        <div className="rounded-xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 p-4">
          <p className="text-sm font-semibold text-red-700 dark:text-red-300">Admin-only access</p>
          <p className="text-sm text-red-600 dark:text-red-400 mt-1">
            You do not have permission to access Fees Migration Setup.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white">Migration Setup</h3>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            Opening Balance Migration for Fees module
          </p>
        </div>
        {migrationHistory.length > 0 && (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 px-3 py-1.5 text-xs font-bold">
            <span className="material-symbols-outlined text-sm">check_circle</span>
            {migrationHistory.length} Migration{migrationHistory.length !== 1 ? 's' : ''}
          </span>
        )}
      </div>

      <div className="rounded-xl border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20 p-4">
        <div className="flex items-start gap-2">
          <span className="material-symbols-outlined text-blue-600 dark:text-blue-400">info</span>
          <div>
            <p className="text-sm font-bold text-blue-700 dark:text-blue-300">Multiple uploads are allowed.</p>
            <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
              Review the uploaded data carefully. Migration history is saved for reference.
            </p>
          </div>
        </div>
      </div>

      {migrationHistory.length > 0 && (
        <div className="space-y-3">
          <p className="text-sm font-bold text-slate-700 dark:text-slate-300">Recent Migrations</p>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {migrationHistory.map((report) => (
              <div key={report.id} className="rounded-lg border border-emerald-200 dark:border-emerald-700 bg-emerald-50/50 dark:bg-emerald-900/20 p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-emerald-700 dark:text-emerald-300">{report.month}</p>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">{formatDateTime(report.completedAt)}</p>
                  </div>
                  <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">{report.totalStudents} students</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-4">
        {/* Step 1 */}
        <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/50 p-4">
          <div className="flex items-center gap-2 mb-3">
            <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-cyan-500 text-white text-xs font-bold">1</span>
            <h4 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">Select Migration Month</h4>
          </div>
          <div className="max-w-sm">
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Migration Month (YYYY-MM)</label>
            <input
              type="month"
              value={migrationMonth}
              onChange={(event) => setMigrationMonth(event.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-cyan-200/30 dark:border-cyan-700/50 bg-cyan-50/30 dark:bg-cyan-900/10 text-slate-900 dark:text-white focus:ring-2 focus:ring-cyan-400/50 focus:border-cyan-400"
            />
          </div>
        </div>

        {/* Step 2 */}
        <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/50 p-4">
          <div className="flex items-center gap-2 mb-3">
            <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-cyan-500 text-white text-xs font-bold">2</span>
            <h4 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">Upload Excel</h4>
          </div>

          <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
            Required Columns
          </label>
          <div className="flex flex-wrap gap-2 mb-4">
            {REQUIRED_COLUMNS.map((column) => (
              <span
                key={column}
                className="inline-flex items-center rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-2.5 py-1 text-xs font-medium"
              >
                {column}
              </span>
            ))}
          </div>

          {/* Download Sample Templates Card */}
          <div className="mb-4 p-3.5 rounded-xl border border-blue-200 dark:border-blue-900/50 bg-gradient-to-r from-blue-50/80 to-indigo-50/50 dark:from-blue-950/30 dark:to-indigo-950/30 shadow-2xs">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <p className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[18px] text-blue-600 dark:text-blue-400">table_chart</span>
                  Download Sample Excel Templates
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  Download a sample template with dummy examples, or export all current active students ready to fill dues.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={handleDownloadSampleExcel}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-700 shadow-2xs transition cursor-pointer"
                  title="Download blank sample Excel template with realistic dummy examples"
                >
                  <span className="material-symbols-outlined text-[16px] text-emerald-600">download</span>
                  Sample Excel (.xlsx)
                </button>

                <button
                  type="button"
                  onClick={handleDownloadActiveStudentsTemplate}
                  disabled={loadingStudents || students.length === 0}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#132c4e] hover:bg-[#0f1e36] text-white text-xs font-bold shadow-2xs transition disabled:opacity-50 cursor-pointer"
                  title="Export active students from database pre-filled with class, section, roll number and name"
                >
                  <span className="material-symbols-outlined text-[16px]">group</span>
                  Pre-filled Students ({students.length})
                </button>
              </div>
            </div>
          </div>

          <input
            type="file"
            accept=".xlsx,.xls,.csv"
            onChange={handleFileUpload}
            disabled={!migrationMonth}
            className="block w-full text-sm text-slate-700 dark:text-slate-300 file:mr-3 file:rounded-lg file:border-0 file:bg-cyan-500 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-cyan-500/90 file:shadow-lg file:shadow-cyan-500/20 disabled:opacity-60"
          />
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
            {migrationMonth
              ? 'Upload .xlsx or .xls file to continue.'
              : 'Select migration month first to enable upload.'}
          </p>
          {uploadedFileName && (
            <p className="text-xs text-slate-600 dark:text-slate-300 mt-2">
              File selected: <span className="font-semibold">{uploadedFileName}</span>
            </p>
          )}
        </div>

        {/* Step 3 */}
        <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/50 p-4 space-y-4">
          <div className="flex items-center gap-2">
            <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-cyan-500 text-white text-xs font-bold">3</span>
            <h4 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">Preview and Validation</h4>
          </div>

          {loadingStudents && (
            <div className="rounded-lg border border-cyan-200/30 dark:border-cyan-700/50 bg-cyan-50/30 dark:bg-cyan-900/10 p-3 flex items-center gap-2">
              <span className="material-symbols-outlined animate-spin text-cyan-200">sync</span>
              <p className="text-sm text-cyan-200">Loading student master data for validation...</p>
            </div>
          )}

          {studentLoadError && (
            <div className="rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 p-3">
              <p className="text-sm font-semibold text-red-700 dark:text-red-300">{studentLoadError}</p>
            </div>
          )}

          {parseError && (
            <div className="rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 p-3">
              <p className="text-sm font-semibold text-red-700 dark:text-red-300">{parseError}</p>
            </div>
          )}

          {validationRows.length > 0 && (
            <>
              <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
                <div className="rounded-lg border border-slate-200 dark:border-slate-700 p-3">
                  <p className="text-xs text-slate-500 dark:text-slate-400">Total Uploaded</p>
                  <p className="text-lg font-bold text-slate-900 dark:text-white">{validationRows.length}</p>
                </div>
                <div className="rounded-lg border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-900/20 p-3">
                  <p className="text-xs text-emerald-600 dark:text-emerald-300">Valid Records</p>
                  <p className="text-lg font-bold text-emerald-700 dark:text-emerald-200">{validRows.length}</p>
                </div>
                <div className="rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 p-3">
                  <p className="text-xs text-red-600 dark:text-red-300">Invalid Records</p>
                  <p className="text-lg font-bold text-red-700 dark:text-red-200">{invalidRows.length}</p>
                </div>
                <div className="rounded-lg border border-slate-200 dark:border-slate-700 p-3">
                  <p className="text-xs text-slate-500 dark:text-slate-400">Total Pending Due</p>
                  <p className="text-lg font-bold text-slate-900 dark:text-white">{formatAmount(totalPendingDue)}</p>
                </div>
                <div className="rounded-lg border border-slate-200 dark:border-slate-700 p-3">
                  <p className="text-xs text-slate-500 dark:text-slate-400">Total Advance</p>
                  <p className="text-lg font-bold text-slate-900 dark:text-white">{formatAmount(totalAdvance)}</p>
                </div>
              </div>

              {validRows.length > 0 && (
                <div className="rounded-lg border border-emerald-200 dark:border-emerald-700 overflow-hidden">
                  <div className="px-3 py-2 bg-emerald-50 dark:bg-emerald-900/20 border-b border-emerald-200 dark:border-emerald-700">
                    <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-300">Valid Records (Green)</p>
                  </div>
                  <div className="overflow-x-auto table-scrollbar" style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgb(99, 126, 153) rgb(224, 242, 254)' }}>
                    <table className="w-full text-xs sm:text-sm">
                      <thead className="bg-emerald-100/70 dark:bg-emerald-900/30">
                        <tr>
                          <th className="px-3 py-2 text-left">#</th>
                          <th className="px-3 py-2 text-left">Class</th>
                          <th className="px-3 py-2 text-left">Section</th>
                          <th className="px-3 py-2 text-left">Roll No</th>
                          <th className="px-3 py-2 text-right">Current Month Total</th>
                          <th className="px-3 py-2 text-right">Pending Due</th>
                          <th className="px-3 py-2 text-right">Advance</th>
                        </tr>
                      </thead>
                      <tbody>
                        {validRows.slice(0, 50).map((row) => (
                          <tr key={`valid-${row.rowNumber}`} className="border-b border-emerald-100 dark:border-emerald-900/30">
                            <td className="px-3 py-2">{row.rowNumber}</td>
                            <td className="px-3 py-2">{row.class}</td>
                            <td className="px-3 py-2">{row.section}</td>
                            <td className="px-3 py-2">{row.rollNo}</td>
                            <td className="px-3 py-2 text-right">{formatAmount(row.currentMonthTotal)}</td>
                            <td className="px-3 py-2 text-right">{formatAmount(row.pendingDue)}</td>
                            <td className="px-3 py-2 text-right">{formatAmount(row.advance)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {validRows.length > 50 && (
                    <p className="px-3 py-2 text-xs text-emerald-700 dark:text-emerald-300">
                      Showing first 50 rows out of {validRows.length} valid records.
                    </p>
                  )}
                </div>
              )}

              {invalidRows.length > 0 && (
                <div className="rounded-lg border border-red-200 dark:border-red-700 overflow-hidden">
                  <div className="px-3 py-2 bg-red-50 dark:bg-red-900/20 border-b border-red-200 dark:border-red-700">
                    <p className="text-sm font-semibold text-red-700 dark:text-red-300">Invalid Records (Red)</p>
                  </div>
                  <div className="overflow-x-auto table-scrollbar" style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgb(99, 126, 153) rgb(224, 242, 254)' }}>
                    <table className="w-full text-xs sm:text-sm">
                      <thead className="bg-red-100/70 dark:bg-red-900/30">
                        <tr>
                          <th className="px-3 py-2 text-left">#</th>
                          <th className="px-3 py-2 text-left">Class</th>
                          <th className="px-3 py-2 text-left">Section</th>
                          <th className="px-3 py-2 text-left">Roll No</th>
                          <th className="px-3 py-2 text-left">Errors</th>
                        </tr>
                      </thead>
                      <tbody>
                        {invalidRows.map((row) => (
                          <tr key={`invalid-${row.rowNumber}`} className="border-b border-red-100 dark:border-red-900/30">
                            <td className="px-3 py-2">{row.rowNumber}</td>
                            <td className="px-3 py-2">{row.class}</td>
                            <td className="px-3 py-2">{row.section}</td>
                            <td className="px-3 py-2">{row.rollNo}</td>
                            <td className="px-3 py-2 text-red-700 dark:text-red-300">
                              {row.errors.join(' ')}
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

          {uploadedRows.length === 0 && !parseError && (
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Upload file to preview valid and invalid rows.
            </p>
          )}
        </div>

        {/* Step 4 */}
        <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/50 p-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-cyan-500 text-white text-xs font-bold">4</span>
            <h4 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">Confirm Migration</h4>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
            Migration is allowed only when all rows are valid and no errors remain.
          </p>
          <button
            type="button"
            onClick={() => setShowConfirmModal(true)}
            disabled={!canMigrate}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-cyan-500 text-white font-semibold hover:bg-cyan-500/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-cyan-500/20"
          >
            {isMigrating ? (
              <>
                <span className="material-symbols-outlined animate-spin text-sm">sync</span>
                Migrating...
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-sm">send</span>
                Run Migration
              </>
            )}
          </button>
        </div>
      </div>

      {showConfirmModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-2xl p-5">
            <h4 className="text-lg font-black text-slate-900 dark:text-white">Confirm Opening Balance Migration</h4>
            <div className="mt-4 rounded-xl border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20 p-3">
              <p className="text-sm font-semibold text-blue-700 dark:text-blue-300">
                Please verify the data before confirming.
              </p>
              <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                Opening balance migration for {migrationMonth || '--'} will be sent to the server for processing. Multiple uploads are allowed.
              </p>
            </div>

            <label className="mt-4 flex items-start gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isConfirmedByAdmin}
                onChange={(event) => setIsConfirmedByAdmin(event.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-slate-300 text-cyan-500 focus:ring-cyan-400"
              />
              <span className="text-sm text-slate-700 dark:text-slate-300">
                I confirm this migration is correct.
              </span>
            </label>

            <div className="mt-5 flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setShowConfirmModal(false)
                  setIsConfirmedByAdmin(false)
                }}
                className="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                disabled={isMigrating}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmMigration}
                disabled={!isConfirmedByAdmin || isMigrating}
                className="px-4 py-2 rounded-lg bg-cyan-500 text-white font-semibold hover:bg-cyan-500/90 disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20"
              >
                {isMigrating ? (
                  <>
                    <span className="material-symbols-outlined animate-spin text-sm">sync</span>
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

