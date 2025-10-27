import { useState } from 'react'
import { Plus, FileText, Calendar, DollarSign, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Card } from '@/components/ui/Card'
import { Modal } from '@/components/ui/Modal'
import { Input, Select, Textarea } from '@/components/ui/Form'
import { mockContracts } from '@/utils/mockData'
import { format, differenceInDays } from 'date-fns'

export default function ContractsPage() {
  const [showAddModal, setShowAddModal] = useState(false)
  const [statusFilter, setStatusFilter] = useState('all')

  const activeContracts = mockContracts.filter((c) => c.isActive)

  const expiringContracts = activeContracts.filter((c) => {
    const daysUntilExpiry = differenceInDays(new Date(c.endDate), new Date())
    return daysUntilExpiry > 0 && daysUntilExpiry <= 90
  })

  const totalAnnualCost = activeContracts.reduce(
    (sum, c) => sum + (c.annualCost || 0),
    0
  )

  const filteredContracts = mockContracts.filter((contract) => {
    if (statusFilter === 'active') return contract.isActive
    if (statusFilter === 'inactive') return !contract.isActive
    return true
  })

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
              <div className="text-2xl font-bold text-gray-900">{mockContracts.length}</div>
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
              <div className="text-2xl font-bold text-green-600">{activeContracts.length}</div>
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
              <div className="text-2xl font-bold text-orange-600">{expiringContracts.length}</div>
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
                ${totalAnnualCost.toLocaleString()}
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
                      ${contract.annualCost?.toLocaleString() || '-'}
                      {contract.autoRenewal && (
                        <div className="text-xs text-green-600 mt-1">Auto-renewal enabled</div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant={contract.assets.length > 0 ? 'success' : 'default'}>
                        {contract.assets.length} assets
                      </Badge>
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
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Add Contract Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Add New Contract"
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowAddModal(false)}>
              Cancel
            </Button>
            <Button onClick={() => setShowAddModal(false)}>Save Contract</Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input label="Contract Number" placeholder="JC-2024-001" required />
          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Contract Type"
              options={[
                { value: 'PREMIUM_CARE', label: 'Premium Care' },
                { value: 'JUNIPER_CARE', label: 'Juniper Care' },
                { value: 'THIRD_PARTY', label: 'Third Party' },
                { value: 'OTHER', label: 'Other' },
              ]}
            />
            <Input label="Vendor" placeholder="Juniper Networks" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input type="date" label="Start Date" required />
            <Input type="date" label="End Date" required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input type="number" label="Annual Cost" placeholder="125000" />
            <Input label="Service Level" placeholder="24x7, 4-hour response" />
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" id="autoRenewal" className="rounded" />
            <label htmlFor="autoRenewal" className="text-sm text-gray-700">
              Enable auto-renewal
            </label>
          </div>
          <Textarea label="Notes" rows={3} placeholder="Additional contract details..." />
        </div>
      </Modal>
    </div>
  )
}
