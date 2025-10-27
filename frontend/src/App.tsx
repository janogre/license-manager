import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './hooks/useAuth'
import Layout from './components/Layout'
import LoginPage from './pages/LoginPage'
import DashboardPage from './pages/DashboardPage'
import AssetsPage from './pages/AssetsPage'
import AssetDetailPage from './pages/AssetDetailPage'
import LicensesPage from './pages/LicensesPage'
import ContractsPage from './pages/ContractsPage'
import ModelsPage from './pages/ModelsPage'
import ReportsPage from './pages/ReportsPage'
import SyncPage from './pages/SyncPage'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth()

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}

function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="assets" element={<AssetsPage />} />
        <Route path="assets/:id" element={<AssetDetailPage />} />
        <Route path="licenses" element={<LicensesPage />} />
        <Route path="contracts" element={<ContractsPage />} />
        <Route path="models" element={<ModelsPage />} />
        <Route path="reports" element={<ReportsPage />} />
        <Route path="sync" element={<SyncPage />} />
      </Route>
    </Routes>
  )
}

export default App
