import React, { forwardRef } from 'react'
import schoolLogo from '../../assets/logo.png'
import './BillSlipCard.css'

// Helper: Convert number to words in Indian Numbering System
function convertNumberToWords(num) {
  const n = Math.floor(Number(num) || 0)
  if (n <= 0) return 'Zero Rupees'

  const ones = [
    '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
    'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen',
    'Seventeen', 'Eighteen', 'Nineteen',
  ]
  const tens = [
    '', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety',
  ]

  const convertLessThanOneThousand = (number) => {
    let current = ''
    if (number >= 100) {
      current += ones[Math.floor(number / 100)] + ' Hundred '
      number %= 100
    }
    if (number >= 20) {
      current += tens[Math.floor(number / 10)] + ' '
      number %= 10
    }
    if (number > 0) {
      current += ones[number] + ' '
    }
    return current.trim()
  }

  let words = ''
  const crore = Math.floor(n / 10000000)
  let remainder = n % 10000000
  const lakh = Math.floor(remainder / 100000)
  remainder %= 100000
  const thousand = Math.floor(remainder / 1000)
  remainder %= 1000

  if (crore > 0) {
    words += convertLessThanOneThousand(crore) + ' Crore '
  }
  if (lakh > 0) {
    words += convertLessThanOneThousand(lakh) + ' Lakh '
  }
  if (thousand > 0) {
    words += convertLessThanOneThousand(thousand) + ' Thousand '
  }
  if (remainder > 0) {
    words += convertLessThanOneThousand(remainder) + ' '
  }

  return `${words.trim()} Rupees Only`
}

const formatNumber = (val) => {
  if (val === '' || val === null || val === undefined) return '0'
  const num = Number(val)
  if (isNaN(num)) return val
  return num.toLocaleString('en-IN')
}

/**
 * BillSlipCard - Replicates the reference receipt design while preserving
 * Star Public School branding, real backend data connections, and strict
 * 4-bills-per-A4-page dimensions.
 */
const BillSlipCard = forwardRef(function BillSlipCard({ bill = {}, isPrint = false }, ref) {
  // 1. School Information
  const schoolName = bill.school_name || 'STAR PUBLIC SCHOOL'
  const schoolAddress = bill.school_address || 'Meghwal mathia Bazar, West Champaran, Bihar 845106'
  const schoolMobile = bill.school_mobile || 'Mob: 9006457330'
  const sessionYear = bill.session || '2026-2027'
  const copyType = bill.copy_type || bill.copyType || 'Office Copy'

  // 2. Student & Receipt Information from Backend
  const admissionNo =
    bill.admission_no ||
    bill.admission_number ||
    bill.student?.admission_number ||
    bill.student?.admission_no ||
    bill.roll_no ||
    bill.roll ||
    '-'

  const studentName =
    bill.student_name ||
    bill.name ||
    bill.student?.name ||
    'Student'

  const fatherName =
    bill.father_name ||
    bill.student?.father_name ||
    bill.student?.father ||
    bill.Father ||
    '-'

  const motherName =
    bill.mother_name ||
    bill.student?.mother_name ||
    bill.student?.mother ||
    bill.Mother ||
    '-'

  const billNo =
    bill.bill_number ||
    bill.receipt_no ||
    bill.receipt_number ||
    bill.invoice_number ||
    bill.bill_id ||
    'REC-1001'

  const billDate = bill.date
    ? (bill.date.includes('/') || bill.date.includes('-')
        ? bill.date
        : new Date(bill.date).toLocaleDateString('en-GB'))
    : new Date().toLocaleDateString('en-GB')

  const className = bill.class || bill.student?.class || '-'
  const sectionName = bill.section || bill.student?.section || ''
  const classDisplay = sectionName ? `${className} - ${sectionName}` : className

  const dob =
    bill.dob ||
    bill.date_of_birth ||
    bill.student?.date_of_birth ||
    '-'

  const installment =
    bill.installment ||
    bill.month ||
    bill.billing_month ||
    'OCTOBER 2026'

  const route =
    bill.route ||
    bill.transport_route ||
    (bill.uses_transport || Number(bill.transport || 0) > 0 ? 'School Transport Route' : 'Local')

  const destination =
    bill.destination ||
    bill.address ||
    bill.student?.address ||
    'West Champaran'

  // 3. Fee Items from Backend (Items array or individual fee fields)
  let items = []
  if (Array.isArray(bill.items) && bill.items.length > 0) {
    items = bill.items
      .filter((it) => Number(it.amount || 0) > 0)
      .map((it) => ({
        name: (it.fee_name || it.name || 'Fee').toUpperCase(),
        amount: Number(it.amount || 0),
      }))
  }

  if (items.length === 0) {
    const directItems = []
    if (Number(bill.tuition || 0) > 0) directItems.push({ name: 'TUITION FEE', amount: Number(bill.tuition) })
    if (Number(bill.computer || bill.lab || 0) > 0) directItems.push({ name: 'COMPUTER FEE', amount: Number(bill.computer || bill.lab) })
    if (Number(bill.transport || 0) > 0) directItems.push({ name: 'TRANSPORT FEE', amount: Number(bill.transport) })
    if (Number(bill.exam || 0) > 0) directItems.push({ name: 'EXAM FEE', amount: Number(bill.exam) })
    if (Number(bill.annual || 0) > 0) directItems.push({ name: 'ANNUAL FEE', amount: Number(bill.annual) })
    if (Number(bill.hostel || 0) > 0) directItems.push({ name: 'HOSTEL FEE', amount: Number(bill.hostel) })
    if (Number(bill.previous_due || bill.due || 0) > 0) directItems.push({ name: 'PREVIOUS DUE', amount: Number(bill.previous_due || bill.due) })

    if (directItems.length > 0) {
      items = directItems
    } else {
      // Default standard fee breakdown if no items exist
      items = [
        { name: 'TUITION FEE', amount: 1500 },
        { name: 'COMPUTER FEE', amount: 300 },
        { name: 'TRANSPORT FEE', amount: 600 },
      ]
    }
  }

  // 4. Totals and Calculations
  const calculatedSum = items.reduce((acc, it) => acc + (Number(it.amount) || 0), 0)
  const calculatedFee = bill.calculated_fee !== undefined ? Number(bill.calculated_fee) : calculatedSum

  const concession =
    bill.concession !== undefined
      ? Number(bill.concession)
      : (bill.discount !== undefined ? Number(bill.discount) : (Number(bill.advance_used || 0)))

  const discount = Number(bill.special_discount || 0)

  const netPayable =
    bill.net_payable !== undefined
      ? Number(bill.net_payable)
      : (bill.total !== undefined ? Number(bill.total) : Math.max(0, calculatedFee - concession - discount))

  const paymentMode = bill.payment_mode || bill.mode || 'Cash'

  const totalPaid =
    bill.paid_amount !== undefined
      ? Number(bill.paid_amount)
      : (bill.total_paid !== undefined ? Number(bill.total_paid) : netPayable)

  const dueAmount =
    bill.due_amount !== undefined
      ? Number(bill.due_amount)
      : Math.max(0, netPayable - totalPaid)

  const remark = bill.remark || bill.remarks || 'FEE PAYMENT RECEIVED'
  const amountInWords = bill.amount_in_words || convertNumberToWords(totalPaid)

  return (
    <div
      ref={ref}
      id="bill-slip-capture-node"
      className="bill-receipt-card"
    >
      {/* 1. Header Section */}
      <div className="flex items-start justify-between">
        {/* Left: School Logo */}
        <div className="w-12 h-12 shrink-0 flex items-center justify-center pt-0.5">
          <img
            src={schoolLogo}
            alt="School Crest"
            className="w-11 h-11 object-contain"
          />
        </div>

        {/* Center: School Branding */}
        <div className="flex-1 text-center px-1">
          <h1 className="text-base sm:text-lg font-black tracking-wide uppercase text-black leading-tight">
            {schoolName}
          </h1>
          <p className="text-[10px] sm:text-[10.5px] text-black font-medium leading-tight mt-0.5">
            {schoolAddress}
          </p>
          <p className="text-[10px] sm:text-[10.5px] text-black font-medium leading-tight">
            {schoolMobile}
          </p>
          <p className="text-[10.5px] font-bold text-black leading-tight mt-0.5">
            Fee Receipt {sessionYear}
          </p>
        </div>

        {/* Right: Copy Tag */}
        <div className="w-16 shrink-0 text-right self-end pb-0.5">
          <span className="text-[10px] font-semibold text-black tracking-tight italic">
            {copyType}
          </span>
        </div>
      </div>

      {/* Dotted Divider 1 */}
      <hr className="receipt-dotted-rule" />

      {/* 2. Student Information (2 Columns with aligned colons) */}
      <div className="grid grid-cols-2 gap-x-2 text-[10.5px] sm:text-[11px] leading-tight text-black">
        {/* Left Column */}
        <div className="space-y-0.5">
          <div className="flex">
            <span className="w-22 font-bold shrink-0">Admission No.</span>
            <span className="w-3 font-bold text-center">:</span>
            <span className="font-semibold truncate">{admissionNo}</span>
          </div>
          <div className="flex">
            <span className="w-22 font-bold shrink-0">Name</span>
            <span className="w-3 font-bold text-center">:</span>
            <span className="font-semibold truncate">{studentName}</span>
          </div>
          <div className="flex">
            <span className="w-22 font-bold shrink-0">F. Name</span>
            <span className="w-3 font-bold text-center">:</span>
            <span className="font-semibold truncate">{fatherName}</span>
          </div>
          <div className="flex">
            <span className="w-22 font-bold shrink-0">Receipt No.</span>
            <span className="w-3 font-bold text-center">:</span>
            <span className="font-semibold truncate">{billNo}</span>
          </div>
          <div className="flex">
            <span className="w-22 font-bold shrink-0">Dob</span>
            <span className="w-3 font-bold text-center">:</span>
            <span className="font-semibold truncate">{dob}</span>
          </div>
          <div className="flex">
            <span className="w-22 font-bold shrink-0">Route</span>
            <span className="w-3 font-bold text-center">:</span>
            <span className="font-semibold truncate">{route}</span>
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-0.5">
          <div className="flex">
            <span className="w-18 font-bold shrink-0">Date</span>
            <span className="w-3 font-bold text-center">:</span>
            <span className="font-semibold truncate">{billDate}</span>
          </div>
          <div className="flex">
            <span className="w-18 font-bold shrink-0">Class</span>
            <span className="w-3 font-bold text-center">:</span>
            <span className="font-semibold truncate">{classDisplay}</span>
          </div>
          <div className="flex">
            <span className="w-18 font-bold shrink-0">M. Name</span>
            <span className="w-3 font-bold text-center">:</span>
            <span className="font-semibold truncate">{motherName}</span>
          </div>
          <div className="flex">
            <span className="w-18 font-bold shrink-0">Install</span>
            <span className="w-3 font-bold text-center">:</span>
            <span className="font-semibold truncate">{installment}</span>
          </div>
          <div className="flex">
            <span className="w-18 font-bold shrink-0">Destination</span>
            <span className="w-3 font-bold text-center">:</span>
            <span className="font-semibold truncate">{destination}</span>
          </div>
        </div>
      </div>

      {/* Dotted Divider 2 */}
      <hr className="receipt-dotted-rule" />

      {/* 3. Fee Particulars Table with Logo Watermark */}
      <div className="receipt-watermark-container">
        {/* Faded Watermark Crest */}
        <div className="receipt-watermark-overlay">
          <img src={schoolLogo} alt="Watermark" />
        </div>

        {/* Table Content */}
        <div className="receipt-table-content">
          {/* Header Row */}
          <div className="flex justify-between items-center text-[11px] font-black uppercase text-black pt-0.5">
            <span>PARTICULARS</span>
            <span>Amount</span>
          </div>

          <hr className="receipt-dotted-rule" />

          {/* Item Rows */}
          <div className="space-y-0.5 py-0.5">
            {items.map((it, idx) => (
              <div
                key={idx}
                className="flex justify-between items-center text-[10.5px] sm:text-[11px] font-bold uppercase text-black"
              >
                <span>{it.name}</span>
                <span className="font-semibold text-right">{formatNumber(it.amount)}</span>
              </div>
            ))}
          </div>

          <hr className="receipt-dotted-rule" />

          {/* CALCULATED FEE */}
          <div className="flex justify-between items-center text-[11px] font-black uppercase text-black">
            <span>CALCULATED FEE</span>
            <span className="font-black text-right">{formatNumber(calculatedFee)}</span>
          </div>

          {/* Concession / Discount if any */}
          {concession > 0 && (
            <div className="flex justify-between items-center text-[10.5px] font-bold uppercase text-black py-0.5">
              <span>CONCESSION</span>
              <span className="font-bold text-right">{formatNumber(concession)}</span>
            </div>
          )}

          {discount > 0 && (
            <div className="flex justify-between items-center text-[10.5px] font-bold uppercase text-black py-0.5">
              <span>DISCOUNT</span>
              <span className="font-bold text-right">{formatNumber(discount)}</span>
            </div>
          )}

          {/* NET PAYABLE */}
          <div className="flex justify-between items-center text-[11px] font-black uppercase text-black pt-0.5">
            <span>NET PAYABLE</span>
            <span className="font-black text-right">{formatNumber(netPayable)}</span>
          </div>
        </div>
      </div>

      {/* Dotted Divider 3 */}
      <hr className="receipt-dotted-rule" />

      {/* 4. Payment & Amount in Words */}
      <div className="space-y-0.5 py-0.5">
        <div className="flex justify-between items-center text-[11px] font-black text-black">
          <span>Total Paid By {paymentMode}</span>
          <span className="font-black text-right">{formatNumber(totalPaid)}</span>
        </div>

        <div className="text-center text-[10px] sm:text-[10.5px] font-bold text-black italic py-0.5">
          (In Words) {amountInWords}
        </div>
      </div>

      {/* Dotted Divider 4 */}
      <hr className="receipt-dotted-rule" />

      {/* 5. Due Amount */}
      <div className="flex justify-between items-center text-[11px] font-black uppercase text-black">
        <span>DUE AMT</span>
        <span className="font-black text-right">{formatNumber(dueAmount)}</span>
      </div>

      {/* Dotted Divider 5 */}
      <hr className="receipt-dotted-rule" />

      {/* 6. Remarks */}
      <div className="text-[10.5px] font-black uppercase text-black">
        <span>REMARK : {remark}</span>
      </div>

      {/* 7. Signature Footer */}
      <div className="flex justify-end pt-5 pb-0.5">
        <span className="text-[11px] font-bold text-black">(Signature)</span>
      </div>
    </div>
  )
})

export default BillSlipCard
