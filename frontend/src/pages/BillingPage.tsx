import { useState, useMemo } from 'react'
import { Plus, Calendar, DollarSign, Users, TrendingUp, Loader2, Edit, Trash2, Eye, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Card } from '@/components/ui/Card'
import { Modal } from '@/components/ui/Modal'
import { Select } from '@/components/ui/Form'
import { 
  useBillingGroups, 
  useBillingAnalytics, 
  useUnassignedAssets,
  useCreateBillingGroup,
  useUpdateBillingGroup,
  useDeleteBillingGroup,
  type BillingGroup 
} from '@/hooks/useBilling'
import BillingGroupForm from '@/components/BillingGroupForm'
import BillingGroupDetail from '@/components/BillingGroupDetail'
import UnassignedAssetsPanel from '@/components/UnassignedAssetsPanel'
import { format, differenceInDays } from 'date-fns'
import { useTranslation } from 'react-i18next'

export default function BillingPage() {
  const { t } = useTranslation()
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingGroup, setEditingGroup] = useState<BillingGroup | null>(null)
  const [deletingGroup, setDeletingGroup] = useState<BillingGroup | null>(null)
  const [selectedGroup, setSelectedGroup] = useState<BillingGroup | null>(null)
  const [showUnassignedAssets, setShowUnassignedAssets] = useState(false)
  const [typeFilter, setTypeFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')

  // Fetch data
  const { data: billingGroupsData, isLoading: isLoadingGroups, error: groupsError } = useBillingGroups({ limit: 100 })
  const { data: analyticsData, isLoading: isLoadingAnalytics } = useBillingAnalytics()
  const { data: unassignedData } = useUnassignedAssets()

  const billingGroups = billingGroupsData?.billingGroups || []
  const analytics = analyticsData?.analytics
  const unassignedAssets = unassignedData?.unassignedAssets || []

  // Mutations
  const createGroup = useCreateBillingGroup()
  const updateGroup = useUpdateBillingGroup()
  const deleteGroup = useDeleteBillingGroup()

  // Filter billing groups
  const filteredGroups = useMemo(() => {
    let filtered = billingGroups

    if (typeFilter !== 'all') {
      filtered = filtered.filter(group => group.billingType === typeFilter)
    }

    if (statusFilter !== 'all') {
      if (statusFilter === 'active') {
        filtered = filtered.filter(group => group.isActive)
      } else if (statusFilter === 'inactive') {
        filtered = filtered.filter(group => !group.isActive)
      }
    }

    return filtered
  }, [billingGroups, typeFilter, statusFilter])

  // Handle create
  const handleCreateGroup = async (formData: any) => {
    try {
      await createGroup.mutateAsync(formData)
      setShowAddModal(false)
    } catch (err) {
      console.error('Failed to create billing group:', err)
    }
  }

  // Handle update
  const handleUpdateGroup = async (formData: any) => {
    if (!editingGroup) return

    try {
      await updateGroup.mutateAsync({ id: editingGroup.id, data: formData })
      setEditingGroup(null)
    } catch (err) {
      console.error('Failed to update billing group:', err)
    }
  }

  // Handle delete
  const handleDeleteGroup = async () => {
    if (!deletingGroup) return

    try {
      await deleteGroup.mutateAsync(deletingGroup.id)
      setDeletingGroup(null)
    } catch (err) {
      console.error('Failed to delete billing group:', err)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Billing Management</h1>
          <p className="text-sm text-gray-600 mt-1">
            Manage billing groups, invoice cycles, and asset assignments
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="secondary"
            onClick={() => setShowUnassignedAssets(true)}
            className="relative"
          >
            <Users className="h-4 w-4 mr-2" />
            Unassigned Assets
            {unassignedAssets.length > 0 && (
              <Badge variant="danger" className="ml-2 px-1.5 py-0.5 text-xs">
                {unassignedAssets.length}
              </Badge>
            )}
          </Button>
          <Button onClick={() => setShowAddModal(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Billing Group
          </Button>
        </div>
      </div>

      {/* Error State */}
      {groupsError && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-sm text-red-800">
            Error loading billing groups: {(groupsError as any)?.response?.data?.error || 'Unknown error'}
          </p>
        </div>
      )}

      {/* Analytics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="bg-blue-100 p-3 rounded-lg">
              <Calendar className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <div className="text-sm text-gray-600">Billing Groups</div>
              <div className="text-2xl font-bold text-gray-900">
                {isLoadingAnalytics ? <Loader2 className="h-6 w-6 animate-spin" /> : analytics?.billingGroups.total || 0}
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="bg-green-100 p-3 rounded-lg">
              <Users className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <div className="text-sm text-gray-600">Assigned Assets</div>
              <div className="text-2xl font-bold text-green-600">
                {isLoadingAnalytics ? <Loader2 className="h-6 w-6 animate-spin" /> : analytics?.assets.assigned || 0}
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="bg-orange-100 p-3 rounded-lg">
              <AlertTriangle className="h-6 w-6 text-orange-600" />
            </div>
            <div>
              <div className="text-sm text-gray-600">Unassigned Assets</div>
              <div className="text-2xl font-bold text-orange-600">
                {isLoadingAnalytics ? <Loader2 className="h-6 w-6 animate-spin" /> : analytics?.assets.unassigned || 0}
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="bg-purple-100 p-3 rounded-lg">
              <TrendingUp className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <div className="text-sm text-gray-600">Total Period Cost</div>
              <div className="text-2xl font-bold text-purple-600">
                {isLoadingGroups ? (
                  <Loader2 className="h-6 w-6 animate-spin" />
                ) : (
                  `${Math.round(billingGroups.reduce((sum, group) => sum + (group.totals?.periodCost || 0), 0)).toLocaleString()} kr`
                )}
              </div>
              <div className="text-xs text-purple-500 mt-1">
                {!isLoadingGroups && (
                  `${billingGroups.reduce((sum, group) => sum + (group.totals?.totalAnnualCost || 0), 0).toLocaleString()} kr/år total`
                )}
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <div className="bg-white shadow rounded-lg p-4">
        <div className="flex items-center gap-4">
          <div className="text-sm font-medium text-gray-700">Filters:</div>
          <Select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            options={[
              { value: 'all', label: 'All Types' },
              { value: 'SEMI_ANNUAL', label: 'Semi-Annual' },
              { value: 'QUARTERLY', label: 'Quarterly' },
              { value: 'ANNUAL', label: 'Annual' },
              { value: 'MONTHLY', label: 'Monthly' },
              { value: 'CUSTOM', label: 'Custom' }
            ]}
          />
          <Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            options={[
              { value: 'all', label: 'All Status' },
              { value: 'active', label: 'Active' },
              { value: 'inactive', label: 'Inactive' }
            ]}
          />
        </div>
      </div>

      {/* Billing Groups Table */}
      <Card className="p-0">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Group Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Period
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Assets
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Period Cost
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
              {isLoadingGroups ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto text-gray-400" />
                    <p className="mt-2 text-sm text-gray-500">Loading billing groups...</p>
                  </td>
                </tr>
              ) : filteredGroups.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                    No billing groups found
                  </td>
                </tr>
              ) : (
                filteredGroups.map((group) => {
                  const periodStart = new Date(group.periodStart)
                  const periodEnd = new Date(group.periodEnd)
                  const daysUntilStart = differenceInDays(periodStart, new Date())
                  const daysUntilEnd = differenceInDays(periodEnd, new Date())

                  return (
                    <tr key={group.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="font-medium text-gray-900">{group.name}</div>
                        <div className="text-sm text-gray-500">{group.description}</div>
                      </td>
                      <td className="px-6 py-4">
                        <Badge variant="default">{group.billingType.replace('_', ' ')}</Badge>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">
                          {format(periodStart, 'MMM d, yyyy')} - {format(periodEnd, 'MMM d, yyyy')}
                        </div>
                        {daysUntilStart > 0 && (
                          <div className="text-xs text-blue-600">Starts in {daysUntilStart} days</div>
                        )}
                        {daysUntilStart <= 0 && daysUntilEnd > 0 && (
                          <div className="text-xs text-green-600">Active ({daysUntilEnd} days left)</div>
                        )}
                        {daysUntilEnd <= 0 && (
                          <div className="text-xs text-red-600">Ended</div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">
                          {group._count.assetMappings}
                          {group.maxAssets && ` / ${group.maxAssets}`}
                        </div>
                        {group.maxAssets && group._count.assetMappings >= group.maxAssets && (
                          <div className="text-xs text-red-600">At capacity</div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900 font-medium">
                          {group.totals?.periodCost ? 
                            `${Math.round(group.totals.periodCost).toLocaleString()} kr` : 
                            '0 kr'
                          }
                        </div>
                        <div className="text-xs text-gray-500">
                          {group.totals?.totalAnnualCost ? 
                            `${group.totals.totalAnnualCost.toLocaleString()} kr/år` : 
                            '0 kr/år'
                          }
                        </div>
                        {group.totals?.totalAssetValue && group.totals.totalAssetValue > 0 && (
                          <div className="text-xs text-blue-600">
                            Assets: {group.totals.totalAssetValue.toLocaleString()} kr
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <Badge variant={group.isActive ? 'success' : 'danger'}>
                          {group.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-right text-sm font-medium">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => setSelectedGroup(group)}
                            className="text-blue-600 hover:text-blue-900"
                            title="View details"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => setEditingGroup(group)}
                            className="text-green-600 hover:text-green-900"
                            title="Edit group"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => setDeletingGroup(group)}
                            className="text-red-600 hover:text-red-900"
                            title="Delete group"
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

      {/* Add Billing Group Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => !createGroup.isPending && setShowAddModal(false)}
        title="Add Billing Group"
        size="lg"
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => setShowAddModal(false)}
              disabled={createGroup.isPending}
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                const form = document.querySelector('form[data-billing-form]') as HTMLFormElement
                if (form) form.requestSubmit()
              }}
              disabled={createGroup.isPending}
            >
              {createGroup.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Group'
              )}
            </Button>
          </>
        }
      >
        <BillingGroupForm onSubmit={handleCreateGroup} isSubmitting={createGroup.isPending} />
        {createGroup.isError && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-800">
              Error: {(createGroup.error as any)?.response?.data?.error || 'Failed to create billing group'}
            </p>
          </div>
        )}
      </Modal>

      {/* Edit Billing Group Modal */}
      <Modal
        isOpen={!!editingGroup}
        onClose={() => !updateGroup.isPending && setEditingGroup(null)}
        title="Edit Billing Group"
        size="lg"
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => setEditingGroup(null)}
              disabled={updateGroup.isPending}
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                const form = document.querySelector('form[data-billing-form]') as HTMLFormElement
                if (form) form.requestSubmit()
              }}
              disabled={updateGroup.isPending}
            >
              {updateGroup.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Updating...
                </>
              ) : (
                'Update Group'
              )}
            </Button>
          </>
        }
      >
        {editingGroup && (
          <>
            <BillingGroupForm
              group={editingGroup}
              onSubmit={handleUpdateGroup}
              isSubmitting={updateGroup.isPending}
            />
            {updateGroup.isError && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm text-red-800">
                  Error: {(updateGroup.error as any)?.response?.data?.error || 'Failed to update billing group'}
                </p>
              </div>
            )}
          </>
        )}
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!deletingGroup}
        onClose={() => !deleteGroup.isPending && setDeletingGroup(null)}
        title="Delete Billing Group"
        size="md"
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => setDeletingGroup(null)}
              disabled={deleteGroup.isPending}
            >
              Cancel
            </Button>
            <Button
              onClick={handleDeleteGroup}
              disabled={deleteGroup.isPending}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleteGroup.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete Group'
              )}
            </Button>
          </>
        }
      >
        {deletingGroup && (
          <div className="space-y-4">
            <p className="text-sm text-gray-700">
              Are you sure you want to delete this billing group? This action cannot be undone.
            </p>
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="text-gray-600">Group Name:</div>
                <div className="font-medium text-gray-900">{deletingGroup.name}</div>
                <div className="text-gray-600">Type:</div>
                <div className="font-medium text-gray-900">{deletingGroup.billingType}</div>
                <div className="text-gray-600">Assets:</div>
                <div className="font-medium text-gray-900">{deletingGroup._count.assetMappings}</div>
              </div>
            </div>
            {deleteGroup.isError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm text-red-800">
                  Error: {(deleteGroup.error as any)?.response?.data?.error || 'Failed to delete billing group'}
                </p>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Billing Group Detail Modal */}
      {selectedGroup && (
        <BillingGroupDetail
          group={selectedGroup}
          isOpen={!!selectedGroup}
          onClose={() => setSelectedGroup(null)}
        />
      )}

      {/* Unassigned Assets Panel */}
      <UnassignedAssetsPanel
        isOpen={showUnassignedAssets}
        onClose={() => setShowUnassignedAssets(false)}
        assets={unassignedAssets}
      />
    </div>
  )
}