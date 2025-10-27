import { useState } from 'react'
import { Plus, Key, Calendar, DollarSign } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Card } from '@/components/ui/Card'
import { Modal } from '@/components/ui/Modal'
import { Input, Select, Textarea } from '@/components/ui/Form'
import { mockLicenses } from '@/utils/mockData'
import { format } from 'date-fns'

export default function LicensesPage() {
  const [showAddModal, setShowAddModal] = useState(false)

  const expiringLicenses = mockLicenses.filter((l) => {
    if (!l.expiryDate) return false
    const daysUntilExpiry = Math.ceil(
      (new Date(l.expiryDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    )
    return daysUntilExpiry > 0 && daysUntilExpiry <= 90
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Software Licenses</h1>
          <p className="text-sm text-gray-600 mt-1">
            Manage Juniper software licenses and subscriptions
          </p>
        </div>
        <Button onClick={() => setShowAddModal(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add License
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="bg-purple-100 p-3 rounded-lg">
              <Key className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <div className="text-sm text-gray-600">Total Licenses</div>
              <div className="text-2xl font-bold text-gray-900">{mockLicenses.length}</div>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="bg-green-100 p-3 rounded-lg">
              <Calendar className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <div className="text-sm text-gray-600">Active</div>
              <div className="text-2xl font-bold text-green-600">
                {mockLicenses.filter((l) => l.isActive).length}
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
              <div className="text-2xl font-bold text-orange-600">{expiringLicenses.length}</div>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="bg-blue-100 p-3 rounded-lg">
              <DollarSign className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <div className="text-sm text-gray-600">Total Cost</div>
              <div className="text-2xl font-bold text-gray-900">
                ${mockLicenses.reduce((sum, l) => sum + (l.cost || 0), 0).toLocaleString()}
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Expiring Licenses Warning */}
      {expiringLicenses.length > 0 && (
        <Card className="bg-orange-50 border border-orange-200 p-4">
          <div className="flex items-start gap-3">
            <Calendar className="h-5 w-5 text-orange-600 mt-0.5" />
            <div>
              <h3 className="font-medium text-orange-900">
                {expiringLicenses.length} licenses expiring in the next 90 days
              </h3>
              <p className="text-sm text-orange-700 mt-1">
                Review and renew these licenses to maintain compliance.
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Licenses Table */}
      <Card className="p-0">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Software Product
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  License Key
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Quantity
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Expiry Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Cost
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Assigned
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {mockLicenses.map((license) => {
                const daysUntilExpiry = license.expiryDate
                  ? Math.ceil((new Date(license.expiryDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
                  : null

                return (
                  <tr key={license.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">{license.softwareProduct}</div>
                      {license.vendorContractNumber && (
                        <div className="text-xs text-gray-500">Contract: {license.vendorContractNumber}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 font-mono">
                      {license.licenseKey || '-'}
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant={license.licenseType === 'SUBSCRIPTION' ? 'info' : 'default'}>
                        {license.licenseType}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">{license.quantity}</td>
                    <td className="px-6 py-4">
                      {license.expiryDate ? (
                        <div>
                          <div className="text-sm text-gray-900">
                            {format(new Date(license.expiryDate), 'MMM d, yyyy')}
                          </div>
                          {daysUntilExpiry && daysUntilExpiry <= 90 && (
                            <Badge variant={daysUntilExpiry <= 30 ? 'danger' : 'warning'}>
                              {daysUntilExpiry} days left
                            </Badge>
                          )}
                        </div>
                      ) : (
                        <span className="text-sm text-gray-500">No expiry</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      ${license.cost?.toLocaleString() || '-'}
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant={license.assets.length > 0 ? 'success' : 'default'}>
                        {license.assets.length} assets
                      </Badge>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Add License Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Add New License"
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowAddModal(false)}>
              Cancel
            </Button>
            <Button onClick={() => setShowAddModal(false)}>Save License</Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input label="Software Product" placeholder="Junos OS Advanced" required />
          <Input label="License Key" placeholder="JUNOS-ADV-2024-ABC123" />
          <div className="grid grid-cols-2 gap-4">
            <Select
              label="License Type"
              options={[
                { value: 'SUBSCRIPTION', label: 'Subscription' },
                { value: 'PERPETUAL', label: 'Perpetual' },
                { value: 'FEATURE', label: 'Feature' },
                { value: 'TRIAL', label: 'Trial' },
              ]}
            />
            <Input type="number" label="Quantity" placeholder="5" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input type="date" label="Purchase Date" />
            <Input type="date" label="Expiry Date" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input type="number" label="Cost" placeholder="15000" />
            <Input label="Vendor Contract Number" placeholder="JC-2024-001" />
          </div>
          <Textarea label="Notes" rows={3} placeholder="Additional notes about this license..." />
        </div>
      </Modal>
    </div>
  )
}
