import React from 'react'
import BillSlipCard from './BillSlipCard'
import './BillSlipCard.css'

/**
 * BillSheetGrid - 6-in-1 A4 Sheet Layout (2 columns x 3 rows)
 * Features:
 * 1. Center vertical cutting line (dashed with scissor indicators)
 * 2. Horizontal cutting lines between rows (dashed with 'CUT HERE' badges)
 * 3. Strict 1-to-1 slot mapping: If there are fewer than 6 bills (e.g. 5 students),
 *    the remaining slot renders as a clean empty blank box (never duplicates another student).
 */
export default function BillSheetGrid({ bills = [], isPrint = false }) {
  // Map strictly to 6 slots. Missing slots are null (no gap-filling duplicates!)
  const slots = [0, 1, 2, 3, 4, 5].map((idx) => bills[idx] || null)

  return (
    <div className="sheet-cut-guide-container">
      {/* Center Vertical Cutting Line with Scissors */}
      <div className="sheet-cut-line-v" aria-hidden="true">
        <span className="cut-scissor-v" title="Cut Here">✂</span>
        <span className="cut-scissor-v" title="Cut Here">✂</span>
        <span className="cut-scissor-v" title="Cut Here">✂</span>
      </div>

      {/* Row 1: Slot 0 (Left) & Slot 1 (Right) */}
      <div className="bill-sheet-row">
        <div className="bill-sheet-slot">
          {slots[0] ? (
            <BillSlipCard bill={slots[0]} isPrint={isPrint} />
          ) : (
            <div className="bill-slot-empty" />
          )}
        </div>
        <div className="bill-sheet-slot">
          {slots[1] ? (
            <BillSlipCard bill={slots[1]} isPrint={isPrint} />
          ) : (
            <div className="bill-slot-empty" />
          )}
        </div>
      </div>

      {/* Horizontal Cutting Line 1 */}
      <div className="sheet-cut-line-h" aria-hidden="true">
        <div className="cut-badge-h">
          <span className="scissor">✂</span>
          <span>CUT HERE</span>
          <span className="scissor">✂</span>
        </div>
      </div>

      {/* Row 2: Slot 2 (Left) & Slot 3 (Right) */}
      <div className="bill-sheet-row">
        <div className="bill-sheet-slot">
          {slots[2] ? (
            <BillSlipCard bill={slots[2]} isPrint={isPrint} />
          ) : (
            <div className="bill-slot-empty" />
          )}
        </div>
        <div className="bill-sheet-slot">
          {slots[3] ? (
            <BillSlipCard bill={slots[3]} isPrint={isPrint} />
          ) : (
            <div className="bill-slot-empty" />
          )}
        </div>
      </div>

      {/* Horizontal Cutting Line 2 */}
      <div className="sheet-cut-line-h" aria-hidden="true">
        <div className="cut-badge-h">
          <span className="scissor">✂</span>
          <span>CUT HERE</span>
          <span className="scissor">✂</span>
        </div>
      </div>

      {/* Row 3: Slot 4 (Left) & Slot 5 (Right) */}
      <div className="bill-sheet-row">
        <div className="bill-sheet-slot">
          {slots[4] ? (
            <BillSlipCard bill={slots[4]} isPrint={isPrint} />
          ) : (
            <div className="bill-slot-empty" />
          )}
        </div>
        <div className="bill-sheet-slot">
          {slots[5] ? (
            <BillSlipCard bill={slots[5]} isPrint={isPrint} />
          ) : (
            <div className="bill-slot-empty" />
          )}
        </div>
      </div>
    </div>
  )
}
