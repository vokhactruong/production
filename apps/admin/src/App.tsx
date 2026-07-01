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
