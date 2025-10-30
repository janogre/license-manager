import { useState, useEffect } from 'react'
import { Input, Select, Textarea } from '@/components/ui/Form'
import { useTranslation } from 'react-i18next'
import type { HardwareModel, ModelType } from '@/types'

interface ModelFormProps {
  model?: HardwareModel
  onSubmit: (data: ModelFormData) => void
  isSubmitting?: boolean
}

export interface TechnicalSpecs {
  ports?: string
  throughput?: string
  memory?: string
  storage?: string
  powerSupply?: string
  formFactor?: string
  [key: string]: string | undefined
}

export interface ModelFormData {
  manufacturer: string
  modelName: string
  modelType: ModelType
  description?: string
  technicalSpecs?: TechnicalSpecs
  eolDate?: string
  eosDate?: string
  eolAnnouncedAt?: string
  isActive: boolean
}

export default function ModelForm({ model, onSubmit, isSubmitting }: ModelFormProps) {
  const { t } = useTranslation()
  const [formData, setFormData] = useState<ModelFormData>({
    manufacturer: model?.manufacturer || '',
    modelName: model?.modelName || '',
    modelType: model?.modelType || 'ROUTER',
    description: model?.description || '',
    technicalSpecs: {
      ports: model?.technicalSpecs?.ports || '',
      throughput: model?.technicalSpecs?.throughput || '',
      memory: model?.technicalSpecs?.memory || '',
      storage: model?.technicalSpecs?.storage || '',
      powerSupply: model?.technicalSpecs?.powerSupply || '',
      formFactor: model?.technicalSpecs?.formFactor || '',
    },
    eolDate: model?.eolDate || '',
    eosDate: model?.eosDate || '',
    eolAnnouncedAt: model?.eolAnnouncedAt || '',
    isActive: model?.isActive ?? true,
  })

  useEffect(() => {
    if (model) {
      setFormData({
        manufacturer: model.manufacturer || '',
        modelName: model.modelName || '',
        modelType: model.modelType || 'ROUTER',
        description: model.description || '',
        technicalSpecs: {
          ports: model.technicalSpecs?.ports || '',
          throughput: model.technicalSpecs?.throughput || '',
          memory: model.technicalSpecs?.memory || '',
          storage: model.technicalSpecs?.storage || '',
          powerSupply: model.technicalSpecs?.powerSupply || '',
          formFactor: model.technicalSpecs?.formFactor || '',
        },
        eolDate: model.eolDate || '',
        eosDate: model.eosDate || '',
        eolAnnouncedAt: model.eolAnnouncedAt || '',
        isActive: model.isActive ?? true,
      })
    }
  }, [model])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    // Remove empty specs fields
    const cleanedSpecs: TechnicalSpecs = {}
    if (formData.technicalSpecs) {
      Object.entries(formData.technicalSpecs).forEach(([key, value]) => {
        if (value && value.trim()) {
          cleanedSpecs[key] = value
        }
      })
    }

    onSubmit({
      ...formData,
      technicalSpecs: Object.keys(cleanedSpecs).length > 0 ? cleanedSpecs : undefined,
    })
  }

  const handleChange = (field: keyof ModelFormData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleSpecChange = (field: keyof TechnicalSpecs, value: string) => {
    setFormData((prev) => ({
      ...prev,
      technicalSpecs: {
        ...prev.technicalSpecs,
        [field]: value,
      },
    }))
  }

  return (
    <form onSubmit={handleSubmit} data-model-form>
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <Input
            label={t('models.form.manufacturer')}
            value={formData.manufacturer}
            onChange={(e) => handleChange('manufacturer', e.target.value)}
            placeholder="Juniper Networks"
            required
            disabled={isSubmitting}
          />
          <Input
            label={t('models.form.modelName')}
            value={formData.modelName}
            onChange={(e) => handleChange('modelName', e.target.value)}
            placeholder="MX240"
            required
            disabled={isSubmitting}
          />
        </div>

        <Select
          label={t('models.form.modelType')}
          value={formData.modelType}
          onChange={(e) => handleChange('modelType', e.target.value as ModelType)}
          options={[
            { value: 'ROUTER', label: t('models.filter.router') },
            { value: 'SWITCH', label: t('models.filter.switch') },
            { value: 'FIREWALL', label: t('models.filter.firewall') },
            { value: 'WIRELESS_AP', label: t('models.filter.wirelessAP') },
            { value: 'CONTROLLER', label: t('models.filter.controller') },
            { value: 'OTHER', label: t('models.filter.other') },
          ]}
          disabled={isSubmitting}
        />

        <Textarea
          label={t('models.form.description')}
          value={formData.description}
          onChange={(e) => handleChange('description', e.target.value)}
          placeholder="High-performance router for enterprise edge..."
          rows={3}
          disabled={isSubmitting}
        />

        <div className="border-t pt-4">
          <h3 className="text-sm font-medium text-gray-900 mb-3">{t('models.form.technicalSpecs')}</h3>
          <div className="grid grid-cols-2 gap-4">
            <Input
              label={t('models.form.ports')}
              value={formData.technicalSpecs?.ports || ''}
              onChange={(e) => handleSpecChange('ports', e.target.value)}
              placeholder="48 x 10GbE SFP+"
              disabled={isSubmitting}
            />
            <Input
              label={t('models.form.throughput')}
              value={formData.technicalSpecs?.throughput || ''}
              onChange={(e) => handleSpecChange('throughput', e.target.value)}
              placeholder="480 Gbps"
              disabled={isSubmitting}
            />
            <Input
              label={t('models.form.memory')}
              value={formData.technicalSpecs?.memory || ''}
              onChange={(e) => handleSpecChange('memory', e.target.value)}
              placeholder="16 GB"
              disabled={isSubmitting}
            />
            <Input
              label={t('models.form.storage')}
              value={formData.technicalSpecs?.storage || ''}
              onChange={(e) => handleSpecChange('storage', e.target.value)}
              placeholder="32 GB SSD"
              disabled={isSubmitting}
            />
            <Input
              label={t('models.form.powerSupply')}
              value={formData.technicalSpecs?.powerSupply || ''}
              onChange={(e) => handleSpecChange('powerSupply', e.target.value)}
              placeholder="AC 100-240V, DC -48V"
              disabled={isSubmitting}
            />
            <Input
              label={t('models.form.formFactor')}
              value={formData.technicalSpecs?.formFactor || ''}
              onChange={(e) => handleSpecChange('formFactor', e.target.value)}
              placeholder="1U Rackmount"
              disabled={isSubmitting}
            />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <Input
            type="date"
            label={t('models.form.eolDate')}
            value={formData.eolDate}
            onChange={(e) => handleChange('eolDate', e.target.value)}
            disabled={isSubmitting}
          />
          <Input
            type="date"
            label={t('models.form.eosDate')}
            value={formData.eosDate}
            onChange={(e) => handleChange('eosDate', e.target.value)}
            disabled={isSubmitting}
          />
          <Input
            type="date"
            label={t('models.form.eolAnnouncedAt')}
            value={formData.eolAnnouncedAt}
            onChange={(e) => handleChange('eolAnnouncedAt', e.target.value)}
            disabled={isSubmitting}
          />
        </div>

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
            {t('models.form.isActive')}
          </label>
        </div>
      </div>
    </form>
  )
}
