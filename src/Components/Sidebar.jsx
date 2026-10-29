import React, { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
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
    title: 'OVERVIEW',
    items: [
      {
        id: 'dashboard',
        label: 'Dashboard',
        path: '/dashboard',
        Icon: DashboardIcon,
      },
    ],
  },
  {
    id: 'academics',
    title: 'ACADEMICS & ROUTINE',
    items: [
      {
        id: 'timetable',
        label: 'Timetable',
        path: '/timetable',
        Icon: TimetableIcon,
      },
      {
        id: 'examinationManagement',
        label: 'Examination',
        path: '/examinations',
        Icon: ExaminationIcon,
      },
      {
        id: 'uploadMarks',
        label: 'Marks Upload',
        path: '/marks-upload',
        Icon: MarksUploadIcon,
      },
      {
        id: 'result',
        label: 'Fast-Track Excel Import',
        path: '/result-view',
        Icon: MarksUploadIcon,
      },
      {
        id: 'subject',
        label: 'Subject & Syllabus',
        path: '/subjects',
        Icon: SubjectIcon,
        adminOnly: true,
      },
    ],
  },
  {
    id: 'students',
    title: 'STUDENTS & RECORDS',
    items: [
      {
        id: 'student',
        label: 'Student Directory',
        path: '/students',
        Icon: StudentIcon,
      },
      {
        id: 'classPromotion',
        label: 'Class Promotion',
        path: '/class-promotion',
        Icon: ClassPromotionIcon,
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
    id: 'operations',
    title: 'DAILY OPERATIONS',
    items: [
      {
        id: 'attendance',
        label: 'Attendance & GPS',
        path: '/attendance',
        Icon: AttendanceIcon,
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
    id: 'finance',
    title: 'ADMIN & FINANCE',
    items: [
      {
        id: 'fees',
        label: 'Fee Management',
        path: '/fees',
        Icon: FeesIcon,
        adminOnly: true,
      },
      {
        id: 'idCards',
        label: 'ID / Admit Cards',
        path: '/id-cards',
        Icon: IdCardIcon,
        adminOnly: true,
      },
      {
        id: 'documentManagement',
        label: 'Document Management',
        path: '/document-management',
        Icon: DocumentManagementIcon,
        adminOnly: true,
      },
    ],
  },
  {
    id: 'support',
    title: 'HELP & GUIDES',
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

function Sidebar({ isOpen, setIsOpen, activeView, setActiveView }) {
  const navigate = useNavigate()
  const location = useLocation()
  const [, setIsLoggingOut] = useState(false)
  const [, setLoginType] = useState('all')
  const [user, setUser] = useState(null)
  const [isCollapsed, setIsCollapsed] = useState(false)

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

      {/* Enhanced High-Visibility Sidebar with Clear Contrast and Group Dividers */}
      <aside
        className={`fixed bottom-0 left-0 top-0 z-50 flex h-full ${isCollapsed ? 'w-20' : 'w-68'
          } shrink-0 flex-col justify-between bg-[#0b172b] border-r border-[#1a2f4e] text-slate-200 shadow-2xl transition-all duration-300 ease-out select-none lg:static ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
          }`}
      >
        <div className="flex h-full flex-col justify-between overflow-y-auto px-3.5 py-5 scrollbar-none">

          <div className="space-y-6">
            {/* Top Brand Header */}
            <div
              className={`flex items-center gap-3 cursor-pointer group ${isCollapsed ? 'justify-center' : 'px-2'
                }`}
              onClick={() => handleNavigate('dashboard', '/dashboard')}
            >
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white p-1 shadow-md border border-white/20 transition-transform group-hover:scale-105 overflow-hidden">
                <img
                  src={schoolLogo}
                  alt="Star Public School"
                  className="h-full w-full object-contain"
                />
              </div>
              {!isCollapsed && (
                <div className="min-w-0 flex-1 overflow-hidden">
                  <h1 className="text-[15px] font-extrabold text-white leading-tight truncate tracking-tight">
                    Star Public School
                  </h1>
                  <div className="inline-flex items-center gap-1.5 mt-1 px-2 py-0.5 rounded-full bg-blue-900/50 border border-blue-500/30">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                    <span className="text-[9.5px] font-bold uppercase tracking-wider text-blue-200">
                      {isTeacher ? 'Teacher Portal' : 'Admin Console'}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Grouped Feature Navigation with High-Visibility Labels */}
            <div className="space-y-4">
              {visibleGroups.map((group, groupIdx) => (
                <div key={group.id} className="space-y-1.5">
                  {!isCollapsed ? (
                    <div className="flex items-center gap-2 px-2.5 pt-2 pb-0.5">
                      <span className="h-1.5 w-1.5 rounded-full bg-blue-400/80"></span>
                      <p className="text-[11px] font-extrabold uppercase tracking-wider text-blue-200">
                        {group.title}
                      </p>
                      <div className="h-px flex-1 bg-gradient-to-r from-blue-500/25 to-transparent"></div>
                    </div>
                  ) : groupIdx > 0 ? (
                    <div className="my-2.5 border-t border-[#1d3559]" />
                  ) : null}

                  <div className="space-y-1">
                    {group.items.map((item) => {
                      const isActive = currentActive === item.id || currentPath === item.path
                      const { Icon } = item

                      return (
                        <button
                          key={item.id}
                          onClick={() => handleNavigate(item.id, item.path)}
                          className={`group flex w-full items-center rounded-xl text-[13px] font-semibold transition-all duration-150 ${isCollapsed ? 'justify-center p-3' : 'px-3.5 py-2.5 gap-3'
                            } ${isActive
                              ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30 ring-1 ring-blue-400/40 font-bold'
                              : 'text-slate-200 hover:bg-[#162a4a] hover:text-white'
                            }`}
                          title={item.label}
                        >
                          <div
                            className={`shrink-0 transition-transform group-hover:scale-110 ${isActive ? 'text-white' : 'text-blue-300 group-hover:text-amber-300'
                              }`}
                          >
                            <Icon className="w-5 h-5 stroke-[2]" />
                          </div>

                          {!isCollapsed && (
                            <span className="truncate text-left tracking-tight">
                              {item.label}
                            </span>
                          )}
                        </button>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>

          </div>

          {/* Bottom Footer Section: Dynamic User Profile & Controls */}
          <div className="pt-4 border-t border-[#1d3559] space-y-3">
            <div className={`flex items-center gap-3 ${isCollapsed ? 'justify-center' : 'px-2'}`}>
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white font-extrabold text-sm shadow-md">
                {userInitials}
              </div>
              {!isCollapsed && (
                <div className="min-w-0 flex-1">
                  <p className="text-[13px] font-bold text-white truncate leading-tight">
                    {displayName}
                  </p>
                  <p className="text-[11px] font-medium text-blue-300 truncate mt-0.5">
                    {displayRole}
                  </p>
                </div>
              )}
              {!isCollapsed && (
                <button
                  onClick={handleLogout}
                  className="p-2 text-slate-300 hover:text-rose-400 transition-colors rounded-xl hover:bg-[#162a4a]"
                  title="Logout"
                >
                  <span className="material-symbols-outlined text-lg leading-none">logout</span>
                </button>
              )}
            </div>

            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className={`flex w-full items-center text-xs font-semibold text-slate-300 hover:text-white hover:bg-[#162a4a] rounded-lg transition-colors ${isCollapsed ? 'justify-center p-2' : 'px-2.5 py-2 gap-2'
                }`}
            >
              <span className="material-symbols-outlined text-sm">
                {isCollapsed ? 'menu_open' : 'keyboard_double_arrow_left'}
              </span>
              {!isCollapsed && <span>Collapse sidebar</span>}
            </button>
          </div>

        </div>
      </aside>
    </>
  )
}

export default Sidebar
