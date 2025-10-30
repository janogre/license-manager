import { useState, useMemo } from 'react'
import { Plus, FileText, Calendar, DollarSign, AlertTriangle, Loader2, Edit, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Card } from '@/components/ui/Card'
import { Modal } from '@/components/ui/Modal'
import { Select } from '@/components/ui/Form'
import { useContracts, useCreateContract, useUpdateContract, useDeleteContract } from '@/hooks/useContracts'
import ContractForm from '@/components/ContractForm'
import { format, differenceInDays } from 'date-fns'
import type { MaintenanceContract } from '@/types'

export default function ContractsPage() {
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingContract, setEditingContract] = useState<MaintenanceContract | null>(null)
  const [deletingContract, setDeletingContract] = useState<MaintenanceContract | null>(null)
  const [statusFilter, setStatusFilter] = useState('all')
  const [selectedContract, setSelectedContract] = useState<MaintenanceContract | null>(null)

  // Fetch contracts from API
  const { data, isLoading, error } = useContracts({ limit: 100 })

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

  const filteredContracts = useMemo(() => {
    return contracts.filter((contract) => {
      if (statusFilter === 'active') return contract.isActive
      if (statusFilter === 'inactive') return !contract.isActive
      return true
    })
  }, [contracts, statusFilter])

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
        <div className="flex items-center gap-4">
          <div className="text-sm font-medium text-gray-700">Filter by status:</div>
          <Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            options={[
              { value: 'all', label: 'All Contracts' },
              { value: 'active', label: 'Active Only' },
              { value: 'inactive', label: 'Inactive Only' },
            ]}
          />
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
                  Assets
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

                return (
                  <tr key={contract.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">{contract.contractNumber}</div>
                      <div className="text-sm text-gray-500">{contract.vendor}</div>
                      {contract.serviceLevel && (
                        <div className="text-xs text-gray-400 mt-1">{contract.serviceLevel}</div>
                      )}
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
                      {contract.annualCost?.toLocaleString() || '-'} kr
                      {contract.autoRenewal && (
                        <div className="text-xs text-green-600 mt-1">Auto-renewal enabled</div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {contract.assets.length > 0 ? (
                        <button
                          onClick={() => setSelectedContract(contract)}
                          className="inline-block"
                        >
                          <Badge variant="success" className="cursor-pointer hover:opacity-80">
                            {contract.assets.length} assets
                          </Badge>
                        </button>
                      ) : (
                        <Badge variant="default">0 assets</Badge>
                      )}
                      {contract.assets.length > 0 && (
                        <div className="text-xs text-gray-500 mt-1">
                          {contract.assets.slice(0, 2).map((a: any) => a.asset.hostname || a.asset.serialNumber).join(', ')}
                          {contract.assets.length > 2 && ` +${contract.assets.length - 2} more`}
                        </div>
                      )}
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
