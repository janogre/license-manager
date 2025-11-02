import { Outlet, Link, useLocation } from 'react-router-dom'
import {
  LayoutDashboard,
  HardDrive,
  Key,
  FileText,
  Box,
  BarChart3,
  RefreshCw,
  MapPin,
  User,
  Menu,
  X,
  CreditCard,
  Settings,
  ChevronDown,
  ChevronRight,
  TrendingUp,
  CheckCircle2,
} from 'lucide-react'
import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import LanguageSelector from './ui/LanguageSelector'

export default function Layout() {
  const location = useLocation()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [adminExpanded, setAdminExpanded] = useState(false)
  const [financeExpanded, setFinanceExpanded] = useState(false)
  const [integrationsExpanded, setIntegrationsExpanded] = useState(false)
  const { t } = useTranslation()

  const navigation = [
    { name: t('navigation.dashboard'), href: '/dashboard', icon: LayoutDashboard },
    { name: t('navigation.assets'), href: '/assets', icon: HardDrive },
    { name: t('navigation.licenses'), href: '/licenses', icon: Key },
    { name: t('navigation.contracts'), href: '/contracts', icon: FileText },
    { name: t('navigation.reports'), href: '/reports', icon: BarChart3 },
  ]

  const financeItems = [
    { name: 'Billing', href: '/billing', icon: CreditCard },
    { name: 'Forecast', href: '/forecast', icon: TrendingUp },
  ]

  const integrationsItems = [
    { name: t('navigation.netbox'), href: '/netbox', icon: MapPin },
    { name: 'Observium', href: '/sync', icon: RefreshCw },
    { name: 'Validation', href: '/validation', icon: CheckCircle2 },
  ]

  const adminItems = [
    { name: 'Contract Types', href: '/contract-types', icon: Settings },
    { name: t('navigation.models'), href: '/models', icon: Box },
    { name: 'Locations', href: '/locations', icon: MapPin },
  ]

  // Check if any section item is currently active
  const isAdminActive = adminItems.some(item => location.pathname === item.href)
  const isFinanceActive = financeItems.some(item => location.pathname === item.href)
  const isIntegrationsActive = integrationsItems.some(item => location.pathname === item.href)

  // Auto-expand menus if user is on a page within them
  useEffect(() => {
    if (isAdminActive) {
      setAdminExpanded(true)
    }
    if (isFinanceActive) {
      setFinanceExpanded(true)
    }
    if (isIntegrationsActive) {
      setIntegrationsExpanded(true)
    }
  }, [isAdminActive, isFinanceActive, isIntegrationsActive])

  // Prototype mode - mock user
  const user = { firstName: 'Demo', lastName: 'User', role: 'ADMIN' }

  return (
    <div className="min-h-screen bg-gradient-to-br from-neas-light-grey via-white to-neas-light-grey">
      {/* Mobile sidebar */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setSidebarOpen(false)} />
          <div className="fixed inset-y-0 left-0 flex w-64 flex-col bg-white">
            <div className="flex items-center justify-between px-4 py-4 border-b">
              <div className="flex items-center gap-2">
                <span className="text-xl font-bold text-primary-600">NEAS</span>
                <span className="text-sm text-gray-600">License Manager</span>
              </div>
              <button onClick={() => setSidebarOpen(false)} className="text-gray-500 hover:text-gray-700">
                <X className="h-6 w-6" />
              </button>
            </div>
            <nav className="flex-1 space-y-1 px-2 py-4">
              {navigation.map((item) => {
                const Icon = item.icon
                const isActive = location.pathname === item.href
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    onClick={() => setSidebarOpen(false)}
                    className={`flex items-center px-3 py-2 text-sm font-medium rounded-md ${
                      isActive
                        ? 'bg-primary-50 text-primary-600'
                        : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                  >
                    <Icon className="mr-3 h-5 w-5" />
                    {item.name}
                  </Link>
                )
              })}

              {/* Finance Section */}
              <div className="space-y-1">
                <button
                  onClick={() => setFinanceExpanded(!financeExpanded)}
                  className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md ${
                    isFinanceActive
                      ? 'bg-primary-50 text-primary-600'
                      : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <CreditCard className="mr-3 h-5 w-5" />
                  Finance
                  {financeExpanded ? (
                    <ChevronDown className="ml-auto h-4 w-4" />
                  ) : (
                    <ChevronRight className="ml-auto h-4 w-4" />
                  )}
                </button>

                {financeExpanded && (
                  <div className="pl-6 space-y-1">
                    {financeItems.map((item) => {
                      const Icon = item.icon
                      const isActive = location.pathname === item.href
                      return (
                        <Link
                          key={item.name}
                          to={item.href}
                          onClick={() => setSidebarOpen(false)}
                          className={`flex items-center px-3 py-2 text-sm font-medium rounded-md ${
                            isActive
                              ? 'bg-primary-50 text-primary-600'
                              : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                          }`}
                        >
                          <Icon className="mr-3 h-4 w-4" />
                          {item.name}
                        </Link>
                      )
                    })}
                  </div>
                )}
              </div>

              {/* Integrations Section */}
              <div className="space-y-1">
                <button
                  onClick={() => setIntegrationsExpanded(!integrationsExpanded)}
                  className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md ${
                    isIntegrationsActive
                      ? 'bg-primary-50 text-primary-600'
                      : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <RefreshCw className="mr-3 h-5 w-5" />
                  Integrations
                  {integrationsExpanded ? (
                    <ChevronDown className="ml-auto h-4 w-4" />
                  ) : (
                    <ChevronRight className="ml-auto h-4 w-4" />
                  )}
                </button>

                {integrationsExpanded && (
                  <div className="pl-6 space-y-1">
                    {integrationsItems.map((item) => {
                      const Icon = item.icon
                      const isActive = location.pathname === item.href
                      return (
                        <Link
                          key={item.name}
                          to={item.href}
                          onClick={() => setSidebarOpen(false)}
                          className={`flex items-center px-3 py-2 text-sm font-medium rounded-md ${
                            isActive
                              ? 'bg-primary-50 text-primary-600'
                              : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                          }`}
                        >
                          <Icon className="mr-3 h-4 w-4" />
                          {item.name}
                        </Link>
                      )
                    })}
                  </div>
                )}
              </div>

              {/* Admin Section */}
              <div className="space-y-1">
                <button
                  onClick={() => setAdminExpanded(!adminExpanded)}
                  className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md ${
                    isAdminActive
                      ? 'bg-primary-50 text-primary-600'
                      : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <Settings className="mr-3 h-5 w-5" />
                  Admin
                  {adminExpanded ? (
                    <ChevronDown className="ml-auto h-4 w-4" />
                  ) : (
                    <ChevronRight className="ml-auto h-4 w-4" />
                  )}
                </button>

                {adminExpanded && (
                  <div className="pl-6 space-y-1">
                    {adminItems.map((item) => {
                      const Icon = item.icon
                      const isActive = location.pathname === item.href
                      return (
                        <Link
                          key={item.name}
                          to={item.href}
                          onClick={() => setSidebarOpen(false)}
                          className={`flex items-center px-3 py-2 text-sm font-medium rounded-md ${
                            isActive
                              ? 'bg-primary-50 text-primary-600'
                              : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                          }`}
                        >
                          <Icon className="mr-3 h-4 w-4" />
                          {item.name}
                        </Link>
                      )
                    })}
                  </div>
                )}
              </div>
            </nav>
          </div>
        </div>
      )}

      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
        <div className="flex flex-col flex-grow bg-gradient-to-b from-primary-700 to-primary-900 text-white shadow-xl">
          <div className="flex items-center px-4 py-6">
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold text-neas-sunlight">NEAS</span>
              <span className="text-sm text-neas-light-grey">License Manager</span>
            </div>
          </div>
          <nav className="flex-1 space-y-1 px-2 py-4">
            {navigation.map((item) => {
              const Icon = item.icon
              const isActive = location.pathname === item.href
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-all ${
                    isActive
                      ? 'bg-neas-moss text-primary-900 shadow-md'
                      : 'text-white hover:bg-primary-600 hover:shadow-sm'
                  }`}
                >
                  <Icon className="mr-3 h-5 w-5" />
                  {item.name}
                </Link>
              )
            })}

            {/* Finance Section */}
            <div className="space-y-1 pt-2">
              <button
                onClick={() => setFinanceExpanded(!financeExpanded)}
                className={`w-full flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-all ${
                  isFinanceActive
                    ? 'bg-neas-moss text-primary-900 shadow-md'
                    : 'text-white hover:bg-primary-600 hover:shadow-sm'
                }`}
              >
                <CreditCard className="mr-3 h-5 w-5" />
                Finance
                {financeExpanded ? (
                  <ChevronDown className="ml-auto h-4 w-4" />
                ) : (
                  <ChevronRight className="ml-auto h-4 w-4" />
                )}
              </button>

              {financeExpanded && (
                <div className="pl-6 space-y-1">
                  {financeItems.map((item) => {
                    const Icon = item.icon
                    const isActive = location.pathname === item.href
                    return (
                      <Link
                        key={item.name}
                        to={item.href}
                        className={`flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-all ${
                          isActive
                            ? 'bg-neas-sunlight text-primary-900 shadow-sm'
                            : 'text-neas-light-grey hover:bg-primary-600 hover:text-white'
                        }`}
                      >
                        <Icon className="mr-3 h-4 w-4" />
                        {item.name}
                      </Link>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Integrations Section */}
            <div className="space-y-1">
              <button
                onClick={() => setIntegrationsExpanded(!integrationsExpanded)}
                className={`w-full flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-all ${
                  isIntegrationsActive
                    ? 'bg-neas-moss text-primary-900 shadow-md'
                    : 'text-white hover:bg-primary-600 hover:shadow-sm'
                }`}
              >
                <RefreshCw className="mr-3 h-5 w-5" />
                Integrations
                {integrationsExpanded ? (
                  <ChevronDown className="ml-auto h-4 w-4" />
                ) : (
                  <ChevronRight className="ml-auto h-4 w-4" />
                )}
              </button>

              {integrationsExpanded && (
                <div className="pl-6 space-y-1">
                  {integrationsItems.map((item) => {
                    const Icon = item.icon
                    const isActive = location.pathname === item.href
                    return (
                      <Link
                        key={item.name}
                        to={item.href}
                        className={`flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-all ${
                          isActive
                            ? 'bg-neas-sunlight text-primary-900 shadow-sm'
                            : 'text-neas-light-grey hover:bg-primary-600 hover:text-white'
                        }`}
                      >
                        <Icon className="mr-3 h-4 w-4" />
                        {item.name}
                      </Link>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Admin Section */}
            <div className="space-y-1">
              <button
                onClick={() => setAdminExpanded(!adminExpanded)}
                className={`w-full flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-all ${
                  isAdminActive
                    ? 'bg-neas-moss text-primary-900 shadow-md'
                    : 'text-white hover:bg-primary-600 hover:shadow-sm'
                }`}
              >
                <Settings className="mr-3 h-5 w-5" />
                Admin
                {adminExpanded ? (
                  <ChevronDown className="ml-auto h-4 w-4" />
                ) : (
                  <ChevronRight className="ml-auto h-4 w-4" />
                )}
              </button>

              {adminExpanded && (
                <div className="pl-6 space-y-1">
                  {adminItems.map((item) => {
                    const Icon = item.icon
                    const isActive = location.pathname === item.href
                    return (
                      <Link
                        key={item.name}
                        to={item.href}
                        className={`flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-all ${
                          isActive
                            ? 'bg-neas-sunlight text-primary-900 shadow-sm'
                            : 'text-neas-light-grey hover:bg-primary-600 hover:text-white'
                        }`}
                      >
                        <Icon className="mr-3 h-4 w-4" />
                        {item.name}
                      </Link>
                    )
                  })}
                </div>
              )}
            </div>
          </nav>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Top bar */}
        <div className="sticky top-0 z-10 flex h-16 shrink-0 items-center gap-x-4 border-b border-neas-light-grey bg-white/95 backdrop-blur-sm px-4 shadow-md sm:gap-x-6 sm:px-6 lg:px-8">
          <button
            type="button"
            className="-m-2.5 p-2.5 text-gray-700 lg:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-6 w-6" />
          </button>

          <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
            <div className="flex flex-1" />
            <div className="flex items-center gap-x-4 lg:gap-x-6">
              <LanguageSelector />
              <div className="flex items-center gap-2">
                <User className="h-5 w-5 text-gray-500" />
                <div className="hidden lg:block text-sm">
                  <div className="font-medium text-gray-900">
                    {user.firstName} {user.lastName}
                  </div>
                  <div className="text-gray-500">{user.role}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="py-6">
          <div className="px-4 sm:px-6 lg:px-8">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}
