import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { Search, Plus, Download, Filter, Loader2, Edit, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Input, Select } from '@/components/ui/Form'
import { Modal } from '@/components/ui/Modal'
import { useAssets, useCreateAsset, useUpdateAsset, useDeleteAsset } from '@/hooks/useAssets'
import { useModels } from '@/hooks/useModels'
import AssetForm from '@/components/AssetForm'
import { format } from 'date-fns'
import type { AssetStatus, CreateAssetInput, HardwareAsset } from '@/types'

export default function AssetsPage() {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<AssetStatus | 'all'>('all')
  const [modelFilter, setModelFilter] = useState<string>('all')
  const [locationFilter, setLocationFilter] = useState('')
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingAsset, setEditingAsset] = useState<HardwareAsset | null>(null)
  const [deletingAsset, setDeletingAsset] = useState<HardwareAsset | null>(null)
  const [page, setPage] = useState(1)

  // Fetch models for the dropdown
  const { data: modelsData } = useModels({ limit: 100 })
  const models = modelsData?.models || []

  // Fetch assets from API
  const { data, isLoading, error } = useAssets({
    page,
    limit: 50,
    search: search || undefined,
    status: statusFilter !== 'all' ? statusFilter : undefined,
    modelId: modelFilter !== 'all' ? modelFilter : undefined,
    location: locationFilter || undefined,
  })

  // Mutations
  const createAsset = useCreateAsset()
  const updateAsset = useUpdateAsset()
  const deleteAsset = useDeleteAsset()

  const handleCreateAsset = async (formData: CreateAssetInput) => {
    try {
      await createAsset.mutateAsync(formData)
      setShowAddModal(false)
    } catch (err) {
      console.error('Failed to create asset:', err)
    }
  }

  const handleUpdateAsset = async (formData: CreateAssetInput) => {
    if (!editingAsset) return
    try {
      await updateAsset.mutateAsync({ id: editingAsset.id, ...formData })
      setEditingAsset(null)
    } catch (err) {
      console.error('Failed to update asset:', err)
    }
  }

  const handleDeleteAsset = async () => {
    if (!deletingAsset) return
    try {
      await deleteAsset.mutateAsync(deletingAsset.id)
      setDeletingAsset(null)
    } catch (err) {
      console.error('Failed to delete asset:', err)
    }
  }

  const assets = data?.assets || []
  const pagination = data?.pagination

  // Calculate stats from fetched data
  const stats = useMemo(() => {
    return {
      total: pagination?.total || 0,
      active: assets.filter((a) => a.status === 'ACTIVE').length,
      withoutContracts: assets.filter((a) => !a.contracts || a.contracts.length === 0).length,
      totalValue: assets.reduce((sum, a) => {
        // Convert Decimal string to number
        const price = typeof a.purchasePrice === 'string'
          ? parseFloat(a.purchasePrice)
          : (a.purchasePrice || 0)
        return sum + price
      }, 0),
    }
  }, [assets, pagination])

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return <Badge variant="success">Active</Badge>
      case 'SPARE':
        return <Badge variant="info">Spare</Badge>
      case 'DEFECT':
        return <Badge variant="danger">Defect</Badge>
      case 'RETIRED':
        return <Badge variant="default">Retired</Badge>
      default:
        return <Badge variant="default">{status}</Badge>
    }
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
        <p className="text-red-800">Error loading assets: {(error as any).message}</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Hardware Assets</h1>
          <p className="text-sm text-gray-600 mt-1">
            Manage your Juniper network equipment inventory
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="secondary" disabled>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button onClick={() => setShowAddModal(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Asset
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white shadow rounded-lg p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="lg:col-span-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by serial number, hostname, or asset tag..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>
          <Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            options={[
              { value: 'all', label: 'All Statuses' },
              { value: 'ACTIVE', label: 'Active' },
              { value: 'SPARE', label: 'Spare' },
              { value: 'DEFECT', label: 'Defect' },
              { value: 'RETIRED', label: 'Retired' },
            ]}
          />
          <Select
            value={modelFilter}
            onChange={(e) => setModelFilter(e.target.value)}
            options={[
              { value: 'all', label: 'All Models' },
              ...models.map(model => ({
                value: model.id,
                label: model.modelName
              }))
            ]}
          />
          <div className="relative">
            <input
              type="text"
              placeholder="Filter by location (e.g., Oslo DC1, Rack D-10)..."
              value={locationFilter}
              onChange={(e) => setLocationFilter(e.target.value)}
              className="pl-3 pr-4 py-2 w-full border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white shadow rounded-lg p-4">
          <div className="text-sm text-gray-600">Total Assets</div>
          <div className="text-2xl font-bold text-gray-900 mt-1">
            {isLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : stats.total}
          </div>
        </div>
        <div className="bg-white shadow rounded-lg p-4">
          <div className="text-sm text-gray-600">Active</div>
          <div className="text-2xl font-bold text-green-600 mt-1">
            {isLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : stats.active}
          </div>
        </div>
        <div className="bg-white shadow rounded-lg p-4">
          <div className="text-sm text-gray-600">Without Contracts</div>
          <div className="text-2xl font-bold text-red-600 mt-1">
            {isLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : stats.withoutContracts}
          </div>
        </div>
        <div className="bg-white shadow rounded-lg p-4">
          <div className="text-sm text-gray-600">Total Value</div>
          <div className="text-2xl font-bold text-gray-900 mt-1">
            {isLoading ? (
              <Loader2 className="h-6 w-6 animate-spin" />
            ) : (
              `${stats.totalValue.toLocaleString()} kr`
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
                Asset
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Model
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Location
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Coverage
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Purchase Date
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
                  <p className="mt-2 text-sm text-gray-500">Loading assets...</p>
                </td>
              </tr>
            ) : assets.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                  No assets found matching your criteria
                </td>
              </tr>
            ) : (
              assets.map((asset) => (
              <tr key={asset.id} className="hover:bg-gray-50">
                <td className="px-6 py-4">
                  <Link
                    to={`/assets/${asset.id}`}
                    className="text-primary-600 hover:text-primary-700 font-medium"
                  >
                    {asset.hostname || asset.serialNumber}
                  </Link>
                  <div className="text-sm text-gray-500">SN: {asset.serialNumber}</div>
                  {asset.assetTag && (
                    <div className="text-xs text-gray-400">{asset.assetTag}</div>
                  )}
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm text-gray-900">{asset.model?.modelName}</div>
                  <div className="text-xs text-gray-500">{asset.model?.modelType}</div>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm text-gray-900">{asset.location || '-'}</div>
                  {asset.rackPosition && (
                    <div className="text-xs text-gray-500">{asset.rackPosition}</div>
                  )}
                </td>
                <td className="px-6 py-4">{getStatusBadge(asset.status)}</td>
                <td className="px-6 py-4">
                  {asset.contracts?.length > 0 ? (
                    <div className="flex items-center gap-1">
                      <Badge variant="success">{asset.contracts.length} contract(s)</Badge>
                    </div>
                  ) : (
                    <Badge variant="danger">No coverage</Badge>
                  )}
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">
                  {asset.purchaseDate ? format(new Date(asset.purchaseDate), 'MMM d, yyyy') : '-'}
                </td>
                <td className="px-6 py-4 text-right text-sm font-medium">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => setEditingAsset(asset)}
                      className="text-blue-600 hover:text-blue-900"
                      title="Edit asset"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => setDeletingAsset(asset)}
                      className="text-red-600 hover:text-red-900"
                      title="Delete asset"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pagination && pagination.pages > 1 && (
        <div className="flex items-center justify-between bg-white px-4 py-3 rounded-lg shadow">
          <div className="text-sm text-gray-700">
            Showing <span className="font-medium">{(page - 1) * pagination.limit + 1}</span> to{' '}
            <span className="font-medium">
              {Math.min(page * pagination.limit, pagination.total)}
            </span>{' '}
            of <span className="font-medium">{pagination.total}</span> results
          </div>
          <div className="flex gap-2">
            <Button
              variant="secondary"
              onClick={() => setPage(page - 1)}
              disabled={page === 1}
            >
              Previous
            </Button>
            <Button
              variant="secondary"
              onClick={() => setPage(page + 1)}
              disabled={page === pagination.pages}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {/* Add Asset Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => !createAsset.isPending && setShowAddModal(false)}
        title="Add New Asset"
        size="lg"
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => setShowAddModal(false)}
              disabled={createAsset.isPending}
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                const form = document.querySelector('form[data-asset-form]') as HTMLFormElement
                if (form) form.requestSubmit()
              }}
              disabled={createAsset.isPending}
            >
              {createAsset.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Asset'
              )}
            </Button>
          </>
        }
      >
        <AssetForm onSubmit={handleCreateAsset} isSubmitting={createAsset.isPending} />
        {createAsset.isError && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-800">
              Error: {(createAsset.error as any)?.response?.data?.error || 'Failed to create asset'}
            </p>
          </div>
        )}
      </Modal>

      {/* Edit Asset Modal */}
      <Modal
        isOpen={!!editingAsset}
        onClose={() => !updateAsset.isPending && setEditingAsset(null)}
        title="Edit Asset"
        size="lg"
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => setEditingAsset(null)}
              disabled={updateAsset.isPending}
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                const form = document.querySelector('form[data-asset-form]') as HTMLFormElement
                if (form) form.requestSubmit()
              }}
              disabled={updateAsset.isPending}
            >
              {updateAsset.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Updating...
                </>
              ) : (
                'Update Asset'
              )}
            </Button>
          </>
        }
      >
        {editingAsset && (
          <>
            <AssetForm
              asset={editingAsset}
              onSubmit={handleUpdateAsset}
              isSubmitting={updateAsset.isPending}
            />
            {updateAsset.isError && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm text-red-800">
                  Error: {(updateAsset.error as any)?.response?.data?.error || 'Failed to update asset'}
                </p>
              </div>
            )}
          </>
        )}
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!deletingAsset}
        onClose={() => !deleteAsset.isPending && setDeletingAsset(null)}
        title="Delete Asset"
        size="md"
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => setDeletingAsset(null)}
              disabled={deleteAsset.isPending}
            >
              Cancel
            </Button>
            <Button
              onClick={handleDeleteAsset}
              disabled={deleteAsset.isPending}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleteAsset.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete Asset'
              )}
            </Button>
          </>
        }
      >
        {deletingAsset && (
          <div className="space-y-4">
            <p className="text-sm text-gray-700">
              Are you sure you want to delete this asset? This action cannot be undone.
            </p>
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="text-gray-600">Serial Number:</div>
                <div className="font-medium text-gray-900">{deletingAsset.serialNumber}</div>
                {deletingAsset.hostname && (
                  <>
                    <div className="text-gray-600">Hostname:</div>
                    <div className="font-medium text-gray-900">{deletingAsset.hostname}</div>
                  </>
                )}
                {deletingAsset.model && (
                  <>
                    <div className="text-gray-600">Model:</div>
                    <div className="font-medium text-gray-900">{deletingAsset.model.modelName}</div>
                  </>
                )}
              </div>
            </div>
            {deleteAsset.isError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm text-red-800">
                  Error: {(deleteAsset.error as any)?.response?.data?.error || 'Failed to delete asset'}
                </p>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  )
}
