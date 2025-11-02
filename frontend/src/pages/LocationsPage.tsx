import { useState } from 'react'
import { Plus, Edit, Trash2, Loader2, MapPin } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Card } from '@/components/ui/Card'
import { Modal } from '@/components/ui/Modal'
import { Input, Textarea } from '@/components/ui/Form'
import { useLocations, useCreateLocation, useUpdateLocation, useDeleteLocation } from '@/hooks/useLocations'
import type { Location } from '@/types'

export default function LocationsPage() {
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingLocation, setEditingLocation] = useState<Location | null>(null)
  const [deletingLocation, setDeletingLocation] = useState<Location | null>(null)

  // Fetch locations from API
  const { data, isLoading, error } = useLocations({ limit: 1000 })
  const locations = data?.locations || []

  // Mutations
  const createLocation = useCreateLocation()
  const updateLocation = useUpdateLocation()
  const deleteLocation = useDeleteLocation()

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    isActive: true,
  })

  const handleCreateLocation = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await createLocation.mutateAsync(formData)
      setShowAddModal(false)
      setFormData({ name: '', description: '', isActive: true })
    } catch (err) {
      console.error('Failed to create location:', err)
    }
  }

  const handleEditClick = (location: Location) => {
    setEditingLocation(location)
    setFormData({
      name: location.name,
      description: location.description || '',
      isActive: location.isActive,
    })
  }

  const handleUpdateLocation = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingLocation) return
    try {
      await updateLocation.mutateAsync({ id: editingLocation.id, ...formData })
      setEditingLocation(null)
      setFormData({ name: '', description: '', isActive: true })
    } catch (err) {
      console.error('Failed to update location:', err)
    }
  }

  const handleDeleteLocation = async () => {
    if (!deletingLocation) return
    try {
      await deleteLocation.mutateAsync(deletingLocation.id)
      setDeletingLocation(null)
    } catch (err) {
      console.error('Failed to delete location:', err)
    }
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
        <p className="text-red-800">Error loading locations: {(error as any).message}</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Locations</h1>
          <p className="text-sm text-gray-600 mt-1">
            Manage physical locations for hardware assets
          </p>
        </div>
        <Button onClick={() => setShowAddModal(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Location
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="bg-blue-100 p-3 rounded-lg">
              <MapPin className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <div className="text-sm text-gray-600">Total Locations</div>
              <div className="text-2xl font-bold text-gray-900">
                {isLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : locations.length}
              </div>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="bg-green-100 p-3 rounded-lg">
              <MapPin className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <div className="text-sm text-gray-600">Active</div>
              <div className="text-2xl font-bold text-green-600">
                {isLoading ? (
                  <Loader2 className="h-6 w-6 animate-spin" />
                ) : (
                  locations.filter((l) => l.isActive).length
                )}
              </div>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="bg-purple-100 p-3 rounded-lg">
              <MapPin className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <div className="text-sm text-gray-600">Total Assets</div>
              <div className="text-2xl font-bold text-gray-900">
                {isLoading ? (
                  <Loader2 className="h-6 w-6 animate-spin" />
                ) : (
                  locations.reduce((sum, l) => sum + (l._count?.assets || 0), 0)
                )}
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Locations Table */}
      <Card className="p-0">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gradient-to-r from-neas-pine to-primary-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                  Location Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                  Description
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                  Assets
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-white uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto text-gray-400" />
                    <p className="mt-2 text-sm text-gray-500">Loading locations...</p>
                  </td>
                </tr>
              ) : locations.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                    No locations found
                  </td>
                </tr>
              ) : (
                locations.map((location) => (
                  <tr key={location.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <MapPin className="h-5 w-5 text-gray-400 mr-2" />
                        <div className="font-medium text-gray-900">{location.name}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-500">{location.description || '-'}</div>
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant="info">{location._count?.assets || 0} assets</Badge>
                    </td>
                    <td className="px-6 py-4">
                      {location.isActive ? (
                        <Badge variant="success">Active</Badge>
                      ) : (
                        <Badge variant="default">Inactive</Badge>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleEditClick(location)}
                          className="text-blue-600 hover:text-blue-900"
                          title="Edit location"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => setDeletingLocation(location)}
                          className="text-red-600 hover:text-red-900"
                          title="Delete location"
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
      </Card>

      {/* Add Location Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => !createLocation.isPending && setShowAddModal(false)}
        title="Add New Location"
        size="md"
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => setShowAddModal(false)}
              disabled={createLocation.isPending}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateLocation}
              disabled={createLocation.isPending}
            >
              {createLocation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Location'
              )}
            </Button>
          </>
        }
      >
        <form onSubmit={handleCreateLocation} className="space-y-4">
          <Input
            label="Location Name"
            placeholder="e.g., Oslo DC1, Rack A-12"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />
          <Textarea
            label="Description (Optional)"
            rows={3}
            placeholder="Additional details about this location..."
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          />
        </form>
      </Modal>

      {/* Edit Location Modal */}
      <Modal
        isOpen={!!editingLocation}
        onClose={() => !updateLocation.isPending && setEditingLocation(null)}
        title="Edit Location"
        size="md"
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => setEditingLocation(null)}
              disabled={updateLocation.isPending}
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpdateLocation}
              disabled={updateLocation.isPending}
            >
              {updateLocation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Updating...
                </>
              ) : (
                'Update Location'
              )}
            </Button>
          </>
        }
      >
        {editingLocation && (
          <form onSubmit={handleUpdateLocation} className="space-y-4">
            <Input
              label="Location Name"
              placeholder="e.g., Oslo DC1, Rack A-12"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
            <Textarea
              label="Description (Optional)"
              rows={3}
              placeholder="Additional details about this location..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </form>
        )}
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!deletingLocation}
        onClose={() => !deleteLocation.isPending && setDeletingLocation(null)}
        title="Delete Location"
        size="md"
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => setDeletingLocation(null)}
              disabled={deleteLocation.isPending}
            >
              Cancel
            </Button>
            <Button
              onClick={handleDeleteLocation}
              disabled={deleteLocation.isPending}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleteLocation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete Location'
              )}
            </Button>
          </>
        }
      >
        {deletingLocation && (
          <div className="space-y-4">
            <p className="text-sm text-gray-700">
              Are you sure you want to delete this location?
              {(deletingLocation._count?.assets || 0) > 0 && (
                <span className="block mt-2 text-red-600 font-medium">
                  Warning: This location has {deletingLocation._count?.assets} assigned asset(s) and cannot be deleted.
                </span>
              )}
            </p>
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="text-gray-600">Location:</div>
                <div className="font-medium text-gray-900">{deletingLocation.name}</div>
                <div className="text-gray-600">Assets:</div>
                <div className="font-medium text-gray-900">{deletingLocation._count?.assets || 0}</div>
              </div>
            </div>
            {deleteLocation.isError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm text-red-800">
                  Error: {(deleteLocation.error as any)?.response?.data?.error || 'Failed to delete location'}
                </p>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  )
}
