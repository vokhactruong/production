import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useAuthStore } from "./store/auth.store";
import { PERMISSIONS } from "./constants/permissions";
import { AuthProvider } from "./features/auth/provider/AuthProvider";
import AdminLayout from "./layouts/AdminLayout";

import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import AuthCallback from "./pages/AuthCallback";
import NotFound from "./pages/NotFound";
import Dashboard from "./pages/Dashboard";
import Users from "./pages/Users";
import Roles from "./pages/Roles";
import Permissions from "./pages/Permissions";
import Categories from "./pages/Categories";
import ArticleList from "./pages/articles/ArticleList";
import ArticleForm from "./pages/articles/ArticleForm";
import ArticlePreview from "./pages/articles/ArticlePreview";
import Profile from "./pages/Profile";
import Settings from "./pages/Settings";
import Students from "./pages/Students";
import StudentDetail from "./pages/students/StudentDetail";
import StudentForm from "./pages/students/StudentForm";

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore();
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
  const { isAuthenticated, hasPermission } = useAuthStore();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (!hasPermission(permission)) return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore();
  if (isAuthenticated) return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
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
            <Route path="/profile" element={<Profile />} />
            <Route path="/settings" element={<Settings />} />
          </Route>

          <Route path="*" element={<NotFound />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
