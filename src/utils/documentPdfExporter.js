import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'

/**
 * High-definition PDF Exporter for School Documents
 * Handles CR-80 ID Card dimensions and standard A4 Portrait sheets
 */
export async function exportDocumentToPdf({
  elementId,
  element,
  filename = 'Document.pdf',
  paperFormat = 'a4', // 'a4' | 'id_card'
  scale = 2.5,
}) {
  const targetEl = element || document.getElementById(elementId)
  if (!targetEl) {
    throw new Error('Document element not found for PDF export')
  }

  // Create an unscaled offscreen cloning container
  const offscreen = document.createElement('div')
  offscreen.style.position = 'fixed'
  offscreen.style.top = '0'
  offscreen.style.left = '-12000px'
  offscreen.style.zIndex = '-9999'
  offscreen.style.backgroundColor = '#ffffff'
  offscreen.style.overflow = 'visible'

  const clone = targetEl.cloneNode(true)
  clone.style.transform = 'none'
  clone.style.margin = '0'
  clone.style.boxShadow = 'none'
  offscreen.appendChild(clone)
  document.body.appendChild(offscreen)

  // Copy computed image sources if needed
  const origImgs = targetEl.querySelectorAll('img')
  const cloneImgs = clone.querySelectorAll('img')
  origImgs.forEach((orig, idx) => {
    if (cloneImgs[idx]) cloneImgs[idx].src = orig.src
  })

  try {
    const canvas = await html2canvas(clone, {
      scale: scale,
      useCORS: true,
      allowTaint: true,
      logging: false,
      backgroundColor: '#ffffff',
      ignoreElements: (el) => el.classList && el.classList.contains('sps-print-no-show'),
    })

    if (paperFormat === 'id_card') {
      // Standard CR-80 dimensions: 54mm x 85.6mm (portrait)
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: [54, 85.6],
        compress: true,
      })
      const imgData = canvas.toDataURL('image/jpeg', 0.98)
      pdf.addImage(imgData, 'JPEG', 0, 0, 54, 85.6, undefined, 'FAST')
      pdf.save(filename)
    } else {
      // Standard A4 dimensions: 210mm x 297mm (portrait)
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
        compress: true,
      })
      const imgData = canvas.toDataURL('image/jpeg', 0.98)
      pdf.addImage(imgData, 'JPEG', 0, 0, 210, 297, undefined, 'FAST')
      pdf.save(filename)
    }
  } finally {
    if (document.body.contains(offscreen)) {
      document.body.removeChild(offscreen)
    }
  }
}
