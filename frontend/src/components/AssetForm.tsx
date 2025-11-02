import { useState, useEffect } from 'react'
import { Input, Select, Textarea } from './ui/Form'
import { useAllModels } from '@/hooks/useModels'
import { useLocations } from '@/hooks/useLocations'
import type { CreateAssetInput, HardwareAsset } from '@/types'
import { Loader2 } from 'lucide-react'

interface AssetFormProps {
  asset?: HardwareAsset
  onSubmit: (data: CreateAssetInput) => void
  isSubmitting?: boolean
}

export default function AssetForm({ asset, onSubmit, isSubmitting }: AssetFormProps) {
  const { data: models, isLoading: modelsLoading } = useAllModels()
  const { data: locationsData, isLoading: locationsLoading } = useLocations({ limit: 1000 })
  const locations = locationsData?.locations || []

  const [formData, setFormData] = useState<CreateAssetInput>({
    modelId: asset?.modelId || '',
    serialNumber: asset?.serialNumber || '',
    assetTag: asset?.assetTag || '',
    hostname: asset?.hostname || '',
    purchaseDate: asset?.purchaseDate || '',
    purchasePrice: asset?.purchasePrice || undefined,
    locationId: asset?.locationId || '',
    rackPosition: asset?.rackPosition || '',
    status: asset?.status || 'ACTIVE',
    owner: asset?.owner || '',
    notes: asset?.notes || '',
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(formData)
  }

  const handleChange = (field: keyof CreateAssetInput, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  if (modelsLoading || locationsLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        <span className="ml-2 text-gray-600">Loading form data...</span>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} data-asset-form className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <Input
          label="Serial Number"
          placeholder="JN1234567890"
          value={formData.serialNumber}
          onChange={(e) => handleChange('serialNumber', e.target.value)}
          required
        />
        <Input
          label="Asset Tag"
          placeholder="ASSET-001"
          value={formData.assetTag}
          onChange={(e) => handleChange('assetTag', e.target.value)}
        />
      </div>

      <Input
        label="Hostname"
        placeholder="mx240-core-01.oslo"
        value={formData.hostname}
        onChange={(e) => handleChange('hostname', e.target.value)}
      />

      <Select
        label="Model"
        value={formData.modelId}
        onChange={(e) => handleChange('modelId', e.target.value)}
        options={[
          { value: '', label: 'Select a model' },
          ...(models?.map((model) => ({
            value: model.id,
            label: `${model.modelName} (${model.modelType})`,
          })) || []),
        ]}
        required
      />

      <div className="grid grid-cols-2 gap-4">
        <Select
          label="Location"
          value={formData.locationId}
          onChange={(e) => handleChange('locationId', e.target.value)}
          options={[
            { value: '', label: 'Select a location' },
            ...(locations?.map((location) => ({
              value: location.id,
              label: location.name,
            })) || []),
          ]}
        />
        <Input
          label="Rack Position"
          placeholder="U10-U12"
          value={formData.rackPosition}
          onChange={(e) => handleChange('rackPosition', e.target.value)}
        />
      </div>

      <Select
        label="Status"
        value={formData.status}
        onChange={(e) => handleChange('status', e.target.value)}
        options={[
          { value: 'ACTIVE', label: 'Active' },
          { value: 'SPARE', label: 'Spare' },
          { value: 'DEFECT', label: 'Defect' },
          { value: 'RETIRED', label: 'Retired' },
          { value: 'IN_REPAIR', label: 'In Repair' },
          { value: 'MISSING', label: 'Missing' },
        ]}
        required
      />

      <div className="grid grid-cols-2 gap-4">
        <Input
          type="date"
          label="Purchase Date"
          value={formData.purchaseDate}
          onChange={(e) => handleChange('purchaseDate', e.target.value)}
        />
        <Input
          type="number"
          label="Purchase Price"
          placeholder="45000"
          value={formData.purchasePrice || ''}
          onChange={(e) => handleChange('purchasePrice', e.target.value ? Number(e.target.value) : undefined)}
        />
      </div>

      <Input
        label="Owner/Department"
        placeholder="Network Operations"
        value={formData.owner}
        onChange={(e) => handleChange('owner', e.target.value)}
      />

      <Textarea
        label="Notes"
        rows={3}
        placeholder="Additional notes about this asset..."
        value={formData.notes}
        onChange={(e) => handleChange('notes', e.target.value)}
      />

      <button type="submit" className="hidden" disabled={isSubmitting} />
    </form>
  )
}
