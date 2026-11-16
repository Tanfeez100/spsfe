import React, { useEffect, useState } from 'react'
import { useLocation, useNavigate, useOutletContext } from 'react-router-dom'
import { clearSession, getLoginType, getUser, logout } from '../Api/auth'
import schoolLogo from '../assets/logo.png'

// 1. Dashboard: 4 squares outline
function DashboardIcon({ className = 'w-5 h-5' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" rx="1.5" />
      <rect x="14" y="3" width="7" height="7" rx="1.5" />
      <rect x="14" y="14" width="7" height="7" rx="1.5" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" />
    </svg>
  )
}

// 2. Student: Person with plus
function StudentIcon({ className = 'w-5 h-5' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="8.5" cy="7" r="4" />
      <line x1="20" y1="8" x2="20" y2="14" />
      <line x1="23" y1="11" x2="17" y2="11" />
    </svg>
  )
}

// 3. Class Promotion: Arrow Up
function ClassPromotionIcon({ className = 'w-5 h-5' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="19" x2="12" y2="5" />
      <polyline points="5 12 12 5 19 12" />
    </svg>
  )
}

// 4. Subject: Book with bookmark ribbon
function SubjectIcon({ className = 'w-5 h-5' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
      <path d="M9 2v8l3-2.5 3 2.5V2" />
    </svg>
  )
}

// 5. Teacher: ID Badge with portrait
function TeacherIcon({ className = 'w-5 h-5' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="17" rx="3" />
      <circle cx="12" cy="10" r="3" />
      <path d="M7 19a5 5 0 0 1 10 0" />
      <path d="M9 2h6" />
    </svg>
  )
}

// 6. Fees: Banknote
function FeesIcon({ className = 'w-5 h-5' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="6" width="20" height="12" rx="2" />
      <circle cx="12" cy="12" r="2.5" />
      <path d="M6 12h.01M18 12h.01" />
    </svg>
  )
}

// 7. Attendance: Checklist notepad
function AttendanceIcon({ className = 'w-5 h-5' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <path d="m7 12 2 2 4-4" />
      <path d="M14 8h3" />
      <path d="M14 16h3" />
    </svg>
  )
}

// 8. Marks Upload: Tray with arrow up
function MarksUploadIcon({ className = 'w-5 h-5' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="17 8 12 3 7 8" />
      <line x1="12" y1="3" x2="12" y2="15" />
    </svg>
  )
}

// 9. Upload Photo: Camera with lens
function UploadPhotoIcon({ className = 'w-5 h-5' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
      <circle cx="12" cy="13" r="4" />
    </svg>
  )
}

// 10. ID & Admit Cards: Badge outline
function IdCardIcon({ className = 'w-5 h-5' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="16" rx="3" />
      <circle cx="9" cy="10" r="2.5" />
      <line x1="14" y1="9" x2="18" y2="9" />
      <line x1="14" y1="12" x2="18" y2="12" />
      <line x1="6" y1="16" x2="18" y2="16" />
    </svg>
  )
}

// 11. Document Management: Folded file with lines
function DocumentManagementIcon({ className = 'w-5 h-5' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
      <polyline points="10 9 9 9 8 9" />
    </svg>
  )
}

// 12. Examination Management: Clipboard with checkmark and lines
function ExaminationIcon({ className = 'w-5 h-5' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
      <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
      <path d="m9 14 2 2 4-4" />
    </svg>
  )
}

// 13. Timetable: Calendar with clock
function TimetableIcon({ className = 'w-5 h-5' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
      <circle cx="12" cy="15" r="2.5" />
      <polyline points="12 14 12 15 13.2 15" />
    </svg>
  )
}

// 15. Marksheet: Certificate / Award
function MarksheetIcon({ className = 'w-5 h-5' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <path d="m9 15 2 2 4-4" />
    </svg>
  )
}

// 14. Help Center: Question circle
function HelpCenterIcon({ className = 'w-5 h-5' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  )
}

// Feature-based Grouped Navigation Architecture
const NAV_GROUPS = [
  {
    id: 'overview',
    number: '01',
    title: 'OVERVIEW',
    items: [
      {
        id: 'dashboard',
        label: 'Dashboard',
        path: '/dashboard',
        Icon: DashboardIcon,
        hasDot: true,
      },
    ],
  },
  {
    id: 'students',
    number: '02',
    title: 'STUDENT MANAGEMENT',
    items: [
      {
        id: 'student',
        label: 'Student Directory',
        path: '/students',
        Icon: StudentIcon,
        badge: '1.4k',
      },
      {
        id: 'classPromotion',
        label: 'Class Promotion',
        path: '/class-promotion',
        Icon: ClassPromotionIcon,
        adminOnly: true,
      },
      {
        id: 'idCards',
        label: 'ID & Photos',
        path: '/id-cards',
        Icon: IdCardIcon,
        badge: 'New',
        badgeColor: 'amber',
        adminOnly: true,
      },
      {
        id: 'uploadPhoto',
        label: 'Upload Photos',
        path: '/upload-photo',
        Icon: UploadPhotoIcon,
        adminOnly: true,
      },
    ],
  },
  {
    id: 'fees',
    number: '03',
    title: 'FEE & FINANCE',
    items: [
      {
        id: 'fees',
        label: 'Fee Management',
        path: '/fees',
        Icon: FeesIcon,
        badge: '97%',
        badgeColor: 'emerald',
        adminOnly: true,
      },
    ],
  },
  {
    id: 'academics',
    number: '04',
    title: 'ACADEMICS',
    items: [
      {
        id: 'timetable',
        label: 'Timetable',
        path: '/timetable',
        Icon: TimetableIcon,
      },
      {
        id: 'examinationManagement',
        label: 'Examinations',
        path: '/examinations',
        Icon: ExaminationIcon,
        hasDot: true,
        dotColor: 'amber',
      },
      {
        id: 'uploadMarks',
        label: 'Marks Upload',
        path: '/marks-upload',
        Icon: MarksUploadIcon,
      },
      {
        id: 'subject',
        label: 'Curriculum & Syllabus',
        path: '/subjects',
        Icon: SubjectIcon,
        adminOnly: true,
      },
    ],
  },
  {
    id: 'attendanceStaff',
    number: '05',
    title: 'STAFF & SAFETY',
    items: [
      {
        id: 'attendance',
        label: 'Staff Attendance & GPS',
        path: '/attendance',
        Icon: AttendanceIcon,
        badge: '74/77',
        badgeColor: 'teal',
      },
      {
        id: 'teachers',
        label: 'Faculty & Teachers',
        path: '/teachers',
        Icon: TeacherIcon,
        adminOnly: true,
      },
    ],
  },
  {
    id: 'administration',
    number: '06',
    title: 'ADMINISTRATION',
    items: [
      {
        id: 'documentManagement',
        label: 'Document Management',
        path: '/document-management',
        Icon: DocumentManagementIcon,
        adminOnly: true,
      },
      {
        id: 'result',
        label: 'Fast-Track Excel Import',
        path: '/result-view',
        Icon: MarksUploadIcon,
      },
    ],
  },
  {
    id: 'helpSupport',
    number: '07',
    title: 'HELP & SUPPORT',
    items: [
      {
        id: 'helpCenter',
        label: 'Help Center & Docs',
        path: '/help',
        Icon: HelpCenterIcon,
      },
    ],
  },
]

const NAV_ITEMS = NAV_GROUPS.flatMap((g) => g.items)

const viewPathMap = {
  dashboard: '/dashboard',
  student: '/students',
  idCards: '/id-cards',
  documentManagement: '/document-management',
  classPromotion: '/class-promotion',
  examinationManagement: '/examinations',
  subject: '/subjects',
  teachers: '/teachers',
  fees: '/fees',
  attendance: '/attendance',
  uploadMarks: '/marks-upload',
  uploadPhoto: '/upload-photo',
  timetable: '/timetable',
  result: '/result-view',
  helpCenter: '/help',
}

function Sidebar({
  isOpen,
  setIsOpen,
  activeView,
  setActiveView,
  isCollapsed: propIsCollapsed,
  setIsCollapsed: propSetIsCollapsed,
}) {
  const navigate = useNavigate()
  const location = useLocation()
  const outletContext = useOutletContext() || {}
  const [, setIsLoggingOut] = useState(false)
  const [, setLoginType] = useState('all')
  const [user, setUser] = useState(null)

  const [internalCollapsed, setInternalCollapsed] = useState(() => {
    try {
      return localStorage.getItem('sps_sidebar_collapsed') === 'true'
    } catch {
      return false
    }
  })

  // Synchronize collapse state with layout context or localStorage
  const isCollapsed = propIsCollapsed !== undefined
    ? propIsCollapsed
    : outletContext.isCollapsed !== undefined
      ? outletContext.isCollapsed
      : internalCollapsed

  const setIsCollapsed = propSetIsCollapsed || outletContext.setIsCollapsed || setInternalCollapsed

  useEffect(() => {
    const handleToggle = () => {
      setInternalCollapsed((prev) => !prev)
    }
    window.addEventListener('sps_sidebar_toggle', handleToggle)
    return () => window.removeEventListener('sps_sidebar_toggle', handleToggle)
  }, [])

  useEffect(() => {
    setLoginType(getLoginType())
    setUser(getUser())
  }, [])

  const currentPath = location.pathname
  const detectedView = Object.entries(viewPathMap).find(([, path]) => path === currentPath)?.[0] || 'dashboard'
  const currentActive = activeView || detectedView

  const handleNavigate = (viewId, path) => {
    if (path) navigate(path)
    if (setActiveView) setActiveView(viewId)
    if (setIsOpen) setIsOpen(false)
  }

  const handleLogout = async () => {
    setIsLoggingOut(true)
    const currentLoginType = getLoginType()

    try {
      if (currentLoginType === 'all') await logout()
      else clearSession()
    } catch (error) {
      console.error('Logout error:', error)
      clearSession()
    } finally {
      clearSession()
      if (currentLoginType === 'student') navigate('/student-login')
      else navigate('/login')
      setIsLoggingOut(false)
    }
  }

  const role = user?.role || 'admin'
  const isTeacher = role === 'teacher'
  const teacherAllowedIds = ['dashboard', 'attendance', 'uploadMarks', 'examinationManagement', 'student', 'timetable']

  const visibleGroups = NAV_GROUPS.map((group) => {
    const visibleItems = group.items.filter((item) => {
      if (isTeacher) {
        return teacherAllowedIds.includes(item.id)
      }
      return true
    })
    return {
      ...group,
      items: visibleItems,
    }
  }).filter((group) => group.items.length > 0)

  const displayName = isTeacher
    ? user?.fullName || user?.name || user?.email?.split('@')[0] || 'Teacher'
    : user?.name || user?.fullName || 'Principal Sharma'

  const displayRole = isTeacher
    ? (user?.assignedClass ? `Class Teacher (${user.assignedClass}-${user.assignedSection || 'A'})` : 'Faculty Member')
    : 'Super Admin'

  const userInitials = displayName
    .trim()
    .split(/\s+/)
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase() || (isTeacher ? 'TC' : 'PS')

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-xs lg:hidden"
          onClick={() => setIsOpen && setIsOpen(false)}
        />
      )}

      {/* Clean Premium Sidebar with Deep Navy Slate Theme matching reference image */}
      <aside
        className={`fixed bottom-0 left-0 top-0 z-50 flex h-full ${
          isCollapsed ? 'w-[72px]' : 'w-64'
        } shrink-0 flex-col justify-between bg-[#0c1322] border-r border-slate-800/80 text-slate-300 select-none transition-all duration-200 ease-in-out lg:static ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="flex h-full flex-col justify-between overflow-y-auto px-3 py-4 scrollbar-none">
          <div className="space-y-4">
            {/* Mobile Drawer Header */}
            <div className="flex items-center justify-between p-1.5 lg:hidden border-b border-slate-800 pb-3 mb-2">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-500 p-1 text-white font-bold text-xs shadow-2xs overflow-hidden">
                  <img
                    src={schoolLogo}
                    alt="Star Public School"
                    className="h-full w-full object-contain"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none'
                      e.currentTarget.parentElement.innerText = 'SPS'
                    }}
                  />
                </div>
                <div className="min-w-0">
                  <h1 className="text-[13px] font-bold text-white leading-tight truncate">
                    Star Public School
                  </h1>
                  <p className="text-[10px] font-medium text-slate-400 leading-none mt-0.5 truncate">
                    Central ERP · {isTeacher ? 'Faculty' : 'Campus Admin'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen && setIsOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                title="Close sidebar"
              >
                <span className="material-symbols-outlined text-[20px] leading-none">close</span>
              </button>
            </div>

            {/* Grouped Feature Navigation (All Tabs 100% Preserved) */}
            <div className="space-y-4">
              {visibleGroups.map((group, groupIdx) => (
                <div key={group.id} className="space-y-0.5">
                  {!isCollapsed ? (
                    <div className="px-2.5 pt-2.5 pb-1 flex items-center gap-1.5">
                      {group.number && (
                        <span className="text-[9.5px] font-bold font-mono text-slate-500">
                          {group.number}
                        </span>
                      )}
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        {group.title}
                      </p>
                    </div>
                  ) : groupIdx > 0 ? (
                    <div className="my-2 border-t border-slate-800/80" />
                  ) : null}

                  <div className="space-y-0.5">
                    {group.items.map((item) => {
                      const isActive = currentActive === item.id || currentPath === item.path
                      const { Icon } = item

                      return (
                        <button
                          key={item.id}
                          onClick={() => handleNavigate(item.id, item.path)}
                          className={`group flex w-full items-center rounded-xl text-[13px] transition-all duration-150 ${
                            isCollapsed ? 'justify-center p-2.5' : 'px-3 py-2.5 gap-2.5'
                          } ${
                            isActive
                              ? 'bg-linear-to-r from-blue-600 via-indigo-600 to-indigo-700 text-white font-bold shadow-md shadow-indigo-950/60'
                              : 'text-slate-300 hover:bg-slate-800/60 hover:text-white font-medium'
                          }`}
                          title={item.label}
                        >
                          <div
                            className={`shrink-0 transition-colors ${
                              isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'
                            }`}
                          >
                            <Icon className={`w-[18px] h-[18px] ${isActive ? 'stroke-[2.2]' : 'stroke-[1.8]'}`} />
                          </div>

                          {!isCollapsed && (
                            <>
                              <span className="truncate text-left tracking-tight flex-1">
                                {item.label}
                              </span>

                              {/* Badges & Indicators */}
                              {isActive ? (
                                <span className="h-1.5 w-1.5 rounded-full bg-white shadow-[0_0_8px_white]" />
                              ) : item.badge ? (
                                <span
                                  className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${
                                    item.badgeColor === 'amber'
                                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                      : item.badgeColor === 'emerald'
                                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                      : item.badgeColor === 'teal'
                                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                                      : 'bg-slate-800 text-slate-300 border border-slate-700/80'
                                  }`}
                                >
                                  {item.badge}
                                </span>
                              ) : item.hasDot ? (
                                <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
                              ) : null}
                            </>
                          )}
                        </button>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Bottom Widget: Cloud Sync Active Card */}
          <div className="pt-3 border-t border-slate-800/80">
            {!isCollapsed ? (
              <div className="rounded-xl bg-slate-900/90 border border-slate-800 p-3 text-left">
                <div className="flex items-center gap-1.5 text-xs font-bold text-amber-400">
                  <span className="material-symbols-outlined text-[15px] leading-none text-amber-400">bolt</span>
                  <span>Cloud Sync Active</span>
                </div>
                <p className="text-[10.5px] text-slate-400 mt-1 leading-snug">
                  Auto synced 2 mins ago. All systems operational.
                </p>
              </div>
            ) : (
              <div className="flex justify-center" title="Cloud Sync Active: All systems operational">
                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-900 text-amber-400 border border-slate-800">
                  <span className="material-symbols-outlined text-[18px]">bolt</span>
                </span>
              </div>
            )}
          </div>
        </div>
      </aside>
    </>
  )
}

export default Sidebar
