import React, { forwardRef } from 'react'
import schoolLogo from '../../assets/logo.png'
import qrCodeImg from '../../assets/high_quality_qr.png'
import stampImg from '../../assets/stampcert.png'
import './BillSlipCard.css'

/**
 * BillSlipCard - Built with exact HTML & CSS provided by user blueprint
 */
const BillSlipCard = forwardRef(function BillSlipCard({ bill = {} }, ref) {
  const billNo = bill.bill_number || bill.invoice_number || bill.bill_id || 'B-1792409793612'
  const billDate = bill.date
    ? (bill.date.includes('/') ? bill.date : new Date(bill.date).toLocaleDateString('en-GB'))
    : '19/10/2026'
  
  const studentName = bill.student_name || bill.student?.name || bill.name || 'Student'
  const fatherName = bill.father_name || bill.student?.father_name || '-'
  const className = bill.class || bill.student?.class || '-'
  const sectionName = bill.section || bill.student?.section || ''
  const rollNo = bill.roll_no || bill.student?.roll_no || bill.roll || '-'

  // Map fee items
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
    if (val === '' || val === null || val === undefined) return ''
    const num = Number(val)
    if (isNaN(num) || num === 0) return ''
    return num.toLocaleString('en-IN')
  }

  return (
    <div ref={ref} id="bill-slip-capture-node" className="bill-card">
      {/* Header - Exact match to user Canva design image */}
      <header className="school-header">
        {/* SVG Decorative Waves: Top-Left Navy/Gold Arc, Bottom-Left Navy/Gold Arc, and Right Navy Swoosh */}
        <svg
          className="school-header-waves"
          viewBox="0 0 380 96"
          preserveAspectRatio="none"
          fill="none"
        >
          <defs>
            <linearGradient id="headerNavyGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#042e6d" />
              <stop offset="100%" stopColor="#0648a3" />
            </linearGradient>
            <linearGradient id="headerGoldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#deb332" />
              <stop offset="50%" stopColor="#f5d665" />
              <stop offset="100%" stopColor="#cfa528" />
            </linearGradient>
          </defs>

          {/* Top-Left Dark Navy Corner Arc */}
          <path
            d="M 0 0 L 82 0 C 72 12, 60 26, 0 54 Z"
            fill="url(#headerNavyGrad)"
          />
          {/* Top-Left Gold Ribbon Trim */}
          <path
            d="M 82 0 C 72 12, 60 26, 0 54 L 0 58 C 63 29, 75 14, 86 0 Z"
            fill="url(#headerGoldGrad)"
          />

          {/* Bottom-Left Dark Navy Corner Arc */}
          <path
            d="M 0 68 C 24 82, 22 92, 16 96 L 0 96 Z"
            fill="url(#headerNavyGrad)"
          />
          {/* Bottom-Left Gold Ribbon Trim */}
          <path
            d="M 0 64 C 26 80, 24 92, 18 96 L 14 96 C 20 91, 22 81, 0 68 Z"
            fill="url(#headerGoldGrad)"
          />

          {/* Right Navy Wave Swoosh */}
          <path
            d="M 338 0 C 352 18, 360 34, 356 46 C 352 58, 338 78, 320 96 L 380 96 L 380 0 Z"
            fill="url(#headerNavyGrad)"
          />
          {/* Right Gold Ribbon Accent */}
          <path
            d="M 334 0 C 348 18, 356 34, 352 46 C 348 58, 334 78, 316 96 L 320 96 C 338 78, 352 58, 356 46 C 360 34, 352 18, 338 0 Z"
            fill="url(#headerGoldGrad)"
          />

          {/* Subtle starry sparkles inside right navy wave */}
          <circle cx="366" cy="18" r="1.1" fill="#fff7d6" opacity="0.85" />
          <circle cx="373" cy="36" r="1.3" fill="#fff7d6" opacity="0.7" />
          <circle cx="363" cy="72" r="1.1" fill="#fff7d6" opacity="0.8" />
          <circle cx="369" cy="84" r="1.4" fill="#fff7d6" opacity="0.9" />
          <circle cx="374" cy="58" r="0.9" fill="#ffffff" opacity="0.9" />
        </svg>

        {/* Circular White Medallion with Gold Crest */}
        <div className="school-logo-medallion">
          <img src={schoolLogo} alt="Star Public School Crest" />
        </div>

        {/* School Details - Perfectly Centered in Middle White Space */}
        <div className="school-title">
          <h1>STAR PUBLIC SCHOOL</h1>
          <p>Meghwal mathia Bazar, West Champaran, Bihar 845106</p>
          <strong>Mob: 9006457330</strong>
        </div>
      </header>

      {/* Student Information */}
      <section className="student-info">
        <div>
          <p><b>▣ Bill No:</b> {billNo}</p>
          <p><b>● Student:</b> {studentName}</p>
          <p><b>🎓 Class:</b> {className}{sectionName ? ` (${sectionName})` : ''}</p>
        </div>

        <div>
          <p><b>▣ Date:</b> {billDate}</p>
          <p><b>● Father:</b> {fatherName}</p>
          <p><b>▣ Roll:</b> {rollNo}</p>
        </div>
      </section>

      {/* Main Content */}
      <main className="main-content">
        {/* Left Side */}
        <div className="left-content">
          <section className="fee-section">
            <div className="section-heading">
              <span>Details</span>
              <span>Rs.</span>
            </div>

            <div className="fee-row">
              <span>🎓 Tuition Fee</span>
              <span>{formatRs(tuitionFee)}</span>
            </div>

            <div className="fee-row">
              <span>▣ Exam Fee</span>
              <span>{formatRs(examFee)}</span>
            </div>

            <div className="fee-row">
              <span>▦ Annual Fee</span>
              <span>{formatRs(annualFee)}</span>
            </div>

            <div className="fee-row">
              <span>▣ Computer Fee</span>
              <span>{formatRs(computerFee)}</span>
            </div>

            <div className="fee-row">
              <span>▣ Transport Fee</span>
              <span>{formatRs(transportFee)}</span>
            </div>

            <div className="fee-row">
              <span>◷ Previous Due</span>
              <span>{formatRs(previousDue)}</span>
            </div>
          </section>

          <section className="fee-section description-section">
            <div className="section-heading">
              <span>Description</span>
              <span>Rs.</span>
            </div>

            <div className="fee-row">
              <span>● Total</span>
              <span>{formatRs(totalAmount)}</span>
            </div>

            <div className="fee-row">
              <span>↓ Advance</span>
              <span>{formatRs(advanceAmount)}</span>
            </div>

            <div className="fee-row">
              <span>▣ Net Payable</span>
              <span>{formatRs(netPayable)}</span>
            </div>
          </section>
        </div>

        {/* Right Side */}
        <aside className="right-content">
          <div className="qr-wrapper">
            <img src={qrCodeImg} alt="Payment QR Code" />
          </div>

          <p className="qr-text">
            पेमेंट के लिए<br />
            QR कोड स्कैन करे
          </p>

          <div className="school-seal">
            {stampImg ? (
              <img src={stampImg} alt="Star Public School Stamp" />
            ) : (
              <>
                <div className="seal-star">★</div>
                <strong>STAR PUBLIC SCHOOL</strong>
                <small>West Champaran</small>
              </>
            )}
          </div>
        </aside>
      </main>

      {/* Footer */}
      <footer className="bill-footer">
        <div className="signature-icon">✎</div>
        <span>Signature of Receiver:</span>
        <div className="signature-line"></div>
      </footer>
    </div>
  )
})

export default BillSlipCard
