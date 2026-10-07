import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { polyfill as touchDndPolyfill } from 'mobile-drag-drop'
import { scrollBehaviourDragImageTranslateOverride } from 'mobile-drag-drop/scroll-behaviour'
import { isAxiosError } from 'axios'
import { registerSW } from 'virtual:pwa-register'
import { toast } from 'sonner'
import 'mobile-drag-drop/default.css'
import './index.css'
import App from './App.tsx'

// Pragmatic DnD usa HTML5 Drag and Drop nativo, que en touch devices (iOS/Android)
// no dispara dragstart/dragover/drop — solo touchstart/move/end. Este polyfill
// sintetiza los eventos HTML5 a partir de touch para que el reorder del board
// funcione en mobile. holdToDrag=300ms evita que un scroll accidental dispare un
// drag; scrollBehaviourDragImageTranslateOverride permite auto-scroll mientras se
// arrastra cerca del borde de la pantalla.
touchDndPolyfill({
  holdToDrag: 300,
  dragImageTranslateOverride: scrollBehaviourDragImageTranslateOverride,
})

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Con `retry: 1` TanStack reintenta cualquier error, incluidos los 4xx
      // (401/404/409…) que no se van a resolver solos: solo demoran la UI y
      // suman llamadas — en un 401, además, disparan un refresh de token por
      // cada reintento. Solo reintentamos errores transitorios:
      //   - 5xx (el servidor falló y puede levantarse), o
      //   - ausencia de `response` → error de red (offline, timeout, DNS).
      // Máximo 2 reintentos (failureCount arranca en 0 en el retryer).
      retry: (failureCount, error) => {
        if (failureCount >= 2) return false
        // Type guard tipado: isAxiosError narrowing a AxiosError, que expone
        // `response?.status` sin castear `unknown`.
        if (isAxiosError(error)) {
          const status = error.response?.status
          return status === undefined || status >= 500
        }
        // Errores ajenos a axios (sin `response`): se tratan como de red.
        return true
      },
      staleTime: 30_000,
    },
  },
})

// Registro manual del SW (injectRegister: false en vite.config.ts). Con
// registerType: 'prompt' el SW nuevo queda en "waiting" y avisamos con un toast
// para que el usuario decida cuándo recargar (así no se pierde lo que esté
// escribiendo). El toast usa el <Toaster> que monta App.tsx; onNeedRefresh se
// dispara recién cuando hay una actualización esperando, siempre después del
// primer render. Al aceptar, updateSW() manda SKIP_WAITING al SW en espera; una
// vez activo (clientsClaim) toma el control y workbox-window recarga solo.
const updateSW = registerSW({
  onNeedRefresh() {
    toast('Hay una nueva versión de la app', {
      action: {
        label: 'Recargar',
        onClick: () => {
          void updateSW()
        },
      },
    })
  },
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </StrictMode>,
)
