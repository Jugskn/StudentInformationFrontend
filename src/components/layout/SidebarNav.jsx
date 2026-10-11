import { NavLink } from 'react-router-dom'
import {
  BookMarked,
  BookOpen,
  CalendarRange,
  ClipboardList,
  GraduationCap,
  LayoutDashboard,
  ScrollText,
  User,
  UserCircle,
  Users,
} from 'lucide-react'
import { isStaff } from '../../utils/roles'

export function getNavGroups(roles = []) {
  const student = roles.includes('Student')
  const staff = isStaff(roles)
  const instructor = roles.includes('Instructor')

  if (student && !staff && !instructor) {
    return [
      {
        id: 'main',
        label: 'Main',
        items: [{ to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard }],
      },
      {
        id: 'my-records',
        label: 'My Records',
        items: [
          { to: '/my-profile', label: 'My Profile', icon: User },
          { to: '/my-enrollments', label: 'My Enrollments', icon: BookOpen },
          { to: '/my-grades', label: 'My Grades', icon: ClipboardList },
          { to: '/my-academic-record', label: 'My Academic Record', icon: ScrollText },
        ],
      },
      {
        id: 'account',
        label: 'Account',
        items: [{ to: '/account', label: 'My Account', icon: UserCircle }],
      },
    ]
  }

  if (staff) {
    return [
      {
        id: 'main',
        label: 'Main',
        items: [{ to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard }],
      },
      {
        id: 'academic-setup',
        label: 'Academic Setup',
        items: [
          { to: '/programs', label: 'Programs', icon: GraduationCap },
          { to: '/courses', label: 'Courses', icon: BookOpen },
          { to: '/terms', label: 'Academic Terms', icon: CalendarRange },
          { to: '/course-offerings', label: 'Course Offerings', icon: BookMarked },
        ],
      },
      {
        id: 'student-management',
        label: 'Student Management',
        items: [
          { to: '/students', label: 'Students', icon: Users },
          { to: '/enrollment', label: 'Enrollment', icon: ClipboardList },
          { to: '/grades', label: 'Grades', icon: ScrollText },
          { to: '/academic-records', label: 'Academic Records', icon: GraduationCap },
        ],
      },
      {
        id: 'account',
        label: 'Account',
        items: [{ to: '/account', label: 'My Account', icon: UserCircle }],
      },
    ]
  }

  if (instructor) {
    return [
      {
        id: 'main',
        label: 'Main',
        items: [{ to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard }],
      },
      {
        id: 'academic',
        label: 'Academic',
        items: [
          { to: '/programs', label: 'Programs', icon: GraduationCap },
          { to: '/courses', label: 'Courses', icon: BookOpen },
          { to: '/terms', label: 'Academic Terms', icon: CalendarRange },
          { to: '/course-offerings', label: 'Course Offerings', icon: BookMarked },
        ],
      },
      {
        id: 'classes',
        label: 'Classes',
        items: [
          { to: '/enrollment', label: 'Enrollment', icon: ClipboardList },
          { to: '/grades', label: 'Grades', icon: ScrollText },
          { to: '/academic-records', label: 'Academic Records', icon: GraduationCap },
        ],
      },
      {
        id: 'account',
        label: 'Account',
        items: [{ to: '/account', label: 'My Account', icon: UserCircle }],
      },
    ]
  }

  return [
    {
      id: 'main',
      label: 'Main',
      items: [{ to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard }],
    },
    {
      id: 'account',
      label: 'Account',
      items: [{ to: '/account', label: 'My Account', icon: UserCircle }],
    },
  ]
}

export function getNavItems(roles = []) {
  return getNavGroups(roles).flatMap((group) => group.items)
}

export function getPageTitle(pathname) {
  const titles = {
    '/dashboard': 'Dashboard',
    '/account': 'My Account',
    '/my-profile': 'My Profile',
    '/my-enrollments': 'My Enrollments',
    '/my-grades': 'My Grades',
    '/my-academic-record': 'My Academic Record',
    '/students': 'Students',
    '/programs': 'Programs',
    '/courses': 'Courses',
    '/terms': 'Academic Terms',
    '/course-offerings': 'Course Offerings',
    '/enrollment': 'Enrollment',
    '/grades': 'Grades',
    '/academic-records': 'Academic Records',
    '/access-denied': 'Access Denied',
  }

  if (titles[pathname]) return titles[pathname]

  const match = Object.keys(titles).find(
    (path) => path !== '/' && pathname.startsWith(`${path}/`),
  )
  return match ? titles[match] : 'SIM'
}

export function SidebarNav({ roles, onNavigate }) {
  const groups = getNavGroups(roles)

  return (
    <nav className="flex flex-col gap-5 p-3" aria-label="Main">
      {groups.map((group) => (
        <div key={group.id}>
          <p className="mb-1.5 px-3 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
            {group.label}
          </p>
          <div className="flex flex-col gap-0.5">
            {group.items.map((item) => {
              const Icon = item.icon
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={onNavigate}
                  className={({ isActive }) =>
                    `flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium transition ${
                      isActive
                        ? 'bg-brand-800 text-white'
                        : 'text-slate-700 hover:bg-brand-50 hover:text-brand-900'
                    }`
                  }
                >
                  {Icon ? <Icon className="h-4 w-4 shrink-0 opacity-90" aria-hidden /> : null}
                  <span>{item.label}</span>
                </NavLink>
              )
            })}
          </div>
        </div>
      ))}
    </nav>
  )
}
