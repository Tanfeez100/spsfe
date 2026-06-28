import React, { useState, useEffect } from 'react'
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
  const [classFilter, setClassFilter] = useState('')
  const [sectionFilter, setSectionFilter] = useState('')
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
      const response = await getFeeStructures(classFilter, sectionFilter)
      // Handle different response structures
      if (response.success) {
        setFeeStructures(response.fee_structures || response.data || [])
      } else if (response.data && Array.isArray(response.data)) {
        // API returns { message, count, data: [...] }
        setFeeStructures(response.data)
      } else if (Array.isArray(response)) {
        // API returns array directly
        setFeeStructures(response)
      } else {
        setFeeStructures([])
        if (response.message) {
          // Show message but don't treat as error if data exists
          if (!response.data || response.data.length === 0) {
            setError(response.message)
          }
        }
      }
    } catch (err) {
      setError(err?.message || err?.data?.message || 'Failed to fetch fee structures')
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
        // Bulk creation - flatten fees array
        const payload = []
        bulkData.forEach(item => {
          if (item.class) {
            item.fees.forEach(fee => {
              if (fee.fee_amount && fee.fee_amount > 0) {
                payload.push({
                  class: normalizeSchoolClass(item.class),
                  fee_name: fee.fee_name,
                  fee_amount: parseFloat(fee.fee_amount),
                  period: fee.period,
                  late_fine_enabled: fee.late_fine_enabled,
                  is_optional: fee.is_optional
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
        if (response.success || response.message) {
          setSuccess(`Successfully created ${payload.length} fee structure(s)!`)
          setIsModalOpen(false)
          resetForm()
          await fetchFeeStructures()
        } else {
          setError(response.message || 'Failed to create fee structures')
        }
      } else {
        // Single creation/update
        const payload = {
          class: normalizeSchoolClass(formData.class),
          fee_name: formData.fee_name,
          fee_amount: parseFloat(formData.fee_amount),
          period: formData.period,
          late_fine_enabled: formData.late_fine_enabled,
          is_optional: formData.is_optional
        }

        let response
        if (editingId) {
          response = await updateFeeStructure(editingId, payload)
        } else {
          response = await createFeeStructure(payload)
        }

        if (response.success || response.message) {
          setSuccess(editingId ? 'Fee structure updated successfully' : 'Fee structure created successfully')
          setIsModalOpen(false)
          resetForm()
          await fetchFeeStructures()
        } else {
          setError(response.message || 'Failed to save fee structure')
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
      is_optional: fee.is_optional || false
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
      // Handle different response structures
      if (response.success || response.message) {
        setSuccess('Fee structure deleted successfully')
        // Optimistically remove from UI immediately
        setFeeStructures(prev => prev.filter(fee => fee.id !== id))
        // Also refresh to ensure sync
        await fetchFeeStructures()
      } else {
        setError(response.message || 'Failed to delete fee structure')
        // Refresh to get correct state
        await fetchFeeStructures()
      }
    } catch (err) {
      setError(err?.message || err?.data?.message || 'Failed to delete fee structure')
      // Refresh to get correct state in case of error
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
      is_optional: false
    })
    setBulkData([{
      class: '',
      fees: FEE_TYPES.map(fee => ({
        fee_name: fee.name,
        fee_amount: '',
        period: fee.defaultPeriod,
        late_fine_enabled: false,
        is_optional: false
      }))
    }])
    setEditingId(null)
    setMode('single')
  }

  const toggleClass = (classKey) => {
    setExpandedClasses(prev => ({
      ...prev,
      [classKey]: !prev[classKey]
    }))
  }

  const addBulkRow = () => {
    setBulkData([...bulkData, {
      class: bulkData[0]?.class || '',
      fees: FEE_TYPES.map(fee => ({
        fee_name: fee.name,
        fee_amount: '',
        period: fee.defaultPeriod,
        late_fine_enabled: false,
        is_optional: false
      }))
    }])
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
    setBulkData(prev => prev.map(item => ({ ...item, class: normalizeSchoolClass(value) })))
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-4 sm:p-6 lg:p-8 space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-2xl font-bold text-slate-900">Fee Structure Management</h3>
          <p className="text-sm text-slate-500 mt-1">Manage and organize your school fee structures</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full sm:w-auto">
          <button
            onClick={() => {
              resetForm()
              setMode('single')
              setIsModalOpen(true)
            }}
            className="w-full sm:w-auto px-4 sm:px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all duration-200 flex items-center justify-center gap-2 whitespace-nowrap text-sm sm:text-base shadow-md hover:shadow-lg"
          >
            <span className="material-symbols-outlined text-sm">add</span>
            Add Single
          </button>
          <button
            onClick={() => {
              resetForm()
              setMode('bulk')
              setIsModalOpen(true)
            }}
            className="w-full sm:w-auto px-4 sm:px-5 py-2.5 bg-sky-500 hover:bg-sky-600 text-white rounded-lg transition-all duration-200 flex items-center justify-center gap-2 shadow-md hover:shadow-lg whitespace-nowrap text-sm sm:text-base"
          >
            <span className="material-symbols-outlined text-sm">add_circle</span>
            Add Bulk
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 sm:items-end bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
        <div className="w-full sm:flex-1">
          <label className="block text-sm font-semibold text-slate-700 mb-2">Filter by Class</label>
          <select
            value={classFilter}
            onChange={(e) => setClassFilter(e.target.value)}
            className="w-full px-4 py-2.5 border border-slate-200 rounded-lg bg-slate-50 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
          >
            <option value="">All Classes</option>
            {CLASS_OPTIONS.map((className) => (
              <option key={className} value={className}>
                {className}
              </option>
            ))}
          </select>
        </div>
        <div className="w-full sm:flex-1">
          <label className="block text-sm font-semibold text-slate-700 mb-2">Filter by Section</label>
          <select
            value={sectionFilter}
            onChange={(e) => setSectionFilter(e.target.value)}
            className="w-full px-4 py-2.5 border border-slate-200 rounded-lg bg-slate-50 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
          >
            <option value="">All Sections</option>
            {SECTION_OPTIONS.map((section) => (
              <option key={section} value={section}>
                {section}
              </option>
            ))}
          </select>
        </div>
        <button
          onClick={() => {
            setClassFilter('')
            setSectionFilter('')
          }}
          className="w-full sm:w-auto px-6 py-2.5 border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors duration-200 font-medium"
        >
          Reset
        </button>
      </div>

      {/* Messages */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3 shadow-sm">
          <span className="material-symbols-outlined text-red-600 mt-0.5 text-xl flex-shrink-0">error</span>
          <div className="flex-1">
            <p className="text-sm font-semibold text-red-900">{error}</p>
          </div>
          <button
            onClick={() => setError('')}
            className="text-red-400 hover:text-red-600 flex-shrink-0 mt-0.5"
          >
            <span className="material-symbols-outlined text-lg">close</span>
          </button>
        </div>
      )}
      {success && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-green-600 text-xl">check_circle</span>
            <p className="text-sm font-semibold text-green-900">{success}</p>
          </div>
          <button
            onClick={() => setSuccess('')}
            className="text-green-400 hover:text-green-600"
          >
            <span className="material-symbols-outlined text-lg">close</span>
          </button>
        </div>
      )}

      {/* Summary Stats */}
      {feeStructures.length > 0 && !loading && (() => {
        const totalClasses = new Set(feeStructures.map(f => f.class)).size
        const totalFees = feeStructures.length
        const totalAmount = feeStructures.reduce((sum, f) => sum + (f.fee_amount || 0), 0)
        const requiredCount = feeStructures.filter(f => !f.is_optional).length
        const optionalCount = feeStructures.filter(f => f.is_optional).length

        return (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-200">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center flex-shrink-0">
                  <span className="material-symbols-outlined text-blue-600 text-xl">class</span>
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Total Classes</p>
                  <p className="text-2xl font-black text-slate-900 mt-0.5">{totalClasses}</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-200">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center flex-shrink-0">
                  <span className="material-symbols-outlined text-green-600 text-xl">receipt_long</span>
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Total Fees</p>
                  <p className="text-2xl font-black text-slate-900 mt-0.5">{totalFees}</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-200">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center flex-shrink-0">
                  <span className="material-symbols-outlined text-amber-600 text-xl">payments</span>
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Total Amount</p>
                  <p className="text-lg font-black text-slate-899 mt-0.5">₹{totalAmount.toLocaleString('en-IN')}</p>
                </div>
              </div>
            </div>
            <div className="bg-slate-10 rounded-2xl border border-slate-50 p-5 shadow-md hover:shadow-lg hover:-translate-y-1 transition-all duration-200">
              <div className="flex items-center gap-4">
                <div>
                  <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Req / Opt</p>
                  <p className="text-2xl font-black text-gray-800 mt-0.5">{requiredCount} / {optionalCount}</p>
                </div>
              </div>
            </div>
          </div>
        )
      })()}

      {/* Grouped by Class */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <span className="material-symbols-outlined animate-spin text-5xl text-blue-500 mx-auto block mb-2">sync</span>
            <p className="text-slate-500 font-medium">Loading fee structures...</p>
          </div>
        </div>
      ) : feeStructures.length === 0 ? (
        <div className="text-center py-12">
          <span className="material-symbols-outlined text-5xl text-slate-300 mx-auto block mb-3">folder_open</span>
          <p className="text-slate-500 font-medium">No fee structures found</p>
          <p className="text-sm text-slate-400 mt-1">Create your first fee structure to get started</p>
        </div>
      ) : (() => {
        // Group fees by class
        const groupedByClass = feeStructures.reduce((acc, fee) => {
          const classKey = normalizeSchoolClass(fee.class) || 'Unknown'
          if (!acc[classKey]) {
            acc[classKey] = []
          }
          acc[classKey].push(fee)
          return acc
        }, {})

        // Calculate totals for each class
        const classTotals = Object.keys(groupedByClass).reduce((acc, classKey) => {
          acc[classKey] = groupedByClass[classKey].reduce((sum, fee) => sum + (fee.fee_amount || 0), 0)
          return acc
        }, {})

        return (
          <div className="space-y-6">
            {Object.keys(groupedByClass).sort().map((classKey) => {
              const classFees = groupedByClass[classKey]
              const totalAmount = classTotals[classKey]
              const requiredFees = classFees.filter(f => !f.is_optional)
              const optionalFees = classFees.filter(f => f.is_optional)

              return (
                <div 
                  key={classKey} 
                  className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all overflow-hidden"
                >
                  {/* Class Header */}
                  <button
                    type="button"
                    onClick={() => toggleClass(classKey)}
                    aria-expanded={!!expandedClasses[classKey]}
                    className="w-full bg-white px-4 sm:px-6 py-4 sm:py-5 border-b border-slate-200 hover:bg-slate-50 transition-colors duration-200 flex items-center justify-between gap-3 sm:gap-4 text-left"
                    title={expandedClasses[classKey] ? 'Collapse' : 'Expand'}
                  >
                    <div className="min-w-0 flex items-center gap-3 sm:gap-4 flex-1">
                      <div className="shrink-0 w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-cyan-500 text-white flex items-center justify-center font-bold">
                        <span className="material-symbols-outlined text-base sm:text-lg">
                          {expandedClasses[classKey] ? 'expand_less' : 'expand_more'}
                        </span>
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-base sm:text-xl font-bold text-slate-900 leading-tight truncate">
                          Class {classKey}
                        </h4>
                        <p className="text-xs sm:text-sm text-slate-600 font-medium mt-0.5">
                          {classFees.length} {classFees.length === 1 ? 'Fee' : 'Fees'}
                        </p>
                      </div>
                    </div>
                    <div className="hidden sm:flex items-center gap-3 flex-shrink-0">
                      <div className="text-right">
                        <div className="mt-1 flex flex-wrap items-center justify-end gap-2 text-xs">
                          <span className="inline-flex items-center rounded-full bg-slate-100 border border-slate-300 px-3 py-1.5 text-slate-700 font-semibold">
                            {classFees.length} {classFees.length === 1 ? 'Fee' : 'Fees'}
                          </span>
                          <span className="inline-flex items-center rounded-full bg-green-100 border border-green-300 px-3 py-1.5 text-green-700 font-semibold">
                            {requiredFees.length} Required
                          </span>
                          <span className="inline-flex items-center rounded-full bg-amber-100 border border-amber-300 px-3 py-1.5 text-amber-700 font-semibold">
                            {optionalFees.length} Optional
                          </span>
                        </div>
                      </div>
                      <div className="rounded-xl border border-slate-300 bg-slate-100 px-4 py-3.5 text-right shadow-md">
                        <p className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Total Amount</p>
                        <p className="text-2xl font-black text-slate-800 leading-tight mt-1.5">
                          {'\u20B9'}{totalAmount.toLocaleString('en-IN')}
                        </p>
                      </div>
                    </div>
                  </button>

                  {/* Fees Table - Only show when expanded */}
                  {expandedClasses[classKey] && (
                    <div className="bg-slate-50/50">
                      <div className="grid grid-cols-2 gap-2 p-4 pb-0 sm:hidden">
                        <div className="rounded-xl border border-slate-200 bg-white px-3 py-2.5">
                          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Required</p>
                          <p className="text-base font-black text-slate-900">{requiredFees.length}</p>
                        </div>
                        <div className="rounded-xl border border-slate-200 bg-white px-3 py-2.5">
                          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Optional</p>
                          <p className="text-base font-black text-slate-900">{optionalFees.length}</p>
                        </div>
                        <div className="col-span-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5">
                          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Total Amount</p>
                          <p className="text-2xl font-black text-slate-900 mt-1">{'\u20B9'}{totalAmount.toLocaleString('en-IN')}</p>
                        </div>
                      </div>

                      <div className="overflow-x-auto table-scrollbar" style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgb(99, 126, 153) rgb(224, 242, 254)' }}>
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="bg-slate-50 border-b border-slate-200">
                              <th className="px-5 py-4 text-left font-bold text-slate-900 text-sm">Fee Name</th>
                              <th className="px-5 py-4 text-right font-bold text-slate-900 text-sm">Amount</th>
                              <th className="hidden sm:table-cell px-5 py-4 text-center font-bold text-slate-900 text-sm">Period</th>
                              <th className="hidden sm:table-cell px-5 py-4 text-center font-bold text-slate-900 text-sm">Late Fine</th>
                              <th className="hidden sm:table-cell px-5 py-4 text-center font-bold text-slate-900 text-sm">Type</th>
                              <th className="px-5 py-4 text-center font-bold text-slate-900 text-sm">Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {classFees.map((fee) => (
                              <tr 
                                key={fee.id} 
                                className="border-b border-slate-200 hover:bg-slate-50 transition-colors duration-150"
                              >
                                <td className="px-5 py-4">
                                  <div className="flex items-center gap-2">
                                    <span className="font-semibold text-slate-900">{fee.fee_name}</span>
                                  </div>
                                </td>
                                <td className="px-4 py-3.5 text-right">
                                  <span className="font-bold text-black dark:text-slate-800 text-base">
                                    {'\u20B9'}{fee.fee_amount?.toLocaleString('en-IN') || 0}
                                  </span>
                                </td>
                                <td className="hidden sm:table-cell px-4 py-3.5 text-center">
                                  <span className={`px-3 py-1.5 rounded text-xs font-bold transition-colors hover:scale-105 ${
                                    fee.period === 'yearly' 
                                      ? 'bg-purple-100 dark:bg-purple-900/40 text-black dark:text-purple-200 border border-purple-400 dark:border-purple-700 hover:bg-purple-200 dark:hover:bg-purple-900/60' 
                                      : 'bg-cyan-100 dark:bg-cyan-900/40 text-black dark:text-cyan-200 border border-cyan-400 dark:border-cyan-700 hover:bg-cyan-200 dark:hover:bg-cyan-900/60'
                                  }`}>
                                    {fee.period === 'yearly' ? '\ud83d\udcc5 Yearly' : '\ud83d\udcc6 Monthly'}
                                  </span>
                                </td>
                                <td className="hidden sm:table-cell px-4 py-3.5 text-center">
                                  {fee.late_fine_enabled ? (
                                    <span className="px-3 py-1.5 bg-red-100 dark:bg-red-900/40 text-black dark:text-red-200 rounded text-xs font-bold flex items-center justify-center gap-1.5 w-fit mx-auto border border-red-400 dark:border-red-700 hover:bg-red-200 dark:hover:bg-red-900/60 transition-colors cursor-default">
                                      <span className="material-symbols-outlined text-sm">warning</span>
                                      Enabled
                                    </span>
                                  ) : (
                                    <span className="px-3 py-1.5 bg-gray-200 dark:bg-gray-700 text-black dark:text-gray-300 rounded text-xs font-bold border border-gray-400 dark:border-gray-600 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors cursor-default">
                                      Disabled
                                    </span>
                                  )}
                                </td>
                                <td className="hidden sm:table-cell px-4 py-3.5 text-center">
                                  {fee.is_optional ? (
                                    <span className="px-3 py-1.5 bg-orange-100 dark:bg-orange-900/40 text-black dark:text-orange-200 rounded text-xs font-bold border border-orange-400 dark:border-orange-700 hover:bg-orange-200 dark:hover:bg-orange-900/60 transition-colors cursor-default">
                                      Optional
                                    </span>
                                  ) : (
                                    <span className="px-3 py-1.5 bg-green-100 dark:bg-green-900/40 text-black dark:text-green-200 rounded text-xs font-bold border border-green-400 dark:border-green-700 hover:bg-green-200 dark:hover:bg-green-900/60 transition-colors cursor-default">
                                      Required
                                    </span>
                                  )}
                                </td>
                                <td className="px-4 py-3.5">
                                  <div className="flex items-center justify-center gap-1.5">
                                    <button
                                      onClick={() => handleEdit(fee)}
                                      disabled={deletingId === fee.id || deletingId !== null}
                                      className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/40 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed font-medium hover:scale-110 active:scale-95"
                                      title="Edit fee structure"
                                    >
                                      <span className="material-symbols-outlined text-lg">edit</span>
                                    </button>
                                    <button
                                      onClick={() => handleDelete(fee.id)}
                                      disabled={deletingId === fee.id || deletingId !== null}
                                      className="p-2.5 text-red-600 hover:bg-red-100 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-110 active:scale-95"
                                      title="Delete fee structure"
                                    >
                                      {deletingId === fee.id ? (
                                        <span className="material-symbols-outlined text-lg animate-spin">sync</span>
                                      ) : (
                                        <span className="material-symbols-outlined text-lg">delete</span>
                                      )}
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                          {/* Class Summary Footer */}
                          <tfoot className="hidden sm:table-footer-group">
                            <tr className="bg-slate-50 border-t border-slate-200 hover:bg-slate-100 transition-colors">
                              <td colSpan={6} className="px-5 py-4">
                                <div className="flex justify-between items-center">
                                  <span className="font-bold text-slate-900">Class Total:</span>
                                  <span className="text-lg font-black text-slate-900">{'\u20B9'}{totalAmount.toLocaleString('en-IN')}</span>
                                </div>
                              </td>
                            </tr>
                          </tfoot>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )
      })()}

      {/* Modal */}
      {isModalOpen && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9999] flex items-start justify-center p-4 pt-20 lg:pl-72"
          onClick={(e) => {
            if (e.target === e.currentTarget && !loading) {
              setIsModalOpen(false)
              resetForm()
            }
          }}
        >
          <div 
            className={`bg-white rounded-2xl shadow-2xl w-full relative z-[9999] flex flex-col ${
              mode === 'bulk' ? 'max-w-3xl' : 'max-w-2xl'
            } max-h-[calc(90vh-5rem)]`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Sticky Header */}
            <div className="flex items-center justify-between p-4 pb-3 border-b border-slate-200 sticky top-0 bg-white rounded-t-2xl z-10\">
              <h3 className="text-lg font-bold text-slate-900">
                {editingId ? 'Edit Fee Structure' : mode === 'bulk' ? 'Add Bulk Fee Structures' : 'Add Fee Structure'}
              </h3>
              <button
                onClick={() => {
                  setIsModalOpen(false)
                  resetForm()
                }}
                className="p-2.5 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <span className="material-symbols-outlined text-xl\">close</span>
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-4 pt-3 table-scrollbar" style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgb(99, 126, 153) rgb(224, 242, 254)' }}>

            {!editingId && (
              <div className="mb-3 flex gap-1 bg-slate-100 p-0.5 rounded-lg">
                <button
                  type="button"
                  onClick={() => setMode('single')}
                  className={`flex-1 px-3 py-1.5 rounded text-xs font-bold transition-all ${
                    mode === 'single'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-white'
                  }`}
                >
                  Single
                </button>
                <button
                  type="button"
                  onClick={() => setMode('bulk')}
                  className={`flex-1 px-3 py-1.5 rounded text-xs font-bold transition-all ${
                    mode === 'bulk'
                      ? 'bg-sky-500 text-white shadow-sm'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-white'
                  }`}
                >
                  Bulk
                </button>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3">
              {mode === 'bulk' && !editingId ? (
                <>
                  {/* Bulk Mode */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">Class (for all) *</label>
                    <select
                      required
                      value={bulkData[0]?.class || ''}
                      onChange={(e) => updateBulkClassForAll(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm"
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
                    <p className="text-xs text-slate-500 mt-1">This class will be applied to all fee structures</p>
                  </div>

                  <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-2 table-scrollbar" style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgb(99, 126, 153) rgb(224, 242, 254)' }}>
                    <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-200">
                      <p className="text-xs font-semibold text-slate-700 uppercase tracking-wide">Classes & Fees</p>
                      <button
                        type="button"
                        onClick={addBulkRow}
                        // className="px-2.5 py-1 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center gap-1 shadow-sm font-medium"
                      >
                        {/* <span className="material-symbols-outlined text-sm">add</span>
                        Add */}
                      </button>
                    </div>

                    <div className="space-y-3">
                      {bulkData.map((item, rowIndex) => (
                        <div key={rowIndex} className="border-2 border-slate-200 dark:border-slate-700 rounded-lg p-3 bg-gradient-to-br from-white to-slate-50 dark:from-slate-800 dark:to-slate-900/50 hover:border-blue-500 dark:hover:border-blue-500 transition-all shadow-sm">
                          <div className="flex items-center justify-between mb-2 pb-2 border-b border-slate-200 dark:border-slate-700">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-bold text-slate-900 dark:text-white">Class: {item.class || 'Not Set'}</span>
                            </div>
                            {bulkData.length > 1 && (
                              <button
                                type="button"
                                onClick={() => removeBulkRow(rowIndex)}
                                className="p-1 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                                title="Remove this class"
                              >
                                <span className="material-symbols-outlined text-sm">delete</span>
                              </button>
                            )}
                          </div>

                          {/* All fees in one table/card */}
                          <div className="overflow-x-auto">
                            <table className="w-full text-xs">
                              <thead>
                                <tr className="bg-slate-100 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700">
                                  <th className="px-2 py-1.5 text-left font-semibold text-slate-900 dark:text-white">Fee Name</th>
                                  <th className="px-2 py-1.5 text-right font-semibold text-slate-900 dark:text-white">Amount</th>
                                  <th className="px-2 py-1.5 text-center font-semibold text-slate-900 dark:text-white">Period</th>
                                  <th className="px-2 py-1.5 text-center font-semibold text-slate-900 dark:text-white">Late</th>
                                  <th className="px-2 py-1.5 text-center font-semibold text-slate-900 dark:text-white">Opt</th>
                                </tr>
                              </thead>
                              <tbody>
                                {item.fees.map((fee, feeIndex) => (
                                  <tr key={feeIndex} className="border-b border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-900/30">
                                    <td className="px-2 py-2 font-medium text-slate-900 dark:text-white">
                                      {fee.fee_name}
                                    </td>
                                    <td className="px-2 py-2">
                                      <input
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        value={fee.fee_amount}
                                        onChange={(e) => updateBulkFee(rowIndex, feeIndex, 'fee_amount', e.target.value)}
                                        placeholder="0"
                                        className="w-full px-1.5 py-1 text-xs border border-cyan-200/30 dark:border-cyan-700/50 rounded bg-cyan-50/30 dark:bg-cyan-900/10 text-slate-900 dark:text-white focus:ring-2 focus:ring-cyan-400/50 focus:border-cyan-400 text-right"
                                      />
                                    </td>
                                    <td className="px-2 py-2">
                                      <select
                                        value={fee.period}
                                        onChange={(e) => updateBulkFee(rowIndex, feeIndex, 'period', e.target.value)}
                                        className="w-full px-1.5 py-1 text-xs border border-cyan-200/30 dark:border-cyan-700/50 rounded bg-cyan-50/30 dark:bg-cyan-900/10 text-slate-900 dark:text-white focus:ring-2 focus:ring-cyan-400/50 focus:border-cyan-400"
                                      >
                                        <option value="monthly">M</option>
                                        <option value="yearly">Y</option>
                                      </select>
                                    </td>
                                    <td className="px-2 py-2 text-center">
                                      <label className="flex items-center justify-center cursor-pointer">
                                        <input
                                          type="checkbox"
                                          checked={fee.late_fine_enabled}
                                          onChange={(e) => updateBulkFee(rowIndex, feeIndex, 'late_fine_enabled', e.target.checked)}
                                          className="w-4 h-4 text-cyan-500 rounded focus:ring-2 focus:ring-cyan-400"
                                        />
                                      </label>
                                    </td>
                                    <td className="px-2 py-2 text-center">
                                      <label className="flex items-center justify-center cursor-pointer">
                                        <input
                                          type="checkbox"
                                          checked={fee.is_optional}
                                          onChange={(e) => updateBulkFee(rowIndex, feeIndex, 'is_optional', e.target.checked)}
                                          className="w-4 h-4 text-cyan-500 rounded focus:ring-2 focus:ring-cyan-400"
                                        />
                                      </label>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              ) : (
                <>
                  {/* Single Mode */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1.5">Class *</label>
                      <select
                        required
                        value={formData.class}
                        onChange={(e) => setFormData({ ...formData, class: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm"
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
                      <label className="block text-xs font-semibold text-slate-700 mb-1.5">Fee Name *</label>
                      <input
                        type="text"
                        required
                        value={formData.fee_name}
                        onChange={(e) => setFormData({ ...formData, fee_name: e.target.value })}
                        placeholder="e.g., Tuition Fee"
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1.5">Fee Amount *</label>
                      <input
                        type="number"
                        required
                        step="0.01"
                        min="0"
                        value={formData.fee_amount}
                        onChange={(e) => setFormData({ ...formData, fee_amount: e.target.value })}
                        placeholder="0.00"
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1.5">Period *</label>
                      <select
                        required
                        value={formData.period}
                        onChange={(e) => setFormData({ ...formData, period: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm"
                      >
                        <option value="monthly">Monthly</option>
                        <option value="yearly">Yearly</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200">
                    <label className="flex items-center gap-2 cursor-pointer p-2 border border-slate-200 rounded hover:bg-slate-50 transition-colors">
                      <input
                        type="checkbox"
                        id="late_fine_enabled"
                        checked={formData.late_fine_enabled}
                        onChange={(e) => setFormData({ ...formData, late_fine_enabled: e.target.checked })}
                        className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                      />
                      <span className="text-xs font-medium text-slate-700">Late Fine</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer p-2 border border-slate-200 rounded hover:bg-slate-50 transition-colors">
                      <input
                        type="checkbox"
                        id="is_optional"
                        checked={formData.is_optional}
                        onChange={(e) => setFormData({ ...formData, is_optional: e.target.checked })}
                        className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                      />
                      <span className="text-xs font-medium text-slate-700">Optional</span>
                    </label>
                  </div>
                </>
              )}

              <div className="flex gap-2 pt-4 border-t border-slate-200">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-sm font-medium text-sm"
                >
                  {loading ? (
                    <>
                      <span className="material-symbols-outlined animate-spin text-xs">sync</span>
                      <span className="hidden sm:inline">{editingId ? 'Updating...' : 'Creating...'}</span>
                    </>
                  ) : (
                    editingId ? 'Update' : 'Create'
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsModalOpen(false)
                    resetForm()
                  }}
                  disabled={loading}
                  className="flex-1 px-3 py-2 border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors text-sm"
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
