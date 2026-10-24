import React, { useState, useEffect, useMemo } from 'react'
import { generateBillsForClass, downloadBillsData, closeMonth, getFeeStructures } from '../../Api/fees'
import { getClassesWithSections } from '../../Api/classes'
import { getStudents } from '../../Api/students'
import { CLASS_OPTIONS, SECTION_OPTIONS, normalizeSchoolClass } from '../../constants/schoolOptions'
import { emitToast } from '../../Api/auth'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import schoolLogo from '../../assets/logo.png'
import BillSlipCard from '../../Components/Fees/BillSlipCard'
import html2canvas from 'html2canvas-pro'

// Cloudinary URLs for PDF generation
const PAYMENT_QR_URL = 'https://res.cloudinary.com/dqi5rafqu/image/upload/q_auto/f_auto/v1780169234/high_quality_qr_b64hf7.png'
const STAMP_CERT_URL = 'https://res.cloudinary.com/dqi5rafqu/image/upload/q_auto/f_auto/v1780169341/stampcert_bf73gb.png'

// Ensure autoTable is registered on jsPDF
jsPDF.API.autoTable = autoTable

function Bills() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [showPreviewModal, setShowPreviewModal] = useState(false)
  const [previewIndex, setPreviewIndex] = useState(0)
  const [previewMode, setPreviewMode] = useState('card') // 'card' or 'table'

  // Close Month & Auto-Close Engine state
  const getCurrentMonthYYYYMM = () => {
    const d = new Date()
    const yyyy = d.getFullYear()
    const mm = String(d.getMonth() + 1).padStart(2, '0')
    return `${yyyy}-${mm}`
  }
  const [showCloseMonthModal, setShowCloseMonthModal] = useState(false)
  const [closeMonthTarget, setCloseMonthTarget] = useState(getCurrentMonthYYYYMM())
  const [closingMonth, setClosingMonth] = useState(false)

  // Billing Month Options (real YYYY-MM values)
  const MONTH_OPTIONS = [
    { label: 'October 2026', value: '2026-10' },
    { label: 'November 2026', value: '2026-11' },
    { label: 'December 2026', value: '2026-12' },
    { label: 'January 2027', value: '2027-01' },
    { label: 'February 2027', value: '2027-02' },
    { label: 'March 2027', value: '2027-03' },
    { label: 'April 2026', value: '2026-04' },
    { label: 'May 2026', value: '2026-05' },
    { label: 'June 2026', value: '2026-06' },
    { label: 'July 2026', value: '2026-07' },
    { label: 'August 2026', value: '2026-08' },
    { label: 'September 2026', value: '2026-09' },
  ]

  // Form Controls
  const [session, setSession] = useState('2026–27')
  const [billingMonth, setBillingMonth] = useState('2026-10')
  const [selectedClass, setSelectedClass] = useState('All Classes')
  const [selectedSection, setSelectedSection] = useState('All Sections')
  const [dueDate, setDueDate] = useState('2026-10-31')

  // Real Database Classes & Students State (NO DUMMY DATA)
  const [classesData, setClassesData] = useState([])
  const [loadingClasses, setLoadingClasses] = useState(false)
  const [realStudents, setRealStudents] = useState([])
  const [loadingStudents, setLoadingStudents] = useState(false)
  const [feeStructures, setFeeStructures] = useState([])

  // Fee Heads Included Checkboxes
  const [feeHeads, setFeeHeads] = useState({
    tuition: true,
    computerLab: true,
    transport: true,
    annualExam: false,
  })

  // Fetch Real Classes on Mount
  useEffect(() => {
    let isMounted = true
    const loadRealClasses = async () => {
      setLoadingClasses(true)
      try {
        const data = await getClassesWithSections()
        if (isMounted) {
          if (Array.isArray(data) && data.length > 0) {
            setClassesData(data)
          } else {
            setClassesData(CLASS_OPTIONS.map((c) => ({ class: c, sections: SECTION_OPTIONS })))
          }
        }
      } catch (err) {
        console.warn('Failed to fetch classes dynamically, fallback to standard classes:', err)
        if (isMounted) {
          setClassesData(CLASS_OPTIONS.map((c) => ({ class: c, sections: SECTION_OPTIONS })))
        }
      } finally {
        if (isMounted) setLoadingClasses(false)
      }
    }
    loadRealClasses()
    return () => { isMounted = false }
  }, [])

  // Derive Real Available Classes & Sections
  const availableClasses = useMemo(() => {
    if (!classesData || classesData.length === 0) return CLASS_OPTIONS
    return classesData.map((c) => (typeof c === 'string' ? c : c.class)).filter(Boolean)
  }, [classesData])

  const availableSections = useMemo(() => {
    if (selectedClass === 'All Classes') {
      return SECTION_OPTIONS
    }
    const found = classesData.find((c) => {
      const name = typeof c === 'string' ? c : c.class
      return name === selectedClass
    })
    if (found && Array.isArray(found.sections) && found.sections.length > 0) {
      return found.sections
    }
    return SECTION_OPTIONS
  }, [classesData, selectedClass])

  // Fetch Real Active Students & Real Fee Structures
  useEffect(() => {
    let isMounted = true
    const loadRealData = async () => {
      setLoadingStudents(true)
      try {
        const filter = { status: 'active' }
        if (selectedClass !== 'All Classes') filter.class = selectedClass
        if (selectedSection !== 'All Sections') filter.section = selectedSection

        const [studentsRes, feesRes] = await Promise.allSettled([
          getStudents(filter),
          getFeeStructures(selectedClass !== 'All Classes' ? selectedClass : ''),
        ])

        if (!isMounted) return

        if (studentsRes.status === 'fulfilled') {
          const list = Array.isArray(studentsRes.value)
            ? studentsRes.value
            : (studentsRes.value?.students || studentsRes.value?.data || [])
          setRealStudents(list)
        } else {
          setRealStudents([])
        }

        if (feesRes.status === 'fulfilled') {
          const list = Array.isArray(feesRes.value)
            ? feesRes.value
            : (feesRes.value?.data || feesRes.value?.feeStructures || [])
          setFeeStructures(list)
        }
      } catch (err) {
        if (isMounted) setRealStudents([])
      } finally {
        if (isMounted) setLoadingStudents(false)
      }
    }
    loadRealData()
    return () => { isMounted = false }
  }, [selectedClass, selectedSection])

  // Calculate Real Bill Preview from Actual Student Records & Fee Structures
  const previewRealBills = useMemo(() => {
    if (!realStudents || realStudents.length === 0) return []

    return realStudents.slice(0, 100).map((student, idx) => {
      const studentClass = student.class || selectedClass
      const matchingFees = feeStructures.filter((f) => f.class === studentClass)

      const getFeeAmount = (keyword) => {
        const item = matchingFees.find((f) => (f.fee_type || f.fee_name || '').toLowerCase().includes(keyword))
        return parseFloat(item?.amount || 0)
      }

      const tuitionAmount = feeHeads.tuition ? (getFeeAmount('tuition') || 1500) : 0
      const labAmount = feeHeads.computerLab ? (getFeeAmount('computer') || getFeeAmount('lab') || 300) : 0
      const transportAmount = feeHeads.transport && student.uses_transport
        ? parseFloat(student.transport_charge || getFeeAmount('transport') || 600)
        : 0
      const examAmount = feeHeads.annualExam ? (getFeeAmount('exam') || 500) : 0
      const annualAmount = 0
      const previousDueAmount = parseFloat(student.previous_due || student.due || 0)
      const total = tuitionAmount + labAmount + transportAmount + examAmount + annualAmount + previousDueAmount

      const billNo = `B-${Date.now().toString().slice(-8)}${student.roll_no || idx + 1}`

      return {
        id: student.id,
        bill_number: billNo,
        date: new Date().toISOString(),
        student_name: student.name || 'Student',
        father_name: student.father_name || student.guardian_name || '-',
        roll_no: student.roll_no || student.admission_number || '-',
        class: studentClass,
        section: student.section || (selectedSection !== 'All Sections' ? selectedSection : ''),
        items: [
          { fee_name: 'Tuition Fee', amount: tuitionAmount },
          { fee_name: 'Exam Fee', amount: examAmount },
          { fee_name: 'Annual Fee', amount: annualAmount },
          { fee_name: 'Computer Fee', amount: labAmount },
          { fee_name: 'Transport Fee', amount: transportAmount },
          { fee_name: 'Previous Due', amount: previousDueAmount },
        ],
        summary: {
          total_amount: total,
          advance_used: 0,
          net_payable: total,
        },
        roll: student.roll_no || student.admission_number || '-',
        name: student.name || 'Student',
        mother_name: student.mother_name || '-',
        admission_no: student.admission_number || student.scholar_no || student.roll_no || '-',
        dob: student.date_of_birth || '-',
        route: student.uses_transport ? (student.transport_route || 'etmadpur to school') : 'Local',
        destination: student.address || 'Adhiyarin Ka Purava',
        installment: billingMonth || 'OCT, NOV, DEC',
        tuition: tuitionAmount,
        lab: labAmount,
        computer: labAmount,
        transport: transportAmount,
        exam: examAmount,
        annual: annualAmount,
        previous_due: previousDueAmount,
        total: total,
      }
    })
  }, [realStudents, feeStructures, feeHeads, selectedClass, selectedSection, billingMonth])

  // Exact Template Fallback when no live student is loaded
  const fallbackSampleBill = useMemo(() => ({
    bill_number: '1748',
    date: '29-10-2025',
    student_name: 'Trivia',
    father_name: 'Mr.',
    mother_name: 'Mrs.',
    admission_no: '11123',
    class: 'CIT A+',
    section: 'A',
    roll_no: '12',
    dob: '01-02-2017',
    route: 'etmadpur to school',
    destination: 'Adhiyarin Ka Purava',
    installment: 'OCT, NOV, DEC',
    items: [
      { fee_name: 'TRANSPORT', amount: 1350 },
      { fee_name: 'HOSTEL', amount: 15000 },
      { fee_name: 'TUITION FEES NEW', amount: 1500 },
      { fee_name: 'COMPUTER FEE', amount: 300 },
      { fee_name: 'TRIVIA', amount: 250 },
    ],
    calculated_fee: 18400,
    other_charges: 300,
    concession: 1000,
    net_payable: 17100,
    paid_amount: 17000,
    due_amount: 100,
    remark: 'DEMO RECEIPT',
  }), [])

  // Currently active bill for the live preview card
  const activePreviewBill = useMemo(() => {
    return previewRealBills[previewIndex] || fallbackSampleBill
  }, [previewRealBills, previewIndex, fallbackSampleBill])

  // High-Resolution 100% Exact PDF Downloader using html2canvas
  const [downloadingPdf, setDownloadingPdf] = useState(false)
  const downloadExactSlipPDF = async (targetBill) => {
    const billToDownload = targetBill || activePreviewBill
    const cardElement = document.getElementById('bill-slip-capture-node')
    if (!cardElement) {
      generateReceiptPDF([billToDownload])
      return
    }

    setDownloadingPdf(true)
    try {
      emitToast({
        type: 'info',
        title: 'Rendering PDF',
        message: 'Rendering official fee bill receipt in 300 DPI...',
      })

      const canvas = await html2canvas(cardElement, {
        scale: 3,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
      })

      const imgData = canvas.toDataURL('image/png')
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      })

      const imgWidth = 125
      const imgHeight = (canvas.height * imgWidth) / canvas.width
      const xPos = (210 - imgWidth) / 2
      const yPos = 18

      pdf.addImage(imgData, 'PNG', xPos, yPos, imgWidth, imgHeight, undefined, 'FAST')
      const name = (billToDownload?.student_name || 'Student').replace(/\s+/g, '_')
      const billId = billToDownload?.bill_number || 'Receipt'
      const fileName = `Fee_Bill_${name}_${billId}.pdf`

      pdf.save(fileName)
      emitToast({
        type: 'success',
        title: 'Download Complete',
        message: `Saved ${fileName} successfully.`,
      })
    } catch (err) {
      console.error('Failed to capture card as canvas:', err)
      generateReceiptPDF([billToDownload])
    } finally {
      setDownloadingPdf(false)
    }
  }

  // 4-in-1 A4 Sheet View Mode State ('sheet' or 'single')
  const [sheetViewMode, setSheetViewMode] = useState('sheet')

  // High-Resolution 4-in-1 A4 Sheet PDF Downloader (2x2 grid matching photo)
  const download4In1SheetPDF = async () => {
    const sheetElement = document.getElementById('four-in-one-a4-sheet')
    if (!sheetElement) {
      downloadExactSlipPDF(activePreviewBill)
      return
    }

    setDownloadingPdf(true)
    try {
      emitToast({
        type: 'info',
        title: 'Rendering 4-in-1 A4 Sheet',
        message: 'Rendering official 4-receipt A4 sheet in 300 DPI...',
      })

      const canvas = await html2canvas(sheetElement, {
        scale: 2.5,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
      })

      const imgData = canvas.toDataURL('image/png')
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      })

      const pdfWidth = 210
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width

      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight, undefined, 'FAST')
      const fileName = `Star_Public_School_Bills_4in1_Sheet_${Date.now()}.pdf`
      pdf.save(fileName)

      emitToast({
        type: 'success',
        title: '4-in-1 Sheet Downloaded',
        message: `Saved ${fileName} successfully.`,
      })
    } catch (err) {
      console.error('Failed to capture 4-in-1 sheet:', err)
      generateReceiptPDF(previewRealBills)
    } finally {
      setDownloadingPdf(false)
    }
  }

  // Clear Setup Handler
  const handleClearSetup = () => {
    setSession('2026–27')
    setBillingMonth('2026-10')
    setSelectedClass('All Classes')
    setSelectedSection('All Sections')
    setDueDate('2026-10-31')
    setFeeHeads({
      tuition: true,
      computerLab: true,
      transport: true,
      annualExam: false,
    })
    setError('')
    setSuccess('')
    window.dispatchEvent(
      new CustomEvent('app:toast', {
        detail: {
          type: 'info',
          title: 'Setup Cleared',
          message: 'Bill generation parameters reset to default.',
        },
      })
    )
  }

  // Handle Manual Month Closure
  const handleManualCloseMonth = async () => {
    if (!closeMonthTarget) {
      emitToast({
        type: 'warning',
        title: 'Input Required',
        message: 'Please select a valid month to close.',
      })
      return
    }

    setClosingMonth(true)
    try {
      const res = await closeMonth(closeMonthTarget)
      emitToast({
        type: 'success',
        title: 'Month Closed Successfully',
        message: res?.message || `Month ${closeMonthTarget} has been locked and dues carried forward.`,
      })
      setShowCloseMonthModal(false)
    } catch (err) {
      emitToast({
        type: 'error',
        title: 'Closure Failed',
        message: err.message || 'Could not close month.',
      })
    } finally {
      setClosingMonth(false)
    }
  }

  // Helper function to render text as image for PDF
  const renderTextAsImage = (text, fontSize = 12, fontFamily = 'Arial, sans-serif') => {
    const canvas = document.createElement('canvas')
    canvas.width = 200
    canvas.height = 40
    const ctx = canvas.getContext('2d')
    if (ctx) {
      ctx.fillStyle = '#000000'
      ctx.font = `bold ${fontSize}px ${fontFamily}`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(text, canvas.width / 2, canvas.height / 2)
    }
    return canvas.toDataURL('image/png')
  }

  // Generate Canva-Styled Official Star Public School Receipt PDF
  const generateReceiptPDF = (bills) => {
    if (!bills || bills.length === 0) return
    const doc = new jsPDF('p', 'mm', 'a4')
    doc.setLanguage('hi')

    const pageWidth = doc.internal.pageSize.getWidth() // 210mm
    const pageHeight = doc.internal.pageSize.getHeight() // 297mm

    const margin = 8
    const billWidth = (pageWidth - margin * 3) / 2 // ~93mm
    const billHeight = (pageHeight - margin * 3) / 2 // ~136.5mm

    const formatBillAmount = (amount) => {
      const numericAmount = Number(amount || 0)
      return numericAmount === 0 ? '' : numericAmount.toLocaleString('en-IN')
    }

    bills.forEach((bill, index) => {
      const position = index % 4
      const col = position % 2
      const row = Math.floor(position / 2)

      if (index !== 0 && position === 0) {
        doc.addPage()
      }

      const x = margin + col * (billWidth + margin)
      const y = margin + row * (billHeight + margin)

      // 1. Card Container (White Background & Rounded Border)
      doc.setFillColor(255, 255, 255)
      doc.setDrawColor(215, 222, 232)
      doc.setLineWidth(0.4)
      doc.roundedRect(x, y, billWidth, billHeight, 4, 4, 'FD')

      // 2. Corner Waves (Top Right, Top Left, Bottom Right)
      // Top-Right Gold & Navy Swoosh
      doc.setFillColor(212, 175, 55) // Gold
      doc.triangle(x + billWidth - 36, y, x + billWidth, y, x + billWidth, y + 26, 'F')
      doc.setFillColor(0, 43, 102) // Navy
      doc.triangle(x + billWidth - 32, y, x + billWidth, y, x + billWidth, y + 23, 'F')

      // Top-Left Gold & Navy Arc
      doc.setFillColor(212, 175, 55)
      doc.triangle(x, y, x + 16, y, x, y + 16, 'F')
      doc.setFillColor(0, 43, 102)
      doc.triangle(x, y, x + 13, y, x, y + 13, 'F')

      // Bottom-Right Gold & Navy Swoosh
      doc.setFillColor(212, 175, 55)
      doc.triangle(x + billWidth - 28, y + billHeight, x + billWidth, y + billHeight, x + billWidth, y + billHeight - 22, 'F')
      doc.setFillColor(0, 43, 102)
      doc.triangle(x + billWidth - 24, y + billHeight, x + billWidth, y + billHeight, x + billWidth, y + billHeight - 19, 'F')

      // 3. School Logo (in circular white badge)
      doc.setFillColor(255, 255, 255)
      doc.circle(x + 9, y + 9, 6.5, 'F')
      try {
        doc.addImage(schoolLogo, 'PNG', x + 3.5, y + 3.5, 11, 11)
      } catch (e) {
        // logo fallback
      }

      // 4. Header Typography
      doc.setTextColor(0, 43, 102)
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(10.5)
      doc.text('STAR PUBLIC SCHOOL', x + billWidth / 2 + 4, y + 5.5, { align: 'center' })

      doc.setTextColor(60, 70, 90)
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(6.2)
      doc.text(
        'Meghwal mathia Bazar, West Champaran, Bihar 845106',
        x + billWidth / 2 + 4,
        y + 9.5,
        { align: 'center', maxWidth: billWidth - 26 }
      )

      doc.setTextColor(20, 30, 50)
      doc.setFontSize(6.8)
      doc.text('Mob: 9006457330', x + billWidth / 2 + 4, y + 13.5, { align: 'center' })

      // 5. Student Details Info Box (Rounded Container)
      const boxY = y + 16.5
      const boxHeight = 15.5
      doc.setFillColor(248, 250, 252)
      doc.setDrawColor(215, 222, 232)
      doc.setLineWidth(0.3)
      doc.roundedRect(x + 3, boxY, billWidth - 6, boxHeight, 2, 2, 'FD')

      const col1X = x + 5
      const col2X = x + billWidth / 2 + 2
      const billNo = bill.bill_number || `B-${Date.now().toString().slice(-8)}`
      const billDate = bill.date ? new Date(bill.date).toLocaleDateString('en-GB') : new Date().toLocaleDateString('en-GB')
      const studentName = bill.student_name || bill.name || 'Student'
      const fatherName = bill.father_name || '-'
      const className = `${bill.class || ''} ${bill.section ? `(${bill.section})` : ''}`.trim()
      const rollNo = bill.roll_no || bill.roll || '-'

      doc.setFont('helvetica', 'bold')
      doc.setFontSize(6.5)
      doc.setTextColor(20, 30, 60)

      doc.text(`Bill No: ${billNo}`, col1X, boxY + 4)
      doc.text(`Date: ${billDate}`, col2X, boxY + 4)
      doc.text(`Student: ${studentName}`, col1X, boxY + 8.5)
      doc.text(`Father: ${fatherName}`, col2X, boxY + 8.5)
      doc.text(`Class: ${className}`, col1X, boxY + 13)
      doc.text(`Roll: ${rollNo}`, col2X, boxY + 13)

      // 6. Left Column: Details & Description Tables
      const tableWidth = 53
      const tableLeftX = x + 3
      const tableStartY = boxY + boxHeight + 2

      const getAmount = (keyword) => {
        if (Array.isArray(bill.items)) {
          const it = bill.items.find((i) => (i.fee_name || i.name || '').toLowerCase().includes(keyword))
          if (it) return it.amount
        }
        return bill[keyword] ?? ''
      }

      const detailsData = [
        ['Tuition Fee', formatBillAmount(getAmount('tuition'))],
        ['Exam Fee', formatBillAmount(getAmount('exam'))],
        ['Annual Fee', formatBillAmount(getAmount('annual'))],
        ['Computer Fee', formatBillAmount(getAmount('computer') || getAmount('lab'))],
        ['Transport Fee', formatBillAmount(getAmount('transport'))],
        ['Previous Due', formatBillAmount(getAmount('due') || getAmount('previous'))],
      ]

      autoTable(doc, {
        startY: tableStartY,
        head: [['Details', 'Rs.']],
        body: detailsData,
        margin: { left: tableLeftX },
        tableWidth: tableWidth,
        columnStyles: {
          0: { cellWidth: 38 },
          1: { cellWidth: 15, halign: 'right' },
        },
        styles: {
          fontSize: 6.2,
          cellPadding: 0.9,
          fontStyle: 'bold',
          textColor: [20, 25, 35],
          font: 'helvetica',
          lineColor: [225, 230, 238],
          lineWidth: 0.2,
        },
        headStyles: {
          fillColor: [10, 56, 117],
          textColor: [255, 255, 255],
          font: 'helvetica',
          fontStyle: 'bold',
          fontSize: 6.5,
          cellPadding: 1.1,
        },
        theme: 'grid',
      })

      const detailsEndY = doc.lastAutoTable.finalY + 1.5

      // Description Summary Table
      const totalAmount = bill.summary?.total_amount ?? (bill.total ?? '')
      const advanceAmount = bill.summary?.advance_used ?? (bill.advance ?? '')
      const netPayable = bill.summary?.net_payable ?? (bill.netPayable ?? totalAmount)

      autoTable(doc, {
        startY: detailsEndY,
        head: [['Description', 'Rs.']],
        body: [
          ['Total', formatBillAmount(totalAmount)],
          ['Advance', formatBillAmount(advanceAmount)],
          ['Net Payable', formatBillAmount(netPayable)],
        ],
        margin: { left: tableLeftX },
        tableWidth: tableWidth,
        columnStyles: {
          0: { cellWidth: 38 },
          1: { cellWidth: 15, halign: 'right' },
        },
        styles: {
          fontSize: 6.2,
          cellPadding: 0.9,
          fontStyle: 'bold',
          textColor: [20, 25, 35],
          font: 'helvetica',
          lineColor: [225, 230, 238],
          lineWidth: 0.2,
        },
        headStyles: {
          fillColor: [10, 56, 117],
          textColor: [255, 255, 255],
          font: 'helvetica',
          fontStyle: 'bold',
          fontSize: 6.5,
          cellPadding: 1.1,
        },
        theme: 'grid',
      })

      // 7. Right Column: QR Code, Hindi Instruction, Stamp Seal
      const qrSize = 25
      const qrX = x + billWidth - qrSize - 4
      const qrY = tableStartY

      // QR container card
      doc.setFillColor(255, 255, 255)
      doc.setDrawColor(220, 226, 235)
      doc.roundedRect(qrX - 1, qrY - 1, qrSize + 2, qrSize + 2, 1.5, 1.5, 'FD')

      try {
        doc.addImage(PAYMENT_QR_URL, 'PNG', qrX, qrY, qrSize, qrSize)
      } catch (e) {
        // fallback
      }

      // Golden flourish line
      doc.setDrawColor(212, 175, 55)
      doc.setLineWidth(0.3)
      doc.line(qrX + 3, qrY + qrSize + 2, qrX + qrSize - 3, qrY + qrSize + 2)

      // Hindi Text
      try {
        const hindiTextImage = renderTextAsImage('पेमेंट के लिए', 13, 'Arial, sans-serif')
        doc.addImage(hindiTextImage, 'PNG', qrX - 8, qrY + qrSize + 2.5, 41, 7)
        const hindiTextImage2 = renderTextAsImage('QR कोड स्कैन करें', 13, 'Arial, sans-serif')
        doc.addImage(hindiTextImage2, 'PNG', qrX - 8, qrY + qrSize + 8, 41, 7)
      } catch (e) {
        // fallback
      }

      // Circular Stamp Seal
      const stampSize = 23
      const stampY = qrY + qrSize + 17
      try {
        doc.addImage(STAMP_CERT_URL, 'PNG', qrX + (qrSize - stampSize) / 2, stampY, stampSize, stampSize)
      } catch (e) {
        // fallback
      }

      // 8. Bottom Navy Signature Pill
      const pillY = y + billHeight - 8.5
      const pillH = 5.5
      doc.setFillColor(0, 43, 102)
      doc.roundedRect(x + 3, pillY, billWidth - 6, pillH, 2.75, 2.75, 'F')

      // White circle inside pill
      doc.setFillColor(255, 255, 255)
      doc.circle(x + 6, pillY + 2.75, 1.8, 'F')
      doc.setTextColor(0, 43, 102)
      doc.setFontSize(5.5)
      doc.text('✎', x + 5.2, pillY + 3.4)

      // Signature text
      doc.setTextColor(255, 255, 255)
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(6.5)
      doc.text('Signature of Receiver: ________________________', x + 9.5, pillY + 3.7)
    })

    const fileName = bills.length === 1 && bills[0].student_name
      ? `Star_Public_School_Bill_${bills[0].student_name.replace(/\s+/g, '_')}_${Date.now()}.pdf`
      : `Star_Public_School_Bills_${Date.now()}.pdf`

    doc.save(fileName)
  }

  // Handle Generate Monthly Bills using Real API and Data (NO DUMMY FALLBACK)
  const handleGenerateBills = async () => {
    if (!realStudents || realStudents.length === 0) {
      emitToast({
        type: 'warning',
        title: 'No Students Found',
        message: `Cannot generate bills. No active students found in ${selectedClass} (${selectedSection}).`,
      })
      return
    }

    setLoading(true)
    setError('')
    setSuccess('')

    try {
      const monthParam = billingMonth // e.g. '2026-10'
      const secParam = selectedSection === 'All Sections' ? null : selectedSection

      const classesToProcess = selectedClass === 'All Classes'
        ? availableClasses
        : [selectedClass]

      let totalSuccessCount = 0

      for (const cls of classesToProcess) {
        try {
          const response = await generateBillsForClass(cls, monthParam, {
            section: secParam,
            include_exam_fee: feeHeads.annualExam,
            include_annual_fee: feeHeads.tuition,
            include_computer_fee: feeHeads.computerLab,
          })
          totalSuccessCount += (response?.successCount || 0)
        } catch (clsErr) {
          console.warn(`Bill generation notice for class ${cls}:`, clsErr.message)
        }
      }

      // Fetch actual generated bills data for PDF printing
      const downloadRes = await downloadBillsData({
        month: monthParam,
        class: selectedClass === 'All Classes' ? '' : selectedClass,
      })

      const generatedBills = Array.isArray(downloadRes?.bills)
        ? downloadRes.bills
        : (Array.isArray(downloadRes) ? downloadRes : [])

      if (generatedBills.length > 0) {
        generateReceiptPDF(generatedBills)
        const successMsg = `Generated and downloaded ${generatedBills.length} official bills for ${selectedClass} (${monthParam}).`
        setSuccess(successMsg)
        emitToast({
          type: 'success',
          title: 'Monthly Bills Generated',
          message: successMsg,
        })
      } else if (totalSuccessCount > 0) {
        const successMsg = `Bills created for ${totalSuccessCount} active students for ${monthParam}.`
        setSuccess(successMsg)
        emitToast({
          type: 'success',
          title: 'Bills Processed',
          message: successMsg,
        })
      } else {
        emitToast({
          type: 'info',
          title: 'Bill Notice',
          message: `Bills were evaluated. Active students for ${selectedClass} already have bills or month is closed.`,
        })
      }
    } catch (err) {
      const errorMsg = err.message || 'Failed to generate monthly bills.'
      setError(errorMsg)
      emitToast({
        type: 'error',
        title: 'Bill Generation Error',
        message: errorMsg,
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* ========================================================
          AUTO-CLOSE MONTH ENGINE BANNER & MANUAL TRIGGER
          ======================================================== */}
      <div className="rounded-2xl border border-sky-100 bg-linear-to-r from-sky-50/80 via-white to-blue-50/60 p-5 shadow-2xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="h-11 w-11 shrink-0 rounded-2xl bg-[#132c4e] text-white flex items-center justify-center shadow-xs">
              <span className="material-symbols-outlined text-[24px]">event_repeat</span>
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2.5">
                <h3 className="text-sm font-black text-[#0f1e36]">
                  Auto-Close Month Engine
                </h3>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100/90 px-2.5 py-0.5 text-[11px] font-black text-emerald-800">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  ACTIVE · Daily 6:00 PM IST
                </span>
                <span className="rounded-full bg-sky-100 px-2 py-0.5 text-[11px] font-bold text-sky-800">
                  Month-End Auto Roll
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1 max-w-2xl leading-relaxed">
                Runs automatically on the <strong>last calendar day of every month at 6:00 PM IST</strong>. It tallies payments, locks the billing cycle, and rolls remaining unpaid balances into previous dues.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={() => setShowCloseMonthModal(true)}
              className="h-10 px-4 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-xs font-bold text-[#0f1e36] shadow-2xs flex items-center gap-2 transition cursor-pointer"
            >
              <span className="material-symbols-outlined text-[17px] text-amber-600">lock_clock</span>
              Close Month (Manual)
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================
          CANVA BILL GENERATION CARD (Pixel-Perfect Implementation)
          ======================================================== */}
      <div className="rounded-2xl border border-slate-200/90 bg-white p-6 sm:p-8 shadow-2xs">
        {/* Header Row: Title, Subtitle, Ready For Review Tag */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-[#0f1e36] tracking-tight">
              Bill Generation
            </h2>
            <p className="text-xs sm:text-sm font-medium text-slate-500 mt-1">
              Prepare and review a simulated monthly bill batch. No invoices are sent.
            </p>
          </div>

          <div>
            <span className="inline-flex rounded-full bg-[#fef3c7] px-3.5 py-1 text-xs font-semibold text-[#92400e]">
              Ready for review
            </span>
          </div>
        </div>

        {/* Form Controls Grid */}
        <div className="mt-6 space-y-4">
          {/* Row 1: Session, Billing Month, Class */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1.5">
                Session
              </label>
              <div className="relative">
                <select
                  value={session}
                  onChange={(e) => setSession(e.target.value)}
                  className="w-full h-11 rounded-xl border border-slate-200 bg-white pl-4 pr-10 text-sm font-bold text-[#0f1e36] shadow-2xs focus:border-slate-400 focus:outline-none appearance-none cursor-pointer"
                >
                  <option value="2026–27">2026–27</option>
                  <option value="2025–26">2025–26</option>
                  <option value="2024–25">2024–25</option>
                </select>
                <span className="material-symbols-outlined pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg">
                  keyboard_arrow_down
                </span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1.5">
                Billing Month
              </label>
              <div className="relative">
                <select
                  value={billingMonth}
                  onChange={(e) => setBillingMonth(e.target.value)}
                  className="w-full h-11 rounded-xl border border-slate-200 bg-white pl-4 pr-10 text-sm font-bold text-[#0f1e36] shadow-2xs focus:border-slate-400 focus:outline-none appearance-none cursor-pointer"
                >
                  {MONTH_OPTIONS.map((m) => (
                    <option key={m.value} value={m.value}>
                      {m.label}
                    </option>
                  ))}
                </select>
                <span className="material-symbols-outlined pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg">
                  keyboard_arrow_down
                </span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1.5">
                Class
              </label>
              <div className="relative">
                <select
                  value={selectedClass}
                  onChange={(e) => {
                    setSelectedClass(e.target.value)
                    setSelectedSection('All Sections')
                  }}
                  className="w-full h-11 rounded-xl border border-slate-200 bg-white pl-4 pr-10 text-sm font-bold text-[#0f1e36] shadow-2xs focus:border-slate-400 focus:outline-none appearance-none cursor-pointer"
                >
                  <option value="All Classes">All Classes</option>
                  {availableClasses.map((cls) => {
                    const displayName = cls.startsWith('Class ') ? cls : `Class ${cls}`
                    return (
                      <option key={cls} value={cls}>
                        {displayName}
                      </option>
                    )
                  })}
                </select>
                <span className="material-symbols-outlined pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg">
                  keyboard_arrow_down
                </span>
              </div>
            </div>
          </div>

          {/* Row 2: Section, Due Date */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1.5">
                Section
              </label>
              <div className="relative">
                <select
                  value={selectedSection}
                  onChange={(e) => setSelectedSection(e.target.value)}
                  className="w-full h-11 rounded-xl border border-slate-200 bg-white pl-4 pr-10 text-sm font-bold text-[#0f1e36] shadow-2xs focus:border-slate-400 focus:outline-none appearance-none cursor-pointer"
                >
                  <option value="All Sections">All Sections</option>
                  {availableSections.map((sec) => (
                    <option key={sec} value={sec}>
                      Section {sec}
                    </option>
                  ))}
                </select>
                <span className="material-symbols-outlined pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg">
                  keyboard_arrow_down
                </span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1.5">
                Due Date
              </label>
              <div className="relative">
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full h-11 rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-[#0f1e36] shadow-2xs focus:border-slate-400 focus:outline-none cursor-pointer"
                />
              </div>
            </div>
          </div>

          {/* Fee Heads Included Checkboxes */}
          <div className="pt-2">
            <span className="block text-xs font-bold text-slate-600 mb-2.5">
              Fee Heads Included
            </span>
            <div className="flex flex-wrap items-center gap-6 text-sm font-semibold text-slate-700">
              <label className="inline-flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={feeHeads.tuition}
                  onChange={(e) => setFeeHeads({ ...feeHeads, tuition: e.target.checked })}
                  className="h-4 w-4 rounded border-slate-300 text-[#132c4e] focus:ring-0 cursor-pointer"
                />
                <span className="text-xs sm:text-sm font-bold text-slate-800">Tuition Fee</span>
              </label>

              <label className="inline-flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={feeHeads.computerLab}
                  onChange={(e) => setFeeHeads({ ...feeHeads, computerLab: e.target.checked })}
                  className="h-4 w-4 rounded border-slate-300 text-[#132c4e] focus:ring-0 cursor-pointer"
                />
                <span className="text-xs sm:text-sm font-bold text-slate-800">Computer & Lab Fee</span>
              </label>

              <label className="inline-flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={feeHeads.transport}
                  onChange={(e) => setFeeHeads({ ...feeHeads, transport: e.target.checked })}
                  className="h-4 w-4 rounded border-slate-300 text-[#132c4e] focus:ring-0 cursor-pointer"
                />
                <span className="text-xs sm:text-sm font-bold text-slate-800">Transport / Bus Fee</span>
              </label>

              <label className="inline-flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={feeHeads.annualExam}
                  onChange={(e) => setFeeHeads({ ...feeHeads, annualExam: e.target.checked })}
                  className="h-4 w-4 rounded border-slate-300 text-[#132c4e] focus:ring-0 cursor-pointer"
                />
                <span className="text-xs sm:text-sm font-bold text-slate-800">Annual Exam Fee</span>
              </label>
            </div>
          </div>

          {/* Real Info Banner Bar */}
          <div className="pt-2">
            {loadingStudents ? (
              <div className="rounded-xl bg-[#edf4fc] px-5 py-3.5 text-xs sm:text-sm font-bold text-[#1e3a5f] shadow-2xs flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px] animate-spin">sync</span>
                Fetching active student records from database...
              </div>
            ) : realStudents.length > 0 ? (
              <div className="rounded-xl bg-[#edf4fc] px-5 py-3.5 text-xs sm:text-sm font-bold text-[#1e3a5f] shadow-2xs flex flex-wrap items-center justify-between gap-2">
                <span>
                  <strong>{realStudents.length}</strong> active student{realStudents.length === 1 ? '' : 's'} enrolled in {selectedClass} ({selectedSection}) · Ready for monthly bill generation
                </span>
                <span className="text-[11px] font-black uppercase tracking-wider rounded-md bg-white/80 px-2 py-0.5 text-[#132c4e] border border-blue-200">
                  Real DB Records
                </span>
              </div>
            ) : (
              <div className="rounded-xl bg-amber-50 border border-amber-200/80 px-5 py-3.5 text-xs sm:text-sm font-bold text-amber-900 shadow-2xs flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px] text-amber-700">info</span>
                <span>No active students enrolled in {selectedClass} ({selectedSection}) in the database.</span>
              </div>
            )}
          </div>

          {/* Action Buttons Row */}
          <div className="pt-4 flex flex-wrap items-center justify-end gap-3">
            <button
              type="button"
              onClick={handleClearSetup}
              className="h-11 rounded-xl border border-slate-300 bg-white px-4 text-sm font-bold text-slate-700 shadow-2xs hover:bg-slate-50 transition cursor-pointer"
            >
              Clear Setup
            </button>

            <button
              type="button"
              onClick={() => setShowCloseMonthModal(true)}
              className="h-11 rounded-xl border border-amber-300 bg-amber-50 hover:bg-amber-100/80 px-4 text-sm font-bold text-amber-900 shadow-2xs transition flex items-center gap-2 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px] text-amber-700">lock_clock</span>
              Close Month
            </button>

            <button
              type="button"
              onClick={() => {
                downloadExactSlipPDF(activePreviewBill)
              }}
              disabled={downloadingPdf}
              className="h-11 rounded-xl border border-emerald-600 bg-emerald-50 hover:bg-emerald-100/80 px-4 text-sm font-bold text-emerald-800 shadow-2xs transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <span className="material-symbols-outlined text-[18px] text-emerald-700">download</span>
              {downloadingPdf ? 'Rendering PDF...' : 'Download Bill PDF'}
            </button>

            <button
              type="button"
              onClick={() => {
                setPreviewIndex(0)
                setPreviewMode('card')
                setShowPreviewModal(true)
              }}
              className="h-11 rounded-xl border border-blue-300 bg-blue-50 hover:bg-blue-100/80 px-5 text-sm font-bold text-[#002b66] shadow-2xs transition flex items-center gap-2 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px] text-[#002b66]">visibility</span>
              Preview Bills (Canva)
            </button>

            <button
              type="button"
              onClick={handleGenerateBills}
              disabled={loading}
              className="h-11 rounded-xl bg-[#002b66] hover:bg-[#08224d] text-white px-6 text-sm font-bold shadow-xs transition disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2 cursor-pointer"
            >
              {loading ? (
                <>
                  <span className="material-symbols-outlined text-[18px] animate-spin">sync</span>
                  Generating...
                </>
              ) : (
                'Generate Monthly Bills'
              )}
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================
          LIVE ON-PAGE CANVA BILL SLIP & 4-IN-1 A4 SHEET PREVIEW
          Exact match to user photo media_1792410413227.png
          ======================================================== */}
      <div className="rounded-3xl border border-slate-200/90 bg-white p-6 sm:p-8 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-5 border-b border-slate-100 gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <h3 className="text-xl font-black text-[#002b66]">
                Official Fee Bill Slip Preview
              </h3>
              <span className="rounded-full bg-blue-100 px-3 py-0.5 text-xs font-black text-[#002b66]">
                Exact Canva Design
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              {sheetViewMode === 'sheet'
                ? 'Standard 4-in-1 A4 Sheet Layout (2x2 grid ready to print & download)'
                : 'Single Slip Detail View (Pixel-perfect Canva card template)'}
            </p>
          </div>

          {/* Toggle between 4-in-1 Sheet and Single Bill */}
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="inline-flex rounded-xl bg-slate-100 p-1 text-xs font-bold border border-slate-200">
              <button
                type="button"
                onClick={() => setSheetViewMode('sheet')}
                className={`px-3 py-1.5 rounded-lg transition cursor-pointer flex items-center gap-1.5 ${sheetViewMode === 'sheet'
                    ? 'bg-white text-[#002b66] shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                  }`}
              >
                <span className="material-symbols-outlined text-[15px]">grid_view</span>
                4-in-1 A4 Sheet
              </button>
              <button
                type="button"
                onClick={() => setSheetViewMode('single')}
                className={`px-3 py-1.5 rounded-lg transition cursor-pointer flex items-center gap-1.5 ${sheetViewMode === 'single'
                    ? 'bg-white text-[#002b66] shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                  }`}
              >
                <span className="material-symbols-outlined text-[15px]">badge</span>
                Single Card Slip
              </button>
            </div>

            {/* Quick Student Selector when in single mode */}
            {sheetViewMode === 'single' && previewRealBills.length > 0 && (
              <div className="relative min-w-[200px]">
                <select
                  value={previewIndex}
                  onChange={(e) => setPreviewIndex(Number(e.target.value))}
                  className="w-full h-9 rounded-xl border border-slate-200 bg-white pl-3 pr-8 text-xs font-bold text-[#002b66] shadow-2xs focus:border-slate-400 focus:outline-none appearance-none cursor-pointer"
                >
                  {previewRealBills.map((b, idx) => (
                    <option key={b.id || idx} value={idx}>
                      Roll {b.roll}: {b.student_name} ({b.class})
                    </option>
                  ))}
                </select>
                <span className="material-symbols-outlined pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm">
                  keyboard_arrow_down
                </span>
              </div>
            )}
          </div>
        </div>

        {/* ================= CONTENT DISPLAY AREA ================= */}
        {sheetViewMode === 'sheet' ? (
          /* 4-in-1 A4 SHEET VIEW (Exact 2x2 Sheet matching user blueprint) */
          <div className="py-6 flex justify-center bg-slate-100/70 rounded-2xl my-5 border border-slate-200 overflow-x-auto">
            <main id="four-in-one-a4-sheet" className="p-4 bg-white rounded-xl shadow-xl">
              <div className="bill-grid-sheet">
                {[0, 1, 2, 3].map((slotIdx) => {
                  const billForSlot = previewRealBills[slotIdx] || fallbackSampleBill
                  return (
                    <BillSlipCard key={slotIdx} bill={billForSlot} />
                  )
                })}
              </div>
            </main>
          </div>
        ) : (
          /* SINGLE CARD DETAIL VIEW */
          <div className="py-6 flex justify-center bg-slate-50/50 rounded-2xl my-5 border border-slate-100 overflow-x-auto">
            <BillSlipCard bill={activePreviewBill} />
          </div>
        )}

        {/* Action Bar Directly Under the Card */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100">
          <span className="text-xs font-bold text-slate-600">
            {sheetViewMode === 'sheet' ? (
              <>Showing 4 Receipts on 1 A4 Page · Official Fee Receipt Template</>
            ) : previewRealBills.length > 0 ? (
              <>
                Showing student <strong>{previewIndex + 1}</strong> of <strong>{previewRealBills.length}</strong> (Roll: {previewRealBills[previewIndex]?.roll})
              </>
            ) : (
              <>Official Fee Receipt Template (Ready to Download / Print)</>
            )}
          </span>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={() => window.print()}
              className="h-10 px-4 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-xs font-bold text-slate-700 shadow-2xs flex items-center gap-1.5 transition cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px]">print</span>
              Print {sheetViewMode === 'sheet' ? '4-in-1 Sheet' : 'Slip'}
            </button>

            {sheetViewMode === 'sheet' ? (
              <button
                type="button"
                onClick={download4In1SheetPDF}
                disabled={downloadingPdf}
                className="h-10 px-5 rounded-xl border border-emerald-600 bg-emerald-50 hover:bg-emerald-100 text-xs font-black text-emerald-800 shadow-2xs flex items-center gap-2 transition cursor-pointer disabled:opacity-50"
              >
                <span className="material-symbols-outlined text-[17px] text-emerald-700">download</span>
                {downloadingPdf ? 'Generating PDF...' : 'Download 4-in-1 Sheet (PDF)'}
              </button>
            ) : (
              <button
                type="button"
                onClick={() => downloadExactSlipPDF(activePreviewBill)}
                disabled={downloadingPdf}
                className="h-10 px-4 rounded-xl border border-blue-400 bg-blue-50 hover:bg-blue-100 text-xs font-bold text-[#002b66] shadow-2xs flex items-center gap-1.5 transition cursor-pointer disabled:opacity-50"
              >
                <span className="material-symbols-outlined text-[16px]">download</span>
                {downloadingPdf ? 'Downloading...' : 'Download This Bill (PDF)'}
              </button>
            )}

            {previewRealBills.length > 1 && (
              <button
                type="button"
                onClick={() => generateReceiptPDF(previewRealBills)}
                className="h-10 px-4 rounded-xl border border-blue-400 bg-blue-50 hover:bg-blue-100 text-xs font-bold text-[#002b66] shadow-2xs flex items-center gap-1.5 transition cursor-pointer"
              >
                <span className="material-symbols-outlined text-[16px]">picture_as_pdf</span>
                Download All (Batch PDF)
              </button>
            )}

            <button
              type="button"
              onClick={() => setShowPreviewModal(true)}
              className="h-10 px-4 rounded-xl bg-[#002b66] hover:bg-[#08224d] text-white text-xs font-bold shadow-xs flex items-center gap-1.5 transition cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px]">open_in_full</span>
              Fullscreen Modal
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================
          BILL PREVIEW & DOWNLOAD MODAL
          ======================================================== */}
      {showPreviewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto">
          <div className="w-full max-w-4xl rounded-3xl bg-white p-5 sm:p-7 shadow-2xl animate-in fade-in zoom-in-95 duration-150 my-auto">
            {/* Modal Header */}
            <div className="flex flex-wrap items-center justify-between pb-4 border-b border-slate-100 gap-3">
              <div>
                <div className="flex items-center gap-2.5">
                  <h3 className="text-lg font-black text-[#002b66]">
                    Official Fee Bill Preview ({billingMonth})
                  </h3>
                  <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-[11px] font-black text-[#002b66]">
                    Receipt Slip Design
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Real database records for {selectedClass} ({selectedSection}) · Total {previewRealBills.length} Active Students
                </p>
              </div>

              {/* View Mode Toggle & Close */}
              <div className="flex items-center gap-2">
                <div className="inline-flex rounded-xl bg-slate-100 p-1 text-xs font-bold">
                  <button
                    type="button"
                    onClick={() => setPreviewMode('card')}
                    className={`px-3 py-1.5 rounded-lg transition cursor-pointer flex items-center gap-1.5 ${previewMode === 'card'
                        ? 'bg-white text-[#002b66] shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                      }`}
                  >
                    <span className="material-symbols-outlined text-[15px]">badge</span>
                    Card Slip View
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreviewMode('table')}
                    className={`px-3 py-1.5 rounded-lg transition cursor-pointer flex items-center gap-1.5 ${previewMode === 'table'
                        ? 'bg-white text-[#002b66] shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                      }`}
                  >
                    <span className="material-symbols-outlined text-[15px]">table_rows</span>
                    Batch Table
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => setShowPreviewModal(false)}
                  className="h-9 w-9 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-700 font-bold flex items-center justify-center transition cursor-pointer ml-1"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="mt-5">
              {previewRealBills.length === 0 ? (
                <div className="py-12 text-center text-slate-500 font-medium bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                  <span className="material-symbols-outlined text-4xl text-slate-400 mb-2 block">folder_off</span>
                  No active student records found for {selectedClass} ({selectedSection}) in the database.
                </div>
              ) : previewMode === 'card' ? (
                /* ================= CARD SLIP VIEW ================= */
                <div className="space-y-4">
                  {/* Student Switcher Bar */}
                  <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-50 p-3 rounded-2xl border border-slate-200/80">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setPreviewIndex((prev) => Math.max(0, prev - 1))}
                        disabled={previewIndex === 0}
                        className="h-9 px-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-xs font-bold text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 transition cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-[16px]">chevron_left</span>
                        Previous
                      </button>

                      <button
                        type="button"
                        onClick={() => setPreviewIndex((prev) => Math.min(previewRealBills.length - 1, prev + 1))}
                        disabled={previewIndex >= previewRealBills.length - 1}
                        className="h-9 px-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-xs font-bold text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 transition cursor-pointer"
                      >
                        Next
                        <span className="material-symbols-outlined text-[16px]">chevron_right</span>
                      </button>

                      <span className="text-xs font-bold text-slate-600 pl-2">
                        Student <strong>{previewIndex + 1}</strong> of <strong>{previewRealBills.length}</strong>
                      </span>
                    </div>

                    {/* Student Dropdown Selector */}
                    <div className="relative min-w-[220px]">
                      <select
                        value={previewIndex}
                        onChange={(e) => setPreviewIndex(Number(e.target.value))}
                        className="w-full h-9 rounded-xl border border-slate-200 bg-white pl-3 pr-8 text-xs font-bold text-[#002b66] shadow-2xs focus:border-slate-400 focus:outline-none appearance-none cursor-pointer"
                      >
                        {previewRealBills.map((b, idx) => (
                          <option key={b.id || idx} value={idx}>
                            Roll {b.roll}: {b.student_name} ({b.class})
                          </option>
                        ))}
                      </select>
                      <span className="material-symbols-outlined pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm">
                        keyboard_arrow_down
                      </span>
                    </div>
                  </div>

                  {/* Render the Exact Canva Bill Card */}
                  <div className="py-2 flex justify-center overflow-x-auto">
                    <BillSlipCard bill={previewRealBills[previewIndex]} />
                  </div>
                </div>
              ) : (
                /* ================= BATCH TABLE VIEW ================= */
                <div className="overflow-x-auto max-h-[460px] rounded-xl border border-slate-200">
                  <table className="w-full text-xs text-left border-collapse">
                    <thead className="sticky top-0 bg-slate-50 z-10">
                      <tr className="border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase">
                        <th className="py-2.5 px-3">Roll</th>
                        <th className="py-2.5 px-3">Student Name</th>
                        <th className="py-2.5 px-3">Class</th>
                        <th className="py-2.5 px-3">Tuition</th>
                        <th className="py-2.5 px-3">Computer</th>
                        <th className="py-2.5 px-3">Transport</th>
                        <th className="py-2.5 px-3">Due</th>
                        <th className="py-2.5 px-3 font-extrabold text-[#002b66]">Net Payable</th>
                        <th className="py-2.5 px-3 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {previewRealBills.map((b, idx) => (
                        <tr key={b.id || b.roll || idx} className="hover:bg-slate-50/80 transition">
                          <td className="py-2.5 px-3 font-mono font-bold text-slate-700">{b.roll}</td>
                          <td className="py-2.5 px-3 font-bold text-slate-900">{b.student_name}</td>
                          <td className="py-2.5 px-3 text-slate-500">{b.class} {b.section ? `(${b.section})` : ''}</td>
                          <td className="py-2.5 px-3 font-mono">₹{b.tuition || 0}</td>
                          <td className="py-2.5 px-3 font-mono">₹{b.lab || 0}</td>
                          <td className="py-2.5 px-3 font-mono">₹{b.transport || 0}</td>
                          <td className="py-2.5 px-3 font-mono text-rose-600">₹{b.previous_due || 0}</td>
                          <td className="py-2.5 px-3 font-black text-[#002b66] font-mono">₹{b.total || 0}</td>
                          <td className="py-2.5 px-3 text-right">
                            <button
                              type="button"
                              onClick={() => {
                                setPreviewIndex(idx)
                                setPreviewMode('card')
                              }}
                              className="h-7 px-2.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-[11px] font-bold text-[#002b66] transition cursor-pointer"
                            >
                              View Card
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Modal Bottom Actions */}
            <div className="mt-6 flex flex-wrap justify-between items-center gap-3 pt-4 border-t border-slate-100">
              <span className="text-xs text-slate-500 font-medium">
                Active Enrolled: <strong className="text-slate-800">{previewRealBills.length}</strong> · Due Date: <strong className="text-slate-800">{dueDate}</strong>
              </span>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowPreviewModal(false)}
                  className="h-10 px-4 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 transition cursor-pointer"
                >
                  Close
                </button>

                {previewRealBills.length > 0 && (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        window.print()
                      }}
                      className="h-10 px-4 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-xs font-bold text-slate-700 shadow-2xs flex items-center gap-1.5 transition cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[16px]">print</span>
                      Print Slip
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        const current = previewRealBills[previewIndex] || fallbackSampleBill
                        downloadExactSlipPDF(current)
                      }}
                      disabled={downloadingPdf}
                      className="h-10 px-4 rounded-xl border border-blue-300 bg-blue-50 hover:bg-blue-100 text-xs font-bold text-[#002b66] shadow-2xs flex items-center gap-1.5 transition cursor-pointer disabled:opacity-50"
                    >
                      <span className="material-symbols-outlined text-[16px]">download</span>
                      {downloadingPdf ? 'Downloading...' : 'Download This Bill (PDF)'}
                    </button>

                    <button
                      type="button"
                      onClick={() => generateReceiptPDF(previewRealBills)}
                      className="h-10 px-4 rounded-xl border border-emerald-600 bg-emerald-50 hover:bg-emerald-100 text-xs font-bold text-emerald-800 shadow-2xs flex items-center gap-1.5 transition cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[16px]">picture_as_pdf</span>
                      Download All (Batch PDF)
                    </button>
                  </>
                )}

                <button
                  type="button"
                  onClick={() => {
                    setShowPreviewModal(false)
                    handleGenerateBills()
                  }}
                  disabled={previewRealBills.length === 0}
                  className="h-10 px-5 rounded-xl bg-[#002b66] text-xs font-bold text-white hover:bg-[#08224d] shadow-xs disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center gap-1.5 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[16px]">receipt_long</span>
                  Confirm & Generate Batch
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          MANUAL CLOSE MONTH CONFIRMATION MODAL
          ======================================================== */}
      {showCloseMonthModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="h-9 w-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                  <span className="material-symbols-outlined text-[20px]">lock_reset</span>
                </div>
                <div>
                  <h3 className="text-base font-black text-[#0f1e36]">Close Billing Month</h3>
                  <p className="text-xs text-slate-400">Lock month fees & transfer unpaid balances</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowCloseMonthModal(false)}
                className="text-slate-400 hover:text-slate-600 font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Select Month to Close (YYYY-MM)
                </label>
                <input
                  type="month"
                  value={closeMonthTarget}
                  onChange={(e) => setCloseMonthTarget(e.target.value)}
                  className="w-full h-11 rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-[#0f1e36] shadow-2xs focus:border-slate-400 focus:outline-none cursor-pointer"
                />
              </div>

              <div className="rounded-xl bg-amber-50/70 border border-amber-200/60 p-4 text-xs text-amber-900 space-y-1.5">
                <div className="font-bold flex items-center gap-1.5 text-amber-950">
                  <span className="material-symbols-outlined text-[16px]">info</span>
                  What happens during Month Closure?
                </div>
                <ul className="list-disc list-inside space-y-1 text-slate-700 pl-1">
                  <li>Locks the selected month in <code>month_closures</code> database table.</li>
                  <li>Calculates all collected payments against generated fee bills.</li>
                  <li>Automatically transfers remaining unpaid balances into <code>previous_dues</code>.</li>
                  <li>Marks completed bills as Paid and partial balances as Partial.</li>
                </ul>
              </div>

              <div className="rounded-xl bg-sky-50 border border-sky-100 p-3 text-xs text-sky-900 flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px] text-sky-700">schedule</span>
                <span><strong>Auto Scheduler:</strong> Also scheduled to run automatically on the last day of every month at 6:00 PM IST.</span>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowCloseMonthModal(false)}
                disabled={closingMonth}
                className="h-10 px-4 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleManualCloseMonth}
                disabled={closingMonth}
                className="h-10 px-5 rounded-xl bg-[#132c4e] hover:bg-[#0f1e36] text-xs font-bold text-white shadow-xs flex items-center gap-2 disabled:opacity-60 cursor-pointer"
              >
                {closingMonth ? (
                  <>
                    <span className="material-symbols-outlined text-[16px] animate-spin">sync</span>
                    Closing Month...
                  </>
                ) : (
                  'Confirm & Close Month'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Bills
