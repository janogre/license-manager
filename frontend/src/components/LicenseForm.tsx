import { useState } from 'react'
import { Input, Select, Textarea } from './ui/Form'
import type { License } from '@/types'

interface LicenseFormProps {
  license?: License
  onSubmit: (data: Partial<License>) => void
  isSubmitting?: boolean
}

export default function LicenseForm({ license, onSubmit, isSubmitting }: LicenseFormProps) {
  const [formData, setFormData] = useState<Partial<License>>({
    licenseKey: license?.licenseKey || '',
    licenseType: license?.licenseType || 'SUBSCRIPTION',
    softwareProduct: license?.softwareProduct || '',
    quantity: license?.quantity || 1,
    purchaseDate: license?.purchaseDate || '',
    expiryDate: license?.expiryDate || '',
    cost: license?.cost || undefined,
    vendorContractNumber: license?.vendorContractNumber || '',
    notes: license?.notes || '',
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(formData)
  }

  const handleChange = (field: keyof License, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  return (
    <form onSubmit={handleSubmit} data-license-form className="space-y-4">
      <Input
        label="Software Product"
        placeholder="Junos OS Advanced"
        value={formData.softwareProduct}
        onChange={(e) => handleChange('softwareProduct', e.target.value)}
        required
      />

      <Input
        label="License Key"
        placeholder="JUNOS-ADV-2024-ABC123"
        value={formData.licenseKey}
        onChange={(e) => handleChange('licenseKey', e.target.value)}
      />

      <div className="grid grid-cols-2 gap-4">
        <Select
          label="License Type"
          value={formData.licenseType}
          onChange={(e) => handleChange('licenseType', e.target.value)}
          options={[
            { value: 'SUBSCRIPTION', label: 'Subscription' },
            { value: 'PERPETUAL', label: 'Perpetual' },
            { value: 'FEATURE', label: 'Feature' },
            { value: 'TRIAL', label: 'Trial' },
          ]}
          required
        />
        <Input
          type="number"
          label="Quantity"
          placeholder="5"
          value={formData.quantity}
          onChange={(e) => handleChange('quantity', Number(e.target.value))}
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Input
          type="date"
          label="Purchase Date"
          value={formData.purchaseDate}
          onChange={(e) => handleChange('purchaseDate', e.target.value)}
        />
        <Input
          type="date"
          label="Expiry Date"
          value={formData.expiryDate}
          onChange={(e) => handleChange('expiryDate', e.target.value)}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Input
          type="number"
          label="Cost"
          placeholder="15000"
          value={formData.cost || ''}
          onChange={(e) => handleChange('cost', e.target.value ? Number(e.target.value) : undefined)}
        />
        <Input
          label="Vendor Contract Number"
          placeholder="JC-2024-001"
          value={formData.vendorContractNumber}
          onChange={(e) => handleChange('vendorContractNumber', e.target.value)}
        />
      </div>

      <Textarea
        label="Notes"
        rows={3}
        placeholder="Additional notes about this license..."
        value={formData.notes}
        onChange={(e) => handleChange('notes', e.target.value)}
      />

      <button type="submit" className="hidden" disabled={isSubmitting} />
    </form>
  )
}
