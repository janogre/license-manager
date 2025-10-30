import { useState } from 'react'
import { X, Plus, Users, AlertTriangle, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Modal } from '@/components/ui/Modal'
import { Select } from '@/components/ui/Form'
import { 
  useBillingGroups, 
  useAssignAssetToBillingGroup, 
  type UnassignedAsset 
} from '@/hooks/useBilling'
import { format } from 'date-fns'

interface UnassignedAssetsPanelProps {
  isOpen: boolean
  onClose: () => void
  assets: UnassignedAsset[]
}

export default function UnassignedAssetsPanel({ isOpen, onClose, assets }: UnassignedAssetsPanelProps) {
  const [selectedAsset, setSelectedAsset] = useState<UnassignedAsset | null>(null)
  const [selectedBillingGroupId, setSelectedBillingGroupId] = useState('')

  // Fetch billing groups for assignment
  const { data: billingGroupsData } = useBillingGroups({ isActive: true })
  const billingGroups = billingGroupsData?.billingGroups || []

  // Mutation for assigning asset
  const assignAsset = useAssignAssetToBillingGroup()

  const handleAssignAsset = async () => {
    if (!selectedAsset || !selectedBillingGroupId) return

    try {
      await assignAsset.mutateAsync({
        assetId: selectedAsset.id,
        billingGroupId: selectedBillingGroupId
      })
      setSelectedAsset(null)
      setSelectedBillingGroupId('')
    } catch (err) {
      console.error('Failed to assign asset:', err)
    }
  }

  // Calculate total value of unassigned assets
  const totalValue = assets.reduce((sum, asset) => {
    return sum + (asset.purchasePrice || 0)
  }, 0)

  // Calculate estimated annual contract costs
  const totalAnnualCost = assets.reduce((sum, asset) => {
    const contractCosts = asset.contracts.reduce((contractSum, mapping) => {
      return contractSum + (Number(mapping.contract.annualCost) || 0)
    }, 0)
    return sum + contractCosts
  }, 0)

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title="Unassigned Assets"
        size="xl"
        footer={
          <div className="flex items-center justify-between w-full">
            <div className="text-sm text-gray-600">
              {assets.length} assets • {totalValue.toLocaleString()} kr total value
              {totalAnnualCost > 0 && ` • ${totalAnnualCost.toLocaleString()} kr annual contracts`}
            </div>
            <Button onClick={onClose}>
              Close
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          {/* Summary Banner */}
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-orange-600" />
              <div>
                <h3 className="font-medium text-orange-900">
                  {assets.length} Asset{assets.length !== 1 ? 's' : ''} Awaiting Billing Assignment
                </h3>
                <p className="text-sm text-orange-700 mt-1">
                  These assets are not assigned to any billing group. Assign them to ensure proper invoice tracking.
                </p>
              </div>
            </div>
          </div>

          {/* Assets List */}
          {assets.length === 0 ? (
            <div className="bg-green-50 border border-green-200 rounded-lg p-8 text-center">
              <Users className="h-12 w-12 text-green-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-green-900 mb-2">All Assets Assigned!</h3>
              <p className="text-sm text-green-700">
                Great! All assets have been assigned to billing groups.
              </p>
            </div>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {assets.map((asset) => (
                <div
                  key={asset.id}
                  className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <div>
                        <div className="font-medium text-gray-900">
                          {asset.model.modelName}
                        </div>
                        <div className="text-sm text-gray-500">
                          SN: {asset.serialNumber}
                          {asset.hostname && ` • ${asset.hostname}`}
                          {asset.assetTag && ` • ${asset.assetTag}`}
                        </div>
                      </div>
                      <Badge variant="default">{asset.model.modelType}</Badge>
                      <Badge variant={asset.status === 'ACTIVE' ? 'success' : 'default'}>
                        {asset.status}
                      </Badge>
                    </div>
                    
                    <div className="mt-2 flex items-center gap-4 text-xs text-gray-500">
                      {asset.location && (
                        <span>📍 {asset.location}</span>
                      )}
                      {asset.purchaseDate && (
                        <span>📅 Purchased: {format(new Date(asset.purchaseDate), 'MMM d, yyyy')}</span>
                      )}
                      {asset.purchasePrice && (
                        <span>💰 {asset.purchasePrice.toLocaleString()} kr</span>
                      )}
                      {asset.owner && (
                        <span>👤 {asset.owner}</span>
                      )}
                    </div>

                    {asset.contracts.length > 0 && (
                      <div className="mt-2">
                        <div className="text-xs text-gray-500">
                          Contracts: {asset.contracts.map(mapping => mapping.contract.contractNumber).join(', ')}
                          {asset.contracts.length > 0 && (
                            <span className="ml-2 font-medium">
                              ({asset.contracts.reduce((sum, mapping) => sum + (Number(mapping.contract.annualCost) || 0), 0).toLocaleString()} kr/year)
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  <Button
                    size="sm"
                    onClick={() => setSelectedAsset(asset)}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Assign
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </Modal>

      {/* Asset Assignment Modal */}
      <Modal
        isOpen={!!selectedAsset}
        onClose={() => setSelectedAsset(null)}
        title="Assign Asset to Billing Group"
        size="md"
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => setSelectedAsset(null)}
              disabled={assignAsset.isPending}
            >
              Cancel
            </Button>
            <Button
              onClick={handleAssignAsset}
              disabled={!selectedBillingGroupId || assignAsset.isPending}
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
        {selectedAsset && (
          <div className="space-y-4">
            {/* Asset Info */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <h3 className="font-medium text-gray-900 mb-2">Asset Details</h3>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="text-gray-600">Model:</div>
                <div className="font-medium">{selectedAsset.model.modelName}</div>
                <div className="text-gray-600">Serial Number:</div>
                <div className="font-medium">{selectedAsset.serialNumber}</div>
                {selectedAsset.hostname && (
                  <>
                    <div className="text-gray-600">Hostname:</div>
                    <div className="font-medium">{selectedAsset.hostname}</div>
                  </>
                )}
                {selectedAsset.purchasePrice && (
                  <>
                    <div className="text-gray-600">Purchase Price:</div>
                    <div className="font-medium">{selectedAsset.purchasePrice.toLocaleString()} kr</div>
                  </>
                )}
              </div>
            </div>

            {/* Billing Group Selection */}
            {billingGroups.length === 0 ? (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-sm text-yellow-800">
                  No active billing groups available. Create a billing group first before assigning assets.
                </p>
              </div>
            ) : (
              <Select
                label="Select Billing Group"
                value={selectedBillingGroupId}
                onChange={(e) => setSelectedBillingGroupId(e.target.value)}
                options={[
                  { value: '', label: 'Choose a billing group...' },
                  ...billingGroups
                    .filter(group => group.isActive)
                    .map(group => ({
                      value: group.id,
                      label: `${group.name} (${group._count.assetMappings} assets${group.maxAssets ? ` / ${group.maxAssets} max` : ''})`
                    }))
                ]}
              />
            )}

            {/* Info about assignment */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-sm text-blue-800">
                This asset will be assigned to the selected billing group and will be included in future invoices for that group.
              </p>
            </div>

            {assignAsset.isError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm text-red-800">
                  Error: {(assignAsset.error as any)?.response?.data?.error || 'Failed to assign asset'}
                </p>
              </div>
            )}
          </div>
        )}
      </Modal>
    </>
  )
}