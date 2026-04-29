import {
  BrowserRouter,
  HashRouter,
  Navigate,
  Route,
  Routes,
} from 'react-router-dom'
import { routerUsesHash } from './config/features'
import { ProgressProvider } from './context/ProgressProvider'
import { Layout } from './components/Layout'
import { DashboardPage } from './pages/DashboardPage'
import { ChallengesPage } from './pages/ChallengesPage'
import { ChallengeDetailPage } from './pages/ChallengeDetailPage'

function appBasename(): string | undefined {
  if (routerUsesHash()) return undefined
  let b = import.meta.env.BASE_URL
  if (b !== '/' && b.endsWith('/')) b = b.slice(0, -1)
  return b === '/' ? undefined : b
}

function AppRoutes() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<DashboardPage />} />
        <Route path="challenges" element={<ChallengesPage />} />
        <Route path="challenges/:id" element={<ChallengeDetailPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  const basename = appBasename()
  return (
    <ProgressProvider>
      {routerUsesHash() ? (
        <HashRouter>
          <AppRoutes />
        </HashRouter>
      ) : (
        <BrowserRouter basename={basename}>
          <AppRoutes />
        </BrowserRouter>
      )}
    </ProgressProvider>
  )
}
