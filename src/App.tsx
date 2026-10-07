import { lazy, Suspense } from 'react'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { Toaster } from 'sonner'
import { RequireAuth } from '@/components/auth/require-auth'
import { RedirectByRole } from '@/components/auth/redirect-by-role'
import { AdminShell } from '@/components/admin/admin-shell'

// Code-splitting: cada ruta se carga bajo demanda. Así /login no paga el
// bundle de admin, GSAP, drag & drop ni el resto de pantallas.
const LoginPage = lazy(() => import('@/routes/login'))
const AdminDashboard = lazy(() => import('@/routes/admin-dashboard'))
const AdminMatchesList = lazy(() => import('@/routes/admin-matches-list'))
const AdminMatchNew = lazy(() => import('@/routes/admin-match-new'))
const AdminMatchDetail = lazy(() => import('@/routes/admin-match-detail'))
const AdminUsersList = lazy(() => import('@/routes/admin-users-list'))
const PartidoActivo = lazy(() => import('@/routes/partido-activo'))
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
          <Route path="/login" element={<LoginPage />} />

          <Route element={<RequireAuth roles={['admin', 'supervisor']} />}>
            <Route path="/admin" element={<AdminShell />}>
              <Route index element={<AdminDashboard />} />
              <Route path="partidos" element={<AdminMatchesList />} />
              <Route path="partidos/nuevo" element={<AdminMatchNew />} />
              <Route path="partidos/:id" element={<AdminMatchDetail />} />
              <Route path="usuarios" element={<AdminUsersList />} />
            </Route>
          </Route>

          <Route element={<RequireAuth />}>
            <Route path="/partido-activo" element={<PartidoActivo />} />
            <Route path="/perfil" element={<PerfilPage />} />
          </Route>

          <Route path="*" element={<RedirectByRole />} />
        </Routes>
      </Suspense>
      <Toaster position="top-center" richColors closeButton />
    </BrowserRouter>
  )
}

export default App
