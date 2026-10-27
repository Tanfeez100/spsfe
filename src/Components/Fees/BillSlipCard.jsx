import React, { forwardRef } from 'react'
import schoolLogo from '../../assets/logo.png'
import qrCodeImg from '../../assets/high_quality_qr.png'
import stampImg from '../../assets/stampcert.png'
import './BillSlipCard.css'

/**
 * Format date cleanly into DD/MM/YYYY
 */
const formatReceiptDate = (dateVal) => {
  if (!dateVal) return new Date().toLocaleDateString('en-GB')
  const str = String(dateVal).trim()
  if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(str)) {
    return str
  }
  try {
    const d = new Date(str)
    if (!isNaN(d.getTime())) {
      const day = String(d.getDate()).padStart(2, '0')
      const month = String(d.getMonth() + 1).padStart(2, '0')
      const year = d.getFullYear()
      return `${day}/${month}/${year}`
    }
  } catch (_) { }
  return str.split('T')[0]
}

/**
 * BillSlipCard - Uses the reference receipt's dotted-rule & watermark design,
 * strictly keeping only our original school fields, backend-integrated fee heads,
 * and 4-in-1 A4 sheet compatibility.
 * On paid bills / payment receipts, displays official payment details & PAID stamp instead of payment QR code.
 */
const BillSlipCard = forwardRef(function BillSlipCard({ bill = {}, isPrint = false }, ref) {
  // 1. Original Student & Receipt Fields from Backend
  const billNo = bill.bill_number || bill.invoice_number || bill.receipt_no || bill.receipt_number || bill.bill_id || '-'
  const billDate = formatReceiptDate(bill.date || bill.created_at || bill.payment_date)

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

  const studentUsesTransport = Boolean(
    bill.uses_transport ||
    bill.student?.uses_transport ||
    String(bill.uses_transport || '').toLowerCase() === 'true' ||
    String(bill.student?.uses_transport || '').toLowerCase() === 'true'
  )
  const studentTransportCharge = Number(bill.transport_charge || bill.student?.transport_charge || bill.transport_fee || 0)

  let effectiveTransport = itemsMap.transport
  if ((effectiveTransport === undefined || effectiveTransport === '' || Number(effectiveTransport) === 0) && studentUsesTransport && studentTransportCharge > 0) {
    effectiveTransport = studentTransportCharge
  }

  const tuitionFee = itemsMap.tuition ?? (bill.tuition !== undefined && bill.tuition !== '' ? bill.tuition : '')
  const examFee = itemsMap.exam ?? (bill.exam !== undefined && bill.exam !== '' ? bill.exam : '')
  const annualFee = itemsMap.annual ?? (bill.annual !== undefined && bill.annual !== '' ? bill.annual : '')
  const computerFee = itemsMap.computer ?? (bill.computer !== undefined && bill.computer !== '' ? bill.computer : '')
  const transportFee = effectiveTransport ?? (bill.transport !== undefined && bill.transport !== '' ? bill.transport : '')
  const previousDue = itemsMap.due ?? (bill.previous_due !== undefined && bill.previous_due !== '' ? bill.previous_due : (bill.due !== undefined && bill.due !== '' ? bill.due : ''))

  const summary = bill.summary || {}
  const itemsSum = Array.isArray(bill.items)
    ? bill.items.reduce((s, it) => {
        const n = (it.fee_name || it.name || '').toLowerCase()
        let itAmt = Number(it.amount) || 0
        if (n.includes('transport') && itAmt === 0 && studentUsesTransport && studentTransportCharge > 0) {
          itAmt = studentTransportCharge
        }
        return s + itAmt
      }, 0)
    : 0

  const calculatedTotal = itemsSum > 0
    ? itemsSum
    : (Number(bill.total) || Number(bill.amount) || Number(bill.total_fee) || 0)

  const rawSummaryTotal = Number(summary.total_amount ?? (bill.total !== undefined ? bill.total : 0))
  const totalAmount = Math.max(rawSummaryTotal, calculatedTotal)

  // Payment details for receipt
  const paymentsList = Array.isArray(bill.payments) ? bill.payments : []
  const latestPayment = paymentsList.length > 0 ? paymentsList[0] : null
  const receiptNo = latestPayment?.receipt_no || bill.receipt_no || bill.receipt_number || billNo

  // Direct payments vs Advance adjusted (prevent double-counting advance)
  let directPaid = 0
  let advancePaidFromPayments = 0

  if (paymentsList.length > 0) {
    paymentsList.forEach((p) => {
      const amt = Number(p.amount_paid || 0)
      const mode = (p.payment_mode || '').toLowerCase()
      if (mode === 'advance') {
        advancePaidFromPayments += amt
      } else if (mode !== 'dues_adjustment') {
        directPaid += amt
      }
    })
  } else if (summary.direct_paid !== undefined) {
    directPaid = Number(summary.direct_paid)
  } else {
    const rawPaid = Number(summary.total_paid ?? (bill.total_paid ?? (bill.paid_amount ?? 0)))
    const rawMode = String(bill.payment_mode || '').toLowerCase()
    if (rawMode === 'advance') {
      directPaid = 0
    } else {
      directPaid = rawPaid
    }
  }

  const advanceUsedFromProps = Number(summary.advance_used ?? (bill.advance_used ?? (bill.advance !== undefined ? bill.advance : 0)))
  const advanceAmount = Math.max(advancePaidFromPayments, advanceUsedFromProps)
  const totalSettled = directPaid + advanceAmount
  const advanceGenerated = Number(summary.advance_generated ?? (bill.advance_generated ?? (directPaid > totalAmount ? directPaid - totalAmount : 0)))

  let remainingDue = 0
  if (summary.remaining !== undefined) {
    remainingDue = Number(summary.remaining)
  } else if (summary.net_payable !== undefined) {
    remainingDue = Number(summary.net_payable)
  } else if (bill.net_payable !== undefined) {
    remainingDue = Number(bill.net_payable)
  } else if (bill.netPayable !== undefined) {
    remainingDue = Number(bill.netPayable)
  } else if (bill.remaining !== undefined) {
    remainingDue = Number(bill.remaining)
  } else if (bill.due_amount !== undefined) {
    remainingDue = Number(bill.due_amount)
  } else {
    remainingDue = Math.max(0, totalAmount - totalSettled)
  }

  // If amount was paid and totalAmount > 0, recalculate remainingDue strictly to avoid stale full total
  if (totalAmount > 0 && totalSettled > 0 && remainingDue >= totalAmount) {
    remainingDue = Math.max(0, totalAmount - totalSettled)
  }

  const rawStatus = String(summary.status || bill.bill_status || bill.status || '').toLowerCase()
  const isExplicitBill = Boolean(bill.isBill || bill.type === 'bill' || (!bill.isReceipt && rawStatus === 'unpaid'))
  const isPaid = !isExplicitBill && ((totalAmount > 0 && totalSettled >= totalAmount) || (remainingDue <= 0 && (rawStatus === 'paid' || totalSettled > 0)))
  if (isPaid) {
    remainingDue = 0
  }
  const isPartial = !isExplicitBill && !isPaid && (rawStatus === 'partial' || totalSettled > 0) && remainingDue > 0

  let paymentModeRaw = latestPayment?.payment_mode || bill.payment_mode || (advanceAmount > 0 && directPaid === 0 ? 'Advance' : (directPaid > 0 ? 'Paid' : ''))
  const paymentModeLabel = paymentModeRaw
    ? String(paymentModeRaw).replace(/_/g, ' ').toUpperCase()
    : (advanceAmount >= totalAmount ? 'ADVANCE ADJUSTED' : 'PAID')

  const paymentDate = formatReceiptDate(latestPayment?.payment_date || bill.payment_date || bill.date)

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
      <div className="flex items-start justify-between">
        {/* Left: School Logo */}
        <div className="w-11 h-11 shrink-0 flex items-center justify-center pt-0.5">
          <img
            src={schoolLogo}
            alt="Star Public School Crest"
            className="w-10 h-10 object-contain"
          />
        </div>

        {/* Center: School Details */}
        <div className="flex-1 text-center px-1">
          <h1 className="text-[14.5px] font-black tracking-wide uppercase text-black leading-tight">
            STAR PUBLIC SCHOOL
          </h1>
          <p className="text-[9.5px] text-black font-medium leading-tight mt-0.5">
            Meghwal mathia Bazar, West Champaran, Bihar 845106
          </p>
          <p className="text-[9.5px] text-black font-semibold leading-tight">
            Mob: 9006457330
          </p>
          <p className="text-[10px] font-black tracking-wide text-black leading-tight mt-0.5 uppercase">
            {isExplicitBill ? 'Fee Bill' : isPaid ? 'Fee Payment Receipt' : isPartial ? 'Partial Fee Receipt' : 'Fee Bill'}
          </p>
        </div>

        {/* Right: Copy Tag */}
        <div className="w-16 shrink-0 text-right self-end pb-0.5">
          <span className="text-[9px] font-bold text-black tracking-tight italic">
            {isExplicitBill ? 'Student Copy' : isPaid ? 'Parent Copy' : 'Office Copy'}
          </span>
        </div>
      </div>

      {/* Dotted Divider 1 */}
      <hr className="receipt-dotted-rule" />

      {/* 2. Original Student Details (Col 1 = Bill No, Student, Father | Col 2 = Date, Class, Roll) */}
      <div className="grid grid-cols-[1.18fr_0.82fr] gap-x-2 text-[10.5px] leading-tight text-black">
        {/* Left Column: Bill No, Student, Father */}
        <div className="space-y-0.5 min-w-0">
          <div className="flex">
            <span className="w-16 font-bold shrink-0">{!isExplicitBill && isPaid ? 'Receipt No' : 'Bill No'}</span>
            <span className="w-2.5 font-bold text-center">:</span>
            <span className="font-semibold truncate">{billNo}</span>
          </div>
          <div className="flex">
            <span className="w-16 font-bold shrink-0">Student</span>
            <span className="w-2.5 font-bold text-center">:</span>
            <span className="font-semibold truncate">{studentName}</span>
          </div>
          <div className="flex">
            <span className="w-16 font-bold shrink-0">Father</span>
            <span className="w-2.5 font-bold text-center">:</span>
            <span className="font-semibold truncate">{fatherName}</span>
          </div>
        </div>

        {/* Right Column: Date, Class, Roll */}
        <div className="space-y-0.5 min-w-0">
          <div className="flex">
            <span className="w-12 font-bold shrink-0">Date</span>
            <span className="w-2.5 font-bold text-center">:</span>
            <span className="font-semibold truncate">{billDate}</span>
          </div>
          <div className="flex">
            <span className="w-12 font-bold shrink-0">Class</span>
            <span className="w-2.5 font-bold text-center">:</span>
            <span className="font-semibold truncate">
              {className}
              {sectionName ? ` (${sectionName})` : ''}
            </span>
          </div>
          <div className="flex">
            <span className="w-12 font-bold shrink-0">Roll</span>
            <span className="w-2.5 font-bold text-center">:</span>
            <span className="font-semibold truncate">{rollNo}</span>
          </div>
        </div>
      </div>

      {/* Dotted Divider 2 */}
      <hr className="receipt-dotted-rule" />

      {/* 3. Fee Breakdown Table & QR / Stamp */}
      <div className="receipt-watermark-container">
        {/* Subtle Watermark in background */}
        <div className="receipt-watermark-overlay">
          <img src={schoolLogo} alt="Watermark" />
        </div>

        {/* Main Content Grid: Fee Details on Left, QR & Stamp on Right */}
        <div className="receipt-table-content grid grid-cols-[1fr_100px] gap-2 pt-0.5">
          {/* Left Column: Fee Particulars & Description */}
          <div>
            {/* Particulars Header */}
            <div className="flex justify-between items-center text-[10.5px] font-black uppercase text-black">
              <span>PARTICULARS</span>
              <span>Rs.</span>
            </div>

            <hr className="receipt-dotted-rule" />

            {/* Fee Items */}
            <div className="space-y-0.5 text-[10px] text-black">
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
            <div className="space-y-0.5 text-[10px] text-black pt-0.5">
              <div className="flex justify-between items-center font-bold">
                <span>Total</span>
                <span className="font-black font-mono">{formatRs(totalAmount)}</span>
              </div>

              {advanceAmount > 0 && (
                <div className="flex justify-between items-center font-medium receipt-green-text">
                  <span>Advance Adjusted</span>
                  <span className="font-semibold font-mono">-{formatRs(advanceAmount)}</span>
                </div>
              )}

              {directPaid > 0 && (
                <div className="flex justify-between items-center font-medium receipt-green-text">
                  <span>Amount Paid</span>
                  <span className="font-semibold font-mono">{formatRs(directPaid)}</span>
                </div>
              )}

              {advanceGenerated > 0 && (
                <div className="flex justify-between items-center font-bold text-purple-700">
                  <span>Advance Deposit</span>
                  <span className="font-semibold font-mono">+₹{formatRs(advanceGenerated)}</span>
                </div>
              )}

              <div className="flex justify-between items-center font-black pt-0.5 border-t border-dotted border-black/30">
                <span>{isExplicitBill ? 'Net Payable' : isPaid ? 'Balance Due' : isPartial ? 'Balance Due' : 'Net Payable'}</span>
                <span className={`font-black font-mono ${!isExplicitBill && isPaid ? 'receipt-green-text' : !isExplicitBill && isPartial ? 'receipt-red-text' : ''}`}>
                  {isExplicitBill ? formatRs(totalAmount) : isPaid ? '₹0 (PAID)' : isPartial ? `₹${formatRs(remainingDue)} (DUE)` : formatRs(remainingDue)}
                </span>
              </div>
            </div>
          </div>

          {/* Right Column: QR Code or Payment Stamp & Details */}
          <div className="flex flex-col items-center justify-between text-center pl-1 border-l border-dotted border-black">
            {!isExplicitBill && isPaid ? (
              /* PAID RECEIPT: Payment Details & Official Paid Stamp (NO QR CODE) */
              <div className="w-full flex flex-col items-center justify-between h-full py-0.5">
                {/* Official PAID Badge */}
                <div className="receipt-paid-badge">
                  <div className="receipt-paid-star-text">
                    <span>★</span>
                    <span>PAID</span>
                    <span>★</span>
                  </div>
                  <div className="receipt-paid-mode-text">
                    {paymentModeLabel}
                  </div>
                </div>

                {/* Payment Details Box */}
                <div className="receipt-details-box space-y-0.5">
                  <div className="truncate">
                    <span className="font-bold">RCP: </span>
                    <span className="font-mono text-[7px] font-semibold">{receiptNo}</span>
                  </div>
                  <div className="truncate">
                    <span className="font-bold">Date: </span>
                    <span className="font-medium">{paymentDate}</span>
                  </div>
                  <div>
                    <span className="font-bold">Paid: </span>
                    <span className="font-bold receipt-green-text">₹{formatRs(totalSettled || totalAmount)}</span>
                  </div>
                  {advanceGenerated > 0 && (
                    <div>
                      <span className="font-bold">Adv: </span>
                      <span className="font-bold text-purple-700 font-mono">+₹{formatRs(advanceGenerated)}</span>
                    </div>
                  )}
                  <div>
                    <span className="font-bold">Bal: </span>
                    <span className="font-bold receipt-green-text">₹0</span>
                  </div>
                </div>
              </div>
            ) : !isExplicitBill && isPartial ? (
              /* PARTIAL PAYMENT RECEIPT: Partial Badge, Payment Details Box with Due */
              <div className="w-full flex flex-col items-center justify-between h-full py-0.5">
                <div className="receipt-partial-badge">
                  <div className="receipt-paid-star-text" style={{ color: '#92400e' }}>
                    <span>★</span>
                    <span>PARTIAL PAID</span>
                    <span>★</span>
                  </div>
                  <div className="receipt-paid-mode-text" style={{ color: '#b45309' }}>
                    {paymentModeLabel}
                  </div>
                </div>

                {/* Payment Details Box with Due Balance */}
                <div className="receipt-details-box space-y-0.5">
                  <div className="truncate">
                    <span className="font-bold">RCP: </span>
                    <span className="font-mono text-[7px] font-semibold">{receiptNo}</span>
                  </div>
                  <div className="truncate">
                    <span className="font-bold">Date: </span>
                    <span className="font-medium">{paymentDate}</span>
                  </div>
                  <div>
                    <span className="font-bold">Paid: </span>
                    <span className="font-bold receipt-green-text">₹{formatRs(totalSettled)}</span>
                  </div>
                  <div>
                    <span className="font-bold">Bal: </span>
                    <span className="font-bold receipt-red-text">₹{formatRs(remainingDue)}</span>
                  </div>
                </div>
              </div>
            ) : (
              /* UNPAID DEMAND SLIP: QR Code to scan & pay */
              <>
                <div className="w-18 h-18 p-1 border border-black bg-white flex items-center justify-center">
                  <img src={qrCodeImg} alt="Payment QR" className="w-full h-full object-contain" />
                </div>
                <p className="text-[8px] font-bold text-black leading-tight mt-0.5">
                  पेमेंट के लिए<br />QR कोड स्कैन करें
                </p>

                {/* School Seal */}
                <div className="w-14 h-14 mt-1 flex items-center justify-center">
                  {stampImg ? (
                    <img src={stampImg} alt="Stamp" className="w-full h-full object-contain" />
                  ) : (
                    <div className="w-full h-full border border-black rounded-full flex flex-col items-center justify-center text-[7px] font-bold">
                      <span>★ SPS ★</span>
                      <span className="text-[6px]">West Champaran</span>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Dotted Divider 3 */}
      <hr className="receipt-dotted-rule" />

      {/* 4. Footer: Receiver Signature */}
      <div className="flex items-center justify-between text-[10px] font-bold text-black pt-1 pb-0.5">
        <div className="flex items-center gap-1.5 flex-1">
          <span>Signature of Receiver:</span>
          <span className="flex-1 border-b border-dotted border-black"></span>
        </div>
        <div className="ml-4 shrink-0">
          <span>(Signature)</span>
        </div>
      </div>
    </div>
  )
})

export default BillSlipCard
