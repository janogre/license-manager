import React, { useState } from 'react'
import { Plus, Edit, Trash2, Power, Star, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Form'
import { 
  useContractTypes, 
  useCreateContractType, 
  useUpdateContractType, 
  useDeleteContractType, 
  useActivateContractType,
  useSetDefaultContractType 
} from '@/hooks/useContractTypes'
import type { ContractTypeManagement, CreateContractTypeInput } from '@/types'

interface ContractTypeFormData {
  name: string
  description: string
  isActive: boolean
  isDefault: boolean
}

export default function ContractTypesPage() {
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingType, setEditingType] = useState<ContractTypeManagement | null>(null)
  const [deletingType, setDeletingType] = useState<ContractTypeManagement | null>(null)
  const [showInactive, setShowInactive] = useState(false)

  // Fetch contract types
  const { data, isLoading, error } = useContractTypes({ 
    isActive: showInactive ? undefined : true 
  })

  // Mutations
  const createContractType = useCreateContractType()
  const updateContractType = useUpdateContractType()
  const deleteContractType = useDeleteContractType()
  const activateContractType = useActivateContractType()
  const setDefaultContractType = useSetDefaultContractType()

  const contractTypes = data?.contractTypes || []

  const handleCreateContractType = async (formData: ContractTypeFormData) => {
    try {
      const input: CreateContractTypeInput = {
        name: formData.name,
        description: formData.description || undefined,
        isActive: formData.isActive,
        isDefault: formData.isDefault
      }
      await createContractType.mutateAsync(input)
      setShowAddModal(false)
    } catch (err) {
      console.error('Failed to create contract type:', err)
    }
  }

  const handleUpdateContractType = async (formData: ContractTypeFormData) => {
    if (!editingType) return
    try {
      await updateContractType.mutateAsync({
        id: editingType.id,
        name: formData.name,
        description: formData.description || undefined,
        isActive: formData.isActive,
        isDefault: formData.isDefault
      })
      setEditingType(null)
    } catch (err) {
      console.error('Failed to update contract type:', err)
    }
  }

  const handleDeleteContractType = async () => {
    if (!deletingType) return
    try {
      await deleteContractType.mutateAsync(deletingType.id)
      setDeletingType(null)
    } catch (err) {
      console.error('Failed to delete contract type:', err)
    }
  }

  const handleActivateContractType = async (id: string) => {
    try {
      await activateContractType.mutateAsync(id)
    } catch (err) {
      console.error('Failed to activate contract type:', err)
    }
  }

  const handleSetDefault = async (id: string) => {
    try {
      await setDefaultContractType.mutateAsync(id)
    } catch (err) {
      console.error('Failed to set default contract type:', err)
    }
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
        <p className="text-red-800">Error loading contract types: {(error as any).message}</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Contract Types</h1>
          <p className="text-sm text-gray-600 mt-1">
            Manage maintenance contract types and categories
          </p>
        </div>
        <div className="flex gap-3">
          <Button
            variant="secondary"
            onClick={() => setShowInactive(!showInactive)}
          >
            {showInactive ? 'Show Active Only' : 'Show All'}
          </Button>
          <Button onClick={() => setShowAddModal(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Contract Type
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white shadow rounded-lg p-4">
          <div className="text-sm text-gray-600">Total Types</div>
          <div className="text-2xl font-bold text-gray-900 mt-1">
            {isLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : contractTypes.length}
          </div>
        </div>
        <div className="bg-white shadow rounded-lg p-4">
          <div className="text-sm text-gray-600">Active Types</div>
          <div className="text-2xl font-bold text-green-600 mt-1">
            {isLoading ? (
              <Loader2 className="h-6 w-6 animate-spin" />
            ) : (
              contractTypes.filter(type => type.isActive).length
            )}
          </div>
        </div>
        <div className="bg-white shadow rounded-lg p-4">
          <div className="text-sm text-gray-600">Default Type</div>
          <div className="text-lg font-bold text-blue-600 mt-1">
            {isLoading ? (
              <Loader2 className="h-6 w-6 animate-spin" />
            ) : (
              contractTypes.find(type => type.isDefault)?.name || 'None set'
            )}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Description
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Default
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {isLoading ? (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center">
                  <Loader2 className="h-8 w-8 animate-spin mx-auto text-gray-400" />
                  <p className="mt-2 text-sm text-gray-500">Loading contract types...</p>
                </td>
              </tr>
            ) : contractTypes.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                  No contract types found
                </td>
              </tr>
            ) : (
              contractTypes.map((contractType) => (
                <tr key={contractType.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="font-medium text-gray-900">{contractType.name}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">
                      {contractType.description || '-'}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {contractType.isActive ? (
                      <Badge variant="success">Active</Badge>
                    ) : (
                      <Badge variant="default">Inactive</Badge>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {contractType.isDefault ? (
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 text-yellow-500 fill-current" />
                        <span className="text-sm text-yellow-600">Default</span>
                      </div>
                    ) : contractType.isActive ? (
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handleSetDefault(contractType.id)}
                        disabled={setDefaultContractType.isPending}
                      >
                        Set Default
                      </Button>
                    ) : (
                      '-'
                    )}
                  </td>
                  <td className="px-6 py-4 text-right text-sm font-medium">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => setEditingType(contractType)}
                        className="text-blue-600 hover:text-blue-900"
                        title="Edit contract type"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      {!contractType.isActive ? (
                        <button
                          onClick={() => handleActivateContractType(contractType.id)}
                          className="text-green-600 hover:text-green-900"
                          title="Activate contract type"
                          disabled={activateContractType.isPending}
                        >
                          <Power className="h-4 w-4" />
                        </button>
                      ) : (
                        <button
                          onClick={() => setDeletingType(contractType)}
                          className="text-red-600 hover:text-red-900"
                          title="Deactivate contract type"
                          disabled={contractType.isDefault}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Add Contract Type Modal */}
      <ContractTypeModal
        isOpen={showAddModal}
        onClose={() => !createContractType.isPending && setShowAddModal(false)}
        onSubmit={handleCreateContractType}
        title="Add Contract Type"
        isSubmitting={createContractType.isPending}
        error={createContractType.error}
      />

      {/* Edit Contract Type Modal */}
      <ContractTypeModal
        isOpen={!!editingType}
        onClose={() => !updateContractType.isPending && setEditingType(null)}
        onSubmit={handleUpdateContractType}
        title="Edit Contract Type"
        initialData={editingType}
        isSubmitting={updateContractType.isPending}
        error={updateContractType.error}
      />

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!deletingType}
        onClose={() => !deleteContractType.isPending && setDeletingType(null)}
        title="Deactivate Contract Type"
        size="md"
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => setDeletingType(null)}
              disabled={deleteContractType.isPending}
            >
              Cancel
            </Button>
            <Button
              onClick={handleDeleteContractType}
              disabled={deleteContractType.isPending}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleteContractType.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deactivating...
                </>
              ) : (
                'Deactivate'
              )}
            </Button>
          </>
        }
      >
        {deletingType && (
          <div className="space-y-4">
            <p className="text-sm text-gray-700">
              Are you sure you want to deactivate this contract type? This will make it unavailable for new contracts but will not affect existing contracts.
            </p>
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="text-gray-600">Name:</div>
                <div className="font-medium text-gray-900">{deletingType.name}</div>
                {deletingType.description && (
                  <>
                    <div className="text-gray-600">Description:</div>
                    <div className="font-medium text-gray-900">{deletingType.description}</div>
                  </>
                )}
              </div>
            </div>
            {deleteContractType.isError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm text-red-800">
                  Error: {(deleteContractType.error as any)?.response?.data?.error || 'Failed to deactivate contract type'}
                </p>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  )
}

// Contract Type Form Modal Component
interface ContractTypeModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: ContractTypeFormData) => void
  title: string
  initialData?: ContractTypeManagement | null
  isSubmitting: boolean
  error?: any
}

function ContractTypeModal({
  isOpen,
  onClose,
  onSubmit,
  title,
  initialData,
  isSubmitting,
  error
}: ContractTypeModalProps) {
  const [formData, setFormData] = useState<ContractTypeFormData>({
    name: '',
    description: '',
    isActive: true,
    isDefault: false
  })

  // Reset form when modal opens/closes or initial data changes
  React.useEffect(() => {
    if (isOpen) {
      setFormData({
        name: initialData?.name || '',
        description: initialData?.description || '',
        isActive: initialData?.isActive ?? true,
        isDefault: initialData?.isDefault ?? false
      })
    }
  }, [isOpen, initialData])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(formData)
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => !isSubmitting && onClose()}
      title={title}
      size="md"
      footer={
        <>
          <Button
            variant="secondary"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || !formData.name.trim()}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                {initialData ? 'Updating...' : 'Creating...'}
              </>
            ) : (
              initialData ? 'Update' : 'Create'
            )}
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Name *
          </label>
          <Input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="e.g., Juniper Care"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Description
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Optional description of this contract type"
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>

        <div className="flex items-center gap-4">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={formData.isActive}
              onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
              className="mr-2"
            />
            <span className="text-sm text-gray-700">Active</span>
          </label>

          <label className="flex items-center">
            <input
              type="checkbox"
              checked={formData.isDefault}
              onChange={(e) => setFormData({ ...formData, isDefault: e.target.checked })}
              className="mr-2"
            />
            <span className="text-sm text-gray-700">Set as default</span>
          </label>
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-800">
              Error: {error?.response?.data?.error || 'Failed to save contract type'}
            </p>
          </div>
        )}
      </form>
    </Modal>
  )
}