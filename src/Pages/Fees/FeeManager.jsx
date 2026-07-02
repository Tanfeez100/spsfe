import React, { useState } from 'react'
import FeeDashboard from './FeeDashboard'
import FeeStructure from './FeeStructure'
import BulkBillGeneration from './BulkBillGeneration'
import FeeList from './FeeList'
import PayFees from './PayFees'
import Invoice from './Invoice'
import Bills from './Bills'
import OpeningBalanceMigration from './OpeningBalanceMigration'

function FeeManager() {
  const [activeTab, setActiveTab] = useState('dashboard')
  const [invoiceBillId, setInvoiceBillId] = useState('')
  const [paymentData, setPaymentData] = useState(null)
  const activeTabClass = 'bg-[#7A2331] text-white shadow-md shadow-rose-900/20'
  const inactiveTabClass = 'text-[#7A2331] hover:text-[#511621] hover:bg-[#F8EEF0] border border-transparent hover:border-[#E8CDD3]'

  const tabs = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: 'dashboard',
    },
    {
      id: 'structure',
      label: 'Fee Structure',
      icon: 'settings',
    },
    {
      id: 'list',
      label: 'Fee List',
      icon: 'list',
    },
    {
      id: 'pay',
      label: 'Pay Fees',
      icon: 'payments',
    },
    {
      id: 'invoice',
      label: 'Invoice',
      icon: 'description',
    },
    {
      id: 'bills',
      label: 'Billing',
      icon: 'print',
    },
    {
      id: 'migration',
      label: 'Migration Setup',
      icon: 'sync_saved_locally',
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
                ? activeTabClass
                : inactiveTabClass
            }`}
          >
            <span className="material-symbols-outlined text-base">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
        {activeTab === 'dashboard' && <FeeDashboard />}
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
