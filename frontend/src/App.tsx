import { Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout'
import DashboardPage from './pages/DashboardPage'
import AssetsPage from './pages/AssetsPage'
import AssetDetailPage from './pages/AssetDetailPage'
import LicensesPage from './pages/LicensesPage'
import ContractsPage from './pages/ContractsPage'
import ContractTypesPage from './pages/ContractTypesPage'
import ModelsPage from './pages/ModelsPage'
import LocationsPage from './pages/LocationsPage'
import BillingPage from './pages/BillingPage'
import ReportsPage from './pages/ReportsPage'
import ForecastPage from './pages/ForecastPage'
import SyncPage from './pages/SyncPage'
import NetboxPage from './pages/NetboxPage'
import ValidationPage from './pages/ValidationPage'

// Prototype mode - no authentication required
function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="assets" element={<AssetsPage />} />
        <Route path="assets/:id" element={<AssetDetailPage />} />
        <Route path="licenses" element={<LicensesPage />} />
        <Route path="contracts" element={<ContractsPage />} />
        <Route path="contract-types" element={<ContractTypesPage />} />
        <Route path="models" element={<ModelsPage />} />
        <Route path="locations" element={<LocationsPage />} />
        <Route path="billing" element={<BillingPage />} />
        <Route path="reports" element={<ReportsPage />} />
        <Route path="forecast" element={<ForecastPage />} />
        <Route path="sync" element={<SyncPage />} />
        <Route path="netbox" element={<NetboxPage />} />
        <Route path="validation" element={<ValidationPage />} />
      </Route>
    </Routes>
  )
}

export default App
