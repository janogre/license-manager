import { useState, useMemo } from 'react'
import { Plus, Server, Calendar, AlertTriangle, Loader2, Edit, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Card } from '@/components/ui/Card'
import { Modal } from '@/components/ui/Modal'
import { Select } from '@/components/ui/Form'
import { useModels, useCreateModel, useUpdateModel, useDeleteModel } from '@/hooks/useModels'
import ModelForm, { type ModelFormData } from '@/components/ModelForm'
import { format, differenceInDays } from 'date-fns'
import { useTranslation } from 'react-i18next'
import type { HardwareModel } from '@/types'

export default function ModelsPage() {
  const { t } = useTranslation()
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingModel, setEditingModel] = useState<HardwareModel | null>(null)
  const [deletingModel, setDeletingModel] = useState<HardwareModel | null>(null)
  const [typeFilter, setTypeFilter] = useState('all')

  // Fetch models from API
  const { data, isLoading, error } = useModels({ limit: 1000 })
  const models = data?.models || []

  // Mutations
  const createModel = useCreateModel()
  const updateModel = useUpdateModel()
  const deleteModel = useDeleteModel()

  // Filter models by type
  const filteredModels = useMemo(() => {
    if (typeFilter === 'all') return models
    return models.filter((model) => model.modelType === typeFilter)
  }, [models, typeFilter])

  // Calculate stats
  const stats = useMemo(() => {
    const total = models.length
    const active = models.filter((m) => m.isActive).length

    // Count EOL/EOS models
    const eolModels = models.filter((m) => {
      if (!m.eolDate) return false
      return differenceInDays(new Date(m.eolDate), new Date()) <= 0
    }).length

    const eosModels = models.filter((m) => {
      if (!m.eosDate) return false
      return differenceInDays(new Date(m.eosDate), new Date()) <= 0
    }).length

    return { total, active, eolModels, eosModels }
  }, [models])

  // Handle create
  const handleCreateModel = async (formData: ModelFormData) => {
    try {
      await createModel.mutateAsync(formData)
      setShowAddModal(false)
    } catch (err) {
      console.error('Failed to create model:', err)
    }
  }

  // Handle update
  const handleUpdateModel = async (formData: ModelFormData) => {
    if (!editingModel) return

    try {
      await updateModel.mutateAsync({ id: editingModel.id, data: formData })
      setEditingModel(null)
    } catch (err) {
      console.error('Failed to update model:', err)
    }
  }

  // Handle delete
  const handleDeleteModel = async () => {
    if (!deletingModel) return

    try {
      await deleteModel.mutateAsync(deletingModel.id)
      setDeletingModel(null)
    } catch (err) {
      console.error('Failed to delete model:', err)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('models.title')}</h1>
          <p className="text-sm text-gray-600 mt-1">
            {t('models.description')}
          </p>
        </div>
        <Button onClick={() => setShowAddModal(true)}>
          <Plus className="h-4 w-4 mr-2" />
          {t('models.addModel')}
        </Button>
      </div>

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-sm text-red-800">
            Error loading models: {(error as any)?.response?.data?.error || 'Unknown error'}
          </p>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="bg-blue-100 p-3 rounded-lg">
              <Server className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <div className="text-sm text-gray-600">{t('models.stats.total')}</div>
              <div className="text-2xl font-bold text-gray-900">
                {isLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : stats.total}
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="bg-green-100 p-3 rounded-lg">
              <Server className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <div className="text-sm text-gray-600">{t('models.stats.active')}</div>
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
              <div className="text-sm text-gray-600">{t('models.stats.eolReached')}</div>
              <div className="text-2xl font-bold text-orange-600">
                {isLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : stats.eolModels}
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="bg-red-100 p-3 rounded-lg">
              <AlertTriangle className="h-6 w-6 text-red-600" />
            </div>
            <div>
              <div className="text-sm text-gray-600">{t('models.stats.eosReached')}</div>
              <div className="text-2xl font-bold text-red-600">
                {isLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : stats.eosModels}
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <div className="bg-white shadow rounded-lg p-4">
        <div className="flex items-center gap-4">
          <div className="text-sm font-medium text-gray-700">Filter by type:</div>
          <Select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            options={[
              { value: 'all', label: t('models.filter.allTypes') },
              { value: 'ROUTER', label: t('models.filter.router') },
              { value: 'SWITCH', label: t('models.filter.switch') },
              { value: 'FIREWALL', label: t('models.filter.firewall') },
              { value: 'WIRELESS_AP', label: t('models.filter.wirelessAP') },
              { value: 'CONTROLLER', label: t('models.filter.controller') },
              { value: 'OTHER', label: t('models.filter.other') },
            ]}
          />
        </div>
      </div>

      {/* Models Table */}
      <Card className="p-0">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Model
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  EOL Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  EOS Date
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
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto text-gray-400" />
                    <p className="mt-2 text-sm text-gray-500">Loading models...</p>
                  </td>
                </tr>
              ) : filteredModels.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                    No models found
                  </td>
                </tr>
              ) : (
                filteredModels.map((model) => {
                  const eolDays = model.eolDate
                    ? differenceInDays(new Date(model.eolDate), new Date())
                    : null
                  const eosDays = model.eosDate
                    ? differenceInDays(new Date(model.eosDate), new Date())
                    : null

                  return (
                    <tr key={model.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="font-medium text-gray-900">{model.modelName}</div>
                        <div className="text-sm text-gray-500">{model.manufacturer}</div>
                      </td>
                      <td className="px-6 py-4">
                        <Badge variant="default">{model.modelType}</Badge>
                      </td>
                      <td className="px-6 py-4">
                        {model.eolDate ? (
                          <div>
                            <div className="text-sm text-gray-900">
                              {format(new Date(model.eolDate), 'MMM d, yyyy')}
                            </div>
                            {eolDays !== null && eolDays <= 0 && (
                              <div className="text-xs text-red-600 font-medium">
                                EOL Reached
                              </div>
                            )}
                            {eolDays !== null && eolDays > 0 && eolDays <= 365 && (
                              <div className="text-xs text-orange-600 font-medium">
                                {eolDays} days left
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-sm text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {model.eosDate ? (
                          <div>
                            <div className="text-sm text-gray-900">
                              {format(new Date(model.eosDate), 'MMM d, yyyy')}
                            </div>
                            {eosDays !== null && eosDays <= 0 && (
                              <div className="text-xs text-red-600 font-medium">
                                EOS Reached
                              </div>
                            )}
                            {eosDays !== null && eosDays > 0 && eosDays <= 365 && (
                              <div className="text-xs text-orange-600 font-medium">
                                {eosDays} days left
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-sm text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <Badge variant={model.isActive ? 'success' : 'danger'}>
                          {model.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-right text-sm font-medium">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => setEditingModel(model)}
                            className="text-blue-600 hover:text-blue-900"
                            title="Edit model"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => setDeletingModel(model)}
                            className="text-red-600 hover:text-red-900"
                            title="Delete model"
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

      {/* Add Model Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => !createModel.isPending && setShowAddModal(false)}
        title={t('models.addModel')}
        size="lg"
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => setShowAddModal(false)}
              disabled={createModel.isPending}
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                const form = document.querySelector('form[data-model-form]') as HTMLFormElement
                if (form) form.requestSubmit()
              }}
              disabled={createModel.isPending}
            >
              {createModel.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Model'
              )}
            </Button>
          </>
        }
      >
        <ModelForm onSubmit={handleCreateModel} isSubmitting={createModel.isPending} />
        {createModel.isError && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-800">
              Error: {(createModel.error as any)?.response?.data?.error || 'Failed to create model'}
            </p>
          </div>
        )}
      </Modal>

      {/* Edit Model Modal */}
      <Modal
        isOpen={!!editingModel}
        onClose={() => !updateModel.isPending && setEditingModel(null)}
        title={t('models.editModel')}
        size="lg"
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => setEditingModel(null)}
              disabled={updateModel.isPending}
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                const form = document.querySelector('form[data-model-form]') as HTMLFormElement
                if (form) form.requestSubmit()
              }}
              disabled={updateModel.isPending}
            >
              {updateModel.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Updating...
                </>
              ) : (
                'Update Model'
              )}
            </Button>
          </>
        }
      >
        {editingModel && (
          <>
            <ModelForm
              model={editingModel}
              onSubmit={handleUpdateModel}
              isSubmitting={updateModel.isPending}
            />
            {updateModel.isError && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm text-red-800">
                  Error: {(updateModel.error as any)?.response?.data?.error || 'Failed to update model'}
                </p>
              </div>
            )}
          </>
        )}
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!deletingModel}
        onClose={() => !deleteModel.isPending && setDeletingModel(null)}
        title={t('models.deleteModel')}
        size="md"
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => setDeletingModel(null)}
              disabled={deleteModel.isPending}
            >
              Cancel
            </Button>
            <Button
              onClick={handleDeleteModel}
              disabled={deleteModel.isPending}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleteModel.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete Model'
              )}
            </Button>
          </>
        }
      >
        {deletingModel && (
          <div className="space-y-4">
            <p className="text-sm text-gray-700">
              {t('models.deleteConfirm.message')}
            </p>
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="text-gray-600">{t('models.deleteConfirm.modelName')}:</div>
                <div className="font-medium text-gray-900">{deletingModel.modelName}</div>
                <div className="text-gray-600">{t('models.form.manufacturer')}:</div>
                <div className="font-medium text-gray-900">{deletingModel.manufacturer}</div>
                <div className="text-gray-600">{t('models.deleteConfirm.type')}:</div>
                <div className="font-medium text-gray-900">{deletingModel.modelType}</div>
              </div>
            </div>
            {deleteModel.isError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm text-red-800">
                  Error: {(deleteModel.error as any)?.response?.data?.error || 'Failed to delete model'}
                </p>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  )
}
