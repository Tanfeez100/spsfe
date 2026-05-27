import React, { useState, useEffect } from 'react';
import { getInvoiceDetails, downloadInvoicePDF } from '../../Api/fees';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

function Invoice({ billId: propBillId = '', onBillIdChange }) {
  const [billId, setBillId] = useState(propBillId);
  const [invoiceData, setInvoiceData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (propBillId && propBillId !== billId) {
      setBillId(propBillId);
      if (propBillId.trim()) {
        handleFetchInvoice(propBillId);
      }
    }
  }, [propBillId]);

  const handleBillIdChange = (value) => {
    setBillId(value);
    if (typeof onBillIdChange === 'function') {
      onBillIdChange(value);
    }
  };

  const handleFetchInvoice = async (billIdToFetch = null) => {
    const idToUse = billIdToFetch || billId;
    if (!idToUse || !idToUse.trim()) {
      setError('Please enter a Bill ID');
      return;
    }

    setError('');
    setSuccess('');
    setLoading(true);
    setInvoiceData(null);

    try {
      const response = await getInvoiceDetails(idToUse.trim());
      if (response.invoice) {
        setInvoiceData(response.invoice);
        setSuccess(response.message || 'Invoice fetched successfully');
      } else {
        setError(response.message || 'Failed to fetch invoice');
      }
    } catch (err) {
      setError(err?.message || 'Failed to fetch invoice');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPDF = async () => {
    if (!billId.trim()) {
      setError('Please enter a Bill ID');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const blob = await downloadInvoicePDF(billId.trim());
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `invoice-${billId}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      setError(err?.message || 'Failed to download invoice PDF');
    } finally {
      setLoading(false);
    }
  };

  const _generateInvoicePDF = () => {
    if (!invoiceData) return;

    const doc = new jsPDF("p", "mm", "a4");
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    const margin = 10;
    const billWidth = (pageWidth - margin * 3) / 2;
    const billHeight = (pageHeight - margin * 3) / 2;

    const x = margin;
    const y = margin;

    // Draw border
    doc.setDrawColor(150, 0, 0);
    doc.rect(x, y, billWidth, billHeight);

    // Header - School Name
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text("STAR PUBLIC SCHOOL", x + billWidth / 2, y + 6, { align: "center" });

    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.text(
      "Meghwal mathia Bazar, West Champaran, Bihar 845106",
      x + billWidth / 2,
      y + 10,
      { align: "center" }
    );

    doc.text(
      "Mob: 9006457330",
      x + billWidth / 2,
      y + 14,
      { align: "center" }
    );

    // Invoice Number
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.text(
      `Invoice #${invoiceData.invoice_number || invoiceData.bill_id || '--'}`,
      x + billWidth / 2,
      y + 18,
      { align: "center" }
    );

    // Student details
    const detailsStartY = y + 23;
    const details = [
      [`SI No:`, invoiceData.bill_id || "--"],
      [`Student:`, invoiceData.student?.name || "--"],
      [`Father:`, invoiceData.student?.father_name || "--"],
      [`Class:`, invoiceData.student?.class || "--"],
      [`Roll No:`, invoiceData.student?.roll_no || "--"],
      [`Sec:`, invoiceData.student?.section || "--"],
      [`Month:`, invoiceData.month || "--"],
    ];

    const col1X = x + 8;
    const col2X = x + billWidth / 2 + 2;
    const rowHeight = 4;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    details.forEach(([label, value], i) => {
      const row = Math.floor(i / 2);
      const isLeft = i % 2 === 0;

      doc.text(
        `${label} ${value}`,
        isLeft ? col1X : col2X,
        detailsStartY + row * rowHeight
      );
    });

    // Fee items table
    const items = (invoiceData.items || []).map((item) => [
      item.fee_name,
      item.amount || 0,
      "00",
    ]);

    autoTable(doc, {
      startY: detailsStartY + 15,
      head: [["Details", "Rs.", "P"]],
      body: items,
      margin: { left: x + 5 },
      tableWidth: billWidth - 10,
      styles: { 
        fontSize: 8, 
        cellPadding: 2, 
        fontStyle: "bold",
        textColor: [0, 0, 0]
      },
      headStyles: { 
        fillColor: [128, 128, 128], 
        textColor: [0, 0, 0] 
      },
      theme: "grid",
    });

    const tableEndY = doc.lastAutoTable.finalY + 2;

    // Summary table
    autoTable(doc, {
      startY: tableEndY,
      head: [["Description", "Rs.", "P"]],
      body: [
        ["Total", invoiceData.summary?.total_amount || 0, "00"],
        ["Advance", invoiceData.summary?.advance_used || 0, "00"],
        ["Net Payable", invoiceData.summary?.net_payable || 0, "00"]
      ],
      margin: { left: x + 5 },
      tableWidth: billWidth - 10,
      styles: { 
        fontSize: 8, 
        cellPadding: 2, 
        fontStyle: "bold",
        textColor: [0, 0, 0]
      },
      headStyles: { 
        fillColor: [128, 128, 128], 
        textColor: [0, 0, 0] 
      },
      theme: "grid",
    });

    // Signature line
    doc.text(
      "Signature of Receiver: __________________",
      x + 10,
      y + billHeight - 5
    );

    doc.save(`invoice-${billId}.pdf`);
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-bold text-slate-900 dark:text-white">Invoice Details</h3>

      {/* Search */}
      <div className="flex flex-col sm:flex-row gap-3">
        <input
          type="text"
          value={billId}
          onChange={(e) => handleBillIdChange(e.target.value)}
          placeholder="Enter Bill ID"
          className="w-full flex-1 px-3 py-2 border border-cyan-200/30 dark:border-cyan-700/50 rounded-lg bg-cyan-50/30 dark:bg-cyan-900/10 text-slate-900 dark:text-white focus:ring-2 focus:ring-cyan-400/50 focus:border-cyan-400"
        />
        <button
          onClick={() => handleFetchInvoice()}
          disabled={loading}
          className="w-full sm:w-auto px-4 py-2 bg-cyan-500 text-white rounded-lg hover:bg-cyan-500/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20"
        >
          {loading ? (
            <>
              <span className="material-symbols-outlined animate-spin text-sm">sync</span>
              Loading...
            </>
          ) : (
            <>
              <span className="material-symbols-outlined text-sm">search</span>
              View Invoice
            </>
          )}
        </button>
        {invoiceData && (
          <button
            onClick={handleDownloadPDF}
            disabled={loading}
            className="w-full sm:w-auto px-4 py-2 border border-cyan-200/30 dark:border-cyan-700/50 rounded-lg hover:bg-cyan-50/30 dark:hover:bg-cyan-900/10 text-slate-700 dark:text-slate-300 hover:text-cyan-200 dark:hover:text-cyan-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-colors"
          >
            <span className="material-symbols-outlined text-sm">download</span>
            Download PDF
          </button>
        )}
      </div>

      {/* Messages */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 flex items-center justify-between">
          <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
          <button
            onClick={() => setError('')}
            className="text-red-700 dark:text-red-300 hover:text-red-900 dark:hover:text-red-100"
          >
            <span className="material-symbols-outlined text-sm">close</span>
          </button>
        </div>
      )}
      {success && (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3 flex items-center justify-between">
          <p className="text-sm text-green-700 dark:text-green-300">{success}</p>
          <button
            onClick={() => setSuccess('')}
            className="text-green-700 dark:text-green-300 hover:text-green-900 dark:hover:text-green-100"
          >
            <span className="material-symbols-outlined text-sm">close</span>
          </button>
        </div>
      )}

      {/* Invoice Details */}
      {invoiceData && (
        <>
          {/* Printable Invoice View (A4/4 format) */}
          <div className="hidden print:block" style={{ pageBreakInside: 'avoid' }}>
            <div className="w-full max-w-4xl mx-auto" style={{ width: '210mm', height: '147.5mm', padding: '10mm', border: '2px solid #960000', fontFamily: 'Courier New' }}>
              <div className="flex flex-col h-full">
                {/* Header */}
                <div className="text-center mb-2">
                  <p style={{ fontSize: '10pt', fontWeight: 'bold', margin: '2px 0' }}>STAR PUBLIC SCHOOL</p>
                  <p style={{ fontSize: '8pt', margin: '1px 0' }}>Meghwal mathia Bazar, West Champaran, Bihar 845106</p>
                  <p style={{ fontSize: '8pt', margin: '1px 0' }}>Mob: 9006457330</p>
                  <p style={{ fontSize: '9pt', fontWeight: 'bold', margin: '2px 0' }}>Invoice #{invoiceData.invoice_number || invoiceData.bill_id || '--'}</p>
                </div>

                {/* Student Details */}
                <div style={{ fontSize: '8pt', marginBottom: '4mm', lineHeight: '1.4' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px' }}>
                    <span><strong>SI No:</strong> {invoiceData.bill_id || '--'}</span>
                    <span><strong>Date:</strong> {invoiceData.date ? new Date(invoiceData.date).toLocaleDateString('en-IN') : '--'}</span>
                    <span><strong>Student:</strong> {invoiceData.student?.name || '--'}</span>
                    <span><strong>Roll No:</strong> {invoiceData.student?.roll_no || '--'}</span>
                    <span><strong>Father:</strong> {invoiceData.student?.father_name || '--'}</span>
                    <span><strong>Class:</strong> {invoiceData.student?.class || '--'} - {invoiceData.student?.section || '--'}</span>
                    <span style={{ gridColumn: '1 / -1' }}><strong>Month:</strong> {invoiceData.month || '--'}</span>
                  </div>
                </div>

                {/* Fee Items Table */}
                {invoiceData.items && invoiceData.items.length > 0 && (
                  <div style={{ fontSize: '8pt', marginBottom: '3mm', flex: 1 }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr style={{ backgroundColor: '#808080', color: '#000' }}>
                          <th style={{ border: '1px solid #000', padding: '2px', textAlign: 'left', fontWeight: 'bold' }}>Details</th>
                          <th style={{ border: '1px solid #000', padding: '2px', textAlign: 'right', fontWeight: 'bold' }}>Rs.</th>
                          <th style={{ border: '1px solid #000', padding: '2px', textAlign: 'right', fontWeight: 'bold' }}>P</th>
                        </tr>
                      </thead>
                      <tbody>
                        {invoiceData.items.map((item, idx) => (
                          <tr key={idx}>
                            <td style={{ border: '1px solid #000', padding: '2px' }}>{item.fee_name || ''}</td>
                            <td style={{ border: '1px solid #000', padding: '2px', textAlign: 'right' }}>{(item.amount || 0).toLocaleString('en-IN')}</td>
                            <td style={{ border: '1px solid #000', padding: '2px', textAlign: 'right' }}>00</td>
                          </tr>
                        ))}
                        <tr style={{ backgroundColor: '#d3d3d3' }}>
                          <td style={{ border: '1px solid #000', padding: '2px', fontWeight: 'bold' }}>Total</td>
                          <td style={{ border: '1px solid #000', padding: '2px', textAlign: 'right', fontWeight: 'bold' }}>{(invoiceData.items.reduce((sum, i) => sum + (i.amount || 0), 0)).toLocaleString('en-IN')}</td>
                          <td style={{ border: '1px solid #000', padding: '2px', textAlign: 'right', fontWeight: 'bold' }}>00</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Summary Table */}
                {invoiceData.summary && (
                  <div style={{ fontSize: '8pt', marginBottom: '3mm' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr style={{ backgroundColor: '#808080', color: '#000' }}>
                          <th style={{ border: '1px solid #000', padding: '2px', textAlign: 'left', fontWeight: 'bold' }}>Description</th>
                          <th style={{ border: '1px solid #000', padding: '2px', textAlign: 'right', fontWeight: 'bold' }}>Rs.</th>
                          <th style={{ border: '1px solid #000', padding: '2px', textAlign: 'right', fontWeight: 'bold' }}>P</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td style={{ border: '1px solid #000', padding: '2px', fontWeight: 'bold' }}>Total</td>
                          <td style={{ border: '1px solid #000', padding: '2px', textAlign: 'right' }}>{(invoiceData.summary.total_amount || 0).toLocaleString('en-IN')}</td>
                          <td style={{ border: '1px solid #000', padding: '2px', textAlign: 'right' }}>00</td>
                        </tr>
                        <tr>
                          <td style={{ border: '1px solid #000', padding: '2px', fontWeight: 'bold' }}>Advance</td>
                          <td style={{ border: '1px solid #000', padding: '2px', textAlign: 'right' }}>{(invoiceData.summary.advance_used || 0).toLocaleString('en-IN')}</td>
                          <td style={{ border: '1px solid #000', padding: '2px', textAlign: 'right' }}>00</td>
                        </tr>
                        <tr>
                          <td style={{ border: '1px solid #000', padding: '2px', fontWeight: 'bold' }}>Net Payable</td>
                          <td style={{ border: '1px solid #000', padding: '2px', textAlign: 'right' }}>{(invoiceData.summary.net_payable || 0).toLocaleString('en-IN')}</td>
                          <td style={{ border: '1px solid #000', padding: '2px', textAlign: 'right' }}>00</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Signature */}
                <div style={{ fontSize: '8pt', marginTop: '2mm' }}>
                  <p>Signature of Receiver: __________________</p>
                </div>
              </div>
            </div>
          </div>

          {/* Screen Display View */}
          <div className="print:hidden bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-6 space-y-6">
          {/* Invoice Header */}
          <div className="bg-gradient-to-r from-cyan-50/30 to-cyan-500/10 dark:from-cyan-900/30 dark:to-cyan-800/20 rounded-xl p-5 border border-cyan-200/30 dark:border-cyan-700/50">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <h4 className="text-xl font-bold text-slate-900 dark:text-white mb-1">Invoice #{invoiceData.invoice_number || invoiceData.bill_id || '--'}</h4>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Date: {invoiceData.date ? new Date(invoiceData.date).toLocaleDateString('en-IN', { 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  }) : '--'}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide font-semibold mb-1">Bill ID</p>
                <p className="text-sm font-medium text-slate-900 dark:text-white break-all">{invoiceData.bill_id || '--'}</p>
              </div>
            </div>
          </div>

          {/* Student Info */}
          {invoiceData.student && (
            <div className="bg-slate-50 dark:bg-slate-900/50 rounded-xl p-5 border border-slate-200 dark:border-slate-700">
              <h4 className="text-md font-bold text-slate-900 dark:text-white mb-4">Student Information</h4>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-slate-600 dark:text-slate-400 block mb-1">Name:</span>
                  <span className="font-semibold text-slate-900 dark:text-white">
                    {invoiceData.student.name || '--'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-600 dark:text-slate-400 block mb-1">Father Name:</span>
                  <span className="font-semibold text-slate-900 dark:text-white">
                    {invoiceData.student.father_name || '--'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-600 dark:text-slate-400 block mb-1">Roll Number:</span>
                  <span className="font-semibold text-slate-900 dark:text-white">
                    {invoiceData.student.roll_no || '--'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-600 dark:text-slate-400 block mb-1">Class:</span>
                  <span className="font-semibold text-slate-900 dark:text-white">
                    {invoiceData.student.class || '--'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-600 dark:text-slate-400 block mb-1">Section:</span>
                  <span className="font-semibold text-slate-900 dark:text-white">
                    {invoiceData.student.section || '--'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-600 dark:text-slate-400 block mb-1">Month:</span>
                  <span className="font-semibold text-slate-900 dark:text-white">
                    {invoiceData.month || '--'}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Bill Items */}
          {invoiceData.items && invoiceData.items.length > 0 && (
            <div>
              <h4 className="text-md font-bold text-slate-900 dark:text-white mb-4">Fee Items</h4>
              <div className="overflow-x-auto table-scrollbar" style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgb(99, 126, 153) rgb(224, 242, 254)' }}>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-cyan-500 dark:bg-cyan-500 border-b-2 border-cyan-200/30 dark:border-cyan-700/50">
                      <th className="px-4 py-3 text-left font-bold text-white">S.No</th>
                      <th className="px-4 py-3 text-left font-bold text-white">Fee Name</th>
                      <th className="px-4 py-3 text-right font-bold text-white">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoiceData.items.map((item, index) => (
                      <tr key={item.id || index} className="border-b border-cyan-200/30 dark:border-cyan-700/50 hover:bg-cyan-50/30 dark:hover:bg-cyan-900/10 transition-colors">
                        <td className="px-4 py-3 text-center text-slate-600 dark:text-slate-400">{index + 1}</td>
                        <td className="px-4 py-3 text-slate-900 dark:text-white font-medium">{item.fee_name || item.name || '--'}</td>
                        <td className="px-4 py-3 text-right text-slate-900 dark:text-white font-semibold">₹{(item.amount || 0).toLocaleString('en-IN')}</td>
                      </tr>
                    ))}
                    <tr className="bg-cyan-500/20 dark:bg-cyan-500/20 border-t-2 border-cyan-200/30 dark:border-cyan-700/50 font-bold">
                      <td colSpan={2} className="px-4 py-3 text-right text-slate-900 dark:text-white">Total:</td>
                      <td className="px-4 py-3 text-right text-slate-900 dark:text-white">
                        ₹{invoiceData.items.reduce((sum, item) => sum + (item.amount || 0), 0).toLocaleString('en-IN')}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Payments */}
          {invoiceData.payments && invoiceData.payments.length > 0 && (
            <div>
              <h4 className="text-md font-bold text-slate-900 dark:text-white mb-4">Payment History</h4>
              <div className="overflow-x-auto table-scrollbar" style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgb(99, 126, 153) rgb(224, 242, 254)' }}>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-cyan-500 dark:bg-cyan-500 border-b-2 border-cyan-200/30 dark:border-cyan-700/50">
                      <th className="px-4 py-3 text-left font-bold text-white">Receipt No</th>
                      <th className="px-4 py-3 text-left font-bold text-white">Payment Date</th>
                      <th className="px-4 py-3 text-left font-bold text-white">Payment Mode</th>
                      <th className="px-4 py-3 text-right font-bold text-white">Amount Paid</th>
                      {invoiceData.payments.some(p => p.transaction_id) && (
                        <th className="px-4 py-3 text-left font-bold text-white">Transaction ID</th>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {invoiceData.payments.map((payment, index) => (
                      <tr key={payment.id || index} className="border-b border-cyan-200/30 dark:border-cyan-700/50 hover:bg-cyan-50/30 dark:hover:bg-cyan-900/10">
                        <td className="px-4 py-3 text-slate-900 dark:text-white font-medium">
                          {payment.receipt_no || '--'}
                        </td>
                        <td className="px-4 py-3 text-slate-900 dark:text-white">
                          {payment.payment_date ? new Date(payment.payment_date).toLocaleDateString('en-IN', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric'
                          }) : '--'}
                        </td>
                        <td className="px-4 py-3 text-slate-900 dark:text-white capitalize">
                          <span className="px-2 py-1 bg-cyan-300/15 dark:bg-cyan-500/20 text-cyan-200 dark:text-cyan-200 rounded-md text-xs font-medium border border-cyan-400/30">
                            {payment.payment_mode || '--'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right text-green-600 dark:text-green-400 font-bold">
                          ₹{(payment.amount_paid || payment.amount || 0).toLocaleString('en-IN')}
                        </td>
                        {invoiceData.payments.some(p => p.transaction_id) && (
                          <td className="px-4 py-3 text-slate-600 dark:text-slate-400 text-xs break-all">
                            {payment.transaction_id || '--'}
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Summary */}
          {invoiceData.summary && (
            <div className="bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900/50 dark:to-slate-800/50 rounded-xl p-6 border-2 border-slate-200 dark:border-slate-700">
              <h4 className="text-md font-bold text-slate-900 dark:text-white mb-4">Payment Summary</h4>
              <div className="space-y-3">
                <div className="flex justify-between items-center py-2 border-b border-slate-200 dark:border-slate-700">
                  <span className="text-slate-600 dark:text-slate-400 font-medium">Total Amount:</span>
                  <span className="font-bold text-lg text-slate-900 dark:text-white">
                    ₹{(invoiceData.summary.total_amount || 0).toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-slate-200 dark:border-slate-700">
                  <span className="text-slate-600 dark:text-slate-400 font-medium">Total Paid:</span>
                  <span className="font-bold text-lg text-green-600 dark:text-green-400">
                    ₹{(invoiceData.summary.total_paid || 0).toLocaleString('en-IN')}
                  </span>
                </div>
                {invoiceData.summary.advance_used > 0 && (
                  <div className="flex justify-between items-center py-2 border-b border-slate-200 dark:border-slate-700">
                    <span className="text-slate-600 dark:text-slate-400 font-medium">Advance Used:</span>
                    <span className="font-bold text-amber-600 dark:text-amber-400">
                      ₹{(invoiceData.summary.advance_used || 0).toLocaleString('en-IN')}
                    </span>
                  </div>
                )}
                {invoiceData.summary.total_paid_including_advance !== undefined && (
                  <div className="flex justify-between items-center py-2 border-b border-slate-200 dark:border-slate-700">
                    <span className="text-slate-600 dark:text-slate-400 font-medium">Total Paid (Incl. Advance):</span>
                    <span className="font-bold text-green-600 dark:text-green-400">
                      ₹{(invoiceData.summary.total_paid_including_advance || 0).toLocaleString('en-IN')}
                    </span>
                  </div>
                )}
                <div className="flex justify-between items-center py-2 border-b border-slate-200 dark:border-slate-700">
                  <span className="text-slate-600 dark:text-slate-400 font-medium">Remaining:</span>
                  <span className={`font-bold text-lg ${
                    (invoiceData.summary.remaining || 0) > 0 
                      ? 'text-red-600 dark:text-red-400' 
                      : 'text-green-600 dark:text-green-400'
                  }`}>
                    ₹{(invoiceData.summary.remaining || 0).toLocaleString('en-IN')}
                  </span>
                </div>
                {invoiceData.summary.active_advance_balance > 0 && (
                  <div className="flex justify-between items-center py-2 border-b border-slate-200 dark:border-slate-700">
                    <span className="text-slate-600 dark:text-slate-400 font-medium">Active Advance Balance:</span>
                    <span className="font-bold text-indigo-600 dark:text-indigo-400">
                      ₹{(invoiceData.summary.active_advance_balance || 0).toLocaleString('en-IN')}
                    </span>
                  </div>
                )}
                <div className="flex justify-between items-center pt-3">
                  <span className="text-slate-600 dark:text-slate-400 font-semibold">Status:</span>
                  <span className={`px-4 py-2 rounded-lg text-sm font-bold ${
                    invoiceData.summary.status === 'paid' 
                      ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'
                      : invoiceData.summary.status === 'partial'
                      ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300'
                      : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300'
                  }`}>
                    {invoiceData.summary.status ? invoiceData.summary.status.charAt(0).toUpperCase() + invoiceData.summary.status.slice(1) : '--'}
                  </span>
                </div>
              </div>
            </div>
          )}
          </div>
        </>
      )}
    </div>
  );
}

export default Invoice;

