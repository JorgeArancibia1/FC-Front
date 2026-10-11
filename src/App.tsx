import { lazy, Suspense } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { Toaster } from 'sonner'
import { RequireAuth } from '@/components/auth/require-auth'
import { RedirectByRole } from '@/components/auth/redirect-by-role'
import { AdminShell } from '@/components/admin/admin-shell'
import { UserShell } from '@/components/user/user-shell'

// Code-splitting: cada ruta se carga bajo demanda. Así /login no paga el
// bundle de admin, el drag & drop ni el resto de pantallas.
const LoginPage = lazy(() => import('@/routes/login'))
const RegisterPage = lazy(() => import('@/routes/register'))
const ForgotPasswordPage = lazy(() => import('@/routes/forgot-password'))
const ResetPasswordPage = lazy(() => import('@/routes/reset-password'))
const RecoverEmailPage = lazy(() => import('@/routes/recover-email'))
const JoinByCodePage = lazy(() => import('@/routes/join'))
const InvitePage = lazy(() => import('@/routes/invite'))

const UserHome = lazy(() => import('@/routes/user-home'))
const UserMatches = lazy(() => import('@/routes/user-matches'))
const UserMatchDetail = lazy(() => import('@/routes/user-match-detail'))

const AdminDashboard = lazy(() => import('@/routes/admin-dashboard'))
const AdminMatchesList = lazy(() => import('@/routes/admin-matches-list'))
const AdminMatchNew = lazy(() => import('@/routes/admin-match-new'))
const AdminMatchDetail = lazy(() => import('@/routes/admin-match-detail'))
const AdminMatchEdit = lazy(() => import('@/routes/admin-match-edit'))
const AdminUsersList = lazy(() => import('@/routes/admin-users-list'))
const DevSystemPage = lazy(() => import('@/routes/dev-system'))
const PerfilPage = lazy(() => import('@/routes/perfil'))

function RouteFallback() {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-background">
      <div
        className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent"
        role="status"
        aria-label="Cargando"
      />
    </div>
  )
}

function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<RouteFallback />}>
        <Routes>
          <Route path="/" element={<RedirectByRole />} />

          {/* Públicas */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/registro" element={<RegisterPage />} />
          <Route path="/recuperar" element={<ForgotPasswordPage />} />
          <Route path="/restablecer/:token" element={<ResetPasswordPage />} />
          <Route path="/recuperar-correo" element={<RecoverEmailPage />} />
          <Route path="/unirse" element={<JoinByCodePage />} />
          <Route path="/invitacion/:token" element={<InvitePage />} />

          {/* Área de jugador (cualquier sesión autenticada) */}
          <Route element={<RequireAuth />}>
            <Route element={<UserShell />}>
              <Route path="/inicio" element={<UserHome />} />
              <Route path="/partidos" element={<UserMatches />} />
              <Route path="/partidos/:id" element={<UserMatchDetail />} />
            </Route>
          </Route>

          {/* Perfil (cualquier sesión) */}
          <Route element={<RequireAuth />}>
            <Route path="/perfil" element={<PerfilPage />} />
          </Route>

          {/* Panel administrativo (Admin + Developer) */}
          <Route element={<RequireAuth roles={['admin', 'developer']} />}>
            <Route path="/admin" element={<AdminShell />}>
              <Route index element={<AdminDashboard />} />
              <Route path="partidos" element={<AdminMatchesList />} />
              <Route path="partidos/nuevo" element={<AdminMatchNew />} />
              <Route path="partidos/:id" element={<AdminMatchDetail />} />
              <Route path="partidos/:id/editar" element={<AdminMatchEdit />} />
              <Route path="usuarios" element={<AdminUsersList />} />

              {/* Panel de desarrollador (solo rol developer) */}
              <Route element={<RequireAuth roles={['developer']} />}>
                <Route path="sistema" element={<DevSystemPage />} />
              </Route>
            </Route>
          </Route>

          {/* Compatibilidad con la antigua vista del partido */}
          <Route path="/partido-activo" element={<Navigate to="/inicio" replace />} />

          <Route path="*" element={<RedirectByRole />} />
        </Routes>
      </Suspense>
      <Toaster position="top-center" richColors closeButton />
    </BrowserRouter>
  )
}

export default App
