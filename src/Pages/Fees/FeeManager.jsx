import React, { useState } from 'react'
import FeeStructure from './FeeStructure'
import BulkBillGeneration from './BulkBillGeneration'
import FeeList from './FeeList'
import PayFees from './PayFees'
import Invoice from './Invoice'
import Bills from './Bills'
import OpeningBalanceMigration from './OpeningBalanceMigration'

function FeeManager() {
  const [activeTab, setActiveTab] = useState('structure')
  const [invoiceBillId, setInvoiceBillId] = useState('')
  const [paymentData, setPaymentData] = useState(null)

  const tabs = [
    {
      id: 'structure',
      label: 'Fee Structure',
      icon: 'settings',
      activeClass: 'bg-[#6d28d9] text-white shadow-md shadow-violet-500/25',
      inactiveClass: 'text-violet-700 hover:text-violet-900 hover:bg-violet-50 border border-transparent hover:border-violet-200',
    },
    {
      id: 'list',
      label: 'Fee List',
      icon: 'list',
      activeClass: 'bg-[#0f766e] text-white shadow-md shadow-teal-500/25',
      inactiveClass: 'text-teal-700 hover:text-teal-900 hover:bg-teal-50 border border-transparent hover:border-teal-200',
    },
    {
      id: 'pay',
      label: 'Pay Fees',
      icon: 'payments',
      activeClass: 'bg-[#c2410c] text-white shadow-md shadow-orange-500/25',
      inactiveClass: 'text-orange-700 hover:text-orange-900 hover:bg-orange-50 border border-transparent hover:border-orange-200',
    },
    {
      id: 'invoice',
      label: 'Invoice',
      icon: 'description',
      activeClass: 'bg-[#be123c] text-white shadow-md shadow-rose-500/25',
      inactiveClass: 'text-rose-700 hover:text-rose-900 hover:bg-rose-50 border border-transparent hover:border-rose-200',
    },
    {
      id: 'bills',
      label: 'Billing',
      icon: 'print',
      activeClass: 'bg-[#0f766e] text-white shadow-md shadow-teal-500/25',
      inactiveClass: 'text-teal-700 hover:text-teal-900 hover:bg-teal-50 border border-transparent hover:border-teal-200',
    },
    {
      id: 'migration',
      label: 'Migration Setup',
      icon: 'sync_saved_locally',
      activeClass: 'bg-[#4338ca] text-white shadow-md shadow-indigo-500/25',
      inactiveClass: 'text-indigo-700 hover:text-indigo-900 hover:bg-indigo-50 border border-transparent hover:border-indigo-200',
    },
  ]

  const handlePayFee = (feeData) => {
    setPaymentData(feeData)
    setActiveTab('pay')
  }

  return (
    <div className="space-y-4" style={{ fontFamily: "'Lexend', sans-serif" }}>
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-black text-slate-900 dark:text-white">Fees Management</h2>
      </div>

      {/* Tabs */}
      <div className="bg-white dark:bg-slate-800 rounded-xl p-1.5 shadow-sm border border-slate-200 dark:border-slate-700 flex flex-wrap gap-1.5">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-lg font-medium text-sm transition-all flex items-center gap-2 ${
              activeTab === tab.id
                ? tab.activeClass
                : tab.inactiveClass
            }`}
          >
            <span className="material-symbols-outlined text-base">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
        {activeTab === 'structure' && <FeeStructure />}
        {activeTab === 'bulk' && <BulkBillGeneration />}
        {activeTab === 'list' && <FeeList onViewInvoice={(billId) => {
          setInvoiceBillId(billId)
          setActiveTab('invoice')
        }} onPayFee={handlePayFee} />}
        {activeTab === 'pay' && <PayFees initialData={paymentData} onPaymentComplete={() => setPaymentData(null)} />}
        {activeTab === 'invoice' && <Invoice billId={invoiceBillId} onBillIdChange={setInvoiceBillId} />}
        {activeTab === 'bills' && <Bills />}
        {activeTab === 'migration' && <OpeningBalanceMigration />}
      </div>
    </div>
  )
}

export default FeeManager

