import React, { useState, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Plus, FileText, Calendar, DollarSign, AlertTriangle, Loader2, Edit, Trash2, ChevronDown, ChevronRight, X } from 'lucide-react'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Card } from '@/components/ui/Card'
import { Modal } from '@/components/ui/Modal'
import { Select } from '@/components/ui/Form'
import { useContracts, useCreateContract, useUpdateContract, useDeleteContract } from '@/hooks/useContracts'
import { api } from '@/api/client'
import ContractForm from '@/components/ContractForm'
import { format, differenceInDays } from 'date-fns'
import type { MaintenanceContract } from '@/types'

export default function ContractsPage() {
  const [searchParams] = useSearchParams()
  const urlStatus = searchParams.get('status')
  const urlFilter = searchParams.get('filter')
  const urlSearch = searchParams.get('search')

  const [showAddModal, setShowAddModal] = useState(false)
  const [editingContract, setEditingContract] = useState<MaintenanceContract | null>(null)
  const [deletingContract, setDeletingContract] = useState<MaintenanceContract | null>(null)
  const [statusFilter, setStatusFilter] = useState('all')
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'HARDWARE' | 'LICENSE'>('all')
  const [selectedContract, setSelectedContract] = useState<MaintenanceContract | null>(null)
  const [expandedContracts, setExpandedContracts] = useState<Set<string>>(new Set())

  // Fetch contracts from API
  const { data, isLoading, error } = useContracts({ limit: 1000 })

  // Mutations
  const createContract = useCreateContract()
  const updateContract = useUpdateContract()
  const deleteContract = useDeleteContract()

  const handleCreateContract = async (formData: Partial<MaintenanceContract>) => {
    try {
      await createContract.mutateAsync(formData)
      setShowAddModal(false)
    } catch (err) {
      console.error('Failed to create contract:', err)
    }
  }

  const handleUpdateContract = async (formData: Partial<MaintenanceContract>) => {
    if (!editingContract) return
    try {
      await updateContract.mutateAsync({ id: editingContract.id, ...formData })
      setEditingContract(null)
    } catch (err) {
      console.error('Failed to update contract:', err)
    }
  }

  const handleDeleteContract = async () => {
    if (!deletingContract) return
    try {
      await deleteContract.mutateAsync(deletingContract.id)
      setDeletingContract(null)
    } catch (err) {
      console.error('Failed to delete contract:', err)
    }
  }

  const handleRemoveAsset = async (contractId: string, assetId: string) => {
    if (!confirm('Are you sure you want to remove this asset from the contract?')) return
    try {
      await api.delete(`/contracts/${contractId}/unassign/${assetId}`)
      // Refetch contracts to update UI
      window.location.reload()
    } catch (err) {
      console.error('Failed to remove asset:', err)
      alert('Failed to remove asset from contract')
    }
  }

  const handleRemoveLicense = async (contractId: string, licenseId: string) => {
    if (!confirm('Are you sure you want to remove this license from the contract?')) return
    try {
      await api.delete(`/contracts/${contractId}/unassign-license/${licenseId}`)
      // Refetch contracts to update UI
      window.location.reload()
    } catch (err) {
      console.error('Failed to remove license:', err)
      alert('Failed to remove license from contract')
    }
  }

  const contracts = data?.contracts || []

  const activeContracts = useMemo(() => contracts.filter((c) => c.isActive), [contracts])

  const expiringContracts = useMemo(() => {
    return activeContracts.filter((c) => {
      const daysUntilExpiry = differenceInDays(new Date(c.endDate), new Date())
      return daysUntilExpiry > 0 && daysUntilExpiry <= 90
    })
  }, [activeContracts])

  const stats = useMemo(() => {
    const totalAnnualCost = activeContracts.reduce((sum, c) => {
      const cost = typeof c.annualCost === 'string' ? parseFloat(c.annualCost) : (c.annualCost || 0)
      return sum + cost
    }, 0)

    return {
      total: contracts.length,
      active: activeContracts.length,
      expiring: expiringContracts.length,
      totalCost: totalAnnualCost,
    }
  }, [contracts, activeContracts, expiringContracts])

  // Data for pie chart - group by contract number and sum costs
  const pieChartData = useMemo(() => {
    const contractCosts = activeContracts.map(c => ({
      name: c.contractNumber,
      value: typeof c.annualCost === 'string' ? parseFloat(c.annualCost) : (c.annualCost || 0),
      type: c.contractType,
      assetCount: c.assets?.length || 0,
      licenseCount: (c as any).licenses?.length || 0
    }))

    // Sort by value descending and take top entries
    return contractCosts
      .filter(c => c.value > 0)
      .sort((a, b) => b.value - a.value)
  }, [activeContracts])

  const PIE_COLORS = [
    '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6',
    '#06b6d4', '#ec4899', '#84cc16', '#f97316', '#6366f1',
    '#14b8a6', '#a855f7', '#eab308', '#22c55e', '#0ea5e9'
  ]

  const filteredContracts = useMemo(() => {
    return contracts.filter((contract) => {
      // Search filter (from URL)
      if (urlSearch) {
        const searchLower = urlSearch.toLowerCase()
        if (!contract.contractNumber.toLowerCase().includes(searchLower)) return false
      }

      // URL parameter filters (from dashboard)
      if (urlStatus === 'active' && !contract.isActive) return false
      if (urlFilter === 'expiring') {
        const daysUntilExpiry = differenceInDays(new Date(contract.endDate), new Date())
        if (!(daysUntilExpiry > 0 && daysUntilExpiry <= 90)) return false
      }

      // Category filter
      if (categoryFilter !== 'all') {
        const contractCategory = (contract as any).category || 'HARDWARE'
        if (contractCategory !== categoryFilter) return false
      }

      // Status filter
      if (statusFilter === 'active') return contract.isActive
      if (statusFilter === 'inactive') return !contract.isActive
      if (statusFilter === 'expiring') {
        const daysUntilExpiry = differenceInDays(new Date(contract.endDate), new Date())
        return daysUntilExpiry > 0 && daysUntilExpiry <= 90
      }
      return true
    })
  }, [contracts, statusFilter, categoryFilter, urlStatus, urlFilter, urlSearch])

  const toggleContractExpansion = (contractId: string) => {
    const newExpanded = new Set(expandedContracts)
    if (newExpanded.has(contractId)) {
      newExpanded.delete(contractId)
    } else {
      newExpanded.add(contractId)
    }
    setExpandedContracts(newExpanded)
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
        <p className="text-red-800">Error loading contracts: {(error as any).message}</p>
      </div>
    )
  }

  const getContractTypeBadge = (type: string) => {
    switch (type) {
      case 'PREMIUM_CARE':
        return <Badge variant="success">Premium Care</Badge>
      case 'JUNIPER_CARE':
        return <Badge variant="info">Juniper Care</Badge>
      case 'THIRD_PARTY':
        return <Badge variant="warning">Third Party</Badge>
      case 'NLOGIC':
        return <Badge variant="info">nLogic</Badge>
      default:
        return <Badge variant="default">{type}</Badge>
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Maintenance Contracts</h1>
          <p className="text-sm text-gray-600 mt-1">
            Manage Juniper support and maintenance agreements
          </p>
          {(urlStatus === 'active' || urlFilter === 'expiring' || urlSearch) && (
            <div className="mt-2 flex gap-2 flex-wrap">
              {urlStatus === 'active' && <Badge variant="success">Showing only active contracts</Badge>}
              {urlFilter === 'expiring' && <Badge variant="warning">Showing contracts expiring within 90 days</Badge>}
              {urlSearch && (
                <Badge variant="info" className="flex items-center gap-1">
                  Søker: "{urlSearch}"
                  <a href="/contracts" className="ml-1 hover:text-blue-800">✕</a>
                </Badge>
              )}
            </div>
          )}
        </div>
        <Button onClick={() => setShowAddModal(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Contract
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="bg-blue-100 p-3 rounded-lg">
              <FileText className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <div className="text-sm text-gray-600">Total Contracts</div>
              <div className="text-2xl font-bold text-gray-900">
                {isLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : stats.total}
              </div>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="bg-green-100 p-3 rounded-lg">
              <FileText className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <div className="text-sm text-gray-600">Active</div>
              <div className="text-2xl font-bold text-green-600">
                {isLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : stats.active}
              </div>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="bg-orange-100 p-3 rounded-lg">
              <Calendar className="h-6 w-6 text-orange-600" />
            </div>
            <div>
              <div className="text-sm text-gray-600">Expiring Soon</div>
              <div className="text-2xl font-bold text-orange-600">
                {isLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : stats.expiring}
              </div>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-100 p-3 rounded-lg">
              <DollarSign className="h-6 w-6 text-indigo-600" />
            </div>
            <div>
              <div className="text-sm text-gray-600">Annual Cost</div>
              <div className="text-2xl font-bold text-gray-900">
                {isLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : `${stats.totalCost.toLocaleString()} kr`}
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Pie Chart - Cost Distribution */}
      {pieChartData.length > 0 && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Kostnadsfordeling per kontrakt</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieChartData}
                  cx="50%"
                  cy="50%"
                  outerRadius={120}
                  dataKey="value"
                >
                  {pieChartData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload
                      const total = pieChartData.reduce((sum, d) => sum + d.value, 0)
                      const percent = ((data.value / total) * 100).toFixed(1)
                      return (
                        <div className="bg-white border border-gray-200 shadow-lg rounded-lg p-3">
                          <div className="font-semibold text-gray-900">{data.name}</div>
                          <div className="text-sm text-gray-600 mt-1">
                            {Number(data.value).toLocaleString('nb-NO')} kr ({percent}%)
                          </div>
                          <div className="text-sm text-gray-500 mt-1">
                            {data.assetCount > 0 && <span>{data.assetCount} hardware</span>}
                            {data.assetCount > 0 && data.licenseCount > 0 && <span>, </span>}
                            {data.licenseCount > 0 && <span>{data.licenseCount} lisenser</span>}
                          </div>
                        </div>
                      )
                    }
                    return null
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>
      )}

      {/* Expiring Warning */}
      {expiringContracts.length > 0 && (
        <Card className="bg-orange-50 border border-orange-200 p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-orange-600 mt-0.5" />
            <div>
              <h3 className="font-medium text-orange-900">
                {expiringContracts.length} contracts expiring in the next 90 days
              </h3>
              <p className="text-sm text-orange-700 mt-1">
                Review and renew these contracts to maintain support coverage.
              </p>
              <div className="mt-2 space-y-1">
                {expiringContracts.map((contract) => {
                  const daysLeft = differenceInDays(new Date(contract.endDate), new Date())
                  return (
                    <div key={contract.id} className="text-sm text-orange-800">
                      • {contract.contractNumber} - expires in {daysLeft} days ({format(new Date(contract.endDate), 'MMM d, yyyy')})
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Filters */}
      <div className="bg-white shadow rounded-lg p-4">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-4">
            <div className="text-sm font-medium text-gray-700">Category:</div>
            <Select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value as 'all' | 'HARDWARE' | 'LICENSE')}
              options={[
                { value: 'all', label: 'All' },
                { value: 'HARDWARE', label: 'Hardware' },
                { value: 'LICENSE', label: 'License' },
              ]}
            />
          </div>
          <div className="flex items-center gap-4">
            <div className="text-sm font-medium text-gray-700">Status:</div>
            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              options={[
                { value: 'all', label: 'All' },
                { value: 'active', label: 'Active' },
                { value: 'inactive', label: 'Inactive' },
                { value: 'expiring', label: 'Expiring Soon (90 days)' },
              ]}
            />
          </div>
        </div>
      </div>

      {/* Contracts Table */}
      <Card className="p-0">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contract
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Period
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Annual Cost
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Assets/Licenses
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredContracts.map((contract) => {
                const daysUntilExpiry = differenceInDays(new Date(contract.endDate), new Date())
                const isExpiring = daysUntilExpiry > 0 && daysUntilExpiry <= 90
                const isExpired = daysUntilExpiry <= 0
                const isExpanded = expandedContracts.has(contract.id)

                return (
                  <React.Fragment key={contract.id}>
                    {/* Main contract row */}
                    <tr className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          {(contract.assets.length > 0 || ((contract as any).licenses && (contract as any).licenses.length > 0)) && (
                            <button
                              onClick={() => toggleContractExpansion(contract.id)}
                              className="text-gray-400 hover:text-gray-600"
                              title={isExpanded ? 'Collapse assets/licenses' : 'Expand assets/licenses'}
                            >
                              {isExpanded ? (
                                <ChevronDown className="h-4 w-4" />
                              ) : (
                                <ChevronRight className="h-4 w-4" />
                              )}
                            </button>
                          )}
                          <div>
                            <div className="font-medium text-gray-900">{contract.contractNumber}</div>
                            <div className="text-sm text-gray-500">{contract.vendor}</div>
                            {contract.serviceLevel && (
                              <div className="text-xs text-gray-400 mt-1">{contract.serviceLevel}</div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">{getContractTypeBadge(contract.contractType)}</td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">
                          {format(new Date(contract.startDate), 'MMM d, yyyy')}
                        </div>
                        <div className="text-sm text-gray-500">
                          to {format(new Date(contract.endDate), 'MMM d, yyyy')}
                        </div>
                        {isExpiring && !isExpired && (
                          <Badge variant="warning" className="mt-1">
                            {daysUntilExpiry} days left
                          </Badge>
                        )}
                        {isExpired && (
                          <Badge variant="danger" className="mt-1">
                            Expired
                          </Badge>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {contract.annualCost ? Number(contract.annualCost).toLocaleString() : '-'} kr
                        {contract.autoRenewal && (
                          <div className="text-xs text-green-600 mt-1">Auto-renewal enabled</div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1">
                          {contract.assets.length > 0 && (
                            <Badge variant="success" className="w-fit">
                              {contract.assets.length} asset{contract.assets.length !== 1 ? 's' : ''}
                            </Badge>
                          )}
                          {((contract as any).licenses && (contract as any).licenses.length > 0) && (
                            <Badge variant="default" className="w-fit bg-purple-100 text-purple-800 border-purple-300">
                              {(contract as any).licenses.length} license{(contract as any).licenses.length !== 1 ? 's' : ''}
                            </Badge>
                          )}
                          {contract.assets.length === 0 && !((contract as any).licenses && (contract as any).licenses.length > 0) && (
                            <span className="text-sm text-gray-400">No assets/licenses</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <Badge variant={contract.isActive ? 'success' : 'danger'}>
                          {contract.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-right text-sm font-medium">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => setEditingContract(contract)}
                            className="text-blue-600 hover:text-blue-900"
                            title="Edit contract"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => setDeletingContract(contract)}
                            className="text-red-600 hover:text-red-900"
                            title="Delete contract"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>

                    {/* Expanded asset rows */}
                    {isExpanded && contract.assets.map((assetMapping: any) => {
                      const asset = assetMapping.asset
                      const assetCost = assetMapping.assetCost
                      return (
                        <tr key={`${contract.id}-${asset.id}`} className="bg-blue-50/50 border-l-4 border-l-blue-500">
                          <td className="px-6 py-3 pl-14">
                            <div className="flex items-center gap-2">
                              <div className="text-sm">
                                <div className="font-medium text-gray-800">
                                  {asset.hostname || asset.serialNumber}
                                </div>
                                <div className="text-xs text-gray-600">
                                  S/N: {asset.serialNumber}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-3">
                            <div className="text-sm text-gray-800">
                              {asset.model.modelName}
                            </div>
                            <div className="text-xs text-gray-600">
                              {asset.model.modelType}
                            </div>
                          </td>
                          <td className="px-6 py-3">
                            <div className="text-sm text-gray-700">
                              {format(new Date(assetMapping.coverageStart), 'MMM d, yyyy')}
                            </div>
                            <div className="text-xs text-gray-600">
                              to {format(new Date(assetMapping.coverageEnd), 'MMM d, yyyy')}
                            </div>
                          </td>
                          <td className="px-6 py-3 text-sm font-medium text-blue-900">
                            {assetCost ? (
                              <>
                                {Number(assetCost).toLocaleString()} kr
                                <div className="text-xs text-gray-600 font-normal">per year</div>
                              </>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </td>
                          <td className="px-6 py-3">
                            <Badge variant={asset.status === 'ACTIVE' ? 'success' : 'default'} className="text-xs">
                              {asset.status}
                            </Badge>
                          </td>
                          <td className="px-6 py-3">
                            {asset.location && (
                              <div className="text-xs text-gray-700">{asset.location}</div>
                            )}
                          </td>
                          <td className="px-6 py-3">
                            <button
                              onClick={() => handleRemoveAsset(contract.id, asset.id)}
                              className="text-red-600 hover:text-red-900"
                              title="Remove asset from contract"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </td>
                        </tr>
                      )
                    })}
                    {isExpanded && (contract as any).licenses && (contract as any).licenses.map((licenseMapping: any) => {
                      const license = licenseMapping.license
                      const licenseCost = licenseMapping.licenseCost
                      return (
                        <tr key={`${contract.id}-license-${license.id}`} className="bg-purple-50/50 border-l-4 border-l-purple-500">
                          <td className="px-6 py-3 pl-14">
                            <div className="flex items-center gap-2">
                              <div className="text-sm">
                                <div className="font-medium text-gray-800">
                                  {license.softwareProduct}
                                </div>
                                <div className="text-xs text-gray-600">
                                  License Key: {license.licenseKey || 'N/A'}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-3">
                            <div className="text-sm text-gray-800">
                              {license.softwareProduct}
                            </div>
                            <div className="text-xs text-gray-600">
                              {license.licenseType}
                            </div>
                          </td>
                          <td className="px-6 py-3">
                            <div className="text-sm text-gray-700">
                              {format(new Date(licenseMapping.coverageStart), 'MMM d, yyyy')}
                            </div>
                            <div className="text-xs text-gray-600">
                              to {format(new Date(licenseMapping.coverageEnd), 'MMM d, yyyy')}
                            </div>
                          </td>
                          <td className="px-6 py-3 text-sm font-medium text-purple-900">
                            {licenseCost ? (
                              <>
                                {Number(licenseCost).toLocaleString()} kr
                                <div className="text-xs text-gray-600 font-normal">per year</div>
                              </>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </td>
                          <td className="px-6 py-3">
                            <Badge variant={license.isActive ? 'success' : 'default'} className="text-xs">
                              {license.isActive ? 'ACTIVE' : 'INACTIVE'}
                            </Badge>
                          </td>
                          <td className="px-6 py-3">
                            <div className="text-xs text-gray-600">LICENSE</div>
                          </td>
                          <td className="px-6 py-3">
                            <button
                              onClick={() => handleRemoveLicense(contract.id, license.id)}
                              className="text-red-600 hover:text-red-900"
                              title="Remove license from contract"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </td>
                        </tr>
                      )
                    })}
                  </React.Fragment>
                )
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Assets Modal */}
      <Modal
        isOpen={!!selectedContract}
        onClose={() => setSelectedContract(null)}
        title={`Assets covered by ${selectedContract?.contractNumber}`}
        size="lg"
      >
        <div className="space-y-4">
          <div className="text-sm text-gray-600">
            Contract: <span className="font-medium text-gray-900">{selectedContract?.contractNumber}</span>
            <br />
            Type: {selectedContract && getContractTypeBadge(selectedContract.contractType)}
            <br />
            Period: {selectedContract && format(new Date(selectedContract.startDate), 'MMM d, yyyy')} - {selectedContract && format(new Date(selectedContract.endDate), 'MMM d, yyyy')}
          </div>

          <div className="border-t border-gray-200 pt-4">
            <h4 className="font-medium text-gray-900 mb-3">
              Covered Assets ({selectedContract?.assets.length || 0})
            </h4>
            <div className="space-y-3">
              {selectedContract?.assets.map((assetMapping: any) => {
                const asset = assetMapping.asset
                return (
                  <div
                    key={asset.serialNumber}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">
                        {asset.hostname || asset.serialNumber}
                      </div>
                      <div className="text-sm text-gray-500">
                        Serial: {asset.serialNumber}
                      </div>
                      <div className="text-sm text-gray-500">
                        Model: {asset.model.modelName} ({asset.model.modelType})
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <Badge variant={asset.status === 'ACTIVE' ? 'success' : 'default'}>
                        {asset.status}
                      </Badge>
                      {asset.location && (
                        <div className="text-xs text-gray-500">{asset.location}</div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {selectedContract?.notes && (
            <div className="border-t border-gray-200 pt-4">
              <h4 className="font-medium text-gray-900 mb-2">Notes</h4>
              <p className="text-sm text-gray-600">{selectedContract.notes}</p>
            </div>
          )}
        </div>
      </Modal>

      {/* Add Contract Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => !createContract.isPending && setShowAddModal(false)}
        title="Add New Contract"
        size="lg"
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => setShowAddModal(false)}
              disabled={createContract.isPending}
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                const form = document.querySelector('form[data-contract-form]') as HTMLFormElement
                if (form) form.requestSubmit()
              }}
              disabled={createContract.isPending}
            >
              {createContract.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Contract'
              )}
            </Button>
          </>
        }
      >
        <ContractForm onSubmit={handleCreateContract} isSubmitting={createContract.isPending} />
        {createContract.isError && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-800">
              Error: {(createContract.error as any)?.response?.data?.error || 'Failed to create contract'}
            </p>
          </div>
        )}
      </Modal>

      {/* Edit Contract Modal */}
      <Modal
        isOpen={!!editingContract}
        onClose={() => !updateContract.isPending && setEditingContract(null)}
        title="Edit Contract"
        size="lg"
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => setEditingContract(null)}
              disabled={updateContract.isPending}
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                const form = document.querySelector('form[data-contract-form]') as HTMLFormElement
                if (form) form.requestSubmit()
              }}
              disabled={updateContract.isPending}
            >
              {updateContract.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Updating...
                </>
              ) : (
                'Update Contract'
              )}
            </Button>
          </>
        }
      >
        {editingContract && (
          <>
            <ContractForm
              contract={editingContract}
              onSubmit={handleUpdateContract}
              isSubmitting={updateContract.isPending}
            />
            {updateContract.isError && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm text-red-800">
                  Error: {(updateContract.error as any)?.response?.data?.error || 'Failed to update contract'}
                </p>
              </div>
            )}
          </>
        )}
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!deletingContract}
        onClose={() => !deleteContract.isPending && setDeletingContract(null)}
        title="Delete Contract"
        size="md"
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => setDeletingContract(null)}
              disabled={deleteContract.isPending}
            >
              Cancel
            </Button>
            <Button
              onClick={handleDeleteContract}
              disabled={deleteContract.isPending}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleteContract.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete Contract'
              )}
            </Button>
          </>
        }
      >
        {deletingContract && (
          <div className="space-y-4">
            <p className="text-sm text-gray-700">
              Are you sure you want to delete this contract? This action cannot be undone.
            </p>
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="text-gray-600">Contract Number:</div>
                <div className="font-medium text-gray-900">{deletingContract.contractNumber}</div>
                <div className="text-gray-600">Vendor:</div>
                <div className="font-medium text-gray-900">{deletingContract.vendor}</div>
                <div className="text-gray-600">Type:</div>
                <div className="font-medium text-gray-900">{deletingContract.contractType}</div>
              </div>
            </div>
            {deleteContract.isError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm text-red-800">
                  Error: {(deleteContract.error as any)?.response?.data?.error || 'Failed to delete contract'}
                </p>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  )
}
