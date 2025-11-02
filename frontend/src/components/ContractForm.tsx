import { useState } from 'react'
import { Input, Select, Textarea } from './ui/Form'
import type { MaintenanceContract } from '@/types'

interface ContractFormProps {
  contract?: MaintenanceContract
  onSubmit: (data: Partial<MaintenanceContract>) => void
  isSubmitting?: boolean
}

// Contract type options
const CONTRACT_TYPE_OPTIONS = [
  { value: 'JUNIPER_CARE', label: 'Juniper Care' },
  { value: 'PREMIUM_CARE', label: 'Premium Care' },
  { value: 'THIRD_PARTY', label: 'Third Party' },
  { value: 'NLOGIC', label: 'nLogic' },
  { value: 'OTHER', label: 'Other' },
]

export default function ContractForm({ contract, onSubmit, isSubmitting }: ContractFormProps) {
  const [formData, setFormData] = useState<Partial<MaintenanceContract>>({
    contractNumber: contract?.contractNumber || '',
    contractType: contract?.contractType || 'JUNIPER_CARE',
    vendor: contract?.vendor || 'Juniper Networks',
    startDate: contract?.startDate || '',
    endDate: contract?.endDate || '',
    renewalDate: contract?.renewalDate || '',
    annualCost: contract?.annualCost || undefined,
    serviceLevel: contract?.serviceLevel || '',
    autoRenewal: contract?.autoRenewal || false,
    notes: contract?.notes || '',
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(formData)
  }

  const handleChange = (field: keyof MaintenanceContract, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  return (
    <form onSubmit={handleSubmit} data-contract-form className="space-y-4">
      <Input
        label="Contract Number"
        placeholder="JC-2024-001"
        value={formData.contractNumber}
        onChange={(e) => handleChange('contractNumber', e.target.value)}
        required
      />

      <div className="grid grid-cols-2 gap-4">
        <Select
          label="Contract Type"
          value={formData.contractType}
          onChange={(e) => handleChange('contractType', e.target.value)}
          options={CONTRACT_TYPE_OPTIONS}
          required
        />
        <Input
          label="Vendor"
          placeholder="Juniper Networks"
          value={formData.vendor}
          onChange={(e) => handleChange('vendor', e.target.value)}
          required
        />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Input
          type="date"
          label="Start Date"
          value={formData.startDate}
          onChange={(e) => handleChange('startDate', e.target.value)}
          required
        />
        <Input
          type="date"
          label="End Date"
          value={formData.endDate}
          onChange={(e) => handleChange('endDate', e.target.value)}
          required
        />
        <Input
          type="date"
          label="Renewal Date"
          value={formData.renewalDate}
          onChange={(e) => handleChange('renewalDate', e.target.value)}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Input
          type="number"
          label="Annual Cost"
          placeholder="125000"
          value={formData.annualCost || ''}
          onChange={(e) => handleChange('annualCost', e.target.value ? Number(e.target.value) : undefined)}
        />
        <Input
          label="Service Level"
          placeholder="24x7, 4-hour response"
          value={formData.serviceLevel}
          onChange={(e) => handleChange('serviceLevel', e.target.value)}
        />
      </div>

      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="autoRenewal"
          className="rounded"
          checked={formData.autoRenewal}
          onChange={(e) => handleChange('autoRenewal', e.target.checked)}
        />
        <label htmlFor="autoRenewal" className="text-sm text-gray-700">
          Enable auto-renewal
        </label>
      </div>

      <Textarea
        label="Notes"
        rows={3}
        placeholder="Additional contract details..."
        value={formData.notes}
        onChange={(e) => handleChange('notes', e.target.value)}
      />

      <button type="submit" className="hidden" disabled={isSubmitting} />
    </form>
  )
}
