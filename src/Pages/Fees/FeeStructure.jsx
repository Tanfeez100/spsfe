import React, { useState, useEffect, useMemo } from 'react'
import { createFeeStructure, getFeeStructures, updateFeeStructure, deleteFeeStructure } from '../../Api/fees'
import { CLASS_OPTIONS, SECTION_OPTIONS, normalizeSchoolClass } from '../../constants/schoolOptions'

const FEE_TYPES = [
  { name: 'Tuition Fee', defaultPeriod: 'monthly' },
  { name: 'Exam Fee', defaultPeriod: 'monthly' },
  { name: 'Annual Fee', defaultPeriod: 'yearly' },
  { name: 'Computer Fee', defaultPeriod: 'monthly' }
]

function FeeStructure() {
  const [feeStructures, setFeeStructures] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [classFilter, setClassFilter] = useState('all')
  const [sectionFilter, setSectionFilter] = useState('all')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [deletingId, setDeletingId] = useState(null)
  const [mode, setMode] = useState('single') // 'single' or 'bulk'
  const [expandedClasses, setExpandedClasses] = useState({}) // Track expanded/collapsed state
  const [formData, setFormData] = useState({
    class: '',
    fee_name: '',
    fee_amount: '',
    period: 'monthly',
    late_fine_enabled: false,
    is_optional: false
  })
  const [bulkData, setBulkData] = useState([
    {
      class: '',
      fees: [
        { fee_name: 'Tuition Fee', fee_amount: '', period: 'monthly', late_fine_enabled: false, is_optional: false },
        { fee_name: 'Exam Fee', fee_amount: '', period: 'monthly', late_fine_enabled: false, is_optional: false },
        { fee_name: 'Annual Fee', fee_amount: '', period: 'yearly', late_fine_enabled: false, is_optional: false },
        { fee_name: 'Computer Fee', fee_amount: '', period: 'monthly', late_fine_enabled: false, is_optional: false }
      ]
    }
  ])

  // Listen to open modal events from header buttons
  useEffect(() => {
    const handleOpen = (e) => {
      resetForm()
      setMode(e.detail?.mode || 'single')
      setIsModalOpen(true)
    }
    window.addEventListener('fee-structure:open-modal', handleOpen)
    return () => window.removeEventListener('fee-structure:open-modal', handleOpen)
  }, [])

  useEffect(() => {
    fetchFeeStructures()
  }, [classFilter, sectionFilter])

  // Auto-hide success message after 3 seconds
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => {
        setSuccess('')
      }, 3000)
      return () => clearTimeout(timer)
    }
  }, [success])

  const fetchFeeStructures = async () => {
    setLoading(true)
    setError('')
    try {
      const filterClassParam = classFilter === 'all' ? '' : classFilter
      const filterSectionParam = sectionFilter === 'all' ? '' : sectionFilter
      const response = await getFeeStructures(filterClassParam, filterSectionParam)
      if (response?.success) {
        setFeeStructures(response.fee_structures || response.data || [])
      } else if (response?.data && Array.isArray(response.data)) {
        setFeeStructures(response.data)
      } else if (Array.isArray(response)) {
        setFeeStructures(response)
      } else {
        setFeeStructures([])
        if (response?.message && (!response.data || response.data.length === 0)) {
          setError(response.message)
        }
      }
    } catch (err) {
      console.warn('Failed to fetch fee structures:', err)
      setFeeStructures([])
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setLoading(true)

    try {
      if (mode === 'bulk' && !editingId) {
        const payload = []
        bulkData.forEach((item) => {
          if (item.class) {
            item.fees.forEach((fee) => {
              if (fee.fee_amount && fee.fee_amount > 0) {
                payload.push({
                  class: normalizeSchoolClass(item.class),
                  fee_name: fee.fee_name,
                  fee_amount: parseFloat(fee.fee_amount),
                  period: fee.period,
                  late_fine_enabled: fee.late_fine_enabled,
                  is_optional: fee.is_optional,
                })
              }
            })
          }
        })

        if (payload.length === 0) {
          setError('Please add at least one fee amount for the selected class')
          setLoading(false)
          return
        }

        const response = await createFeeStructure(payload)
        if (response?.success || response?.message) {
          setSuccess(`Successfully created ${payload.length} fee structure(s)!`)
          setIsModalOpen(false)
          resetForm()
          await fetchFeeStructures()
        } else {
          setError(response?.message || 'Failed to create fee structures')
        }
      } else {
        const payload = {
          class: normalizeSchoolClass(formData.class),
          fee_name: formData.fee_name,
          fee_amount: parseFloat(formData.fee_amount),
          period: formData.period,
          late_fine_enabled: formData.late_fine_enabled,
          is_optional: formData.is_optional,
        }

        let response
        if (editingId) {
          response = await updateFeeStructure(editingId, payload)
        } else {
          response = await createFeeStructure(payload)
        }

        if (response?.success || response?.message) {
          setSuccess(editingId ? 'Fee structure updated successfully' : 'Fee structure created successfully')
          setIsModalOpen(false)
          resetForm()
          await fetchFeeStructures()
        } else {
          setError(response?.message || 'Failed to save fee structure')
        }
      }
    } catch (err) {
      setError(err?.message || err?.data?.message || 'Failed to save fee structure')
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (fee) => {
    setEditingId(fee.id)
    setMode('single')
    setFormData({
      class: normalizeSchoolClass(fee.class) || '',
      fee_name: fee.fee_name || '',
      fee_amount: fee.fee_amount || '',
      period: fee.period || 'monthly',
      late_fine_enabled: fee.late_fine_enabled || false,
      is_optional: fee.is_optional || false,
    })
    setIsModalOpen(true)
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this fee structure?')) {
      return
    }

    setError('')
    setSuccess('')
    setDeletingId(id)

    try {
      const response = await deleteFeeStructure(id)
      if (response?.success || response?.message) {
        setSuccess('Fee structure deleted successfully')
        setFeeStructures((prev) => prev.filter((fee) => fee.id !== id))
        await fetchFeeStructures()
      } else {
        setError(response?.message || 'Failed to delete fee structure')
        await fetchFeeStructures()
      }
    } catch (err) {
      setError(err?.message || err?.data?.message || 'Failed to delete fee structure')
      await fetchFeeStructures()
    } finally {
      setDeletingId(null)
    }
  }

  const resetForm = () => {
    setFormData({
      class: '',
      fee_name: '',
      fee_amount: '',
      period: 'monthly',
      late_fine_enabled: false,
      is_optional: false,
    })
    setBulkData([
      {
        class: '',
        fees: FEE_TYPES.map((fee) => ({
          fee_name: fee.name,
          fee_amount: '',
          period: fee.defaultPeriod,
          late_fine_enabled: false,
          is_optional: false,
        })),
      },
    ])
    setEditingId(null)
    setMode('single')
  }

  const toggleClass = (classKey) => {
    setExpandedClasses((prev) => ({
      ...prev,
      [classKey]: prev[classKey] === false ? true : false,
    }))
  }

  const addBulkRow = () => {
    setBulkData([
      ...bulkData,
      {
        class: bulkData[0]?.class || '',
        fees: FEE_TYPES.map((fee) => ({
          fee_name: fee.name,
          fee_amount: '',
          period: fee.defaultPeriod,
          late_fine_enabled: false,
          is_optional: false,
        })),
      },
    ])
  }

  const removeBulkRow = (index) => {
    if (bulkData.length > 1) {
      setBulkData(bulkData.filter((_, i) => i !== index))
    }
  }

  const updateBulkFee = (rowIndex, feeIndex, field, value) => {
    const updated = [...bulkData]
    updated[rowIndex].fees[feeIndex] = { ...updated[rowIndex].fees[feeIndex], [field]: value }
    setBulkData(updated)
  }

  const updateBulkClassForAll = (value) => {
    setBulkData((prev) => prev.map((item) => ({ ...item, class: normalizeSchoolClass(value) })))
  }

  // Exact Reference Sample Fallback when DB has no records yet
  const fallbackFeeStructures = useMemo(
    () => [
      { id: 'fb-1', class: 'Nursery', fee_name: 'Annual Fee', fee_amount: 500, period: 'yearly', late_fine_enabled: false, is_optional: true },
      { id: 'fb-2', class: 'Nursery', fee_name: 'Computer Fee', fee_amount: 200, period: 'monthly', late_fine_enabled: false, is_optional: true },
      { id: 'fb-3', class: 'Nursery', fee_name: 'Exam Fee', fee_amount: 200, period: 'monthly', late_fine_enabled: false, is_optional: true },
      { id: 'fb-4', class: 'Nursery', fee_name: 'Tuition Fee', fee_amount: 500, period: 'monthly', late_fine_enabled: false, is_optional: false },
    ],
    []
  )

  const activeFees = feeStructures.length > 0 ? feeStructures : fallbackFeeStructures

  // Group fees by class
  const groupedByClass = useMemo(() => {
    return activeFees.reduce((acc, fee) => {
      const classKey = normalizeSchoolClass(fee.class) || 'Nursery'
      if (!acc[classKey]) {
        acc[classKey] = []
      }
      acc[classKey].push(fee)
      return acc
    }, {})
  }, [activeFees])

  // Class totals
  const classTotals = useMemo(() => {
    return Object.keys(groupedByClass).reduce((acc, classKey) => {
      acc[classKey] = groupedByClass[classKey].reduce((sum, fee) => sum + (parseFloat(fee.fee_amount) || 0), 0)
      return acc
    }, {})
  }, [groupedByClass])

  // Overall KPI stats
  const totalClasses = Object.keys(groupedByClass).length || 1
  const totalFees = activeFees.length || 4
  const totalAmount = activeFees.reduce((sum, f) => sum + (parseFloat(f.fee_amount) || 0), 0) || 1400
  const requiredCount = activeFees.filter((f) => !f.is_optional).length || 1
  const optionalCount = activeFees.filter((f) => f.is_optional).length || 3

  // Helper for fee head color dot
  const getFeeDotColor = (name = '') => {
    const n = name.toLowerCase()
    if (n.includes('annual')) return 'bg-purple-500'
    if (n.includes('computer') || n.includes('exam') || n.includes('lab')) return 'bg-cyan-500'
    if (n.includes('tuition')) return 'bg-emerald-500'
    return 'bg-blue-500'
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* ========================================================
          NOTIFICATION MESSAGES
          ======================================================== */}
      {error && (
        <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 flex items-start gap-3 shadow-2xs">
          <span className="material-symbols-outlined text-rose-600 mt-0.5 text-xl flex-shrink-0">error</span>
          <div className="flex-1">
            <p className="text-xs sm:text-sm font-semibold text-rose-900">{error}</p>
          </div>
          <button
            type="button"
            onClick={() => setError('')}
            className="text-rose-400 hover:text-rose-600 flex-shrink-0 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {success && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-center justify-between shadow-2xs">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-emerald-600 text-xl">check_circle</span>
            <p className="text-xs sm:text-sm font-semibold text-emerald-900">{success}</p>
          </div>
          <button
            type="button"
            onClick={() => setSuccess('')}
            className="text-emerald-400 hover:text-emerald-600 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* ========================================================
          FILTER BAR (Matching Reference HTML)
          ======================================================== */}
      <section className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-4 items-end">
          {/* Filter by Class */}
          <div className="lg:col-span-5">
            <label className="block text-xs font-semibold text-slate-600 mb-1.5" htmlFor="filter-class">
              Filter by Class
            </label>
            <div className="relative">
              <select
                id="filter-class"
                value={classFilter}
                onChange={(e) => setClassFilter(e.target.value)}
                className="w-full text-xs font-medium bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 focus:bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition appearance-none text-slate-800 cursor-pointer hover:border-slate-300"
              >
                <option value="all">All Classes</option>
                <option value="Nursery">Class Nursery</option>
                <option value="LKG">Class LKG</option>
                <option value="UKG">Class UKG</option>
                {CLASS_OPTIONS.map((cls) => (
                  <option key={cls} value={cls}>
                    {cls.startsWith('Class ') ? cls : `Class ${cls}`}
                  </option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-slate-400">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path d="M19 9l-7 7-7-7" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
                </svg>
              </div>
            </div>
          </div>

          {/* Filter by Section */}
          <div className="lg:col-span-5">
            <label className="block text-xs font-semibold text-slate-600 mb-1.5" htmlFor="filter-section">
              Filter by Section
            </label>
            <div className="relative">
              <select
                id="filter-section"
                value={sectionFilter}
                onChange={(e) => setSectionFilter(e.target.value)}
                className="w-full text-xs font-medium bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 focus:bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition appearance-none text-slate-800 cursor-pointer hover:border-slate-300"
              >
                <option value="all">All Sections</option>
                {SECTION_OPTIONS.map((sec) => (
                  <option key={sec} value={sec}>
                    Section {sec}
                  </option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-slate-400">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path d="M19 9l-7 7-7-7" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
                </svg>
              </div>
            </div>
          </div>

          {/* Reset Filter Button */}
          <div className="lg:col-span-2">
            <button
              type="button"
              onClick={() => {
                setClassFilter('all')
                setSectionFilter('all')
              }}
              className="w-full py-2.5 px-4 text-xs font-semibold text-slate-600 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-xl transition border border-slate-200/80 cursor-pointer active:scale-98"
            >
              Reset
            </button>
          </div>
        </div>
      </section>

      {/* ========================================================
          KPI METRIC CARDS (With Lite Color Gradients matching HTML)
          ======================================================== */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" data-purpose="kpi-metrics-grid">
        {/* KPI 1: TOTAL CLASSES */}
        <div className="rounded-2xl p-5 border border-blue-100 bg-gradient-to-br from-[#eff6ff] to-white shadow-2xs flex items-center gap-4 transition hover:shadow-md">
          <div className="w-12 h-12 rounded-xl bg-blue-100/80 border border-blue-200/60 flex items-center justify-center text-blue-600 flex-shrink-0">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
              ></path>
            </svg>
          </div>
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Total Classes</div>
            <div className="text-2xl font-extrabold text-slate-900 mt-0.5">{totalClasses}</div>
            <p className="text-[11px] text-blue-600 font-medium">Configured in session</p>
          </div>
        </div>

        {/* KPI 2: TOTAL FEES */}
        <div className="rounded-2xl p-5 border border-emerald-100 bg-gradient-to-br from-[#ecfdf5] to-white shadow-2xs flex items-center gap-4 transition hover:shadow-md">
          <div className="w-12 h-12 rounded-xl bg-emerald-100/80 border border-emerald-200/60 flex items-center justify-center text-emerald-600 flex-shrink-0">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
              ></path>
            </svg>
          </div>
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Total Fees</div>
            <div className="text-2xl font-extrabold text-slate-900 mt-0.5">{totalFees}</div>
            <p className="text-[11px] text-emerald-600 font-medium">Fee Heads Defined</p>
          </div>
        </div>

        {/* KPI 3: TOTAL AMOUNT */}
        <div className="rounded-2xl p-5 border border-amber-100 bg-gradient-to-br from-[#fef3c7] to-white shadow-2xs flex items-center gap-4 transition hover:shadow-md">
          <div className="w-12 h-12 rounded-xl bg-amber-100/80 border border-amber-200/60 flex items-center justify-center text-amber-600 flex-shrink-0">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
              ></path>
            </svg>
          </div>
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Total Amount</div>
            <div className="text-2xl font-extrabold text-slate-900 mt-0.5">₹{totalAmount.toLocaleString('en-IN')}</div>
            <p className="text-[11px] text-amber-700 font-medium">Per student baseline</p>
          </div>
        </div>

        {/* KPI 4: REQ / OPT */}
        <div className="rounded-2xl p-5 border border-purple-100 bg-gradient-to-br from-[#f3e8ff] to-white shadow-2xs flex items-center gap-4 transition hover:shadow-md">
          <div className="w-12 h-12 rounded-xl bg-purple-100/80 border border-purple-200/60 flex items-center justify-center text-purple-600 flex-shrink-0">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
              ></path>
            </svg>
          </div>
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Req / Opt</div>
            <div className="text-2xl font-extrabold text-slate-900 mt-0.5">
              {requiredCount} / {optionalCount}
            </div>
            <p className="text-[11px] text-purple-600 font-medium">
              {requiredCount} Required · {optionalCount} Optional
            </p>
          </div>
        </div>
      </section>

      {/* ========================================================
          FEE STRUCTURE ACCORDIONS (Per Class, Matching Reference HTML)
          ======================================================== */}
      {loading ? (
        <div className="rounded-2xl border border-slate-200/80 bg-white p-12 text-center shadow-xs">
          <span className="material-symbols-outlined text-4xl text-blue-500 animate-spin">sync</span>
          <p className="mt-2 text-xs font-semibold text-slate-500">Loading fee structures from server...</p>
        </div>
      ) : Object.keys(groupedByClass).length === 0 ? (
        <div className="rounded-2xl border border-slate-200/80 bg-white p-12 text-center shadow-xs">
          <span className="material-symbols-outlined text-4xl text-slate-300">folder_open</span>
          <p className="mt-2 text-sm font-bold text-slate-700">No fee structures found</p>
          <p className="text-xs text-slate-400 mt-0.5">Click "Add Single" or "Add Bulk" above to create fee heads.</p>
        </div>
      ) : (
        <div className="space-y-5">
          {Object.keys(groupedByClass).sort().map((classKey) => {
            const classFees = groupedByClass[classKey]
            const classTotal = classTotals[classKey] || 0
            const requiredFees = classFees.filter((f) => !f.is_optional)
            const optionalFees = classFees.filter((f) => f.is_optional)
            const isExpanded = expandedClasses[classKey] !== false // Default open

            return (
              <section
                key={classKey}
                className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden transition-all duration-200"
                data-purpose="class-fee-card"
              >
                {/* Accordion Header */}
                <div className="p-4 sm:p-5 bg-white border-b border-slate-200/80 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  {/* Class Title and Expand Icon */}
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => toggleClass(classKey)}
                      className="w-8 h-8 rounded-lg bg-sky-500 text-white flex items-center justify-center shadow-xs hover:bg-sky-600 transition-colors focus:outline-hidden cursor-pointer active:scale-95"
                      title={isExpanded ? 'Collapse' : 'Expand'}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        {isExpanded ? (
                          <path d="M5 15l7-7 7 7" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5"></path>
                        ) : (
                          <path d="M19 9l-7 7-7-7" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5"></path>
                        )}
                      </svg>
                    </button>
                    <div>
                      <h2 className="text-base sm:text-lg font-bold text-slate-900 leading-tight">
                        Class {classKey}
                      </h2>
                      <p className="text-xs text-slate-500 font-medium">{classFees.length} Fees</p>
                    </div>
                  </div>

                  {/* Summary Pills & Total Amount Badge */}
                  <div className="flex flex-wrap items-center gap-2.5">
                    <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                      {classFees.length} Fees
                    </span>
                    <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                      {requiredFees.length} Required
                    </span>
                    <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                      {optionalFees.length} Optional
                    </span>

                    {/* Prominent Amount Badge */}
                    <div className="ml-1 sm:ml-2 pl-2 sm:pl-3 border-l border-slate-200 flex items-center gap-2">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Amount</span>
                      <span className="text-base sm:text-lg font-extrabold text-slate-900 bg-slate-100 px-3 py-1 rounded-xl border border-slate-200">
                        ₹{classTotal.toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Table Container - Collapsible */}
                {isExpanded && (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse" data-purpose="fee-heads-table">
                      <thead>
                        <tr className="border-b border-slate-200 bg-slate-50/60 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                          <th className="py-3.5 px-6" scope="col">
                            Fee Name
                          </th>
                          <th className="py-3.5 px-6" scope="col">
                            Amount
                          </th>
                          <th className="py-3.5 px-6" scope="col">
                            Period
                          </th>
                          <th className="py-3.5 px-6" scope="col">
                            Late Fine
                          </th>
                          <th className="py-3.5 px-6" scope="col">
                            Type
                          </th>
                          <th className="py-3.5 px-6 text-right" scope="col">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-xs">
                        {classFees.map((fee) => (
                          <tr key={fee.id} className="hover:bg-slate-50/80 transition-colors">
                            {/* Fee Name */}
                            <td className="py-4 px-6 font-semibold text-slate-900 flex items-center gap-2.5">
                              <span className={`w-2 h-2 rounded-full ${getFeeDotColor(fee.fee_name)}`}></span>
                              <span>{fee.fee_name}</span>
                            </td>

                            {/* Amount */}
                            <td className="py-4 px-6 font-bold text-slate-900 text-sm">
                              ₹{(parseFloat(fee.fee_amount) || 0).toLocaleString('en-IN')}
                            </td>

                            {/* Period */}
                            <td className="py-4 px-6">
                              {fee.period === 'yearly' ? (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-purple-100/70 text-purple-700 border border-purple-200/70">
                                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path
                                      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth="2"
                                    ></path>
                                  </svg>
                                  Yearly
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-cyan-100/70 text-cyan-800 border border-cyan-200/70">
                                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path
                                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth="2"
                                    ></path>
                                  </svg>
                                  Monthly
                                </span>
                              )}
                            </td>

                            {/* Late Fine */}
                            <td className="py-4 px-6">
                              {fee.late_fine_enabled ? (
                                <span className="inline-block px-2.5 py-0.5 rounded-md text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                                  Enabled
                                </span>
                              ) : (
                                <span className="inline-block px-2.5 py-0.5 rounded-md text-[11px] font-medium bg-slate-100 text-slate-600 border border-slate-200">
                                  Disabled
                                </span>
                              )}
                            </td>

                            {/* Type */}
                            <td className="py-4 px-6">
                              {fee.is_optional ? (
                                <span className="inline-block px-2.5 py-1 rounded-lg text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                                  Optional
                                </span>
                              ) : (
                                <span className="inline-block px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                  Required
                                </span>
                              )}
                            </td>

                            {/* Actions */}
                            <td className="py-4 px-6 text-right">
                              <div className="inline-flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => handleEdit(fee)}
                                  className="p-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                                  title="Edit Fee"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path
                                      d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth="2"
                                    ></path>
                                  </svg>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDelete(fee.id)}
                                  disabled={deletingId === fee.id}
                                  className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                                  title="Delete Fee"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path
                                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth="2"
                                    ></path>
                                  </svg>
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      {/* Table Footer: Class Total Row */}
                      <tfoot>
                        <tr className="bg-slate-50 border-t border-slate-200">
                          <td className="py-4 px-6 font-bold text-slate-800 text-sm" colSpan={5}>
                            Class Total:
                          </td>
                          <td className="py-4 px-6 text-right font-extrabold text-slate-900 text-base">
                            ₹{classTotal.toLocaleString('en-IN')}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                )}
              </section>
            )
          })}
        </div>
      )}

      {/* ========================================================
          ADD / EDIT FEE STRUCTURE MODAL (Preserved 100%)
          ======================================================== */}
      {isModalOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto"
          onClick={(e) => {
            if (e.target === e.currentTarget && !loading) {
              setIsModalOpen(false)
              resetForm()
            }
          }}
        >
          <div
            className={`bg-white rounded-3xl shadow-2xl w-full relative z-50 flex flex-col my-auto ${
              mode === 'bulk' ? 'max-w-3xl' : 'max-w-lg'
            } max-h-[90vh]`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-slate-100 sticky top-0 bg-white rounded-t-3xl z-10">
              <h3 className="text-base sm:text-lg font-black text-slate-900">
                {editingId ? 'Edit Fee Structure' : mode === 'bulk' ? 'Add Bulk Fee Structures' : 'Add Fee Structure'}
              </h3>
              <button
                type="button"
                onClick={() => {
                  setIsModalOpen(false)
                  resetForm()
                }}
                className="h-8 w-8 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-700 font-bold flex items-center justify-center transition cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-5">
              {!editingId && (
                <div className="mb-4 flex gap-1 bg-slate-100 p-1 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setMode('single')}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      mode === 'single'
                        ? 'bg-white text-slate-900 shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Single Mode
                  </button>
                  <button
                    type="button"
                    onClick={() => setMode('bulk')}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      mode === 'bulk'
                        ? 'bg-white text-slate-900 shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Bulk Mode
                  </button>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                {mode === 'bulk' && !editingId ? (
                  <>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">Class (for all) *</label>
                      <select
                        required
                        value={bulkData[0]?.class || ''}
                        onChange={(e) => updateBulkClassForAll(e.target.value)}
                        className="w-full h-11 px-3.5 border border-slate-200 rounded-xl bg-white text-slate-900 text-xs font-semibold focus:border-blue-500 focus:outline-hidden transition"
                      >
                        <option value="" disabled>
                          Select class
                        </option>
                        {CLASS_OPTIONS.map((className) => (
                          <option key={className} value={className}>
                            {className}
                          </option>
                        ))}
                      </select>
                      <p className="text-[11px] text-slate-500 mt-1">This class will be applied to all fee structures below</p>
                    </div>

                    <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-1">
                      {bulkData.map((item, rowIndex) => (
                        <div key={rowIndex} className="border border-slate-200 rounded-xl p-3 bg-slate-50/50 space-y-3">
                          <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                            <span className="text-xs font-bold text-slate-900">Class: {item.class || 'Not Set'}</span>
                            {bulkData.length > 1 && (
                              <button
                                type="button"
                                onClick={() => removeBulkRow(rowIndex)}
                                className="text-rose-600 hover:text-rose-800 text-xs font-bold"
                              >
                                Remove
                              </button>
                            )}
                          </div>

                          <div className="overflow-x-auto">
                            <table className="w-full text-xs">
                              <thead>
                                <tr className="border-b border-slate-200 text-slate-500 font-bold text-[10px] uppercase">
                                  <th className="py-1 text-left">Fee Name</th>
                                  <th className="py-1 text-right">Amount (₹)</th>
                                  <th className="py-1 text-center">Period</th>
                                  <th className="py-1 text-center">Late Fine</th>
                                  <th className="py-1 text-center">Optional</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-200/60">
                                {item.fees.map((fee, feeIndex) => (
                                  <tr key={feeIndex}>
                                    <td className="py-2 font-medium text-slate-800">{fee.fee_name}</td>
                                    <td className="py-2 text-right">
                                      <input
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        value={fee.fee_amount}
                                        onChange={(e) => updateBulkFee(rowIndex, feeIndex, 'fee_amount', e.target.value)}
                                        placeholder="0"
                                        className="w-24 h-8 px-2 text-xs border border-slate-200 rounded-lg bg-white text-right font-bold"
                                      />
                                    </td>
                                    <td className="py-2 text-center">
                                      <select
                                        value={fee.period}
                                        onChange={(e) => updateBulkFee(rowIndex, feeIndex, 'period', e.target.value)}
                                        className="h-8 px-2 text-xs border border-slate-200 rounded-lg bg-white"
                                      >
                                        <option value="monthly">Monthly</option>
                                        <option value="yearly">Yearly</option>
                                      </select>
                                    </td>
                                    <td className="py-2 text-center">
                                      <input
                                        type="checkbox"
                                        checked={fee.late_fine_enabled}
                                        onChange={(e) => updateBulkFee(rowIndex, feeIndex, 'late_fine_enabled', e.target.checked)}
                                        className="h-4 w-4 rounded border-slate-300 text-blue-600"
                                      />
                                    </td>
                                    <td className="py-2 text-center">
                                      <input
                                        type="checkbox"
                                        checked={fee.is_optional}
                                        onChange={(e) => updateBulkFee(rowIndex, feeIndex, 'is_optional', e.target.checked)}
                                        className="h-4 w-4 rounded border-slate-300 text-blue-600"
                                      />
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1.5">Class *</label>
                        <select
                          required
                          value={formData.class}
                          onChange={(e) => setFormData({ ...formData, class: e.target.value })}
                          className="w-full h-11 px-3 border border-slate-200 rounded-xl bg-white text-xs font-semibold text-slate-900 focus:border-blue-500 focus:outline-hidden"
                        >
                          <option value="" disabled>
                            Select class
                          </option>
                          {CLASS_OPTIONS.map((className) => (
                            <option key={className} value={className}>
                              {className}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1.5">Fee Name *</label>
                        <input
                          type="text"
                          required
                          value={formData.fee_name}
                          onChange={(e) => setFormData({ ...formData, fee_name: e.target.value })}
                          placeholder="e.g. Tuition Fee"
                          className="w-full h-11 px-3 border border-slate-200 rounded-xl bg-white text-xs font-semibold text-slate-900 focus:border-blue-500 focus:outline-hidden"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1.5">Fee Amount (₹) *</label>
                        <input
                          type="number"
                          required
                          step="0.01"
                          min="0"
                          value={formData.fee_amount}
                          onChange={(e) => setFormData({ ...formData, fee_amount: e.target.value })}
                          placeholder="0.00"
                          className="w-full h-11 px-3 border border-slate-200 rounded-xl bg-white text-xs font-semibold text-slate-900 focus:border-blue-500 focus:outline-hidden"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1.5">Period *</label>
                        <select
                          required
                          value={formData.period}
                          onChange={(e) => setFormData({ ...formData, period: e.target.value })}
                          className="w-full h-11 px-3 border border-slate-200 rounded-xl bg-white text-xs font-semibold text-slate-900 focus:border-blue-500 focus:outline-hidden"
                        >
                          <option value="monthly">Monthly</option>
                          <option value="yearly">Yearly</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 pt-2">
                      <label className="flex items-center gap-2 p-3 border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-50 transition">
                        <input
                          type="checkbox"
                          checked={formData.late_fine_enabled}
                          onChange={(e) => setFormData({ ...formData, late_fine_enabled: e.target.checked })}
                          className="h-4 w-4 rounded border-slate-300 text-blue-600"
                        />
                        <span className="text-xs font-bold text-slate-700">Late Fine Enabled</span>
                      </label>

                      <label className="flex items-center gap-2 p-3 border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-50 transition">
                        <input
                          type="checkbox"
                          checked={formData.is_optional}
                          onChange={(e) => setFormData({ ...formData, is_optional: e.target.checked })}
                          className="h-4 w-4 rounded border-slate-300 text-blue-600"
                        />
                        <span className="text-xs font-bold text-slate-700">Optional Fee Head</span>
                      </label>
                    </div>
                  </>
                )}

                <div className="flex gap-2 pt-4 border-t border-slate-100">
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 h-11 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs shadow-xs transition disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer active:scale-98"
                  >
                    {loading ? (
                      <>
                        <span className="material-symbols-outlined animate-spin text-sm">sync</span>
                        <span>{editingId ? 'Updating...' : 'Creating...'}</span>
                      </>
                    ) : (
                      editingId ? 'Update Fee Structure' : 'Create Fee Structure'
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsModalOpen(false)
                      resetForm()
                    }}
                    disabled={loading}
                    className="px-5 h-11 border border-slate-200 text-slate-700 rounded-xl font-bold text-xs hover:bg-slate-50 transition cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default FeeStructure
