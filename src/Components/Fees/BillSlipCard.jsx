import React, { forwardRef } from 'react'
import schoolLogo from '../../assets/logo.png'
import qrCodeImg from '../../assets/high_quality_qr.png'
import stampImg from '../../assets/stampcert.png'
import './BillSlipCard.css'

/**
 * BillSlipCard - Uses the reference receipt's dotted-rule & watermark design,
 * strictly keeping only our original school fields, backend-integrated fee heads,
 * and 4-in-1 A4 sheet compatibility.
 */
const BillSlipCard = forwardRef(function BillSlipCard({ bill = {}, isPrint = false }, ref) {
  // 1. Original Student & Receipt Fields from Backend
  const billNo = bill.bill_number || bill.invoice_number || bill.bill_id || bill.receipt_no || '-'
  const billDate = bill.date
    ? (bill.date.includes('/') || bill.date.includes('-')
        ? bill.date
        : new Date(bill.date).toLocaleDateString('en-GB'))
    : new Date().toLocaleDateString('en-GB')

  const studentName = bill.student_name || bill.student?.name || bill.name || 'Student'
  const fatherName = bill.father_name || bill.student?.father_name || bill.student?.father || '-'
  const className = bill.class || bill.student?.class || '-'
  const sectionName = bill.section || bill.student?.section || ''
  const rollNo = bill.roll_no || bill.student?.roll_no || bill.roll || '-'

  // 2. Map original fee items from backend
  const itemsMap = {}
  if (Array.isArray(bill.items)) {
    bill.items.forEach((item) => {
      const name = (item.fee_name || item.name || '').toLowerCase()
      const amt = Number(item.amount || 0)
      if (name.includes('tuition')) itemsMap.tuition = amt
      else if (name.includes('exam')) itemsMap.exam = amt
      else if (name.includes('annual')) itemsMap.annual = amt
      else if (name.includes('computer') || name.includes('lab')) itemsMap.computer = amt
      else if (name.includes('transport') || name.includes('bus')) itemsMap.transport = amt
      else if (name.includes('due') || name.includes('previous')) itemsMap.due = amt
      else {
        itemsMap[name] = amt
      }
    })
  }

  const tuitionFee = itemsMap.tuition ?? (bill.tuition !== undefined && bill.tuition !== '' ? bill.tuition : '')
  const examFee = itemsMap.exam ?? (bill.exam !== undefined && bill.exam !== '' ? bill.exam : '')
  const annualFee = itemsMap.annual ?? (bill.annual !== undefined && bill.annual !== '' ? bill.annual : '')
  const computerFee = itemsMap.computer ?? (bill.computer !== undefined && bill.computer !== '' ? bill.computer : '')
  const transportFee = itemsMap.transport ?? (bill.transport !== undefined && bill.transport !== '' ? bill.transport : '')
  const previousDue = itemsMap.due ?? (bill.previous_due !== undefined && bill.previous_due !== '' ? bill.previous_due : (bill.due !== undefined && bill.due !== '' ? bill.due : ''))

  const summary = bill.summary || {}
  const calculatedTotal = Array.isArray(bill.items)
    ? bill.items.reduce((s, it) => s + (Number(it.amount) || 0), 0)
    : (Number(bill.total) || Number(bill.amount) || '')

  const totalAmount = summary.total_amount ?? (calculatedTotal || (bill.total !== undefined ? bill.total : ''))
  const advanceAmount = summary.advance_used ?? (bill.advance_used ?? (bill.advance !== undefined ? bill.advance : ''))
  const netPayable = summary.net_payable ?? (bill.net_payable ?? (bill.netPayable ?? totalAmount))

  const formatRs = (val) => {
    if (val === '' || val === null || val === undefined) return '-'
    const num = Number(val)
    if (isNaN(num)) return val
    if (num === 0) return '-'
    return num.toLocaleString('en-IN')
  }

  return (
    <div
      ref={ref}
      id="bill-slip-capture-node"
      className="bill-receipt-card"
    >
      {/* 1. School Header */}
      <div className="flex items-start justify-between pb-0.5">
        {/* Left: School Logo */}
        <div className="w-12 h-12 shrink-0 flex items-center justify-center pt-0.5">
          <img
            src={schoolLogo}
            alt="Star Public School Crest"
            className="w-11 h-11 object-contain"
          />
        </div>

        {/* Center: School Details (Proper 2 lines with phone number) */}
        <div className="flex-1 text-center px-1">
          <h1 className="text-[15px] font-black tracking-wide uppercase text-black leading-tight">
            STAR PUBLIC SCHOOL
          </h1>
          <p className="text-[9.5px] text-black font-medium leading-tight mt-0.5">
            Meghwal mathia Bazar, West Champaran, Bihar - 845106
          </p>
          <p className="text-[9.5px] text-black font-semibold leading-tight mt-0.5">
            Mob: 9006457330
          </p>
          <p className="text-[10.5px] font-bold text-black uppercase tracking-wider leading-tight mt-1">
            Fee Receipt
          </p>
        </div>

        {/* Right: Office Copy Tag */}
        <div className="w-12 shrink-0 text-right self-start pt-0.5">
          <span className="text-[9px] font-bold text-black tracking-tight italic bg-slate-100/90 px-1.5 py-0.5 rounded border border-black/30 inline-block">
            Office Copy
          </span>
        </div>
      </div>

      {/* Dotted Divider 1 */}
      <hr className="receipt-dotted-rule" />

      {/* 2. Original Student Details (Exactly our 6 fields with aligned colons & better vertical spacing) */}
      <div className="grid grid-cols-2 gap-x-3 text-[10.5px] leading-tight text-black py-1">
        {/* Left Column */}
        <div className="space-y-1.5">
          <div className="flex">
            <span className="w-16 font-bold shrink-0">Bill No</span>
            <span className="w-2.5 font-bold text-center">:</span>
            <span className="font-semibold truncate">{billNo}</span>
          </div>
          <div className="flex">
            <span className="w-16 font-bold shrink-0">Student</span>
            <span className="w-2.5 font-bold text-center">:</span>
            <span className="font-semibold truncate">{studentName}</span>
          </div>
          <div className="flex">
            <span className="w-16 font-bold shrink-0">Class</span>
            <span className="w-2.5 font-bold text-center">:</span>
            <span className="font-semibold truncate">
              {className}
              {sectionName ? ` (${sectionName})` : ''}
            </span>
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-1.5">
          <div className="flex">
            <span className="w-14 font-bold shrink-0">Date</span>
            <span className="w-2.5 font-bold text-center">:</span>
            <span className="font-semibold truncate">{billDate}</span>
          </div>
          <div className="flex">
            <span className="w-14 font-bold shrink-0">Father</span>
            <span className="w-2.5 font-bold text-center">:</span>
            <span className="font-semibold truncate">{fatherName}</span>
          </div>
          <div className="flex">
            <span className="w-14 font-bold shrink-0">Roll</span>
            <span className="w-2.5 font-bold text-center">:</span>
            <span className="font-semibold truncate">{rollNo}</span>
          </div>
        </div>
      </div>

      {/* Dotted Divider 2 */}
      <hr className="receipt-dotted-rule" />

      {/* 3. Fee Breakdown Table & QR / Stamp */}
      <div className="receipt-watermark-container my-0.5">
        {/* Subtle Watermark in background */}
        <div className="receipt-watermark-overlay">
          <img src={schoolLogo} alt="Watermark" />
        </div>

        {/* Main Content Grid: Fee Details on Left, QR & Stamp on Right */}
        <div className="receipt-table-content grid grid-cols-[1fr_100px] gap-2 pt-0.5">
          {/* Left Column: Fee Particulars & Description */}
          <div>
            {/* Particulars Header */}
            <div className="flex justify-between items-center text-[10.5px] font-black uppercase text-black pb-0.5">
              <span>PARTICULARS</span>
              <span>Rs.</span>
            </div>

            <hr className="receipt-dotted-rule" />

            {/* Fee Items */}
            <div className="space-y-1 text-[10px] text-black py-0.5">
              <div className="flex justify-between items-center font-medium">
                <span>Tuition Fee</span>
                <span className="font-semibold font-mono">{formatRs(tuitionFee)}</span>
              </div>
              <div className="flex justify-between items-center font-medium">
                <span>Exam Fee</span>
                <span className="font-semibold font-mono">{formatRs(examFee)}</span>
              </div>
              <div className="flex justify-between items-center font-medium">
                <span>Annual Fee</span>
                <span className="font-semibold font-mono">{formatRs(annualFee)}</span>
              </div>
              <div className="flex justify-between items-center font-medium">
                <span>Computer Fee</span>
                <span className="font-semibold font-mono">{formatRs(computerFee)}</span>
              </div>
              <div className="flex justify-between items-center font-medium">
                <span>Transport Fee</span>
                <span className="font-semibold font-mono">{formatRs(transportFee)}</span>
              </div>
              <div className="flex justify-between items-center font-medium">
                <span>Previous Due</span>
                <span className="font-semibold font-mono">{formatRs(previousDue)}</span>
              </div>
            </div>

            <hr className="receipt-dotted-rule" />

            {/* Description / Summary Rows */}
            <div className="space-y-1 text-[10px] text-black pt-1">
              <div className="flex justify-between items-center font-bold">
                <span>Total</span>
                <span className="font-black font-mono">{formatRs(totalAmount)}</span>
              </div>
              <div className="flex justify-between items-center font-medium">
                <span>Advance</span>
                <span className="font-semibold font-mono">{formatRs(advanceAmount)}</span>
              </div>
              <div className="flex justify-between items-center font-black pt-0.5">
                <span>Net Payable</span>
                <span className="font-black font-mono">{formatRs(netPayable)}</span>
              </div>
            </div>
          </div>

          {/* Right Column: QR Code & School Seal */}
          <div className="flex flex-col items-center justify-between text-center pl-1 border-l border-dotted border-black">
            {/* QR Code */}
            <div className="w-19 h-19 p-1 border border-black bg-white flex items-center justify-center">
              <img src={qrCodeImg} alt="Payment QR" className="w-full h-full object-contain" />
            </div>
            <p className="text-[8px] font-bold text-black leading-tight mt-0.5">
              पेमेंट के लिए<br />QR कोड स्कैन करें
            </p>

            {/* School Seal */}
            <div className="w-15 h-15 mt-1.5 flex items-center justify-center">
              {stampImg ? (
                <img src={stampImg} alt="Stamp" className="w-full h-full object-contain" />
              ) : (
                <div className="w-full h-full border border-black rounded-full flex flex-col items-center justify-center text-[7px] font-bold">
                  <span>★ SPS ★</span>
                  <span className="text-[6px]">West Champaran</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Dotted Divider 3 */}
      <hr className="receipt-dotted-rule" />

      {/* 4. Footer: Receiver Signature with more length & clean line */}
      <div className="flex items-center justify-between text-[10px] font-bold text-black pt-2 pb-1">
        <div className="flex items-center gap-1.5 flex-1">
          <span>Signature of Receiver:</span>
          <span className="flex-1 border-b border-dotted border-black ml-1"></span>
        </div>
        <div className="ml-4 shrink-0">
          <span>(Signature)</span>
        </div>
      </div>
    </div>
  )
})

export default BillSlipCard
