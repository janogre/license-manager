import { useState, useEffect } from 'react'
import { Select } from './Form'
import { mockNetboxSites, mockNetboxLocations, mockNetboxRacks } from '@/utils/mockData'

interface NetboxLocationPickerProps {
  onLocationChange?: (location: {
    siteId?: number
    siteName?: string
    locationId?: number
    locationName?: string
    rackId?: number
    rackName?: string
    position?: string
  }) => void
  initialSiteId?: number
  initialLocationId?: number
  initialRackId?: number
  initialPosition?: string
}

export function NetboxLocationPicker({
  onLocationChange,
  initialSiteId,
  initialLocationId,
  initialRackId,
  initialPosition,
}: NetboxLocationPickerProps) {
  const [selectedSiteId, setSelectedSiteId] = useState<number | undefined>(initialSiteId)
  const [selectedLocationId, setSelectedLocationId] = useState<number | undefined>(initialLocationId)
  const [selectedRackId, setSelectedRackId] = useState<number | undefined>(initialRackId)
  const [selectedPosition, setSelectedPosition] = useState<string | undefined>(initialPosition)

  const [availableLocations, setAvailableLocations] = useState<any[]>([])
  const [availableRacks, setAvailableRacks] = useState<any[]>([])

  // Update available locations when site changes
  useEffect(() => {
    if (selectedSiteId) {
      const locations = mockNetboxLocations.filter(
        (loc) => loc.site.id === selectedSiteId
      )
      setAvailableLocations(locations)
    } else {
      setAvailableLocations([])
      setSelectedLocationId(undefined)
    }
  }, [selectedSiteId])

  // Update available racks when location changes
  useEffect(() => {
    if (selectedLocationId) {
      const racks = mockNetboxRacks.filter(
        (rack) => rack.location?.id === selectedLocationId
      )
      setAvailableRacks(racks)
    } else if (selectedSiteId) {
      // Show all racks in the site if no location is selected
      const racks = mockNetboxRacks.filter(
        (rack) => rack.site.id === selectedSiteId
      )
      setAvailableRacks(racks)
    } else {
      setAvailableRacks([])
      setSelectedRackId(undefined)
    }
  }, [selectedLocationId, selectedSiteId])

  // Notify parent of changes
  useEffect(() => {
    if (onLocationChange) {
      const site = mockNetboxSites.find((s) => s.id === selectedSiteId)
      const location = mockNetboxLocations.find((l) => l.id === selectedLocationId)
      const rack = mockNetboxRacks.find((r) => r.id === selectedRackId)

      onLocationChange({
        siteId: selectedSiteId,
        siteName: site?.name,
        locationId: selectedLocationId,
        locationName: location?.name,
        rackId: selectedRackId,
        rackName: rack?.name,
        position: selectedPosition,
      })
    }
  }, [selectedSiteId, selectedLocationId, selectedRackId, selectedPosition, onLocationChange])

  const handleSiteChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const siteId = e.target.value ? parseInt(e.target.value) : undefined
    setSelectedSiteId(siteId)
    setSelectedLocationId(undefined)
    setSelectedRackId(undefined)
    setSelectedPosition(undefined)
  }

  const handleLocationChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const locationId = e.target.value ? parseInt(e.target.value) : undefined
    setSelectedLocationId(locationId)
    setSelectedRackId(undefined)
    setSelectedPosition(undefined)
  }

  const handleRackChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const rackId = e.target.value ? parseInt(e.target.value) : undefined
    setSelectedRackId(rackId)
    setSelectedPosition(undefined)
  }

  const handlePositionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedPosition(e.target.value || undefined)
  }

  // Generate rack positions based on selected rack
  const getRackPositions = () => {
    if (!selectedRackId) return []
    const rack = mockNetboxRacks.find((r) => r.id === selectedRackId)
    if (!rack) return []

    const positions: string[] = []
    for (let i = 1; i <= rack.u_height; i++) {
      positions.push(`U${i}`)
    }
    return positions
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        {/* Site Selection */}
        <Select
          label="Site"
          value={selectedSiteId?.toString() || ''}
          onChange={handleSiteChange}
          options={[
            { value: '', label: 'Select site...' },
            ...mockNetboxSites.map((site) => ({
              value: site.id.toString(),
              label: site.name,
            })),
          ]}
          required
        />

        {/* Location Selection */}
        <Select
          label="Location"
          value={selectedLocationId?.toString() || ''}
          onChange={handleLocationChange}
          options={[
            { value: '', label: selectedSiteId ? 'Select location...' : 'Select site first' },
            ...availableLocations.map((location) => ({
              value: location.id.toString(),
              label: location.name,
            })),
          ]}
          disabled={!selectedSiteId}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Rack Selection */}
        <Select
          label="Rack"
          value={selectedRackId?.toString() || ''}
          onChange={handleRackChange}
          options={[
            { value: '', label: selectedSiteId ? 'Select rack...' : 'Select site first' },
            ...availableRacks.map((rack) => ({
              value: rack.id.toString(),
              label: rack.name,
            })),
          ]}
          disabled={!selectedSiteId}
        />

        {/* Rack Position Selection */}
        <Select
          label="Rack Position"
          value={selectedPosition || ''}
          onChange={handlePositionChange}
          options={[
            { value: '', label: selectedRackId ? 'Select position...' : 'Select rack first' },
            ...getRackPositions().map((pos) => ({
              value: pos,
              label: pos,
            })),
          ]}
          disabled={!selectedRackId}
        />
      </div>

      {/* Summary */}
      {selectedSiteId && (
        <div className="bg-blue-50 border border-blue-200 rounded p-3 text-sm">
          <div className="font-medium text-blue-900 mb-1">Selected Location:</div>
          <div className="text-blue-700">
            {mockNetboxSites.find((s) => s.id === selectedSiteId)?.name}
            {selectedLocationId &&
              ` → ${mockNetboxLocations.find((l) => l.id === selectedLocationId)?.name}`}
            {selectedRackId &&
              ` → ${mockNetboxRacks.find((r) => r.id === selectedRackId)?.name}`}
            {selectedPosition && ` → ${selectedPosition}`}
          </div>
        </div>
      )}
    </div>
  )
}
