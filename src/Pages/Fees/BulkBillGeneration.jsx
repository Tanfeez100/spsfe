import React, { useState, useEffect } from 'react'
import { generateBulkBills, generateBillsForAllClasses, downloadBillsPDF } from '../../Api/fees'
import { CLASS_OPTIONS } from '../../constants/schoolOptions'

function BulkBillGeneration() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [formData, setFormData] = useState({
    class: '',
    month: '',
    include_annual_fee: false,
    include_exam_fee: false,
    include_computer_fee: false
  })
  const [generateForAll, setGenerateForAll] = useState(false)

  // Auto-hide success message after 5 seconds
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => {
        setSuccess('')
      }, 5000)
      return () => clearTimeout(timer)
    }
  }, [success])

  // Auto-hide error message after 8 seconds
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        setError('')
      }, 8000)
      return () => clearTimeout(timer)
    }
  }, [error])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    // Frontend validation: Check if at least one fee is selected
    const hasAnyFeeSelected = 
      formData.include_annual_fee || 
      formData.include_exam_fee || 
      formData.include_computer_fee

    if (!hasAnyFeeSelected) {
      setError('No fees selected. Please select at least one fee type.')
      return
    }

    setLoading(true)

    try {
      let response
      
      if (generateForAll) {
        // Generate for all classes
        const payload = {
          month: formData.month,
          include_annual_fee: formData.include_annual_fee,
          include_exam_fee: formData.include_exam_fee,
          include_computer_fee: formData.include_computer_fee
        }
        response = await generateBillsForAllClasses(payload)
      } else {
        // Generate for specific class
        if (!formData.class) {
          setError('Please enter Class')
          setLoading(false)
          return
        }
        const payload = {
          class: formData.class,
          month: formData.month,
          include_annual_fee: formData.include_annual_fee,
          include_exam_fee: formData.include_exam_fee,
          include_computer_fee: formData.include_computer_fee
        }
        response = await generateBulkBills(payload)
      }
      // Handle different response structures
      if (response.message || response.successCount !== undefined) {
        const successMsg = response.message || 'Bills generated successfully!'
        const countInfo = response.successCount !== undefined 
          ? ` (${response.successCount} students${response.errorCount > 0 ? `, ${response.errorCount} errors` : ''})`
          : ''
        setSuccess(`${successMsg}${countInfo}`)
        // Reset form
        setFormData({
          class: '',
          month: '',
          include_annual_fee: false,
          include_exam_fee: false,
          include_computer_fee: false
        })
        setGenerateForAll(false)
      } else {
        // Check if it's an error message
        const errorMsg = response.message || 'Failed to generate bills'
        // Add helpful context if it's about fees not being selected
        if (errorMsg.toLowerCase().includes('no fees') || errorMsg.toLowerCase().includes('fee')) {
          setError(`${errorMsg}. Note: Make sure the selected fee types are defined in Fee Structure for this class.`)
        } else {
          setError(errorMsg)
        }
      }
    } catch (err) {
      // Handle different error structures
      const errorMessage = err?.message || err?.data?.message || err?.response?.data?.message || 'Failed to generate bulk bills'
      // Add helpful context
      if (errorMessage.toLowerCase().includes('no fees') || errorMessage.toLowerCase().includes('fee')) {
        setError(`${errorMessage} Note: Make sure the selected fee types are defined in Fee Structure for this class and section.`)
      } else {
        setError(errorMessage)
      }
    } finally {
      setLoading(false)
    }
  }

  const handleDownloadPDF = async () => {
    if (!formData.class || !formData.month) {
      setError('Please fill Class and Month to download PDF')
      return
    }

    setError('')
    setLoading(true)

    try {
      const blob = await downloadBillsPDF(formData.class, formData.month, '')
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `bills-${formData.class}-${formData.month}.pdf`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      setSuccess('PDF downloaded successfully')
    } catch (err) {
      setError(err?.message || 'Failed to download PDF')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-bold text-slate-900 dark:text-white">Bulk Bill Generation</h3>

      {/* Messages */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 flex items-start justify-between gap-3">
          <div className="flex-1">
            <p className="text-sm text-red-700 dark:text-red-300 font-medium">{error}</p>
            {error.toLowerCase().includes('fee structure') && (
              <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                💡 Tip: Go to "Fee Structure" tab and create fee structures for this class and section first.
              </p>
            )}
          </div>
          <button
            onClick={() => setError('')}
            className="text-red-700 dark:text-red-300 hover:text-red-900 dark:hover:text-red-100 flex-shrink-0"
          >
            <span className="material-symbols-outlined text-sm">close</span>
          </button>
        </div>
      )}
      {success && (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 flex items-start justify-between gap-3">
          <div className="flex-1">
            <p className="text-sm font-semibold text-green-700 dark:text-green-300">{success}</p>
            {success.includes('students') && (
              <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                ✅ Bills have been generated and are ready for download.
              </p>
            )}
          </div>
          <button
            onClick={() => setSuccess('')}
            className="text-green-700 dark:text-green-300 hover:text-green-900 dark:hover:text-green-100 flex-shrink-0"
          >
            <span className="material-symbols-outlined text-sm">close</span>
          </button>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Generate For All Classes Toggle */}
        <div className="bg-slate-50 dark:bg-slate-900/50 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={generateForAll}
              onChange={(e) => {
                setGenerateForAll(e.target.checked)
                if (e.target.checked) {
                  setFormData({ ...formData, class: '' })
                }
              }}
              className="w-5 h-5 text-cyan-500 rounded focus:ring-2 focus:ring-cyan-400"
            />
            <div>
              <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">Generate for All Classes</span>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">If checked, bills will be generated for all classes</p>
            </div>
          </label>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Class {!generateForAll && <span className="text-red-500">*</span>}
            </label>
            <select
              required={!generateForAll}
              disabled={generateForAll}
              value={formData.class}
              onChange={(e) => setFormData({ ...formData, class: e.target.value })}
              className="w-full px-3 py-2 border border-cyan-200/30 dark:border-cyan-700/50 rounded-lg bg-cyan-50/30 dark:bg-cyan-900/10 text-slate-900 dark:text-white focus:ring-2 focus:ring-cyan-400/50 focus:border-cyan-400 disabled:bg-slate-100 dark:disabled:bg-slate-800 disabled:cursor-not-allowed"
            >
              <option value="">{generateForAll ? "Not required for all classes" : "Select Class"}</option>
              {CLASS_OPTIONS.map((cls) => (
                <option key={cls} value={cls}>
                  Class {cls}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Month *</label>
            <input
              type="month"
              required
              value={formData.month}
              onChange={(e) => setFormData({ ...formData, month: e.target.value })}
              className="w-full px-3 py-2 border border-cyan-200/30 dark:border-cyan-700/50 rounded-lg bg-cyan-50/30 dark:bg-cyan-900/10 text-slate-900 dark:text-white focus:ring-2 focus:ring-cyan-400/50 focus:border-cyan-400"
            />
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Format: YYYY-MM (e.g., 2026-03)</p>
          </div>
        </div>

        {/* Checkboxes */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">Include Fees: <span className="text-red-500">*</span></p>
            <span className="text-xs text-slate-500 dark:text-slate-400">(Must be defined in Fee Structure)</span>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <label className="flex items-center gap-3 cursor-pointer p-3 border border-cyan-200/30 dark:border-cyan-700/50 rounded-lg hover:bg-cyan-50/30 dark:hover:bg-cyan-900/10 transition-colors">
              <input
                type="checkbox"
                checked={formData.include_annual_fee}
                onChange={(e) => setFormData({ ...formData, include_annual_fee: e.target.checked })}
                className="w-5 h-5 text-cyan-500 rounded focus:ring-2 focus:ring-cyan-400"
              />
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Annual Fee</span>
            </label>

            <label className="flex items-center gap-3 cursor-pointer p-3 border border-cyan-200/30 dark:border-cyan-700/50 rounded-lg hover:bg-cyan-50/30 dark:hover:bg-cyan-900/10 transition-colors">
              <input
                type="checkbox"
                checked={formData.include_exam_fee}
                onChange={(e) => setFormData({ ...formData, include_exam_fee: e.target.checked })}
                className="w-5 h-5 text-cyan-500 rounded focus:ring-2 focus:ring-cyan-400"
              />
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Exam Fee</span>
            </label>

            <label className="flex items-center gap-3 cursor-pointer p-3 border border-cyan-200/30 dark:border-cyan-700/50 rounded-lg hover:bg-cyan-50/30 dark:hover:bg-cyan-900/10 transition-colors">
              <input
                type="checkbox"
                checked={formData.include_computer_fee}
                onChange={(e) => setFormData({ ...formData, include_computer_fee: e.target.checked })}
                className="w-5 h-5 text-cyan-500 rounded focus:ring-2 focus:ring-cyan-400"
              />
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Computer Fee</span>
            </label>
          </div>
        </div>

        <div className="flex gap-3 pt-4">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 px-4 py-2 bg-cyan-500 text-white rounded-lg hover:bg-cyan-500/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20"
          >
            {loading ? (
              <>
                <span className="material-symbols-outlined animate-spin text-sm">sync</span>
                Generating...
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-sm">receipt_long</span>
                Generate Bills
              </>
            )}
          </button>
          <button
            type="button"
            onClick={handleDownloadPDF}
            disabled={loading || !formData.class || !formData.month}
            className="px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-sm">download</span>
            Download PDF
          </button>
        </div>
      </form>
    </div>
  )
}

export default BulkBillGeneration

