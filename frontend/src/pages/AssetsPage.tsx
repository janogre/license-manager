import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Search, Plus, Download, Filter } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Input, Select } from '@/components/ui/Form'
import { Modal } from '@/components/ui/Modal'
import { mockAssets } from '@/utils/mockData'
import { format } from 'date-fns'

export default function AssetsPage() {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [showAddModal, setShowAddModal] = useState(false)

  const filteredAssets = mockAssets.filter((asset) => {
    const matchesSearch =
      asset.hostname?.toLowerCase().includes(search.toLowerCase()) ||
      asset.serialNumber.toLowerCase().includes(search.toLowerCase()) ||
      asset.assetTag?.toLowerCase().includes(search.toLowerCase())

    const matchesStatus = statusFilter === 'all' || asset.status === statusFilter

    return matchesSearch && matchesStatus
  })

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
          <Button variant="secondary">
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2">
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
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white shadow rounded-lg p-4">
          <div className="text-sm text-gray-600">Total Assets</div>
          <div className="text-2xl font-bold text-gray-900 mt-1">{mockAssets.length}</div>
        </div>
        <div className="bg-white shadow rounded-lg p-4">
          <div className="text-sm text-gray-600">Active</div>
          <div className="text-2xl font-bold text-green-600 mt-1">
            {mockAssets.filter((a) => a.status === 'ACTIVE').length}
          </div>
        </div>
        <div className="bg-white shadow rounded-lg p-4">
          <div className="text-sm text-gray-600">Without Contracts</div>
          <div className="text-2xl font-bold text-red-600 mt-1">
            {mockAssets.filter((a) => a.contracts.length === 0).length}
          </div>
        </div>
        <div className="bg-white shadow rounded-lg p-4">
          <div className="text-sm text-gray-600">Total Value</div>
          <div className="text-2xl font-bold text-gray-900 mt-1">
            ${mockAssets.reduce((sum, a) => sum + (a.purchasePrice || 0), 0).toLocaleString()}
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
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredAssets.map((asset) => (
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
              </tr>
            ))}
          </tbody>
        </table>

        {filteredAssets.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            No assets found matching your criteria
          </div>
        )}
      </div>

      {/* Add Asset Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Add New Asset"
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowAddModal(false)}>
              Cancel
            </Button>
            <Button onClick={() => setShowAddModal(false)}>Save Asset</Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input label="Serial Number" placeholder="JN1234567890" required />
            <Input label="Asset Tag" placeholder="ASSET-001" />
          </div>
          <Input label="Hostname" placeholder="mx240-core-01.oslo" />
          <Select
            label="Model"
            options={[
              { value: '', label: 'Select a model' },
              { value: 'm1', label: 'MX240' },
              { value: 'm2', label: 'EX4300-48T' },
              { value: 'm3', label: 'SRX345' },
            ]}
          />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Location" placeholder="Oslo DC1, Rack A-12" />
            <Input label="Rack Position" placeholder="U10-U12" />
          </div>
          <Select
            label="Status"
            options={[
              { value: 'ACTIVE', label: 'Active' },
              { value: 'SPARE', label: 'Spare' },
              { value: 'DEFECT', label: 'Defect' },
              { value: 'RETIRED', label: 'Retired' },
            ]}
          />
          <div className="grid grid-cols-2 gap-4">
            <Input type="date" label="Purchase Date" />
            <Input type="number" label="Purchase Price" placeholder="45000" />
          </div>
          <Input label="Owner/Department" placeholder="Network Operations" />
        </div>
      </Modal>
    </div>
  )
}
