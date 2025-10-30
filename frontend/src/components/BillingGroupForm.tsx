import { useState, useEffect } from 'react'
import { Input, Select, Textarea } from '@/components/ui/Form'
import type { BillingGroup } from '@/hooks/useBilling'

interface BillingGroupFormProps {
  group?: BillingGroup
  onSubmit: (data: BillingGroupFormData) => void
  isSubmitting?: boolean
}

export interface BillingGroupFormData {
  name: string
  description?: string
  billingType: 'MONTHLY' | 'QUARTERLY' | 'SEMI_ANNUAL' | 'ANNUAL' | 'CUSTOM'
  periodStart: string
  periodEnd: string
  maxAssets?: number
  isActive: boolean
}

export default function BillingGroupForm({ group, onSubmit, isSubmitting }: BillingGroupFormProps) {
  const [formData, setFormData] = useState<BillingGroupFormData>({
    name: group?.name || '',
    description: group?.description || '',
    billingType: group?.billingType || 'SEMI_ANNUAL',
    periodStart: group?.periodStart ? group.periodStart.split('T')[0] : '',
    periodEnd: group?.periodEnd ? group.periodEnd.split('T')[0] : '',
    maxAssets: group?.maxAssets || undefined,
    isActive: group?.isActive ?? true,
  })

  useEffect(() => {
    if (group) {
      setFormData({
        name: group.name || '',
        description: group.description || '',
        billingType: group.billingType || 'SEMI_ANNUAL',
        periodStart: group.periodStart ? group.periodStart.split('T')[0] : '',
        periodEnd: group.periodEnd ? group.periodEnd.split('T')[0] : '',
        maxAssets: group.maxAssets || undefined,
        isActive: group.isActive ?? true,
      })
    }
  }, [group])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(formData)
  }

  const handleChange = (field: keyof BillingGroupFormData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  // Auto-generate period dates based on billing type and current year
  const handleBillingTypeChange = (newType: string) => {
    const billingType = newType as BillingGroupFormData['billingType']
    setFormData(prev => ({ ...prev, billingType }))

    // Auto-generate reasonable period dates for the current year
    const currentYear = new Date().getFullYear()
    const currentMonth = new Date().getMonth() // 0-based

    let periodStart = ''
    let periodEnd = ''

    switch (billingType) {
      case 'SEMI_ANNUAL':
        if (currentMonth < 6) {
          // First half
          periodStart = `${currentYear}-01-01`
          periodEnd = `${currentYear}-06-30`
        } else {
          // Second half
          periodStart = `${currentYear}-07-01`
          periodEnd = `${currentYear}-12-31`
        }
        break

      case 'QUARTERLY':
        const quarter = Math.floor(currentMonth / 3) + 1
        const quarterStart = (quarter - 1) * 3
        const quarterEnd = quarter * 3 - 1
        periodStart = `${currentYear}-${String(quarterStart + 1).padStart(2, '0')}-01`
        const lastDayOfQuarter = new Date(currentYear, quarterEnd + 1, 0).getDate()
        periodEnd = `${currentYear}-${String(quarterEnd + 1).padStart(2, '0')}-${lastDayOfQuarter}`
        break

      case 'ANNUAL':
        periodStart = `${currentYear}-01-01`
        periodEnd = `${currentYear}-12-31`
        break

      case 'MONTHLY':
        const currentMonthStr = String(currentMonth + 1).padStart(2, '0')
        const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0).getDate()
        periodStart = `${currentYear}-${currentMonthStr}-01`
        periodEnd = `${currentYear}-${currentMonthStr}-${lastDayOfMonth}`
        break

      default:
        // CUSTOM - don't auto-generate
        break
    }

    if (periodStart && periodEnd) {
      setFormData(prev => ({
        ...prev,
        periodStart,
        periodEnd
      }))
    }
  }

  return (
    <form onSubmit={handleSubmit} data-billing-form>
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Group Name"
            value={formData.name}
            onChange={(e) => handleChange('name', e.target.value)}
            placeholder="H1-2025"
            required
            disabled={isSubmitting}
          />
          <Select
            label="Billing Type"
            value={formData.billingType}
            onChange={(e) => handleBillingTypeChange(e.target.value)}
            options={[
              { value: 'SEMI_ANNUAL', label: 'Semi-Annual (2 per year)' },
              { value: 'QUARTERLY', label: 'Quarterly (4 per year)' },
              { value: 'ANNUAL', label: 'Annual (1 per year)' },
              { value: 'MONTHLY', label: 'Monthly (12 per year)' },
              { value: 'CUSTOM', label: 'Custom Period' },
            ]}
            disabled={isSubmitting}
          />
        </div>

        <Textarea
          label="Description"
          value={formData.description}
          onChange={(e) => handleChange('description', e.target.value)}
          placeholder="First half of 2025 billing group..."
          rows={3}
          disabled={isSubmitting}
        />

        <div className="grid grid-cols-2 gap-4">
          <Input
            type="date"
            label="Period Start"
            value={formData.periodStart}
            onChange={(e) => handleChange('periodStart', e.target.value)}
            required
            disabled={isSubmitting}
          />
          <Input
            type="date"
            label="Period End"
            value={formData.periodEnd}
            onChange={(e) => handleChange('periodEnd', e.target.value)}
            required
            disabled={isSubmitting}
          />
        </div>

        <Input
          type="number"
          label="Maximum Assets (Optional)"
          value={formData.maxAssets || ''}
          onChange={(e) => handleChange('maxAssets', e.target.value ? Number(e.target.value) : undefined)}
          placeholder="Leave empty for unlimited"
          min="1"
          disabled={isSubmitting}
        />

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="isActive"
            checked={formData.isActive}
            onChange={(e) => handleChange('isActive', e.target.checked)}
            className="rounded"
            disabled={isSubmitting}
          />
          <label htmlFor="isActive" className="text-sm text-gray-700">
            Active billing group
          </label>
        </div>

        {/* Helper text based on billing type */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <p className="text-sm text-blue-800">
            {formData.billingType === 'SEMI_ANNUAL' && 
              "Semi-annual billing creates 2 invoices per year. This is the recommended approach for most organizations."
            }
            {formData.billingType === 'QUARTERLY' && 
              "Quarterly billing creates 4 invoices per year. Good for organizations with smaller asset counts."
            }
            {formData.billingType === 'ANNUAL' && 
              "Annual billing creates 1 invoice per year. Suitable for simple billing arrangements."
            }
            {formData.billingType === 'MONTHLY' && 
              "Monthly billing creates 12 invoices per year. Best for subscription-based services."
            }
            {formData.billingType === 'CUSTOM' && 
              "Custom periods allow for flexible billing arrangements. Set your own start and end dates."
            }
          </p>
        </div>
      </div>
    </form>
  )
}