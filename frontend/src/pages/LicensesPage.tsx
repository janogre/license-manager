import { useState, useMemo } from 'react'
import { Plus, Key, Calendar, DollarSign, Loader2, Edit, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Card } from '@/components/ui/Card'
import { Modal } from '@/components/ui/Modal'
import { useLicenses, useCreateLicense, useUpdateLicense, useDeleteLicense } from '@/hooks/useLicenses'
import LicenseForm from '@/components/LicenseForm'
import { format } from 'date-fns'
import type { License } from '@/types'

export default function LicensesPage() {
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingLicense, setEditingLicense] = useState<License | null>(null)
  const [deletingLicense, setDeletingLicense] = useState<License | null>(null)

  // Fetch licenses from API
  const { data, isLoading, error } = useLicenses({ limit: 100 })

  // Mutations
  const createLicense = useCreateLicense()
  const updateLicense = useUpdateLicense()
  const deleteLicense = useDeleteLicense()

  const handleCreateLicense = async (formData: Partial<License>) => {
    try {
      await createLicense.mutateAsync(formData)
      setShowAddModal(false)
    } catch (err) {
      console.error('Failed to create license:', err)
    }
  }

  const handleUpdateLicense = async (formData: Partial<License>) => {
    if (!editingLicense) return
    try {
      await updateLicense.mutateAsync({ id: editingLicense.id, ...formData })
      setEditingLicense(null)
    } catch (err) {
      console.error('Failed to update license:', err)
    }
  }

  const handleDeleteLicense = async () => {
    if (!deletingLicense) return
    try {
      await deleteLicense.mutateAsync(deletingLicense.id)
      setDeletingLicense(null)
    } catch (err) {
      console.error('Failed to delete license:', err)
    }
  }

  const licenses = data?.licenses || []

  const expiringLicenses = useMemo(() => {
    return licenses.filter((l) => {
      if (!l.expiryDate) return false
      const daysUntilExpiry = Math.ceil(
        (new Date(l.expiryDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
      )
      return daysUntilExpiry > 0 && daysUntilExpiry <= 90
    })
  }, [licenses])

  const stats = useMemo(() => {
    return {
      total: licenses.length,
      active: licenses.filter((l) => l.isActive).length,
      expiringSoon: expiringLicenses.length,
      totalCost: licenses.reduce((sum, l) => {
        const cost = typeof l.cost === 'string' ? parseFloat(l.cost) : (l.cost || 0)
        return sum + cost
      }, 0),
    }
  }, [licenses, expiringLicenses])

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
        <p className="text-red-800">Error loading licenses: {(error as any).message}</p>
      </div>
    )
  }

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
              <div className="text-2xl font-bold text-gray-900">
                {isLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : stats.total}
              </div>
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
                {isLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : stats.expiringSoon}
              </div>
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
                {isLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : `$${stats.totalCost.toLocaleString()}`}
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
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto text-gray-400" />
                    <p className="mt-2 text-sm text-gray-500">Loading licenses...</p>
                  </td>
                </tr>
              ) : licenses.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-gray-500">
                    No licenses found
                  </td>
                </tr>
              ) : (
                licenses.map((license) => {
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
                      <Badge variant={license.assets && license.assets.length > 0 ? 'success' : 'default'}>
                        {license.assets?.length || 0} assets
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setEditingLicense(license)}
                          className="text-blue-600 hover:text-blue-900"
                          title="Edit license"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => setDeletingLicense(license)}
                          className="text-red-600 hover:text-red-900"
                          title="Delete license"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Add License Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => !createLicense.isPending && setShowAddModal(false)}
        title="Add New License"
        size="lg"
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => setShowAddModal(false)}
              disabled={createLicense.isPending}
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                const form = document.querySelector('form[data-license-form]') as HTMLFormElement
                if (form) form.requestSubmit()
              }}
              disabled={createLicense.isPending}
            >
              {createLicense.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save License'
              )}
            </Button>
          </>
        }
      >
        <LicenseForm onSubmit={handleCreateLicense} isSubmitting={createLicense.isPending} />
        {createLicense.isError && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-800">
              Error: {(createLicense.error as any)?.response?.data?.error || 'Failed to create license'}
            </p>
          </div>
        )}
      </Modal>

      {/* Edit License Modal */}
      <Modal
        isOpen={!!editingLicense}
        onClose={() => !updateLicense.isPending && setEditingLicense(null)}
        title="Edit License"
        size="lg"
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => setEditingLicense(null)}
              disabled={updateLicense.isPending}
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                const form = document.querySelector('form[data-license-form]') as HTMLFormElement
                if (form) form.requestSubmit()
              }}
              disabled={updateLicense.isPending}
            >
              {updateLicense.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Updating...
                </>
              ) : (
                'Update License'
              )}
            </Button>
          </>
        }
      >
        {editingLicense && (
          <>
            <LicenseForm
              license={editingLicense}
              onSubmit={handleUpdateLicense}
              isSubmitting={updateLicense.isPending}
            />
            {updateLicense.isError && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm text-red-800">
                  Error: {(updateLicense.error as any)?.response?.data?.error || 'Failed to update license'}
                </p>
              </div>
            )}
          </>
        )}
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!deletingLicense}
        onClose={() => !deleteLicense.isPending && setDeletingLicense(null)}
        title="Delete License"
        size="md"
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => setDeletingLicense(null)}
              disabled={deleteLicense.isPending}
            >
              Cancel
            </Button>
            <Button
              onClick={handleDeleteLicense}
              disabled={deleteLicense.isPending}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleteLicense.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete License'
              )}
            </Button>
          </>
        }
      >
        {deletingLicense && (
          <div className="space-y-4">
            <p className="text-sm text-gray-700">
              Are you sure you want to delete this license? This action cannot be undone.
            </p>
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="text-gray-600">Software Product:</div>
                <div className="font-medium text-gray-900">{deletingLicense.softwareProduct}</div>
                {deletingLicense.licenseKey && (
                  <>
                    <div className="text-gray-600">License Key:</div>
                    <div className="font-medium text-gray-900 font-mono text-xs">{deletingLicense.licenseKey}</div>
                  </>
                )}
                <div className="text-gray-600">Type:</div>
                <div className="font-medium text-gray-900">{deletingLicense.licenseType}</div>
              </div>
            </div>
            {deleteLicense.isError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm text-red-800">
                  Error: {(deleteLicense.error as any)?.response?.data?.error || 'Failed to delete license'}
                </p>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  )
}
