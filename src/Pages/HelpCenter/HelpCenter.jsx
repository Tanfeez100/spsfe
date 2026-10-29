import React, { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { HELP_CATEGORIES, MODULE_GUIDES } from './helpCenterData'

export default function HelpCenter() {
  const navigate = useNavigate()
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [selectedModuleId, setSelectedModuleId] = useState(MODULE_GUIDES[0]?.id || 'dashboard')
  const [activeTab, setActiveTab] = useState('guides') // 'guides' | 'features' | 'tips' | 'faqs'

  // Filter modules based on category and search query
  const filteredModules = useMemo(() => {
    return MODULE_GUIDES.filter((m) => {
      const matchesCategory = selectedCategory === 'all' || m.category === selectedCategory
      const query = searchQuery.trim().toLowerCase()
      if (!query) return matchesCategory

      const matchesText =
        m.title.toLowerCase().includes(query) ||
        m.description.toLowerCase().includes(query) ||
        m.features.some((f) => f.toLowerCase().includes(query)) ||
        m.guides.some((g) =>
          g.title.toLowerCase().includes(query) ||
          g.steps.some((s) => s.toLowerCase().includes(query))
        ) ||
        m.faqs.some((faq) =>
          faq.q.toLowerCase().includes(query) ||
          faq.a.toLowerCase().includes(query)
        )
      return matchesCategory && matchesText
    })
  }, [selectedCategory, searchQuery])

  // Active selected module object
  const activeModule = useMemo(() => {
    return (
      MODULE_GUIDES.find((m) => m.id === selectedModuleId) ||
      filteredModules[0] ||
      MODULE_GUIDES[0]
    )
  }, [selectedModuleId, filteredModules])

  const handlePrint = () => {
    window.print()
  }

  return (
    <div className="w-full min-h-screen bg-slate-50/70 p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Top Banner / Hero */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#0f1e36] via-[#132c4e] to-[#1e3a8a] text-white p-6 sm:p-8 shadow-xl">
        <div className="relative z-10 max-w-3xl space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold backdrop-blur-md border border-white/20">
            <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            Official Documentation & User Manual
          </div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight">
            Star Public School ERP Help Center
          </h1>
          <p className="text-sm sm:text-base text-slate-200 leading-relaxed">
            Complete, step-by-step user manual covering every single module of your school management system.
            Search any feature, follow simple walkthroughs, or jump directly into any module with 1 click.
          </p>

          {/* Search Box */}
          <div className="pt-2">
            <div className="relative max-w-xl">
              <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-lg">
                search
              </span>
              <input
                type="text"
                placeholder="Search guides (e.g. 'mark attendance', 'exam date sheet', 'transfer certificate', 'fees')..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-2xl bg-white/95 pl-11 pr-10 py-3.5 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-blue-400/30 shadow-lg"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-sm font-bold"
                >
                  ✕
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Decorative background shape */}
        <div className="absolute right-0 top-0 -mt-10 -mr-10 h-72 w-72 rounded-full bg-blue-500/10 blur-3xl pointer-events-none" />
      </div>

      {/* Category Pills & Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1.5">
          {HELP_CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`rounded-xl px-3.5 py-1.5 text-xs font-semibold transition-all ${
                selectedCategory === cat.id
                  ? 'bg-[#0f1e36] text-white shadow-sm'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-2xs"
            title="Print or Save as PDF"
          >
            <span className="material-symbols-outlined text-sm">print</span>
            Print / Save Manual
          </button>
          <div className="text-xs font-medium text-slate-500">
            Showing <strong className="text-slate-800">{filteredModules.length}</strong> modules
          </div>
        </div>
      </div>

      {/* Main 2-Column Interface: Left Module List / Right Guide Reader */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Module Navigation Cards (4 Cols) */}
        <div className="lg:col-span-4 space-y-2.5 max-h-[820px] overflow-y-auto pr-1">
          {filteredModules.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center">
              <span className="material-symbols-outlined text-3xl text-slate-400">help_outline</span>
              <p className="mt-2 text-sm font-semibold text-slate-700">No guides found</p>
              <p className="mt-1 text-xs text-slate-400">Try searching for a different keyword or category.</p>
              <button
                onClick={() => {
                  setSearchQuery('')
                  setSelectedCategory('all')
                }}
                className="mt-3 text-xs font-bold text-blue-600 hover:underline"
              >
                Reset filters
              </button>
            </div>
          ) : (
            filteredModules.map((m) => {
              const isSelected = activeModule?.id === m.id
              return (
                <div
                  key={m.id}
                  onClick={() => setSelectedModuleId(m.id)}
                  className={`cursor-pointer rounded-2xl p-4 transition-all border ${
                    isSelected
                      ? 'bg-white border-[#1d4ed8] shadow-md ring-2 ring-blue-500/10'
                      : 'bg-white/80 border-slate-200/90 hover:bg-white hover:border-slate-300 shadow-2xs'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <span className="inline-block rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                        {m.badge}
                      </span>
                      <h3
                        className={`text-sm font-bold truncate ${
                          isSelected ? 'text-[#1d4ed8]' : 'text-[#0f1e36]'
                        }`}
                      >
                        {m.title}
                      </h3>
                    </div>
                    <span
                      className={`material-symbols-outlined text-base ${
                        isSelected ? 'text-blue-600' : 'text-slate-400'
                      }`}
                    >
                      arrow_forward_ios
                    </span>
                  </div>

                  <p className="mt-1.5 text-xs text-slate-500 line-clamp-2 leading-relaxed">
                    {m.description}
                  </p>

                  <div className="mt-3 flex items-center justify-between pt-2 border-t border-slate-100 text-[11px] text-slate-400">
                    <div className="flex items-center gap-1">
                      {m.roles.map((r) => (
                        <span key={r} className="rounded bg-blue-50 px-1.5 py-0.2 text-[10px] font-medium text-blue-700">
                          {r}
                        </span>
                      ))}
                    </div>
                    <span>{m.guides.length} Walkthroughs</span>
                  </div>
                </div>
              )
            })
          )}
        </div>

        {/* Right Column: Active Module Comprehensive Guide (8 Cols) */}
        {activeModule && (
          <div className="lg:col-span-8 rounded-3xl border border-slate-200/90 bg-white p-6 sm:p-8 shadow-xs space-y-6">
            {/* Header info */}
            <div className="flex flex-wrap items-start justify-between gap-4 pb-6 border-b border-slate-100">
              <div className="space-y-1.5 max-w-xl">
                <div className="flex items-center gap-2">
                  <span className="rounded-lg bg-blue-50 px-2.5 py-0.5 text-xs font-bold text-blue-700">
                    {activeModule.badge}
                  </span>
                  <span className="text-xs font-medium text-slate-400">
                    Route: <code className="text-slate-700 bg-slate-100 px-1 py-0.5 rounded">{activeModule.route}</code>
                  </span>
                </div>
                <h2 className="text-2xl font-extrabold text-[#0f1e36]">
                  {activeModule.title}
                </h2>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  {activeModule.description}
                </p>
              </div>

              {/* Quick Jump Action Button */}
              <div>
                <button
                  onClick={() => navigate(activeModule.route)}
                  className="inline-flex items-center gap-2 rounded-2xl bg-[#0f1e36] hover:bg-[#1e40af] px-4 py-2.5 text-xs sm:text-sm font-bold text-white shadow-md transition-all active:scale-95"
                >
                  <span>Open {activeModule.badge}</span>
                  <span className="material-symbols-outlined text-sm">open_in_new</span>
                </button>
              </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto">
              {[
                { id: 'guides', label: 'Step-by-Step Walkthroughs', icon: 'format_list_numbered' },
                { id: 'features', label: 'Module Capabilities', icon: 'check_circle' },
                { id: 'tips', label: 'Pro Tips & Best Practices', icon: 'lightbulb' },
                { id: 'faqs', label: 'FAQs & Troubleshooting', icon: 'help' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold transition-all whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'bg-blue-50 text-blue-700 shadow-2xs'
                      : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <span className="material-symbols-outlined text-sm">{tab.icon}</span>
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Tab 1: Step-by-Step Guides */}
            {activeTab === 'guides' && (
              <div className="space-y-6 pt-2">
                {activeModule.guides.map((guide, idx) => (
                  <div key={idx} className="rounded-2xl border border-slate-200/90 bg-slate-50/50 p-5 space-y-3">
                    <div className="flex items-center gap-2">
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#132c4e] text-[11px] font-extrabold text-white">
                        {idx + 1}
                      </span>
                      <h4 className="text-sm font-bold text-[#0f1e36]">
                        {guide.title}
                      </h4>
                    </div>

                    <ol className="space-y-2.5 pt-1 pl-2">
                      {guide.steps.map((step, sIdx) => (
                        <li key={sIdx} className="flex items-start gap-2.5 text-xs text-slate-700 leading-relaxed">
                          <span className="inline-block mt-1 h-1.5 w-1.5 rounded-full bg-blue-600 flex-shrink-0" />
                          <span>{step}</span>
                        </li>
                      ))}
                    </ol>
                  </div>
                ))}
              </div>
            )}

            {/* Tab 2: Core Features */}
            {activeTab === 'features' && (
              <div className="space-y-3 pt-2">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Included Functionalities & Integrations
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {activeModule.features.map((feat, idx) => (
                    <div
                      key={idx}
                      className="flex items-start gap-2.5 rounded-xl border border-slate-200/80 bg-white p-3.5 shadow-2xs text-xs text-slate-800"
                    >
                      <span className="material-symbols-outlined text-base text-emerald-600 flex-shrink-0">
                        check_circle
                      </span>
                      <span className="font-medium leading-relaxed">{feat}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Tab 3: Pro Tips & Best Practices */}
            {activeTab === 'tips' && (
              <div className="space-y-4 pt-2">
                <div className="rounded-2xl bg-amber-50/80 border border-amber-200 p-5 space-y-3">
                  <div className="flex items-center gap-2 text-amber-800">
                    <span className="material-symbols-outlined text-lg">lightbulb</span>
                    <h4 className="text-sm font-bold">Recommended Best Practices</h4>
                  </div>
                  <ul className="space-y-2 pl-2">
                    {activeModule.tips.map((tip, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-xs text-amber-900 leading-relaxed">
                        <span className="mt-1 h-1.5 w-1.5 rounded-full bg-amber-600 flex-shrink-0" />
                        <span>{tip}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {/* Tab 4: FAQs & Troubleshooting */}
            {activeTab === 'faqs' && (
              <div className="space-y-3 pt-2">
                {activeModule.faqs.map((faq, idx) => (
                  <div key={idx} className="rounded-2xl border border-slate-200/90 bg-white p-4.5 space-y-1.5 shadow-2xs">
                    <div className="flex items-start gap-2">
                      <span className="material-symbols-outlined text-base text-blue-600 flex-shrink-0 mt-0.5">
                        help
                      </span>
                      <h4 className="text-xs sm:text-sm font-bold text-slate-900">
                        {faq.q}
                      </h4>
                    </div>
                    <p className="text-xs text-slate-600 pl-6 leading-relaxed">
                      {faq.a}
                    </p>
                  </div>
                ))}
              </div>
            )}

            {/* Quick Action Footer in details */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-6 border-t border-slate-100 text-xs">
              <span className="text-slate-400">
                Authorized Roles: <strong className="text-slate-700">{activeModule.roles.join(', ')}</strong>
              </span>
              <button
                onClick={() => navigate(activeModule.route)}
                className="font-bold text-blue-600 hover:text-blue-800 hover:underline"
              >
                Go directly to {activeModule.title} →
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Support & Contact Footer */}
      <div className="rounded-3xl border border-slate-200/90 bg-white p-6 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-1">
          <h4 className="text-sm font-bold text-[#0f1e36]">
            Need extra assistance with Star Public School ERP?
          </h4>
          <p className="text-xs text-slate-500">
            Our administration support desk is available to assist teachers, accountants, and staff members.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-4 text-xs font-semibold">
          <div className="flex items-center gap-1.5 text-slate-700 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
            <span className="material-symbols-outlined text-sm text-blue-600">call</span>
            <span>+91 9006457330</span>
          </div>
          <div className="flex items-center gap-1.5 text-slate-700 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
            <span className="material-symbols-outlined text-sm text-blue-600">mail</span>
            <span>a9006457330@gmail.com</span>
          </div>
          <div className="flex items-center gap-1.5 text-slate-700 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
            <span className="material-symbols-outlined text-sm text-blue-600">location_on</span>
            <span>West Champaran, Bihar 845106</span>
          </div>
        </div>
      </div>
    </div>
  )
}

