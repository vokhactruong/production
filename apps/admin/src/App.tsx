import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useAuthStore } from "./store/auth.store";
import { PERMISSIONS } from "./constants/permissions";
import { AuthProvider } from "./features/auth/provider/AuthProvider";
import AdminLayout from "./layouts/AdminLayout";
import SplashScreen from "./components/SplashScreen";

const Login = lazy(() => import("./pages/Login"));
const Register = lazy(() => import("./pages/Register"));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const AuthCallback = lazy(() => import("./pages/AuthCallback"));
const NotFound = lazy(() => import("./pages/NotFound"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Users = lazy(() => import("./pages/Users"));
const Roles = lazy(() => import("./pages/Roles"));
const Permissions = lazy(() => import("./pages/Permissions"));
const Categories = lazy(() => import("./pages/Categories"));
const ArticleList = lazy(() => import("./pages/articles/ArticleList"));
const ArticleForm = lazy(() => import("./pages/articles/ArticleForm"));
const ArticlePreview = lazy(() => import("./pages/articles/ArticlePreview"));
const Profile = lazy(() => import("./pages/Profile"));
const Settings = lazy(() => import("./pages/Settings"));
const Students = lazy(() => import("./pages/Students"));
const StudentDetail = lazy(() => import("./pages/students/StudentDetail"));
const StudentForm = lazy(() => import("./pages/students/StudentForm"));
const Subjects = lazy(() => import("./pages/Subjects"));
const SubjectDetail = lazy(() => import("./pages/subjects/SubjectDetail"));
const SubjectForm = lazy(() => import("./pages/subjects/SubjectForm"));
const Courses = lazy(() => import("./pages/Courses"));
const CourseDetail = lazy(() => import("./pages/courses/CourseDetail"));
const CourseForm = lazy(() => import("./pages/courses/CourseForm"));
const Employees = lazy(() => import("./pages/Employees"));
const EmployeeDetail = lazy(() => import("./pages/employees/EmployeeDetail"));
const EmployeeForm = lazy(() => import("./pages/employees/EmployeeForm"));
const EmployeeAccountSetup = lazy(() => import("./pages/employees/EmployeeAccountSetup"));
const Classrooms = lazy(() => import("./pages/Classrooms"));
const ClassroomDetail = lazy(() => import("./pages/classrooms/ClassroomDetail"));
const ClassroomForm = lazy(() => import("./pages/classrooms/ClassroomForm"));
const Classes = lazy(() => import("./pages/Classes"));
const ClassDetail = lazy(() => import("./pages/classes/ClassDetail"));
const ClassForm = lazy(() => import("./pages/classes/ClassForm"));
const Enrollments = lazy(() => import("./pages/Enrollments"));
const EnrollmentDetail = lazy(() => import("./pages/enrollments/EnrollmentDetail"));
const EnrollmentForm = lazy(() => import("./pages/enrollments/EnrollmentForm"));
const ClassSessionForm = lazy(() => import("./pages/class-sessions/ClassSessionForm"));

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function PermissionRoute({
  permission,
  children,
}: {
  permission: string;
  children: React.ReactNode;
}) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const hasPermission = useAuthStore((s) => s.hasPermission);
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (!hasPermission(permission)) return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  if (isAuthenticated) return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Suspense fallback={<SplashScreen />}>
          <Routes>
            {/* Public routes */}
            <Route
              path="/login"
              element={
                <PublicRoute>
                  <Login />
                </PublicRoute>
              }
            />
            <Route
              path="/register"
              element={
                <PublicRoute>
                  <Register />
                </PublicRoute>
              }
            />
            <Route
              path="/forgot-password"
              element={
                <PublicRoute>
                  <ForgotPassword />
                </PublicRoute>
              }
            />
            <Route
              path="/reset-password"
              element={
                <PublicRoute>
                  <ResetPassword />
                </PublicRoute>
              }
            />
            <Route path="/auth/callback" element={<AuthCallback />} />

            {/* Protected routes */}
            <Route
              element={
                <ProtectedRoute>
                  <AdminLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route
                path="/users"
                element={
                  <PermissionRoute permission={PERMISSIONS.USER_READ}>
                    <Users />
                  </PermissionRoute>
                }
              />
              <Route
                path="/roles"
                element={
                  <PermissionRoute permission={PERMISSIONS.ROLE_READ}>
                    <Roles />
                  </PermissionRoute>
                }
              />
              <Route
                path="/permissions"
                element={
                  <PermissionRoute permission={PERMISSIONS.PERMISSION_READ}>
                    <Permissions />
                  </PermissionRoute>
                }
              />
              <Route
                path="/categories"
                element={
                  <PermissionRoute permission={PERMISSIONS.CATEGORY_READ}>
                    <Categories />
                  </PermissionRoute>
                }
              />
              <Route
                path="/articles"
                element={
                  <PermissionRoute permission={PERMISSIONS.ARTICLE_READ}>
                    <ArticleList />
                  </PermissionRoute>
                }
              />
              <Route
                path="/articles/new"
                element={
                  <PermissionRoute permission={PERMISSIONS.ARTICLE_CREATE}>
                    <ArticleForm />
                  </PermissionRoute>
                }
              />
              <Route
                path="/articles/:id/edit"
                element={
                  <PermissionRoute permission={PERMISSIONS.ARTICLE_UPDATE}>
                    <ArticleForm />
                  </PermissionRoute>
                }
              />
              <Route
                path="/articles/:id/preview"
                element={
                  <PermissionRoute permission={PERMISSIONS.ARTICLE_READ}>
                    <ArticlePreview />
                  </PermissionRoute>
                }
              />
              <Route
                path="/students"
                element={
                  <PermissionRoute permission={PERMISSIONS.STUDENT_READ}>
                    <Students />
                  </PermissionRoute>
                }
              />
              <Route
                path="/students/:id"
                element={
                  <PermissionRoute permission={PERMISSIONS.STUDENT_READ}>
                    <StudentDetail />
                  </PermissionRoute>
                }
              />
              <Route
                path="/students/new"
                element={
                  <PermissionRoute permission={PERMISSIONS.STUDENT_CREATE}>
                    <StudentForm />
                  </PermissionRoute>
                }
              />
              <Route
                path="/students/:id/edit"
                element={
                  <PermissionRoute permission={PERMISSIONS.STUDENT_UPDATE}>
                    <StudentForm />
                  </PermissionRoute>
                }
              />
              <Route
                path="/subjects"
                element={
                  <PermissionRoute permission={PERMISSIONS.SUBJECT_READ}>
                    <Subjects />
                  </PermissionRoute>
                }
              />
              <Route
                path="/subjects/new"
                element={
                  <PermissionRoute permission={PERMISSIONS.SUBJECT_CREATE}>
                    <SubjectForm />
                  </PermissionRoute>
                }
              />
              <Route
                path="/subjects/:id"
                element={
                  <PermissionRoute permission={PERMISSIONS.SUBJECT_READ}>
                    <SubjectDetail />
                  </PermissionRoute>
                }
              />
              <Route
                path="/subjects/:id/edit"
                element={
                  <PermissionRoute permission={PERMISSIONS.SUBJECT_UPDATE}>
                    <SubjectForm />
                  </PermissionRoute>
                }
              />
              <Route
                path="/courses"
                element={
                  <PermissionRoute permission={PERMISSIONS.COURSE_READ}>
                    <Courses />
                  </PermissionRoute>
                }
              />
              <Route
                path="/courses/new"
                element={
                  <PermissionRoute permission={PERMISSIONS.COURSE_CREATE}>
                    <CourseForm />
                  </PermissionRoute>
                }
              />
              <Route
                path="/courses/:id"
                element={
                  <PermissionRoute permission={PERMISSIONS.COURSE_READ}>
                    <CourseDetail />
                  </PermissionRoute>
                }
              />
              <Route
                path="/courses/:id/edit"
                element={
                  <PermissionRoute permission={PERMISSIONS.COURSE_UPDATE}>
                    <CourseForm />
                  </PermissionRoute>
                }
              />
              <Route
                path="/employees"
                element={
                  <PermissionRoute permission={PERMISSIONS.EMPLOYEE_READ}>
                    <Employees />
                  </PermissionRoute>
                }
              />
              <Route
                path="/employees/new"
                element={
                  <PermissionRoute permission={PERMISSIONS.EMPLOYEE_CREATE}>
                    <EmployeeForm />
                  </PermissionRoute>
                }
              />
              <Route
                path="/employees/:id"
                element={
                  <PermissionRoute permission={PERMISSIONS.EMPLOYEE_READ}>
                    <EmployeeDetail />
                  </PermissionRoute>
                }
              />
              <Route
                path="/employees/:id/edit"
                element={
                  <PermissionRoute permission={PERMISSIONS.EMPLOYEE_UPDATE}>
                    <EmployeeForm />
                  </PermissionRoute>
                }
              />
              <Route
                path="/employees/:id/setup-account"
                element={
                  <PermissionRoute permission={PERMISSIONS.EMPLOYEE_UPDATE}>
                    <EmployeeAccountSetup />
                  </PermissionRoute>
                }
              />
              <Route
                path="/classrooms"
                element={
                  <PermissionRoute permission={PERMISSIONS.CLASSROOM_READ}>
                    <Classrooms />
                  </PermissionRoute>
                }
              />
              <Route
                path="/classrooms/new"
                element={
                  <PermissionRoute permission={PERMISSIONS.CLASSROOM_CREATE}>
                    <ClassroomForm />
                  </PermissionRoute>
                }
              />
              <Route
                path="/classrooms/:id"
                element={
                  <PermissionRoute permission={PERMISSIONS.CLASSROOM_READ}>
                    <ClassroomDetail />
                  </PermissionRoute>
                }
              />
              <Route
                path="/classrooms/:id/edit"
                element={
                  <PermissionRoute permission={PERMISSIONS.CLASSROOM_UPDATE}>
                    <ClassroomForm />
                  </PermissionRoute>
                }
              />
              <Route
                path="/classes"
                element={
                  <PermissionRoute permission={PERMISSIONS.CLASS_READ}>
                    <Classes />
                  </PermissionRoute>
                }
              />
              <Route
                path="/classes/new"
                element={
                  <PermissionRoute permission={PERMISSIONS.CLASS_CREATE}>
                    <ClassForm />
                  </PermissionRoute>
                }
              />
              <Route
                path="/classes/:id"
                element={
                  <PermissionRoute permission={PERMISSIONS.CLASS_READ}>
                    <ClassDetail />
                  </PermissionRoute>
                }
              />
              <Route
                path="/classes/:id/edit"
                element={
                  <PermissionRoute permission={PERMISSIONS.CLASS_UPDATE}>
                    <ClassForm />
                  </PermissionRoute>
                }
              />
              <Route
                path="/enrollments"
                element={
                  <PermissionRoute permission={PERMISSIONS.ENROLLMENT_READ}>
                    <Enrollments />
                  </PermissionRoute>
                }
              />
              <Route
                path="/enrollments/new"
                element={
                  <PermissionRoute permission={PERMISSIONS.ENROLLMENT_CREATE}>
                    <EnrollmentForm />
                  </PermissionRoute>
                }
              />
              <Route
                path="/enrollments/:id"
                element={
                  <PermissionRoute permission={PERMISSIONS.ENROLLMENT_READ}>
                    <EnrollmentDetail />
                  </PermissionRoute>
                }
              />
              <Route
                path="/enrollments/:id/edit"
                element={
                  <PermissionRoute permission={PERMISSIONS.ENROLLMENT_UPDATE}>
                    <EnrollmentForm />
                  </PermissionRoute>
                }
              />
              <Route
                path="/class-sessions/:id/edit"
                element={
                  <PermissionRoute permission={PERMISSIONS.CLASS_SESSION_UPDATE}>
                    <ClassSessionForm />
                  </PermissionRoute>
                }
              />
              <Route path="/profile" element={<Profile />} />
              <Route path="/settings" element={<Settings />} />
            </Route>

            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </AuthProvider>
    </BrowserRouter>
  );
}
