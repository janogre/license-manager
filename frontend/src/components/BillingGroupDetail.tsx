import { useState } from 'react'
import { Calendar, Users, DollarSign, FileText, Plus, X, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Modal } from '@/components/ui/Modal'
import { Select } from '@/components/ui/Form'
import { 
  useBillingGroup, 
  useAssignAssetToBillingGroup, 
  useRemoveAssetFromBillingGroup,
  useUnassignedAssets,
  type BillingGroup 
} from '@/hooks/useBilling'
import { format } from 'date-fns'

interface BillingGroupDetailProps {
  group: BillingGroup
  isOpen: boolean
  onClose: () => void
}

export default function BillingGroupDetail({ group, isOpen, onClose }: BillingGroupDetailProps) {
  const [showAssignAsset, setShowAssignAsset] = useState(false)
  const [selectedAssetId, setSelectedAssetId] = useState('')

  // Fetch detailed group data
  const { data: groupData, isLoading } = useBillingGroup(group.id)
  const { data: unassignedData } = useUnassignedAssets()
  
  const detailedGroup = groupData?.billingGroup || group
  const unassignedAssets = unassignedData?.unassignedAssets || []

  // Mutations
  const assignAsset = useAssignAssetToBillingGroup()
  const removeAsset = useRemoveAssetFromBillingGroup()

  const handleAssignAsset = async () => {
    if (!selectedAssetId) return

    try {
      await assignAsset.mutateAsync({
        assetId: selectedAssetId,
        billingGroupId: group.id
      })
      setShowAssignAsset(false)
      setSelectedAssetId('')
    } catch (err) {
      console.error('Failed to assign asset:', err)
    }
  }

  const handleRemoveAsset = async (assetId: string) => {
    try {
      await removeAsset.mutateAsync({
        assetId,
        billingGroupId: group.id
      })
    } catch (err) {
      console.error('Failed to remove asset:', err)
    }
  }

  if (isLoading) {
    return (
      <Modal isOpen={isOpen} onClose={onClose} title="Loading..." size="lg">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
          <span className="ml-2 text-gray-500">Loading billing group details...</span>
        </div>
      </Modal>
    )
  }

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} title={detailedGroup.name} size="xl">
        <div className="space-y-6">
          {/* Group Overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-blue-600" />
                <span className="font-medium text-blue-900">Billing Period</span>
              </div>
              <div className="mt-2 text-sm text-blue-800">
                {format(new Date(detailedGroup.periodStart), 'MMM d, yyyy')} -{' '}
                {format(new Date(detailedGroup.periodEnd), 'MMM d, yyyy')}
              </div>
              <Badge variant="default" className="mt-2">
                {detailedGroup.billingType.replace('_', ' ')}
              </Badge>
            </div>

            <div className="bg-green-50 p-4 rounded-lg">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-green-600" />
                <span className="font-medium text-green-900">Assets Assigned</span>
              </div>
              <div className="mt-2 text-2xl font-bold text-green-800">
                {detailedGroup.assetMappings?.length || 0}
                {detailedGroup.maxAssets && (
                  <span className="text-sm font-normal">/ {detailedGroup.maxAssets}</span>
                )}
              </div>
            </div>

            <div className="bg-purple-50 p-4 rounded-lg">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-purple-600" />
                <span className="font-medium text-purple-900">Invoice Records</span>
              </div>
              <div className="mt-2 text-2xl font-bold text-purple-800">
                {detailedGroup.invoiceRecords?.length || 0}
              </div>
            </div>
          </div>

          {/* Description */}
          {detailedGroup.description && (
            <div>
              <h3 className="text-sm font-medium text-gray-900 mb-2">Description</h3>
              <p className="text-sm text-gray-600">{detailedGroup.description}</p>
            </div>
          )}

          {/* Assigned Assets */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">Assigned Assets</h3>
              <Button
                size="sm"
                onClick={() => setShowAssignAsset(true)}
                disabled={unassignedAssets.length === 0}
              >
                <Plus className="h-4 w-4 mr-2" />
                Assign Asset
              </Button>
            </div>

            {!detailedGroup.assetMappings || detailedGroup.assetMappings.length === 0 ? (
              <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-sm font-medium text-gray-900 mb-2">No assets assigned</h3>
                <p className="text-sm text-gray-500 mb-4">
                  This billing group doesn't have any assets assigned yet.
                </p>
                <Button
                  size="sm"
                  onClick={() => setShowAssignAsset(true)}
                  disabled={unassignedAssets.length === 0}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Assign First Asset
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {detailedGroup.assetMappings.map((mapping) => (
                  <div
                    key={mapping.id}
                    className="flex items-center justify-between p-4 border border-gray-200 rounded-lg"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <div>
                          <div className="font-medium text-gray-900">
                            {mapping.asset.model.modelName}
                          </div>
                          <div className="text-sm text-gray-500">
                            SN: {mapping.asset.serialNumber}
                            {mapping.asset.hostname && ` • ${mapping.asset.hostname}`}
                          </div>
                        </div>
                      </div>
                      <div className="mt-2 text-xs text-gray-500">
                        Assigned: {format(new Date(mapping.assignedDate), 'MMM d, yyyy')}
                        {mapping.notes && ` • ${mapping.notes}`}
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => handleRemoveAsset(mapping.asset.id)}
                      disabled={removeAsset.isPending}
                      className="text-red-600 hover:text-red-700"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Invoice Records */}
          {detailedGroup.invoiceRecords && detailedGroup.invoiceRecords.length > 0 && (
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Invoice Records</h3>
              <div className="space-y-3">
                {detailedGroup.invoiceRecords.map((invoice) => (
                  <div
                    key={invoice.id}
                    className="flex items-center justify-between p-4 border border-gray-200 rounded-lg"
                  >
                    <div>
                      <div className="font-medium text-gray-900">
                        {invoice.invoiceNumber}
                      </div>
                      <div className="text-sm text-gray-500">
                        Date: {format(new Date(invoice.invoiceDate), 'MMM d, yyyy')}
                        {invoice.totalAmount && (
                          <span> • {invoice.totalAmount.toLocaleString()} {invoice.currency}</span>
                        )}
                      </div>
                    </div>
                    <Badge
                      variant={
                        invoice.status === 'PAID' ? 'success' :
                        invoice.status === 'OVERDUE' ? 'danger' :
                        invoice.status === 'SENT' ? 'warning' : 'default'
                      }
                    >
                      {invoice.status}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </Modal>

      {/* Assign Asset Modal */}
      <Modal
        isOpen={showAssignAsset}
        onClose={() => setShowAssignAsset(false)}
        title="Assign Asset to Billing Group"
        size="md"
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => setShowAssignAsset(false)}
              disabled={assignAsset.isPending}
            >
              Cancel
            </Button>
            <Button
              onClick={handleAssignAsset}
              disabled={!selectedAssetId || assignAsset.isPending}
            >
              {assignAsset.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Assigning...
                </>
              ) : (
                'Assign Asset'
              )}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Select an unassigned asset to add to the "{detailedGroup.name}" billing group.
          </p>

          {unassignedAssets.length === 0 ? (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-sm text-yellow-800">
                No unassigned assets available. All assets are already assigned to billing groups.
              </p>
            </div>
          ) : (
            <Select
              label="Select Asset"
              value={selectedAssetId}
              onChange={(e) => setSelectedAssetId(e.target.value)}
              options={[
                { value: '', label: 'Choose an asset...' },
                ...unassignedAssets.map(asset => ({
                  value: asset.id,
                  label: `${asset.model.modelName} - ${asset.serialNumber}${asset.hostname ? ` (${asset.hostname})` : ''}`
                }))
              ]}
            />
          )}

          {assignAsset.isError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-800">
                Error: {(assignAsset.error as any)?.response?.data?.error || 'Failed to assign asset'}
              </p>
            </div>
          )}
        </div>
      </Modal>
    </>
  )
}