import { useState } from 'react'
import { Building2, MapPin, Server, Eye } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { RackElevation } from '@/components/ui/RackElevation'
import { NetboxLocationPicker } from '@/components/ui/NetboxLocationPicker'
import {
  mockNetboxSites,
  mockNetboxLocations,
  mockNetboxRacks,
  mockRackElevations,
} from '@/utils/mockData'

export default function NetboxPage() {
  const [selectedRackForElevation, setSelectedRackForElevation] = useState<number | null>(null)
  const [showLocationPicker, setShowLocationPicker] = useState(false)
  const [selectedLocation, setSelectedLocation] = useState<any>({})

  const selectedElevation = mockRackElevations.find(
    (e) => e.id === selectedRackForElevation
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Netbox Integration</h1>
          <p className="text-sm text-gray-600 mt-1">
            Data Center Infrastructure Management (DCIM)
          </p>
        </div>
        <Button onClick={() => setShowLocationPicker(true)}>
          <MapPin className="h-4 w-4 mr-2" />
          Location Picker Demo
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="bg-blue-100 p-3 rounded-lg">
              <Building2 className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <div className="text-sm text-gray-600">Sites</div>
              <div className="text-2xl font-bold text-gray-900">
                {mockNetboxSites.length}
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
              <div className="text-sm text-gray-600">Locations</div>
              <div className="text-2xl font-bold text-gray-900">
                {mockNetboxLocations.length}
              </div>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="bg-purple-100 p-3 rounded-lg">
              <Server className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <div className="text-sm text-gray-600">Racks</div>
              <div className="text-2xl font-bold text-gray-900">
                {mockNetboxRacks.length}
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Sites */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Sites</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {mockNetboxSites.map((site) => (
            <div
              key={site.id}
              className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-blue-600" />
                  <h3 className="font-medium text-gray-900">{site.name}</h3>
                </div>
                <Badge variant="success">{site.status.label}</Badge>
              </div>
              {site.description && (
                <p className="text-sm text-gray-600 mb-3">{site.description}</p>
              )}
              <div className="flex items-center gap-4 text-sm text-gray-500">
                <div>
                  {mockNetboxLocations.filter((l) => l.site.id === site.id).length}{' '}
                  locations
                </div>
                <div>
                  {mockNetboxRacks.filter((r) => r.site.id === site.id).length} racks
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Racks with Visual Elevation */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Racks</h2>
          <div className="text-sm text-gray-600">
            Click "View Elevation" to see rack visualization
          </div>
        </div>
        <div className="space-y-3">
          {mockNetboxRacks.map((rack) => {
            const elevation = mockRackElevations.find((e) => e.id === rack.id)
            const occupiedUnits = elevation?.units.filter((u) => u.occupied).length || 0
            const utilizationPercent = Math.round((occupiedUnits / rack.u_height) * 100)

            return (
              <div
                key={rack.id}
                className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <Server className="h-5 w-5 text-purple-600" />
                    <div>
                      <div className="font-medium text-gray-900">{rack.name}</div>
                      <div className="text-sm text-gray-600">
                        {rack.site.name} → {rack.location?.name}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="text-sm text-gray-600">Capacity</div>
                      <div className="font-medium text-gray-900">{rack.u_height}U</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-gray-600">Occupied</div>
                      <div className="font-medium text-blue-600">{occupiedUnits}U</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-gray-600">Utilization</div>
                      <div className="font-medium text-gray-900">
                        {utilizationPercent}%
                      </div>
                    </div>
                    <Button
                      variant="secondary"
                      onClick={() => setSelectedRackForElevation(rack.id)}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      View Elevation
                    </Button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </Card>

      {/* Rack Elevation Modal */}
      <Modal
        isOpen={!!selectedRackForElevation}
        onClose={() => setSelectedRackForElevation(null)}
        title="Rack Elevation"
        size="xl"
      >
        {selectedElevation && (
          <RackElevation
            rackName={selectedElevation.name}
            height={selectedElevation.height}
            units={selectedElevation.units}
          />
        )}
      </Modal>

      {/* Location Picker Demo Modal */}
      <Modal
        isOpen={showLocationPicker}
        onClose={() => setShowLocationPicker(false)}
        title="Netbox Location Picker Demo"
        size="lg"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            This cascading location picker will be used when adding or editing assets.
            Select a site, location, rack, and position.
          </p>
          <NetboxLocationPicker
            onLocationChange={(location) => setSelectedLocation(location)}
          />
          {selectedLocation.siteName && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <h4 className="font-medium text-gray-900 mb-2">
                Location Data (for form submission):
              </h4>
              <pre className="text-xs text-gray-700">
                {JSON.stringify(selectedLocation, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </Modal>
    </div>
  )
}
