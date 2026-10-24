import React from 'react'

function ResultView() {
  const results = [
    { subject: 'Mathematics', marks: 95, grade: 'A+', maxMarks: 100 },
    { subject: 'Science', marks: 88, grade: 'A', maxMarks: 100 },
    { subject: 'English', marks: 92, grade: 'A+', maxMarks: 100 },
    { subject: 'History', marks: 85, grade: 'A', maxMarks: 100 },
    { subject: 'Geography', marks: 90, grade: 'A+', maxMarks: 100 },
    { subject: 'Computer Science', marks: 96, grade: 'A+', maxMarks: 100 }
  ]

  const totalMarks = results.reduce((sum, result) => sum + result.marks, 0)
  const maxTotalMarks = results.length * 100
  const percentage = ((totalMarks / maxTotalMarks) * 100).toFixed(1)

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-black text-[#0d141b] dark:text-white">Result View</h2>

      {/* Overall Result Card */}
      <div className="bg-gradient-to-r from-[#137fec] to-[#0d5bb8] rounded-lg p-6 text-white shadow-lg">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm opacity-90 mb-1">Overall Performance</p>
            <p className="text-3xl font-black">{percentage}%</p>
            <p className="text-sm opacity-90 mt-1">Total: {totalMarks}/{maxTotalMarks}</p>
          </div>
          <span className="material-symbols-outlined text-5xl opacity-50">emoji_events</span>
        </div>
      </div>

      {/* Results Table */}
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 dark:bg-slate-900">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Subject
                </th>
                <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Marks
                </th>
                <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Grade
                </th>
                <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
              {results.map((result, index) => (
                <tr key={index} className="hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
                  <td className="px-4 py-3 text-sm font-medium text-slate-900 dark:text-white">
                    {result.subject}
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-300">
                    {result.marks}/{result.maxMarks}
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#137fec]/10 text-[#137fec]">
                      {result.grade}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
                      <span className="material-symbols-outlined text-sm">check_circle</span>
                      Pass
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default ResultView
