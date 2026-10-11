import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { ToastProvider } from './context/ToastContext'
import { AppLayout } from './layouts/AppLayout'
import { LoginPage } from './pages/auth/LoginPage'
import { DashboardPage } from './pages/dashboard/DashboardPage'
import { StudentsPage } from './pages/students/StudentsPage'
import { ProgramsPage } from './pages/programs/ProgramsPage'
import { CoursesPage } from './pages/courses/CoursesPage'
import { TermsPage } from './pages/terms/TermsPage'
import { OfferingsPage } from './pages/offerings/OfferingsPage'
import { EnrollmentPage } from './pages/enrollment/EnrollmentPage'
import { GradesPage } from './pages/grades/GradesPage'
import { AcademicRecordsPage } from './pages/academic-records/AcademicRecordsPage'
import { AccountPage } from './pages/account/AccountPage'
import { MyProfilePage } from './pages/student/MyProfilePage'
import { MyEnrollmentsPage } from './pages/student/MyEnrollmentsPage'
import { MyGradesPage } from './pages/student/MyGradesPage'
import { MyAcademicRecordPage } from './pages/student/MyAcademicRecordPage'
import { AccessDeniedPage } from './pages/system/AccessDeniedPage'
import { NotFoundPage } from './pages/system/NotFoundPage'
import { ProtectedRoute } from './routes/ProtectedRoute'
import { GuestRoute, RoleRoute } from './routes/RoleRoute'
import {
  canViewAcademicRecords,
  canViewCatalog,
  canViewEnrollments,
  canViewGrades,
  canViewOfferings,
  isStaff,
} from './utils/roles'

function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <BrowserRouter>
          <Routes>
            <Route element={<GuestRoute />}>
              <Route path="/login" element={<LoginPage />} />
            </Route>

            <Route element={<ProtectedRoute />}>
              <Route element={<AppLayout />}>
                <Route index element={<Navigate to="/dashboard" replace />} />
                <Route path="/dashboard" element={<DashboardPage />} />
                <Route path="/account" element={<AccountPage />} />

                <Route element={<RoleRoute allow={(roles) => roles.includes('Student')} />}>
                  <Route path="/my-profile" element={<MyProfilePage />} />
                  <Route path="/my-enrollments" element={<MyEnrollmentsPage />} />
                  <Route path="/my-grades" element={<MyGradesPage />} />
                  <Route path="/my-academic-record" element={<MyAcademicRecordPage />} />
                </Route>

                <Route
                  element={
                    <RoleRoute
                      allow={(roles) => isStaff(roles) || roles.includes('Instructor')}
                    />
                  }
                >
                  <Route path="/students" element={<StudentsPage />} />
                </Route>

                <Route element={<RoleRoute allow={canViewCatalog} />}>
                  <Route path="/programs" element={<ProgramsPage />} />
                  <Route path="/courses" element={<CoursesPage />} />
                  <Route path="/terms" element={<TermsPage />} />
                </Route>

                <Route element={<RoleRoute allow={canViewOfferings} />}>
                  <Route path="/course-offerings" element={<OfferingsPage />} />
                </Route>

                <Route element={<RoleRoute allow={canViewEnrollments} />}>
                  <Route path="/enrollment" element={<EnrollmentPage />} />
                </Route>

                <Route element={<RoleRoute allow={canViewGrades} />}>
                  <Route path="/grades" element={<GradesPage />} />
                </Route>

                <Route element={<RoleRoute allow={canViewAcademicRecords} />}>
                  <Route path="/academic-records" element={<AcademicRecordsPage />} />
                </Route>

                <Route path="/access-denied" element={<AccessDeniedPage />} />
              </Route>
            </Route>

            <Route path="/404" element={<NotFoundPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </BrowserRouter>
      </ToastProvider>
    </AuthProvider>
  )
}

export default App
